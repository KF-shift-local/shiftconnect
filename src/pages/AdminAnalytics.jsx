import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, Briefcase, Building2, CheckCircle,
  Loader2, AlertCircle, FileText, ShieldCheck
} from 'lucide-react';
import { format, subDays, startOfDay, subMonths, startOfMonth } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    teal: 'bg-teal-100 text-teal-600',
  };
  return (
    <Card>
      <CardContent className="p-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

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

  const { data: verifications = [] } = useQuery({
    queryKey: ['adminVerifications'],
    queryFn: () => base44.entities.RestaurantVerificationRequest.list(),
    enabled: isAdmin
  });

  if (userLoading || (isAdmin && jobsLoading)) {
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

  // --- User Growth (workers + restaurants) over last 6 months ---
  const userGrowthData = Array.from({ length: 6 }, (_, i) => {
    const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
    const monthEnd = startOfMonth(subMonths(new Date(), 4 - i));
    const newWorkers = workers.filter(w => {
      const d = new Date(w.created_date);
      return d >= monthStart && d < monthEnd;
    }).length;
    const newRestaurants = restaurants.filter(r => {
      const d = new Date(r.created_date);
      return d >= monthStart && d < monthEnd;
    }).length;
    return {
      month: format(monthStart, 'MMM yy'),
      workers: newWorkers,
      restaurants: newRestaurants,
    };
  });

  // --- Active Job Postings over last 30 days ---
  const activeJobsOverTime = Array.from({ length: 30 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 29 - i));
    const nextDay = new Date(day.getTime() + 86400000);
    const count = jobs.filter(j => {
      const created = new Date(j.created_date);
      return created <= nextDay && (j.status === 'active' || created >= day);
    }).length;
    const activeCount = jobs.filter(j => {
      const created = new Date(j.created_date);
      return created <= nextDay && j.status === 'active';
    }).length;
    return {
      date: format(day, 'MM/dd'),
      active: activeCount,
    };
  });

  // --- Applications received over last 30 days ---
  const applicationsOverTime = Array.from({ length: 30 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 29 - i));
    const nextDay = new Date(day.getTime() + 86400000);
    const count = applications.filter(a => {
      const d = new Date(a.created_date);
      return d >= day && d < nextDay;
    }).length;
    return { date: format(day, 'MM/dd'), applications: count };
  });

  // --- Restaurant verification rates ---
  const verifiedCount = restaurants.filter(r => r.verified).length;
  const unverifiedCount = restaurants.length - verifiedCount;
  const verificationRate = restaurants.length > 0
    ? ((verifiedCount / restaurants.length) * 100).toFixed(1)
    : 0;

  const verificationStatusData = [
    { name: 'Verified', value: verifiedCount },
    { name: 'Unverified', value: unverifiedCount },
  ];

  const verificationRequestsData = [
    { name: 'Pending', value: verifications.filter(v => v.status === 'pending').length },
    { name: 'Approved', value: verifications.filter(v => v.status === 'approved').length },
    { name: 'Rejected', value: verifications.filter(v => v.status === 'rejected').length },
  ];

  // --- Application status breakdown ---
  const statusData = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});
  const statusChart = Object.entries(statusData).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  // --- KPIs ---
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const hiredApps = applications.filter(a => a.status === 'accepted').length;
  const conversionRate = applications.length > 0
    ? ((hiredApps / applications.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Platform Analytics</h1>
          <p className="text-slate-500">Key metrics and trends across ShiftLocal</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Workers" value={workers.length} sub={`${workers.filter(w => w.account_status === 'active').length} active`} color="blue" />
          <StatCard icon={Briefcase} label="Active Job Postings" value={activeJobs} sub={`${jobs.length} total`} color="emerald" />
          <StatCard icon={FileText} label="Applications Received" value={applications.length} sub={`${hiredApps} accepted`} color="amber" />
          <StatCard icon={ShieldCheck} label="Verified Restaurants" value={`${verificationRate}%`} sub={`${verifiedCount} of ${restaurants.length}`} color="purple" />
        </div>

        {/* User Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                User Growth (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="workerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="restGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="workers" name="New Workers" stroke="#3b82f6" fill="url(#workerGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="restaurants" name="New Restaurants" stroke="#10b981" fill="url(#restGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Job Postings Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                Active Job Postings (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={activeJobsOverTime}>
                  <defs>
                    <linearGradient id="jobGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="active" name="Active Jobs" stroke="#10b981" fill="url(#jobGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Applications Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                Applications Received (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={applicationsOverTime}>
                  <defs>
                    <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" name="Applications" stroke="#f59e0b" fill="url(#appGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Application Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Application Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Applications" radius={[0, 4, 4, 0]}>
                    {statusChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Verification Section */}
        <div className="mb-2">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Restaurant Verification
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Verified vs Unverified Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={verificationStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2 text-sm">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Verified</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-200 inline-block" />Unverified</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification Requests Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={verificationRequestsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Requests" radius={[4, 4, 0, 0]}>
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {[
                { label: 'Total Restaurants', value: restaurants.length },
                { label: 'Verified Restaurants', value: verifiedCount },
                { label: 'Verification Rate', value: `${verificationRate}%` },
                { label: 'Pending Verification Requests', value: verifications.filter(v => v.status === 'pending').length },
                { label: 'Banned Accounts', value: [...restaurants.filter(r => r.account_status === 'banned'), ...workers.filter(w => w.account_status === 'banned')].length },
                { label: 'Hire Conversion Rate', value: `${conversionRate}%` },
                { label: 'Avg Apps per Job', value: jobs.length > 0 ? (applications.length / jobs.length).toFixed(1) : 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}