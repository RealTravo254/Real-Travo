import { ExternalLink } from "lucide-react";

interface ExternalBookingButtonProps {
  url: string;
  title?: string;
}

export const ExternalBookingButton = ({ url, title = "Reserve" }: ExternalBookingButtonProps) => {
  
  const handleBooking = () => {
    // This bypasses the dialog and opens the site directly
    // 'noopener,noreferrer' is essential for security and performance
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button 
      onClick={handleBooking}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold uppercase text-sm hover:opacity-90 transition-all"
    >
      {title}
      <ExternalLink className="h-4 w-4" />
    </button>
  );
};