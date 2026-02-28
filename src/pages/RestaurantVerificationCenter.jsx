import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Upload, CheckCircle, XCircle, Clock,
  FileText, Loader2, Plus, AlertCircle, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DOC_TYPES = [
  { value: 'business_license', label: 'Business License' },
  { value: 'health_permit', label: 'Health Permit' },
  { value: 'food_safety_certificate', label: 'Food Safety Certificate' },
  { value: 'liquor_license', label: 'Liquor License' },
  { value: 'insurance', label: 'Insurance Certificate' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  pending:  { icon: Clock,         color: 'bg-amber-100 text-amber-700',   label: 'Pending Review' },
  approved: { icon: CheckCircle,   color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  rejected: { icon: XCircle,       color: 'bg-red-100 text-red-700',       label: 'Rejected' },
};

export default function RestaurantVerificationCenter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState('');
  const [docLabel, setDocLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['myRestaurant', user?.email],
    queryFn: async () => {
      const r = await base44.entities.Restaurant.filter({ created_by: user.email });
      return r[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['myVerificationRequests', restaurant?.id],
    queryFn: () => base44.entities.RestaurantVerificationRequest.filter(
      { restaurant_id: restaurant.id }, '-created_date'
    ),
    enabled: !!restaurant?.id
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => base44.entities.RestaurantVerificationRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myVerificationRequests']);
      setShowForm(false);
      setDocType('');
      setDocLabel('');
      setNotes('');
      setSelectedFile(null);
      toast.success('Document submitted for review');
    }
  });

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleSubmit = async () => {
    if (!docType || !selectedFile) {
      toast.error('Please select a document type and upload a file');
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    setUploading(false);

    submitMutation.mutate({
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      document_type: docType,
      document_label: docType === 'other' ? docLabel : undefined,
      document_url: file_url,
      notes,
      status: 'pending',
    });
  };

  const pending  = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved');
  const rejected = requests.filter(r => r.status === 'rejected');

  if (loadingRestaurant || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No restaurant profile found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate(createPageUrl('RestaurantDashboard'))}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
              Verification Center
            </h1>
            <p className="text-slate-500 mt-1">Submit documents to get your restaurant verified</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Submit Document
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending', count: pending.length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Approved', count: approved.length, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'Rejected', count: rejected.length, color: 'bg-red-50 border-red-200 text-red-700' },
          ].map(({ label, count, color }) => (
            <Card key={label} className={`border ${color}`}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Form */}
        {showForm && (
          <Card className="border-emerald-200 bg-emerald-50/30 mb-6">
            <CardHeader>
              <CardTitle className="text-base">Submit a Document</CardTitle>
              <CardDescription>Upload a PDF, image, or document for admin review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type *</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {docType === 'other' && (
                  <div className="space-y-2">
                    <Label>Document Name *</Label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      placeholder="e.g. Fire Safety Permit"
                      value={docLabel}
                      onChange={e => setDocLabel(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Upload File *</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center bg-white">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 mb-2">PDF, PNG, JPG up to 10MB</p>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" id="doc-upload" />
                  <label htmlFor="doc-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">Choose File</span>
                    </Button>
                  </label>
                  {selectedFile && (
                    <p className="text-sm text-emerald-600 mt-2 font-medium">{selectedFile.name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional context for the reviewer..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={uploading || submitMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {(uploading || submitMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? 'Uploading...' : 'Submit for Review'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Documents Submitted</h3>
              <p className="text-slate-500 mb-4">Upload your business documents to get verified</p>
              <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Submit First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Submitted Documents</h2>
            {requests.map(req => {
              const config = STATUS_CONFIG[req.status];
              const StatusIcon = config.icon;
              const docLabel = DOC_TYPES.find(d => d.value === req.document_type)?.label || req.document_label || req.document_type;
              return (
                <Card key={req.id} className="border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900">{docLabel}</p>
                            <Badge className={config.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            Submitted {format(new Date(req.created_date), 'MMM d, yyyy')}
                            {req.reviewed_date && ` · Reviewed ${format(new Date(req.reviewed_date), 'MMM d, yyyy')}`}
                          </p>
                          {req.notes && (
                            <p className="text-sm text-slate-500 mt-2">Your notes: {req.notes}</p>
                          )}
                          {req.status === 'rejected' && req.admin_notes && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection Reason</p>
                                <p className="text-sm text-red-600">{req.admin_notes}</p>
                              </div>
                            </div>
                          )}
                          {req.status === 'approved' && (
                            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Approved by admin
                            </p>
                          )}
                        </div>
                      </div>
                      <a href={req.document_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">View Doc</Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}