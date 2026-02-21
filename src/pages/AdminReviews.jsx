import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import StarRating from '@/components/ui/StarRating';

export default function AdminReviews() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => base44.entities.Review.list('-created_date')
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ reviewId, isPublished }) => 
      base44.entities.Review.update(reviewId, { 
        is_published: isPublished,
        published_date: isPublished ? new Date().toISOString() : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReviews']);
      toast.success('Review status updated');
    }
  });

  if (user && user.role !== 'admin') {
    navigate(createPageUrl('Home'));
    return null;
  }

  const publishedReviews = reviews.filter(r => r.is_published);
  const unpublishedReviews = reviews.filter(r => !r.is_published);

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
            <h1 className="text-3xl font-bold text-slate-900">Moderate Reviews</h1>
            <p className="text-slate-600">Manage review publication status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-slate-900">{reviews.length}</div>
              <div className="text-sm text-slate-600">Total Reviews</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-emerald-600">{publishedReviews.length}</div>
              <div className="text-sm text-slate-600">Published</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-amber-600">{unpublishedReviews.length}</div>
              <div className="text-sm text-slate-600">Unpublished</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>All Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="p-4 rounded-lg border border-slate-100 hover:border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-900">{review.reviewer_name}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-700">{review.reviewee_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {review.reviewer_type} reviewing {review.reviewee_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-sm font-medium text-slate-700">{review.rating}/5</span>
                        </div>
                        {review.comment && (
                          <p className="text-slate-600 text-sm mb-2">{review.comment}</p>
                        )}
                        <div className="text-xs text-slate-400">
                          Created {format(new Date(review.created_date), 'MMM d, yyyy HH:mm')}
                          {review.published_date && (
                            <span> • Published {format(new Date(review.published_date), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-slate-600">Published</span>
                          <Switch
                            checked={review.is_published}
                            onCheckedChange={(checked) => 
                              togglePublishMutation.mutate({ 
                                reviewId: review.id, 
                                isPublished: checked 
                              })
                            }
                          />
                        </div>
                      </div>
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