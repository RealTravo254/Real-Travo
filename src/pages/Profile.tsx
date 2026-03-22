import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Pencil, ArrowLeft, Mail, Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountrySelector } from "@/components/creation/CountrySelector";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    gender: "" as string,
    date_of_birth: "",
    country: "",
    phone_number: "",
    email: "",
    profile_picture_url: null as string | null,
  });
  const [originalData, setOriginalData] = useState(profileData);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    setFetchingProfile(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      const pd = {
        name: data.name || "",
        gender: data.gender || "",
        date_of_birth: data.date_of_birth || "",
        country: data.country || "",
        phone_number: data.phone_number || "",
        email: data.email || user.email || "",
        profile_picture_url: data.profile_picture_url || null,
      };
      setProfileData(pd);
      setOriginalData(pd);
    }
    setFetchingProfile(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, profile_picture_url: publicUrl }));
      setOriginalData(prev => ({ ...prev, profile_picture_url: publicUrl }));
      toast({ title: "Photo updated!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (/\d/.test(profileData.name)) {
      toast({ title: "Invalid Name", description: "Name cannot contain numbers", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: profileData.name,
        gender: profileData.gender || null,
        date_of_birth: profileData.date_of_birth || null,
        country: profileData.country || null,
      }).eq("id", user.id);

      if (error) throw error;
      setOriginalData(profileData);
      setIsEditing(false);
      toast({ title: "Profile saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profileData.email) {
      toast({ title: "No email", description: "No email associated with this account", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profileData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email sent", description: "Check your email for a password reset link" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-6 space-y-6 max-w-lg mx-auto">
          <Skeleton className="h-8 w-32" />
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors active:scale-95">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">My Profile</h1>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-all">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
              {profileData.profile_picture_url ? (
                <img src={profileData.profile_picture_url} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {profileData.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:brightness-110 transition-all active:scale-90"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{profileData.name || "Traveler"}</p>
            <p className="text-sm text-muted-foreground">{profileData.email}</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          <ProfileField label="Full Name" value={profileData.name} editing={isEditing}>
            <Input
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="border-none shadow-none p-0 h-auto text-sm font-medium text-foreground focus-visible:ring-0 bg-transparent"
              placeholder="Your name"
            />
          </ProfileField>

          <ProfileField label="Date of Birth" value={profileData.date_of_birth || "Not set"} editing={isEditing}>
            <Input
              type="date"
              value={profileData.date_of_birth}
              onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
              className="border-none shadow-none p-0 h-auto text-sm font-medium text-foreground focus-visible:ring-0 bg-transparent"
            />
          </ProfileField>

          <ProfileField label="Gender" value={profileData.gender ? profileData.gender.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) : "Not set"} editing={isEditing}>
            <Select 
              value={profileData.gender} 
              onValueChange={(v) => setProfileData({ ...profileData, gender: v })}
            >
              <SelectTrigger className="border-none shadow-none p-0 h-auto text-sm font-medium text-foreground focus:ring-0 bg-transparent">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </ProfileField>

          <ProfileField label="Country" value={profileData.country || "Not set"} editing={isEditing}>
            <CountrySelector
              value={profileData.country}
              onChange={(v) => setProfileData({ ...profileData, country: v })}
            />
          </ProfileField>
        </div>

        {/* Security Section */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Security</p>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{profileData.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-muted/50 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Change Password</p>
                  <p className="text-xs text-muted-foreground">We'll send a reset link to your email</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value, editing, children }: { label: string; value: string; editing: boolean; children: React.ReactNode }) => (
  <div className="px-4 py-3.5">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <div>{children}</div>
    ) : (
      <p className="text-sm font-medium text-foreground">{value}</p>
    )}
  </div>
);

export default Profile;
