import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2, Send } from 'lucide-react';
import { toast } from "sonner";

export default function ShiftProposal({ application, restaurant, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    shift_type: 'work_shift',
    date: '',
    time: '',
    end_time: '',
    location: restaurant?.address || '',
    notes: ''
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data) => {
      const proposedDate = new Date(`${data.date}T${data.time}`);
      const endTime = data.end_time ? new Date(`${data.date}T${data.end_time}`) : null;

      const shift = await base44.entities.Shift.create({
        application_id: application.id,
        worker_id: application.worker_id,
        worker_name: application.worker_name,
        restaurant_id: application.restaurant_id,
        restaurant_name: application.restaurant_name,
        job_title: application.job_title,
        shift_type: data.shift_type,
        proposed_date: proposedDate.toISOString(),
        end_time: endTime ? endTime.toISOString() : null,
        location: data.location,
        notes: data.notes,
        status: 'proposed',
        proposed_by: 'restaurant'
      });

      // Create notification for worker
      await base44.entities.Notification.create({
        recipient_email: application.worker_id,
        recipient_type: 'worker',
        title: data.shift_type === 'interview' ? 'Interview Scheduled' : 'Shift Proposed',
        message: `${restaurant.name} has proposed a ${data.shift_type === 'interview' ? 'interview' : 'shift'} for ${proposedDate.toLocaleDateString()} at ${proposedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        type: 'application_update',
        link_url: `/MyApplications?id=${application.id}`,
        related_entity_id: application.id,
        priority: 'high'
      });

      return shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['applications']);
      toast.success('Shift proposed successfully');
      setFormData({
        shift_type: 'work_shift',
        date: '',
        time: '',
        end_time: '',
        location: restaurant?.address || '',
        notes: ''
      });
      onSuccess?.();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
      toast.error('Please select date and time');
      return;
    }
    createShiftMutation.mutate(formData);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Propose Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.shift_type} onValueChange={(value) => setFormData({ ...formData, shift_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="work_shift">Work Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>End Time (optional)</Label>
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Address or video call link"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional instructions..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={createShiftMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {createShiftMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Proposal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}