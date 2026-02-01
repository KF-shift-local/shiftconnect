import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  MapPin, 
  Filter, 
  X,
  Loader2
} from 'lucide-react';
import JobCard from '@/components/common/JobCard';

const JOB_TYPES = ['Server', 'Bartender', 'Line Cook', 'Prep Cook', 'Host/Hostess', 'Busser', 'Dishwasher', 'Barista', 'Food Runner', 'Kitchen Manager', 'Other'];
const EMPLOYMENT_TYPES = ['temporary', 'seasonal', 'part-time', 'full-time', 'on-call'];
const CUISINE_TYPES = ['American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian', 'Mediterranean', 'French', 'Korean', 'Seafood', 'Steakhouse', 'BBQ', 'Fine Dining', 'Cafe/Bakery', 'Other'];
const SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night', 'flexible'];

export default function Jobs() {
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState(urlParams.get('q') || '');
  const [location, setLocation] = useState(urlParams.get('location') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobTypes: [],
    employmentTypes: [],
    cuisineTypes: [],
    shiftTypes: [],
    payRange: [0, 50],
    distance: 25,
    urgentOnly: false,
    transitOnly: false
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.JobPosting.filter({ status: 'active' }, '-created_date')
  });

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          job.title?.toLowerCase().includes(query) ||
          job.job_type?.toLowerCase().includes(query) ||
          job.restaurant_name?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Location
      if (location) {
        const loc = location.toLowerCase();
        const matchesLocation = 
          job.city?.toLowerCase().includes(loc) ||
          job.location?.toLowerCase().includes(loc);
        if (!matchesLocation) return false;
      }

      // Job types
      if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.job_type)) {
        return false;
      }

      // Employment types
      if (filters.employmentTypes.length > 0 && !filters.employmentTypes.includes(job.employment_type)) {
        return false;
      }

      // Shift types
      if (filters.shiftTypes.length > 0 && !filters.shiftTypes.includes(job.shift_type)) {
        return false;
      }

      // Cuisine types (from restaurant)
      if (filters.cuisineTypes.length > 0) {
        // We'd need to fetch restaurant data for this, simplified for now
        // In a real implementation, you'd join with restaurant data
      }

      // Pay range
      if (job.hourly_rate_min && (job.hourly_rate_min < filters.payRange[0] || job.hourly_rate_min > filters.payRange[1])) {
        return false;
      }

      // Transit accessible
      if (filters.transitOnly && !job.transit_accessible) {
        return false;
      }

      // Urgent only
      if (filters.urgentOnly && job.urgency === 'normal') {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, location, filters]);

  const toggleJobType = (type) => {
    setFilters(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }));
  };

  const toggleEmploymentType = (type) => {
    setFilters(prev => ({
      ...prev,
      employmentTypes: prev.employmentTypes.includes(type)
        ? prev.employmentTypes.filter(t => t !== type)
        : [...prev.employmentTypes, type]
    }));
  };

  const toggleCuisineType = (type) => {
    setFilters(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(type)
        ? prev.cuisineTypes.filter(t => t !== type)
        : [...prev.cuisineTypes, type]
    }));
  };

  const toggleShiftType = (type) => {
    setFilters(prev => ({
      ...prev,
      shiftTypes: prev.shiftTypes.includes(type)
        ? prev.shiftTypes.filter(t => t !== type)
        : [...prev.shiftTypes, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      jobTypes: [],
      employmentTypes: [],
      cuisineTypes: [],
      shiftTypes: [],
      payRange: [0, 50],
      distance: 25,
      urgentOnly: false,
      transitOnly: false
    });
    setSearchQuery('');
    setLocation('');
  };

  const activeFilterCount = 
    filters.jobTypes.length + 
    filters.employmentTypes.length + 
    filters.cuisineTypes.length +
    filters.shiftTypes.length +
    (filters.payRange[0] > 0 || filters.payRange[1] < 50 ? 1 : 0) + 
    (filters.distance < 25 ? 1 : 0) +
    (filters.urgentOnly ? 1 : 0) +
    (filters.transitOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search jobs, skills, restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-slate-200"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="City or zip code"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-12 border-slate-200"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6 relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-emerald-600 text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mt-4 border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-900">Filters</h3>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Job Types */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Position Type</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {JOB_TYPES.map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={filters.jobTypes.includes(type)}
                            onCheckedChange={() => toggleJobType(type)}
                          />
                          <span className="text-sm text-slate-600">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Employment Types */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Employment Type</h4>
                    <div className="space-y-2">
                      {EMPLOYMENT_TYPES.map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={filters.employmentTypes.includes(type)}
                            onCheckedChange={() => toggleEmploymentType(type)}
                          />
                          <span className="text-sm text-slate-600 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Shift Times */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Time of Day</h4>
                    <div className="space-y-2">
                      {SHIFT_TYPES.map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={filters.shiftTypes.includes(type)}
                            onCheckedChange={() => toggleShiftType(type)}
                          />
                          <span className="text-sm text-slate-600 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Restaurant Type */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Restaurant Type</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {CUISINE_TYPES.map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={filters.cuisineTypes.includes(type)}
                            onCheckedChange={() => toggleCuisineType(type)}
                          />
                          <span className="text-sm text-slate-600">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pay, Distance & Other */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">
                        Pay Range: ${filters.payRange[0]}-${filters.payRange[1]}/hr
                      </h4>
                      <Slider
                        value={filters.payRange}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, payRange: value }))}
                        max={50}
                        step={1}
                        minStepsBetweenThumbs={1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">
                        Max Distance: {filters.distance} miles
                      </h4>
                      <Slider
                        value={[filters.distance]}
                        onValueChange={([value]) => setFilters(prev => ({ ...prev, distance: value }))}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.transitOnly}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, transitOnly: checked }))}
                      />
                      <span className="text-sm text-slate-600">Public transit accessible</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.urgentOnly}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, urgentOnly: checked }))}
                      />
                      <span className="text-sm text-slate-600">Urgent positions only</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            {isLoading ? 'Loading...' : `${filteredJobs.length} jobs found`}
          </p>
          <Select defaultValue="recent">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="pay-high">Highest Pay</SelectItem>
              <SelectItem value="pay-low">Lowest Pay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
              <p className="text-slate-600 mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}