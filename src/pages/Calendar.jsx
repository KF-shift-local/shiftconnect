import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Clock, Save } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar';
import ShiftResponse from '@/components/scheduling/ShiftResponse';

const TIMES = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [editedAvailability, setEditedAvailability] = useState(null);

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

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['restaurantJobs', restaurant?.id],
    queryFn: () => base44.entities.JobPosting.filter({ 
      restaurant_id: restaurant.id,
      status: 'active'
    }),
    enabled: !!restaurant?.id
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', workerProfile?.id || restaurant?.id],
    queryFn: () => {
      if (workerProfile) {
        return base44.entities.Shift.filter({ worker_id: workerProfile.id }, '-proposed_date');
      }
      return base44.entities.Shift.filter({ restaurant_id: restaurant.id }, '-proposed_date');
    },
    enabled: !!(workerProfile?.id || restaurant?.id)
  });

  React.useEffect(() => {
    if (workerProfile?.availability && !editedAvailability) {
      setEditedAvailability(workerProfile.availability);
    }
  }, [workerProfile]);

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (newAvailability) => {
      await base44.entities.WorkerProfile.update(workerProfile.id, {
        availability: newAvailability
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerProfile'] });
    }
  });

  const handleDayToggle = (day) => {
    setEditedAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev?.[day],
        available: !prev?.[day]?.available,
        start: prev?.[day]?.start || '9:00 AM',
        end: prev?.[day]?.end || '5:00 PM'
      }
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setEditedAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev?.[day],
        [type]: value
      }
    }));
  };

  const handleSave = () => {
    updateAvailabilityMutation.mutate(editedAvailability);
  };

  if (!user || (!workerProfile && !restaurant)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Calendar</h2>
            <p className="text-slate-600 mb-6">
              Create a profile to access your calendar.
            </p>
            <Button onClick={() => base44.auth.redirectToLogin()}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendar</h1>
          <p className="text-slate-600">
            {workerProfile ? 'Manage your availability schedule' : 'View hiring needs and schedules'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            {workerProfile ? (
              <AvailabilityCalendar 
                availability={editedAvailability || workerProfile.availability}
                type="worker"
              />
            ) : (
              <AvailabilityCalendar 
                jobPostings={jobs}
                type="restaurant"
              />
            )}
          </div>

          {/* Availability Editor (Workers Only) */}
          {workerProfile && (
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Edit Weekly Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS.map((day) => (
                    <div key={day} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="capitalize font-medium text-slate-700">
                          {day}
                        </label>
                        <Switch
                          checked={editedAvailability?.[day]?.available || false}
                          onCheckedChange={() => handleDayToggle(day)}
                        />
                      </div>
                      
                      {editedAvailability?.[day]?.available && (
                        <div className="grid grid-cols-2 gap-2 ml-4">
                          <Select
                            value={editedAvailability[day].start}
                            onValueChange={(value) => handleTimeChange(day, 'start', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMES.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={editedAvailability[day].end}
                            onValueChange={(value) => handleTimeChange(day, 'end', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMES.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button 
                    onClick={handleSave}
                    disabled={updateAvailabilityMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateAvailabilityMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Available Days</span>
                      <span className="font-medium text-slate-900">
                        {DAYS.filter(d => editedAvailability?.[d]?.available).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Hours/Week</span>
                      <span className="font-medium text-slate-900">
                        {DAYS.filter(d => editedAvailability?.[d]?.available).length * 8}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Schedules */}
              {shifts.filter(s => s.status === 'proposed' || s.status === 'accepted').length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-slate-900">Upcoming Schedules</h3>
                  {shifts
                    .filter(s => s.status === 'proposed' || s.status === 'accepted')
                    .slice(0, 3)
                    .map(shift => (
                      <ShiftResponse key={shift.id} shift={shift} userType="worker" />
                    ))
                  }
                </div>
              )}
            </div>
          )}

          {/* Restaurant Stats */}
          {restaurant && (
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-sm">Active Job Postings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {jobs.length === 0 ? (
                      <p className="text-sm text-slate-500">No active job postings</p>
                    ) : (
                      jobs.map(job => (
                        <div key={job.id} className="pb-3 border-b border-slate-100 last:border-0">
                          <div className="font-medium text-slate-900">{job.title}</div>
                          <div className="text-sm text-slate-500">
                            {(job.positions_available || 1) - (job.positions_filled || 0)} positions needed
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Restaurant Upcoming Schedules */}
              {shifts.filter(s => s.status === 'proposed' || s.status === 'accepted' || s.status === 'counter_proposed').length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Upcoming Schedules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {shifts
                      .filter(s => s.status === 'proposed' || s.status === 'accepted' || s.status === 'counter_proposed')
                      .slice(0, 3)
                      .map(shift => (
                        <div key={shift.id} className="pb-3 border-b border-slate-100 last:border-0">
                          <div className="font-medium text-slate-900">{shift.worker_name}</div>
                          <div className="text-sm text-slate-600">
                            {format(new Date(shift.proposed_date), 'MMM d, h:mm a')}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {shift.shift_type} • {shift.status}
                          </div>
                        </div>
                      ))
                    }
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}