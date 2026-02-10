import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Edit, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';

export default function ShiftResponse({ shift, userType = 'worker' }) {
  const queryClient = useQueryClient();
  const [showCounterProposal, setShowCounterProposal] = useState(false);
  const [counterData, setCounterData] = useState({
    date: '',
    time: '',
    end_time: '',
    notes: ''
  });

  const respondMutation = useMutation({
    mutationFn: async ({ status, counterProposal }) => {
      const updateData = {
        status,
        response_notes: counterProposal?.notes || null,
        counter_proposal_date: counterProposal?.date ? new Date(`${counterProposal.date}T${counterProposal.time}`).toISOString() : null,
        counter_proposal_end: counterProposal?.end_time ? new Date(`${counterProposal.date}T${counterProposal.end_time}`).toISOString() : null
      };

      await base44.entities.Shift.update(shift.id, updateData);

      // Notify restaurant
      const recipientEmail = shift.restaurant_id;
      const messageMap = {
        accepted: `${shift.worker_name} has accepted the ${shift.shift_type === 'interview' ? 'interview' : 'shift'} on ${format(new Date(shift.proposed_date), 'MMM d, yyyy at h:mm a')}`,
        declined: `${shift.worker_name} has declined the ${shift.shift_type === 'interview' ? 'interview' : 'shift'}`,
        counter_proposed: `${shift.worker_name} proposed an alternative time for the ${shift.shift_type === 'interview' ? 'interview' : 'shift'}`
      };

      await base44.entities.Notification.create({
        recipient_email: recipientEmail,
        recipient_type: 'restaurant',
        title: `Shift Response: ${status.replace('_', ' ')}`,
        message: messageMap[status],
        type: 'application_update',
        link_url: `/ManageApplications?id=${shift.application_id}`,
        related_entity_id: shift.application_id,
        priority: 'high'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['applications']);
      toast.success('Response sent successfully');
      setShowCounterProposal(false);
    }
  });

  const handleAccept = () => {
    respondMutation.mutate({ status: 'accepted' });
  };

  const handleDecline = () => {
    respondMutation.mutate({ status: 'declined' });
  };

  const handleCounterProposal = () => {
    if (!counterData.date || !counterData.time) {
      toast.error('Please select date and time');
      return;
    }
    respondMutation.mutate({ 
      status: 'counter_proposed', 
      counterProposal: counterData 
    });
  };

  const statusColors = {
    proposed: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    counter_proposed: 'bg-amber-100 text-amber-700',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-slate-100 text-slate-500'
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {shift.shift_type === 'interview' ? 'Interview' : 'Work Shift'}
          </CardTitle>
          <Badge className={statusColors[shift.status]}>
            {shift.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">
                {format(new Date(shift.proposed_date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-slate-600">
                {format(new Date(shift.proposed_date), 'h:mm a')}
                {shift.end_time && ` - ${format(new Date(shift.end_time), 'h:mm a')}`}
              </p>
            </div>
          </div>

          {shift.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <p className="text-sm text-slate-700">{shift.location}</p>
            </div>
          )}

          {shift.notes && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">{shift.notes}</p>
            </div>
          )}
        </div>

        {shift.status === 'counter_proposed' && shift.counter_proposal_date && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-medium text-amber-900 mb-2">Counter Proposal:</p>
            <p className="text-sm text-amber-700">
              {format(new Date(shift.counter_proposal_date), 'EEEE, MMMM d, yyyy at h:mm a')}
              {shift.counter_proposal_end && ` - ${format(new Date(shift.counter_proposal_end), 'h:mm a')}`}
            </p>
            {shift.response_notes && (
              <p className="text-sm text-amber-600 mt-2">{shift.response_notes}</p>
            )}
          </div>
        )}

        {userType === 'worker' && shift.status === 'proposed' && !showCounterProposal && (
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={respondMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {respondMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Accept
            </Button>
            <Button
              onClick={() => setShowCounterProposal(true)}
              variant="outline"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Propose Alternative
            </Button>
            <Button
              onClick={handleDecline}
              disabled={respondMutation.isPending}
              variant="destructive"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}

        {showCounterProposal && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-slate-900">Propose Alternative Time</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={counterData.date}
                  onChange={(e) => setCounterData({ ...counterData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={counterData.time}
                  onChange={(e) => setCounterData({ ...counterData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Time (optional)</Label>
              <Input
                type="time"
                value={counterData.end_time}
                onChange={(e) => setCounterData({ ...counterData, end_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={counterData.notes}
                onChange={(e) => setCounterData({ ...counterData, notes: e.target.value })}
                placeholder="Explain why this time works better..."
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCounterProposal}
                disabled={respondMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {respondMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  'Send Counter Proposal'
                )}
              </Button>
              <Button
                onClick={() => setShowCounterProposal(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}