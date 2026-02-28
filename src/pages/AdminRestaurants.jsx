import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Building2, MapPin, Star, CheckCircle, XCircle, Clock, Loader2, Ban, AlertCircle, FileText, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DOC_TYPE_LABELS = {
  business_license: 'Business License',
  health_permit: 'Health Permit',
  food_safety_certificate: 'Food Safety Certificate',
  liquor_license: 'Liquor License',
  insurance: 'Insurance Certificate',
  other: 'Other',
};

const VREQ_STATUS = {
  pending:  { icon: Clock,       color: 'bg-amber-100 text-amber-700',    label: 'Pending' },
  approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  rejected: { icon: XCircle,     color: 'bg-red-100 text-red-700',        label: 'Rejected' },
};

export default function AdminRestaurants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['adminRestaurants'],
    queryFn: () => base44.entities.Restaurant.list('-created_date'),
    enabled: isAdmin
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: () => base44.entities.JobPosting.list(),
    enabled: isAdmin
  });

  const verifyMutation = useMutation({
    mutationFn: ({ restaurantId, verified }) => 
      base44.entities.Restaurant.update(restaurantId, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminRestaurants']);
      toast.success('Restaurant verification updated');
    }
  });

  const { data: verificationRequests = [] } = useQuery({
    queryKey: ['allVerificationRequests'],
    queryFn: () => base44.entities.RestaurantVerificationRequest.list('-created_date'),
    enabled: isAdmin
  });

  const reviewVerificationMutation = useMutation({
    mutationFn: ({ id, status, admin_notes }) =>
      base44.entities.RestaurantVerificationRequest.update(id, {
        status,
        admin_notes: admin_notes || null,
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString()
      }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries(['allVerificationRequests']);
      setRejectTarget(null);
      setAdminNotes('');
      toast.success(`Document ${status === 'approved' ? 'approved' : 'rejected'}`);
    }
  });

  const handleApproveDoc = (req) => reviewVerificationMutation.mutate({ id: req.id, status: 'approved' });
  const handleRejectDoc = () => {
    if (!adminNotes.trim()) { toast.error('Please provide a rejection reason'); return; }
    reviewVerificationMutation.mutate({ id: rejectTarget.id, status: 'rejected', admin_notes: adminNotes });
  };

  const banMutation = useMutation({
    mutationFn: async ({ restaurantId, status, reason }) => {
      // Update restaurant status
      await base44.entities.Restaurant.update(restaurantId, { 
        account_status: status,
        ban_reason: status === 'banned' ? reason : null
      });
      
      // If banning, delete all associated job postings
      if (status === 'banned') {
        const restaurantJobs = allJobs.filter(job => job.restaurant_id === restaurantId);
        await Promise.all(
          restaurantJobs.map(job => base44.entities.JobPosting.delete(job.id))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminRestaurants']);
      queryClient.invalidateQueries(['adminJobs']);
      toast.success('Restaurant status updated');
    }
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
            <p className="text-slate-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRestaurants = restaurants.filter(r =>
    !searchQuery || 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <h1 className="text-3xl font-bold text-slate-900">Manage Restaurants</h1>
            <p className="text-slate-600">View and manage all registered restaurants</p>
          </div>
        </div>

        <Tabs defaultValue="restaurants">
          <TabsList className="mb-6">
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="verifications">
              Verification Requests
              {verificationRequests.filter(r => r.status === 'pending').length > 0 && (
                <Badge className="ml-2 bg-amber-600 text-white text-xs">
                  {verificationRequests.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verifications">
            {verificationRequests.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <ShieldCheck className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No verification documents submitted yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {verificationRequests.map(req => {
                  const cfg = VREQ_STATUS[req.status];
                  const StatusIcon = cfg.icon;
                  const docLabel = DOC_TYPE_LABELS[req.document_type] || req.document_label || req.document_type;
                  return (
                    <Card key={req.id} className="border-slate-200">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-900">{req.restaurant_name}</p>
                                <Badge variant="secondary">{docLabel}</Badge>
                                <Badge className={cfg.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {cfg.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400">
                                Submitted {format(new Date(req.created_date), 'MMM d, yyyy')}
                                {req.reviewed_date && ` · Reviewed ${format(new Date(req.reviewed_date), 'MMM d, yyyy')}`}
                              </p>
                              {req.notes && <p className="text-sm text-slate-500 mt-1">Notes: <em>{req.notes}</em></p>}
                              {req.admin_notes && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                                  Rejection reason: {req.admin_notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end shrink-0">
                            <a href={req.document_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">View Doc</Button>
                            </a>
                            {req.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  disabled={reviewVerificationMutation.isPending}
                                  onClick={() => handleApproveDoc(req)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => { setRejectTarget(req); setAdminNotes(''); }}
                                >
                                  <XCircle className="w-3 h-3 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {req.status !== 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                onClick={() => reviewVerificationMutation.mutate({ id: req.id, status: 'pending', admin_notes: null })}
                              >
                                <Clock className="w-3 h-3 mr-1" /> Set Pending
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="restaurants">
            <Card className="border-slate-200 mb-6">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or city..."
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Restaurants ({filteredRestaurants.length})</span>
              <Badge variant="secondary">
                {restaurants.filter(r => r.verified).length} verified
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRestaurants.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200">
                    <div className="flex items-center gap-4 flex-1">
                      {r.logo_url ? (
                        <img src={r.logo_url} alt={r.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{r.name}</h3>
                          {r.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          {r.cuisine_type && <Badge variant="secondary">{r.cuisine_type}</Badge>}
                          {r.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {r.city}, {r.state}
                            </span>
                          )}
                          {r.average_rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              {r.average_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Registered {format(new Date(r.created_date), 'MMM d, yyyy')} • {r.total_hires || 0} hires
                        </div>
                        {r.account_status === 'banned' && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Banned{r.ban_reason ? `: ${r.ban_reason}` : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Verified</span>
                        <Switch
                          checked={r.verified}
                          onCheckedChange={(checked) => 
                            verifyMutation.mutate({ restaurantId: r.id, verified: checked })
                          }
                          disabled={r.account_status === 'banned'}
                        />
                      </div>
                      {r.account_status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => banMutation.mutate({ 
                            restaurantId: r.id, 
                            status: 'active',
                            reason: null
                          })}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => {
                            const reason = prompt('Ban reason (optional):');
                            banMutation.mutate({ 
                              restaurantId: r.id, 
                              status: 'banned',
                              reason
                            });
                          }}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Ban
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(createPageUrl(`RestaurantDashboard?restaurant_id=${r.id}`))}
                      >
                        View Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(createPageUrl(`RestaurantProfile?id=${r.id}`), '_blank')}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}


        <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" /> Reject Document
              </DialogTitle>
              <DialogDescription>
                Provide a reason so the restaurant knows what to resubmit.
              </DialogDescription>
            </DialogHeader>
            {rejectTarget && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  <p className="font-semibold text-slate-800">{rejectTarget.restaurant_name}</p>
                  <p className="text-slate-500">{DOC_TYPE_LABELS[rejectTarget.document_type] || rejectTarget.document_label}</p>
                </div>
                <div className="space-y-2">
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="e.g., Document is expired, please upload a current version..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button
                onClick={handleRejectDoc}
                disabled={reviewVerificationMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {reviewVerificationMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}