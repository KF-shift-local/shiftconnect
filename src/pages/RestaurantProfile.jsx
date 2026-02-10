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
  Phone,
  Mail,
  Globe,
  Building2,
  Users,
  Calendar,
  CheckCircle,
  Loader2,
  Briefcase,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';
import { format } from 'date-fns';
import StarRating from '@/components/ui/StarRating';
import JobCard from '@/components/common/JobCard';
import StartConversationButton from '@/components/messaging/StartConversationButton';
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar';

export default function RestaurantProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: workerProfile } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ id: restaurantId });
      return restaurants[0];
    },
    enabled: !!restaurantId
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['restaurantJobs', restaurantId],
    queryFn: () => base44.entities.JobPosting.filter({ 
      restaurant_id: restaurantId,
      status: 'active'
    }, '-created_date'),
    enabled: !!restaurantId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurantReviews', restaurantId],
    queryFn: () => base44.entities.Review.filter({ 
      reviewee_id: restaurantId, 
      is_published: true 
    }, '-created_date'),
    enabled: !!restaurantId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Restaurant Not Found</h2>
            <p className="text-slate-600 mb-4">This restaurant doesn't exist or has been removed.</p>
            <Link to={createPageUrl('Jobs')}>
              <Button>Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cover Photo */}
      <div 
        className="relative h-64"
        style={{ 
          background: restaurant.brand_color 
            ? `linear-gradient(to bottom right, ${restaurant.brand_color}dd, ${restaurant.brand_color}99)` 
            : 'linear-gradient(to bottom right, #334155, #1e293b)'
        }}
      >
        {restaurant.cover_photo_url && (
          <img
            src={restaurant.cover_photo_url}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link 
            to={createPageUrl('Jobs')}
            className="inline-flex items-center text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <Building2 className="w-12 h-12 text-slate-300" />
            </div>
          )}

          <div className="flex-1 pt-2">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">{restaurant.name}</h1>
              {restaurant.verified && (
                <Badge className="bg-blue-100 text-blue-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {restaurant.cuisine_type && (
                <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
              )}
              {restaurant.average_rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={restaurant.average_rating} size="md" />
                  <span className="text-slate-600">
                    {restaurant.average_rating.toFixed(1)} ({restaurant.total_reviews} reviews)
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {restaurant.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {restaurant.address}, {restaurant.city}, {restaurant.state}
                </span>
              )}
              {restaurant.established_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Est. {restaurant.established_year}
                </span>
              )}
              {restaurant.total_hires > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-emerald-500" />
                  {restaurant.total_hires} hires
                </span>
              )}
            </div>

            {user && workerProfile && (
              <div className="mt-4">
                <StartConversationButton
                  workerProfile={workerProfile}
                  restaurant={restaurant}
                  currentUser={user}
                  currentUserType="worker"
                  className="bg-emerald-600 hover:bg-emerald-700"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {(restaurant.description || restaurant.about_us) && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">About Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {restaurant.description && (
                    <p className="text-slate-600 leading-relaxed">
                      {restaurant.description}
                    </p>
                  )}
                  {restaurant.about_us && (
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {restaurant.about_us}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Active Jobs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Open Positions</h2>
                <Badge variant="secondary">{jobs.length} jobs</Badge>
              </div>
              {jobs.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="p-8 text-center">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No open positions at the moment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Reviews from Workers</CardTitle>
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
                      {review.published_date && (
                        <p className="text-xs text-slate-400 mt-2">
                          {format(new Date(review.published_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hiring Calendar */}
            {jobs.length > 0 && (
              <AvailabilityCalendar 
                jobPostings={jobs}
                type="restaurant"
              />
            )}
            
            {/* Contact */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurant.phone && (
                  <a 
                    href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-3 text-slate-600 hover:text-emerald-600 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{restaurant.phone}</span>
                  </a>
                )}
                {restaurant.email && (
                  <a 
                    href={`mailto:${restaurant.email}`}
                    className="flex items-center gap-3 text-slate-600 hover:text-emerald-600 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>{restaurant.email}</span>
                  </a>
                )}
                {restaurant.website && (
                  <a 
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-600 hover:text-emerald-600 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span>Website</span>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            {restaurant.social_media && Object.values(restaurant.social_media).some(v => v) && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Follow Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {restaurant.social_media.facebook && (
                      <a
                        href={restaurant.social_media.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {restaurant.social_media.instagram && (
                      <a
                        href={restaurant.social_media.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {restaurant.social_media.twitter && (
                      <a
                        href={restaurant.social_media.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 hover:bg-sky-100 transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {restaurant.social_media.linkedin && (
                      <a
                        href={restaurant.social_media.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {restaurant.social_media.tiktok && (
                      <a
                        href={restaurant.social_media.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurant.employee_count && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Team Size</span>
                    <span className="font-medium text-slate-900">{restaurant.employee_count}</span>
                  </div>
                )}
                {restaurant.established_year && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Years in Business</span>
                    <span className="font-medium text-slate-900">
                      {new Date().getFullYear() - restaurant.established_year} years
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Open Positions</span>
                  <span className="font-medium text-slate-900">{jobs.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}