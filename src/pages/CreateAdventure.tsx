import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSafeBack } from "@/hooks/useSafeBack";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin, Navigation, Clock, X, Plus, Camera,
  CheckCircle2, Info, ArrowLeft, Loader2, DollarSign,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CountrySelector } from "@/components/creation/CountrySelector";
import { PhoneInput } from "@/components/creation/PhoneInput";
import { compressImages } from "@/lib/imageCompression";
import { OperatingHoursSection } from "@/components/creation/OperatingHoursSection";
import { GeneralFacilitiesSelector } from "@/components/creation/GeneralFacilitiesSelector";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
};

let _idCounter = 0;
const makeId = () => `item-${Date.now()}-${++_idCounter}`;

const generateFriendlyId = (name: string): string => {
  const cleanName = name
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 30);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${cleanName}-${code}`;
};

const safeObjectUrl = (file: File): string => {
  try { return URL.createObjectURL(file); } catch { return ""; }
};

// ─── Shared item type (used for both Facilities and Activities) ───────────────

interface ListItem {
  id: string;
  name: string;
  amenities: string;   // facilities only
  price: string;       // facilities only
  images: File[];
  previewUrls: string[];
  saved: boolean;
}

const emptyFacility = (): ListItem => ({
  id: makeId(), name: "", amenities: "", price: "",
  images: [], previewUrls: [], saved: false,
});

const emptyActivity = (): ListItem => ({
  id: makeId(), name: "", amenities: "", price: "",
  images: [], previewUrls: [], saved: false,
});

// ─── Reusable item list builder ───────────────────────────────────────────────

interface ItemListBuilderProps {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  showErrors: boolean;
  onValidationFail: (msg: string) => void;
  label: string;
  namePlaceholder: string;
  accentColor: string;
  showAmenities: boolean;
  showPrice: boolean;
  minPhotos: number;
  requireSave: boolean;
}

const ItemListBuilder = ({
  items, onChange, showErrors, onValidationFail,
  label, namePlaceholder, accentColor,
  showAmenities, showPrice, minPhotos, requireSave,
}: ItemListBuilderProps) => {

  const update = (id: string, patch: Partial<ListItem>) =>
    onChange(items.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addItem = () => onChange([...items, emptyFacility()]);
  const removeItem = (id: string) => onChange(items.filter((f) => f.id !== id));

  const handleImages = async (id: string, fileList: FileList | null, existing: File[]) => {
    if (!fileList || fileList.length === 0) return;
    const slots = 5 - existing.length;
    if (slots <= 0) return;
    const incoming = Array.from(fileList).slice(0, slots);
    let merged: File[];
    try {
      const compressed = await compressImages(incoming);
      merged = [...existing, ...compressed.map((c) => c.file)].slice(0, 5);
    } catch {
      merged = [...existing, ...incoming].slice(0, 5);
    }
    update(id, { images: merged, previewUrls: merged.map(safeObjectUrl) });
  };

  const removeImage = (id: string, idx: number, existing: File[]) => {
    const updated = existing.filter((_, i) => i !== idx);
    update(id, { images: updated, previewUrls: updated.map(safeObjectUrl) });
  };

  const saveItem = (item: ListItem) => {
    if (!item.name.trim()) { onValidationFail(`Please enter a name for this ${label.toLowerCase()}.`); return; }
    if (showAmenities && !item.amenities.trim()) { onValidationFail("Please fill in the amenities field."); return; }
    if (item.images.length < minPhotos) { onValidationFail(`Please add at least ${minPhotos} photo${minPhotos > 1 ? "s" : ""}.`); return; }
    update(item.id, { saved: true });
  };

  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</Label>

      {items.map((item) => (
        <div key={item.id} className={cn(
          "rounded-2xl border-2 overflow-hidden transition-all",
          item.saved ? "border-opacity-30 bg-opacity-5" : "border-slate-200 bg-white"
        )} style={item.saved ? { borderColor: accentColor + "4D", backgroundColor: accentColor + "0D" } : {}}>

          {/* ── Saved summary ── */}
          {item.saved ? (
            <div className="p-4 flex items-center gap-4">
              <div className="flex gap-2 shrink-0">
                {item.previewUrls.slice(0, 3).map((url, i) =>
                  url ? <img key={i} src={url} className="w-12 h-12 rounded-xl object-cover border border-slate-200" alt="" />
                      : <div key={i} className="w-12 h-12 rounded-xl bg-slate-200" />
                )}
                {item.previewUrls.length > 3 && (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500">
                    +{item.previewUrls.length - 3}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-slate-800 truncate">{item.name}</p>
                {showAmenities && <p className="text-[11px] text-slate-500 truncate">{item.amenities}</p>}
                {showPrice && item.price && <p className="text-[11px] font-bold" style={{ color: accentColor }}>KSh {item.price}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => update(item.id, { saved: false })}
                  className="text-[10px] font-black uppercase tracking-widest border rounded-lg px-3 py-1.5 transition-colors"
                  style={{ color: accentColor, borderColor: accentColor + "4D" }}>
                  Edit
                </button>
                <button type="button" onClick={() => removeItem(item.id)}
                  className="text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                  Remove
                </button>
              </div>
            </div>

          ) : (
            /* ── Edit form ── */
            <div className="p-4 space-y-4">
              <div className={cn("grid gap-3", showPrice ? "grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Name *</Label>
                  <Input value={item.name} onChange={(e) => update(item.id, { name: e.target.value })}
                    placeholder={namePlaceholder}
                    className={cn("rounded-xl h-10 font-bold text-sm", showErrors && !item.name.trim() && "border-red-500 bg-red-50")} />
                </div>
                {showPrice && (
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Price (KSh)</Label>
                    <Input type="number" value={item.price} onChange={(e) => update(item.id, { price: e.target.value })}
                      placeholder="0" className="rounded-xl h-10 font-bold text-sm" />
                  </div>
                )}
              </div>

              {showAmenities && (
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Amenities *</Label>
                  <Input value={item.amenities} onChange={(e) => update(item.id, { amenities: e.target.value })}
                    placeholder="e.g. Firepit, Showers, Electricity"
                    className={cn("rounded-xl h-10 font-bold text-sm", showErrors && !item.amenities.trim() && "border-red-500 bg-red-50")} />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Photos <span className="text-slate-300 normal-case font-medium">(min {minPhotos}, max 5)</span>
                  {showErrors && item.images.length < minPhotos && (
                    <span className="text-red-500 ml-2">— at least {minPhotos} required</span>
                  )}
                </Label>
                <div className={cn(
                  "flex flex-wrap gap-2 p-3 rounded-xl border-2",
                  showErrors && item.images.length < minPhotos ? "border-red-400 bg-red-50" : "border-dashed border-slate-200"
                )}>
                  {item.previewUrls.map((url, i) =>
                    url ? (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button type="button" onClick={() => removeImage(item.id, i, item.images)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : null
                  )}
                  {item.images.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 shrink-0">
                      <Plus className="h-4 w-4 text-slate-400" />
                      <span className="text-[8px] font-black uppercase text-slate-400 mt-0.5">Photo</span>
                      <input type="file" multiple className="hidden" accept="image/*"
                        onChange={(e) => handleImages(item.id, e.target.files, item.images)} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" onClick={() => saveItem(item)}
                  className="flex-1 h-10 rounded-xl font-black uppercase text-[10px] tracking-widest text-white"
                  style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)` }}>
                  Save {label.replace(/\s*\(.*\)/, "").trim()}
                </Button>
                {items.length > 1 && (
                  <Button type="button" onClick={() => removeItem(item.id)} variant="ghost"
                    className="h-10 px-4 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <Button type="button" onClick={addItem} variant="outline"
        className="w-full h-11 rounded-xl font-black uppercase text-[10px] tracking-widest border-dashed border-2 border-slate-200 text-slate-400"
        style={{ ["--hover-color" as any]: accentColor }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor; (e.currentTarget as HTMLButtonElement).style.color = accentColor; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = ""; (e.currentTarget as HTMLButtonElement).style.color = ""; }}>
        <Plus className="h-4 w-4 mr-2" /> Add {label.replace(/\s*\(.*\)/, "").trim()}
      </Button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CreateAdventure = () => {
  const navigate = useNavigate();
  const goBack = useSafeBack("/become-host");
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [formData, setFormData] = useState({
    registrationName: "", registrationNumber: "", locationName: "", place: "",
    country: "", description: "", email: "", phoneNumber: "",
    openingHours: "00:00", closingHours: "23:59",
    entranceFeeType: "free", adultPrice: "0", childPrice: "0",
    latitude: null as number | null, longitude: null as number | null,
  });

  const [workingDays, setWorkingDays] = useState({
    Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true,
  });

  const [generalFacilities, setGeneralFacilities] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<ListItem[]>(() => [emptyFacility()]);
  const [activities, setActivities] = useState<ListItem[]>(() => [emptyActivity()]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const onValidationFail = useCallback(
    (msg: string) => toast({ title: "Required", description: msg, variant: "destructive" }),
    [toast]
  );

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("country").eq("id", user.id).single()
      .then(({ data }) => {
        if (data?.country) setFormData((p) => ({ ...p, country: data.country }));
      });
  }, [user]);

  const isMissing = (v: any) => {
    if (!showErrors) return false;
    if (typeof v === "string") return !v.trim();
    return v === null || v === undefined;
  };

  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFormData((p) => ({ ...p, latitude: coords.latitude, longitude: coords.longitude }));
        toast({ title: "Location captured", description: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` });
      },
      () => toast({ title: "GPS Error", description: "Could not get location.", variant: "destructive" })
    );
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = 5 - galleryImages.length;
    if (slots <= 0) return;
    const incoming = Array.from(files).slice(0, slots);
    let merged: File[];
    try {
      const compressed = await compressImages(incoming);
      merged = [...galleryImages, ...compressed.map((c) => c.file)].slice(0, 5);
    } catch {
      merged = [...galleryImages, ...incoming].slice(0, 5);
    }
    setGalleryImages(merged);
    setGalleryPreviews(merged.map(safeObjectUrl));
  };

  const removeGalleryImage = (idx: number) => {
    const updated = galleryImages.filter((_, i) => i !== idx);
    setGalleryImages(updated);
    setGalleryPreviews(updated.map(safeObjectUrl));
  };

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user!.id}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    setShowErrors(true);

    if (!formData.registrationName.trim() || !formData.registrationNumber.trim() ||
        !formData.country || !formData.locationName.trim() || !formData.place.trim() ||
        !formData.latitude || !formData.description.trim() || galleryImages.length === 0) {
      toast({ title: "Action Required", description: "Please fill in all mandatory fields.", variant: "destructive" });
      return;
    }

    if (facilities.some((f) => !f.saved)) {
      toast({ title: "Unsaved Facility", description: "Please save all facilities before submitting.", variant: "destructive" });
      return;
    }
    if (facilities.some((f) => !f.name.trim() || !f.amenities.trim() || f.images.length < 2)) {
      toast({ title: "Facility Incomplete", description: "Each facility needs a name, amenities, and at least 2 photos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const friendlyId = generateFriendlyId(formData.registrationName);
      const { data: existing } = await supabase.from("adventure_places").select("id").eq("id", friendlyId).single();
      const finalId = existing ? generateFriendlyId(formData.registrationName) : friendlyId;

      // Upload gallery
      const galleryUrls = await Promise.all(galleryImages.map((f) => uploadFile(f, "gallery")));

      // Upload facilities
      const facilitiesForDB = await Promise.all(
        facilities.map(async (fac) => ({
          name: fac.name,
          amenities: fac.amenities,
          price: fac.price ? parseFloat(fac.price) || 0 : 0,
          images: await Promise.all(fac.images.map((f) => uploadFile(f, "fac"))),
        }))
      );

      // Upload activities (only saved ones with a name)
      const savedActivities = activities.filter((a) => a.name.trim());
      const activitiesForDB = await Promise.all(
        savedActivities.map(async (act) => ({
          name: act.name,
          images: await Promise.all(act.images.map((f) => uploadFile(f, "act"))),
        }))
      );

      const selectedDays = Object.entries(workingDays).filter(([, v]) => v).map(([k]) => k);

      const { error } = await supabase.from("adventure_places").insert([{
        id: finalId,
        name: formData.registrationName,
        registration_number: formData.registrationNumber,
        location: formData.locationName,
        place: formData.place,
        country: formData.country,
        description: formData.description,
        email: formData.email,
        phone_numbers: formData.phoneNumber ? [formData.phoneNumber] : [],
        map_link: formData.latitude ? `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}` : "",
        latitude: formData.latitude,
        longitude: formData.longitude,
        opening_hours: formData.openingHours,
        closing_hours: formData.closingHours,
        days_opened: selectedDays,
        image_url: galleryUrls[0] ?? "",
        gallery_images: galleryUrls,
        entry_fee_type: formData.entranceFeeType,
        entry_fee: formData.entranceFeeType === "paid" ? parseFloat(formData.adultPrice) || 0 : 0,
        child_entry_fee: formData.entranceFeeType === "paid" ? parseFloat(formData.childPrice) || 0 : 0,
        amenities: generalFacilities,
        facilities: facilitiesForDB,
        activities: activitiesForDB,
        created_by: user.id,
        approval_status: "pending",
      }]);

      if (error) throw error;
      toast({ title: "Experience Submitted", description: `ID: ${finalId} — Pending admin review.`, duration: 5000 });
      navigate("/become-host");
    } catch (err: any) {
      toast({ title: "Submission Error", description: err?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header />

      {/* Hero */}
      <div className="relative h-[30vh] w-full overflow-hidden bg-slate-900">
        <img src="/images/category-campsite.webp" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-transparent to-transparent" />
        <Button onClick={goBack} className="absolute top-4 left-4 rounded-full bg-black/30 backdrop-blur-md text-white border-none w-10 h-10 p-0 z-50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-8 left-0 w-full px-8 container max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-2xl">
            Create <span style={{ color: COLORS.KHAKI }}>Adventure</span>
          </h1>
        </div>
      </div>

      <main className="container px-4 max-w-4xl mx-auto -mt-6 relative z-50 space-y-6">

        {/* Registration */}
        <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#008080]/10 text-[#008080]"><Info className="h-5 w-5" /></div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Registration</h2>
          </div>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Name *</Label>
              <Input value={formData.registrationName} onChange={(e) => setFormData({ ...formData, registrationName: e.target.value })}
                placeholder="Official Government Name"
                className={cn("rounded-xl h-12 font-bold", isMissing(formData.registrationName) && "border-red-500 bg-red-50")} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Number *</Label>
                <Input value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="e.g. BN-X12345"
                  className={cn("rounded-xl h-12 font-bold", isMissing(formData.registrationNumber) && "border-red-500 bg-red-50")} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Country *</Label>
                <div className={cn("rounded-xl", isMissing(formData.country) && "border-2 border-red-500 overflow-hidden")}>
                  <CountrySelector value={formData.country} onChange={(v) => setFormData({ ...formData, country: v })} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#FF7F50]/10 text-[#FF7F50]"><MapPin className="h-5 w-5" /></div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Location Details</h2>
          </div>
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location Name *</Label>
                <Input value={formData.locationName} onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  placeholder="Area / Forest / Beach"
                  className={cn("rounded-xl h-12 font-bold", isMissing(formData.locationName) && "border-red-500 bg-red-50")} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Place (City/Town) *</Label>
                <Input value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  placeholder="e.g. Nairobi"
                  className={cn("rounded-xl h-12 font-bold", isMissing(formData.place) && "border-red-500 bg-red-50")} />
              </div>
            </div>
            <div className={cn("p-4 rounded-2xl border-2 transition-all", isMissing(formData.latitude) ? "border-red-500 bg-red-50" : "bg-[#F0E68C]/10 border-[#F0E68C]/30")}>
              <Button type="button" onClick={getCurrentLocation}
                className="w-full text-white rounded-2xl px-6 h-14 font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all"
                style={{ background: formData.latitude ? COLORS.TEAL : COLORS.KHAKI_DARK }}>
                <Navigation className="h-5 w-5 mr-3" />
                {formData.latitude ? "✓ Location Captured" : "Tap to Auto-Capture GPS"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Contact & About */}
        <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#008080]/10 text-[#008080]"><CheckCircle2 className="h-5 w-5" /></div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Contact & About</h2>
          </div>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@business.com" className="rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp / Phone</Label>
                <PhoneInput value={formData.phoneNumber} onChange={(v) => setFormData({ ...formData, phoneNumber: v })} country={formData.country} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description *</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell the community what makes this adventure special..." rows={5}
                className={cn("rounded-2xl font-bold resize-none", isMissing(formData.description) && "border-red-500 bg-red-50")} />
            </div>
          </div>
        </Card>

        {/* Access & Pricing */}
        <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#FF7F50]/10 text-[#FF7F50]"><Clock className="h-5 w-5" /></div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Access & Pricing</h2>
          </div>
          <div className="grid gap-8">
            <OperatingHoursSection openingHours={formData.openingHours} closingHours={formData.closingHours}
              workingDays={workingDays}
              onOpeningChange={(v) => setFormData({ ...formData, openingHours: v })}
              onClosingChange={(v) => setFormData({ ...formData, closingHours: v })}
              onDaysChange={setWorkingDays} accentColor={COLORS.TEAL} />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrance Fee</Label>
                <Select value={formData.entranceFeeType} onValueChange={(v) => setFormData({ ...formData, entranceFeeType: v })}>
                  <SelectTrigger className="rounded-xl h-12 font-bold border-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white rounded-xl font-bold">
                    <SelectItem value="free">FREE ACCESS</SelectItem>
                    <SelectItem value="paid">PAID ADMISSION</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.entranceFeeType === "paid" && (<>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adult Entry (KSh)</Label>
                  <Input type="number" value={formData.adultPrice} onChange={(e) => setFormData({ ...formData, adultPrice: e.target.value })} className="rounded-xl h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Child Entry (KSh)</Label>
                  <Input type="number" value={formData.childPrice} onChange={(e) => setFormData({ ...formData, childPrice: e.target.value })} className="rounded-xl h-12 font-bold" />
                </div>
              </>)}
            </div>
          </div>
        </Card>

        {/* Amenities, Facilities & Activities */}
        <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#008080]/10 text-[#008080]"><DollarSign className="h-5 w-5" /></div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Amenities, Facilities & Activities</h2>
          </div>
          <div className="space-y-8">
            <GeneralFacilitiesSelector selected={generalFacilities} onChange={setGeneralFacilities} accentColor={COLORS.TEAL} />

            <ItemListBuilder
              items={facilities} onChange={setFacilities}
              showErrors={showErrors} onValidationFail={onValidationFail}
              label="Facilities (with photos)" namePlaceholder="e.g. Campsite A"
              accentColor={COLORS.CORAL}
              showAmenities={true} showPrice={true}
              minPhotos={2} requireSave={true}
            />

            <ItemListBuilder
              items={activities} onChange={setActivities}
              showErrors={showErrors} onValidationFail={onValidationFail}
              label="Activities (with photos)" namePlaceholder="e.g. Hiking"
              accentColor="#6366f1"
              showAmenities={false} showPrice={false}
              minPhotos={1} requireSave={true}
            />
          </div>
        </Card>

        {/* Gallery */}
        <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#008080]/10 text-[#008080]"><Camera className="h-5 w-5" /></div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Gallery (Max 5) *</h2>
          </div>
          <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-2xl",
            showErrors && galleryImages.length === 0 && "border-2 border-red-500 bg-red-50")}>
            {galleryPreviews.map((url, index) =>
              url ? (
                <div key={index} className="relative aspect-square rounded-[20px] overflow-hidden border-2 border-slate-100">
                  <img src={url} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => removeGalleryImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null
            )}
            {galleryImages.length < 5 && (
              <label className="aspect-square rounded-[20px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                <Plus className="h-6 w-6 text-slate-400" />
                <span className="text-[9px] font-black uppercase text-slate-400 mt-1">Add Photo</span>
                <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleGalleryUpload(e.target.files)} />
              </label>
            )}
          </div>
        </Card>

        {/* Submit */}
        <div className="mb-8">
          <Button type="button" onClick={handleSubmit} disabled={loading}
            className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-sm text-white"
            style={{ background: `linear-gradient(135deg, ${COLORS.TEAL} 0%, #006666 100%)` }}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit for Approval"}
          </Button>
        </div>

      </main>
      <MobileBottomBar />
    </div>
  );
};

export default CreateAdventure;