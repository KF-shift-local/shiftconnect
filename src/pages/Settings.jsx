import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Loader2, Save, Navigation } from 'lucide-react';
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [locationData, setLocationData] = useState({
    city: '',
    state: '',
    country: ''
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  React.useEffect(() => {
    if (user) {
      setLocationData({
        city: user.preferred_city || '',
        state: user.preferred_state || '',
        country: user.preferred_country || 'USA'
      });
    }
  }, [user]);

  const updateLocationMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe({
        preferred_city: data.city,
        preferred_state: data.state,
        preferred_country: data.country
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Location preferences saved');
    }
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          
          setLocationData({
            city: data.address.city || data.address.town || data.address.village || '',
            state: data.address.state || '',
            country: data.address.country || 'USA'
          });
          toast.success('Location detected');
        } catch (error) {
          toast.error('Failed to get location details');
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        toast.error('Failed to get your location');
        setLoadingLocation(false);
      }
    );
  };

  const handleSave = () => {
    updateLocationMutation.mutate(locationData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-slate-600">Manage your account preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={user?.full_name || ''} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role || 'user'} disabled className="bg-slate-50 capitalize" />
              </div>
            </CardContent>
          </Card>

          {/* Location Preferences */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Location Preferences
              </CardTitle>
              <CardDescription>
                Set your preferred location to find jobs or workers near you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={locationData.city}
                  onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                  placeholder="e.g. San Francisco"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={locationData.state}
                    onChange={(e) => setLocationData({ ...locationData, state: e.target.value })}
                    placeholder="e.g. California"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={locationData.country}
                    onChange={(e) => setLocationData({ ...locationData, country: e.target.value })}
                    placeholder="e.g. USA"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={loadingLocation}
                  className="gap-2"
                >
                  {loadingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  Use Current Location
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={updateLocationMutation.isPending || !locationData.city}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  {updateLocationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Location
                </Button>
              </div>

              {locationData.city && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700">
                    <span className="font-medium">Your preferred location:</span>{' '}
                    {locationData.city}, {locationData.state}, {locationData.country}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}