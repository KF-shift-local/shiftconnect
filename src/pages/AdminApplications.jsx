import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminApplications() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['adminApplications'],
    queryFn: () => base44.entities.Application.list('-created_date')
  });

  if (user && user.role !== 'admin') {
    navigate(createPageUrl('Home'));
    return null;
  }

  const filteredApplications = applications.filter(a => {
    const matchesSearch = !searchQuery || 
      a.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    reviewing: 'bg-blue-100 text-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    offered: 'bg-emerald-100 text-emerald-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    withdrawn: 'bg-slate-100 text-slate-500',
    completed: 'bg-slate-100 text-slate-600'
  };

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
            <h1 className="text-3xl font-bold text-slate-900">All Applications</h1>
            <p className="text-slate-600">View all job applications across the platform</p>
          </div>
        </div>

        <Card className="border-slate-200 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by worker, restaurant, or job..."
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredApplications.map(app => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{app.worker_name}</span>
                        <span className="text-slate-500">→</span>
                        <span className="font-medium text-slate-700">{app.restaurant_name}</span>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        Position: <span className="font-medium">{app.job_title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Applied {format(new Date(app.created_date), 'MMM d, yyyy')}</span>
                        {app.available_start_date && (
                          <span>• Available from {format(new Date(app.available_start_date), 'MMM d')}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={statusColors[app.status]}>
                      {app.status}
                    </Badge>
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