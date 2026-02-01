import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Calendar } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ScheduleComparison({ workerAvailability, jobSchedule, jobTitle }) {
  const matchingDays = DAYS.filter(day => 
    workerAvailability?.[day]?.available && jobSchedule?.[day]
  );
  
  const workerAvailableDays = DAYS.filter(day => workerAvailability?.[day]?.available);
  const jobNeededDays = DAYS.filter(day => jobSchedule?.[day]);
  
  const matchPercentage = jobNeededDays.length > 0 
    ? Math.round((matchingDays.length / jobNeededDays.length) * 100)
    : 0;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Schedule Match
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            className={
              matchPercentage >= 80 ? 'bg-green-100 text-green-700' :
              matchPercentage >= 50 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }
          >
            {matchPercentage}% Match
          </Badge>
          <span className="text-sm text-slate-600">
            {matchingDays.length} of {jobNeededDays.length} days align
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              {jobTitle || 'Position'} Schedule
            </h4>
            <div className="space-y-2">
              {DAYS.map(day => {
                const workerAvail = workerAvailability?.[day];
                const jobNeeds = jobSchedule?.[day];
                const matches = workerAvail?.available && jobNeeds;
                const conflict = jobNeeds && !workerAvail?.available;
                
                return (
                  <div 
                    key={day} 
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      matches ? 'bg-green-50' :
                      conflict ? 'bg-red-50' :
                      'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {matches ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : conflict ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="capitalize font-medium text-slate-700 text-sm">
                        {day}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      {jobNeeds ? (
                        <span className="text-slate-600 font-medium">
                          Position Needs
                        </span>
                      ) : (
                        <span className="text-slate-400">Not needed</span>
                      )}
                      
                      <div className="w-px h-4 bg-slate-300" />
                      
                      {workerAvail?.available ? (
                        <span className="text-emerald-600 font-medium">
                          {workerAvail.start} - {workerAvail.end}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unavailable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}