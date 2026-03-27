import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Heart, Ticket, Home, User, LogIn, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationDrawer } from "./NavigationDrawer";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { AccountSheet } from "./AccountSheet";
import { useOverlayClose } from "@/components/OverlayCloseContext";

export interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
  className?: string;
  hideIcons?: boolean;
  __fromLayout?: boolean;
  desktopStatic?: boolean;
}

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
};

export const Header = ({ className, __fromLayout, desktopStatic = false }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showHostPopup, setShowHostPopup] = useState(false);
  const hostBtnRef = useRef<HTMLButtonElement>(null);
  const { subscribe } = useOverlayClose();

  useEffect(() => {
    return subscribe(() => setIsDrawerOpen(false));
  }, [subscribe]);

  if (!__fromLayout) return null;

  const isIndexPage = location.pathname === '/';

  const desktopHeaderClasses = "md:bg-white md:border-b md:border-slate-100 md:shadow-sm md:py-4";
  const positionClasses = desktopStatic
    ? "fixed top-0 left-0 right-0 md:static"
    : "fixed top-0 left-0 right-0";
  
  // Mobile: always solid bg
  const mobileHeaderBg = "bg-background border-b border-border";

  const menuIconStyles = `
    h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 
    text-foreground hover:bg-muted
    md:text-black md:bg-white md:border md:border-slate-200 md:shadow-sm md:hover:bg-slate-50
  `;

  const navItemClasses = (path: string) => `
    flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
    text-[10px] font-black uppercase tracking-[0.2em]
    ${location.pathname === path 
      ? 'text-[#008080] bg-[#008080]/5' 
      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}
  `;

  return (
    <header className={`${positionClasses} z-[100] transition-all flex items-center ${mobileHeaderBg} ${desktopHeaderClasses} ${className || ''}`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-14 md:h-16">
        
        {/* LEFT: MENU & LOGO */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={false}>
            <SheetTrigger asChild>
              <button className={menuIconStyles} aria-label="Open Menu">
                <Menu className="h-6 w-6 stroke-[2.5]" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="top-14 md:top-16 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] w-[300px] sm:max-w-[300px] p-0 border-none shadow-2xl rounded-none">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2 group">
            <span 
              className="text-xl font-black uppercase tracking-tighter transition-colors"
              style={{ color: COLORS.TEAL }}
            >
              RealTravo
            </span>
          </Link>
        </div>

        {/* CENTER: NAV (Big Screen Only) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100/50">
          <Link to="/" className={navItemClasses('/')}>
            <Home className="h-3.5 w-3.5" /> <span>{t('nav.home')}</span>
          </Link>
          <Link to="/bookings" className={navItemClasses('/bookings')}>
            <Ticket className="h-3.5 w-3.5" /> <span>{t('nav.bookings')}</span>
          </Link>
          <Link to="/company" className={navItemClasses('/company')}>
            <Building2 className="h-3.5 w-3.5" /> <span>Your Travel Partner</span>
          </Link>
          <div className="relative">
            <button
              ref={hostBtnRef}
              onClick={() => {
                if (user) {
                  navigate('/become-host');
                } else {
                  setShowHostPopup(prev => !prev);
                }
              }}
              className={navItemClasses('/become-host')}
            >
              <Home className="h-3.5 w-3.5" /> <span>Become a Host</span>
            </button>
            {showHostPopup && !user && (
              <>
                <div className="fixed inset-0 z-[199]" onClick={() => setShowHostPopup(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl p-4 z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-semibold text-foreground mb-3 text-center">Sign in to become a host</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { setShowHostPopup(false); navigate('/auth'); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:brightness-110 transition-all"
                    >
                      <LogIn className="h-3.5 w-3.5" /> Login
                    </button>
                    <button
                      onClick={() => { setShowHostPopup(false); navigate('/auth?tab=signup'); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-border text-foreground hover:bg-muted transition-all"
                    >
                      <User className="h-3.5 w-3.5" /> Sign Up
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          <div className="h-8 w-[1px] bg-slate-100 hidden md:block mx-1" />

          {user ? (
            <AccountSheet>
              <button 
                className="hidden md:flex h-11 px-6 rounded-2xl items-center gap-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-md hover:brightness-110 active:scale-95"
                style={{ backgroundColor: COLORS.TEAL, boxShadow: `0 4px 12px ${COLORS.TEAL}33` }}
              >
                <User className="h-4 w-4" />
                <span>{t('nav.profile')}</span>
              </button>
            </AccountSheet>
          ) : (
            <AccountSheet>
              <button 
                className="hidden md:flex h-11 px-6 rounded-2xl items-center gap-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-md hover:brightness-110 active:scale-95"
                style={{ backgroundColor: COLORS.CORAL, boxShadow: `0 4px 12px ${COLORS.CORAL}33` }}
              >
                <LogIn className="h-4 w-4" />
                <span>{t('nav.login')}</span>
              </button>
            </AccountSheet>
          )}
        </div>
      </div>
    </header>
  );
};
