import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Plus, Users, Clock, ChevronLeft, ChevronRight, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { toast } from "sonner";

export default function RestaurantScheduling() {
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [createShiftDialog, setCreateShiftDialog] = useState(false);

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

  const { data: shifts = [] } = useQuery({
    queryKey: ['restaurantShifts', restaurant?.id],
    queryFn: () => base44.entities.Shift.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ['restaurantTimeOffRequests', restaurant?.id],
    queryFn: () => base44.entities.TimeOffRequest.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: shiftSwaps = [] } = useQuery({
    queryKey: ['shiftSwaps', restaurant?.id],
    queryFn: () => base44.entities.ShiftSwap.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const { data: shiftBids = [] } = useQuery({
    queryKey: ['shiftBids', restaurant?.id],
    queryFn: async () => {
      const restaurantShiftIds = shifts.map(s => s.id);
      if (restaurantShiftIds.length === 0) return [];
      const allBids = await base44.entities.ShiftBid.list();
      return allBids.filter(bid => restaurantShiftIds.includes(bid.shift_id));
    },
    enabled: !!restaurant?.id && shifts.length > 0
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getShiftsForDay = (date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.shift_date), date));
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Please register a restaurant first</p>
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
            <h1 className="text-3xl font-bold text-slate-900">Scheduling</h1>
            <p className="text-slate-600">Manage shifts, time-off requests, and staffing</p>
          </div>
          <Dialog open={createShiftDialog} onOpenChange={setCreateShiftDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Shift</DialogTitle>
              </DialogHeader>
              <CreateShiftForm 
                restaurant={restaurant}
                onSuccess={() => {
                  setCreateShiftDialog(false);
                  queryClient.invalidateQueries(['restaurantShifts']);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="shifts">All Shifts</TabsTrigger>
            <TabsTrigger value="bids">
              Shift Bids
              {shiftBids.filter(b => b.status === 'pending').length > 0 && (
                <Badge className="ml-2 bg-amber-500">{shiftBids.filter(b => b.status === 'pending').length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="swaps">
              Swap Requests
              {shiftSwaps.filter(s => s.status === 'pending_manager').length > 0 && (
                <Badge className="ml-2 bg-blue-500">{shiftSwaps.filter(s => s.status === 'pending_manager').length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="timeoff">
              Time Off
              {timeOffRequests.filter(t => t.status === 'pending').length > 0 && (
                <Badge className="ml-2 bg-purple-500">{timeOffRequests.filter(t => t.status === 'pending').length}</Badge>
              )}
            </TabsTrigger>
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
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div key={day.toString()} className={`border rounded-lg p-3 min-h-40 ${isToday ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                        <div className="font-medium text-sm text-slate-600 mb-2">
                          {format(day, 'EEE d')}
                        </div>
                        <div className="space-y-1">
                          {dayShifts.map(shift => (
                            <ShiftCalendarItem key={shift.id} shift={shift} />
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
            <ShiftsManager shifts={shifts} restaurant={restaurant} />
          </TabsContent>

          <TabsContent value="bids">
            <BidsManager bids={shiftBids} shifts={shifts} />
          </TabsContent>

          <TabsContent value="swaps">
            <SwapsManager swaps={shiftSwaps} />
          </TabsContent>

          <TabsContent value="timeoff">
            <TimeOffManager requests={timeOffRequests} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ShiftCalendarItem({ shift }) {
  const statusColors = {
    open: 'bg-amber-100 border-amber-200 text-amber-900',
    assigned: 'bg-blue-100 border-blue-200 text-blue-900',
    bidding: 'bg-purple-100 border-purple-200 text-purple-900',
    completed: 'bg-slate-100 border-slate-200 text-slate-600'
  };

  return (
    <div className={`text-xs p-2 rounded border ${statusColors[shift.status]}`}>
      <div className="font-medium">{shift.job_type}</div>
      <div>{shift.start_time} - {shift.end_time}</div>
      {shift.assigned_worker_name && <div className="truncate">{shift.assigned_worker_name}</div>}
      {shift.status === 'open' && shift.allow_bidding && <div className="text-xs opacity-75">Bidding</div>}
    </div>
  );
}

function CreateShiftForm({ restaurant, onSuccess }) {
  const [formData, setFormData] = useState({
    job_type: 'Server',
    shift_date: '',
    start_time: '09:00',
    end_time: '17:00',
    hourly_rate: 15,
    notes: '',
    allow_bidding: false,
    is_recurring: false,
    recurring_pattern: 'weekly'
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (data.is_recurring) {
        const shifts = [];
        const occurrences = data.recurring_pattern === 'weekly' ? 12 : 4;
        const interval = data.recurring_pattern === 'weekly' ? 7 : data.recurring_pattern === 'biweekly' ? 14 : 30;
        
        for (let i = 0; i < occurrences; i++) {
          const shiftDate = new Date(data.shift_date);
          shiftDate.setDate(shiftDate.getDate() + (i * interval));
          shifts.push({
            ...data,
            shift_date: shiftDate.toISOString().split('T')[0],
            parent_shift_id: i === 0 ? null : 'parent'
          });
        }
        
        await base44.entities.Shift.bulkCreate(shifts);
      } else {
        await base44.entities.Shift.create(data);
      }
    },
    onSuccess: () => {
      toast.success('Shift(s) created successfully');
      onSuccess();
    }
  });

  const jobTypes = ['Server', 'Bartender', 'Line Cook', 'Prep Cook', 'Host/Hostess', 'Busser', 'Dishwasher', 'Barista', 'Food Runner', 'Kitchen Manager', 'Other'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Position</Label>
          <Select value={formData.job_type} onValueChange={(val) => setFormData({ ...formData, job_type: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={formData.shift_date} onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Hourly Rate</Label>
          <Input type="number" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special requirements or notes..." />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={formData.allow_bidding} onCheckedChange={(checked) => setFormData({ ...formData, allow_bidding: checked })} />
        <Label>Allow workers to bid for this shift</Label>
      </div>
      <div className="space-y-3 p-4 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox checked={formData.is_recurring} onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })} />
          <Label>Create recurring shift</Label>
        </div>
        {formData.is_recurring && (
          <Select value={formData.recurring_pattern} onValueChange={(val) => setFormData({ ...formData, recurring_pattern: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly (next 12 weeks)</SelectItem>
              <SelectItem value="biweekly">Bi-weekly (next 8 occurrences)</SelectItem>
              <SelectItem value="monthly">Monthly (next 4 months)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <Button 
        onClick={() => createMutation.mutate({
          ...formData,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          status: 'open'
        })} 
        disabled={createMutation.isPending || !formData.shift_date}
        className="w-full"
      >
        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Shift'}
      </Button>
    </div>
  );
}

function ShiftsManager({ shifts, restaurant }) {
  const queryClient = useQueryClient();
  const [selectedShift, setSelectedShift] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurantShifts']);
      toast.success('Shift updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurantShifts']);
      toast.success('Shift deleted');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Shifts</CardTitle>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No shifts scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{shift.job_type}</h3>
                    <Badge className={
                      shift.status === 'open' ? 'bg-amber-100 text-amber-700' :
                      shift.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }>
                      {shift.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {format(new Date(shift.shift_date), 'MMM d, yyyy')} • {shift.start_time} - {shift.end_time}
                  </p>
                  {shift.assigned_worker_name && (
                    <p className="text-sm text-slate-500 mt-1">Assigned to: {shift.assigned_worker_name}</p>
                  )}
                  {shift.allow_bidding && shift.bids_count > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">{shift.bids_count} bid(s) received</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {shift.status === 'open' && (
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(shift.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BidsManager({ bids, shifts }) {
  const queryClient = useQueryClient();

  const acceptBidMutation = useMutation({
    mutationFn: async ({ bid, shift }) => {
      await base44.entities.ShiftBid.update(bid.id, { status: 'accepted' });
      await base44.entities.Shift.update(shift.id, {
        assigned_worker_id: bid.worker_id,
        assigned_worker_name: bid.worker_name,
        status: 'assigned'
      });
      const otherBids = bids.filter(b => b.shift_id === bid.shift_id && b.id !== bid.id);
      for (const otherBid of otherBids) {
        await base44.entities.ShiftBid.update(otherBid.id, { status: 'rejected' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shiftBids']);
      queryClient.invalidateQueries(['restaurantShifts']);
      toast.success('Bid accepted');
    }
  });

  const rejectBidMutation = useMutation({
    mutationFn: (bidId) => base44.entities.ShiftBid.update(bidId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shiftBids']);
      toast.success('Bid rejected');
    }
  });

  const pendingBids = bids.filter(b => b.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Bids</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingBids.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No pending bids</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBids.map(bid => {
              const shift = shifts.find(s => s.id === bid.shift_id);
              if (!shift) return null;
              
              return (
                <div key={bid.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{bid.worker_name}</h3>
                      <p className="text-sm text-slate-600">
                        {shift.job_type} • {format(new Date(shift.shift_date), 'MMM d, yyyy')} • {shift.start_time} - {shift.end_time}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-600">${bid.bid_amount}/hr</p>
                  </div>
                  {bid.message && (
                    <p className="text-sm text-slate-600 mb-3 p-2 bg-slate-50 rounded">{bid.message}</p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => acceptBidMutation.mutate({ bid, shift })}
                      disabled={acceptBidMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => rejectBidMutation.mutate(bid.id)}
                      disabled={rejectBidMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SwapsManager({ swaps }) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.ShiftSwap.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shiftSwaps']);
      toast.success('Swap approved');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.ShiftSwap.update(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shiftSwaps']);
      toast.success('Swap rejected');
    }
  });

  const pendingSwaps = swaps.filter(s => s.status === 'pending_manager');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Swap Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingSwaps.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No pending swap requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSwaps.map(swap => (
              <div key={swap.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-900">{swap.requesting_worker_name}</h3>
                  <p className="text-sm text-slate-600">
                    {format(new Date(swap.shift_date), 'MMM d, yyyy')} • {swap.shift_time}
                  </p>
                  {swap.is_open_swap && <Badge className="mt-1 bg-purple-100 text-purple-700">Open Swap</Badge>}
                  {swap.target_worker_name && <p className="text-sm text-slate-500 mt-1">With: {swap.target_worker_name}</p>}
                </div>
                {swap.reason && (
                  <p className="text-sm text-slate-600 mb-3 p-2 bg-slate-50 rounded">{swap.reason}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => approveMutation.mutate(swap.id)}
                    disabled={approveMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => rejectMutation.mutate(swap.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimeOffManager({ requests }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.TimeOffRequest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurantTimeOffRequests']);
      toast.success('Request updated');
    }
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
                  <h3 className="font-semibold text-slate-900">{req.worker_name}</h3>
                  <p className="text-sm text-slate-600">
                    {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d, yyyy')}
                  </p>
                  {req.reason && <p className="text-sm text-slate-500 mt-1">{req.reason}</p>}
                  <Badge className={`mt-2 ${statusColors[req.status]}`}>{req.status}</Badge>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateMutation.mutate({ id: req.id, status: 'approved' })}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: req.id, status: 'rejected' })}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}