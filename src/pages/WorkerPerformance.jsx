import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter>
<parameter name="content">import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/StarRating";
import { 
  Star,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Search,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

const PERFORMANCE_RATINGS = ['excellent', 'good', 'fair', 'poor'];

export default function WorkerPerformance() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    performance_rating: 5,
    punctuality: 'good',
    attitude: 'good',
    work_quality: 'good',
    notes: '',
    would_rehire: true,
    flagged: false,
    flag_reason: '',
    shift_date: ''
  });

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

  const { data: applications = [] } = useQuery({
    queryKey: ['completedApplications', restaurant?.id],
    queryFn: () => base44.entities.Application.filter({ 
      restaurant_id: restaurant.id,
      status: 'completed'
    }),
    enabled: !!restaurant?.id
  });

  const { data: performanceNotes = [], isLoading } = useQuery({
    queryKey: ['performanceNotes', restaurant?.id],
    queryFn: () => base44.entities.WorkerPerformanceNote.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkerPerformanceNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceNotes'] });
      handleCloseDialog();
    }
  });

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedApplication(null);
    setFormData({
      performance_rating: 5,
      punctuality: 'good',
      attitude: 'good',
      work_quality: 'good',
      notes: '',
      would_rehire: true,
      flagged: false,
      flag_reason: '',
      shift_date: ''
    });
  };

  const handleAddNote = (application) => {
    setSelectedApplication(application);
    setShowDialog(true);
  };

  const handleSave = () => {
    createMutation.mutate({
      ...formData,
      restaurant_id: restaurant.id,
      worker_id: selectedApplication.worker_id,
      worker_name: selectedApplication.worker_name,
      application_id: selectedApplication.id,
      job_title: selectedApplication.job_title
    });
  };

  const filteredNotes = performanceNotes.filter(note =>
    note.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group notes by worker
  const notesByWorker = filteredNotes.reduce((acc, note) => {
    if (!acc[note.worker_id]) {
      acc[note.worker_id] = [];
    }
    acc[note.worker_id].push(note);
    return acc;
  }, {});

  // Calculate average ratings per worker
  const workerStats = Object.entries(notesByWorker).map(([workerId, notes]) => {
    const avgRating = notes.reduce((sum, n) => sum + (n.performance_rating || 0), 0) / notes.length;
    const wouldRehireCount = notes.filter(n => n.would_rehire).length;
    const flaggedCount = notes.filter(n => n.flagged).length;
    
    return {
      workerId,
      workerName: notes[0].worker_name,
      notes,
      avgRating,
      wouldRehirePercentage: (wouldRehireCount / notes.length) * 100,
      flaggedCount,
      totalNotes: notes.length
    };
  });

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Worker Performance Tracking</h1>
          <p className="text-slate-600">Internal notes and ratings for workers you've hired</p>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search workers or jobs..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Worker Statistics */}
        {workerStats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Worker Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workerStats.map(stat => (
                <Card key={stat.workerId} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{stat.workerName}</h3>
                        <p className="text-xs text-slate-500">{stat.totalNotes} evaluation(s)</p>
                      </div>
                      {stat.flaggedCount > 0 && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={stat.avgRating} size="sm" />
                      <span className="text-sm font-medium text-slate-700">
                        {stat.avgRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {stat.wouldRehirePercentage >= 80 ? (
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-slate-600">
                        {stat.wouldRehirePercentage.toFixed(0)}% would rehire
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Applications (to add notes for) */}
        {applications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Performance Notes</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {applications.slice(0, 5).map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">{app.worker_name}</p>
                        <p className="text-sm text-slate-500">{app.job_title}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddNote(app)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* All Performance Notes */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance History</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No performance notes yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map(note => (
              <Card key={note.id} className={`border-slate-200 ${note.flagged ? 'border-l-4 border-l-amber-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{note.worker_name}</h3>
                      <p className="text-sm text-slate-600">{note.job_title}</p>
                      {note.shift_date && (
                        <p className="text-xs text-slate-500">
                          Shift: {format(new Date(note.shift_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={note.performance_rating} size="sm" />
                      {note.would_rehire ? (
                        <Badge className="bg-green-100 text-green-800">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Would Rehire
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-600">
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Would Not Rehire
                        </Badge>
                      )}
                      {note.flagged && (
                        <Badge className="bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-slate-500">Punctuality:</span>
                      <span className="ml-2 capitalize font-medium text-slate-900">{note.punctuality}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Attitude:</span>
                      <span className="ml-2 capitalize font-medium text-slate-900">{note.attitude}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Work Quality:</span>
                      <span className="ml-2 capitalize font-medium text-slate-900">{note.work_quality}</span>
                    </div>
                  </div>

                  {note.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">{note.notes}</p>
                    </div>
                  )}

                  {note.flagged && note.flag_reason && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs font-semibold text-amber-900 mb-1">Flag Reason:</p>
                      <p className="text-sm text-amber-700">{note.flag_reason}</p>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-3">
                    Recorded {format(new Date(note.created_date), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Note Dialog */}
        <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Performance Note</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">{selectedApplication.worker_name}</p>
                  <p className="text-sm text-slate-600">{selectedApplication.job_title}</p>
                </div>

                <div className="space-y-2">
                  <Label>Shift Date</Label>
                  <Input
                    type="date"
                    value={formData.shift_date}
                    onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Overall Performance Rating</Label>
                  <StarRating
                    rating={formData.performance_rating}
                    onChange={(rating) => setFormData({ ...formData, performance_rating: rating })}
                    interactive
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Punctuality</Label>
                    <Select
                      value={formData.punctuality}
                      onValueChange={(value) => setFormData({ ...formData, punctuality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERFORMANCE_RATINGS.map(rating => (
                          <SelectItem key={rating} value={rating} className="capitalize">
                            {rating}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Attitude</Label>
                    <Select
                      value={formData.attitude}
                      onValueChange={(value) => setFormData({ ...formData, attitude: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERFORMANCE_RATINGS.map(rating => (
                          <SelectItem key={rating} value={rating} className="capitalize">
                            {rating}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Work Quality</Label>
                    <Select
                      value={formData.work_quality}
                      onValueChange={(value) => setFormData({ ...formData, work_quality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERFORMANCE_RATINGS.map(rating => (
                          <SelectItem key={rating} value={rating} className="capitalize">
                            {rating}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes about performance..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.would_rehire}
                    onChange={(e) => setFormData({ ...formData, would_rehire: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label>Would rehire this worker</Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.flagged}
                    onChange={(e) => setFormData({ ...formData, flagged: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label>Flag for follow-up or concerns</Label>
                </div>

                {formData.flagged && (
                  <div className="space-y-2">
                    <Label>Flag Reason</Label>
                    <Textarea
                      value={formData.flag_reason}
                      onChange={(e) => setFormData({ ...formData, flag_reason: e.target.value })}
                      placeholder="Why is this flagged?"
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Save Performance Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}