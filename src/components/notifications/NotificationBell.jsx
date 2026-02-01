import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationBell({ userEmail }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ 
      recipient_email: userEmail 
    }, '-created_date', 50),
    enabled: !!userEmail,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { 
      is_read: true, 
      read_date: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(
        unreadIds.map(id => base44.entities.Notification.update(id, { 
          is_read: true, 
          read_date: new Date().toISOString() 
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link_url) {
      setOpen(false);
      window.location.href = notification.link_url;
    }
  };

  const priorityColors = {
    low: 'border-slate-200',
    medium: 'border-blue-200 bg-blue-50/30',
    high: 'border-amber-200 bg-amber-50/30'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative border-l-2 ${
                    priorityColors[notif.priority]
                  } ${!notif.is_read ? 'bg-blue-50/20' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {!notif.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotificationMutation.mutate(notif.id);
                    }}
                    className="absolute top-2 right-2 p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                  <p className="font-medium text-slate-900 text-sm pr-6">{notif.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {format(new Date(notif.created_date), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}