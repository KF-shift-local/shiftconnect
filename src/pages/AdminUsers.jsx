import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Users, Mail, Calendar, Loader2, Ban, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: () => base44.entities.User.list('-created_date')
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => 
      base44.entities.User.update(userId, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAllUsers']);
      toast.success('User role updated');
    },
    onError: () => {
      toast.error('Failed to update user role');
    }
  });

  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => base44.entities.User.update(userId, { 
      account_status: 'banned',
      ban_reason: reason,
      banned_by: user.email,
      banned_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAllUsers']);
      setShowBanDialog(false);
      setSelectedUser(null);
      setBanReason('');
      toast.success('User banned successfully');
    },
    onError: () => {
      toast.error('Failed to ban user');
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: ({ userId }) => base44.entities.User.update(userId, { 
      account_status: 'active',
      ban_reason: null,
      banned_by: null,
      banned_date: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAllUsers']);
      toast.success('User unbanned successfully');
    },
    onError: () => {
      toast.error('Failed to unban user');
    }
  });

  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    navigate(createPageUrl('Home'));
    return null;
  }

  const handleBanUser = () => {
    if (selectedUser && banReason.trim()) {
      banUserMutation.mutate({ userId: selectedUser.id, reason: banReason });
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !searchQuery || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(createPageUrl('AdminDashboard'))}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Users</h1>
            <p className="text-slate-600">View and manage all platform users</p>
          </div>
        </div>

        <Card className="border-slate-200 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Users ({filteredUsers.length})</span>
              <Badge variant="secondary">{allUsers.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="font-semibold text-emerald-700">
                            {u.full_name ? u.full_name.charAt(0) : u.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.full_name || 'No name'}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-13">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(u.created_date), 'MMM d, yyyy')}
                        </div>
                        {u.preferred_city && (
                          <span className="text-xs text-slate-500">📍 {u.preferred_city}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {u.account_status === 'banned' ? (
                        <>
                          <Badge className="bg-red-100 text-red-800">Banned</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unbanUserMutation.mutate({ userId: u.id })}
                            disabled={unbanUserMutation.isPending}
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            Unban
                          </Button>
                        </>
                      ) : (
                        <>
                          {u.role !== 'super_admin' && u.role !== 'admin' && (
                            <>
                              <Select
                                value={u.role}
                                onValueChange={(newRole) => updateRoleMutation.mutate({ userId: u.id, newRole })}
                                disabled={u.id === user?.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowBanDialog(true);
                                }}
                                disabled={u.id === user?.id}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {(u.role === 'admin' || u.role === 'super_admin') && (
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="bg-purple-100 text-purple-800">
                              {u.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ban User Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Ban User
              </DialogTitle>
              <DialogDescription>
                This will prevent the user from accessing the platform.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-slate-900">{selectedUser.full_name || 'No name'}</p>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                </div>

                <div className="space-y-2">
                  <Label>Ban Reason *</Label>
                  <Textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Provide a reason for banning this user..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowBanDialog(false);
                setBanReason('');
                setSelectedUser(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleBanUser}
                disabled={!banReason.trim() || banUserMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {banUserMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4 mr-2" />
                )}
                Ban User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}