import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase,
  Clock,
  Star,
  FileText,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import StarRating from '@/components/ui/StarRating';
import JobCard from '@/components/common/JobCard';

export default function WorkerDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const adminWorkerId = urlParams.get('worker_id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['workerProfile', adminWorkerId || user?.email],
    queryFn: async () => {
      if (adminWorkerId) {
        return await base44.entities.WorkerProfile.filter({ id: adminWorkerId }).then(p => p[0]);
      }
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email || !!adminWorkerId
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', profile?.id],
    queryFn: () => base44.entities.Application.filter({ worker_id: profile.id }, '-created_date'),
    enabled: !!profile?.id
  });

  const { data: recommendedJobs = [] } = useQuery({
    queryKey: ['recommendedJobs', profile?.preferred_job_types],
    queryFn: () => base44.entities.JobPosting.filter({ status: 'active' }, '-created_date', 6),
    enabled: !!profile
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['workerReviews', profile?.id],
    queryFn: () => base44.entities.Review.filter({ 
      reviewee_id: profile.id, 
      is_published: true 
    }, '-created_date'),
    enabled: !!profile?.id
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Create Your Profile</h2>
            <p className="text-slate-600 mb-6">
              Set up your worker profile to start applying for jobs.
            </p>
            <Link to={createPageUrl('WorkerOnboarding')}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingApps = applications.filter(a => a.status === 'pending');
  const activeApps = applications.filter(a => ['reviewing', 'interview', 'offered'].includes(a.status));
  const completedApps = applications.filter(a => a.status === 'completed');

  const statusColors = {
    pending: 'bg-slate-100 text-slate-600',
    reviewing: 'bg-blue-100 text-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    offered: 'bg-emerald-100 text-emerald-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    withdrawn: 'bg-slate-100 text-slate-500',
    completed: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {adminWorkerId && (user?.role === 'admin' || user?.role === 'super_admin') && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              🔐 Admin View: Viewing {profile?.full_name}'s dashboard
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {profile.full_name?.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome back, {profile.full_name?.split(' ')[0]}!
                </h1>
                <p className="text-slate-500">{profile.headline || 'Hospitality Professional'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={createPageUrl('Jobs')}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Search className="w-4 h-4 mr-2" />
                  Find Jobs
                </Button>
              </Link>
              <Link to={createPageUrl('Analytics')}>
                <Button variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link to={createPageUrl('EmploymentVerification')}>
                <Button variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Employment
                </Button>
              </Link>
              <Link to={createPageUrl('EditWorkerProfile')}>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                  <p className="text-sm text-slate-500">Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{profile.jobs_completed || 0}</p>
                  <p className="text-sm text-slate-500">Jobs Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {profile.average_rating?.toFixed(1) || '—'}
                  </p>
                  <p className="text-sm text-slate-500">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{profile.total_reviews || 0}</p>
                  <p className="text-sm text-slate-500">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applications */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Applications</span>
                  <Link to={createPageUrl('MyApplications')}>
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active">
                  <TabsList className="mb-4">
                    <TabsTrigger value="active">Active ({activeApps.length + pendingApps.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedApps.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active">
                    {[...activeApps, ...pendingApps].length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No active applications</p>
                        <Link to={createPageUrl('Jobs')}>
                          <Button variant="link" className="text-emerald-600">
                            Browse available jobs →
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...activeApps, ...pendingApps].slice(0, 5).map((app) => (
                          <Link 
                            key={app.id} 
                            to={createPageUrl(`JobDetails?id=${app.job_id}`)}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
                              <div>
                                <p className="font-medium text-slate-900">{app.job_title}</p>
                                <p className="text-sm text-slate-500">{app.restaurant_name}</p>
                              </div>
                              <Badge className={statusColors[app.status]}>
                                {app.status}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="completed">
                    {completedApps.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No completed jobs yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completedApps.slice(0, 5).map((app) => (
                          <div 
                            key={app.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-200"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{app.job_title}</p>
                              <p className="text-sm text-slate-500">{app.restaurant_name}</p>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-slate-100 text-slate-600">Completed</Badge>
                              {app.completed_date && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {format(new Date(app.completed_date), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Recommended Jobs */}
            {recommendedJobs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Recommended for You</h2>
                  <Link to={createPageUrl('Jobs')}>
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedJobs.slice(0, 4).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Profile Strength</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Photo</span>
                    {profile.photo_url ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Experience</span>
                    {profile.experience?.length > 0 ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Skills</span>
                    {profile.skills?.length > 0 ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Availability</span>
                    {Object.values(profile.availability || {}).some(d => d?.available) ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Resume</span>
                    {profile.resume_url ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                </div>
                <Link to={createPageUrl('EditWorkerProfile')}>
                  <Button variant="outline" className="w-full mt-4">
                    Complete Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            {reviews.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">{review.reviewer_name}</span>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 line-clamp-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Availability Summary */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Your Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div
                      key={day}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                        profile.availability?.[day]?.available
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl('EditWorkerProfile')}>
                  <Button variant="link" className="text-emerald-600 p-0 mt-3">
                    Update availability →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}