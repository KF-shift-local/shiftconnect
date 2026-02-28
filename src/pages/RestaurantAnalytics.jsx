import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, TrendingUp, Briefcase, Users, Star,
  BarChart2, Loader2, Award, Target, DollarSign
} from 'lucide-react';
import { format, subMonths, startOfMonth, parseISO, isAfter } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RestaurantAnalytics() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['myRestaurant', user?.email],
    queryFn: async () => {
      const results = await base44.entities.Restaurant.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: myJobs = [] } = useQuery({
    queryKey: ['analyticsMyJobs', restaurant?.id],
    queryFn: () => base44.entities.JobPosting.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ['analyticsMyApps', restaurant?.id],
    queryFn: () => base44.entities.Application.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['analyticsMyReviews', restaurant?.id],
    queryFn: () => base44.entities.Review.filter({ reviewee_id: restaurant.id, is_published: true }),
    enabled: !!restaurant?.id
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['analyticsAllJobs'],
    queryFn: () => base44.entities.JobPosting.list('-created_date', 200),
    enabled: !!restaurant?.id
  });

  // --- Derived Metrics ---
  const stats = useMemo(() => {
    const totalJobs = myJobs.length;
    const activeJobs = myJobs.filter(j => j.status === 'active').length;
    const totalApps = myApplications.length;
    const hiredApps = myApplications.filter(a => ['accepted', 'completed'].includes(a.status)).length;
    const hireRate = totalApps > 0 ? ((hiredApps / totalApps) * 100).toFixed(1) : 0;
    const avgRating = myReviews.length > 0
      ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
      : 'N/A';
    return { totalJobs, activeJobs, totalApps, hiredApps, hireRate, avgRating };
  }, [myJobs, myApplications, myReviews]);

  // --- Applications Over Time (last 6 months) ---
  const appsOverTime = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, 'MMM'), start: startOfMonth(d) };
    });
    return months.map(({ month, start }) => {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const count = myApplications.filter(a => {
        const d = parseISO(a.created_date);
        return isAfter(d, start) && !isAfter(d, end);
      }).length;
      return { month, Applications: count };
    });
  }, [myApplications]);

  // --- Applications by Job Type ---
  const appsByJobType = useMemo(() => {
    const map = {};
    myApplications.forEach(app => {
      const job = myJobs.find(j => j.id === app.job_id);
      const type = job?.job_type || 'Unknown';
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [myApplications, myJobs]);

  // --- Application Status Breakdown ---
  const appStatusData = useMemo(() => {
    const map = {};
    myApplications.forEach(a => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [myApplications]);

  // --- Rating Trend (last 6 months) ---
  const ratingTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, 'MMM'), start: startOfMonth(d) };
    });
    return months.map(({ month, start }) => {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const periodReviews = myReviews.filter(r => {
        const d = r.published_date ? parseISO(r.published_date) : null;
        return d && isAfter(d, start) && !isAfter(d, end);
      });
      const avg = periodReviews.length > 0
        ? parseFloat((periodReviews.reduce((s, r) => s + r.rating, 0) / periodReviews.length).toFixed(2))
        : null;
      return { month, Rating: avg };
    }).filter(d => d.Rating !== null);
  }, [myReviews]);

  // --- Job Performance per Posting ---
  const jobPerformance = useMemo(() => {
    return myJobs.map(job => {
      const apps = myApplications.filter(a => a.job_id === job.id);
      const hired = apps.filter(a => ['accepted', 'completed'].includes(a.status)).length;
      return {
        title: job.title.length > 18 ? job.title.slice(0, 18) + '…' : job.title,
        Applications: apps.length,
        Hired: hired,
      };
    }).sort((a, b) => b.Applications - a.Applications).slice(0, 8);
  }, [myJobs, myApplications]);

  // --- Competitor Analysis ---
  const competitorData = useMemo(() => {
    const jobTypes = [...new Set(myJobs.map(j => j.job_type).filter(Boolean))];
    return jobTypes.slice(0, 6).map(type => {
      const myJobsOfType = myJobs.filter(j => j.job_type === type && j.hourly_rate_max);
      const marketJobsOfType = allJobs.filter(j => j.job_type === type && j.hourly_rate_max && j.restaurant_id !== restaurant?.id);
      const myAvg = myJobsOfType.length > 0
        ? parseFloat((myJobsOfType.reduce((s, j) => s + j.hourly_rate_max, 0) / myJobsOfType.length).toFixed(2))
        : 0;
      const marketAvg = marketJobsOfType.length > 0
        ? parseFloat((marketJobsOfType.reduce((s, j) => s + j.hourly_rate_max, 0) / marketJobsOfType.length).toFixed(2))
        : 0;
      return { type, 'Your Rate': myAvg, 'Market Avg': marketAvg };
    }).filter(d => d['Your Rate'] > 0 || d['Market Avg'] > 0);
  }, [myJobs, allJobs, restaurant]);

  // --- Market Share by Job Type ---
  const marketShare = useMemo(() => {
    const jobTypes = [...new Set(myJobs.map(j => j.job_type).filter(Boolean))];
    return jobTypes.slice(0, 5).map(type => {
      const totalInMarket = allJobs.filter(j => j.job_type === type).length;
      const myCount = myJobs.filter(j => j.job_type === type).length;
      const share = totalInMarket > 0 ? ((myCount / totalInMarket) * 100).toFixed(1) : 0;
      return { type, share: parseFloat(share), total: totalInMarket };
    });
  }, [myJobs, allJobs]);

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No restaurant profile found.</p>
          <Button onClick={() => navigate(createPageUrl('RestaurantOnboarding'))}>Create Restaurant</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(createPageUrl('RestaurantDashboard'))} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Restaurant Analytics</h1>
            <p className="text-slate-500">{restaurant.name} · Data insights & performance</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Job Posts" value={stats.totalJobs} subtitle={`${stats.activeJobs} active`} icon={Briefcase} color="emerald" />
          <StatCard title="Total Applications" value={stats.totalApps} subtitle={`${stats.hiredApps} hired`} icon={Users} color="blue" />
          <StatCard title="Hire Rate" value={`${stats.hireRate}%`} subtitle="Applications → Hired" icon={Target} color="amber" />
          <StatCard title="Avg Rating" value={stats.avgRating} subtitle={`${myReviews.length} reviews`} icon={Star} color="purple" />
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
          </TabsList>

          {/* JOB PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Applications Over Time
                  </CardTitle>
                  <CardDescription>Last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={appsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Applications" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    Applications per Job Post
                  </CardTitle>
                  <CardDescription>Top performing postings</CardDescription>
                </CardHeader>
                <CardContent>
                  {jobPerformance.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No job data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={jobPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Applications" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Hired" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Job Status Table */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Job Posting Details</CardTitle>
              </CardHeader>
              <CardContent>
                {myJobs.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No job postings yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-500">
                          <th className="pb-3 font-medium">Job Title</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium text-center">Applications</th>
                          <th className="pb-3 font-medium text-center">Hired</th>
                          <th className="pb-3 font-medium text-center">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {myJobs.map(job => {
                          const apps = myApplications.filter(a => a.job_id === job.id);
                          const hired = apps.filter(a => ['accepted', 'completed'].includes(a.status)).length;
                          const rate = apps.length > 0 ? Math.round((hired / apps.length) * 100) : 0;
                          return (
                            <tr key={job.id} className="hover:bg-slate-50">
                              <td className="py-3 font-medium text-slate-900">{job.title}</td>
                              <td className="py-3 text-slate-500">{job.job_type}</td>
                              <td className="py-3">
                                <Badge className={job.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                                  {job.status}
                                </Badge>
                              </td>
                              <td className="py-3 text-center font-semibold">{apps.length}</td>
                              <td className="py-3 text-center font-semibold text-emerald-600">{hired}</td>
                              <td className="py-3 text-center">
                                <span className={rate >= 50 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>{rate}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* APPLICANTS TAB */}
          <TabsContent value="applicants" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Applications by Role
                  </CardTitle>
                  <CardDescription>Distribution of job types applied to</CardDescription>
                </CardHeader>
                <CardContent>
                  {appsByJobType.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No applications yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={appsByJobType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {appsByJobType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    Application Status Breakdown
                  </CardTitle>
                  <CardDescription>Current pipeline status</CardDescription>
                </CardHeader>
                <CardContent>
                  {appStatusData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={appStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                          {appStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Funnel Summary */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Hiring Funnel</CardTitle>
                <CardDescription>How applicants move through your pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Applications Received', key: null, color: 'bg-blue-500' },
                    { label: 'Reviewing', key: 'reviewing', color: 'bg-indigo-500' },
                    { label: 'Interviewing', key: 'interview', color: 'bg-amber-500' },
                    { label: 'Offered', key: 'offered', color: 'bg-orange-500' },
                    { label: 'Hired', key: null, isHired: true, color: 'bg-emerald-500' },
                  ].map(({ label, key, isHired, color }) => {
                    const count = isHired
                      ? myApplications.filter(a => ['accepted', 'completed'].includes(a.status)).length
                      : key ? myApplications.filter(a => a.status === key).length
                      : myApplications.length;
                    const pct = myApplications.length > 0 ? (count / myApplications.length) * 100 : 0;
                    return (
                      <div key={label} className="flex items-center gap-4">
                        <span className="w-36 text-sm text-slate-600 shrink-0">{label}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-sm font-semibold text-slate-700 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RATINGS TAB */}
          <TabsContent value="ratings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Rating Trend
                  </CardTitle>
                  <CardDescription>Average rating over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {ratingTrend.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Not enough review data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={ratingTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Rating" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    Rating Category Breakdown
                  </CardTitle>
                  <CardDescription>Average scores per category</CardDescription>
                </CardHeader>
                <CardContent>
                  {myReviews.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No reviews yet</div>
                  ) : (() => {
                    const cats = ['punctuality', 'communication', 'professionalism', 'skills'];
                    const catData = cats.map(cat => {
                      const vals = myReviews.map(r => r.categories?.[cat]).filter(v => v != null);
                      const avg = vals.length > 0 ? parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
                      return { category: cat.charAt(0).toUpperCase() + cat.slice(1), avg };
                    }).filter(d => d.avg > 0);
                    return (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={catData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="avg" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Recent Reviews */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {myReviews.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No published reviews yet</p>
                ) : (
                  <div className="space-y-3">
                    {myReviews.slice(0, 5).map(review => (
                      <div key={review.id} className="p-4 rounded-lg border border-slate-100 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">{review.reviewer_name || 'Anonymous Worker'}</span>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-slate-500">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MARKET TAB */}
          <TabsContent value="market" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Pay Rate vs. Market
                  </CardTitle>
                  <CardDescription>Your max hourly rates compared to market average</CardDescription>
                </CardHeader>
                <CardContent>
                  {competitorData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">Not enough market data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={competitorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="$" />
                        <Tooltip formatter={(v) => `$${v}/hr`} />
                        <Legend />
                        <Bar dataKey="Your Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Market Avg" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    Your Market Share
                  </CardTitle>
                  <CardDescription>% of open roles you're posting vs. total market</CardDescription>
                </CardHeader>
                <CardContent>
                  {marketShare.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {marketShare.map(({ type, share, total }) => (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 font-medium">{type}</span>
                            <span className="text-slate-500">{share}% <span className="text-xs">of {total} listings</span></span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(share, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Market Overview */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Market Context</CardTitle>
                <CardDescription>How your restaurant compares to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Your Active Jobs', value: myJobs.filter(j => j.status === 'active').length, sub: 'current listings' },
                    { label: 'Total Market Jobs', value: allJobs.filter(j => j.status === 'active').length, sub: 'platform-wide' },
                    { label: 'Your Avg Pay', value: (() => {
                      const v = myJobs.filter(j => j.hourly_rate_max);
                      return v.length > 0 ? `$${(v.reduce((s, j) => s + j.hourly_rate_max, 0) / v.length).toFixed(0)}/hr` : 'N/A';
                    })(), sub: 'max rate posted' },
                    { label: 'Market Avg Pay', value: (() => {
                      const v = allJobs.filter(j => j.hourly_rate_max);
                      return v.length > 0 ? `$${(v.reduce((s, j) => s + j.hourly_rate_max, 0) / v.length).toFixed(0)}/hr` : 'N/A';
                    })(), sub: 'max rate market' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-2xl font-bold text-slate-900">{value}</p>
                      <p className="text-xs font-medium text-slate-700 mt-1">{label}</p>
                      <p className="text-xs text-slate-400">{sub}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}