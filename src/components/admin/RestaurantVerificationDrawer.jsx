import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  CheckCircle, XCircle, Clock, Loader2, FileText, Building2, ShieldCheck, ExternalLink, AlertCircle
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

const VREQ_STATUS = {
  pending:  { icon: Clock,        color: 'bg-amber-100 text-amber-700',    label: 'Pending' },
  approved: { icon: CheckCircle,  color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  rejected: { icon: XCircle,      color: 'bg-red-100 text-red-700',        label: 'Rejected' },
};

export default function RestaurantVerificationDrawer({ restaurant, open, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['restaurantVerificationDocs', restaurant?.id],
    queryFn: () => base44.entities.RestaurantVerificationRequest.filter(
      { restaurant_id: restaurant.id }, '-created_date'
    ),
    enabled: open && !!restaurant?.id,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, admin_notes }) =>
      base44.entities.RestaurantVerificationRequest.update(id, {
        status,
        admin_notes: admin_notes || null,
        reviewed_by: currentUser?.email,
        reviewed_date: new Date().toISOString(),
      }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries(['restaurantVerificationDocs', restaurant?.id]);
      queryClient.invalidateQueries(['allVerificationRequests']);
      setRejectTarget(null);
      setAdminNotes('');
      toast.success(`Document ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'}`);
    },
  });

  const handleApprove = (doc) => reviewMutation.mutate({ id: doc.id, status: 'approved' });
  const handleSetPending = (doc) => reviewMutation.mutate({ id: doc.id, status: 'pending', admin_notes: null });
  const handleConfirmReject = () => {
    if (!adminNotes.trim()) { toast.error('Please provide a rejection reason'); return; }
    reviewMutation.mutate({ id: rejectTarget.id, status: 'rejected', admin_notes: adminNotes });
  };

  const pending = docs.filter(d => d.status === 'pending').length;
  const approved = docs.filter(d => d.status === 'approved').length;
  const rejected = docs.filter(d => d.status === 'rejected').length;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              {restaurant?.logo_url ? (
                <img src={restaurant.logo_url} alt={restaurant.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div>
                <SheetTitle className="text-xl">{restaurant?.name}</SheetTitle>
                <SheetDescription>Verification Documents</SheetDescription>
              </div>
            </div>

            {/* Summary badges */}
            {!isLoading && docs.length > 0 && (
              <div className="flex gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Clock className="w-3 h-3" /> {pending} Pending
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <CheckCircle className="w-3 h-3" /> {approved} Approved
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <XCircle className="w-3 h-3" /> {rejected} Rejected
                </span>
              </div>
            )}
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="w-14 h-14 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No documents submitted</p>
              <p className="text-slate-400 text-sm mt-1">This restaurant hasn't uploaded any verification documents yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {docs.map(doc => {
                const cfg = VREQ_STATUS[doc.status] || VREQ_STATUS.pending;
                const StatusIcon = cfg.icon;
                const docLabel = DOC_TYPE_LABELS[doc.document_type] || doc.document_label || doc.document_type;

                return (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                  >
                    {/* Doc header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{docLabel}</p>
                            <Badge className={cfg.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Submitted {format(new Date(doc.created_date), 'MMM d, yyyy')}
                            {doc.reviewed_date && ` · Reviewed ${format(new Date(doc.reviewed_date), 'MMM d, yyyy')}`}
                            {doc.reviewed_by && ` by ${doc.reviewed_by}`}
                          </p>
                        </div>
                      </div>
                      <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="flex-shrink-0">
                          <ExternalLink className="w-3 h-3 mr-1" /> View
                        </Button>
                      </a>
                    </div>

                    {/* Restaurant notes */}
                    {doc.notes && (
                      <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Restaurant note: </span>{doc.notes}
                      </div>
                    )}

                    {/* Admin rejection note */}
                    {doc.admin_notes && (
                      <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span><span className="font-medium">Rejection reason: </span>{doc.admin_notes}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {doc.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleApprove(doc)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => { setRejectTarget(doc); setAdminNotes(''); }}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {doc.status === 'approved' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => { setRejectTarget(doc); setAdminNotes(''); }}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={() => handleSetPending(doc)}
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" /> Set Pending
                          </Button>
                        </>
                      )}
                      {doc.status === 'rejected' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleApprove(doc)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={() => handleSetPending(doc)}
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" /> Set Pending
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject dialog */}
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
                <p className="font-semibold text-slate-800">
                  {DOC_TYPE_LABELS[rejectTarget.document_type] || rejectTarget.document_label}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Submitted {format(new Date(rejectTarget.created_date), 'MMM d, yyyy')}
                </p>
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
              onClick={handleConfirmReject}
              disabled={reviewMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {reviewMutation.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <XCircle className="w-4 h-4 mr-2" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}