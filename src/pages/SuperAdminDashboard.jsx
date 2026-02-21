import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Shield, 
  Users, 
  Building2, 
  Briefcase, 
  TrendingUp,
  AlertCircle,
  Crown,
  UserPlus,
  UserMinus,
  Loader2,
  CheckCircle,
  XCircle,
  Key,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';

export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [validationCode, setValidationCode] = useState('');
  const [promoteForm, setPromoteForm] = useState({
    reason: ''
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['superAdminAllUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['superAdminRestaurants'],
    queryFn: () => base44.entities.Restaurant.list()
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['superAdminWorkers'],
    queryFn: () => base44.entities.WorkerProfile.list()
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['superAdminJobs'],
    queryFn: () => base44.entities.JobPosting.list()
  });

  const { data: promotionRequests = [] } = useQuery({
    queryKey: ['promotionRequests'],
    queryFn: () => base44.entities.AdminPromotionRequest.list()
  });

  const createPromotionMutation = useMutation({
    mutationFn: async (data) => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      
      return base44.entities.AdminPromotionRequest.create({
        admin_email: data.admin_email,
        admin_name: data.admin_name,
        requested_by: user.email,
        validation_code: code,
        reason: data.reason,
        expires_at: expiresAt,
        status: 'pending'
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotionRequests'] });
      setSelectedRequest(data);
      setShowPromoteDialog(false);
      setShowValidateDialog(true);
    }
  });

  const validatePromotionMutation = useMutation({
    mutationFn: async ({ requestId, code, adminEmail }) => {
      const request = promotionRequests.find(r => r.id === requestId);
      
      if (request.validation_code !== code) {
        throw new Error('Invalid validation code');
      }
      
      if (new Date(request.expires_at) < new Date()) {
        throw new Error('Validation code has expired');
      }

      await base44.entities.User.update(allUsers.find(u => u.email === adminEmail).id, {
        role: 'super_admin'
      });

      await base44.entities.AdminPromotionRequest.update(requestId, {
        status: 'validated',
        validated_at: new Date().toISOString()
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['promotionRequests'] });
      setShowValidateDialog(false);
      setValidationCode('');
      setSelectedRequest(null);
    }
  });

  const demoteMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, { role: 'admin' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminAllUsers'] });
    }
  });

  const promoteToAdminMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, { role: 'admin' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminAllUsers'] });
    }
  });

  const handlePromoteToSuperAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowPromoteDialog(true);
  };

  const handleSubmitPromotion = () => {
    createPromotionMutation.mutate({
      admin_email: selectedAdmin.email,
      admin_name: selectedAdmin.full_name || selectedAdmin.email,
      reason: promoteForm.reason
    });
  };

  const handleValidate = () => {
    validatePromotionMutation.mutate({
      requestId: selectedRequest.id,
      code: validationCode,
      adminEmail: selectedRequest.admin_email
    });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (user && user.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Super Admin Access Only</h2>
            <p className="text-slate-600">You don't have permission to access the super admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const superAdmins = allUsers.filter(u => u.role === 'super_admin');
  const admins = allUsers.filter(u => u.role === 'admin');
  const regularUsers = allUsers.filter(u => u.role === 'user');
  const pendingPromotions = promotionRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold text-white">Super Admin Control Center</h1>
            </div>
            <p className="text-emerald-200">Complete platform oversight and admin management</p>
          </div>
          <Badge className="bg-amber-500 text-white text-sm px-4 py-2">
            <Crown className="w-4 h-4 mr-2" />
            Super Admin
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
              <div className="text-3xl font-bold">{superAdmins.length}</div>
              <div className="text-sm text-emerald-200">Super Admins</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-3xl font-bold">{admins.length}</div>
              <div className="text-sm text-emerald-200">Regular Admins</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold">{restaurants.length}</div>
              <div className="text-sm text-emerald-200">Total Restaurants</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold">{jobs.length}</div>
              <div className="text-sm text-emerald-200">Total Jobs</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Admin Management */}
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Super Admins */}
                <div>
                  <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Super Admins ({superAdmins.length})
                  </h3>
                  <div className="space-y-2">
                    {superAdmins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <p className="font-medium text-white">{admin.full_name || admin.email}</p>
                          <p className="text-xs text-purple-200">{admin.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                            <Crown className="w-3 h-3 mr-1" />
                            Super
                          </Badge>
                          {admin.email !== user.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-300 border-red-300/30 hover:bg-red-500/20"
                              onClick={() => demoteMutation.mutate(admin.id)}
                            >
                              <UserMinus className="w-3 h-3 mr-1" />
                              Demote
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regular Admins */}
                <div>
                  <h3 className="text-sm font-semibold text-blue-300 mb-3">Regular Admins ({admins.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {admins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <p className="font-medium text-white">{admin.full_name || admin.email}</p>
                          <p className="text-xs text-emerald-200">{admin.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-300 border-amber-300/30 hover:bg-amber-500/20"
                          onClick={() => handlePromoteToSuperAdmin(admin)}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Promote
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regular Users with Admin Promotion */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Regular Users ({regularUsers.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {regularUsers.slice(0, 10).map(u => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <p className="text-sm font-medium text-white">{u.full_name || u.email}</p>
                          <p className="text-xs text-emerald-200">{u.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-300 border-blue-300/30 hover:bg-blue-500/20"
                          onClick={() => promoteToAdminMutation.mutate(u.id)}
                        >
                          Make Admin
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Control & Pending Promotions */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Platform Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl('AdminAnalytics')}>
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Advanced Analytics
                  </Button>
                </Link>
                <Link to={createPageUrl('AdminUsers')}>
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <Users className="w-4 h-4 mr-2" />
                    All Users
                  </Button>
                </Link>
                <Link to={createPageUrl('AdminRestaurants')}>
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <Building2 className="w-4 h-4 mr-2" />
                    All Restaurants
                  </Button>
                </Link>
                <Link to={createPageUrl('AdminWorkers')}>
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <Users className="w-4 h-4 mr-2" />
                    All Workers
                  </Button>
                </Link>
                <Link to={createPageUrl('AdminDisputes')}>
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <Shield className="w-4 h-4 mr-2" />
                    Disputes
                  </Button>
                </Link>
                <Link to={createPageUrl('ContentModeration')}>
                  <Button variant="outline" className="w-full justify-start text-white border-white/20 hover:bg-white/10">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Moderation
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pending Promotions */}
            {pendingPromotions.length > 0 && (
              <Card className="bg-amber-500/10 backdrop-blur-lg border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-300" />
                    Pending Validations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingPromotions.map(req => (
                      <div key={req.id} className="p-3 rounded-lg bg-white/5 border border-amber-500/30">
                        <p className="text-sm font-medium text-white">{req.admin_name}</p>
                        <p className="text-xs text-amber-200 mb-2">{req.reason}</p>
                        <Button
                          size="sm"
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowValidateDialog(true);
                          }}
                        >
                          <Lock className="w-3 h-3 mr-2" />
                          Enter Validation Code
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Promote Dialog */}
        <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
          <DialogContent className="bg-slate-900 text-white border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Promote to Super Admin
              </DialogTitle>
            </DialogHeader>
            
            {selectedAdmin && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="font-medium text-white">{selectedAdmin.full_name || selectedAdmin.email}</p>
                  <p className="text-sm text-emerald-200">{selectedAdmin.email}</p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300 mb-1">Security Notice</p>
                      <p className="text-xs text-amber-200">
                        A 6-digit validation code will be generated. You must enter this code to complete the promotion. 
                        The code expires in 30 minutes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Reason for Promotion</Label>
                  <Textarea
                    value={promoteForm.reason}
                    onChange={(e) => setPromoteForm({ ...promoteForm, reason: e.target.value })}
                    placeholder="Why is this admin being promoted to super admin?"
                    className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPromoteDialog(false)} className="border-slate-700 text-white hover:bg-slate-800">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPromotion}
                disabled={!promoteForm.reason}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Generate Validation Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Validate Dialog */}
        <Dialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
          <DialogContent className="bg-slate-900 text-white border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Enter Validation Code
              </DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm font-semibold text-amber-300 mb-2">Validation Code</p>
                  <p className="text-3xl font-mono font-bold text-white tracking-wider text-center py-3">
                    {selectedRequest.validation_code}
                  </p>
                  <p className="text-xs text-amber-200 text-center mt-2">
                    Expires: {format(new Date(selectedRequest.expires_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm text-white">Promoting: <span className="font-semibold">{selectedRequest.admin_name}</span></p>
                  <p className="text-xs text-emerald-200 mt-1">{selectedRequest.reason}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Enter the 6-digit code above to confirm</Label>
                  <Input
                    value={validationCode}
                    onChange={(e) => setValidationCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="bg-slate-800 border-slate-700 text-white text-center text-2xl font-mono tracking-wider"
                  />
                </div>

                {validatePromotionMutation.isError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-300">{validatePromotionMutation.error.message}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowValidateDialog(false);
                setValidationCode('');
              }} className="border-slate-700 text-white hover:bg-slate-800">
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={validationCode.length !== 6 || validatePromotionMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {validatePromotionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Promotion
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