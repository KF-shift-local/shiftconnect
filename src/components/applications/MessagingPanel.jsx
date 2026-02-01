import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagingPanel({ application, currentUser, userType }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', application.id],
    queryFn: () => base44.entities.Message.filter({ application_id: application.id }, 'created_date'),
    enabled: !!application?.id
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', application.id]);
      setMessage('');
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      application_id: application.id,
      sender_email: currentUser.email,
      sender_name: userType === 'restaurant' ? application.restaurant_name : application.worker_name,
      sender_type: userType,
      message: message.trim()
    });
  };

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender_email === currentUser.email;
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isCurrentUser
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">{msg.sender_name}</p>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}