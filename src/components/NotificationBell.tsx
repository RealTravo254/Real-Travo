import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bell, CheckCircle2, Trash2, Clock, ChevronRight } from "lucide-react";
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

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  RED: "#FF0000",
};

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

  // Keeping original icon styles as requested
  const headerIconStyles = `
    h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-200 
    active:scale-90 relative group overflow-visible
    ${forceDark 
      ? 'bg-transparent text-foreground' 
      : `bg-transparent text-white md:shadow-sm md:border md:border-slate-200 ${isIndexPage ? 'md:text-slate-800 md:bg-white/90 md:hover:bg-white' : 'md:text-slate-700 md:bg-slate-50 md:hover:bg-slate-100'}`}
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
          fetchNotifications();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, playNotificationSound]);

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
            <Bell className="h-5 w-5 stroke-[2.5px] transition-transform group-hover:rotate-12" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white text-[10px] font-black z-[50]"
                style={{ backgroundColor: COLORS.RED, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', pointerEvents: 'none' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>
        </SheetTrigger>
        
        <SheetContent className="brand-shell w-full sm:max-w-md p-0 flex flex-col border-none bg-background [&>button]:hidden">
          {/* Header Styled like Navigation Drawer */}
          <div className="px-5 pt-5 pb-4 border-b border-border/80 flex items-center justify-between flex-shrink-0 bg-primary text-primary-foreground">
            <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-80">Notifications</p>
                <SheetTitle className="text-xl font-black uppercase tracking-tighter text-white">Inbox</SheetTitle>
            </div>
            <div className="flex items-center gap-3">
               {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 py-1 px-3 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-xs font-bold hover:opacity-70 transition-opacity">
                  Cancel
                </button>
            </div>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="p-4 space-y-6">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="brand-panel p-6 rounded-[28px] mb-4">
                    <Bell className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {categorizedNotifications.map(group => (
                    <div key={group.title} className="space-y-2">
                      <p className="px-2 text-[10px] font-black text-primary uppercase tracking-[0.22em]">
                        {group.title}
                      </p>
                      
                      <div className="brand-panel rounded-xl overflow-hidden divide-y divide-border/70">
                        {group.notifications.map((notification) => {
                          const hasDeepLink = !!getNotificationDeepLink(notification);
                          return (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full flex items-center justify-between px-4 py-4 hover:bg-accent/5 transition-all active:scale-[0.98] group relative ${
                                !notification.is_read ? "bg-accent/[0.02]" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Dot indicator for unread */}
                                {!notification.is_read && (
                                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                                <div className="space-y-0.5 text-left flex-1 min-w-0">
                                  <h4 className={`text-sm font-bold truncate ${notification.is_read ? 'text-foreground/70' : 'text-foreground'}`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                                    {notification.message}
                                  </p>
                                  <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter pt-1">
                                    {format(new Date(notification.created_at), 'h:mm a')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                {hasDeepLink && (
                                  <div className="brand-icon-wrap p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};