import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function WorkerSchedule() {
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilityDialog, setAvailabilityDialog] = useState(false);
  const [timeOffDialog, setTimeOffDialog] = useState(false);

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

  const { data: shifts = [] } = useQuery({
    queryKey: ['workerShifts', workerProfile?.id],
    queryFn: () => base44.entities.Shift.filter({ assigned_worker_id: workerProfile.id }),
    enabled: !!workerProfile?.id
  });

  const { data: availabilityBlocks = [] } = useQuery({
    queryKey: ['availabilityBlocks', workerProfile?.id],
    queryFn: () => base44.entities.AvailabilityBlock.filter({ worker_id: workerProfile.id }),
    enabled: !!workerProfile?.id
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ['timeOffRequests', workerProfile?.id],
    queryFn: () => base44.entities.TimeOffRequest.filter({ worker_id: workerProfile.id }),
    enabled: !!workerProfile?.id
  });

  const { data: availableShifts = [] } = useQuery({
    queryKey: ['availableShifts'],
    queryFn: () => base44.entities.Shift.filter({ status: 'open', allow_bidding: true })
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getShiftsForDay = (date) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.shift_date), date)
    );
  };

  const getTimeOffForDay = (date) => {
    return timeOffRequests.filter(req => {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      return date >= start && date <= end;
    });
  };

  if (!workerProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Please create a worker profile first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Schedule</h1>
            <p className="text-slate-600">Manage your shifts, availability, and time off</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={timeOffDialog} onOpenChange={setTimeOffDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Request Time Off
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Time Off</DialogTitle>
                </DialogHeader>
                <TimeOffForm 
                  workerId={workerProfile.id}
                  workerName={workerProfile.full_name}
                  onSuccess={() => {
                    setTimeOffDialog(false);
                    queryClient.invalidateQueries(['timeOffRequests']);
                  }}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={availabilityDialog} onOpenChange={setAvailabilityDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Set Availability
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Availability Block</DialogTitle>
                </DialogHeader>
                <AvailabilityForm 
                  workerId={workerProfile.id}
                  onSuccess={() => {
                    setAvailabilityDialog(false);
                    queryClient.invalidateQueries(['availabilityBlocks']);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="shifts">My Shifts</TabsTrigger>
            <TabsTrigger value="available">Available Shifts</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Week of {format(currentWeekStart, 'MMM d, yyyy')}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const dayShifts = getShiftsForDay(day);
                    const timeOff = getTimeOffForDay(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div key={day.toString()} className={`border rounded-lg p-3 min-h-32 ${isToday ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                        <div className="font-medium text-sm text-slate-600 mb-2">
                          {format(day, 'EEE d')}
                        </div>
                        <div className="space-y-1">
                          {dayShifts.map(shift => (
                            <div key={shift.id} className="text-xs p-2 bg-blue-100 rounded border border-blue-200">
                              <div className="font-medium text-blue-900">{shift.job_type}</div>
                              <div className="text-blue-700">{shift.start_time} - {shift.end_time}</div>
                              <div className="text-blue-600">{shift.restaurant_name}</div>
                            </div>
                          ))}
                          {timeOff.map(req => (
                            <div key={req.id} className="text-xs p-2 bg-amber-100 rounded border border-amber-200">
                              <div className="font-medium text-amber-900">Time Off</div>
                              <div className="text-amber-700">{req.status}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shifts">
            <Card>
              <CardHeader>
                <CardTitle>My Scheduled Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                {shifts.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No shifts scheduled yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shifts.map(shift => (
                      <ShiftCard key={shift.id} shift={shift} workerId={workerProfile.id} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Available Shifts to Bid On</CardTitle>
              </CardHeader>
              <CardContent>
                {availableShifts.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No available shifts right now</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableShifts.map(shift => (
                      <AvailableShiftCard key={shift.id} shift={shift} workerId={workerProfile.id} workerName={workerProfile.full_name} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityManager workerId={workerProfile.id} blocks={availabilityBlocks} />
          </TabsContent>

          <TabsContent value="timeoff">
            <TimeOffManager workerId={workerProfile.id} requests={timeOffRequests} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ShiftCard({ shift, workerId }) {
  const queryClient = useQueryClient();
  const [swapDialog, setSwapDialog] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{shift.job_type}</h3>
            <Badge className="bg-blue-100 text-blue-700">{shift.status}</Badge>
          </div>
          <p className="text-sm text-slate-600">{shift.restaurant_name}</p>
          <p className="text-sm text-slate-500">
            {format(new Date(shift.shift_date), 'MMM d, yyyy')} • {shift.start_time} - {shift.end_time}
          </p>
          {shift.hourly_rate && (
            <p className="text-sm font-medium text-emerald-600 mt-1">${shift.hourly_rate}/hr</p>
          )}
        </div>
        <Dialog open={swapDialog} onOpenChange={setSwapDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Request Swap</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Shift Swap</DialogTitle>
            </DialogHeader>
            <ShiftSwapForm 
              shift={shift}
              requestingWorkerId={workerId}
              onSuccess={() => {
                setSwapDialog(false);
                toast.success('Swap request created');
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function AvailableShiftCard({ shift, workerId, workerName }) {
  const queryClient = useQueryClient();
  const [bidding, setBidding] = useState(false);
  const [bidAmount, setBidAmount] = useState(shift.hourly_rate || 15);
  const [message, setMessage] = useState('');

  const { data: existingBid } = useQuery({
    queryKey: ['shiftBid', shift.id, workerId],
    queryFn: async () => {
      const bids = await base44.entities.ShiftBid.filter({ shift_id: shift.id, worker_id: workerId });
      return bids[0];
    }
  });

  const bidMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ShiftBid.create(data);
      await base44.entities.Shift.update(shift.id, { bids_count: (shift.bids_count || 0) + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shiftBid']);
      toast.success('Bid submitted successfully');
      setBidding(false);
    }
  });

  const handleSubmitBid = () => {
    bidMutation.mutate({
      shift_id: shift.id,
      worker_id: workerId,
      worker_name: workerName,
      bid_amount: bidAmount,
      message
    });
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{shift.job_type}</h3>
            <Badge className="bg-emerald-100 text-emerald-700">Open</Badge>
          </div>
          <p className="text-sm text-slate-600">{shift.restaurant_name}</p>
          <p className="text-sm text-slate-500">
            {format(new Date(shift.shift_date), 'MMM d, yyyy')} • {shift.start_time} - {shift.end_time}
          </p>
          <p className="text-sm font-medium text-emerald-600 mt-1">${shift.hourly_rate}/hr</p>
          {shift.bids_count > 0 && (
            <p className="text-xs text-slate-400 mt-1">{shift.bids_count} bid{shift.bids_count !== 1 ? 's' : ''}</p>
          )}
        </div>
        {existingBid ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Bid: ${existingBid.bid_amount}/hr • {existingBid.status}
          </Badge>
        ) : bidding ? (
          <div className="space-y-2 w-64">
            <Input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(parseFloat(e.target.value))}
              placeholder="Bid amount/hr"
            />
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmitBid} disabled={bidMutation.isPending}>
                Submit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBidding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={() => setBidding(true)}>
            Place Bid
          </Button>
        )}
      </div>
    </div>
  );
}

function AvailabilityForm({ workerId, onSuccess }) {
  const [formData, setFormData] = useState({
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '17:00',
    is_recurring: true,
    is_blocked: false
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AvailabilityBlock.create({ ...data, worker_id: workerId }),
    onSuccess
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Day of Week</Label>
        <Select value={formData.day_of_week} onValueChange={(val) => setFormData({ ...formData, day_of_week: val })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
              <SelectItem key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox 
          checked={formData.is_recurring} 
          onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
        />
        <Label>Repeat every week</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox 
          checked={formData.is_blocked} 
          onCheckedChange={(checked) => setFormData({ ...formData, is_blocked: checked })}
        />
        <Label>Block this time (unavailable)</Label>
      </div>
      <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending} className="w-full">
        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Availability'}
      </Button>
    </div>
  );
}

function TimeOffForm({ workerId, workerName, onSuccess }) {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    is_all_day: true
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeOffRequest.create({ ...data, worker_id: workerId, worker_name: workerName }),
    onSuccess
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Optional" />
      </div>
      <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending} className="w-full">
        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Time Off'}
      </Button>
    </div>
  );
}

function ShiftSwapForm({ shift, requestingWorkerId, onSuccess }) {
  const [isOpenSwap, setIsOpenSwap] = useState(true);
  const [reason, setReason] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftSwap.create(data),
    onSuccess
  });

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-50 rounded-lg">
        <p className="text-sm font-medium text-slate-900">{shift.job_type}</p>
        <p className="text-sm text-slate-600">{format(new Date(shift.shift_date), 'MMM d, yyyy')} • {shift.start_time} - {shift.end_time}</p>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={isOpenSwap} onCheckedChange={setIsOpenSwap} />
        <Label>Open to any qualified worker</Label>
      </div>
      <div className="space-y-2">
        <Label>Reason (optional)</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need to swap this shift?" />
      </div>
      <Button 
        onClick={() => createMutation.mutate({
          shift_id: shift.id,
          requesting_worker_id: requestingWorkerId,
          restaurant_id: shift.restaurant_id,
          shift_date: shift.shift_date,
          shift_time: `${shift.start_time} - ${shift.end_time}`,
          reason,
          is_open_swap: isOpenSwap
        })} 
        disabled={createMutation.isPending} 
        className="w-full"
      >
        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Swap'}
      </Button>
    </div>
  );
}

function AvailabilityManager({ workerId, blocks }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AvailabilityBlock.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['availabilityBlocks'])
  });

  const groupedByDay = blocks.reduce((acc, block) => {
    if (!acc[block.day_of_week]) acc[block.day_of_week] = [];
    acc[block.day_of_week].push(block);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Availability Blocks</CardTitle>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No availability set</p>
          </div>
        ) : (
          <div className="space-y-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
              groupedByDay[day] && (
                <div key={day}>
                  <h3 className="font-medium text-slate-900 mb-2 capitalize">{day}</h3>
                  <div className="space-y-2">
                    {groupedByDay[day].map(block => (
                      <div key={block.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {block.start_time} - {block.end_time}
                          </p>
                          {block.is_blocked && <Badge variant="outline" className="mt-1">Blocked</Badge>}
                          {block.is_recurring && <span className="text-xs text-slate-500"> • Recurring</span>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(block.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimeOffManager({ workerId, requests }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeOffRequest.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['timeOffRequests'])
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Off Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No time off requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">
                    {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d, yyyy')}
                  </p>
                  {req.reason && <p className="text-sm text-slate-600 mt-1">{req.reason}</p>}
                  <Badge className={`mt-2 ${statusColors[req.status]}`}>{req.status}</Badge>
                </div>
                {req.status === 'pending' && (
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(req.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}