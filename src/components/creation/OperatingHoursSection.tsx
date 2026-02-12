import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface WorkingDays {
  Mon: boolean;
  Tue: boolean;
  Wed: boolean;
  Thu: boolean;
  Fri: boolean;
  Sat: boolean;
  Sun: boolean;
}

interface OperatingHoursSectionProps {
  openingHours: string;
  closingHours: string;
  workingDays: WorkingDays;
  onOpeningChange: (value: string) => void;
  onClosingChange: (value: string) => void;
  onDaysChange: (days: WorkingDays) => void;
  accentColor?: string;
}

export const OperatingHoursSection = ({
  openingHours,
  closingHours,
  workingDays,
  onOpeningChange,
  onClosingChange,
  onDaysChange,
  accentColor = "#008080"
}: OperatingHoursSectionProps) => {
  const is24Hours = openingHours === "00:00" && closingHours === "23:59";

  const toggle24Hours = (checked: boolean) => {
    if (checked) {
      onOpeningChange("00:00");
      onClosingChange("23:59");
    } else {
      onOpeningChange("");
      onClosingChange("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operating Days</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(workingDays) as (keyof WorkingDays)[]).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onDaysChange({ ...workingDays, [day]: !workingDays[day] })}
              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                workingDays[day]
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
              }`}
              style={workingDays[day] ? { backgroundColor: accentColor } : {}}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* 24 Hours Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open 24 Hours</Label>
          <p className="text-[10px] text-muted-foreground">Toggle on if open all day</p>
        </div>
        <Switch checked={is24Hours} onCheckedChange={toggle24Hours} />
      </div>

      {!is24Hours && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opening Time</Label>
            <Input
              type="time"
              value={openingHours}
              onChange={(e) => onOpeningChange(e.target.value)}
              className="rounded-xl h-12 border-slate-100 bg-slate-50 font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Closing Time</Label>
            <Input
              type="time"
              value={closingHours}
              onChange={(e) => onClosingChange(e.target.value)}
              className="rounded-xl h-12 border-slate-100 bg-slate-50 font-bold"
            />
          </div>
        </div>
      )}
    </div>
  );
};
