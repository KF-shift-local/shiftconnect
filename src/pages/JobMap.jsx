import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  DollarSign,
  Clock,
  Train,
  Loader2
} from 'lucide-react';
import LocationMap from '@/components/maps/LocationMap';

export default function JobMap() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  const { data: job, isLoading } = useQuery({
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

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          setLocationError('Enable location access to see your position');
        }
      );
    }
  }, []);

  if (isLoading || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Default location if restaurant doesn't have coordinates (use city center approximation)
  const restaurantLocation = restaurant?.latitude && restaurant?.longitude 
    ? [restaurant.latitude, restaurant.longitude]
    : [37.7749, -122.4194]; // Default to SF

  const distance = userLocation && restaurantLocation 
    ? calculateDistance(userLocation[0], userLocation[1], restaurantLocation[0], restaurantLocation[1])
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
        <p className="text-slate-600 mb-6">{job.restaurant_name}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <LocationMap
              restaurantLocation={restaurantLocation}
              userLocation={userLocation}
              transitInfo={job.transit_accessible ? job.transit_info : null}
              height="600px"
            />
            
            {locationError && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  {locationError}
                </p>
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-4">
            {/* Location Details */}
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Location</h3>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5" />
                    <div>
                      <p>{restaurant?.address}</p>
                      <p>{restaurant?.city}, {restaurant?.state} {restaurant?.zip_code}</p>
                    </div>
                  </div>
                </div>

                {distance && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Distance</h3>
                    <p className="text-sm text-slate-600">{distance.toFixed(1)} miles from you</p>
                  </div>
                )}

                {job.transit_accessible && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Train className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 text-sm">Public Transit Accessible</p>
                        {job.transit_info && (
                          <p className="text-xs text-blue-700 mt-1">{job.transit_info}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Summary */}
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Job Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>
                        ${job.hourly_rate_min}-${job.hourly_rate_max}/hr
                        {job.tips_included && ' + tips'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>{job.hours_per_week_min}-{job.hours_per_week_max} hrs/wk</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {job.employment_type}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    {job.job_type}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  View Full Details
                </Button>
              </Link>
              {restaurant?.address && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address + ', ' + restaurant.city + ', ' + restaurant.state)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}