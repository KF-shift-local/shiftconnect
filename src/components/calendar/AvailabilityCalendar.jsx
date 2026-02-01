import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';

export default function AvailabilityCalendar({ availability, type = 'worker', jobPostings = [] }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getDayName = (date) => {
    return format(date, 'EEEE').toLowerCase();
  };
  
  const isAvailable = (date) => {
    if (type === 'worker') {
      const dayName = getDayName(date);
      return availability?.[dayName]?.available === true;
    } else {
      // For restaurants, check if there are active job postings for this date
      return jobPostings.some(job => {
        if (job.status !== 'active') return false;
        const startDate = job.start_date ? new Date(job.start_date) : null;
        const endDate = job.end_date ? new Date(job.end_date) : null;
        
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        
        const dayName = getDayName(date);
        return job.schedule?.[dayName] === true;
      });
    }
  };
  
  const getAvailabilityInfo = (date) => {
    if (type === 'worker') {
      const dayName = getDayName(date);
      const dayAvailability = availability?.[dayName];
      if (dayAvailability?.available) {
        return `${dayAvailability.start} - ${dayAvailability.end}`;
      }
    } else {
      // For restaurants, show how many positions needed
      const activeJobs = jobPostings.filter(job => {
        if (job.status !== 'active') return false;
        const startDate = job.start_date ? new Date(job.start_date) : null;
        const endDate = job.end_date ? new Date(job.end_date) : null;
        
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        
        const dayName = getDayName(date);
        return job.schedule?.[dayName] === true;
      });
      
      if (activeJobs.length > 0) {
        const totalPositions = activeJobs.reduce((sum, job) => 
          sum + ((job.positions_available || 1) - (job.positions_filled || 0)), 0
        );
        return totalPositions > 0 ? `${totalPositions} position${totalPositions > 1 ? 's' : ''}` : null;
      }
    }
    return null;
  };
  
  const today = new Date();
  const oneMonthFromNow = addMonths(today, 1);
  
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          {type === 'worker' ? 'Availability Calendar' : 'Hiring Needs Calendar'}
        </CardTitle>
        <p className="text-sm text-slate-500">
          {type === 'worker' 
            ? 'Days highlighted in green indicate availability' 
            : 'Days highlighted show when workers are needed'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h3 className="font-semibold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
              {day}
            </div>
          ))}
          
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const available = isAvailable(day);
            const info = getAvailabilityInfo(day);
            const isInRange = day >= today && day <= oneMonthFromNow;
            
            return (
              <div
                key={idx}
                className={`
                  min-h-[60px] p-1 border border-slate-200 rounded-lg
                  ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-emerald-600' : ''}
                  ${available && isInRange ? 'bg-emerald-50 border-emerald-200' : ''}
                `}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-emerald-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                {available && isInRange && info && (
                  <div className="text-xs text-emerald-700 mt-1">
                    {info}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded"></div>
            <span className="text-slate-600">
              {type === 'worker' ? 'Available' : 'Hiring'}
            </span>
          </div>
          {type === 'worker' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-slate-200 rounded"></div>
              <span className="text-slate-600">Unavailable</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}