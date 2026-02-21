import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['adminRestaurants'],
    queryFn: () => base44.entities.Restaurant.list()
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['adminWorkers'],
    queryFn: () => base44.entities.WorkerProfile.list()
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: () => base44.entities.JobPosting.list()
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['adminApplications'],
    queryFn: () => base44.entities.Application.list()
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => base44.entities.Review.list()
  });

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'active');
  const pendingApplications = applications.filter(a => a.status === 'pending');
  const publishedReviews = reviews.filter(r => r.is_published);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Platform-wide management and analytics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{allUsers.length}</div>
              <div className="text-sm text-slate-600">Total Users</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{restaurants.length}</div>
              <div className="text-sm text-slate-600">Restaurants</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{workers.length}</div>
              <div className="text-sm text-slate-600">Worker Profiles</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{activeJobs.length}</div>
              <div className="text-sm text-slate-600">Active Jobs</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl('AdminUsers')}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link to={createPageUrl('AdminRestaurants')}>
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="w-4 h-4 mr-2" />
                  Manage Restaurants
                </Button>
              </Link>
              <Link to={createPageUrl('AdminWorkers')}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Workers
                </Button>
              </Link>
              <Link to={createPageUrl('AdminApplications')}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View Applications
                </Button>
              </Link>
              <Link to={createPageUrl('AdminReviews')}>
                <Button variant="outline" className="w-full justify-start">
                  <Star className="w-4 h-4 mr-2" />
                  Moderate Reviews
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-600">{applications.length} total applications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-600">{pendingApplications.length} pending review</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-600">{publishedReviews.length} published reviews</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span className="text-slate-600">{jobs.length} total jobs posted</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>System Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Admin Users</span>
                  <span className="font-semibold text-slate-900">
                    {allUsers.filter(u => u.role === 'admin').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Regular Users</span>
                  <span className="font-semibold text-slate-900">
                    {allUsers.filter(u => u.role === 'user').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Verified Restaurants</span>
                  <span className="font-semibold text-slate-900">
                    {restaurants.filter(r => r.verified).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Avg Worker Rating</span>
                  <span className="font-semibold text-slate-900">
                    {workers.length > 0 
                      ? (workers.reduce((sum, w) => sum + (w.average_rating || 0), 0) / workers.length).toFixed(1)
                      : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Recent User Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allUsers.slice(0, 10).map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">{u.full_name || u.email}</p>
                    <p className="text-sm text-slate-500">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">{u.role}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(u.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}