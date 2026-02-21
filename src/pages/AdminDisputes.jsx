import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  investigating: { label: 'Investigating', color: 'bg-blue-100 text-blue-800', icon: Shield },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-slate-200 text-slate-700', icon: CheckCircle }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'High', color: 'bg-red-100 text-red-700' }
};

const DISPUTE_TYPE_LABELS = {
  payment: 'Payment Issue',
  behavior: 'Behavior/Conduct',
  no_show: 'No Show',
  quality_of_work: 'Quality of Work',
  breach_of_agreement: 'Breach of Agreement',
  other: 'Other'
};

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => base44.entities.Dispute.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dispute.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setSelectedDispute(null);
      setResolution('');
      setAdminNotes('');
    }
  });

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to access dispute resolution.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredDisputes = disputes.filter(d => 
    filter === 'all' ? true : d.status === filter
  );

  const handleResolve = (newStatus) => {
    updateMutation.mutate({
      id: selectedDispute.id,
      data: {
        status: newStatus,
        resolution: resolution,
        admin_notes: adminNotes,
        resolved_by: user.email,
        resolved_date: new Date().toISOString()
      }
    });
  };

  const handleUpdateStatus = (dispute, newStatus) => {
    updateMutation.mutate({
      id: dispute.id,
      data: { status: newStatus }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dispute Resolution</h1>
          <p className="text-slate-600">Mediate and resolve platform disputes</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2">
            {['all', 'pending', 'investigating', 'resolved', 'closed'].map(status => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}
                <Badge variant="secondary" className="ml-2">
                  {status === 'all' 
                    ? disputes.length 
                    : disputes.filter(d => d.status === status).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Disputes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredDisputes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600">No disputes in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map(dispute => {
              const StatusIcon = STATUS_CONFIG[dispute.status]?.icon || AlertCircle;
              return (
                <Card key={dispute.id} className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <StatusIcon className="w-5 h-5 text-slate-500" />
                          <h3 className="font-semibold text-slate-900">
                            {DISPUTE_TYPE_LABELS[dispute.dispute_type]}
                          </h3>
                          <Badge className={STATUS_CONFIG[dispute.status]?.color}>
                            {STATUS_CONFIG[dispute.status]?.label}
                          </Badge>
                          <Badge className={PRIORITY_CONFIG[dispute.priority]?.color}>
                            {PRIORITY_CONFIG[dispute.priority]?.label} Priority
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-slate-500">Reporter:</span>
                            <p className="font-medium text-slate-900">
                              {dispute.reporter_name} ({dispute.reporter_type})
                            </p>
                            <p className="text-xs text-slate-500">{dispute.reporter_email}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Respondent:</span>
                            <p className="font-medium text-slate-900">
                              {dispute.respondent_name} ({dispute.respondent_type})
                            </p>
                            <p className="text-xs text-slate-500">{dispute.respondent_email}</p>
                          </div>
                        </div>

                        {dispute.job_title && (
                          <div className="mb-3 text-sm">
                            <span className="text-slate-500">Related Job:</span>
                            <span className="ml-2 text-slate-900">{dispute.job_title}</span>
                          </div>
                        )}

                        <div className="p-3 bg-slate-50 rounded-lg mb-3">
                          <p className="text-sm text-slate-700">{dispute.description}</p>
                        </div>

                        <div className="text-xs text-slate-500">
                          Filed {format(new Date(dispute.created_date), 'MMM d, yyyy h:mm a')}
                        </div>

                        {dispute.resolution && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-xs font-semibold text-green-900 mb-1">Resolution:</p>
                            <p className="text-sm text-green-700">{dispute.resolution}</p>
                            {dispute.resolved_by && (
                              <p className="text-xs text-green-600 mt-1">
                                Resolved by {dispute.resolved_by} on {format(new Date(dispute.resolved_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setResolution(dispute.resolution || '');
                            setAdminNotes(dispute.admin_notes || '');
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                        {dispute.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(dispute, 'investigating')}
                          >
                            Start Investigation
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

        {/* Review Dialog */}
        <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Review Dispute</DialogTitle>
            </DialogHeader>
            
            {selectedDispute && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Dispute Type</p>
                    <p className="font-medium text-slate-900">
                      {DISPUTE_TYPE_LABELS[selectedDispute.dispute_type]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Priority</p>
                    <Badge className={PRIORITY_CONFIG[selectedDispute.priority]?.color}>
                      {PRIORITY_CONFIG[selectedDispute.priority]?.label}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-700">{selectedDispute.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Admin Notes (Internal)</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes about investigation..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Resolution</label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="How was this dispute resolved?"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolve('investigating')}
                disabled={updateMutation.isPending}
              >
                Mark as Investigating
              </Button>
              <Button
                onClick={() => handleResolve('resolved')}
                disabled={!resolution || updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve Dispute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}