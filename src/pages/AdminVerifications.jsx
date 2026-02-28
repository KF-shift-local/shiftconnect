import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, FileText,
  Loader2, AlertCircle, ShieldCheck, Building2
} from 'lucide-react';
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

const STATUS_CONFIG = {
  pending:  { icon: Clock,       color: 'bg-amber-100 text-amber-700',    label: 'Pending' },
  approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  rejected: { icon: XCircle,     color: 'bg-red-100 text-red-700',        label: 'Rejected' },
};

export default function AdminVerifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['allVerificationRequests'],
    queryFn: () => base44.entities.RestaurantVerificationRequest.list('-created_date'),
    enabled: isAdmin
  });

  const reviewMutation = useMutation({
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

  const handleApprove = (req) => {
    reviewMutation.mutate({ id: req.id, status: 'approved' });
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    reviewMutation.mutate({ id: rejectTarget.id, status: 'rejected', admin_notes: adminNotes });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">Admins only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pending  = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  const RequestCard = ({ req, showActions }) => {
    const config = STATUS_CONFIG[req.status];
    const StatusIcon = config.icon;
    const docLabel = DOC_TYPE_LABELS[req.document_type] || req.document_label || req.document_type;

    return (
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <p className="font-semibold text-slate-900">{req.restaurant_name}</p>
                  <Badge variant="secondary">{docLabel}</Badge>
                  <Badge className={config.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Submitted {format(new Date(req.created_date), 'MMM d, yyyy')}
                  {req.reviewed_date && ` · Reviewed ${format(new Date(req.reviewed_date), 'MMM d, yyyy')} by ${req.reviewed_by}`}
                </p>
                {req.notes && (
                  <p className="text-sm text-slate-500 mt-2">Restaurant notes: <em>{req.notes}</em></p>
                )}
                {req.admin_notes && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                    Admin notes: {req.admin_notes}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <a href={req.document_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">View Doc</Button>
              </a>
              {showActions && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                    disabled={reviewMutation.isPending}
                    onClick={() => handleApprove(req)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 w-full"
                    onClick={() => { setRejectTarget(req); setAdminNotes(''); }}
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
              Restaurant Verifications
            </h1>
            <p className="text-slate-500">Review and approve restaurant documents</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Review', count: pending.length, color: 'text-amber-600' },
            { label: 'Approved', count: requests.filter(r => r.status === 'approved').length, color: 'text-emerald-600' },
            { label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, color: 'text-red-600' },
          ].map(({ label, count, color }) => (
            <Card key={label} className="border-slate-200">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="mb-6">
              <TabsTrigger value="pending">
                Pending
                {pending.length > 0 && (
                  <Badge className="ml-2 bg-amber-600 text-white">{pending.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pending.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-700">All caught up!</h3>
                    <p className="text-slate-500 text-sm">No pending documents to review</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pending.map(req => <RequestCard key={req.id} req={req} showActions={true} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviewed">
              {reviewed.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No reviewed documents yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviewed.map(req => <RequestCard key={req.id} req={req} showActions={false} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Reject Dialog */}
        <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" /> Reject Document
              </DialogTitle>
              <DialogDescription>
                Provide a reason so the restaurant knows what to fix and resubmit.
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
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button
                onClick={handleReject}
                disabled={reviewMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {reviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}