import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, MessageCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminMessages() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['adminDirectMessages'],
    queryFn: () => base44.entities.DirectMessage.list('-created_date'),
    enabled: isAdmin
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to view messages.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      msg.message?.toLowerCase().includes(q) ||
      msg.sender_name?.toLowerCase().includes(q) ||
      msg.sender_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">All Messages</h1>
          <p className="text-slate-600">Platform-wide message history ({messages.length} total)</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by sender name, email, or message content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-11"
          />
        </div>

        {messagesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No messages found</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">{filteredMessages.length} messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredMessages.map(msg => (
                  <div key={msg.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                          msg.sender_type === 'restaurant' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {msg.sender_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-slate-900 text-sm">{msg.sender_name || msg.sender_email}</span>
                            <Badge variant="outline" className={`text-xs capitalize ${
                              msg.sender_type === 'restaurant' 
                                ? 'border-emerald-300 text-emerald-700' 
                                : 'border-blue-300 text-blue-700'
                            }`}>
                              {msg.sender_type}
                            </Badge>
                            {!msg.is_read && (
                              <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Unread</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 break-words">{msg.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{msg.sender_email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {format(new Date(msg.created_date), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}