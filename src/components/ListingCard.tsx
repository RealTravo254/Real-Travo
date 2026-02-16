import { useState, memo, useCallback, useMemo, useEffect } from "react";
import { MapPin, Heart, Star, Calendar, Ticket, ArrowRight, Map } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, optimizeSupabaseImage } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createDetailPath } from "@/lib/slugUtils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

// Updated Color Palette for a more premium feel
const COLORS = {
  PRIMARY: "#0d9488", // Teal 600
  PRIMARY_DARK: "#0f766e", // Teal 700
  ACCENT: "#f43f5e", // Rose 500
  GOLD: "#f59e0b", // Amber 500
  SURFACE: "#ffffff",
  MUTED: "#64748b", // Slate 500
};

interface ListingCardProps {
  id: string;
  type: 'TRIP' | 'EVENT' | 'SPORT' | 'HOTEL' | 'ADVENTURE PLACE' | 'ACCOMMODATION' | 'ATTRACTION';
  name: string;
  imageUrl: string;
  location: string;
  country: string;
  price?: number;
  date?: string;
  isCustomDate?: boolean;
  isFlexibleDate?: boolean;
  isOutdated?: boolean;
  onSave?: (id: string, type: string) => void;
  isSaved?: boolean;
  amenities?: string[];
  activities?: any[];
  hidePrice?: boolean;
  availableTickets?: number;
  bookedTickets?: number;
  showBadge?: boolean;
  priority?: boolean;
  minimalDisplay?: boolean;
  hideEmptySpace?: boolean;
  compact?: boolean;
  distance?: number;
  avgRating?: number;
  reviewCount?: number;
  place?: string;
  showFlexibleDate?: boolean;
}

