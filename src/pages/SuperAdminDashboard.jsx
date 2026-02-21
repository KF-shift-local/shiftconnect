import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlatformHealthMonitor from '@/components/superadmin/PlatformHealthMonitor';
import SystemAlertManager from '@/components/superadmin/SystemAlertManager';
import { 
  Shield,
  Users,
  Building2,
  Briefcase,
  FileText,
  AlertTriangle,
  Crown,
  Settings,
  UserCog,
  Loader2,
  Search,
  Mail,
  Ban,
  CheckCircle,
  TrendingUp,
  Activity,
  BarChart3,
  Database,
  MapPin,
  Target
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');

  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['allRestaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['allWorkers'],
    queryFn: () => base44.entities.WorkerProfile.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['allJobs'],
    queryFn: () => base44.entities.JobPosting.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['allApplications'],
    queryFn: () => base44.entities.Application.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['allDisputes'],
    queryFn: () => base44.entities.Dispute.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: () => base44.entities.Notification.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: systemLogs = [] } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => base44.entities.SystemLog.list('-created_date', 100),
    enabled: currentUser?.role === 'super_admin'
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowUserDialog(false);
      setSelectedUser(null);
    }
  });



  const inviteUserMutation = useMutation({
    mutationFn: ({ email, role }) => base44.users.inviteUser(email, role),
    onSuccess: () => {
      setInviteEmail('');
      setInviteRole('user');
    }
  });

  const handleUpdateUserRole = (newRole) => {
    if (selectedUser) {
      updateUserRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };



  const handleInviteUser = () => {
    if (inviteEmail) {
      inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Analytics calculations
  const analytics = useMemo(() => {
    // User growth over last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM d'),
        users: allUsers.filter(u => new Date(u.created_date) <= date).length
      };
    });

    // Application status distribution
    const applicationStats = [
      { name: 'Pending', value: applications.filter(a => a.status === 'pending').length },
      { name: 'Reviewing', value: applications.filter(a => a.status === 'reviewing').length },
      { name: 'Interview', value: applications.filter(a => a.status === 'interview').length },
      { name: 'Offered', value: applications.filter(a => a.status === 'offered').length },
      { name: 'Accepted', value: applications.filter(a => a.status === 'accepted').length },
      { name: 'Completed', value: applications.filter(a => a.status === 'completed').length }
    ].filter(s => s.value > 0);

    // Job type distribution
    const jobTypeStats = jobs.reduce((acc, job) => {
      acc[job.job_type] = (acc[job.job_type] || 0) + 1;
      return acc;
    }, {});

    const jobTypeData = Object.entries(jobTypeStats).map(([name, value]) => ({ name, value }));

    // Recent activity (last 7 days)
    const last7Days = subDays(new Date(), 7);
    const recentActivity = {
      newUsers: allUsers.filter(u => new Date(u.created_date) >= last7Days).length,
      newJobs: jobs.filter(j => new Date(j.created_date) >= last7Days).length,
      newApplications: applications.filter(a => new Date(a.created_date) >= last7Days).length,
      newRestaurants: restaurants.filter(r => new Date(r.created_date) >= last7Days).length
    };

    // Platform health metrics
    const healthMetrics = {
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalApplications: applications.length,
      averageRating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : 'N/A',
      pendingDisputes: disputes.filter(d => d.status === 'pending' || d.status === 'investigating').length,
      bannedUsers: [...workers, ...restaurants].filter(u => u.account_status === 'banned').length
    };

    // Top cities by activity
    const cityStats = {};
    [...jobs, ...workers].forEach(item => {
      if (item.city) {
        cityStats[item.city] = (cityStats[item.city] || 0) + 1;
      }
    });
    const topCities = Object.entries(cityStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      userGrowth: last30Days,
      applicationStats,
      jobTypeData,
      recentActivity,
      healthMetrics,
      topCities
    };
  }, [allUsers, applications, jobs, reviews, disputes, workers, restaurants]);

  if (loadingCurrentUser || loadingUsers) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You must be a Super Admin to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleColors = {
    user: 'bg-slate-100 text-slate-800',
    admin: 'bg-emerald-100 text-emerald-800',
    super_admin: 'bg-purple-100 text-purple-800'
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900">Super Admin Control Panel</h1>
          </div>
          <p className="text-slate-600">Complete platform management and user control</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

            {/* Platform Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-slate-900">{allUsers.length}</span>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <Badge className={roleColors.super_admin}>
                  {allUsers.filter(u => u.role === 'super_admin').length} Super
                </Badge>
                <Badge className={roleColors.admin}>
                  {allUsers.filter(u => u.role === 'admin').length} Admin
                </Badge>
                <Badge className={roleColors.user}>
                  {allUsers.filter(u => u.role === 'user').length} Users
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-emerald-600" />
                <span className="text-3xl font-bold text-slate-900">{restaurants.length}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {restaurants.filter(r => r.verified).length} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Workers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <UserCog className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-slate-900">{workers.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-amber-600" />
                <span className="text-3xl font-bold text-slate-900">{jobs.length}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {jobs.filter(j => j.status === 'active').length} active
              </p>
            </CardContent>
          </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{analytics.recentActivity.newUsers}</p>
                    <p className="text-xs text-slate-600">New Users</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <Building2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{analytics.recentActivity.newRestaurants}</p>
                    <p className="text-xs text-slate-600">New Restaurants</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <Briefcase className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{analytics.recentActivity.newJobs}</p>
                    <p className="text-xs text-slate-600">New Jobs</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{analytics.recentActivity.newApplications}</p>
                    <p className="text-xs text-slate-600">New Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invite User */}
            <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              Invite New User
            </CardTitle>
            <CardDescription>Invite users with specific roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInviteUser}
                disabled={!inviteEmail || inviteUserMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {inviteUserMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Invite'
                )}
              </Button>
            </div>
          </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  User Growth (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Application Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Application Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.applicationStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.applicationStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Job Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Job Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.jobTypeData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Cities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Top Cities by Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCities.map((city, idx) => (
                    <div key={city.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{city.name}</p>
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(city.value / analytics.topCities[0].value) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-600">{city.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Management */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage all platform users and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>

            {/* Users List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{user.full_name || 'No name'}</p>
                      <Badge className={roleColors[user.role]}>
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="text-xs text-slate-400">
                      Joined {new Date(user.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserDialog(true);
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <PlatformHealthMonitor 
              systemLogs={systemLogs}
              applications={applications}
              jobs={jobs}
            />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <SystemAlertManager />
          </TabsContent>

          <TabsContent value="legacy-health" className="space-y-6">
            {/* Platform Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Active Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-green-600" />
                    <span className="text-3xl font-bold text-slate-900">{analytics.healthMetrics.activeJobs}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Currently accepting applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <span className="text-3xl font-bold text-slate-900">{analytics.healthMetrics.totalApplications}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">All-time applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-amber-600" />
                    <span className="text-3xl font-bold text-slate-900">{analytics.healthMetrics.averageRating}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Platform-wide rating</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Pending Disputes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-8 h-8 ${analytics.healthMetrics.pendingDisputes > 0 ? 'text-red-600' : 'text-green-600'}`} />
                    <span className="text-3xl font-bold text-slate-900">{analytics.healthMetrics.pendingDisputes}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Require attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Banned Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Ban className="w-8 h-8 text-red-600" />
                    <span className="text-3xl font-bold text-slate-900">{analytics.healthMetrics.bannedUsers}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Workers & Restaurants</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                    <span className="text-3xl font-bold text-slate-900">{reviews.length}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Platform feedback</p>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-slate-900">Database</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-slate-900">Authentication</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-slate-900">Notifications</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>



        {/* User Management Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User</DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={roleColors[selectedUser.role]}>
                      {selectedUser.role === 'super_admin' ? 'Super Admin' : selectedUser.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                    <Label>Change User Role</Label>
                    <div className="space-y-2">
                      <Button
                        variant={selectedUser.role === 'user' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => handleUpdateUserRole('user')}
                        disabled={selectedUser.role === 'user'}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Demote to Regular User
                      </Button>
                      <Button
                        variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => handleUpdateUserRole('admin')}
                        disabled={selectedUser.role === 'admin'}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {selectedUser.role === 'super_admin' ? 'Demote to Admin' : 'Promote to Admin'}
                      </Button>
                      <Button
                        variant={selectedUser.role === 'super_admin' ? 'default' : 'outline'}
                        className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleUpdateUserRole('super_admin')}
                        disabled={selectedUser.role === 'super_admin'}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Promote to Super Admin
                      </Button>
                    </div>
                  </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-slate-600 text-center p-2 bg-slate-50 rounded">
                    Note: Users cannot be banned from this panel. Ban workers or restaurants from their respective management pages.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}