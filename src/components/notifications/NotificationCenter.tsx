import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, CheckCircle2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ticket_response' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep last 10
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      icon: notification.type === 'ticket_response' ? <MessageSquare className="w-4 h-4 text-success" /> : 
            notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-success" /> :
            <Bell className="w-4 h-4 text-primary" />,
      duration: 5000,
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Subscribe to realtime changes on support_tickets
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // Small delay to avoid subscription conflicts during component mount
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      
      channel = supabase
        .channel(`support-tickets-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'support_tickets',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;
            
            const newData = payload.new as { response?: string; status?: string; subject?: string };
            const oldData = payload.old as { response?: string; status?: string };
            
            // Check if a response was added
            if (newData.response && !oldData.response) {
              addNotification({
                title: 'Resposta do Suporte',
                message: `Seu chamado "${newData.subject}" recebeu uma resposta!`,
                type: 'ticket_response',
              });
            }
            
            // Check if status changed to resolved
            if (newData.status === 'resolvido' && oldData.status !== 'resolvido') {
              addNotification({
                title: 'Chamado Resolvido',
                message: `Seu chamado "${newData.subject}" foi marcado como resolvido.`,
                type: 'success',
              });
            }
          }
        )
        .subscribe();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, addNotification]);

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notificações</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer relative",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                    
                    <div className="flex items-start gap-3 pr-6">
                      <div className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        notification.type === 'ticket_response' && "bg-success/10",
                        notification.type === 'success' && "bg-success/10",
                        notification.type === 'info' && "bg-primary/10"
                      )}>
                        {notification.type === 'ticket_response' ? (
                          <MessageSquare className="w-4 h-4 text-success" />
                        ) : notification.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <Bell className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(notification.timestamp, "HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
