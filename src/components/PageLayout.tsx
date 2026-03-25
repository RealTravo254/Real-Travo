import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Header } from "@/components/Header";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { createContext, useContext, useState } from "react";
import { useIsPwa } from "@/hooks/useIsPwa";

interface SearchFocusContextType {
  isSearchFocused: boolean;
  setSearchFocused: (v: boolean) => void;
}

const SearchFocusContext = createContext<SearchFocusContextType>({
  isSearchFocused: false,
  setSearchFocused: () => {},
});

export const useSearchFocus = () => useContext(SearchFocusContext);

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isSearchFocused, setSearchFocused] = useState(false);
  const isPwa = useIsPwa();
  const isCategoryPage = pathname.startsWith("/category/");

  const shouldShowFooter =
    pathname === "/" || pathname === "/contact" || pathname === "/about" || pathname.startsWith("/category/");

  const shouldHideMobileBar =
    pathname === "/host-verification" || pathname === "/auth" || pathname === "/complete-profile";

  const isDetailPage =
    pathname.startsWith("/adventure/") || pathname.startsWith("/hotel/") ||
    pathname.startsWith("/event/") || pathname.startsWith("/trip/");

  const shouldHideHeader =
    pathname === "/auth" || pathname === "/reset-password" || pathname === "/forgot-password" ||
    pathname === "/verify-email" || pathname === "/complete-profile" || pathname.startsWith("/booking/") ||
    isDetailPage;

  const hideHeaderForSearch = isSearchFocused;

  const showFooterDesktopOnly = isPwa;

  const contentPadding = !shouldHideHeader && !hideHeaderForSearch
    ? 'pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-14'
    : '';

  return (
    <SearchFocusContext.Provider value={{ isSearchFocused, setSearchFocused }}>
      <div className="w-full min-h-screen flex flex-col">
        <OfflineIndicator />
        {!shouldHideHeader && !hideHeaderForSearch && (
          <Header __fromLayout />
        )}
        <div className={`flex-1 w-full pb-20 md:pb-0 ${contentPadding}`}>{children}</div>
        {shouldShowFooter && (
          <div className={showFooterDesktopOnly ? "hidden md:block" : "hidden md:block"}>
            <Footer />
          </div>
        )}
        {!shouldHideMobileBar && <MobileBottomBar />}
      </div>
    </SearchFocusContext.Provider>
  );
};
