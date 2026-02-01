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

  const saveMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Restaurant.create({
        ...formData,
        owner_id: user.email,
        established_year: parseInt(formData.established_year) || null,
        average_rating: 0,
        total_reviews: 0,
        total_hires: 0,
        verified: false
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('RestaurantDashboard'));
    }
  });

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

        <Card className="border-slate-200 shadow-xl">
          <CardContent className="p-8 space-y-8">
            {/* Cover Photo */}
            <div className="space-y-2">
              <Label className="text-slate-700">Cover Photo</Label>
              <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                {formData.cover_photo_url ? (
                  <img
                    src={formData.cover_photo_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  {uploading.cover ? (
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  ) : (
                    <div className="text-white text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <span>Upload Cover Photo</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-end gap-6 -mt-12 relative z-10 pl-4">
              <div className="relative">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors shadow">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {uploading.logo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </label>
              </div>
              <div className="pb-2">
                <p className="text-sm text-slate-500">Upload your restaurant logo</p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-slate-700">Restaurant Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="The Local Bistro"
                    className="border-slate-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700">Cuisine Type</Label>
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
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell workers about your restaurant, atmosphere, and what makes it special..."
                  className="min-h-[100px] border-slate-200"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Location</h3>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700">Street Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-slate-700">City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Zip Code</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="10001"
                    className="border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@restaurant.com"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.restaurant.com"
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
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-25">11-25 employees</SelectItem>
                      <SelectItem value="26-50">26-50 employees</SelectItem>
                      <SelectItem value="51-100">51-100 employees</SelectItem>
                      <SelectItem value="100+">100+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.name || saveMutation.isPending}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Create Restaurant Profile'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}