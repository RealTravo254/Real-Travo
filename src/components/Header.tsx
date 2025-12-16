import { useState, useEffect } from "react";
import { Menu, Heart, Ticket, Shield, Home, FolderOpen, User, Search, Bell } from "lucide-react";
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
import { NotificationBell } from "./NotificationBell"; // <-- Component needs update to accept props

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
  
  // State for scroll position
  const [scrollPosition, setScrollPosition] = useState(0);

  // Check if current page is the index page ('/')
  const isIndexPage = location.pathname === "/";
  
  // Define the scroll handler
  const handleScroll = () => {
    setScrollPosition(window.pageYOffset);
  };
  
  // Attach and cleanup scroll listener
  useEffect(() => {
    if (isIndexPage) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      setScrollPosition(1); // Ensure non-index pages always have the solid background
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isIndexPage]);

  // Check if we are past the scroll threshold (50px)
  const isScrolled = scrollPosition > 50; 
  
  // Determine if we are on a small screen (mobile view)
  const isSmallScreen = window.innerWidth < 768; 

  // **Header Background Logic**
  let headerBgClass = "bg-[#008080] border-b-border dark:bg-[#008080]"; // Default (Desktop/Non-Index Page)
  let headerTextColorClass = "text-white dark:text-white"; // Default text color

  if (isIndexPage && isSmallScreen) {
    if (isScrolled) {
      // Scrolled on mobile index page: solid white background
      headerBgClass = "bg-white border-b border-border shadow-md"; 
      headerTextColorClass = "text-black dark:text-black";
    } else {
      // At top on mobile index page: fully transparent background (clear)
      headerBgClass = "bg-transparent border-b-transparent"; 
      headerTextColorClass = "text-white dark:text-white"; // Text color needed for the icons' Lucide elements
    }
  }

  // **Icon Button Background Logic (Mobile Index Page Only)**
  let iconBgClass = "bg-white/10 hover:bg-white/20"; // Default for icons (Desktop/Scrolled/Non-Index)
  let iconHoverTextClass = "group-hover:text-[#008080]"; // Default icon hover color

  if (isIndexPage && isSmallScreen) {
    if (isScrolled) {
      // Scrolled: Icons need light background on white header
      iconBgClass = "bg-gray-100 hover:bg-gray-200";
      iconHoverTextClass = "group-hover:text-[#008080]";
    } else {
      // At Top: Icons need rgba darker background for visibility on transparent header
      iconBgClass = "bg-black/30 hover:bg-black/40"; 
      iconHoverTextClass = "group-hover:text-white"; // Use white text for hover on dark background
    }
  }
  
  // Fetch user data (kept for completeness)
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

  return (
    // Apply dynamic header background and text color class
    <header className={`sticky top-0 z-50 w-full h-16 transition-colors duration-300 ${headerBgClass} ${headerTextColorClass}`}>
      <div className="container flex h-full items-center justify-between px-4">
        
        {/* Logo and Drawer Trigger (Left Side) */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              {/* Menu Icon: Apply conditional background */}
              <button 
                // Apply iconBgClass. For desktop/scrolled, it defaults to light.
                className={`inline-flex items-center justify-center h-10 w-10 rounded-md text-white transition-colors lg:bg-white/10 lg:hover:bg-[#006666] ${iconBgClass}`} 
                aria-label="Open navigation menu"
              >
                {/* Icon color needs to be white when transparent, and match text color when scrolled/desktop */}
                <Menu className={`h-5 w-5 ${isIndexPage && !isScrolled && isSmallScreen ? 'text-white' : 'text-current'}`} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 h-screen">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          {/* Logo and Name/Description: HIDDEN on all small screens (md:flex) */}
          {/* This satisfies the requirement "logo and name and description should not be there" */}
          <Link to="/" className="hidden md:flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-[#0066cc] font-bold text-lg">
              T
            </div>
            <div>
              <span className="font-bold text-base md:text-lg text-white block">
                TripTrac
              </span>
              <p className="text-xs text-white/90 block">Your journey starts now.</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation (Centered) */}
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
          
          {/* Search Icon Button: Apply conditional background */}
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
              // Applies iconBgClass (transparent/darker on mobile index top)
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors group lg:bg-white/10 lg:hover:bg-white ${iconBgClass}`}
              aria-label="Search"
            >
              <Search className={`h-5 w-5 ${isIndexPage && !isScrolled && isSmallScreen ? 'text-white' : 'text-current'} ${isIndexPage && isScrolled && isSmallScreen ? 'group-hover:text-[#008080]' : iconHoverTextClass}`} />
            </button>
          )}
          
          {/* Mobile: Notification Bell: Pass the conditional background class */}
          <div className="flex items-center gap-2"> 
            <NotificationBell 
              buttonClassName={iconBgClass} 
              iconColorClass={isIndexPage && !isScrolled && isSmallScreen ? 'text-white' : 'text-current'}
              iconHoverTextClass={isIndexPage && isScrolled && isSmallScreen ? 'group-hover:text-[#008080]' : iconHoverTextClass}
            />
          </div>

          {/* Desktop Auth Actions (Right Side) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Desktop Notification Bell (using standard background) */}
            <NotificationBell 
              buttonClassName="bg-white/10 hover:bg-white/20" 
              iconColorClass="text-white"
              iconHoverTextClass="group-hover:text-[#008080]"
            /> 
            
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