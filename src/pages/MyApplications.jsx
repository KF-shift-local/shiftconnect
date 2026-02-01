import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink,
  XCircle,
  CheckCircle,
  Loader2,
  Star,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', description: 'Waiting for restaurant review' },
  reviewing: { label: 'Reviewing', color: 'bg-blue-100 text-blue-700', description: 'Restaurant is reviewing your application' },
  interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700', description: 'You have an interview scheduled' },
  offered: { label: 'Offered', color: 'bg-emerald-100 text-emerald-700', description: 'You received a job offer!' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', description: 'Congratulations! You got the job' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', description: 'Application was not successful' },
  withdrawn: { label: 'Withdrawn', color: 'bg-slate-100 text-slate-500', description: 'You withdrew this application' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600', description: 'Job completed' }
};

export default function MyApplications() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [tab, setTab] = useState('active');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: profile } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['myApplications', profile?.id],
    queryFn: () => base44.entities.Application.filter({ worker_id: profile.id }, '-created_date'),
    enabled: !!profile?.id
  });

  const { data: existingReviews = [] } = useQuery({
    queryKey: ['myReviews', profile?.id],
    queryFn: () => base44.entities.Review.filter({ reviewer_id: profile.id }),
    enabled: !!profile?.id
  });

  const withdrawMutation = useMutation({
    mutationFn: async (appId) => {
      return base44.entities.Application.update(appId, { status: 'withdrawn' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myApplications']);
      setSelectedApp(null);
    }
  });

  const activeApps = applications.filter(a => 
    ['pending', 'reviewing', 'interview', 'offered', 'accepted'].includes(a.status)
  );
  const pastApps = applications.filter(a => 
    ['declined', 'withdrawn', 'completed'].includes(a.status)
  );

  const hasReviewedApp = (appId) => {
    return existingReviews.some(r => r.application_id === appId);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          to={createPageUrl('WorkerDashboard')}
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Applications</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active ({activeApps.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastApps.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeApps.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No active applications</h3>
                  <p className="text-slate-600 mb-4">Start applying to jobs to see them here</p>
                  <Link to={createPageUrl('Jobs')}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Browse Jobs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeApps.map((app) => (
                  <ApplicationCard 
                    key={app.id} 
                    app={app}
                    onManage={() => setSelectedApp(app)}
                    canReview={false}
                    hasReviewed={hasReviewedApp(app.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastApps.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No past applications</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastApps.map((app) => (
                  <ApplicationCard 
                    key={app.id} 
                    app={app}
                    onManage={() => setSelectedApp(app)}
                    canReview={app.status === 'completed'}
                    hasReviewed={hasReviewedApp(app.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedApp.job_title}</h3>
                  <p className="text-slate-600">{selectedApp.restaurant_name}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Status</span>
                    <Badge className={STATUS_CONFIG[selectedApp.status]?.color}>
                      {STATUS_CONFIG[selectedApp.status]?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    {STATUS_CONFIG[selectedApp.status]?.description}
                  </p>
                </div>

                {selectedApp.cover_message && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Your Message</p>
                    <p className="text-sm text-slate-600">{selectedApp.cover_message}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link to={createPageUrl(`JobDetails?id=${selectedApp.job_id}`)} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Job
                    </Button>
                  </Link>
                  {['pending', 'reviewing'].includes(selectedApp.status) && (
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => withdrawMutation.mutate(selectedApp.id)}
                      disabled={withdrawMutation.isPending}
                    >
                      {withdrawMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Withdraw
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ApplicationCard({ app, onManage, canReview, hasReviewed }) {
  const statusConfig = STATUS_CONFIG[app.status];

  return (
    <Card className="border-slate-200 hover:border-emerald-200 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{app.job_title}</h3>
              <p className="text-slate-600">{app.restaurant_name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Applied {format(new Date(app.created_date), 'MMM d')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={statusConfig?.color}>
              {statusConfig?.label}
            </Badge>
            {canReview && !hasReviewed && (
              <Link to={createPageUrl(`WriteReview?applicationId=${app.id}&type=worker`)}>
                <Button size="sm" variant="outline" className="border-amber-200 text-amber-600">
                  <Star className="w-4 h-4 mr-1" />
                  Review
                </Button>
              </Link>
            )}
            {canReview && hasReviewed && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Reviewed
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={onManage}>
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}