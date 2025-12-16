import { useState, useEffect } from "react";
// Added User icon, which was used but not imported in the original code block
import { Menu, Search, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavigationDrawer } from "./NavigationDrawer";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}

// **Standard Desktop Icon Background Class**
// Matches the background/hover logic for Account and ThemeToggle on desktop (md/lg screens)
const DESKTOP_ICON_BG_CLASS = "lg:bg-white/10 lg:hover:bg-white/20";
// Note: We'll modify the Search icon's hover for consistency, as the original used 'hover:bg-white group-hover:text-[#008080]'

export const Header = ({ onSearchClick, showSearchIcon = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();

  const [scrollPosition, setScrollPosition] = useState(0);
  const isIndexPage = location.pathname === "/";

  const handleScroll = () => {
    setScrollPosition(window.pageYOffset);
  };

  useEffect(() => {
    if (isIndexPage) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      setScrollPosition(1);
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isIndexPage]);

  const isScrolled = scrollPosition > 50;

  // **Header Background Logic (Kept for mobile transparency)**
  // Note: window.innerWidth check must be inside useEffect or a custom hook for server-side rendering safety,
  // but for a quick fix based on provided code, we'll keep it as is, assuming client-side execution.
  const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const headerBgClass = isIndexPage && !isScrolled && isSmallScreen
    ? "bg-transparent border-b-transparent"
    : "bg-[#008080] border-b-border dark:bg-[#008080]";

  // **Mobile-Only Icon Background Logic (Darker for contrast on transparent header)**
  // This will apply ONLY on small screens when the header is transparent.
  // The DESKTOP_ICON_BG_CLASS will override this on large screens.
  const mobileTransparentIconBgClass = isIndexPage && !isScrolled && isSmallScreen
    ? "bg-black/30 hover:bg-black/40"
    : "bg-white/10 hover:bg-white/20";

  /* --- Component Body --- */

  return (
    <header className={`sticky top-0 z-50 w-full text-white h-16 transition-colors duration-300 ${headerBgClass}`}>
      <div className="container flex h-full items-center justify-between px-4">

        {/* LEFT SIDE: Menu Icon */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              {/* Menu Icon: Apply conditional mobile background, and the NEW consistent desktop background */}
              <button
                className={`inline-flex items-center justify-center h-10 w-10 rounded-md text-white transition-colors
                           ${mobileTransparentIconBgClass} ${DESKTOP_ICON_BG_CLASS}`}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 h-screen">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Placeholder for center alignment on desktop */}
          <div className="hidden lg:flex w-full justify-center"></div>
        </div>


        {/* RIGHT SIDE: Search and Notification Bell */}
        <div className="flex items-center gap-2">

          {/* Search Icon Button: Apply conditional mobile background, and the NEW consistent desktop background */}
          {showSearchIcon && (
            <button
              onClick={() => {
                if (onSearchClick) {
                  onSearchClick();
                } else {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              // Removed 'group' and specific hover colors. Now consistent with DESKTOP_ICON_BG_CLASS
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors
                          ${mobileTransparentIconBgClass} ${DESKTOP_ICON_BG_CLASS}`}
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-white" /> {/* Removed group-hover:text-[#008080] */}
            </button>
          )}

          {/* Notification Bell (Mobile Version - uses mobileTransparentIconBgClass) */}
          <div className="md:hidden flex items-center gap-2">
            {/* The NotificationBell component is responsible for applying the buttonClassName */}
            <NotificationBell buttonClassName={mobileTransparentIconBgClass} />
          </div>

          {/* Desktop Auth Actions (Right Side) - Hidden on mobile, uses standard DESKTOP_ICON_BG_CLASS */}
          <div className="hidden md:flex items-center gap-2">
            {/* Desktop Notification Bell (uses standard desktop background) */}
            <NotificationBell buttonClassName={DESKTOP_ICON_BG_CLASS} />

            <ThemeToggle />

            {/* Account Button (Reference for the desired style) */}
            <button
              onClick={() => user ? navigate('/account') : navigate('/auth')}
              // This is the reference style: bg-white/10 hover:bg-white/20
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors ${DESKTOP_ICON_BG_CLASS}`}
              aria-label="Account"
            >
              <User className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};