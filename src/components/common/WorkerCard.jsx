import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, DollarSign, Calendar } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';

export default function WorkerCard({ worker }) {
  return (
    <Link to={createPageUrl(`WorkerProfile?id=${worker.id}`)}>
      <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-slate-300 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            {worker.photo_url ? (
              <img
                src={worker.photo_url}
                alt={worker.full_name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">
                  {worker.full_name?.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                {worker.full_name}
              </h3>
              {worker.headline && (
                <p className="text-sm text-slate-500 truncate">{worker.headline}</p>
              )}
              {worker.average_rating > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={worker.average_rating} size="sm" />
                  <span className="text-xs text-slate-500">
                    ({worker.total_reviews || 0} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          {worker.skills && worker.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {worker.skills.slice(0, 4).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                  {skill}
                </Badge>
              ))}
              {worker.skills.length > 4 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">
                  +{worker.skills.length - 4}
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
            {worker.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="truncate">{worker.location}</span>
              </div>
            )}
            {worker.jobs_completed > 0 && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span>{worker.jobs_completed} jobs</span>
              </div>
            )}
            {worker.hourly_rate_min && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>${worker.hourly_rate_min}+/hr</span>
              </div>
            )}
            {worker.available_start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-500" />
                <span>Available now</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}