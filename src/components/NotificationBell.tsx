import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bell, CheckCircle2, Trash2, Clock, ChevronRight, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";
import { useOverlayClose } from "@/components/OverlayCloseContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_SOUND_URL = "/audio/notification.mp3";

const categorizeNotifications = (notifications: Notification[]) => {
  const groups: Record<string, Notification[]> = {};
  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    let category: string;
    if (isToday(date)) category = 'Today';
    else if (isYesterday(date)) category = 'Yesterday';
    else category = format(date, 'MMMM dd, yyyy');

    if (!groups[category]) groups[category] = [];
    groups[category].push(notification);
  });
  return Object.keys(groups).map(title => ({ title, notifications: groups[title] }));
};

export const NotificationBell = ({ forceDark = false }: { forceDark?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { subscribe } = useOverlayClose();

  useEffect(() => {
    return subscribe(() => setIsOpen(false));
  }, [subscribe]);

  const isIndexPage = location.pathname === '/';

  // Matches the circular/squircle icon wrapping in the drawer
  const headerIconStyles = `
    h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 
    active:scale-90 relative group overflow-visible
    ${forceDark 
      ? 'bg-transparent text-foreground' 
      : `bg-white/10 text-white hover:bg-white/20 md:border md:border-white/10 shadow-sm`}
  `;

  const getNotificationDeepLink = useCallback((notification: Notification): string | null => {
    const { type, data } = notification;
    switch (type) {
      case 'host_verification': return '/verification-status';
      case 'payment_verification': return '/account';
      case 'withdrawal_success':
      case 'withdrawal_failed': return '/payment';
      case 'new_booking':
        if (data?.item_id && data?.booking_type) return `/host-bookings/${data.booking_type}/${data.item_id}`;
        return '/host-bookings';
      case 'payment_confirmed': return '/bookings';
      case 'new_referral': return '/payment';
      case 'item_status':
      case 'item_hidden':
      case 'item_unhidden':
        if (data?.item_id && data?.item_type) return `/host-bookings/${data.item_type}/${data.item_id}`;
        return '/my-listing';
      default: return null;
    }
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    const deepLink = getNotificationDeepLink(notification);
    if (deepLink) {
      setIsOpen(false);
      navigate(deepLink);
    }
  }, [getNotificationDeepLink, navigate]);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    return () => { audioRef.current = null; };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const showInAppNotification = useCallback((notification: Notification) => {
    toast({ title: notification.title, description: notification.message });
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) {
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const channel = supabase.channel('notifications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          playNotificationSound();
          if (payload.new) showInAppNotification(payload.new as Notification);
          fetchNotifications();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, playNotificationSound, showInAppNotification]);

  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    if (!error) {
      fetchNotifications();
      toast({ title: "CLEARED!", description: "All notifications marked as read." });
    }
  };

  const categorizedNotifications = useMemo(() => categorizeNotifications(notifications), [notifications]);

  return (
    <div className="relative overflow-visible z-20">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className={headerIconStyles} aria-label="Notifications">
            <Bell className="h-5 w-5 stroke-[2.5px]" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-primary bg-accent text-[10px] font-black z-[50] text-accent-foreground"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>
        </SheetTrigger>
        
        <SheetContent className="w-full sm:max-w-md p-0 border-none bg-background [&>button]:hidden flex flex-col h-full overflow-hidden">
          {/* Header styled like Navigation Drawer Header */}
          <div className="px-5 pt-5 pb-4 border-b border-border/80 flex items-center justify-between flex-shrink-0 bg-primary text-primary-foreground">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-80 mb-0.5">Alerts</p>
              <SheetTitle className="text-xl font-black uppercase tracking-tighter text-white">
                Inbox
              </SheetTitle>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 px-2 py-4 [&::-webkit-scrollbar]:hidden">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-muted p-6 rounded-[24px] mb-4">
                  <Bell className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {categorizedNotifications.map(group => (
                  <div key={group.title} className="space-y-2">
                    <p className="px-4 text-[10px] font-black text-primary uppercase tracking-[0.22em]">
                      {group.title}
                    </p>
                    
                    {/* Brand Panel Container like drawer */}
                    <div className="brand-panel rounded-2xl overflow-hidden mx-2 divide-y divide-border/50 border border-border/40">
                      {group.notifications.map((notification) => {
                        const hasDeepLink = !!getNotificationDeepLink(notification);
                        return (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left p-4 transition-all duration-200 group relative flex items-start gap-3 hover:bg-accent/5 active:bg-accent/10 ${
                              notification.is_read ? "opacity-70" : "bg-card/30"
                            }`}
                          >
                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notification.is_read ? 'bg-muted-foreground/30' : 'bg-accent shadow-[0_0_8px_rgba(255,127,80,0.5)]'}`} />
                            
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-bold text-foreground truncate uppercase tracking-tight">
                                  {notification.title}
                                </h4>
                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter whitespace-nowrap">
                                  {format(new Date(notification.created_at), 'h:mm a')}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground leading-snug line-clamp-2">
                                {notification.message}
                              </p>
                            </div>

                            {hasDeepLink && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground/40 mt-1 group-hover:text-primary transition-colors" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Clear All Button - matching drawer logout/action style */}
                {unreadCount > 0 && (
                  <div className="px-4 pt-2">
                    <button 
                      onClick={markAllAsRead}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/10 text-primary hover:bg-primary/5 transition-all text-xs font-black uppercase tracking-widest"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};