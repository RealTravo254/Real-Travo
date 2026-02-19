import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserId } from "@/lib/sessionManager";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Bookmark, MapPin, ChevronRight, Loader2, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 20;

const Saved = () => {
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const { savedItems } = useSavedItems();
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const hasFetched = useRef(false);

  useEffect(() => {
    const initializeData = async () => {
      if (authLoading) return;
      try {
        const uid = await getUserId();
        if (!uid) {
          setIsLoading(false);
          return;
        }
        setUserId(uid);
        await fetchSavedItems(uid, 0);
      } catch (err) {
        console.error("Initialization error:", err);
        setIsLoading(false);
      }
    };
    initializeData();
  }, [authLoading]);

  useEffect(() => {
    if (userId && hasFetched.current) {
      fetchSavedItems(userId, 0);
    }
  }, [savedItems]);

  const fetchSavedItems = async (uid: string, fetchOffset: number) => {
    if (fetchOffset === 0) setIsLoading(true);
    else setLoadingMore(true);
    
    const { data: savedData, error: savedError } = await supabase
      .from("saved_items")
      .select("item_id, item_type")
      .eq("user_id", uid)
      .range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1)
      .order('created_at', { ascending: false });

    if (savedError || !savedData || savedData.length === 0) {
      setHasMore(false);
      setIsLoading(false);
      setLoadingMore(false);
      return [];
    }

    const tripIds = savedData.filter(s => s.item_type === "trip" || s.item_type === "event").map(s => s.item_id);
    const hotelIds = savedData.filter(s => s.item_type === "hotel").map(s => s.item_id);
    const adventureIds = savedData.filter(s => s.item_type === "adventure_place").map(s => s.item_id);

    const [tripsRes, hotelsRes, adventuresRes] = await Promise.all([
      tripIds.length > 0 
        ? supabase.from("trips").select("id,name,location,country,image_url,is_hidden").in("id", tripIds)
        : Promise.resolve({ data: [] }),
      hotelIds.length > 0 
        ? supabase.from("hotels").select("id,name,location,country,image_url,is_hidden").in("id", hotelIds)
        : Promise.resolve({ data: [] }),
      adventureIds.length > 0 
        ? supabase.from("adventure_places").select("id,name,location,country,image_url,is_hidden").in("id", adventureIds)
        : Promise.resolve({ data: [] }),
    ]);

    const itemMap = new Map<string, any>();
    (tripsRes.data || []).forEach((item: any) => {
      if (item.is_hidden) return;
      itemMap.set(item.id, { ...item, type: "Trip" });
    });
    (hotelsRes.data || []).forEach((item: any) => {
      if (item.is_hidden) return;
      itemMap.set(item.id, { ...item, type: "Hotel" });
    });
    (adventuresRes.data || []).forEach((item: any) => {
      if (item.is_hidden) return;
      itemMap.set(item.id, { ...item, type: "Adventure" });
    });

    const items = savedData
      .map(saved => itemMap.get(saved.item_id))
      .filter(item => item && typeof item.name === 'string'); // Safety check for React Error #306

    if (fetchOffset === 0) {
      setSavedListings(items);
      hasFetched.current = true;
    } else {
      setSavedListings(prev => [...prev, ...items]);
    }
    
    setOffset(fetchOffset + ITEMS_PER_PAGE);
    setHasMore(savedData.length >= ITEMS_PER_PAGE);
    setIsLoading(false);
    setLoadingMore(false);
    return items;
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const handleRemoveSelected = async () => {
    if (!userId || selectedItems.size === 0) return;
    const { error } = await supabase.from("saved_items").delete().in("item_id", Array.from(selectedItems)).eq("user_id", userId);
    if (!error) {
      setSavedListings(prev => prev.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
      toast({ title: "Collection Updated" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] pb-20 font-sans">
      <Header />
      
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-12">
        
        {/* Left Sidebar Info */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="text-slate-400 h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Saved places</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              You have {savedListings.length} items in your collection.
            </p>
            <div className="h-[2px] w-12 bg-[#007AFF] mb-6" />
            <button 
               onClick={() => setIsSelectionMode(!isSelectionMode)}
               className="text-sm font-semibold text-[#007AFF] hover:underline"
            >
              {isSelectionMode ? "Exit Management" : "Manage Collection"}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-8 space-y-4">
          <div className="bg-white/60 backdrop-blur-md sticky top-4 z-30 p-4 rounded-3xl border border-white flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isSelectionMode ? 'bg-orange-500' : 'bg-green-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {isSelectionMode ? `Selecting (${selectedItems.size})` : 'Live Collection'}
                </span>
             </div>
             {isSelectionMode && selectedItems.size > 0 && (
               <Button onClick={handleRemoveSelected} size="sm" className="bg-slate-900 hover:bg-red-600 rounded-xl text-xs px-4">
                 Delete Selected
               </Button>
             )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-[28px]" />)}
            </div>
          ) : savedListings.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center text-slate-400">
               No places found.
            </div>
          ) : (
            <div className="space-y-3">
              {savedListings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => isSelectionMode && toggleItemSelection(item.id)}
                  className={`group relative bg-white p-4 rounded-[28px] border transition-all duration-300 flex items-center gap-5 cursor-pointer hover:shadow-md ${
                    selectedItems.has(item.id) ? "border-[#007AFF] bg-blue-50/30" : "border-slate-100"
                  }`}
                >
                  {isSelectionMode && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedItems.has(item.id) ? "bg-[#007AFF] border-[#007AFF]" : "border-slate-200"
                    }`}>
                      {selectedItems.has(item.id) && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                    </div>
                  )}

                  <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                    <img src={item.image_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{String(item.type)}</p>
                    <h3 className="text-lg font-bold text-slate-800 truncate leading-none mb-2">{String(item.name)}</h3>
                    <div className="flex items-center text-slate-400 text-xs">
                      <MapPin size={12} className="mr-1" />
                      <span className="truncate">{item.location}, {item.country}</span>
                    </div>
                  </div>

                  {!isSelectionMode && (
                    <Link to={`/${String(item.type).toLowerCase()}s/${item.id}`} className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#007AFF] group-hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default Saved;