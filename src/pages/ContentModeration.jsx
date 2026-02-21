import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800' },
  reviewing: { label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  removed: { label: 'Content Removed', color: 'bg-slate-700 text-white' }
};

const REASON_LABELS = {
  spam: 'Spam',
  inappropriate: 'Inappropriate Content',
  false_info: 'False Information',
  harassment: 'Harassment',
  discrimination: 'Discrimination',
  other: 'Other'
};

export default function ContentModeration() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('none');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: moderationItems = [], isLoading } = useQuery({
    queryKey: ['contentModeration'],
    queryFn: () => base44.entities.ContentModeration.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentModeration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentModeration'] });
      setSelectedItem(null);
      setReviewNotes('');
      setActionTaken('none');
    }
  });

  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to access content moderation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredItems = moderationItems.filter(item => 
    filter === 'all' ? true : item.status === filter
  );

  const handleReview = (item, newStatus) => {
    updateMutation.mutate({
      id: item.id,
      data: {
        status: newStatus,
        reviewed_by: user.email,
        review_notes: reviewNotes,
        reviewed_date: new Date().toISOString(),
        action_taken: actionTaken
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Moderation</h1>
          <p className="text-slate-600">Review and manage flagged content</p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex gap-2">
            {['all', 'pending', 'reviewing', 'approved', 'rejected'].map(status => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}
                <Badge variant="secondary" className="ml-2">
                  {status === 'all' 
                    ? moderationItems.length 
                    : moderationItems.filter(i => i.status === status).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Moderation Items */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600">No items to review in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Flag className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-slate-900 capitalize">
                          {item.content_type.replace(/_/g, ' ')}
                        </h3>
                        <Badge className={STATUS_CONFIG[item.status]?.color}>
                          {STATUS_CONFIG[item.status]?.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Reason:</span>
                          <span className="font-medium text-slate-900">
                            {REASON_LABELS[item.reason]}
                          </span>
                        </div>
                        
                        {item.reported_by && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Reported by:</span>
                            <span className="text-slate-900">{item.reported_by}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Content ID:</span>
                          <span className="text-slate-900 font-mono text-xs">{item.content_id}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Reported:</span>
                          <span className="text-slate-900">
                            {format(new Date(item.created_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>

                        {item.description && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <p className="text-slate-700">{item.description}</p>
                          </div>
                        )}

                        {item.review_notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-semibold text-blue-900 mb-1">Admin Notes:</p>
                            <p className="text-blue-700">{item.review_notes}</p>
                            {item.reviewed_by && (
                              <p className="text-xs text-blue-600 mt-1">
                                Reviewed by {item.reviewed_by} on {format(new Date(item.reviewed_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setReviewNotes(item.review_notes || '');
                          setActionTaken(item.action_taken || 'none');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Content</DialogTitle>
            </DialogHeader>
            
            {selectedItem && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {selectedItem.content_type.replace(/_/g, ' ')} - {REASON_LABELS[selectedItem.reason]}
                  </p>
                  <p className="text-sm text-slate-700">{selectedItem.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Action Taken</label>
                  <Select value={actionTaken} onValueChange={setActionTaken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Action</SelectItem>
                      <SelectItem value="warning_sent">Warning Sent</SelectItem>
                      <SelectItem value="content_edited">Content Edited</SelectItem>
                      <SelectItem value="content_removed">Content Removed</SelectItem>
                      <SelectItem value="account_suspended">Account Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Review Notes</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReview(selectedItem, 'approved')}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReview(selectedItem, 'rejected')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}