import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CompleteProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed, name')
        .eq('id', user.id)
        .single();

      if (profile?.profile_completed) {
        navigate('/');
        return;
      }
      // Pre-fill name from Google profile
      if (user.user_metadata?.full_name || user.user_metadata?.name) {
        setName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      } else if (profile?.name) {
        setName(profile.name);
      }
      setCheckingProfile(false);
    };
    if (!authLoading) checkProfile();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const validatePassword = (pwd: string) => {
    if (!pwd) return { valid: false, message: "Password is required" };
    if (pwd.length < 8) return { valid: false, message: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(pwd)) return { valid: false, message: "Must contain uppercase letter" };
    if (!/[a-z]/.test(pwd)) return { valid: false, message: "Must contain lowercase letter" };
    if (!/[0-9]/.test(pwd)) return { valid: false, message: "Must contain a number" };
    return { valid: true };
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    if (!gender) {
      setErrors({ gender: "Please select your gender" });
      return;
    }

    const pv = validatePassword(password);
    if (!pv.valid) {
      setErrors({ password: pv.message! });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    setLoading(true);
    try {
      // Set password for the account
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw pwError;

      // Update profile
      const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
      
      await supabase.from('profiles').update({
        name: name.trim(),
        gender: gender as any,
        email: user!.email,
        profile_completed: true,
        profile_picture_url: googleAvatar,
      }).eq('id', user!.id);

      toast({ title: "Profile completed!", description: "Welcome to Realtravo!" });
      navigate('/');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/fulllogo.png" alt="Realtravo" className="h-12 mx-auto mb-4" />
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Enter your details and set a password to secure your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className={errors.name ? "border-destructive" : ""} 
                placeholder="Enter your name"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Gender <span className="text-destructive">*</span></Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
            </div>

            <div className="space-y-2">
              <Label>Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={errors.password ? "border-destructive" : ""}
                  placeholder="Set your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label>Confirm Password <span className="text-destructive">*</span></Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className={errors.confirmPassword ? "border-destructive" : ""} 
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
