import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Search, Building2, MapPin, Star, CheckCircle, Loader2, Ban, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminRestaurants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['adminRestaurants'],
    queryFn: () => base44.entities.Restaurant.list('-created_date')
  });

  const verifyMutation = useMutation({
    mutationFn: ({ restaurantId, verified }) => 
      base44.entities.Restaurant.update(restaurantId, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminRestaurants']);
      toast.success('Restaurant verification updated');
    }
  });

  const banMutation = useMutation({
    mutationFn: ({ restaurantId, status, reason }) => 
      base44.entities.Restaurant.update(restaurantId, { 
        account_status: status,
        ban_reason: status === 'banned' ? reason : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminRestaurants']);
      toast.success('Restaurant status updated');
    }
  });

  if (user && user.role !== 'admin') {
    navigate(createPageUrl('Home'));
    return null;
  }

  const filteredRestaurants = restaurants.filter(r =>
    !searchQuery || 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(createPageUrl('AdminDashboard'))}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Restaurants</h1>
            <p className="text-slate-600">View and manage all registered restaurants</p>
          </div>
        </div>

        <Card className="border-slate-200 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or city..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Restaurants ({filteredRestaurants.length})</span>
              <Badge variant="secondary">
                {restaurants.filter(r => r.verified).length} verified
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRestaurants.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200">
                    <div className="flex items-center gap-4 flex-1">
                      {r.logo_url ? (
                        <img src={r.logo_url} alt={r.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{r.name}</h3>
                          {r.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          {r.cuisine_type && <Badge variant="secondary">{r.cuisine_type}</Badge>}
                          {r.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {r.city}, {r.state}
                            </span>
                          )}
                          {r.average_rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              {r.average_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Registered {format(new Date(r.created_date), 'MMM d, yyyy')} • {r.total_hires || 0} hires
                        </div>
                        {r.account_status === 'banned' && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Banned{r.ban_reason ? `: ${r.ban_reason}` : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Verified</span>
                        <Switch
                          checked={r.verified}
                          onCheckedChange={(checked) => 
                            verifyMutation.mutate({ restaurantId: r.id, verified: checked })
                          }
                          disabled={r.account_status === 'banned'}
                        />
                      </div>
                      {r.account_status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => banMutation.mutate({ 
                            restaurantId: r.id, 
                            status: 'active',
                            reason: null
                          })}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => {
                            const reason = prompt('Ban reason (optional):');
                            banMutation.mutate({ 
                              restaurantId: r.id, 
                              status: 'banned',
                              reason
                            });
                          }}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Ban
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(createPageUrl(`RestaurantDashboard?restaurant_id=${r.id}`))}
                      >
                        View Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(createPageUrl(`RestaurantProfile?id=${r.id}`), '_blank')}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}