import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Invite User */}
        <Card className="mb-8 border-purple-200 bg-purple-50/30">
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
                  <Badge className={`mt-2 ${roleColors[selectedUser.role]}`}>
                    Current: {selectedUser.role}
                  </Badge>
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
                      Regular User
                    </Button>
                    <Button
                      variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => handleUpdateUserRole('admin')}
                      disabled={selectedUser.role === 'admin'}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                    <Button
                      variant={selectedUser.role === 'super_admin' ? 'default' : 'outline'}
                      className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleUpdateUserRole('super_admin')}
                      disabled={selectedUser.role === 'super_admin'}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Super Admin
                    </Button>
                  </div>
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