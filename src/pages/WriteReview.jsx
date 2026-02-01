import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft,
  Loader2,
  Star,
  CheckCircle
} from 'lucide-react';
import StarRating from '@/components/ui/StarRating';

export default function WriteReview() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationId = urlParams.get('applicationId');
  const reviewerType = urlParams.get('type'); // 'restaurant' or 'worker'

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    punctuality: 0,
    communication: 0,
    professionalism: 0,
    skills: 0,
    would_work_again: false
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      const apps = await base44.entities.Application.filter({ id: applicationId });
      return apps[0];
    },
    enabled: !!applicationId
  });

  const { data: existingReview } = useQuery({
    queryKey: ['existingReview', applicationId, reviewerType],
    queryFn: async () => {
      const reviews = await base44.entities.Review.filter({
        application_id: applicationId,
        reviewer_type: reviewerType
      });
      return reviews[0];
    },
    enabled: !!applicationId && !!reviewerType
  });

  const { data: otherReview } = useQuery({
    queryKey: ['otherReview', applicationId, reviewerType],
    queryFn: async () => {
      const otherType = reviewerType === 'restaurant' ? 'worker' : 'restaurant';
      const reviews = await base44.entities.Review.filter({
        application_id: applicationId,
        reviewer_type: otherType
      });
      return reviews[0];
    },
    enabled: !!applicationId && !!reviewerType
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      // Get the proper names and IDs based on reviewer type
      let reviewerName, reviewerId, revieweeName, revieweeId, revieweeType;
      
      if (reviewerType === 'restaurant') {
        const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
        const restaurant = restaurants[0];
        reviewerName = restaurant.name;
        reviewerId = restaurant.id;
        revieweeName = application.worker_name;
        revieweeId = application.worker_id;
        revieweeType = 'worker';
      } else {
        const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
        const profile = profiles[0];
        reviewerName = profile.full_name;
        reviewerId = profile.id;
        revieweeName = application.restaurant_name;
        revieweeId = application.restaurant_id;
        revieweeType = 'restaurant';
      }

      // Check if both reviews are now submitted
      const shouldPublish = !!otherReview;

      const review = await base44.entities.Review.create({
        application_id: applicationId,
        reviewer_type: reviewerType,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        reviewee_type: revieweeType,
        reviewee_id: revieweeId,
        reviewee_name: revieweeName,
        rating,
        comment,
        categories,
        is_published: shouldPublish,
        published_date: shouldPublish ? new Date().toISOString() : null
      });

      // If both reviews are now in, publish the other one too
      if (shouldPublish && otherReview) {
        await base44.entities.Review.update(otherReview.id, {
          is_published: true,
          published_date: new Date().toISOString()
        });

        // Update average ratings for both parties
        // This would ideally be done in a backend function
      }

      return review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['existingReview']);
      navigate(-1);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Review Already Submitted</h2>
            <p className="text-slate-600 mb-6">
              {existingReview.is_published 
                ? 'Your review has been published.'
                : 'Your review is pending. It will be published once the other party submits their review.'
              }
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revieweeName = reviewerType === 'restaurant' 
    ? application?.worker_name 
    : application?.restaurant_name;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
            <p className="text-slate-600">
              Share your experience {reviewerType === 'restaurant' ? 'working with' : 'at'} {revieweeName}
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Overall Rating */}
            <div className="text-center">
              <Label className="text-lg mb-4 block">Overall Rating</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Category Ratings */}
            <div className="space-y-4">
              <Label className="text-lg">Rate Specific Areas</Label>
              
              {[
                { key: 'punctuality', label: 'Punctuality' },
                { key: 'communication', label: 'Communication' },
                { key: 'professionalism', label: 'Professionalism' },
                { key: 'skills', label: reviewerType === 'restaurant' ? 'Skills & Ability' : 'Work Environment' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">{label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setCategories(prev => ({ ...prev, [key]: star }))}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= categories[key] 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <span className="font-medium text-slate-700">
                  Would you {reviewerType === 'restaurant' ? 'hire' : 'work here'} again?
                </span>
                <Switch
                  checked={categories.would_work_again}
                  onCheckedChange={(checked) => 
                    setCategories(prev => ({ ...prev, would_work_again: checked }))
                  }
                />
              </div>
            </div>

            {/* Written Review */}
            <div className="space-y-2">
              <Label>Your Review</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share details about your experience ${reviewerType === 'restaurant' ? 'working with this person' : 'at this restaurant'}...`}
                className="min-h-[150px] border-slate-200"
              />
            </div>

            {/* Fair Review Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">Fair Review System</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Your review will only be published once {revieweeName} also submits their review. This ensures honest, unbiased feedback from both parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => submitReviewMutation.mutate()}
                disabled={rating === 0 || submitReviewMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {submitReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}