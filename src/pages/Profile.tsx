import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardUserProfile } from "@/components/profile/StandardUserProfile";
import { BusinessProfile } from "@/components/profile/BusinessProfile";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const [accountType, setAccountType] = useState<"standard" | "business" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      checkAccountType();
    }
  }, [user, loading, navigate]);

  const checkAccountType = async () => {
    if (!user) return;

    // Check if business account exists
    const { data: businessData } = await supabase
      .from("business_accounts")
      .select("id")
      .eq("id", user.id)
      .single();

    if (businessData) {
      setAccountType("business");
    } else {
      setAccountType("standard");
    }
  };

  if (loading || !accountType) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {accountType === "business" ? "Business Profile" : "My Profile"}
            </CardTitle>
            <CardDescription>
              Manage your {accountType === "business" ? "business" : ""} account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accountType === "business" ? <BusinessProfile /> : <StandardUserProfile />}
            
            <div className="mt-6 pt-6 border-t">
              <Button onClick={signOut} variant="destructive" className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default Profile;
