import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Calendar as CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface FilterValues {
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface LocationResult {
  id: string;
  name: string;
  location: string;
  country: string;
}

interface FilterBarProps {
  type?: "trips-events" | "hotels" | "adventure" | "accommodation";
  onApplyFilters?: (filters: FilterValues) => void;
}

export const FilterBar = ({ type = "trips-events", onApplyFilters }: FilterBarProps) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      const isEmptyQuery = !locationQuery.trim();
      setIsSearching(true);
      try {
        let allSuggestions: LocationResult[] = [];
        const searchTerm = `%${locationQuery}%`;
        const fetchLimit = isEmptyQuery ? 5 : 10;

        if (type === "trips-events") {
          let query = supabase.from("trips").select("id, name, location, place, country").eq("approval_status", "approved").limit(fetchLimit);
          if (!isEmptyQuery) query = query.or(`name.ilike.${searchTerm},location.ilike.${searchTerm},place.ilike.${searchTerm},country.ilike.${searchTerm}`);
          const { data, error } = await query;
          if (!error && data) allSuggestions = data.map(item => ({ id: item.id, name: item.name, location: item.location || item.place, country: item.country }));
        } else if (type === "hotels" || type === "accommodation") {
          let query = supabase.from("hotels").select("id, name, location, place, country").eq("approval_status", "approved").limit(fetchLimit);
          if (!isEmptyQuery) query = query.or(`name.ilike.${searchTerm},location.ilike.${searchTerm},place.ilike.${searchTerm},country.ilike.${searchTerm}`);
          if (type === "accommodation") query = query.eq("establishment_type", "accommodation_only");
          const { data, error } = await query;
          if (!error && data) allSuggestions = data.map(item => ({ id: item.id, name: item.name, location: item.location || item.place, country: item.country }));
        } else if (type === "adventure") {
          let query = supabase.from("adventure_places").select("id, name, location, place, country").eq("approval_status", "approved").limit(fetchLimit);
          if (!isEmptyQuery) query = query.or(`name.ilike.${searchTerm},location.ilike.${searchTerm},place.ilike.${searchTerm},country.ilike.${searchTerm}`);
          const { data, error } = await query;
          if (!error && data) allSuggestions = data.map(item => ({ id: item.id, name: item.name, location: item.location || item.place, country: item.country }));
        }

        const uniqueLocations = allSuggestions.reduce((acc, curr) => {
          if (acc.length >= 5 && isEmptyQuery) return acc;
          const key = `${curr.location}-${curr.country}`;
          if (!acc.find(item => `${item.location}-${item.country}` === key)) acc.push(curr);
          return acc;
        }, [] as LocationResult[]);

        setSuggestions(uniqueLocations);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [locationQuery, type, showSuggestions]);

  const handleApplyFilters = useCallback(() => {
    if (onApplyFilters) {
      onApplyFilters({ location: locationQuery || undefined, dateFrom, dateTo });
    }
  }, [locationQuery, dateFrom, dateTo, onApplyFilters]);

  useEffect(() => {
    if (dateFrom || dateTo) handleApplyFilters();
  }, [dateFrom, dateTo, handleApplyFilters]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4" ref={containerRef}>
      <div className="relative flex flex-row items-center bg-card border border-border rounded-2xl shadow-xl h-14 md:h-16">

        {/* WHERE */}
        <div className="flex flex-col flex-1 px-4 md:px-6 py-1 relative">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" /> Where
          </label>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Destinations"
              value={locationQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => { setLocationQuery(e.target.value); setShowSuggestions(true); }}
              className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 placeholder:text-muted-foreground/50 font-bold outline-none text-foreground w-full"
            />
            {locationQuery && (
              <button onClick={() => setLocationQuery("")} className="ml-1">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* SUGGESTIONS */}
          {showSuggestions && (
            <div className={cn(
              "absolute top-[120%] left-0 z-[100] py-4",
              "bg-card rounded-[24px] shadow-2xl border border-border",
              "animate-in fade-in slide-in-from-top-1",
              "w-[320px] xs:w-[380px] sm:w-[450px] max-w-[calc(100vw-2rem)]"
            )}>
              <p className="px-5 py-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                {isSearching ? "Searching..." : locationQuery ? "Top Matches" : "Popular Destinations"}
              </p>
              <div className="flex flex-col max-h-[340px] overflow-y-auto">
                {isSearching && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {!isSearching && suggestions.map((dest) => (
                  <button
                    key={dest.id}
                    onClick={() => {
                      const locationName = dest.location || dest.name;
                      setLocationQuery(locationName);
                      setShowSuggestions(false);
                      if (onApplyFilters) onApplyFilters({ location: locationName, dateFrom, dateTo });
                    }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted text-left group"
                  >
                    <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/10 transition-colors">
                      <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-foreground truncate">{dest.name}</p>
                      <p className="text-sm text-muted-foreground font-medium">{dest.location}, {dest.country}</p>
                    </div>
                  </button>
                ))}
                {!isSearching && locationQuery && suggestions.length === 0 && (
                  <p className="px-5 py-6 text-sm font-bold text-muted-foreground italic text-center">No matches found</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-[1px] h-8 bg-border self-center" />

        {/* FROM */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 md:px-6 py-1 cursor-pointer hover:bg-muted min-w-[100px]">
              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <CalendarIcon className="h-2.5 w-2.5" /> From
              </span>
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                {dateFrom ? format(dateFrom, "MMM dd") : "Any date"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="center">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} disabled={(date) => date < today} defaultMonth={dateFrom || today} initialFocus />
          </PopoverContent>
        </Popover>

        <div className="w-[1px] h-8 bg-border self-center" />

        {/* TO */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 md:px-6 py-1 cursor-pointer hover:bg-muted min-w-[100px]">
              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <CalendarIcon className="h-2.5 w-2.5" /> To
              </span>
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                {dateTo ? format(dateTo, "MMM dd") : "Any date"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="center">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} disabled={(date) => (dateFrom ? date < dateFrom : date < today)} defaultMonth={dateTo || dateFrom || today} initialFocus />
          </PopoverContent>
        </Popover>

        {/* SEARCH BUTTON */}
        <button
          onClick={handleApplyFilters}
          className="flex items-center justify-center text-primary-foreground h-full px-6 md:px-8 rounded-r-2xl transition-all bg-primary hover:bg-primary/90 active:scale-95"
        >
          <Search className="w-5 h-5 stroke-[3px]" />
        </button>
      </div>
    </div>
  );
};
