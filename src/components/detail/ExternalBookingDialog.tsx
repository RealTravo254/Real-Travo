/**
 * Opens a URL in a new window that looks like a popup dialog.
 * Bypasses iframe restrictions and provides a clean user experience.
 */
export const openBookingPopup = (url: string, title: string = "Booking") => {
  // 1. Define the popup size
  const width = 600;
  const height = 800;

  // 2. Calculate the center of the screen
  // This takes into account the user's current browser window position
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  // 3. Define window features to hide browser UI (makes it look like a popup)
  const features = [
    `width=${width}`,
    `height=${height}`,
    `top=${top}`,
    `left=${left}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  // 4. Execute the open command
  const popup = window.open(url, "_blank", features);

  // 5. Handle potential blockers
  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    // If the popup was blocked, fall back to a standard new tab
    console.warn("Popup blocked. Falling back to a new tab.");
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    // Bring the popup to the front
    popup.focus();
  }
};

// --- Example Usage in a React Component ---

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function BookingSection() {
  const bookingUrl = "https://your-booking-provider.com/id=123";

  return (
    <div className="p-10 flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold">Ready to start?</h2>
      
      <Button 
        size="lg" 
        className="font-black uppercase"
        onClick={() => openBookingPopup(bookingUrl, "Reserve Now")}
      >
        Book Now <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
      
      <p className="text-xs text-muted-foreground">
        Opens securely in a new window.
      </p>
    </div>
  );
}