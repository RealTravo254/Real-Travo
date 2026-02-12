import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

/**
 * UTILITY: Opens a link in a new tab securely.
 * Use this to avoid 'X-Frame-Options' errors and popup blockers.
 */
export const openInNewTab = (url: string) => {
  // 'noopener' and 'noreferrer' are security best practices
  // they prevent the new page from accessing your window object.
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  
  // Optional: If the window opened, focus it
  if (newWindow) newWindow.focus();
};

export const DirectBookingButton = ({ url = "https://example.com/book" }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* This button triggers the external site instantly. 
          Because it is a direct result of a user click, 
          the browser will NOT block it.
      */}
      <Button 
        onClick={() => openInNewTab(url)}
        size="lg"
        className="font-bold px-8 h-12 rounded-full shadow-md hover:shadow-lg transition-all"
      >
        Book Now 
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>

      <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
        Opens in a secure browser tab
      </p>
    </div>
  );
};

export default DirectBookingButton;