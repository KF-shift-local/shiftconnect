import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Calendar,
  Star,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import StarRating from '@/components/ui/StarRating';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  { value: 'offered', label: 'Offered', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700' },
  { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', color: 'bg-slate-100 text-slate-600' }
];

export default function ManageApplications() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['restaurantApplications', restaurant?.id],
    queryFn: () => base44.entities.Application.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['restaurantJobs', restaurant?.id],
    queryFn: () => base44.entities.JobPosting.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: workerProfiles = [] } = useQuery({
    queryKey: ['workerProfiles', applications],
    queryFn: async () => {
      const workerIds = [...new Set(applications.map(a => a.worker_id))];
      if (workerIds.length === 0) return [];
      const profiles = await Promise.all(
        workerIds.map(id => base44.entities.WorkerProfile.filter({ id }))
      );
      return profiles.flat();
    },
    enabled: applications.length > 0
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const updateData = { status };
      if (notes) updateData.restaurant_notes = notes;
      if (status === 'accepted') updateData.hired_date = new Date().toISOString().split('T')[0];
      if (status === 'completed') updateData.completed_date = new Date().toISOString().split('T')[0];
      
      const app = applications.find(a => a.id === id);
      
      // Create notification for worker
      if (app) {
        const statusMessages = {
          reviewing: `Your application for ${app.job_title} is being reviewed`,
          interview: `Interview scheduled for ${app.job_title} at ${app.restaurant_name}`,
          offered: `Congratulations! You've been offered the ${app.job_title} position`,
          accepted: `You've been hired for ${app.job_title}! 🎉`,
          declined: `Update on your application for ${app.job_title}`,
          completed: `Please review your experience at ${app.restaurant_name}`
        };
        
        if (statusMessages[status]) {
          await base44.entities.Notification.create({
            recipient_email: app.created_by,
            recipient_type: 'worker',
            title: 'Application Status Update',
            message: statusMessages[status],
            type: 'application_update',
            link_url: `/MyApplications`,
            priority: ['offered', 'accepted'].includes(status) ? 'high' : 'medium',
            related_entity_id: id
          });
        }
      }
      
      return base44.entities.Application.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurantApplications']);
      setSelectedApp(null);
    }
  });

  const getWorkerProfile = (workerId) => {
    return workerProfiles.find(p => p.id === workerId);
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (jobFilter !== 'all' && app.job_id !== jobFilter) return false;
    return true;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offered: applications.filter(a => a.status === 'offered').length,
    accepted: applications.filter(a => a.status === 'accepted').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link 
          to={createPageUrl('RestaurantDashboard')}
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Applications</h1>
            <p className="text-slate-600">{applications.length} total applications</p>
          </div>
          <div className="flex gap-3">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="reviewing">Reviewing ({statusCounts.reviewing})</TabsTrigger>
            <TabsTrigger value="interview">Interview ({statusCounts.interview})</TabsTrigger>
            <TabsTrigger value="offered">Offered ({statusCounts.offered})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({statusCounts.accepted})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications found</h3>
              <p className="text-slate-600">
                {statusFilter !== 'all' 
                  ? 'Try changing your filters'
                  : 'Applications will appear here when workers apply to your jobs'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const worker = getWorkerProfile(app.worker_id);
              const statusConfig = STATUS_OPTIONS.find(s => s.value === app.status);
              
              return (
                <Card key={app.id} className="border-slate-200 hover:border-emerald-200 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {app.worker_photo ? (
                          <img
                            src={app.worker_photo}
                            alt={app.worker_name}
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                            <span className="text-xl font-bold text-emerald-600">
                              {app.worker_name?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900">{app.worker_name}</h3>
                            {worker?.average_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <StarRating rating={worker.average_rating} size="sm" />
                                <span className="text-xs text-slate-500">
                                  ({worker.total_reviews})
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">Applied for: {app.job_title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(app.created_date), 'MMM d, yyyy')}
                            </span>
                            {app.available_start_date && (
                              <span>Can start: {format(new Date(app.available_start_date), 'MMM d')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={statusConfig?.color}>
                          {statusConfig?.label}
                        </Badge>
                        <Link to={createPageUrl(`WorkerProfile?id=${app.worker_id}`)}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Manage
                        </Button>
                      </div>
                    </div>

                    {app.cover_message && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">{app.cover_message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Application Detail Modal */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Application</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  {selectedApp.worker_photo ? (
                    <img
                      src={selectedApp.worker_photo}
                      alt={selectedApp.worker_name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-600">
                        {selectedApp.worker_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedApp.worker_name}</h3>
                    <p className="text-sm text-slate-500">{selectedApp.job_title}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Update Status
                  </label>
                  <Select
                    value={selectedApp.status}
                    onValueChange={(status) => {
                      updateStatusMutation.mutate({ id: selectedApp.id, status });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: 'declined' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: 'accepted' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept & Hire
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}