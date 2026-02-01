import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar, 
  Zap,
  Building2,
  CheckCircle,
  ArrowLeft,
  Share2,
  Bookmark,
  Loader2,
  Briefcase,
  Users,
  Train,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import StarRating from '@/components/ui/StarRating';
import ScheduleComparison from '@/components/calendar/ScheduleComparison';

export default function JobDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const [availableDate, setAvailableDate] = useState('');
  const [customAnswers, setCustomAnswers] = useState({});
  const queryClient = useQueryClient();

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.JobPosting.filter({ id: jobId });
      return jobs[0];
    },
    enabled: !!jobId
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', job?.restaurant_id],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ id: job.restaurant_id });
      return restaurants[0];
    },
    enabled: !!job?.restaurant_id
  });

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

  const { data: existingApplication } = useQuery({
    queryKey: ['existingApplication', jobId, workerProfile?.id],
    queryFn: async () => {
      const apps = await base44.entities.Application.filter({ 
        job_id: jobId, 
        worker_id: workerProfile.id 
      });
      return apps[0];
    },
    enabled: !!jobId && !!workerProfile?.id
  });

  const { data: customQuestions = [] } = useQuery({
    queryKey: ['applicationQuestions', job?.restaurant_id],
    queryFn: () => base44.entities.ApplicationQuestion.filter({ 
      restaurant_id: job.restaurant_id,
      is_active: true 
    }, 'order'),
    enabled: !!job?.restaurant_id
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const application = await base44.entities.Application.create({
        job_id: jobId,
        job_title: job.title,
        worker_id: workerProfile.id,
        worker_name: workerProfile.full_name,
        worker_photo: workerProfile.photo_url,
        restaurant_id: job.restaurant_id,
        restaurant_name: job.restaurant_name,
        cover_message: coverMessage,
        available_start_date: availableDate,
        custom_answers: customAnswers,
        status: 'pending'
      });
      
      // Create notification for restaurant owner
      await base44.entities.Notification.create({
        recipient_email: job.created_by,
        recipient_type: 'restaurant',
        title: 'New Application Received',
        message: `${workerProfile.full_name} applied for ${job.title}`,
        type: 'application_received',
        link_url: `/ManageApplications`,
        priority: job.urgency === 'immediate' ? 'high' : 'medium',
        related_entity_id: application.id
      });
      
      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['existingApplication']);
      setApplyOpen(false);
      setCoverMessage('');
      setAvailableDate('');
      setCustomAnswers({});
    }
  });

  if (jobLoading || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const urgencyColors = {
    immediate: 'bg-red-100 text-red-700 border-red-200',
    urgent: 'bg-amber-100 text-amber-700 border-amber-200',
    normal: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const scheduleDays = job.schedule 
    ? Object.entries(job.schedule).filter(([_, v]) => v).map(([d]) => d.slice(0, 3))
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            to={createPageUrl('Jobs')}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-shrink-0">
              {job.restaurant_logo ? (
                <img
                  src={job.restaurant_logo}
                  alt={job.restaurant_name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-slate-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{job.title}</h1>
                {job.urgency && job.urgency !== 'normal' && (
                  <Badge className={`${urgencyColors[job.urgency]} border`}>
                    <Zap className="w-3 h-3 mr-1" />
                    {job.urgency}
                  </Badge>
                )}
              </div>
              
              <Link 
                to={createPageUrl(`RestaurantProfile?id=${job.restaurant_id}`)}
                className="text-lg text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {job.restaurant_name}
              </Link>

              {restaurant?.average_rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={restaurant.average_rating} size="sm" />
                  <span className="text-sm text-slate-500">
                    ({restaurant.total_reviews || 0} reviews)
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {job.employment_type}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {job.job_type}
                </Badge>
                {job.shift_type && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {job.shift_type} shift
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Link to={createPageUrl(`JobMap?id=${jobId}`)}>
                <Button variant="outline" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Map View
                </Button>
              </Link>
              <Button variant="outline" size="icon">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Details */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Pay Rate</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ${job.hourly_rate_min}
                      {job.hourly_rate_max && job.hourly_rate_max !== job.hourly_rate_min && `-${job.hourly_rate_max}`}/hr
                    </p>
                    {job.tips_included && (
                      <p className="text-xs text-emerald-600">+ tips</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Hours</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {job.hours_per_week_min}-{job.hours_per_week_max}/wk
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <p className="font-semibold text-slate-900 capitalize">
                      {job.duration_type?.replace(/-/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Location</span>
                    </div>
                    <p className="font-semibold text-slate-900">{job.city || 'TBD'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            {scheduleDays.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Work Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                      <div
                        key={day}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                          scheduleDays.includes(day)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  {job.start_date && (
                    <p className="mt-4 text-sm text-slate-600">
                      <span className="font-medium">Start Date:</span>{' '}
                      {format(new Date(job.start_date), 'MMMM d, yyyy')}
                      {job.end_date && ` - ${format(new Date(job.end_date), 'MMMM d, yyyy')}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Schedule Comparison */}
            {workerProfile && job.schedule && (
              <ScheduleComparison
                workerAvailability={workerProfile.availability}
                jobSchedule={job.schedule}
                jobTitle={job.title}
              />
            )}

            {/* Description */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {job.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {(job.requirements?.length > 0 || job.certifications_required?.length > 0 || job.experience_required) && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.experience_required && job.experience_required !== 'none' && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-600">
                        {job.experience_required.replace('-', ' ')} experience required
                      </span>
                    </div>
                  )}
                  {job.requirements?.length > 0 && (
                    <div className="space-y-2">
                      {job.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-600">{req}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {job.certifications_required?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Required Certifications:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.certifications_required.map((cert, idx) => (
                          <Badge key={idx} variant="outline">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {job.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-600">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="border-slate-200 sticky top-24">
              <CardContent className="p-6">
                {existingApplication ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Application Submitted</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Status: <span className="capitalize">{existingApplication.status}</span>
                    </p>
                    <Link to={createPageUrl('MyApplications')}>
                      <Button variant="outline" className="w-full">
                        View My Applications
                      </Button>
                    </Link>
                  </div>
                ) : workerProfile ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-slate-900">
                        ${job.hourly_rate_min}
                        {job.hourly_rate_max && job.hourly_rate_max !== job.hourly_rate_min && `-${job.hourly_rate_max}`}
                      </div>
                      <p className="text-slate-500">per hour {job.tips_included && '+ tips'}</p>
                    </div>
                    <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg">
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Apply for {job.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                          <div className="space-y-2">
                            <Label>Cover Message</Label>
                            <Textarea
                              value={coverMessage}
                              onChange={(e) => setCoverMessage(e.target.value)}
                              placeholder="Introduce yourself and explain why you're a great fit..."
                              className="min-h-[120px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Available Start Date</Label>
                            <Input
                              type="date"
                              value={availableDate}
                              onChange={(e) => setAvailableDate(e.target.value)}
                            />
                          </div>

                          {customQuestions.map((question) => (
                            <div key={question.id} className="space-y-2">
                              <Label>
                                {question.question_text}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                              {question.question_type === 'text' && (
                                <Input
                                  value={customAnswers[question.id] || ''}
                                  onChange={(e) => setCustomAnswers({...customAnswers, [question.id]: e.target.value})}
                                  required={question.required}
                                />
                              )}
                              {question.question_type === 'textarea' && (
                                <Textarea
                                  value={customAnswers[question.id] || ''}
                                  onChange={(e) => setCustomAnswers({...customAnswers, [question.id]: e.target.value})}
                                  className="min-h-[80px]"
                                  required={question.required}
                                />
                              )}
                              {question.question_type === 'yes_no' && (
                                <select
                                  value={customAnswers[question.id] || ''}
                                  onChange={(e) => setCustomAnswers({...customAnswers, [question.id]: e.target.value})}
                                  className="w-full h-9 px-3 py-1 rounded-md border border-slate-200 bg-white text-sm"
                                  required={question.required}
                                >
                                  <option value="">Select...</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              )}
                              {question.question_type === 'multiple_choice' && (
                                <select
                                  value={customAnswers[question.id] || ''}
                                  onChange={(e) => setCustomAnswers({...customAnswers, [question.id]: e.target.value})}
                                  className="w-full h-9 px-3 py-1 rounded-md border border-slate-200 bg-white text-sm"
                                  required={question.required}
                                >
                                  <option value="">Select...</option>
                                  {question.options?.map((option, idx) => (
                                    <option key={idx} value={option}>{option}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ))}

                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => applyMutation.mutate()}
                            disabled={applyMutation.isPending}
                          >
                            {applyMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Application'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Create a Profile to Apply</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Set up your worker profile to start applying for jobs.
                    </p>
                    <Link to={createPageUrl('WorkerOnboarding')}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Create Profile
                      </Button>
                    </Link>
                  </div>
                )}

                {job.positions_available && (
                  <p className="text-sm text-center text-slate-500 mt-4">
                    {job.positions_available - (job.positions_filled || 0)} of {job.positions_available} positions available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Transit Info */}
            {job.transit_accessible && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Train className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">Public Transit Accessible</p>
                      {job.transit_info && (
                        <p className="text-sm text-blue-700">{job.transit_info}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Restaurant Info */}
            {restaurant && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">About the Restaurant</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link 
                    to={createPageUrl(`RestaurantProfile?id=${restaurant.id}`)}
                    className="block hover:bg-slate-50 -mx-6 px-6 py-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {restaurant.logo_url ? (
                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{restaurant.name}</p>
                        {restaurant.cuisine_type && (
                          <p className="text-sm text-slate-500">{restaurant.cuisine_type}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                  {restaurant.description && (
                    <p className="text-sm text-slate-600 mt-4 line-clamp-3">
                      {restaurant.description}
                    </p>
                  )}
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {restaurant.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{restaurant.address}, {restaurant.city}</span>
                      </div>
                    )}
                    {restaurant.total_hires > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{restaurant.total_hires} successful hires</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}