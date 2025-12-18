import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Share2, Heart, Calendar, Phone, Mail, ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SimilarItems } from "@/components/SimilarItems";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { useSavedItems } from "@/hooks/useSavedItems";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { generateReferralLink, trackReferralClick } from "@/lib/referralUtils";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";
import { Badge } from "@/components/ui/badge";

// Color Palette Constants
const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  ORANGE: "#FF9800"
};

const EventDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) trackReferralClick(refSlug, id, "event", "booking");
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase.from("trips").select("*").eq("id", id).eq("type", "event").single();
      if (error && id.length === 8) {
        const { data: prefixData, error: prefixError } = await supabase.from("trips").select("*").ilike("id", `${id}%`).eq("type", "event").single();
        if (!prefixError) { data = prefixData; error = null; }
      }
      if (error) throw error;
      setEvent(data);
    } catch (error) {
      toast({ title: "Event not found", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => id && handleSaveItem(id, "event");

  const handleCopyLink = async () => {
    if (!event) return;
    const refLink = await generateReferralLink(event.id, "event", event.id);
    await navigator.clipboard.writeText(refLink);
    toast({ title: "Link Copied!", description: "Share this event with others!" });
  };

  const handleShare = async () => {
    if (!event) return;
    const refLink = await generateReferralLink(event.id, "event", event.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: event.name, url: refLink });
      } catch (e) { console.log(e); }
    } else {
      handleCopyLink();
    }
  };

  const openInMaps = () => {
    const query = encodeURIComponent(`${event?.name}, ${event?.location}`);
    window.open(event?.map_link || `https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!event) return;
    setIsProcessing(true);
    try {
      const totalAmount = (data.num_adults * event.price) + (data.num_children * event.price_child);
      await submitBooking({
        itemId: event.id,
        itemName: event.name,
        bookingType: 'event',
        totalAmount,
        slotsBooked: data.num_adults + data.num_children,
        visitDate: event.date,
        guestName: data.guest_name,
        guestEmail: data.guest_email,
        guestPhone: data.guest_phone,
        hostId: event.created_by,
        bookingDetails: { ...data, event_name: event.name }
      });
      setIsCompleted(true);
      setShowBooking(false);
      toast({ title: "Success!", description: "Booking confirmed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 animate-pulse" />;

  const allImages = [event?.image_url, ...(event?.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 md:pb-10">
      <Header className="hidden md:block" />

      {/* Hero Section */}
      <div className="relative w-full overflow-hidden shadow-xl">
        {/* Navigation Controls */}
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center max-w-6xl mx-auto px-4 md:px-8">
          <Button 
            onClick={() => navigate(-1)} 
            className="rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border-none h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button 
            onClick={handleSave} 
            className={`rounded-full backdrop-blur-md border-none h-10 w-10 p-0 shadow-lg transition-transform active:scale-95 ${isSaved ? "bg-red-500 text-white" : "bg-black/40 text-white"}`}
          >
            <Heart className={`h-5 w-5 ${isSaved ? "fill-white" : ""}`} />
          </Button>
        </div>

        <Carousel 
          plugins={[Autoplay({ delay: 4000 })]}
          className="w-full"
          setApi={(api) => api && api.on("select", () => setCurrentImageIndex(api.selectedScrollSnap()))}
        >
          <CarouselContent>
            {allImages.map((img, idx) => (
              <CarouselItem key={idx}>
                <div className="relative h-[45vh] md:h-[60vh] w-full">
                  <img src={img} alt={event.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Floating Title Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white max-w-6xl mx-auto">
          <Badge className="mb-2 bg-[#FF7F50] hover:bg-[#FF7F50] border-none uppercase tracking-wider text-[10px]">
            Upcoming Event
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase drop-shadow-md">
            {event.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 opacity-90">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{event.place || event.location}</span>
          </div>
        </div>
      </div>

      <main className="container px-4 max-w-6xl mx-auto -mt-6 relative z-40">
        <div className="grid lg:grid-cols-[1.8fr,1fr] gap-8">
          
          {/* Left Column: Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.TEAL }}>
                About the Event
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {event.description || "No description provided for this event."}
              </p>
            </div>

            {event.activities?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.TEAL }}>Included Highlights</h2>
                <div className="flex flex-wrap gap-3">
                  {event.activities.map((act: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-[#F0E68C]/20 px-4 py-2 rounded-xl border border-[#F0E68C]">
                      <CheckCircle2 className="h-4 w-4 text-[#857F3E]" />
                      <span className="text-sm font-semibold text-[#857F3E]">{act.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <ReviewSection itemId={event.id} itemType="event" />
          </div>

          {/* Right Column: Booking Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-t-4 sticky top-24" style={{ borderColor: COLORS.CORAL }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Starts from</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black" style={{ color: COLORS.TEAL }}>KSh {event.price}</span>
                    <span className="text-slate-400 text-sm">/ adult</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1" style={{ color: COLORS.CORAL }} />
                  <span className="text-[10px] font-bold block text-slate-500 uppercase">
                    {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-500">Child Price</span>
                  <span className="font-bold">KSh {event.price_child || 0}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-500">Availability</span>
                  <span className={`font-bold ${event.available_tickets < 5 ? "text-red-500" : "text-green-600"}`}>
                    {event.available_tickets} slots left
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => setShowBooking(true)}
                disabled={event.available_tickets <= 0}
                className="w-full py-6 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 border-none text-white"
                style={{ backgroundColor: COLORS.CORAL }}
              >
                {event.available_tickets <= 0 ? "Fully Booked" : "Reserve Your Spot"}
              </Button>
              
              <p className="text-[10px] text-center text-slate-400 mt-4 uppercase font-semibold">
                Instant confirmation • Secure payment
              </p>
            </div>

            {/* Quick Actions Card */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                onClick={openInMaps}
                className="flex-col h-auto py-3 rounded-xl border-[#F0E68C] bg-[#F0E68C]/10 text-[#857F3E] hover:bg-[#F0E68C]/30"
              >
                <MapPin className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Map</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex-col h-auto py-3 rounded-xl border-[#F0E68C] bg-[#F0E68C]/10 text-[#857F3E] hover:bg-[#F0E68C]/30"
              >
                <Copy className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Copy</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="flex-col h-auto py-3 rounded-xl border-[#F0E68C] bg-[#F0E68C]/10 text-[#857F3E] hover:bg-[#F0E68C]/30"
              >
                <Share2 className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Share</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12">
           <SimilarItems currentItemId={event.id} itemType="trip" location={event.location} country={event.country} />
        </div>
      </main>

      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl border-none">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} 
            activities={event.activities || []} 
            priceAdult={event.price} 
            priceChild={event.price_child} 
            isProcessing={isProcessing} 
            isCompleted={isCompleted} 
            itemName={event.name} 
            skipDateSelection={true} 
            fixedDate={event.date} 
            skipFacilitiesAndActivities={true} 
            itemId={event.id} 
            bookingType="event" 
            hostId={event.created_by || ""} 
            onPaymentSuccess={() => setIsCompleted(true)} 
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>
  );
};

export default EventDetail;