const ListingCardComponent = ({
  id, type, name, imageUrl, location, country, price, date,
  isOutdated = false, onSave, isSaved = false, activities, 
  hidePrice = false, availableTickets = 0, bookedTickets = 0, 
  priority = false, compact = false, avgRating, distance, place,
  isFlexibleDate = false
}: ListingCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSavedLocal, setIsSavedLocal] = useState(isSaved);
  const navigate = useNavigate();

  useEffect(() => {
    setIsSavedLocal(isSaved);
  }, [isSaved]);

  const { ref: imageContainerRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '300px',
    triggerOnce: true
  });

  const shouldLoadImage = priority || isIntersecting;
  const isEventOrSport = useMemo(() => type === "EVENT" || type === "SPORT", [type]);
  const isTrip = useMemo(() => type === "TRIP", [type]);
  const tracksAvailability = useMemo(() => isEventOrSport || isTrip, [isEventOrSport, isTrip]);
  
  const remainingTickets = useMemo(() => availableTickets - bookedTickets, [availableTickets, bookedTickets]);
  const isSoldOut = useMemo(() => tracksAvailability && availableTickets > 0 && remainingTickets <= 0, [tracksAvailability, availableTickets, remainingTickets]);
  const fewSlotsRemaining = useMemo(() => tracksAvailability && remainingTickets > 0 && remainingTickets <= 10, [tracksAvailability, remainingTickets]);
  const isUnavailable = useMemo(() => isOutdated || isSoldOut, [isOutdated, isSoldOut]);

  const optimizedImageUrl = useMemo(() => optimizeSupabaseImage(imageUrl, { width: 600, height: 450, quality: 85 }), [imageUrl]);
  const displayType = useMemo(() => isEventOrSport ? "Event & Sports" : type.replace('_', ' '), [isEventOrSport, type]);
  
  const formattedName = useMemo(() => {
    return name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }, [name]);
  
  const locationString = useMemo(() => [place, location].filter(Boolean).join(', '), [place, location]);

  const handleCardClick = useCallback(() => {
    const typeMap: Record<string, string> = {
      "TRIP": "trip", "EVENT": "event", "SPORT": "event", "HOTEL": "hotel",
      "ADVENTURE PLACE": "adventure", "ACCOMMODATION": "accommodation", "ATTRACTION": "attraction"
    };
    navigate(createDetailPath(typeMap[type], id, name, location));
  }, [navigate, type, id, name, location]);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavedLocal(!isSavedLocal);
    onSave?.(id, type);
  };

  return (
    <Card 
      onClick={handleCardClick} 
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[32px] border-none bg-white transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
        compact ? "h-auto" : "h-full",
        isUnavailable && "opacity-90 grayscale-[0.3]"
      )}
    >
      {/* Media Wrapper */}
      <div 
        ref={imageContainerRef} 
        className="relative aspect-[4/3] w-full overflow-hidden"
      >
        {/* Background Overlay Gradients */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-slate-200" />
        )}
        
        {shouldLoadImage && !imageError && (
          <img 
            src={optimizedImageUrl} 
            alt={name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
                "absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110", 
                imageLoaded ? "opacity-100" : "opacity-0"
            )} 
          />
        )}

        {/* Top Badges (Left) */}
        <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
          <Badge className="w-fit border-none bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900 backdrop-blur-md shadow-sm">
            {displayType}
          </Badge>
          {avgRating && (
            <div className="flex w-fit items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-white backdrop-blur-md">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Save Button */}
        {onSave && (
          <button 
            onClick={handleSaveClick}
            className={cn(
                "absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90 shadow-xl", 
                isSavedLocal ? "bg-white" : "bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white"
            )}
          >
            <Heart className={cn("h-5 w-5 transition-colors", isSavedLocal ? "fill-rose-500 text-rose-500" : "text-white group-hover:text-slate-900")} />
          </button>
        )}

        {/* Sold Out Overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rotate-[-12deg] rounded-lg border-2 border-white/80 px-4 py-1 text-sm font-black uppercase tracking-tighter text-white">
               {isSoldOut ? 'Sold Out' : 'Unavailable'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex flex-1 flex-col p-5"> 
        <div className="mb-2 flex items-start justify-between">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-800 transition-colors group-hover:text-teal-600">
            {formattedName}
          </h3>
        </div>
        
        <div className="mb-4 flex items-center gap-1.5 text-slate-500">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                <MapPin className="h-3 w-3" />
            </div>
            <p className="text-xs font-medium truncate capitalize">
                {locationString.toLowerCase()}
            </p>
        </div>

        {/* Activity Tag Group */}
        {activities && activities.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activities.slice(0, 2).map((act, i) => (
              <span key={i} className="rounded-lg bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">
                #{typeof act === 'string' ? act : act.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Modern Footer */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-5">
            <div className="space-y-0.5">
                {!hidePrice && price != null && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {['HOTEL', 'ACCOMMODATION'].includes(type) ? 'Per Night' : 'From'}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className={cn("text-xl font-black text-slate-900", isUnavailable && "text-slate-300 line-through")}>
                            KSh {price.toLocaleString()}
                        </span>
                    </div>
                  </>
                )}
            </div>

            <div className="flex flex-col items-end gap-2">
                {/* Date Badge */}
                {(date || isFlexibleDate) && (
                  <div className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1 shadow-sm border",
                    isFlexibleDate ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-white border-slate-100 text-slate-600"
                  )}>
                      <Calendar className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase">
                          {isFlexibleDate ? 'Flexible' : new Date(date!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                  </div>
                )}
                
                {/* Availability Info */}
                <div className="flex items-center">
                  {isOutdated ? (
                    <span className="text-[10px] font-bold text-slate-400">Past Date</span>
                  ) : isSoldOut ? (
                    <span className="text-[10px] font-bold text-rose-500">Fully Booked</span>
                  ) : fewSlotsRemaining ? (
                    <div className="animate-pulse flex items-center gap-1 text-[10px] font-black text-orange-600">
                        <Ticket className="h-3 w-3" /> {remainingTickets} LEFT!
                    </div>
                  ) : (tracksAvailability && availableTickets > 0) && (
                    <span className="text-[10px] font-bold text-teal-600">
                        {remainingTickets} Spots
                    </span>
                  )}
                </div>
            </div>
        </div>
      </div>

      {/* Subtle Hover Indicator */}
      <div className="absolute bottom-0 h-1 w-0 bg-teal-500 transition-all duration-500 group-hover:w-full" />
    </Card>
  );
};

export const ListingCard = memo(ListingCardComponent);