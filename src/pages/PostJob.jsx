import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  Loader2,
  Plus,
  X,
  DollarSign,
  Clock,
  Calendar,
  Zap
} from 'lucide-react';

const JOB_TYPES = ['Server', 'Bartender', 'Line Cook', 'Prep Cook', 'Host/Hostess', 'Busser', 'Dishwasher', 'Barista', 'Food Runner', 'Kitchen Manager', 'Other'];
const EMPLOYMENT_TYPES = ['temporary', 'seasonal', 'part-time', 'full-time', 'on-call'];
const DURATION_TYPES = ['one-time', 'few-days', '1-week', '2-weeks', '1-month', '2-3-months', 'seasonal', 'ongoing'];
const EXPERIENCE_LEVELS = ['none', '1-year', '2-years', '3-years', '5-years'];
const SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night', 'flexible'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const COMMON_REQUIREMENTS = [
  'Must be 18 or older',
  'Valid work authorization',
  'Reliable transportation',
  'Ability to stand for extended periods',
  'Ability to lift 25+ lbs',
  'Flexible schedule',
  'Weekend availability',
  'Holiday availability'
];

const COMMON_CERTIFICATIONS = [
  'ServSafe Food Handler',
  'ServSafe Manager',
  'TIPS Certified',
  'Food Handler Card',
  'Alcohol Server Certification',
  'CPR/First Aid'
];

const COMMON_BENEFITS = [
  'Meal discounts',
  'Free shift meals',
  'Flexible scheduling',
  'Weekly pay',
  'Tips',
  'Potential for permanent hire',
  'Training provided'
];

