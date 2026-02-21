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
  Building2,
  Briefcase,
  Users,
  Star,
  Plus,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import StarRating from '@/components/ui/StarRating';

export default function RestaurantDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const adminRestaurantId = urlParams.get('restaurant_id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', adminRestaurantId || user?.email],
    queryFn: async () => {
      if (adminRestaurantId) {
        return await base44.entities.Restaurant.filter({ id: adminRestaurantId }).then(r => r[0]);
      }
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email || !!adminRestaurantId
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['restaurantJobs', restaurant?.id],
    queryFn: () => base44.entities.JobPosting.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['restaurantApplications', restaurant?.id],
    queryFn: () => base44.entities.Application.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurantReviews', restaurant?.id],
    queryFn: () => base44.entities.Review.filter({ 
      reviewee_id: restaurant.id, 
      is_published: true 
    }, '-created_date'),
    enabled: !!restaurant?.id
  });

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Register Your Restaurant</h2>
            <p className="text-slate-600 mb-6">
              Create your restaurant profile to start posting jobs.
            </p>
            <Link to={createPageUrl('RestaurantOnboarding')}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'active');
  const pendingApps = applications.filter(a => a.status === 'pending');
  const activeApps = applications.filter(a => ['reviewing', 'interview', 'offered', 'accepted'].includes(a.status));

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
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
          {adminRestaurantId && user?.role === 'admin' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              🔐 Admin View: Viewing {restaurant?.name}'s dashboard
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{restaurant.name}</h1>
                <p className="text-slate-500">{restaurant.cuisine_type || 'Restaurant'} • {restaurant.city}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={createPageUrl('PostJob')}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Post a Job
                </Button>
              </Link>
              <Link to={createPageUrl('Analytics')}>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link to={createPageUrl('EditRestaurant')}>
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
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeJobs.length}</p>
                  <p className="text-sm text-slate-500">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingApps.length}</p>
                  <p className="text-sm text-slate-500">New Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{restaurant.total_hires || 0}</p>
                  <p className="text-sm text-slate-500">Total Hires</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {restaurant.average_rating?.toFixed(1) || '—'}
                  </p>
                  <p className="text-sm text-slate-500">Rating</p>
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
                  <span>Recent Applications</span>
                  <Link to={createPageUrl('ManageApplications')}>
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No applications yet</p>
                    <p className="text-sm text-slate-400">Post a job to start receiving applications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app) => (
                      <Link 
                        key={app.id} 
                        to={createPageUrl(`ApplicationDetails?id=${app.id}`)}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
                          <div className="flex items-center gap-3">
                            {app.worker_photo ? (
                              <img
                                src={app.worker_photo}
                                alt={app.worker_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                <span className="font-medium text-slate-500">
                                  {app.worker_name?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">{app.worker_name}</p>
                              <p className="text-sm text-slate-500">{app.job_title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[app.status]}>
                              {app.status}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {format(new Date(app.created_date), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Jobs */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Job Postings</span>
                  <Link to={createPageUrl('ManageJobs')}>
                    <Button variant="ghost" size="sm">Manage All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No jobs posted yet</p>
                    <Link to={createPageUrl('PostJob')}>
                      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Job
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map((job) => {
                      const jobApps = applications.filter(a => a.job_id === job.id);
                      return (
                        <Link 
                          key={job.id} 
                          to={createPageUrl(`ManageJobs?job=${job.id}`)}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">{job.title}</p>
                                <Badge 
                                  variant="secondary" 
                                  className={job.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                                >
                                  {job.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500">
                                ${job.hourly_rate_min}/hr • {job.employment_type}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-slate-900">{jobApps.length}</p>
                              <p className="text-xs text-slate-500">applicants</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('PostJob')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                </Link>
                <Link to={createPageUrl('BrowseWorkers')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Browse Workers
                  </Button>
                </Link>
                <Link to={createPageUrl(`RestaurantProfile?id=${restaurant.id}`)} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    View Public Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-4">
                    <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Reviews */}
            <Card className="border-slate-200 bg-amber-50/50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Pending Reviews</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Don't forget to review workers from completed jobs to keep the community fair!
                    </p>
                    <Link to={createPageUrl('PendingReviews')}>
                      <Button variant="link" className="text-amber-600 p-0 mt-2">
                        Write Reviews →
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}