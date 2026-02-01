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
import { 
  User,
  Briefcase,
  Clock,
  Upload,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  Plus,
  FileText
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

export default function WorkerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    photo_url: '',
    headline: '',
    bio: '',
    resume_url: '',
    experience: [],
    skills: [],
    certifications: [],
    availability: {},
    available_start_date: '',
    preferred_job_types: [],
    hourly_rate_min: '',
    location: '',
    willing_to_travel_miles: 10
  });
  const [newCertification, setNewCertification] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: existingProfile } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: prev.full_name || user.full_name || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (existingProfile) {
      navigate(createPageUrl('WorkerDashboard'));
    }
  }, [existingProfile, navigate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.WorkerProfile.create({
        ...formData,
        user_id: user.email,
        hourly_rate_min: parseFloat(formData.hourly_rate_min) || 0,
        average_rating: 0,
        total_reviews: 0,
        jobs_completed: 0
      });
    },
    onSuccess: () => {
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

  const removeCertification = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  const steps = [
    { num: 1, title: 'Basic Info', icon: User },
    { num: 2, title: 'Experience', icon: Briefcase },
    { num: 3, title: 'Availability', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= s.num 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-2 rounded ${
                    step > s.num ? 'bg-emerald-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center">
            {steps.find(s => s.num === step)?.title}
          </h1>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    {formData.photo_url ? (
                      <img
                        src={formData.photo_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-12 h-12 text-emerald-600" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    </label>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Upload a professional photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Your full name"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Phone Number</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Professional Headline</Label>
                  <Input
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Experienced Line Cook with 5+ years in fine dining"
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">About Me</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell restaurants about yourself, your passion for the industry, and what makes you a great hire..."
                    className="min-h-[120px] border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, State"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Minimum Hourly Rate ($)</Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate_min}
                      onChange={(e) => setFormData({ ...formData, hourly_rate_min: e.target.value })}
                      placeholder="e.g. 18"
                      className="border-slate-200"
                    />
                  </div>
                </div>

                {/* Resume Upload */}
                <div className="space-y-2">
                  <Label className="text-slate-700">Resume (Optional)</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                    {formData.resume_url ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-emerald-600" />
                        <span className="text-slate-600">Resume uploaded</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, resume_url: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600">Click to upload your resume</p>
                        <p className="text-xs text-slate-400">PDF, DOC, or DOCX</p>
                      </label>
                    )}
                  </div>
                </div>

                {/* Preferred Job Types */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Preferred Position Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map((type) => (
                      <Badge
                        key={type}
                        variant={formData.preferred_job_types.includes(type) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all ${
                          formData.preferred_job_types.includes(type)
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                        onClick={() => toggleJobType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Skills */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Skills</Label>
                  <p className="text-sm text-slate-500">Select all that apply</p>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={formData.skills.includes(skill) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all ${
                          formData.skills.includes(skill)
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'hover:bg-emerald-50 hover:border-emerald-300'
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
                  <Label className="text-slate-700">Certifications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="e.g. ServSafe Food Handler"
                      className="border-slate-200"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button onClick={addCertification} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700">
                          {cert}
                          <button
                            onClick={() => removeCertification(cert)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work Experience */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Work Experience</Label>
                  <ExperienceForm
                    experience={formData.experience}
                    onChange={(experience) => setFormData({ ...formData, experience })}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-700">Available to Start</Label>
                  <Input
                    type="date"
                    value={formData.available_start_date}
                    onChange={(e) => setFormData({ ...formData, available_start_date: e.target.value })}
                    className="border-slate-200 w-full md:w-64"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700">Weekly Availability</Label>
                  <p className="text-sm text-slate-500">Set your typical weekly schedule</p>
                  <AvailabilitySelector
                    availability={formData.availability}
                    onChange={(availability) => setFormData({ ...formData, availability })}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={step === 1 && !formData.full_name}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    'Complete Profile'
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