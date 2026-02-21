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

  const { data: workerProfile, isLoading: workerLoading } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const isWorker = !!workerProfile;
  const isRestaurant = !!restaurant;

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['allApplications', restaurant?.id, workerProfile?.id],
    queryFn: () => {
      if (restaurant?.id) {
        return base44.entities.Application.filter({ restaurant_id: restaurant.id });
      } else if (workerProfile?.id) {
        return base44.entities.Application.filter({ worker_id: workerProfile.id });
      }
      return [];
    },
    enabled: !!(restaurant?.id || workerProfile?.id)
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['allJobs', restaurant?.id],
    queryFn: () => base44.entities.JobPosting.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews', restaurant?.id, workerProfile?.id],
    queryFn: () => {
      if (restaurant?.id) {
        return base44.entities.Review.filter({ 
          reviewee_id: restaurant.id,
          is_published: true
        });
      } else if (workerProfile?.id) {
        return base44.entities.Review.filter({ 
          reviewee_id: workerProfile.id,
          is_published: true
        });
      }
      return [];
    },
    enabled: !!(restaurant?.id || workerProfile?.id)
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['allInterviews', restaurant?.id, workerProfile?.id],
    queryFn: () => {
      if (restaurant?.id) {
        return base44.entities.Interview.filter({ restaurant_id: restaurant.id });
      } else if (workerProfile?.id) {
        return base44.entities.Interview.filter({ worker_id: workerProfile.id });
      }
      return [];
    },
    enabled: !!(restaurant?.id || workerProfile?.id)
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['allJobsForWorker'],
    queryFn: () => base44.entities.JobPosting.list(),
    enabled: isWorker
  });

  const { data: performanceNotes = [] } = useQuery({
    queryKey: ['performanceNotes', workerProfile?.id],
    queryFn: () => base44.entities.WorkerPerformanceNote.filter({ worker_id: workerProfile.id }),
    enabled: !!workerProfile?.id
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
    if (isRestaurant) {
      const totalApps = filteredApplications.length;
      const hiredApps = filteredApplications.filter(a => a.status === 'accepted' || a.status === 'completed').length;
      const interviewedApps = filteredApplications.filter(a => 
        a.status === 'interview' || a.status === 'offered' || a.status === 'accepted' || a.status === 'completed'
      ).length;
      const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;
      
      const completedJobs = applications.filter(a => a.status === 'completed').length;
      const acceptedJobs = applications.filter(a => a.status === 'accepted').length;
      const retentionRate = completedJobs > 0 ? ((completedJobs / (completedJobs + acceptedJobs)) * 100).toFixed(0) : 0;

      return {
        totalApplications: totalApps,
        interviewRate: totalApps > 0 ? ((interviewedApps / totalApps) * 100).toFixed(0) : 0,
        hireRate: interviewedApps > 0 ? ((hiredApps / interviewedApps) * 100).toFixed(0) : 0,
        avgRating,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        retentionRate
      };
    } else {
      // Worker metrics
      const totalApps = filteredApplications.length;
      const interviewedApps = filteredApplications.filter(a => 
        a.status === 'interview' || a.status === 'offered' || a.status === 'accepted' || a.status === 'completed'
      ).length;
      const hiredApps = filteredApplications.filter(a => a.status === 'accepted' || a.status === 'completed').length;
      const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;
      const avgPerformance = performanceNotes.length > 0
        ? (performanceNotes.reduce((sum, n) => sum + (n.performance_rating || 0), 0) / performanceNotes.length).toFixed(1)
        : 0;

      return {
        totalApplications: totalApps,
        interviewRate: totalApps > 0 ? ((interviewedApps / totalApps) * 100).toFixed(0) : 0,
        successRate: totalApps > 0 ? ((hiredApps / totalApps) * 100).toFixed(0) : 0,
        avgRating,
        completedJobs: applications.filter(a => a.status === 'completed').length,
        avgPerformance
      };
    }
  }, [filteredApplications, reviews, jobs, applications, isRestaurant, performanceNotes]);

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

  // Most Popular Jobs (Restaurant) or Job Types (Worker)
  const popularJobs = useMemo(() => {
    if (isRestaurant) {
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
    } else {
      // Worker: Popular job types applied to
      const jobTypeCounts = applications.reduce((acc, app) => {
        const jobType = app.job_title || 'Unknown';
        acc[jobType] = (acc[jobType] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(jobTypeCounts)
        .map(([type, count]) => ({
          title: type,
          applicationCount: count
        }))
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 5);
    }
  }, [applications, jobs, isRestaurant]);

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

  if (restaurantLoading || workerLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!restaurant && !workerProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Analytics Unavailable</h2>
            <p className="text-slate-600">Create a profile to view analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl(isRestaurant ? 'RestaurantDashboard' : 'WorkerDashboard'))}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
              <p className="text-slate-600">
                {isRestaurant ? 'Track your hiring performance' : 'Track your career performance'}
              </p>
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
              <div className="text-sm text-slate-600">
                {isRestaurant ? 'Applications Received' : 'Applications Sent'}
              </div>
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
              <div className="text-3xl font-bold text-slate-900">
                {isRestaurant ? metrics.hireRate : metrics.successRate}%
              </div>
              <div className="text-sm text-slate-600">
                {isRestaurant ? 'Hire Rate' : 'Success Rate'}
              </div>
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
              <div className="text-3xl font-bold text-slate-900">
                {isRestaurant ? metrics.activeJobs : metrics.completedJobs}
              </div>
              <div className="text-sm text-slate-600">
                {isRestaurant ? 'Active Jobs' : 'Jobs Completed'}
              </div>
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
                {isRestaurant ? 'Most Popular Job Postings' : 'Job Types Applied To'}
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
              <CardTitle className="text-lg">
                {isRestaurant ? 'Top Performing Jobs' : 'Most Applied Job Types'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularJobs.slice(0, 3).map((job, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{job.title}</p>
                      {isRestaurant && job.job_type && (
                        <p className="text-xs text-slate-500">{job.job_type}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{job.applicationCount} apps</Badge>
                  </div>
                ))}
                {popularJobs.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No data yet</p>
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
                {isRestaurant ? (
                  <>
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
                      <span className="text-slate-600 text-sm">Worker Retention</span>
                      <span className="font-semibold text-slate-900">{metrics.retentionRate}%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-sm">Jobs Completed</span>
                      <span className="font-semibold text-slate-900">{metrics.completedJobs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-sm">Avg Performance</span>
                      <span className="font-semibold text-slate-900">
                        {metrics.avgPerformance > 0 ? `${metrics.avgPerformance}/5` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-sm">Active Applications</span>
                      <span className="font-semibold text-slate-900">
                        {applications.filter(a => ['pending', 'reviewing', 'interview', 'offered'].includes(a.status)).length}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Interviews</span>
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
                      Based on {reviews.length} {isRestaurant ? 'worker' : 'employer'} reviews
                    </p>
                  </div>
                </div>
                {isWorker && metrics.avgPerformance > 0 && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {metrics.avgPerformance}/5 performance score
                      </p>
                      <p className="text-xs text-slate-600">
                        From {performanceNotes.length} employer evaluations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}