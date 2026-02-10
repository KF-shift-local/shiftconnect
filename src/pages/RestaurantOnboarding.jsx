import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2,
  MapPin,
  Upload,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

const CUISINE_TYPES = [
  'American', 'Italian', 'Mexican', 'Asian Fusion', 'Japanese', 'Chinese',
  'Indian', 'French', 'Mediterranean', 'Thai', 'Greek', 'Spanish',
  'Southern', 'BBQ', 'Seafood', 'Steakhouse', 'Vegetarian/Vegan',
  'Pizza', 'Casual Dining', 'Fine Dining', 'Cafe/Bakery', 'Bar & Grill', 'Other'
];

export default function RestaurantOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine_type: '',
    logo_url: '',
    cover_photo_url: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    established_year: '',
    employee_count: ''
  });
  const [createJob, setCreateJob] = useState(false);
  const [jobData, setJobData] = useState({
    title: '',
    job_type: '',
    employment_type: 'temporary',
    hourly_rate_min: '',
    start_date: ''
  });
  const [uploading, setUploading] = useState({ logo: false, cover: false });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: existingRestaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const { data: existingWorkerProfile } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (existingRestaurant) {
      navigate(createPageUrl('RestaurantDashboard'));
    }
  }, [existingRestaurant, navigate]);

  useEffect(() => {
    if (existingWorkerProfile && user?.role !== 'admin') {
      navigate(createPageUrl('WorkerDashboard'));
    }
  }, [existingWorkerProfile, user, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        phone: user.preferred_city ? '' : prev.phone,
        city: user.preferred_city || '',
        state: user.preferred_state || '',
      }));
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const restaurant = await base44.entities.Restaurant.create({
        ...formData,
        owner_id: user.email,
        established_year: parseInt(formData.established_year) || null,
        average_rating: 0,
        total_reviews: 0,
        total_hires: 0,
        verified: false
      });

      if (createJob && jobData.title && jobData.job_type) {
        await base44.entities.JobPosting.create({
          restaurant_id: restaurant.id,
          restaurant_name: formData.name,
          restaurant_logo: formData.logo_url,
          title: jobData.title,
          job_type: jobData.job_type,
          employment_type: jobData.employment_type,
          hourly_rate_min: parseFloat(jobData.hourly_rate_min) || null,
          start_date: jobData.start_date || null,
          location: formData.address,
          city: formData.city,
          status: 'active',
          positions_available: 1,
          positions_filled: 0
        });
      }

      return restaurant;
    },
    onSuccess: () => {
      navigate(createPageUrl('RestaurantDashboard'));
    }
  });

  const canProceed = () => {
    if (step === 1) return formData.name && formData.cuisine_type;
    if (step === 2) return formData.city && formData.state;
    if (step === 3) return formData.phone && formData.email;
    return true;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading({ ...uploading, logo: true });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, logo_url: file_url });
    setUploading({ ...uploading, logo: false });
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading({ ...uploading, cover: true });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, cover_photo_url: file_url });
    setUploading({ ...uploading, cover: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Register Your Restaurant</h1>
          <p className="text-slate-600">Start hiring temporary and seasonal staff today</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  s < step ? 'bg-emerald-600 text-white' :
                  s === step ? 'bg-emerald-600 text-white' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {s}
                </div>
                {s < 4 && <div className={`w-12 h-1 ${s < step ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <p className="text-sm font-medium text-slate-700">
              {step === 1 && 'Basic Information'}
              {step === 2 && 'Location & Branding'}
              {step === 3 && 'Contact Details'}
              {step === 4 && 'Create First Job (Optional)'}
            </p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardContent className="p-8 space-y-8">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-700">Restaurant Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="The Local Bistro"
                    className="border-slate-200"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700">Cuisine Type *</Label>
                  <Select
                    value={formData.cuisine_type}
                    onValueChange={(value) => setFormData({ ...formData, cuisine_type: value })}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUISINE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Year Established</Label>
                    <Input
                      type="number"
                      value={formData.established_year}
                      onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                      placeholder="2020"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Team Size</Label>
                    <Select
                      value={formData.employee_count}
                      onValueChange={(value) => setFormData({ ...formData, employee_count: value })}
                    >
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-25">11-25</SelectItem>
                        <SelectItem value="26-50">26-50</SelectItem>
                        <SelectItem value="51-100">51-100</SelectItem>
                        <SelectItem value="100+">100+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell workers about your restaurant..."
                    className="min-h-[100px] border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location & Branding */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-slate-700">Cover Photo (Optional)</Label>
                  <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {formData.cover_photo_url ? (
                      <img src={formData.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      {uploading.cover ? (
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      ) : (
                        <Upload className="w-6 h-6 text-white" />
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-slate-700">Logo (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                      <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-700">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {uploading.logo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Street Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-slate-700">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">State *</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NY"
                      maxLength={2}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700">Zip Code</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-700">Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@restaurant.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Website (Optional)</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.restaurant.com"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Quick Job Post */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-800">
                    <strong>Optional:</strong> Create your first job posting now, or skip and do it later from your dashboard.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="createJob"
                    checked={createJob}
                    onChange={(e) => setCreateJob(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="createJob" className="text-slate-700 cursor-pointer">
                    Create a job posting now
                  </Label>
                </div>

                {createJob && (
                  <div className="space-y-4 pl-7">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Position Title</Label>
                      <Input
                        value={jobData.title}
                        onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                        placeholder="e.g., Server, Bartender"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Job Type</Label>
                      <Select
                        value={jobData.job_type}
                        onValueChange={(value) => setJobData({ ...jobData, job_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Server">Server</SelectItem>
                          <SelectItem value="Bartender">Bartender</SelectItem>
                          <SelectItem value="Line Cook">Line Cook</SelectItem>
                          <SelectItem value="Host/Hostess">Host/Hostess</SelectItem>
                          <SelectItem value="Busser">Busser</SelectItem>
                          <SelectItem value="Dishwasher">Dishwasher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700">Hourly Rate</Label>
                        <Input
                          type="number"
                          value={jobData.hourly_rate_min}
                          onChange={(e) => setJobData({ ...jobData, hourly_rate_min: e.target.value })}
                          placeholder="15"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700">Start Date</Label>
                        <Input
                          type="date"
                          value={jobData.start_date}
                          onChange={(e) => setJobData({ ...jobData, start_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}