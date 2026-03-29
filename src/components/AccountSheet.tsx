import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight, User, Briefcase, CreditCard, Shield,
  LogOut, UserCog, LogIn,
  CalendarCheck, Settings, LayoutDashboard
} from "lucide-react";
import { useOverlayClose } from "@/components/OverlayCloseContext";
import { Button } from "@/components/ui/button";

interface AccountSheetProps {
  children: React.ReactNode;
}

export const AccountSheet = ({ children }: AccountSheetProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hostAccessPath, setHostAccessPath] = useState("/become-host");
  const [isOpen, setIsOpen] = useState(false);
  const { subscribe } = useOverlayClose();

  useEffect(() => {
    return subscribe(() => setIsOpen(false));
  }, [subscribe]);

  useEffect(() => {
    if (!user) {
      setUserName("");
      setUserAvatar(null);
      setUserRole(null);
      setHostAccessPath("/become-host");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [profileRes, rolesRes, companyRes, verificationRes] = await Promise.all([
          supabase.from("profiles").select("name, profile_picture_url, profile_completed").eq("id", user.id).single(),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          supabase.from("companies").select("verification_status").eq("user_id", user.id).maybeSingle(),
          supabase.from("host_verifications").select("status").eq("user_id", user.id).maybeSingle(),
        ]);

        const profileData = profileRes.data;
        if (profileData) {
          setUserName(profileData.name || "User");
          setUserAvatar(profileData.profile_picture_url || null);
        }

        if (rolesRes.data && rolesRes.data.length > 0) {
          const roleList = rolesRes.data.map(r => r.role);
          setUserRole(roleList.includes("admin") ? "admin" : "user");
        } else {
          setUserRole(null);
        }

        const companyStatus = companyRes.data?.verification_status;
        const verificationStatus = verificationRes.data?.status;

        const nextHostAccessPath = !profileData?.profile_completed
          ? "/complete-profile"
          : companyStatus === "pending" || verificationStatus === "pending"
            ? "/verification-status"
            : companyStatus === "rejected"
              ? "/company-registration"
              : verificationStatus === "rejected"
                ? "/host-verification"
                : "/become-host";

        setHostAccessPath(nextHostAccessPath);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const menuItems = [
    {
      section: "Creator Tools", items: [
        { icon: Briefcase, label: "Become a Host", path: hostAccessPath, show: true },
        { icon: LayoutDashboard, label: "My Listings", path: "/my-listing", show: true },
        { icon: CalendarCheck, label: "My Host Bookings", path: "/host-bookings", show: true },
      ]
    },
    {
      section: "Personal", items: [
        { icon: User, label: "Profile & Security", path: "/profile", show: true },
        { icon: CreditCard, label: "Payments & Earnings", path: "/payment", show: true },
      ]
    },
    {
      section: "Admin Control", items: [
        { icon: Shield, label: "Admin Dashboard", path: "/admin", show: userRole === "admin" },
        { icon: UserCog, label: "Host Verification", path: "/admin/verification", show: userRole === "admin" },
        { icon: Settings, label: "Referral Settings", path: "/admin/referral-settings", show: userRole === "admin" },
        { icon: CalendarCheck, label: "All Bookings", path: "/admin/all-bookings", show: userRole === "admin" },
        { icon: Briefcase, label: "Company Review", path: "/admin/companies", show: userRole === "admin" },
      ]
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>

      {/*
        side="right"  → panel slides in from the RIGHT edge, moving LEFTWARD.
                        Anchors to the account/login button on the right side. ✓
        inline style  → top/height offset by header height (3.5rem mobile / 4rem desktop)
                        so the panel starts BELOW the header, never behind it. ✓
        z-[90]        → sits UNDER the header (z-[100]) so header always stays on top. ✓
        [&>button]:hidden → hides shadcn default close X button (we use our own Cancel). ✓
      */}
      <SheetContent
        side="right"
        style={{
          top: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          height: 'calc(100dvh - 3.5rem - env(safe-area-inset-top, 0px))',
        }}
        className="brand-shell z-[90] w-[300px] sm:max-w-[300px] rounded-none p-0 pb-24 border-none bg-background flex flex-col [&>button]:hidden"
      >
        {/* Panel Header */}
        <div
          className="px-6 pt-5 pb-4 bg-primary text-primary-foreground border-b border-border/60 flex-shrink-0"
        >
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-black uppercase tracking-tighter text-primary-foreground">
                My Account
              </SheetTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </SheetHeader>

          {user && !loading && userName && (
            <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl border border-primary-foreground/10 bg-primary-light/70">
              <div className="h-12 w-12 rounded-full brand-icon-wrap flex items-center justify-center border border-primary-foreground/10 overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-bold text-lg">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary-foreground truncate">{userName}</p>
                <p className="text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-wider">
                  {userRole === "admin" ? "Administrator" : "Member"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 rounded-[28px] bg-muted/50 mb-6">
                <User className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-2">
                Welcome to RealTravo
              </h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs">
                Sign in to access your bookings, saved items, and host tools.
              </p>
              <Button
                onClick={() => handleNavigate('/auth')}
                className="w-full max-w-xs h-12 rounded-2xl font-black uppercase tracking-widest text-sm gap-2"
              >
                <LogIn className="h-4 w-4" />
                Login / Sign Up
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-[20px]" />
              <Skeleton className="h-20 w-full rounded-[20px]" />
              <Skeleton className="h-20 w-full rounded-[20px]" />
            </div>
          ) : (
            <div className="space-y-4">
              {menuItems.map((section, idx) => {
                const visibleItems = section.items.filter(item => item.show);
                if (visibleItems.length === 0) return null;
                return (
                  <div key={idx} className="space-y-2">
                    <h3 className="ml-2 text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                      {section.section}
                    </h3>
                    <div className="brand-panel rounded-[20px] overflow-hidden divide-y divide-border/60">
                      {visibleItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/5 transition-all active:scale-[0.98] group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="brand-icon-wrap p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                              <item.icon className="h-4 w-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-foreground">
                              {item.label}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-[20px] border border-accent/15 shadow-sm hover:bg-accent/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-accent/10 group-hover:bg-accent transition-colors">
                    <LogOut className="h-4 w-4 text-accent group-hover:text-accent-foreground" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight text-accent">
                    Log Out
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-accent/40 group-hover:text-accent" />
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};