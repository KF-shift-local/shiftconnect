import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Loader2,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmploymentVerification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    job_title: '',
    start_date: '',
    end_date: '',
    is_current: false,
    additional_notes: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: workerProfile } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['employmentVerifications', workerProfile?.id],
    queryFn: () => base44.entities.EmploymentVerification.filter({ worker_id: workerProfile.id }),
    enabled: !!workerProfile?.id
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['allRestaurants'],
    queryFn: () => base44.entities.Restaurant.list()
  });

  const createVerificationMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.EmploymentVerification.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employmentVerifications']);
      setDialogOpen(false);
      setSelectedRestaurant(null);
      setFormData({
        job_title: '',
        start_date: '',
        end_date: '',
        is_current: false,
        additional_notes: ''
      });
      toast.success('Verification request sent');
    }
  });

  const handleSubmit = () => {
    if (!selectedRestaurant || !formData.job_title || !formData.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    createVerificationMutation.mutate({
      worker_id: workerProfile.id,
      worker_name: workerProfile.full_name,
      worker_email: user.email,
      restaurant_id: selectedRestaurant.id,
      restaurant_name: selectedRestaurant.name,
      ...formData
    });
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(createPageUrl('WorkerDashboard'))}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employment Verification</h1>
            <p className="text-slate-600 mt-1">Verify your work history with restaurants</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Request Verification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Employment Verification</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {!selectedRestaurant ? (
                  <>
                    <div className="space-y-2">
                      <Label>Search Restaurant</Label>
                      <Input
                        placeholder="Search by restaurant name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredRestaurants.map((restaurant) => (
                        <button
                          key={restaurant.id}
                          onClick={() => setSelectedRestaurant(restaurant)}
                          className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {restaurant.logo_url ? (
                              <img src={restaurant.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">{restaurant.name}</p>
                              <p className="text-sm text-slate-500">{restaurant.city}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedRestaurant.logo_url ? (
                            <img src={selectedRestaurant.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-emerald-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{selectedRestaurant.name}</p>
                            <p className="text-sm text-slate-600">{selectedRestaurant.city}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRestaurant(null)}
                        >
                          Change
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Job Title *</Label>
                        <Input
                          value={formData.job_title}
                          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                          placeholder="e.g. Server, Line Cook"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date *</Label>
                          <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            disabled={formData.is_current}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_current"
                          checked={formData.is_current}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            is_current: e.target.checked,
                            end_date: e.target.checked ? '' : formData.end_date
                          })}
                          className="rounded border-slate-300"
                        />
                        <Label htmlFor="is_current" className="cursor-pointer">I currently work here</Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Notes (Optional)</Label>
                        <Textarea
                          value={formData.additional_notes}
                          onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                          placeholder="Any additional information..."
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={createVerificationMutation.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        {createVerificationMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending Request...
                          </>
                        ) : (
                          'Send Verification Request'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {verifications.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Verifications Yet</h3>
              <p className="text-slate-600 mb-6">Request employment verification from restaurants you've worked at</p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request First Verification
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {verifications.map((verification) => {
              const config = statusConfig[verification.status];
              const StatusIcon = config.icon;

              return (
                <Card key={verification.id} className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {verification.job_title}
                          </h3>
                          <Badge className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-slate-600 font-medium mb-2">{verification.restaurant_name}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>
                            {new Date(verification.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' - '}
                            {verification.is_current 
                              ? 'Present' 
                              : verification.end_date 
                                ? new Date(verification.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                : 'N/A'
                            }
                          </span>
                        </div>
                        {verification.additional_notes && (
                          <p className="text-sm text-slate-600 mt-3 p-3 bg-slate-50 rounded-lg">
                            {verification.additional_notes}
                          </p>
                        )}
                        {verification.status === 'verified' && verification.verified_date && (
                          <p className="text-xs text-green-600 mt-2">
                            Verified on {new Date(verification.verified_date).toLocaleDateString()}
                          </p>
                        )}
                        {verification.status === 'rejected' && verification.rejection_reason && (
                          <p className="text-sm text-red-600 mt-2 p-3 bg-red-50 rounded-lg">
                            Rejection reason: {verification.rejection_reason}
                          </p>
                        )}
                      </div>
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