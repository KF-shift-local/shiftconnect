import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Users, 
  Building2, 
  Star, 
  ArrowRight,
  ChefHat,
  Utensils,
  Clock,
  Shield
} from 'lucide-react';
import JobCard from '@/components/common/JobCard';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

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

  const { data: featuredJobs = [] } = useQuery({
    queryKey: ['featuredJobs'],
    queryFn: async () => {
      const [allJobs, bannedRestaurants] = await Promise.all([
        base44.entities.JobPosting.filter({ status: 'active' }, '-created_date', 20),
        base44.entities.Restaurant.filter({ account_status: 'banned' })
      ]);
      const bannedIds = new Set(bannedRestaurants.map(r => r.id));
      return allJobs.filter(job => !bannedIds.has(job.restaurant_id)).slice(0, 6);
    }
  });

  const stats = [
    { icon: Building2, label: 'Local Restaurants', value: '500+' },
    { icon: Users, label: 'Active Workers', value: '2,000+' },
    { icon: Star, label: 'Successful Placements', value: '10,000+' }
  ];

  const features = [
    {
      icon: Clock,
      title: 'Real-Time Availability',
      description: 'Workers update their schedules instantly, restaurants find available staff immediately.'
    },
    {
      icon: Shield,
      title: 'Fair Review System',
      description: 'Both parties review each other simultaneously—reviews only publish when both are complete.'
    },
    {
      icon: ChefHat,
      title: 'Industry Focused',
      description: 'Built specifically for independent restaurants and experienced hospitality professionals.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30">
              For Independent Restaurants
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300"> Temporary Staff</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Connect local restaurants with experienced hospitality workers for temporary, seasonal, and on-call positions.
            </p>

            {/* Search Box */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Job title, skill, or keyword"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 border-0 bg-slate-50 text-lg"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="City or zip code"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-12 h-14 border-0 bg-slate-50 text-lg"
                    />
                  </div>
                  <Link to={createPageUrl(`Jobs?q=${searchQuery}&location=${location}`)}>
                    <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-lg font-medium">
                      Search Jobs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-6 mt-8">
              <Link 
                to={createPageUrl('WorkerOnboarding')}
                className="text-emerald-300 hover:text-emerald-200 font-medium flex items-center gap-2 transition-colors"
              >
                Looking for work? <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to={createPageUrl('RestaurantOnboarding')}
                className="text-emerald-300 hover:text-emerald-200 font-medium flex items-center gap-2 transition-colors"
              >
                Hiring staff? <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-8 z-10 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <stat.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A simple, fair platform designed specifically for the hospitality industry.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="border-slate-200 hover:border-emerald-200 transition-colors group">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-6 transition-colors">
                  <feature.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Latest Opportunities</h2>
                <p className="text-slate-600">Fresh positions from local restaurants</p>
              </div>
              <Link to={createPageUrl('Jobs')}>
                <Button variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                  View All Jobs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-10 relative">
              <Utensils className="w-12 h-12 mb-6 text-emerald-200" />
              <h3 className="text-2xl font-bold mb-4">For Workers</h3>
              <p className="text-emerald-100 mb-6 leading-relaxed">
                Create your profile, set your availability, and get hired by local restaurants that need your skills.
              </p>
              <Link to={createPageUrl('WorkerOnboarding')}>
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
                  Create Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-10 relative">
              <Building2 className="w-12 h-12 mb-6 text-slate-300" />
              <h3 className="text-2xl font-bold mb-4">For Restaurants</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Post your staffing needs and find qualified workers ready to help when you need them most.
              </p>
              <Link to={createPageUrl(restaurant ? 'PostJob' : 'RestaurantOnboarding')}>
                <Button className="bg-white text-slate-800 hover:bg-slate-100">
                  {restaurant ? 'Post a Job' : (user ? 'Create Restaurant Profile' : 'Create Profile')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}