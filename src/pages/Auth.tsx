import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
// Import components. The `rounded-none` class is applied below where possible.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Assuming these forms accept primaryColor and primaryHoverColor props
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

/**
 * Define the specified new color: #080800 (Dark Olive/Khaki)
 * This is an extremely dark shade.
 */
const PRIMARY_COLOR = "#080800"; // RGB (8, 8, 0)
// A slightly darker shade for hover will be almost imperceptible due to how dark the base color is
const PRIMARY_HOVER_COLOR = "#040400"; // RGB (4, 4, 0) - Even darker for hover

const Auth = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirects authenticated users to the home page
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Function to handle switching tabs from within the form components
  const handleSwitchTab = (tabName: "login" | "signup") => {
    setActiveTab(tabName);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8 max-w-md mx-auto">
        {/* Back Button styled with the new PRIMARY color */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
          // Inlining style for the text color
          style={{ color: PRIMARY_COLOR }} 
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="login" className="rounded-none">Login</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-none">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Passes the new PRIMARY color properties for the Login button */}
                <LoginForm 
                  onSwitchToSignup={() => handleSwitchTab("signup")} 
                  primaryColor={PRIMARY_COLOR} 
                  primaryHoverColor={PRIMARY_HOVER_COLOR}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Sign up to start creating and booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Passes the new PRIMARY color properties for the Sign Up button */}
                <SignupForm 
                  onSwitchToLogin={() => handleSwitchTab("login")} 
                  primaryColor={PRIMARY_COLOR} 
                  primaryHoverColor={PRIMARY_HOVER_COLOR}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileBottomBar />
      <Footer />
    </div>
  );
};
export default Auth;