export default function PostJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: '',
    employment_type: 'temporary',
    hourly_rate_min: '',
    hourly_rate_max: '',
    tips_included: false,
    hours_per_week_min: '',
    hours_per_week_max: '',
    schedule: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    shift_type: 'flexible',
    start_date: '',
    end_date: '',
    duration_type: '',
    requirements: [],
    experience_required: 'none',
    certifications_required: [],
    benefits: [],
    positions_available: 1,
    urgency: 'normal',
    transit_accessible: false,
    transit_info: ''
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.JobPosting.create({
        ...formData,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo: restaurant.logo_url,
        hourly_rate_min: parseFloat(formData.hourly_rate_min) || 0,
        hourly_rate_max: parseFloat(formData.hourly_rate_max) || parseFloat(formData.hourly_rate_min) || 0,
        hours_per_week_min: parseInt(formData.hours_per_week_min) || 0,
        hours_per_week_max: parseInt(formData.hours_per_week_max) || parseInt(formData.hours_per_week_min) || 0,
        positions_available: parseInt(formData.positions_available) || 1,
        positions_filled: 0,
        status: 'active',
        location: restaurant.address,
        city: restaurant.city
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('RestaurantDashboard'));
    }
  });

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: !prev.schedule[day]
      }
    }));
  };

  const toggleItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const addCustomItem = (field, value, setterFn) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setterFn('');
    }
  };

  const removeItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(i => i !== item)
    }));
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading restaurant...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Post a New Job</h1>
          <p className="text-slate-600">Find the right temporary or seasonal staff for {restaurant.name}</p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Experienced Line Cook"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position Type *</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and what makes this a great opportunity..."
                  className="min-h-[120px] border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={formData.duration_type}
                    onValueChange={(value) => setFormData({ ...formData, duration_type: value })}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type.replace(/-/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label>Urgency Level</Label>
                <div className="flex gap-2">
                  {['normal', 'urgent', 'immediate'].map((level) => (
                    <Badge
                      key={level}
                      variant={formData.urgency === level ? 'default' : 'outline'}
                      className={`cursor-pointer capitalize ${
                        formData.urgency === level
                          ? level === 'immediate' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : level === 'urgent' 
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-slate-600 hover:bg-slate-700'
                          : ''
                      }`}
                      onClick={() => setFormData({ ...formData, urgency: level })}
                    >
                      {level === 'immediate' && <Zap className="w-3 h-3 mr-1" />}
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Public Transportation</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.transit_accessible}
                    onChange={(e) => setFormData({ ...formData, transit_accessible: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Accessible by public transit</span>
                </div>
                {formData.transit_accessible && (
                  <Input
                    value={formData.transit_info}
                    onChange={(e) => setFormData({ ...formData, transit_info: e.target.value })}
                    placeholder="e.g. Bus lines 15, 22 / 2 blocks from Metro station"
                    className="border-slate-200"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Min Rate ($/hr) *</Label>
                  <Input
                    type="number"
                    value={formData.hourly_rate_min}
                    onChange={(e) => setFormData({ ...formData, hourly_rate_min: e.target.value })}
                    placeholder="18"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Rate ($/hr)</Label>
                  <Input
                    type="number"
                    value={formData.hourly_rate_max}
                    onChange={(e) => setFormData({ ...formData, hourly_rate_max: e.target.value })}
                    placeholder="25"
                    className="border-slate-200"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3 pt-6">
                  <Switch
                    checked={formData.tips_included}
                    onCheckedChange={(checked) => setFormData({ ...formData, tips_included: checked })}
                  />
                  <Label>Tips Included</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Benefits</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_BENEFITS.map((benefit) => (
                    <Badge
                      key={benefit}
                      variant={formData.benefits.includes(benefit) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        formData.benefits.includes(benefit)
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'hover:bg-emerald-50'
                      }`}
                      onClick={() => toggleItem('benefits', benefit)}
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add custom benefit"
                    className="border-slate-200"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomItem('benefits', newBenefit, setNewBenefit))}
                  />
                  <Button variant="outline" onClick={() => addCustomItem('benefits', newBenefit, setNewBenefit)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Min Hours/Week</Label>
                  <Input
                    type="number"
                    value={formData.hours_per_week_min}
                    onChange={(e) => setFormData({ ...formData, hours_per_week_min: e.target.value })}
                    placeholder="20"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Hours/Week</Label>
                  <Input
                    type="number"
                    value={formData.hours_per_week_max}
                    onChange={(e) => setFormData({ ...formData, hours_per_week_max: e.target.value })}
                    placeholder="40"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift Type</Label>
                  <Select
                    value={formData.shift_type}
                    onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Positions Available</Label>
                  <Input
                    type="number"
                    value={formData.positions_available}
                    onChange={(e) => setFormData({ ...formData, positions_available: e.target.value })}
                    min="1"
                    className="border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Days Needed</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <Badge
                      key={day}
                      variant={formData.schedule[day] ? 'default' : 'outline'}
                      className={`cursor-pointer capitalize px-4 py-2 ${
                        formData.schedule[day]
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'hover:bg-emerald-50'
                      }`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="border-slate-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Experience Required</Label>
                <Select
                  value={formData.experience_required}
                  onValueChange={(value) => setFormData({ ...formData, experience_required: value })}
                >
                  <SelectTrigger className="border-slate-200 w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No experience required</SelectItem>
                    <SelectItem value="1-year">1+ year</SelectItem>
                    <SelectItem value="2-years">2+ years</SelectItem>
                    <SelectItem value="3-years">3+ years</SelectItem>
                    <SelectItem value="5-years">5+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Job Requirements</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_REQUIREMENTS.map((req) => (
                    <Badge
                      key={req}
                      variant={formData.requirements.includes(req) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        formData.requirements.includes(req)
                          ? 'bg-slate-700 hover:bg-slate-800'
                          : 'hover:bg-slate-100'
                      }`}
                      onClick={() => toggleItem('requirements', req)}
                    >
                      {req}
                    </Badge>
                  ))}
                </div>
                {formData.requirements.filter(r => !COMMON_REQUIREMENTS.includes(r)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.requirements.filter(r => !COMMON_REQUIREMENTS.includes(r)).map((req) => (
                      <Badge key={req} className="bg-slate-700">
                        {req}
                        <button onClick={() => removeItem('requirements', req)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add custom requirement"
                    className="border-slate-200"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomItem('requirements', newRequirement, setNewRequirement))}
                  />
                  <Button variant="outline" onClick={() => addCustomItem('requirements', newRequirement, setNewRequirement)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Required Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CERTIFICATIONS.map((cert) => (
                    <Badge
                      key={cert}
                      variant={formData.certifications_required.includes(cert) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        formData.certifications_required.includes(cert)
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'hover:bg-blue-50'
                      }`}
                      onClick={() => toggleItem('certifications_required', cert)}
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.title || !formData.job_type || !formData.hourly_rate_min || saveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Job'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}