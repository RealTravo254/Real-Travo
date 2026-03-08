import { PageLayout } from "@/components/PageLayout";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

const HotelGuide = () => {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <SEOHead
        title="Hotel & Lodge Hosting Guide | RealTravo"
        description="Official guide for hotel and lodge hosting on RealTravo. Learn about listing rooms, facilities, activities, and withdrawal policies."
        canonical="https://realtravo.com/hotel-guide"
      />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-primary tracking-tight">REALTRAVO</h1>
          <p className="text-lg text-muted-foreground mt-2">Official Guide for Hotel and Lodge Hosting</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">1. The REALTRAVO Advantage</h2>
            <p className="text-muted-foreground">
              In the past, hotel platforms only allowed for room bookings. REALTRAVO.COM changes this by allowing hosts to list every facility and activity within the hotel as a bookable item. This means you can generate revenue from your Gym, Swimming Pool, and Conference Rooms even from non-resident guests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">2. Verification Requirements</h2>
            <p className="text-muted-foreground mb-3">To ensure the safety of our users, all Hotel and Lodge hosts must be verified.</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Identity Verification:</strong> Upload a clear copy of your National ID or Passport.</li>
              <li><strong className="text-foreground">Biometric Match:</strong> A mandatory selfie is required to confirm identity.</li>
              <li><strong className="text-foreground">Legal Terms:</strong> Fraudulent listings will be immediately banned and legal action will be pursued.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">3. Booking Flexibility and Security</h2>
            <p className="text-muted-foreground mb-3">We provide advanced tools to manage the user journey and secure your entries.</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Scheduling:</strong> Users have the flexibility to reschedule their bookings to another date, allowing for a better customer experience and reduced cancellations.</li>
              <li><strong className="text-foreground">QR Code Scanning:</strong> Every user booking generates a unique QR code. Hosts must scan this code upon arrival.</li>
              <li><strong className="text-foreground">Fraud Prevention:</strong> Once a QR code is scanned, it is marked as used and cannot be used again. This eliminates fake entries and double-entry fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">4. Manual Entries (Free Host Feature)</h2>
            <p className="text-muted-foreground mb-3">We provide a dedicated manual link for hosts to record offline or walk-in entries.</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Scope:</strong> This feature is available for recording entries for <strong>Facilities</strong> and <strong>Accommodation</strong> only.</li>
              <li><strong className="text-foreground">Zero Commission:</strong> REALTRAVO does not charge any service fees for entries recorded through this manual link.</li>
              <li><strong className="text-foreground">Inventory Sync:</strong> Manual entries help you keep your availability updated and prevent double bookings from offline customers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">5. Accommodation Hosting</h2>
            <p className="text-muted-foreground mb-3">List your room inventory with detailed controls to manage occupancy.</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Double Booking Prevention:</strong> Our system automatically disables a room unit once it reaches full capacity for a specific date.</li>
              <li><strong className="text-foreground">Dynamic Pricing:</strong> You can edit your prices at any time to reflect peak seasons or special promos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">6. Independent Activity Hosting</h2>
            <p className="text-muted-foreground mb-3">On REALTRAVO, activities are managed separately from room stays.</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Activity Listings:</strong> Create separate listings for activities like guided tours, spa treatments, or special hotel-hosted events.</li>
              <li><strong className="text-foreground">Booking Specifics:</strong> Users book based on the number of people and a specific visit date.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">7. Facilities and Venue Bookings</h2>
            <p className="text-muted-foreground mb-3">This unique feature allows guests to book specific hotel facilities independently.</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Wellness Facilities:</strong> List your <strong>Gym</strong> and <strong>Swimming Pool</strong> as facilities with specific entrance fees for Adults and Children.</li>
              <li><strong className="text-foreground">Paid Access:</strong> If an entrance fee is required, it is included in the "Paid" booking section for guaranteed collection.</li>
              <li><strong className="text-foreground">Conference Halls:</strong> Set daily rates and maximum capacity for professional bookings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">8. Operational Settings</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Working Hours:</strong> Define opening and closing times for your Gym or Pool.</li>
              <li><strong className="text-foreground">Media:</strong> Upload distinct photo galleries for your rooms and each bookable facility.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary">9. Payouts and Commissions</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Service Fee:</strong> A percentage commission is only charged after a successful <strong>online</strong> booking.</li>
              <li><strong className="text-foreground">Fast Withdrawal:</strong> Funds can be withdrawn via <strong>Bank</strong> or <strong>M-Pesa</strong> when the check-in or facility use date is within 48 hours.</li>
            </ul>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default HotelGuide;
