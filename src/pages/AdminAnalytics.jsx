import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: () => base44.entities.JobPosting.list(),
    enabled: isAdmin
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['adminApplications'],
    queryFn: () => base44.entities.Application.list(),
    enabled: isAdmin
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['adminWorkers'],
    queryFn: () => base44.entities.WorkerProfile.list(),
    enabled: isAdmin
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['adminRestaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: isAdmin
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to access analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jobsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Job postings over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 29 - i));
    const count = jobs.filter(j => 
      new Date(j.created_date) >= date && 
      new Date(j.created_date) < new Date(date.getTime() + 86400000)
    ).length;
    return {
      date: format(date, 'MM/dd'),
      jobs: count
    };
  });

  // Applications over time (last 30 days)
  const applicationsOverTime = Array.from({ length: 30 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 29 - i));
    const count = applications.filter(a => 
      new Date(a.created_date) >= date && 
      new Date(a.created_date) < new Date(date.getTime() + 86400000)
    ).length;
    return {
      date: format(date, 'MM/dd'),
      applications: count
    };
  });

  // Job types distribution
  const jobTypeData = jobs.reduce((acc, job) => {
    acc[job.job_type] = (acc[job.job_type] || 0) + 1;
    return acc;
  }, {});
  const jobTypesChart = Object.entries(jobTypeData).map(([name, value]) => ({ name, value }));

  // Application status distribution
  const statusData = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});
  const statusChart = Object.entries(statusData).map(([name, value]) => ({ 
    name: name.replace(/_/g, ' '), 
    value 
  }));

  // Employment type distribution
  const employmentTypeData = jobs.reduce((acc, job) => {
    acc[job.employment_type] = (acc[job.employment_type] || 0) + 1;
    return acc;
  }, {});
  const employmentChart = Object.entries(employmentTypeData).map(([name, value]) => ({ 
    name, 
    value 
  }));

  // Average hourly rate
  const avgHourlyRate = jobs.length > 0
    ? (jobs.reduce((sum, j) => sum + (j.hourly_rate_min || 0), 0) / jobs.length).toFixed(2)
    : 0;

  // Conversion rate (applications to hires)
  const hiredApps = applications.filter(a => a.status === 'accepted').length;
  const conversionRate = applications.length > 0
    ? ((hiredApps / applications.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Platform Analytics</h1>
          <p className="text-slate-600">Insights and trends across the platform</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 text-emerald-600" />
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{jobs.length}</div>
              <div className="text-sm text-slate-600">Total Jobs Posted</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{applications.length}</div>
              <div className="text-sm text-slate-600">Total Applications</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">${avgHourlyRate}</div>
              <div className="text-sm text-slate-600">Avg Hourly Rate</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{conversionRate}%</div>
              <div className="text-sm text-slate-600">Hire Conversion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Job Postings Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Job Postings (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Applications Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Applications (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Job Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Job Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={jobTypesChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {jobTypesChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Application Status */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Employment Types */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employmentChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Active Restaurants</span>
                <span className="font-semibold text-slate-900">
                  {restaurants.filter(r => r.account_status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Active Workers</span>
                <span className="font-semibold text-slate-900">
                  {workers.filter(w => w.account_status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Jobs with Applications</span>
                <span className="font-semibold text-slate-900">
                  {new Set(applications.map(a => a.job_id)).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg Applications per Job</span>
                <span className="font-semibold text-slate-900">
                  {jobs.length > 0 ? (applications.length / jobs.length).toFixed(1) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Workers Hired</span>
                <span className="font-semibold text-slate-900">{hiredApps}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}