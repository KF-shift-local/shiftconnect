import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2,
  Upload,
  Loader2,
  ArrowLeft,
  Palette,
  Image as ImageIcon,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function EditRestaurant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState({ logo: false, cover: false });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    about_us: '',
    cuisine_type: '',
    logo_url: '',
    cover_photo_url: '',
    brand_color: '#10b981',
    theme_style: 'modern',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      tiktok: ''
    },
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

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        about_us: restaurant.about_us || '',
        cuisine_type: restaurant.cuisine_type || '',
        logo_url: restaurant.logo_url || '',
        cover_photo_url: restaurant.cover_photo_url || '',
        brand_color: restaurant.brand_color || '#10b981',
        theme_style: restaurant.theme_style || 'modern',
        social_media: restaurant.social_media || {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          tiktok: ''
        },
        address: restaurant.address || '',
        city: restaurant.city || '',
        state: restaurant.state || '',
        zip_code: restaurant.zip_code || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        website: restaurant.website || '',
        established_year: restaurant.established_year || '',
        employee_count: restaurant.employee_count || ''
      });
    }
  }, [restaurant]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Restaurant.update(restaurant.id, {
        ...formData,
        established_year: parseInt(formData.established_year) || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurant']);
      toast.success('Profile updated successfully');
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading({ ...uploading, logo: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Upload failed');
    }
    setUploading({ ...uploading, logo: false });
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading({ ...uploading, cover: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, cover_photo_url: file_url });
      toast.success('Cover photo uploaded');
    } catch (error) {
      toast.error('Upload failed');
    }
    setUploading({ ...uploading, cover: false });
  };

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
        <p className="text-slate-600">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(createPageUrl('RestaurantDashboard'))}
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Restaurant Settings</h1>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="about">About & Social</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Restaurant Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="The Local Bistro"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your restaurant..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cuisine Type</Label>
                    <Select
                      value={formData.cuisine_type}
                      onValueChange={(value) => setFormData({ ...formData, cuisine_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="American">American</SelectItem>
                        <SelectItem value="Italian">Italian</SelectItem>
                        <SelectItem value="Mexican">Mexican</SelectItem>
                        <SelectItem value="Asian Fusion">Asian Fusion</SelectItem>
                        <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Year Established</Label>
                    <Input
                      type="number"
                      value={formData.established_year}
                      onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                      placeholder="2020"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Team Size</Label>
                  <Select
                    value={formData.employee_count}
                    onValueChange={(value) => setFormData({ ...formData, employee_count: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  Brand Customization
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

                <div className="space-y-4">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-700">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {uploading.logo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Brand Color</Label>
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
                  <Label>Profile Theme</Label>
                  <Select
                    value={formData.theme_style}
                    onValueChange={(value) => setFormData({ ...formData, theme_style: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="elegant">Elegant</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About & Social Tab */}
          <TabsContent value="about">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>About Us & Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>About Us</Label>
                  <Textarea
                    value={formData.about_us}
                    onChange={(e) => setFormData({ ...formData, about_us: e.target.value })}
                    placeholder="Tell workers about your restaurant's story, values, culture, and what makes it a great place to work..."
                    rows={6}
                  />
                  <p className="text-sm text-slate-500">
                    Share your restaurant's story and culture to attract the right workers
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Social Media Links</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <Input
                        value={formData.social_media.facebook}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media: { ...formData.social_media, facebook: e.target.value }
                        })}
                        placeholder="https://facebook.com/yourrestaurant"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <Input
                        value={formData.social_media.instagram}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media: { ...formData.social_media, instagram: e.target.value }
                        })}
                        placeholder="https://instagram.com/yourrestaurant"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Twitter className="w-5 h-5 text-sky-500" />
                      <Input
                        value={formData.social_media.twitter}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media: { ...formData.social_media, twitter: e.target.value }
                        })}
                        placeholder="https://twitter.com/yourrestaurant"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-5 h-5 text-blue-700" />
                      <Input
                        value={formData.social_media.linkedin}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media: { ...formData.social_media, linkedin: e.target.value }
                        })}
                        placeholder="https://linkedin.com/company/yourrestaurant"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-slate-600" />
                      <Input
                        value={formData.social_media.tiktok}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media: { ...formData.social_media, tiktok: e.target.value }
                        })}
                        placeholder="https://tiktok.com/@yourrestaurant"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.restaurant.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}