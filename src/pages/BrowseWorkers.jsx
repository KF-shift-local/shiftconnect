import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  MapPin, 
  Filter, 
  X,
  Loader2,
  Users
} from 'lucide-react';
import WorkerCard from '@/components/common/WorkerCard';

const JOB_TYPES = ['Server', 'Bartender', 'Line Cook', 'Prep Cook', 'Host/Hostess', 'Busser', 'Dishwasher', 'Barista', 'Food Runner', 'Kitchen Manager'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function BrowseWorkers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobTypes: [],
    availableDays: [],
    maxRate: 50,
    hasExperience: false
  });

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: () => base44.entities.WorkerProfile.list('-created_date')
  });

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          worker.full_name?.toLowerCase().includes(query) ||
          worker.headline?.toLowerCase().includes(query) ||
          worker.skills?.some(s => s.toLowerCase().includes(query)) ||
          worker.preferred_job_types?.some(t => t.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Location
      if (location) {
        const loc = location.toLowerCase();
        if (!worker.location?.toLowerCase().includes(loc)) return false;
      }

      // Job types
      if (filters.jobTypes.length > 0) {
        const hasMatchingType = filters.jobTypes.some(type => 
          worker.preferred_job_types?.includes(type)
        );
        if (!hasMatchingType) return false;
      }

      // Available days
      if (filters.availableDays.length > 0) {
        const hasMatchingDay = filters.availableDays.every(day =>
          worker.availability?.[day]?.available
        );
        if (!hasMatchingDay) return false;
      }

      // Max rate
      if (worker.hourly_rate_min && worker.hourly_rate_min > filters.maxRate) {
        return false;
      }

      // Has experience
      if (filters.hasExperience && (!worker.experience || worker.experience.length === 0)) {
        return false;
      }

      return true;
    });
  }, [workers, searchQuery, location, filters]);

  const toggleJobType = (type) => {
    setFilters(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }));
  };

  const toggleDay = (day) => {
    setFilters(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const clearFilters = () => {
    setFilters({
      jobTypes: [],
      availableDays: [],
      maxRate: 50,
      hasExperience: false
    });
    setSearchQuery('');
    setLocation('');
  };

  const activeFilterCount = 
    filters.jobTypes.length + 
    filters.availableDays.length + 
    (filters.maxRate < 50 ? 1 : 0) + 
    (filters.hasExperience ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search workers by name, skills..."
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

          {/* Filters */}
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
                      className="text-slate-500"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Position Types */}
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

                  {/* Availability */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Available Days</h4>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => (
                        <Badge
                          key={day}
                          variant={filters.availableDays.includes(day) ? 'default' : 'outline'}
                          className={`cursor-pointer capitalize ${
                            filters.availableDays.includes(day)
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : ''
                          }`}
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Rate & Experience */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">
                        Max Rate: ${filters.maxRate}/hr
                      </h4>
                      <Slider
                        value={[filters.maxRate]}
                        onValueChange={([value]) => setFilters(prev => ({ ...prev, maxRate: value }))}
                        max={50}
                        step={1}
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.hasExperience}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasExperience: checked }))}
                      />
                      <span className="text-sm text-slate-600">Has prior experience</span>
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
            {isLoading ? 'Loading...' : `${filteredWorkers.length} workers found`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredWorkers.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No workers found</h3>
              <p className="text-slate-600 mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}