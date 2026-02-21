import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Upload,
  Loader2,
  X,
  Plus,
  User,
  Save,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import AvailabilitySelector from '@/components/common/AvailabilitySelector';
import ExperienceForm from '@/components/common/ExperienceForm';

const SKILLS = [
  'Food Preparation', 'Cooking', 'Grilling', 'Baking', 'Plating',
  'Customer Service', 'POS Systems', 'Cash Handling', 'Wine Knowledge',
  'Cocktail Making', 'Espresso Drinks', 'Food Safety', 'Sanitation',
  'Team Leadership', 'Inventory Management', 'Opening/Closing'
];

const JOB_TYPES = ['Server', 'Bartender', 'Line Cook', 'Prep Cook', 'Host/Hostess', 'Busser', 'Dishwasher', 'Barista', 'Food Runner', 'Kitchen Manager'];

const BRAND_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' }
];

export default function EditWorkerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(null);
  const [newCertification, setNewCertification] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (profile && !formData) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        photo_url: profile.photo_url || '',
        cover_photo_url: profile.cover_photo_url || '',
        brand_color: profile.brand_color || '#10b981',
        theme_style: profile.theme_style || 'modern',
        headline: profile.headline || '',
        bio: profile.bio || '',
        resume_url: profile.resume_url || '',
        work_authorization_status: profile.work_authorization_status || '',
        work_authorization_document_url: profile.work_authorization_document_url || '',
        work_authorization_expiry: profile.work_authorization_expiry || '',
        experience: profile.experience || [],
        skills: profile.skills || [],
        certifications: profile.certifications || [],
        availability: profile.availability || {},
        available_start_date: profile.available_start_date || '',
        preferred_job_types: profile.preferred_job_types || [],
        hourly_rate_min: profile.hourly_rate_min || '',
        location: profile.location || '',
        willing_to_travel_miles: profile.willing_to_travel_miles || 10
      });
    }
  }, [profile, formData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.WorkerProfile.update(profile.id, {
        ...formData,
        hourly_rate_min: parseFloat(formData.hourly_rate_min) || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workerProfile']);
      navigate(createPageUrl('WorkerDashboard'));
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, resume_url: file_url }));
    setUploading(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, cover_photo_url: file_url }));
    setUploading(false);
  };

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleJobType = (type) => {
    setFormData(prev => ({
      ...prev,
      preferred_job_types: prev.preferred_job_types.includes(type)
        ? prev.preferred_job_types.filter(t => t !== type)
        : [...prev.preferred_job_types, type]
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="branding">Appearance</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-6">
                {/* Photo */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {formData.photo_url ? (
                      <img
                        src={formData.photo_url}
                        alt="Profile"
                        className="w-24 h-24 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                        <User className="w-10 h-10 text-emerald-600" />
                      </div>
                    )}
                    <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-700">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </label>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Profile Photo</p>
                    <p className="text-sm text-slate-500">Upload a professional photo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Experienced Line Cook"
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>About Me</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="min-h-[100px] border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, State"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Hourly Rate ($)</Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate_min}
                      onChange={(e) => setFormData({ ...formData, hourly_rate_min: e.target.value })}
                      className="border-slate-200"
                    />
                  </div>
                </div>

                {/* Preferred Job Types */}
                <div className="space-y-3">
                  <Label>Preferred Position Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map((type) => (
                      <Badge
                        key={type}
                        variant={formData.preferred_job_types.includes(type) ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          formData.preferred_job_types.includes(type)
                            ? 'bg-emerald-600'
                            : ''
                        }`}
                        onClick={() => toggleJobType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Work Authorization */}
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-medium text-slate-900">Work Authorization</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Authorization Status</Label>
                      <select
                        value={formData.work_authorization_status}
                        onChange={(e) => setFormData({ ...formData, work_authorization_status: e.target.value })}
                        className="w-full h-9 px-3 py-1 rounded-md border border-slate-200 bg-white text-sm"
                      >
                        <option value="">Select status</option>
                        <option value="us_citizen">U.S. Citizen</option>
                        <option value="permanent_resident">Permanent Resident</option>
                        <option value="work_visa">Work Visa</option>
                        <option value="ead">Employment Authorization Document (EAD)</option>
                      </select>
                    </div>
                    {formData.work_authorization_status && formData.work_authorization_status !== 'us_citizen' && (
                      <>
                        <div className="space-y-2">
                          <Label>Expiration Date</Label>
                          <Input
                            type="date"
                            value={formData.work_authorization_expiry}
                            onChange={(e) => setFormData({ ...formData, work_authorization_expiry: e.target.value })}
                            className="border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Upload Document</Label>
                          <label className="flex items-center justify-center h-9 px-3 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setUploading(true);
                                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                setFormData(prev => ({ ...prev, work_authorization_document_url: file_url }));
                                setUploading(false);
                              }}
                              className="hidden"
                            />
                            {uploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : formData.work_authorization_document_url ? (
                              <span className="text-emerald-600 text-sm">✓ Uploaded</span>
                            ) : (
                              <span className="text-slate-600 text-sm">Choose file</span>
                            )}
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  Profile Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Cover Photo</Label>
                  <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {formData.cover_photo_url ? (
                      <img src={formData.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      ) : (
                        <div className="text-white text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <span>Upload Cover Photo</span>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="text-sm text-slate-500">
                    Add a banner image to personalize your profile
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Accent Color</Label>
                  <p className="text-sm text-slate-500">Choose a color to personalize your profile</p>
                  <div className="grid grid-cols-4 gap-3">
                    {BRAND_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFormData({ ...formData, brand_color: color.value })}
                        className={`h-16 rounded-xl border-2 transition-all ${
                          formData.brand_color === color.value
                            ? 'border-slate-900 scale-105'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                      >
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={formData.brand_color}
                      onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.brand_color}
                      onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Profile Style</Label>
                  <select
                    value={formData.theme_style}
                    onChange={(e) => setFormData({ ...formData, theme_style: e.target.value })}
                    className="w-full h-9 px-3 py-1 rounded-md border border-slate-200 bg-white text-sm"
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="elegant">Elegant</option>
                    <option value="casual">Casual</option>
                  </select>
                  <p className="text-sm text-slate-500">
                    Choose a visual style for your profile page
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-6">
                {/* Skills */}
                <div className="space-y-3">
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={formData.skills.includes(skill) ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          formData.skills.includes(skill)
                            ? 'bg-emerald-600'
                            : ''
                        }`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-3">
                  <Label>Certifications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="e.g. ServSafe"
                      className="border-slate-200"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button onClick={addCertification} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-slate-100">
                          {cert}
                          <button
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              certifications: prev.certifications.filter((_, i) => i !== idx)
                            }))}
                            className="ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Experience */}
                <div className="space-y-3">
                  <Label>Work Experience</Label>
                  <ExperienceForm
                    experience={formData.experience}
                    onChange={(experience) => setFormData({ ...formData, experience })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Available to Start</Label>
                  <Input
                    type="date"
                    value={formData.available_start_date}
                    onChange={(e) => setFormData({ ...formData, available_start_date: e.target.value })}
                    className="border-slate-200 w-full md:w-64"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Weekly Availability</Label>
                  <AvailabilitySelector
                    availability={formData.availability}
                    onChange={(availability) => setFormData({ ...formData, availability })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}