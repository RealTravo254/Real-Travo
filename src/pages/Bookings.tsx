import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CalendarClock, 
  RefreshCw, 
  XCircle, 
  Download, 
  Ticket,
  CheckCircle2
} from "lucide-react";
import { RescheduleBookingDialog } from "@/components/booking/RescheduleBookingDialog";
import { toast } from "sonner";
import jsPDF from "jspdf";
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

interface Booking {
  id: string;
  booking_type: string;
  total_amount: number;
  booking_details: any;
  payment_status: string;
  status: string;
  created_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  slots_booked: number | null;
  visit_date: string | null;
  item_id: string;
  isPending?: boolean;
  payment_phone?: string;
  pendingPaymentId?: string;
  result_code?: string | null;
}

const Bookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      const channel = supabase
        .channel('payments-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` }, 
        () => fetchBookings())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data: confirmedBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      const { data: pendingPayments, error: pendingError } = await supabase
        .from("payments" as any)
        .select("*")
        .eq("user_id", user?.id)
        .in("payment_status", ["pending", "failed"])
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;

      const pendingAsBookings: Booking[] = (pendingPayments || []).map((pp: any) => ({
        id: pp.id,
        booking_type: pp.booking_data?.booking_type || "unknown",
        total_amount: pp.amount,
        booking_details: pp.booking_data?.booking_details || {},
        payment_status: pp.payment_status,
        status: "pending",
        created_at: pp.created_at,
        guest_name: pp.booking_data?.guest_name || null,
        guest_email: pp.booking_data?.guest_email || null,
        guest_phone: pp.booking_data?.guest_phone || null,
        slots_booked: pp.booking_data?.slots_booked || 1,
        visit_date: pp.booking_data?.visit_date || null,
        item_id: pp.booking_data?.item_id || "",
        isPending: true,
        payment_phone: pp.phone_number,
        pendingPaymentId: pp.id,
        result_code: pp.result_code,
      }));

      setBookings([...(confirmedBookings || []), ...pendingAsBookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // PDF Generation Logic
  const generateTicketPDF = (booking: Booking, personIndex?: number) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 150]
    });

    // Design Elements
    doc.setFillColor(30, 41, 59); // Dark background header
    doc.rect(0, 0, 100, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("E-TICKET", 50, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(personIndex !== undefined ? `PASSENGER ${personIndex + 1}` : "GENERAL BOOKING", 50, 25, { align: "center" });

    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const title = booking.booking_details.trip_name || booking.booking_details.hotel_name || 'Booking';
    doc.text(title, 10, 55);

    doc.setFontSize(10);
    doc.text(`Reference: ${booking.id.split('-')[0].toUpperCase()}`, 10, 65);
    doc.text(`Date: ${booking.visit_date ? new Date(booking.visit_date).toLocaleDateString() : 'N/A'}`, 10, 72);
    doc.text(`Guest: ${booking.guest_name || 'Valued Customer'}`, 10, 79);
    
    if (personIndex === undefined) {
      doc.text(`Total Group Size: ${booking.slots_booked}`, 10, 86);
    }

    // Border/Cut line
    doc.setLineDash([2, 2]);
    doc.line(5, 120, 95, 120);
    
    doc.setFontSize(8);
    doc.text("Scan at the entrance. Valid for one-time entry.", 50, 135, { align: "center" });

    const fileName = personIndex !== undefined 
      ? `Ticket_${booking.id.slice(0,5)}_P${personIndex+1}.pdf`
      : `Booking_Summary_${booking.id.slice(0,5)}.pdf`;

    doc.save(fileName);
    toast.success("Download started");
  };

  const getStatusColor = (booking: Booking) => {
    if (booking.result_code === "0" || booking.payment_status === "paid") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (booking.isPending) return "bg-amber-500/10 text-amber-600 border-amber-200";
    return "bg-slate-500/10 text-slate-600 border-slate-200";
  };

  const getPaymentStatusLabel = (booking: Booking) => {
    if (booking.result_code === "0" || booking.payment_status === "paid") return "Confirmed";
    if (booking.payment_status === "pending") return "Awaiting Payment";
    return booking.payment_status;
  };

  const canRetryPayment = (booking: Booking) => {
    return booking.isPending && ["failed", "cancelled", "1032"].includes(booking.payment_status || booking.result_code || "");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 p-8">Loading...</main></div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main className="flex-1 container px-4 py-8 pb-24 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 tracking-tight">My Bookings</h1>
        
        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <p className="text-muted-foreground">You haven't made any bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline" className="capitalize font-medium">{booking.booking_type}</Badge>
                        <Badge className={getStatusColor(booking)}>{getPaymentStatusLabel(booking)}</Badge>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {booking.booking_details.trip_name || booking.booking_details.hotel_name || 'Travel Booking'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Total Paid</p>
                      <p className="text-xl font-black text-primary">KSh {booking.total_amount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-slate-100 rounded-lg"><Calendar className="h-4 w-4 text-slate-600" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-medium">{booking.visit_date ? new Date(booking.visit_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-slate-100 rounded-lg"><Users className="h-4 w-4 text-slate-600" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Guests</p>
                        <p className="font-medium">{booking.slots_booked} {booking.slots_booked === 1 ? 'Person' : 'People'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Non-Paid Bookings */}
                  {!['paid', 'completed'].includes(booking.payment_status) && (
                    <div className="flex gap-2">
                      {canRetryPayment(booking) && (
                        <Button className="w-full" onClick={() => {/* retry logic */}}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Retry Payment
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Ticket Download Section - Only for Confirmed Bookings */}
                {(booking.payment_status === 'paid' || booking.payment_status === 'completed' || booking.result_code === "0") && (
                  <div className="bg-slate-50 border-t border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Tickets Ready
                      </span>
                      <Button variant="link" size="sm" onClick={() => generateTicketPDF(booking)} className="h-auto p-0 text-primary">
                        Download General Details
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: booking.slots_booked || 1 }).map((_, i) => (
                        <Button 
                          key={i} 
                          variant="secondary" 
                          size="sm" 
                          className="bg-white border shadow-sm hover:bg-slate-50"
                          onClick={() => generateTicketPDF(booking, i)}
                        >
                          <Ticket className="h-3 w-3 mr-2 text-slate-400" />
                          Ticket {i + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <MobileBottomBar />
    </div>
  );
};

export default Bookings;