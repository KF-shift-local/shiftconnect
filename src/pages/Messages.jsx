import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Search, Building2, User, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: workerProfile } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const isWorker = !!workerProfile;
  const isRestaurant = !!restaurant;

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email, isWorker],
    queryFn: async () => {
      if (isWorker) {
        return await base44.entities.Conversation.filter({ worker_id: user.email }, '-last_message_date');
      } else if (isRestaurant) {
        return await base44.entities.Conversation.filter({ restaurant_id: restaurant.id }, '-last_message_date');
      }
      return [];
    },
    enabled: !!(user?.email && (isWorker || isRestaurant)),
    refetchInterval: 3000
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: selectedConversation.id }, 'created_date'),
    enabled: !!selectedConversation?.id,
    refetchInterval: 2000
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const msg = await base44.entities.DirectMessage.create(messageData);
      
      // Update conversation
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: messageData.message,
        last_message_date: new Date().toISOString(),
        last_message_sender: isWorker ? 'worker' : 'restaurant',
        [isWorker ? 'unread_count_restaurant' : 'unread_count_worker']: 
          (selectedConversation[isWorker ? 'unread_count_restaurant' : 'unread_count_worker'] || 0) + 1
      });

      // Create notification
      const recipientEmail = isWorker ? selectedConversation.restaurant_id : selectedConversation.worker_id;
      await base44.entities.Notification.create({
        recipient_email: recipientEmail,
        recipient_type: isWorker ? 'restaurant' : 'worker',
        title: `New message from ${messageData.sender_name}`,
        message: messageData.message.substring(0, 100),
        type: 'message',
        link_url: `/Messages`,
        related_entity_id: selectedConversation.id
      });

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId) => {
      const unreadMessages = messages.filter(
        m => !m.is_read && m.sender_type !== (isWorker ? 'worker' : 'restaurant')
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.DirectMessage.update(msg.id, {
          is_read: true,
          read_date: new Date().toISOString()
        });
      }

      await base44.entities.Conversation.update(conversationId, {
        [isWorker ? 'unread_count_worker' : 'unread_count_restaurant']: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      markAsReadMutation.mutate(selectedConversation.id);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.id, messages.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversation_id: selectedConversation.id,
      sender_email: user.email,
      sender_name: isWorker ? workerProfile.full_name : restaurant.name,
      sender_type: isWorker ? 'worker' : 'restaurant',
      message: newMessage.trim()
    });
  };

  const filteredConversations = conversations.filter(conv => {
    const searchName = isWorker ? conv.restaurant_name : conv.worker_name;
    return searchName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unreadCount = conversations.reduce((sum, conv) => {
    return sum + (isWorker ? (conv.unread_count_worker || 0) : (conv.unread_count_restaurant || 0));
  }, 0);

  if (!user || (!workerProfile && !restaurant)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Messages</h2>
            <p className="text-slate-600 mb-6">
              Create a profile to start messaging.
            </p>
            <Button onClick={() => base44.auth.redirectToLogin()}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
          <p className="text-slate-600">
            {unreadCount > 0 && `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
            <CardContent className="p-0 h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => {
                      const unread = isWorker ? conv.unread_count_worker : conv.unread_count_restaurant;
                      const displayName = isWorker ? conv.restaurant_name : conv.worker_name;
                      const displayPhoto = isWorker ? conv.restaurant_logo : conv.worker_photo;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                            selectedConversation?.id === conv.id ? 'bg-emerald-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {displayPhoto ? (
                                <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
                              ) : (
                                isWorker ? <Building2 className="w-6 h-6 text-slate-400" /> : <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-slate-900 truncate">{displayName}</h3>
                                {unread > 0 && (
                                  <Badge className="bg-emerald-600">{unread}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 truncate">{conv.last_message}</p>
                              {conv.last_message_date && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {format(new Date(conv.last_message_date), 'MMM d, h:mm a')}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Thread */}
          <Card className={`lg:col-span-2 ${!selectedConversation ? 'hidden lg:flex' : 'flex'} flex-col`}>
            {selectedConversation ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {(isWorker ? selectedConversation.restaurant_logo : selectedConversation.worker_photo) ? (
                      <img
                        src={isWorker ? selectedConversation.restaurant_logo : selectedConversation.worker_photo}
                        alt={isWorker ? selectedConversation.restaurant_name : selectedConversation.worker_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      isWorker ? <Building2 className="w-5 h-5 text-slate-400" /> : <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {isWorker ? selectedConversation.restaurant_name : selectedConversation.worker_name}
                    </h2>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_type === (isWorker ? 'worker' : 'restaurant');
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isOwn ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-900'} rounded-2xl px-4 py-2`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {format(new Date(msg.created_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a conversation</h3>
                  <p className="text-slate-600">Choose a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}