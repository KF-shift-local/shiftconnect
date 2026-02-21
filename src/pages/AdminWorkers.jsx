import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Users, MapPin, Star, Briefcase, Loader2, Ban, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminWorkers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['adminWorkers'],
    queryFn: () => base44.entities.WorkerProfile.list('-created_date')
  });

  const banMutation = useMutation({
    mutationFn: ({ workerId, status, reason }) => 
      base44.entities.WorkerProfile.update(workerId, { 
        account_status: status,
        ban_reason: status === 'banned' ? reason : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminWorkers']);
      toast.success('Worker status updated');
    }
  });

  if (user && user.role !== 'admin') {
    navigate(createPageUrl('Home'));
    return null;
  }

  const filteredWorkers = workers.filter(w =>
    !searchQuery || 
    w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.location && w.location.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <h1 className="text-3xl font-bold text-slate-900">Manage Workers</h1>
            <p className="text-slate-600">View all worker profiles on the platform</p>
          </div>
        </div>

        <Card className="border-slate-200 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Worker Profiles ({filteredWorkers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWorkers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200">
                    <div className="flex items-center gap-4 flex-1">
                      {w.photo_url ? (
                        <img src={w.photo_url} alt={w.full_name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-2xl font-semibold text-purple-700">
                            {w.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{w.full_name}</h3>
                        {w.headline && (
                          <p className="text-sm text-slate-600 mb-1">{w.headline}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          {w.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {w.location}
                            </span>
                          )}
                          {w.average_rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              {w.average_rating.toFixed(1)}
                            </span>
                          )}
                          {w.jobs_completed > 0 && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {w.jobs_completed} jobs
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {w.preferred_job_types?.slice(0, 3).map(job => (
                            <Badge key={job} variant="secondary" className="text-xs">{job}</Badge>
                          ))}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Joined {format(new Date(w.created_date), 'MMM d, yyyy')}
                        </div>
                        {w.account_status === 'banned' && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Banned{w.ban_reason ? `: ${w.ban_reason}` : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.account_status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => banMutation.mutate({ 
                            workerId: w.id, 
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
                              workerId: w.id, 
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
                        onClick={() => window.open(createPageUrl(`WorkerProfile?id=${w.id}`), '_blank')}
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