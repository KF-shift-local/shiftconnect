import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const JOB_TYPES = ['Server', 'Bartender', 'Line Cook', 'Prep Cook', 'Host/Hostess', 'Busser', 'Dishwasher', 'Barista', 'Food Runner', 'Kitchen Manager', 'Catering Staff', 'Other'];
const SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night', 'flexible'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ShiftTemplates() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    job_type: '',
    shift_type: 'flexible',
    start_time: '',
    end_time: '',
    days_of_week: [],
    positions_needed: 1,
    notes: ''
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

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['shiftTemplates', restaurant?.id],
    queryFn: () => base44.entities.ShiftTemplate.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTemplates'] });
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShiftTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTemplates'] });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShiftTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTemplates'] });
    }
  });

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTemplate(null);
    setFormData({
      template_name: '',
      job_type: '',
      shift_type: 'flexible',
      start_time: '',
      end_time: '',
      days_of_week: [],
      positions_needed: 1,
      notes: ''
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      job_type: template.job_type,
      shift_type: template.shift_type,
      start_time: template.start_time,
      end_time: template.end_time,
      days_of_week: template.days_of_week || [],
      positions_needed: template.positions_needed,
      notes: template.notes || ''
    });
    setShowDialog(true);
  };

  const handleDuplicate = (template) => {
    setFormData({
      template_name: `${template.template_name} (Copy)`,
      job_type: template.job_type,
      shift_type: template.shift_type,
      start_time: template.start_time,
      end_time: template.end_time,
      days_of_week: template.days_of_week || [],
      positions_needed: template.positions_needed,
      notes: template.notes || ''
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    const data = {
      ...formData,
      restaurant_id: restaurant.id
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

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
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Shift Templates</h1>
            <p className="text-slate-600">Create reusable shift templates for faster scheduling</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No shift templates yet</p>
              <Button onClick={() => setShowDialog(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{template.job_type}</Badge>
                        <Badge variant="outline" className="capitalize">{template.shift_type}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {template.start_time} - {template.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div className="flex flex-wrap gap-1">
                        {template.days_of_week?.map(day => (
                          <Badge key={day} variant="secondary" className="text-xs capitalize">
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">{template.positions_needed}</span> position(s) needed
                    </div>
                    {template.notes && (
                      <p className="text-slate-500 text-xs mt-2">{template.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'New Shift Template'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., Weekend Dinner Service"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Type *</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shift Type</Label>
                  <Select
                    value={formData.shift_type}
                    onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Days of Week *</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <Badge
                      key={day}
                      variant={formData.days_of_week.includes(day) ? 'default' : 'outline'}
                      className={`cursor-pointer capitalize ${
                        formData.days_of_week.includes(day)
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'hover:bg-emerald-50'
                      }`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Positions Needed</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.positions_needed}
                  onChange={(e) => setFormData({ ...formData, positions_needed: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional details..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.template_name || !formData.job_type || !formData.start_time || !formData.end_time || formData.days_of_week.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}