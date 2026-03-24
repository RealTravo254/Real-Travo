import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Heart, Ticket, Home, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationDrawer } from "./NavigationDrawer";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { AccountSheet } from "./AccountSheet";
import { useOverlayClose } from "@/components/OverlayCloseContext";

export interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
  className?: string;
  hideIcons?: boolean;
  __fromLayout?: boolean;
}

export const Header = ({ className, __fromLayout }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { subscribe } = useOverlayClose();

  useEffect(() => {
    return subscribe(() => setIsDrawerOpen(false));
  }, [subscribe]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();
    };
    fetchUserProfile();
  }, [user]);

  if (!__fromLayout) return null;

  // --- STYLING CONSTANTS ---
  // Large screen: White background, border bottom, higher padding
  const desktopHeaderClasses = "md:bg-white md:border-b md:border-slate-100 md:shadow-sm md:py-4";
  
  // Icon Button Styles (Matching NotificationBell logic)
  // Mobile: Black/20 background, White icon
  // Big Screen: Transparent background, Black icon, slate border
  const headerIconStyles = `
    h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 
    text-white bg-black/20 hover:bg-white/20
    md:text-black md:bg-white md:border md:border-slate-200 md:shadow-sm md:hover:bg-slate-50
  `;

  const navItemClasses = (path: string) => `
    flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
    text-[10px] font-black uppercase tracking-[0.2em]
    ${location.pathname === path 
      ? 'text-[#008080] bg-[#008080]/5' 
      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}
  `;

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all ${desktopHeaderClasses} ${className || ''}`}>
      <div className="container mx-auto px-4 flex items-center justify-between h-14 md:h-16">
        
        {/* Left Section: Menu & Logo */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <button className={headerIconStyles} aria-label="Open Menu">
                <Menu className="h-6 w-6 stroke-[2.5]" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-80 p-0 border-none">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2 group">
            <span className="hidden md:inline text-xl font-black uppercase tracking-tighter text-[#008080]">
              RealTravo
            </span>
          </Link>
        </div>

        {/* Center Section: Desktop Navigation (Styled like Drawer items) */}
        <nav className="hidden lg:flex items-center gap-2 bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
          <Link to="/" className={navItemClasses('/')}>
            <Home className="h-3.5 w-3.5" /> <span>{t('nav.home')}</span>
          </Link>
          <Link to="/bookings" className={navItemClasses('/bookings')}>
            <Ticket className="h-3.5 w-3.5" /> <span>{t('nav.bookings')}</span>
          </Link>
          <Link to="/saved" className={navItemClasses('/saved')}>
            <Heart className="h-3.5 w-3.5" /> <span>{t('nav.wishlist')}</span>
          </Link>
        </nav>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="h-8 w-[1px] bg-slate-100 hidden md:block mx-1" />

          {user ? (
            <AccountSheet>
              <button className="hidden md:flex h-11 px-6 rounded-2xl items-center gap-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] text-white bg-[#008080] hover:brightness-110 shadow-md shadow-[#008080]/20">
                <User className="h-4 w-4" />
                <span>{t('nav.profile')}</span>
              </button>
            </AccountSheet>
          ) : (
            <button 
              onClick={() => navigate('/auth')} 
              className="hidden md:flex h-11 px-6 rounded-2xl items-center gap-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] text-white bg-[#FF7F50] hover:brightness-110 shadow-md shadow-[#FF7F50]/20"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('nav.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};