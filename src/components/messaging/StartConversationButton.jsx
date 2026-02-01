import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function StartConversationButton({ 
  workerProfile, 
  restaurant, 
  currentUser,
  currentUserType,
  applicationId,
  variant = "default",
  size = "default",
  className = ""
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existingConversation } = useQuery({
    queryKey: ['conversation', workerProfile?.user_id, restaurant?.id],
    queryFn: async () => {
      if (currentUserType === 'worker') {
        const convs = await base44.entities.Conversation.filter({
          worker_id: currentUser.email,
          restaurant_id: restaurant.id
        });
        return convs[0];
      } else {
        const convs = await base44.entities.Conversation.filter({
          worker_id: workerProfile.user_id,
          restaurant_id: restaurant.id
        });
        return convs[0];
      }
    },
    enabled: !!(workerProfile && restaurant && currentUser)
  });

  const startConversationMutation = useMutation({
    mutationFn: async () => {
      if (existingConversation) {
        return existingConversation;
      }

      const conversationData = {
        worker_id: workerProfile.user_id,
        worker_name: workerProfile.full_name,
        worker_photo: workerProfile.photo_url,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo: restaurant.logo_url,
        last_message: '',
        last_message_date: new Date().toISOString(),
        application_id: applicationId
      };

      return await base44.entities.Conversation.create(conversationData);
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(createPageUrl('Messages'));
    }
  });

  if (!currentUser || !workerProfile || !restaurant) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => startConversationMutation.mutate()}
      disabled={startConversationMutation.isPending}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {existingConversation ? 'Send Message' : 'Start Conversation'}
    </Button>
  );
}