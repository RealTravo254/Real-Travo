import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserId } from "@/lib/sessionManager";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { createDetailPath } from "@/lib/slugUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 20;

const Saved = () => {
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const { savedItems } = useSavedItems();
  const { loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const hasFetched = useRef(false);
  const location = useLocation();
  const isEmbeddedInSheet = location.pathname !== "/saved";

  useEffect(() => {
    const initializeData = async () => {
      if (authLoading) return;
      const uid = await getUserId();
      if (!uid) {
        setIsLoading(false);
        return;
      }
      setUserId(uid);
      fetchSavedItems(uid, 0);
    };
    initializeData();
  }, [authLoading]);

  // Sync with global saved state if an item is removed elsewhere
  useEffect(() => {
    if (userId && hasFetched.current) {
      fetchSavedItems(userId, 0);
    }
  }, [savedItems]);

  const fetchSavedItems = async (uid: string, fetchOffset: number) => {
    if (fetchOffset === 0) setIsLoading(true);
    
    const { data: savedData } = await supabase
      .from("saved_items")
      .select("item_id, item_type")
      .eq("user_id", uid)
      .range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1)
      .order('created_at', { ascending: false });

    if (!savedData || savedData.length === 0) {
      setSavedListings([]);
      setIsLoading(false);
      return;
    }

    const tripIds = savedData.filter(s => s.item_type === "trip" || s.item_type === "event").map(s => s.item_id);
    const hotelIds = savedData.filter(s => s.item_type === "hotel").map(s => s.item_id);
    const adventureIds = savedData.filter(s => s.item_type === "adventure_place" || s.item_type === "attraction").map(s => s.item_id);

    const [tripsRes, hotelsRes, adventuresRes] = await Promise.all([
      tripIds.length > 0 ? supabase.from("trips").select("id,name,location,image_url,is_hidden,type").in("id", tripIds) : { data: [] },
      hotelIds.length > 0 ? supabase.from("hotels").select("id,name,location,image_url,is_hidden").in("id", hotelIds) : { data: [] },
      adventureIds.length > 0 ? supabase.from("adventure_places").select("id,name,location,image_url,is_hidden").in("id", adventureIds) : { data: [] },
    ]);

    const itemMap = new Map();
    [...(tripsRes.data || []), ...(hotelsRes.data || []), ...(adventuresRes.data || [])].forEach(item => {
      if (item.is_hidden) return;
      const original = savedData.find(s => s.item_id === item.id);
      itemMap.set(item.id, { ...item, savedType: original?.item_type });
    });

    const items = savedData.map(s => itemMap.get(s.item_id)).filter(Boolean);
    setSavedListings(items);
    hasFetched.current = true;
    setIsLoading(false);
  };

  const handleRemoveSingle = async (itemId: string) => {
    if (!userId) return;
    setDeletingId(itemId);

    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("item_id", itemId)
      .eq("user_id", userId);

    if (!error) {
      setSavedListings(prev => prev.filter(item => item.id !== itemId));
      toast({ title: "Removed", description: "Item removed from your collection." });
    }
    setDeletingId(null);
  };

  return (
    <div className={isEmbeddedInSheet ? "min-h-full bg-background" : "min-h-screen bg-[#F4F7FA] pb-24 font-sans"}>
      {!isEmbeddedInSheet && <Header />}
      
      <div className={isEmbeddedInSheet ? "px-4 py-4" : "max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-12"}>
        
        {!isEmbeddedInSheet && (
          <aside className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 sticky top-24">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Saved Places</h1>
              <p className="text-slate-500 text-sm">Your curated collection of adventures and stays.</p>
            </div>
          </aside>
        )}

        <main className={isEmbeddedInSheet ? "space-y-3" : "lg:col-span-8 space-y-3"}>
          {isEmbeddedInSheet && (
            <div className="mb-2 px-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Saved Items</p>
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-[32px]" />
          ) : savedListings.length === 0 ? (
            <div className="bg-white rounded-[40px] p-20 text-center text-slate-400 border border-slate-100">
              No items saved yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {savedListings.map((item) => (
                // FIX: Wrapper is now a flex row — Link and delete button are SIBLINGS, not nested
                // This prevents the Link from swallowing touch events meant for the delete button
                <div key={item.id} className="flex items-center gap-2">
                  {/* Delete button BEFORE the link in DOM, positioned to the left on mobile */}
                  <button
                    onPointerDown={(e) => {
                      // Use onPointerDown for fastest mobile response
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveSingle(item.id);
                    }}
                    disabled={deletingId === item.id}
                    className="shrink-0 p-3 rounded-full bg-red-50 text-red-500 active:bg-red-100 active:scale-90 transition-all border border-red-100 touch-manipulation select-none"
                    aria-label="Remove item"
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>

                  {/* Link takes remaining space */}
                  <Link
                    to={createDetailPath(item.savedType, item.id, item.name, item.location)}
                    className="flex-1 flex items-center gap-4 bg-white p-3 sm:p-4 rounded-[24px] border border-slate-100 hover:shadow-md transition-all active:scale-[0.98] min-w-0 group"
                  >
                    <img src={item.image_url} className="h-16 w-16 rounded-xl object-cover shrink-0" alt="" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-[#007AFF] uppercase mb-0.5">{item.savedType?.replace('_', ' ')}</p>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">{item.name}</h3>
                      <div className="flex items-center text-slate-400 text-xs mt-0.5">
                        <MapPin size={10} className="mr-1 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>

                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#007AFF] group-hover:text-white transition-all shrink-0">
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {!isEmbeddedInSheet && (
        <>
          <Footer />
          <MobileBottomBar />
        </>
      )}
    </div>
  );
};

export default Saved;