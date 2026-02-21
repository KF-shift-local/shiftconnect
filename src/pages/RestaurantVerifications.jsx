import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantVerifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['restaurantVerifications', restaurant?.id],
    queryFn: () => base44.entities.EmploymentVerification.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.EmploymentVerification.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurantVerifications']);
      setDialogOpen(false);
      setSelectedVerification(null);
      setRejectionReason('');
      toast.success('Verification updated');
    }
  });

  const handleApprove = (verification) => {
    updateVerificationMutation.mutate({
      id: verification.id,
      data: {
        status: 'verified',
        verified_by: user.email,
        verified_date: new Date().toISOString()
      }
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    updateVerificationMutation.mutate({
      id: selectedVerification.id,
      data: {
        status: 'rejected',
        rejection_reason: rejectionReason,
        verified_by: user.email,
        verified_date: new Date().toISOString()
      }
    });
  };

  const openRejectDialog = (verification) => {
    setSelectedVerification(verification);
    setDialogOpen(true);
  };

  const pendingVerifications = verifications.filter(v => v.status === 'pending');
  const processedVerifications = verifications.filter(v => v.status !== 'pending');

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Pending' },
    verified: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Verified' },
    rejected: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Rejected' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const VerificationCard = ({ verification, showActions }) => {
    const config = statusConfig[verification.status];
    const StatusIcon = config.icon;

    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{verification.worker_name}</h3>
                <p className="text-sm text-slate-500">{verification.worker_email}</p>
              </div>
            </div>
            <Badge className={config.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-900">{verification.job_title}</span>
            </div>
            <div className="text-sm text-slate-600">
              {new Date(verification.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {' - '}
              {verification.is_current 
                ? <span className="text-emerald-600 font-medium">Current Employee</span>
                : verification.end_date 
                  ? new Date(verification.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'
              }
            </div>
          </div>

          {verification.additional_notes && (
            <div className="p-3 bg-slate-50 rounded-lg mb-4">
              <p className="text-sm text-slate-600">{verification.additional_notes}</p>
            </div>
          )}

          {verification.status === 'rejected' && verification.rejection_reason && (
            <div className="p-3 bg-red-50 rounded-lg mb-4">
              <p className="text-sm text-red-600">
                <strong>Rejection reason:</strong> {verification.rejection_reason}
              </p>
            </div>
          )}

          {verification.status === 'verified' && verification.verified_date && (
            <p className="text-xs text-green-600 mb-4">
              Verified on {new Date(verification.verified_date).toLocaleDateString()}
            </p>
          )}

          {showActions && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(verification)}
                disabled={updateVerificationMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify
              </Button>
              <Button
                onClick={() => openRejectDialog(verification)}
                disabled={updateVerificationMutation.isPending}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(createPageUrl('RestaurantDashboard'))}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Employment Verifications</h1>
          <p className="text-slate-600 mt-1">Review and verify worker employment history</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pendingVerifications.length > 0 && (
                <Badge className="ml-2 bg-amber-600">{pendingVerifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingVerifications.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Pending Requests</h3>
                  <p className="text-slate-600">All verification requests have been processed</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingVerifications.map((verification) => (
                  <VerificationCard
                    key={verification.id}
                    verification={verification}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processed">
            {processedVerifications.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Processed Verifications</h3>
                  <p className="text-slate-600">Verified and rejected requests will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {processedVerifications.map((verification) => (
                  <VerificationCard
                    key={verification.id}
                    verification={verification}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Verification Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-slate-600">
                Please provide a reason for rejecting this verification request:
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Employment dates don't match our records"
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={updateVerificationMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {updateVerificationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirm Rejection
                </Button>
                <Button
                  onClick={() => setDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}