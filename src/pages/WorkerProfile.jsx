import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  FileText,
  Download,
  CheckCircle,
  Loader2,
  Star,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import StarRating from '@/components/ui/StarRating';
import StartConversationButton from '@/components/messaging/StartConversationButton';
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar';

export default function WorkerProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const workerId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      const workers = await base44.entities.WorkerProfile.filter({ id: workerId });
      return workers[0];
    },
    enabled: !!workerId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['workerReviews', workerId],
    queryFn: () => base44.entities.Review.filter({ 
      reviewee_id: workerId, 
      is_published: true 
    }, '-created_date'),
    enabled: !!workerId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Worker Not Found</h2>
            <p className="text-slate-600 mb-4">This profile doesn't exist or has been removed.</p>
            <Link to={createPageUrl('Jobs')}>
              <Button>Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableDays = Object.entries(worker.availability || {})
    .filter(([_, v]) => v?.available)
    .map(([d]) => d);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            to={createPageUrl('BrowseWorkers')}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {worker.photo_url ? (
                <img
                  src={worker.photo_url}
                  alt={worker.full_name}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-emerald-600">
                    {worker.full_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{worker.full_name}</h1>
              {worker.headline && (
                <p className="text-lg text-slate-600 mb-3">{worker.headline}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-4">
                {worker.average_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={worker.average_rating} size="md" />
                    <span className="text-slate-600">
                      {worker.average_rating.toFixed(1)} ({worker.total_reviews} reviews)
                    </span>
                  </div>
                )}
                {worker.jobs_completed > 0 && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {worker.jobs_completed} jobs completed
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                {worker.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    {worker.location}
                  </span>
                )}
                {worker.hourly_rate_min && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    ${worker.hourly_rate_min}+/hr
                  </span>
                )}
                {worker.available_start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Available {format(new Date(worker.available_start_date), 'MMM d')}
                  </span>
                )}
              </div>

              {user && restaurant && (
                <div className="mt-4">
                  <StartConversationButton
                    workerProfile={worker}
                    restaurant={restaurant}
                    currentUser={user}
                    currentUserType="restaurant"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {worker.bio && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {worker.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {worker.experience?.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {worker.experience.map((exp, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{exp.title}</h4>
                        <p className="text-slate-600">{exp.employer}</p>
                        <p className="text-sm text-slate-500">
                          {exp.start_date && format(new Date(exp.start_date + '-01'), 'MMM yyyy')}
                          {exp.start_date && ' - '}
                          {exp.end_date ? format(new Date(exp.end_date + '-01'), 'MMM yyyy') : 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-slate-600 mt-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {worker.skills?.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{review.reviewer_name}</span>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-slate-600">{review.comment}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {format(new Date(review.published_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Certifications */}
            {worker.certifications?.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {worker.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-600">{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Availability Calendar */}
            <AvailabilityCalendar 
              availability={worker.availability}
              type="worker"
            />
            
            {/* Weekly Availability */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const dayData = worker.availability?.[day];
                    return (
                      <div key={day} className="flex items-center justify-between">
                        <span className="capitalize text-slate-700">{day}</span>
                        {dayData?.available ? (
                          <span className="text-sm text-emerald-600">
                            {dayData.start} - {dayData.end}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Unavailable</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Preferred Positions */}
            {worker.preferred_job_types?.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Looking For</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {worker.preferred_job_types.map((type, idx) => (
                      <Badge key={idx} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resume */}
            {worker.resume_url && (
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <a
                    href={worker.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">View Resume</span>
                    <Download className="w-4 h-4 ml-auto" />
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}