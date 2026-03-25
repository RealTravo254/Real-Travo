import { Home, Ticket, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { AccountSheet } from "@/components/AccountSheet";
import { useOverlayClose } from "@/components/OverlayCloseContext";

export const MobileBottomBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { closeAll } = useOverlayClose();

  const navItems = [
    { icon: Home, label: t('nav.home'), path: "/" },
    { icon: Ticket, label: t('nav.bookings'), path: "/bookings" },
    { icon: Heart, label: t('nav.saved'), path: "/saved" },
    { icon: User, label: t('nav.profile'), path: user ? "/profile" : "/auth", opensSheet: true },
  ];

  return (
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[420] border-t border-border/80 bg-background/95 backdrop-blur-xl shadow-[0_-10px_30px_hsl(var(--foreground)/0.08)]"
      )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav className="flex items-center justify-around h-16 px-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            const NavContent = (
              <>
                <div
                  className={cn(
                    "absolute -top-3 w-8 h-1 rounded-full bg-primary transition-all duration-300",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )}
                />
                <div className={cn(
                  "p-2 rounded-2xl transition-all duration-300 mb-1",
                  isActive ? "bg-primary/10" : "bg-transparent group-active:scale-90"
                )}>
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-[0.1em] transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </>
            );

            if (item.opensSheet) {
              return (
                <AccountSheet key={item.path}>
                  <button
                    type="button"
                    className="relative flex flex-col items-center justify-center group"
                    aria-label={item.label}
                    onPointerDown={() => closeAll()}
                  >
                    {NavContent}
                  </button>
                </AccountSheet>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center group"
                onPointerDown={() => closeAll()}
              >
                {NavContent}
              </Link>
            );
          })}
        </nav>
      </div>
  );
};
