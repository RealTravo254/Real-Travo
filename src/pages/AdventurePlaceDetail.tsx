import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSafeBack } from "@/hooks/useSafeBack";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowLeft, Heart, Star, Circle, Calendar, Loader2, Share2, Copy, Navigation, AlertCircle, Phone, Mail } from "lucide-react";
import { SimilarItems } from "@/components/SimilarItems";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { FacilitiesGrid, ActivitiesGrid } from "@/components/detail/FacilityActivityCards";
import { useSavedItems } from "@/hooks/useSavedItems";
import { extractIdFromSlug } from "@/lib/slugUtils";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { trackReferralClick, generateReferralLink } from "@/lib/referralUtils";
import { Header } from "@/components/Header";
import { ImageGalleryModal } from "@/components/detail/ImageGalleryModal";
import { QuickNavigationBar } from "@/components/detail/QuickNavigationBar";
// AmenitiesSection removed - using only GeneralFacilitiesDisplay with icons
import { GeneralFacilitiesDisplay } from "@/components/detail/GeneralFacilitiesDisplay";
import { DetailMapSection } from "@/components/detail/DetailMapSection";
import { DetailPageSkeleton } from "@/components/detail/DetailPageSkeleton";

const AdventurePlaceDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const goBack = useSafeBack();
  const { toast } = useToast();
  const { position, requestLocation } = useGeolocation();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [liveRating, setLiveRating] = useState({ avg: 0, count: 0 });
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");

  const distance =
    position && place?.latitude && place?.longitude
      ? calculateDistance(position.latitude, position.longitude, place.latitude, place.longitude)
      : undefined;

  const getStartingPrice = () => {
    if (!place) return 0;
    const prices: number[] = [];
    if (place.entry_fee) prices.push(Number(place.entry_fee));
    const extractPrices = (arr: any[]) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((item) => {
        const p = typeof item === "object" ? item.price : null;
        if (p) prices.push(Number(p));
      });
    };
    extractPrices(place.facilities);
    extractPrices(place.activities);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const startingPrice = getStartingPrice();

  useEffect(() => {
    if (id) {
      Promise.all([fetchPlace(), fetchLiveRating()]);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) trackReferralClick(refSlug, id, "adventure_place", "booking");
    requestLocation();
    window.scrollTo(0, 0);
  }, [id, slug]);

  useEffect(() => {
    if (!place) return;
    const checkOpenStatus = () => {
      const now = new Date();
      const currentDay = now.toLocaleString("en-us", { weekday: "long" }).toLowerCase();
      if (place.opening_hours === "00:00" && place.closing_hours === "23:59") {
        const days = Array.isArray(place.days_opened)
          ? place.days_opened.map((d: string) => d.toLowerCase())
          : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        setIsOpenNow(days.includes(currentDay));
        return;
      }
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      const openTime = parseTime(place.opening_hours || "08:00 AM");
      const closeTime = parseTime(place.closing_hours || "06:00 PM");
      const days = Array.isArray(place.days_opened)
        ? place.days_opened.map((d: string) => d.toLowerCase())
        : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      setIsOpenNow(days.includes(currentDay) && currentTime >= openTime && currentTime <= closeTime);
    };
    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, [place]);

  const fetchPlace = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("adventure_places")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setPlace(data);
    } catch (error) {
      toast({ title: "Place not found", variant: "destructive" });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveRating = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("reviews")
      .select("rating")
      .eq("item_id", id)
      .eq("item_type", "adventure_place");
    if (data && data.length > 0) {
      const avg = data.reduce((acc, curr) => acc + curr.rating, 0) / data.length;
      setLiveRating({ avg: parseFloat(avg.toFixed(1)), count: data.length });
    }
  };

  if (loading) return <DetailPageSkeleton />;
  if (!place) return null;

  // Collect all images: gallery + facility images + activity images
  const facilityImages = (Array.isArray(place.facilities) ? place.facilities : [])
    .flatMap((f: any) => (Array.isArray(f.images) ? f.images : []));
  const activityImages = (Array.isArray(place.activities) ? place.activities : [])
    .flatMap((a: any) => (Array.isArray(a.images) ? a.images : []));
  const allImages = [place.image_url, ...(place.gallery_images || []), ...facilityImages, ...activityImages].filter(Boolean);

  const is24Hours = place.opening_hours === "00:00" && place.closing_hours === "23:59";

  const OperatingHoursInfo = () => (
    <div>
      <div>Working Hours</div>
      <div>
        {is24Hours
          ? "Open 24 Hours"
          : `${place.opening_hours || "08:00 AM"} - ${place.closing_hours || "06:00 PM"}`}
      </div>
      <div>Working Days</div>
      <div>
        {Array.isArray(place.days_opened)
          ? place.days_opened.join(", ")
          : "monday, tuesday, wednesday, thursday, friday, saturday, sunday"}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header - Desktop Only */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* HERO / IMAGE GALLERY */}
      {/* Mobile Carousel View */}
      <div className="md:hidden relative">
        {/* Action Buttons - Overlaid on Gallery */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            onClick={goBack}
            className="rounded-full w-10 h-10 p-0 bg-white/90 text-slate-900 border-none shadow-lg backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={() => id && handleSaveItem(id, "adventure_place")}
            className={`rounded-full w-10 h-10 p-0 border-none shadow-lg backdrop-blur-sm transition-all ${
              isSaved ? "bg-red-500 hover:bg-red-600" : "bg-white/90 text-slate-900 hover:bg-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? "fill-white text-white" : ""}`} />
          </Button>
        </div>

        <Carousel plugins={[Autoplay({ delay: 4000 })]} className="w-full">
          <CarouselContent>
            {allImages.length > 0 ? (
              allImages.map((img, idx) => (
                <CarouselItem key={idx}>
                  <div className="relative h-80 w-full">
                    <img src={img} alt={place.name} className="w-full h-full object-cover" />
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <div className="h-80 w-full bg-slate-200 flex items-center justify-center">
                  <span className="text-slate-400">No Image</span>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>

        {/* Mobile See All Gallery Button */}
        {allImages.length > 1 && <ImageGalleryModal images={allImages} />}

        <div className="absolute bottom-4 left-4 flex gap-2 z-10">
          <Badge className="bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {liveRating.avg > 0 ? liveRating.avg : "New"}
          </Badge>
          <Badge
            className={`backdrop-blur-sm ${
              isOpenNow ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
            }`}
          >
            <Circle className="w-2 h-2 fill-current mr-1" />
            {isOpenNow ? "open" : "closed"}
          </Badge>
        </div>

        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-slate-900">{place.name}</h1>
          <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
            <MapPin className="w-4 h-4" />
            {[place.place, place.location, place.country].filter(Boolean).join(", ")}
          </div>
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:block relative">
        {/* Action Buttons - Overlaid on Gallery */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            onClick={goBack}
            className="rounded-full w-12 h-12 p-0 bg-white/90 text-slate-900 border-none shadow-lg backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={() => id && handleSaveItem(id, "adventure_place")}
            className={`rounded-full w-12 h-12 p-0 border-none shadow-lg backdrop-blur-sm transition-all ${
              isSaved ? "bg-red-500 hover:bg-red-600" : "bg-white/90 text-slate-900 hover:bg-white"
            }`}
          >
            <Heart className={`w-6 h-6 ${isSaved ? "fill-white text-white" : ""}`} />
          </Button>
        </div>

        {/* Image Grid Layout */}
        {allImages.length > 0 ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px]">
            {/* Main Large Image - Takes 2 columns and full height */}
            <div className="col-span-2 row-span-2 relative rounded-l-2xl overflow-hidden">
              <img src={allImages[0]} alt={place.name} className="w-full h-full object-cover" />
              {/* Place Info Overlay */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                {liveRating.avg > 0 && (
                  <Badge className="bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {liveRating.avg}
                  </Badge>
                )}
                {isOpenNow && (
                  <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
                    <Circle className="w-2 h-2 fill-current mr-1" />
                    open now
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-14 left-4">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{place.name}</h1>
                <div className="flex items-center gap-1 text-white/90 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {[place.place, place.location, place.country].filter(Boolean).join(", ")}
                </div>
              </div>
            </div>

            {/* Top Right Image */}
            {allImages[1] && (
              <div className="col-span-1 row-span-1 relative overflow-hidden">
                <img src={allImages[1]} alt={place.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Top Far Right Image */}
            {allImages[2] && (
              <div className="col-span-1 row-span-1 relative rounded-tr-2xl overflow-hidden">
                <img src={allImages[2]} alt={place.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Bottom Right Small Images */}
            {allImages[3] && (
              <div className="col-span-1 row-span-1 relative overflow-hidden">
                <img src={allImages[3]} alt={place.name} className="w-full h-full object-cover" />
              </div>
            )}

            {allImages[4] && (
              <div className="col-span-1 row-span-1 relative rounded-br-2xl overflow-hidden">
                <img src={allImages[4]} alt={place.name} className="w-full h-full object-cover" />
                {/* See All Button */}
                {allImages.length > 5 && <ImageGalleryModal images={allImages} />}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[500px] bg-slate-200 rounded-2xl flex items-center justify-center">
            <span className="text-slate-400 text-lg">No Images Available</span>
          </div>
        )}
      </div>

      {/* Quick Navigation - Mobile Only */}
      <QuickNavigationBar
        hasFacilities={place.facilities?.length > 0}
        hasActivities={place.activities?.length > 0}
        hasContact={place.phone_numbers?.length > 0 || !!place.email}
      />

      {/* 3. MAIN BODY */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">About This Property</h2>
            {place.description ? (
              <p className="text-slate-600 leading-relaxed">{place.description}</p>
            ) : (
              <p className="text-slate-400 italic">Description coming soon</p>
            )}
          </div>

          {/* Operating Hours - Mobile Only (below description) */}
          <div className="md:hidden">
            <OperatingHoursInfo />
          </div>

          {/* General Facilities with Icons */}
          <GeneralFacilitiesDisplay
            amenities={
              Array.isArray(place.amenities)
                ? place.amenities.map((a: any) => (typeof a === "string" ? a : a.name || ""))
                : []
            }
          />

          {/* Facilities with Images */}
          {place.facilities?.length > 0 && (
            <div>
              <FacilitiesGrid facilities={place.facilities} />
            </div>
          )}

          {/* Activities with Images */}
          {place.activities?.length > 0 && (
            <div>
              <ActivitiesGrid activities={place.activities} />
            </div>
          )}

          {/* Mobile Booking Card - Below Activities */}
          <div className="lg:hidden bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Starting from</p>
              {place.entry_fee && place.entry_fee > 0 ? (
                <div>
                  <p className="text-3xl font-black text-slate-900">
                    KSh {Number(place.entry_fee).toLocaleString()} / adult
                  </p>
                  {place.child_entry_fee !== undefined && (
                    <p className="text-sm text-slate-500">
                      Child: KSh {Number(place.child_entry_fee || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-3xl font-black text-green-600">Free Entry</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{liveRating.avg || "0"}</span>
              <span className="text-slate-500 text-sm">({liveRating.count} reviews)</span>
            </div>
            {/* Operating hours removed from mobile price card - now shown below description */}
            <Button
              onClick={() => navigate(`/booking/adventure_place/${place.id}`)}
              className="w-full py-7 rounded-2xl text-md font-black uppercase tracking-widest bg-gradient-to-r from-[#FF7F50] to-[#FF4E50] border-none shadow-lg transition-all active:scale-95"
            >
              Book Now
            </Button>
            <div className="flex gap-3 justify-center">
              <UtilityButton
                icon={<Navigation className="w-4 h-4" />}
                label="Map"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.location}`)}`,
                    "_blank"
                  )
                }
              />
              <UtilityButton
                icon={<Copy className="w-4 h-4" />}
                label="Copy"
                onClick={async () => {
                  toast({ title: "Copying link..." });
                  const refLink = await generateReferralLink(id!, "adventure_place", id!);
                  await navigator.clipboard.writeText(refLink);
                  toast({ title: "Link Copied!" });
                }}
              />
              <UtilityButton
                icon={<Share2 className="w-4 h-4" />}
                label="Share"
                onClick={async () => {
                  toast({ title: "Preparing share..." });
                  const refLink = await generateReferralLink(id!, "adventure_place", id!);
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: place.name, url: refLink });
                    } catch (e) {}
                  } else {
                    await navigator.clipboard.writeText(refLink);
                    toast({ title: "Link Copied!" });
                  }
                }}
              />
            </div>
          </div>

          {/* Contact Section - Mobile (for quick nav link) */}
          <div id="contact">
            {(place.phone_numbers?.length > 0 || place.email) && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Contact</h3>
                {place.phone_numbers?.map((phone: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 mb-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{phone}</span>
                  </div>
                ))}
                {place.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{place.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Review Section */}
          <ReviewSection itemId={id!} itemType="adventure_place" />

          {/* Map Section */}
          <DetailMapSection
            name={place.name}
            location={place.location}
            latitude={place.latitude}
            longitude={place.longitude}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-5">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Starting from/Entrance Fee
              </p>
              {place.entry_fee && place.entry_fee > 0 ? (
                <div>
                  <p className="text-3xl font-black text-slate-900">
                    KSh {Number(place.entry_fee).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">per adult</p>
                  {place.child_entry_fee !== undefined && (
                    <p className="text-sm text-slate-500">
                      Child: KSh {Number(place.child_entry_fee || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-3xl font-black text-green-600">Free Entry</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{liveRating.avg || "0"}</span>
              <span className="text-slate-500 text-sm">({liveRating.count} reviews)</span>
            </div>
            <OperatingHoursInfo />
            <Button
              onClick={() => navigate(`/booking/adventure_place/${place.id}`)}
              className="w-full py-7 rounded-3xl text-lg font-black uppercase tracking-widest bg-gradient-to-r from-[#FF7F50] to-[#FF4E50] border-none shadow-xl transition-all active:scale-95"
            >
              Reserve Now
            </Button>
            <div className="flex gap-3 justify-center">
              <UtilityButton
                icon={<Navigation className="w-4 h-4" />}
                label="Map"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.location}`)}`,
                    "_blank"
                  )
                }
              />
              <UtilityButton
                icon={<Copy className="w-4 h-4" />}
                label="Copy"
                onClick={async () => {
                  toast({ title: "Copying link..." });
                  const refLink = await generateReferralLink(id!, "adventure_place", id!);
                  await navigator.clipboard.writeText(refLink);
                  toast({ title: "Link Copied!" });
                }}
              />
              <UtilityButton
                icon={<Share2 className="w-4 h-4" />}
                label="Share"
                onClick={async () => {
                  toast({ title: "Preparing share..." });
                  const refLink = await generateReferralLink(id!, "adventure_place", id!);
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: place.name, url: refLink });
                    } catch (e) {}
                  } else {
                    await navigator.clipboard.writeText(refLink);
                    toast({ title: "Link Copied!" });
                  }
                }}
              />
            </div>

            {/* Contact Section */}
            {(place.phone_numbers?.length > 0 || place.email) && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Contact</h3>
                {place.phone_numbers?.map((phone: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 mb-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 text-sm">{phone}</span>
                  </div>
                ))}
                {place.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 text-sm">{place.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SimilarItems currentId={id!} itemType="adventure_place" />
    </div>
  );
};

// Utility button matching the hotel style
const UtilityButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
  >
    <div className="text-slate-600">{icon}</div>
    <span className="text-xs text-slate-600 font-medium">{label}</span>
  </button>
);

export default AdventurePlaceDetail;