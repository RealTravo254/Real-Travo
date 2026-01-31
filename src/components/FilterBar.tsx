import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const COLORS = {
  TEAL: "#008080",
};

// Mock data for the "Popular Destinations" look
const POPULAR_DESTINATIONS = [
  { name: "nairobi", country: "Kenya" },
  { name: "mombasa", country: "Kenya" },
  { name: "kisumu", country: "Kenya" },
  { name: "embu", country: "Kenya" },
  { name: "naivasha", country: "Kenya" },
];

export const FilterBar = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [locationQuery, setLocationQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (name: string) => {
    setLocationQuery(name);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4" ref={containerRef}>
      <div className="relative flex flex-row items-center bg-white border border-slate-100 rounded-2xl shadow-xl h-14 md:h-16">
        
        {/* WHERE SECTION */}
        <div className="flex flex-col flex-1 px-4 md:px-6 py-1 relative">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" /> Where
          </label>
          <input 
            type="text" 
            placeholder="Destinations" 
            value={locationQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 placeholder:text-slate-300 font-bold outline-none text-slate-700 w-full"
          />

          {/* SUGGESTIONS DROPDOWN (Matches Image) */}
          {showSuggestions && (
            <div className="absolute top-[120%] left-0 w-full md:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 py-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Popular Destinations
                </h3>
                
                <div className="flex flex-col max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {POPULAR_DESTINATIONS.map((dest, index) => (
                    <div 
                      key={index}
                      onClick={() => handleSelectLocation(dest.name)}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all group"
                    >
                      <div className="bg-slate-100 p-2.5 rounded-2xl group-hover:bg-white transition-colors">
                        <MapPin className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 leading-tight">
                          {dest.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {dest.country}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-[1px] h-8 bg-slate-100 self-center" />

        {/* FROM SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 md:px-6 py-1 cursor-pointer hover:bg-slate-50 min-w-[100px] transition-colors">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CalendarIcon className="h-2.5 w-2.5" /> From
              </span>
              <span className="text-sm font-bold text-slate-700">
                {dateFrom ? format(dateFrom, "MMM dd") : format(today, "MMM dd")}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="center">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              disabled={(date) => date < today}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="w-[1px] h-8 bg-slate-100 self-center" />

        {/* TO SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 md:px-6 py-1 cursor-pointer hover:bg-slate-50 min-w-[100px] transition-colors">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CalendarIcon className="h-2.5 w-2.5" /> To
              </span>
              <span className="text-sm font-bold text-slate-700">
                {dateTo ? format(dateTo, "MMM dd") : format(today, "MMM dd")}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="center">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              disabled={(date) => (dateFrom ? date < dateFrom : date < today)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* APPLY BUTTON */}
        <button
          className="flex items-center justify-center text-white h-full px-8 rounded-r-2xl transition-all hover:brightness-110 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${COLORS.TEAL} 0%, #006666 100%)` }}
        >
          <Search className="w-5 h-5 stroke-[3px]" />
        </button>
      </div>

      {/* Tailwind Style Extension for the scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};