import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, ShieldAlert, Crown, Search, UserCheck, UserX, AlertTriangle, Loader2,
  Users, Building2, Briefcase, FileText, Star, AlertCircle, BarChart3, 
  Settings, Database, Ban, TrendingUp, MessageSquare, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function SuperAdminPanel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showDemoteDialog, setShowDemoteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [validationCode, setValidationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: allRestaurants = [] } = useQuery({
    queryKey: ['allRestaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: allWorkers = [] } = useQuery({
    queryKey: ['allWorkers'],
    queryFn: () => base44.entities.WorkerProfile.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['allJobs'],
    queryFn: () => base44.entities.JobPosting.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['allApplications'],
    queryFn: () => base44.entities.Application.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const { data: allDisputes = [] } = useQuery({
    queryKey: ['allDisputes'],
    queryFn: () => base44.entities.Dispute.list(),
    enabled: currentUser?.role === 'super_admin'
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      handleCloseDialogs();
    }
  });

  const handleCloseDialogs = () => {
    setShowPromoteDialog(false);
    setShowDemoteDialog(false);
    setSelectedUser(null);
    setValidationCode('');
    setGeneratedCode('');
  };

  const generateValidationCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
    return code;
  };

  const handlePromoteClick = (user) => {
    setSelectedUser(user);
    generateValidationCode();
    setShowPromoteDialog(true);
  };

  const handleDemoteClick = (user) => {
    setSelectedUser(user);
    generateValidationCode();
    setShowDemoteDialog(true);
  };

  const handlePromoteToAdmin = () => {
    if (validationCode === generatedCode) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        role: 'admin'
      });
    }
  };

  const handleDemoteToUser = () => {
    if (validationCode === generatedCode) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        role: 'user'
      });
    }
  };

  // Access control
  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">
              This area is restricted to Super Administrators only.
            </p>
            <p className="text-sm text-slate-500">
              If you believe you should have access, please contact the platform owner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const superAdmins = filteredUsers.filter(u => u.role === 'super_admin');
  const admins = filteredUsers.filter(u => u.role === 'admin');
  const regularUsers = filteredUsers.filter(u => u.role === 'user');

  const bannedRestaurants = allRestaurants.filter(r => r.account_status === 'banned');
  const bannedWorkers = allWorkers.filter(w => w.account_status === 'banned');
  const activeJobs = allJobs.filter(j => j.status === 'active');
  const pendingDisputes = allDisputes.filter(d => d.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-slate-900">Super Admin Control Panel</h1>
          </div>
          <p className="text-slate-600">Complete platform control and oversight</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="admin-management">Admin Management</TabsTrigger>
            <TabsTrigger value="platform-control">Platform Control</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Platform Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-slate-900">{allUsers.length}</p>
                    </div>
                    <Users className="w-12 h-12 text-slate-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Restaurants</p>
                      <p className="text-3xl font-bold text-emerald-600">{allRestaurants.length}</p>
                    </div>
                    <Building2 className="w-12 h-12 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Workers</p>
                      <p className="text-3xl font-bold text-blue-600">{allWorkers.length}</p>
                    </div>
                    <Briefcase className="w-12 h-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Active Jobs</p>
                      <p className="text-3xl font-bold text-purple-600">{activeJobs.length}</p>
                    </div>
                    <FileText className="w-12 h-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AdminUsers'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Manage Users</h3>
                        <p className="text-sm text-slate-600">{allUsers.length} total users</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AdminRestaurants'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Manage Restaurants</h3>
                        <p className="text-sm text-slate-600">{allRestaurants.length} restaurants</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AdminWorkers'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Manage Workers</h3>
                        <p className="text-sm text-slate-600">{allWorkers.length} workers</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AdminApplications'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Applications</h3>
                        <p className="text-sm text-slate-600">{allApplications.length} total</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AdminDisputes'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Disputes</h3>
                        <p className="text-sm text-slate-600">{pendingDisputes.length} pending</p>
                        {pendingDisputes.length > 0 && (
                          <Badge className="bg-red-500 text-white mt-1">Action needed</Badge>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AdminAnalytics'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Analytics</h3>
                        <p className="text-sm text-slate-600">Platform insights</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('ContentModeration'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Content Moderation</h3>
                        <p className="text-sm text-slate-600">Review flagged content</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AdminReviews'))}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Reviews</h3>
                        <p className="text-sm text-slate-600">Manage all reviews</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Critical Alerts */}
            {(bannedRestaurants.length > 0 || bannedWorkers.length > 0 || pendingDisputes.length > 0) && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertCircle className="w-5 h-5" />
                    Critical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bannedRestaurants.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-slate-900">
                          {bannedRestaurants.length} Banned Restaurant{bannedRestaurants.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl('AdminRestaurants'))}>
                        Review
                      </Button>
                    </div>
                  )}
                  {bannedWorkers.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-slate-900">
                          {bannedWorkers.length} Banned Worker{bannedWorkers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl('AdminWorkers'))}>
                        Review
                      </Button>
                    </div>
                  )}
                  {pendingDisputes.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-slate-900">
                          {pendingDisputes.length} Pending Dispute{pendingDisputes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl('AdminDisputes'))}>
                        Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Admin Management Tab */}
          <TabsContent value="admin-management" className="space-y-6">

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Super Admins</p>
                      <p className="text-3xl font-bold text-amber-600">{superAdmins.length}</p>
                    </div>
                    <Crown className="w-12 h-12 text-amber-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Administrators</p>
                      <p className="text-3xl font-bold text-emerald-600">{admins.length}</p>
                    </div>
                    <Shield className="w-12 h-12 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Regular Users</p>
                      <p className="text-3xl font-bold text-slate-600">{regularUsers.length}</p>
                    </div>
                    <UserCheck className="w-12 h-12 text-slate-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Super Admins */}
                {superAdmins.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      Super Administrators
                    </h2>
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {superAdmins.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                              <div>
                                <p className="font-semibold text-slate-900">{user.full_name || 'No Name'}</p>
                                <p className="text-sm text-slate-600">{user.email}</p>
                                <p className="text-xs text-slate-500">
                                  Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <Badge className="bg-amber-500 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                Super Admin
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Admins */}
                {admins.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      Administrators
                    </h2>
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {admins.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                              <div>
                                <p className="font-semibold text-slate-900">{user.full_name || 'No Name'}</p>
                                <p className="text-sm text-slate-600">{user.email}</p>
                                <p className="text-xs text-slate-500">
                                  Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDemoteClick(user)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Demote to User
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Regular Users */}
                {regularUsers.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-slate-500" />
                      Regular Users
                    </h2>
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {regularUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                              <div>
                                <p className="font-semibold text-slate-900">{user.full_name || 'No Name'}</p>
                                <p className="text-sm text-slate-600">{user.email}</p>
                                <p className="text-xs text-slate-500">
                                  Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePromoteClick(user)}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Promote to Admin
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Platform Control Tab */}
          <TabsContent value="platform-control" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform-Wide Controls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Data Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600 mb-4">
                      Direct access to all platform entities and data
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate(createPageUrl('AdminUsers'))}>
                        <Users className="w-4 h-4 mr-2" />
                        All Users ({allUsers.length})
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate(createPageUrl('AdminRestaurants'))}>
                        <Building2 className="w-4 h-4 mr-2" />
                        All Restaurants ({allRestaurants.length})
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate(createPageUrl('AdminWorkers'))}>
                        <Briefcase className="w-4 h-4 mr-2" />
                        All Workers ({allWorkers.length})
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate(createPageUrl('AdminApplications'))}>
                        <FileText className="w-4 h-4 mr-2" />
                        All Applications ({allApplications.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      Account Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600 mb-4">
                      Ban/unban accounts and manage restrictions
                    </p>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Banned Restaurants</span>
                        <Badge variant={bannedRestaurants.length > 0 ? "destructive" : "outline"}>
                          {bannedRestaurants.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Banned Workers</span>
                        <Badge variant={bannedWorkers.length > 0 ? "destructive" : "outline"}>
                          {bannedWorkers.length}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => navigate(createPageUrl('AdminRestaurants'))}>
                      Manage Bans
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Analytics & Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600 mb-4">
                      Platform performance and usage metrics
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => navigate(createPageUrl('AdminAnalytics'))}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics Dashboard
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      Support & Moderation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600 mb-4">
                      Handle disputes and content moderation
                    </p>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate(createPageUrl('AdminDisputes'))}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Disputes ({pendingDisputes.length} pending)
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate(createPageUrl('ContentModeration'))}>
                      <Shield className="w-4 h-4 mr-2" />
                      Content Moderation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900">{allUsers.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Total Restaurants</p>
                    <p className="text-2xl font-bold text-slate-900">{allRestaurants.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Total Workers</p>
                    <p className="text-2xl font-bold text-slate-900">{allWorkers.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Active Jobs</p>
                    <p className="text-2xl font-bold text-slate-900">{activeJobs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Promote Dialog */}
        <Dialog open={showPromoteDialog} onOpenChange={handleCloseDialogs}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Confirm Admin Promotion
              </DialogTitle>
              <DialogDescription>
                This action will grant administrative privileges to this user.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900 mb-2">Validation Required</p>
                  <p className="text-sm text-amber-700 mb-3">
                    Enter the following code to confirm promotion:
                  </p>
                  <p className="text-2xl font-mono font-bold text-amber-900 text-center py-2 bg-white rounded border border-amber-300">
                    {generatedCode}
                  </p>
                </div>

                <div className="space-y-2">
                  <Input
                    value={validationCode}
                    onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                    placeholder="Enter validation code"
                    className="text-center font-mono text-lg"
                    maxLength={6}
                  />
                </div>

                {validationCode && validationCode !== generatedCode && (
                  <p className="text-sm text-red-600 text-center">Validation code does not match</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialogs}>
                Cancel
              </Button>
              <Button
                onClick={handlePromoteToAdmin}
                disabled={validationCode !== generatedCode || updateUserMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Promoting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Confirm Promotion
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Demote Dialog */}
        <Dialog open={showDemoteDialog} onOpenChange={handleCloseDialogs}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Confirm Admin Demotion
              </DialogTitle>
              <DialogDescription>
                This action will remove administrative privileges from this user.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 mb-2">Validation Required</p>
                  <p className="text-sm text-red-700 mb-3">
                    Enter the following code to confirm demotion:
                  </p>
                  <p className="text-2xl font-mono font-bold text-red-900 text-center py-2 bg-white rounded border border-red-300">
                    {generatedCode}
                  </p>
                </div>

                <div className="space-y-2">
                  <Input
                    value={validationCode}
                    onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                    placeholder="Enter validation code"
                    className="text-center font-mono text-lg"
                    maxLength={6}
                  />
                </div>

                {validationCode && validationCode !== generatedCode && (
                  <p className="text-sm text-red-600 text-center">Validation code does not match</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialogs}>
                Cancel
              </Button>
              <Button
                onClick={handleDemoteToUser}
                disabled={validationCode !== generatedCode || updateUserMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Demoting...
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Confirm Demotion
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}