import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function FilterBar() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex justify-center">
      {/* Outer Pill Container */}
      <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[40px] md:rounded-full shadow-md p-2 md:p-1.5 w-full md:w-fit">
        
        {/* WHERE SECTION */}
        <div className="flex flex-col justify-center px-6 md:px-8 py-2 w-full md:w-64">
          <label className="text-[11px] font-bold uppercase text-slate-900 dark:text-slate-100 tracking-tight">
            Where
          </label>
          <input 
            type="text" 
            placeholder="Destinations" 
            className="bg-transparent border-none p-0 text-[15px] md:text-base focus:ring-0 placeholder:text-slate-400 font-normal outline-none"
          />
        </div>

        {/* Divider 1 */}
        <div className="hidden md:block w-[1px] h-10 bg-slate-200 dark:bg-slate-800" />
        <div className="md:hidden w-full h-[1px] bg-slate-100 dark:bg-slate-900 my-1" />

        {/* FROM SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col justify-center px-6 md:px-8 py-2 w-full md:w-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl md:rounded-none transition-colors">
              <span className="text-[11px] font-bold uppercase text-slate-900 dark:text-slate-100 tracking-tight">
                From
              </span>
              <span className={cn("text-[15px] md:text-base font-normal", !dateFrom ? "text-slate-400" : "text-slate-700 dark:text-slate-300")}>
                {dateFrom ? format(dateFrom, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Divider 2 */}
        <div className="hidden md:block w-[1px] h-10 bg-slate-200 dark:bg-slate-800" />
        <div className="md:hidden w-full h-[1px] bg-slate-100 dark:bg-slate-900 my-1" />

        {/* TO SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col justify-center px-6 md:px-8 py-2 w-full md:w-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl md:rounded-none transition-colors">
              <span className="text-[11px] font-bold uppercase text-slate-900 dark:text-slate-100 tracking-tight">
                To
              </span>
              <span className={cn("text-[15px] md:text-base font-normal", !dateTo ? "text-slate-400" : "text-slate-700 dark:text-slate-300")}>
                {dateTo ? format(dateTo, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              disabled={(date) => date < (dateFrom || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* SEARCH BUTTON */}
        <div className="w-full md:w-auto p-1">
          <Button
            className="w-full md:w-auto h-12 md:h-[52px] px-8 rounded-full text-white font-bold text-[16px] flex items-center justify-center transition-all hover:brightness-110 active:scale-95 border-none"
            style={{ backgroundColor: "#008080" }}
          >
            <Search className="h-5 w-5 mr-2 stroke-[3px]" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}