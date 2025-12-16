import { useState, useEffect } from "react";
import { Menu, Heart, Ticket, Shield, Home, FolderOpen, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export const Header = ({ onSearchClick, showSearchIcon = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // State for scroll position (Still needed for the background change logic)
  const [scrollPosition, setScrollPosition] = useState(0);

  // Check if current page is the index page ('/')
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

  // Determine header background color
  const isScrolled = scrollPosition > 50; 
  
  // **Header Background Logic (Mobile only)**
  // When at the top of the index page on mobile: bg-transparent
  // When scrolled on the index page on mobile: bg-[#008080] (Teal)
  const mobileHeaderBgClass = isIndexPage && !isScrolled
    ? "bg-transparent border-b-transparent"
    : "bg-[#008080] border-b-border"; 

  // **Icon Button Background Logic (Mobile only)**
  // When at the top of the index page on mobile: rgba darker color (bg-black/30)
  // When scrolled on the index page on mobile: Standard semi-transparent white (bg-white/10)
  const iconBgClass = isIndexPage && !isScrolled
    ? "bg-black/30 hover:bg-black/40" 
    : "bg-white/10 hover:bg-white/20"; 

  /* --- User Data Fetching (Kept for completeness) --- */
  useEffect(() => {
    const checkRole = async () => {
      // ... (existing checkRole logic)
    };
    checkRole();
  }, [user]);

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      // ... (existing fetchUserProfile logic)
    };
    fetchUserProfile();
  }, [user]);

  const getUserInitials = () => {
    // ... (existing getUserInitials logic)
    return "U";
  };

  const [showMobileAccountDialog, setShowMobileAccountDialog] = useState(false);

  const handleMobileAccountTap = () => {
    if (!user) {
      window.location.href = "/auth";
    } else {
      setShowMobileAccountDialog(!showMobileAccountDialog);
    }
  };
  /* ------------------------------------------------ */

  return (
    // APPLYING FIXED POSITION AND RESPONSIVE DISPLAY
    // Small Screen: fixed top-0 w-full z-50 (Always visible, full width)
    // Medium/Desktop: sticky top-0 md:bg-[#008080] (Regular desktop header)
    <header className={`
        fixed top-0 w-full z-50 h-16 transition-colors duration-300
        ${mobileHeaderBgClass} 
        md:sticky md:bg-[#008080] md:border-b md:border-border md:dark:bg-[#008080]
    `}>
      <div className="container flex h-full items-center justify-between px-4">
        
        {/* Left Side: Menu Icon ONLY on small screen */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              {/* Menu Icon: Apply conditional background, always visible on mobile/desktop */}
              <button 
                className={`inline-flex items-center justify-center h-10 w-10 rounded-md text-white transition-colors lg:bg-white/10 lg:hover:bg-[#006666] ${iconBgClass} md:bg-white/10 md:hover:bg-white/20`} 
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 h-screen">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          {/* Logo and Name/Description: HIDDEN on all screens (Removed md:flex) */}
          {/* If you wanted it back on desktop, use: <Link to="/" className="hidden md:flex items-center gap-3"> */}
          <Link to="/" className="hidden">
            {/* ... Logo Content ... */}
          </Link>
        </div>

        {/* Desktop Navigation (Centered) - Hidden on mobile, only appears on large screens (lg:flex) */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link to="/bookings" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Ticket className="h-4 w-4" />
            <span>My Bookings</span>
          </Link>
          <Link to="/saved" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Heart className="h-4 w-4" />
            <span>Wishlist</span>
          </Link>
          <button 
            onClick={() => user ? navigate('/become-host') : navigate('/auth')} 
            className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Become a Host</span>
          </button>
        </nav>

        {/* Account Controls (Right Side) */}
        <div className="flex items-center gap-2">
          
          {/* Search Icon Button: Apply conditional background, always visible on mobile/desktop */}
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
              // Applies iconBgClass on mobile, standard background on desktop
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors group ${iconBgClass} md:bg-white/10 md:hover:bg-white/20`}
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-white group-hover:text-[#008080]" />
            </button>
          )}
          
          {/* Notification Bell: Apply conditional background, always visible on mobile/desktop */}
          <div className="flex items-center gap-2"> 
            {/* Pass iconBgClass for mobile/index transparency, default for desktop */}
            <NotificationBell buttonClassName={iconBgClass} desktopButtonClassName="bg-white/10 hover:bg-white/20" />
          </div>

          {/* Desktop Auth Actions (Theme Toggle & Account Icon) - HIDDEN on small screens */}
          <div className="hidden md:flex items-center gap-2">
            
            <ThemeToggle />
            
            {/* Account Button */}
            <button 
              onClick={() => user ? navigate('/account') : navigate('/auth')}
              className="rounded-full h-10 w-10 flex items-center justify-center transition-colors 
                                   bg-white/10 hover:bg-white group" 
              aria-label="Account"
            >
              <User className="h-5 w-5 text-white group-hover:text-[#008080]" /> 
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};