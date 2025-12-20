import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA",
};

export interface FilterValues {
  // Kept for backwards compatibility (no longer set by the FilterBar UI)
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
  checkIn?: Date;
  checkOut?: Date;
}

interface FilterBarProps {
  type: "trips-events" | "hotels" | "adventure";
  onApplyFilters: (filters: FilterValues) => void;
  collapsible?: boolean;
}

export const FilterBar = ({ type, onApplyFilters, collapsible = false }: FilterBarProps) => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  const handleApply = () => {
    const validationError = validateFilters();
    if (validationError) return alert(validationError);

    const filters: FilterValues = {};

    if (type === "trips-events") {
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
    } else if (type === "hotels") {
      if (checkIn) filters.checkIn = checkIn;
      if (checkOut) filters.checkOut = checkOut;
    }

    onApplyFilters(filters);
  };

  const handleClear = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCheckIn(undefined);
    setCheckOut(undefined);
    onApplyFilters({});
  };

  const validateFilters = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [dateFrom, dateTo, checkIn, checkOut];
    if (dates.some((d) => d && d < today)) return "Dates cannot be in the past";
    return null;
  };

  const hasActiveFilters = Boolean(dateFrom || dateTo || checkIn || checkOut);

  // Collapsed view - just a toggle button
  if (collapsible && !isExpanded) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsExpanded(true)}
        className="w-full h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          {hasActiveFilters ? (
            <span className="text-[#FF7F50]">Filters active</span>
          ) : (
            <span className="text-slate-500">Tap to filter</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </Button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-3 shadow-md border border-[#008080]/10 relative overflow-visible">
      {/* Decorative accent */}
      <div
        className="absolute top-0 left-0 w-full h-0.5"
        style={{ background: `linear-gradient(90deg, ${COLORS.TEAL} 0%, ${COLORS.CORAL} 100%)` }}
      />

      {/* Collapse button */}
      {collapsible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="absolute -top-1 right-2 h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600"
        >
          <ChevronUp className="h-3 w-3 mr-1" />
          Collapse
        </Button>
      )}

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        {/* Date Controls */}
        {type !== "adventure" && (
          <>
            <div className="flex-1">
              <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                {type === "hotels" ? "Check-In" : "From"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-9 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold group px-2.5"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400 group-hover:text-[#FF7F50]" />
                    {type === "hotels"
                      ? checkIn
                        ? format(checkIn, "MMM d")
                        : <span className="text-slate-300">Date</span>
                      : dateFrom
                        ? format(dateFrom, "MMM d")
                        : <span className="text-slate-300">Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-xl overflow-hidden" align="start">
                  <Calendar
                    mode="single"
                    selected={type === "hotels" ? checkIn : dateFrom}
                    onSelect={type === "hotels" ? setCheckIn : setDateFrom}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="p-2"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                {type === "hotels" ? "Check-Out" : "To"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-9 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold group px-2.5"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400 group-hover:text-[#FF7F50]" />
                    {type === "hotels"
                      ? checkOut
                        ? format(checkOut, "MMM d")
                        : <span className="text-slate-300">Date</span>
                      : dateTo
                        ? format(dateTo, "MMM d")
                        : <span className="text-slate-300">Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-xl overflow-hidden" align="start">
                  <Calendar
                    mode="single"
                    selected={type === "hotels" ? checkOut : dateTo}
                    onSelect={type === "hotels" ? setCheckOut : setDateTo}
                    disabled={(date) => {
                      const baseDate = (type === "hotels" ? checkIn : dateFrom) || new Date();
                      return date <= baseDate;
                    }}
                    className="p-2"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleApply}
            className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-95 border-none"
            style={{
              background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
            }}
          >
            <Search className="h-3.5 w-3.5 mr-1" />
            Search
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

