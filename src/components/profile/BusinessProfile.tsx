import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const BusinessProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("business_accounts")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching business profile:", error);
    } else if (data) {
      setBusinessType(data.business_type || "");
      setBusinessName(data.business_name || "");
      setRegistrationNumber(data.business_registration_number || "");
      setBusinessPhone(data.business_phone_number || "");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("business_accounts")
      .update({
        business_phone_number: businessPhone,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Business phone number updated successfully!" });
    }

    setLoading(false);
  };

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case "hotel_accommodation":
        return "Hotel & Accommodation";
      case "trip_event":
        return "Trip and Event";
      case "place_destination":
        return "Place Destination";
      default:
        return type;
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div className="space-y-2">
        <Label>Business Type</Label>
        <Input value={getBusinessTypeLabel(businessType)} disabled />
      </div>

      <div className="space-y-2">
        <Label>Business Name</Label>
        <Input value={businessName} disabled />
        <p className="text-sm text-muted-foreground">
          Business name cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label>Business Registration Number</Label>
        <Input value={registrationNumber} disabled />
        <p className="text-sm text-muted-foreground">
          Registration number cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessPhone">Business Phone Number</Label>
        <Input
          id="businessPhone"
          type="tel"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating..." : "Update Phone Number"}
      </Button>
    </form>
  );
};
