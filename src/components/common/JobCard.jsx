import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Calendar, Zap, Train, Map } from 'lucide-react';
import { format } from 'date-fns';

export default function JobCard({ job }) {
  const urgencyColors = {
    immediate: 'bg-red-100 text-red-700 border-red-200',
    urgent: 'bg-amber-100 text-amber-700 border-amber-200',
    normal: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const typeColors = {
    temporary: 'bg-violet-100 text-violet-700',
    seasonal: 'bg-orange-100 text-orange-700',
    'part-time': 'bg-blue-100 text-blue-700',
    'full-time': 'bg-emerald-100 text-emerald-700',
    'on-call': 'bg-pink-100 text-pink-700'
  };

  return (
    <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
      <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-slate-300 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                {job.restaurant_logo ? (
                  <img
                    src={job.restaurant_logo}
                    alt={job.restaurant_name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-400">
                      {job.restaurant_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-sm text-slate-500">{job.restaurant_name}</p>
                </div>
              </div>
              {job.urgency && job.urgency !== 'normal' && (
                <Badge className={`${urgencyColors[job.urgency]} border`}>
                  <Zap className="w-3 h-3 mr-1" />
                  {job.urgency}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className={typeColors[job.employment_type]}>
                {job.employment_type}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {job.job_type}
              </Badge>
              {job.transit_accessible && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Train className="w-3 h-3 mr-1" />
                  Transit
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>
                  ${job.hourly_rate_min}
                  {job.hourly_rate_max && job.hourly_rate_max !== job.hourly_rate_min && `-${job.hourly_rate_max}`}/hr
                  {job.tips_included && ' + tips'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{job.hours_per_week_min}-{job.hours_per_week_max} hrs/wk</span>
              </div>
              {job.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{job.city}</span>
                </div>
              )}
              {job.start_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-500" />
                  <span>Starts {format(new Date(job.start_date), 'MMM d')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {job.duration_type?.replace('-', ' ')}
            </span>
            <div className="flex items-center gap-2">
              <Link 
                to={createPageUrl(`JobMap?id=${job.id}`)}
                onClick={(e) => e.stopPropagation()}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Map className="w-3 h-3 mr-1" />
                  Map
                </Button>
              </Link>
              <span className="text-xs font-medium text-emerald-600 group-hover:translate-x-1 transition-transform">
                View Details →
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}