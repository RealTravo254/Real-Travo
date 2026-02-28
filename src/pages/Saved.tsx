import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserId } from "@/lib/sessionManager";
import { Link, useLocation } from "react-router-dom";
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

  // Sync with global saved items state
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
      tripIds.length > 0 
        ? supabase.from("trips").select("id,name,location,image_url,is_hidden,type").in("id", tripIds) 
        : { data: [] },
      hotelIds.length > 0 
        ? supabase.from("hotels").select("id,name,location,image_url,is_hidden").in("id", hotelIds) 
        : { data: [] },
      adventureIds.length > 0 
        ? supabase.from("adventure_places").select("id,name,location,image_url,is_hidden").in("id", adventureIds) 
        : { data: [] },
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

  const handleRemoveItem = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    } else {
      toast({ variant: "destructive", title: "Error", description: "Could not remove item." });
    }
    setDeletingId(null);
  };

  return (
    <div className={isEmbeddedInSheet ? "min-h-full bg-background" : "min-h-screen bg-[#F4F7FA] pb-24 font-sans"}>
      {!isEmbeddedInSheet && <Header />}
      
      <div className={isEmbeddedInSheet 
        ? "max-w-[1200px] mx-auto px-4 py-4" 
        : "max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-12"}
      >
        {!isEmbeddedInSheet && (
          <aside className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 sticky top-24">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Saved Places</h1>
              <p className="text-slate-500 text-sm">Review and manage your curated travel list.</p>
            </div>
          </aside>
        )}

        <main className={isEmbeddedInSheet ? "space-y-3" : "lg:col-span-8 space-y-3"}>
          {isEmbeddedInSheet && (
            <div className="mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Items</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-[24px]" />)}
            </div>
          ) : savedListings.length === 0 ? (
            <div className="bg-white rounded-[32px] p-16 text-center text-slate-400 border border-slate-100 italic">
              No items in your collection.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedListings.map((item) => (
                <div key={item.id} className="group relative">
                  <Link
                    to={createDetailPath(item.savedType, item.id, item.name, item.location)}
                    className="flex items-center gap-4 bg-white p-3 sm:p-4 rounded-[24px] border border-slate-100 hover:shadow-lg transition-all active:scale-[0.99]"
                  >
                    <img src={item.image_url} className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover shrink-0" alt="" />
                    
                    <div className="flex-1 min-w-0 pr-10">
                      <p className="text-[9px] font-bold text-[#007AFF] uppercase mb-0.5 tracking-wider">
                        {item.savedType?.replace('_', ' ')}
                      </p>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center text-slate-400 text-[11px] mt-1">
                        <MapPin size={10} className="mr-1 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>

                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#007AFF] group-hover:text-white transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </Link>

                  {/* Absolute Positioned Remove Button */}
                  <button
                    onClick={(e) => handleRemoveItem(e, item.id)}
                    disabled={deletingId === item.id}
                    className="absolute right-14 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors z-20 border border-red-100/50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
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