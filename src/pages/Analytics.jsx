import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  TrendingUp,
  Users,
  Briefcase,
  Star,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('month'); // 'week' or 'month'

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['allApplications', restaurant?.id],
    queryFn: () => base44.entities.Application.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['allJobs', restaurant?.id],
    queryFn: () => base44.entities.JobPosting.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews', restaurant?.id],
    queryFn: () => base44.entities.Review.filter({ 
      reviewee_id: restaurant.id,
      is_published: true
    }),
    enabled: !!restaurant?.id
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['allInterviews', restaurant?.id],
    queryFn: () => base44.entities.Interview.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    if (timeRange === 'week') {
      return {
        start: startOfWeek(now),
        end: endOfWeek(now)
      };
    }
    return {
      start: startOfMonth(now),
      end: endOfMonth(now)
    };
  }, [timeRange]);

  // Filter data by time range
  const filteredApplications = useMemo(() => {
    return applications.filter(app => 
      isWithinInterval(new Date(app.created_date), dateRange)
    );
  }, [applications, dateRange]);

  // Key Metrics
  const metrics = useMemo(() => {
    const totalApps = filteredApplications.length;
    const hiredApps = filteredApplications.filter(a => a.status === 'accepted' || a.status === 'completed').length;
    const interviewedApps = filteredApplications.filter(a => 
      a.status === 'interview' || a.status === 'offered' || a.status === 'accepted' || a.status === 'completed'
    ).length;
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    return {
      totalApplications: totalApps,
      interviewRate: totalApps > 0 ? ((interviewedApps / totalApps) * 100).toFixed(0) : 0,
      hireRate: interviewedApps > 0 ? ((hiredApps / interviewedApps) * 100).toFixed(0) : 0,
      avgRating,
      activeJobs: jobs.filter(j => j.status === 'active').length
    };
  }, [filteredApplications, reviews, jobs]);

  // Application Status Breakdown
  const statusData = useMemo(() => {
    const statusCount = filteredApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  }, [filteredApplications]);

  // Applications Over Time
  const applicationsOverTime = useMemo(() => {
    const days = timeRange === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const count = applications.filter(app => 
        format(new Date(app.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length;
      
      data.push({
        date: format(date, timeRange === 'week' ? 'EEE' : 'MMM d'),
        applications: count
      });
    }
    
    return data;
  }, [applications, timeRange]);

  // Most Popular Jobs
  const popularJobs = useMemo(() => {
    const jobCounts = applications.reduce((acc, app) => {
      acc[app.job_id] = (acc[app.job_id] || 0) + 1;
      return acc;
    }, {});

    return jobs
      .map(job => ({
        ...job,
        applicationCount: jobCounts[job.id] || 0
      }))
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 5);
  }, [applications, jobs]);

  // Review Trends
  const reviewTrends = useMemo(() => {
    const months = 6;
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthReviews = reviews.filter(r => 
        isWithinInterval(new Date(r.created_date), { start: monthStart, end: monthEnd })
      );
      
      const avgRating = monthReviews.length > 0
        ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length
        : 0;
      
      data.push({
        month: format(monthDate, 'MMM'),
        rating: parseFloat(avgRating.toFixed(1)),
        count: monthReviews.length
      });
    }
    
    return data;
  }, [reviews]);

  if (restaurantLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl('RestaurantDashboard'))}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
              <p className="text-slate-600">Track your hiring performance</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={timeRange === 'week' ? 'default' : 'outline'}
              onClick={() => setTimeRange('week')}
              size="sm"
            >
              This Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'outline'}
              onClick={() => setTimeRange('month')}
              size="sm"
            >
              This Month
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{metrics.totalApplications}</div>
              <div className="text-sm text-slate-600">Applications</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{metrics.interviewRate}%</div>
              <div className="text-sm text-slate-600">Interview Rate</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{metrics.hireRate}%</div>
              <div className="text-sm text-slate-600">Hire Rate</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{metrics.avgRating}</div>
              <div className="text-sm text-slate-600">Avg Rating</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{metrics.activeJobs}</div>
              <div className="text-sm text-slate-600">Active Jobs</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Applications Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="applications" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Application Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Most Popular Job Postings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {popularJobs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No job data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={popularJobs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="title" 
                      stroke="#64748b" 
                      style={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="applicationCount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Review Trends (6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reviewTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 12 }} domain={[0, 5]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularJobs.slice(0, 3).map((job, idx) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.job_type}</p>
                    </div>
                    <Badge variant="secondary">{job.applicationCount} apps</Badge>
                  </div>
                ))}
                {popularJobs.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No jobs yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Total Reviews</span>
                  <span className="font-semibold text-slate-900">{reviews.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Total Jobs Posted</span>
                  <span className="font-semibold text-slate-900">{jobs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Total Hires</span>
                  <span className="font-semibold text-slate-900">
                    {applications.filter(a => a.status === 'accepted' || a.status === 'completed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Interviews Scheduled</span>
                  <span className="font-semibold text-slate-900">{interviews.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="text-lg">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {metrics.totalApplications} applications this {timeRange}
                    </p>
                    <p className="text-xs text-slate-600">
                      {metrics.interviewRate}% reached interview stage
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {metrics.avgRating} average rating
                    </p>
                    <p className="text-xs text-slate-600">
                      Based on {reviews.length} worker reviews
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}