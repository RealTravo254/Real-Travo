import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Pencil, ArrowLeft, Mail, Lock, Check, X } from "lucide-react";
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
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    name: "",
    gender: "" as string,
    date_of_birth: "",
    country: "",
    phone_number: "",
    email: "",
    profile_picture_url: null as string | null,
  });
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
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
      setProfileData({
        name: data.name || "",
        gender: data.gender || "",
        date_of_birth: data.date_of_birth || "",
        country: data.country || "",
        phone_number: data.phone_number || "",
        email: data.email || user.email || "",
        profile_picture_url: data.profile_picture_url || null,
      });
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
      const { error: uploadError } = await supabase.storage.from("profile-photos").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ profile_picture_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      setProfileData(prev => ({ ...prev, profile_picture_url: publicUrl }));
      toast({ title: "Photo updated!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const startEdit = (field: string) => {
    setEditingField(field);
    setEditValue((profileData as any)[field] || "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = async (field: string) => {
    if (!user) return;
    if (field === "name" && /\d/.test(editValue)) {
      toast({ title: "Invalid Name", description: "Name cannot contain numbers", variant: "destructive" });
      return;
    }
    setSavingField(field);
    try {
      const updateData: Record<string, any> = {};
      if (field === "gender") {
        updateData.gender = (editValue || null) as any;
      } else {
        updateData[field] = editValue || null;
      }
      const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);
      if (error) throw error;
      setProfileData(prev => ({ ...prev, [field]: editValue }));
      setEditingField(null);
      toast({ title: "Saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingField(null);
    }
  };

  const handleChangePassword = async () => {
    navigate("/forgot-password");
  };

  if (fetchingProfile) {
    return <TealLoader text="Loading profile..." />;
  }

  return (
    <div className="brand-shell min-h-screen pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-primary-light transition-colors active:scale-95">
          <ArrowLeft className="h-5 w-5 text-primary-foreground" />
        </button>
        <h1 className="text-base font-bold text-primary-foreground">My Profile</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">
        {/* Avatar Section */}
        <div className="brand-panel rounded-[28px] px-5 py-6 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-primary/10 border-2 border-accent/20 overflow-hidden flex items-center justify-center">
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
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full brand-icon-wrap flex items-center justify-center hover:brightness-110 transition-all active:scale-90"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-foreground">{profileData.name || "Traveler"}</p>
            <p className="text-sm text-muted-foreground">{profileData.email}</p>
          </div>
        </div>

        {/* Profile Fields - each with its own edit button */}
        <div className="brand-panel rounded-2xl overflow-hidden divide-y divide-border">
          <EditableProfileField
            label="Full Name"
            value={profileData.name}
            isEditing={editingField === "name"}
            isSaving={savingField === "name"}
            onEdit={() => startEdit("name")}
            onSave={() => saveField("name")}
            onCancel={cancelEdit}
          >
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="border-none shadow-none p-0 h-auto text-sm font-medium text-foreground focus-visible:ring-0 bg-transparent"
              placeholder="Your name"
              autoFocus
            />
          </EditableProfileField>

          <EditableProfileField
            label="Date of Birth"
            value={profileData.date_of_birth || "Not set"}
            isEditing={editingField === "date_of_birth"}
            isSaving={savingField === "date_of_birth"}
            onEdit={() => startEdit("date_of_birth")}
            onSave={() => saveField("date_of_birth")}
            onCancel={cancelEdit}
          >
            <Input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="border-none shadow-none p-0 h-auto text-sm font-medium text-foreground focus-visible:ring-0 bg-transparent"
              autoFocus
            />
          </EditableProfileField>

          <EditableProfileField
            label="Gender"
            value={profileData.gender ? profileData.gender.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) : "Not set"}
            isEditing={editingField === "gender"}
            isSaving={savingField === "gender"}
            onEdit={() => startEdit("gender")}
            onSave={() => saveField("gender")}
            onCancel={cancelEdit}
          >
            <Select value={editValue} onValueChange={setEditValue}>
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
          </EditableProfileField>

          <EditableProfileField
            label="Country"
            value={profileData.country || "Not set"}
            isEditing={editingField === "country"}
            isSaving={savingField === "country"}
            onEdit={() => startEdit("country")}
            onSave={() => saveField("country")}
            onCancel={cancelEdit}
          >
            <CountrySelector
              value={editValue}
              onChange={setEditValue}
            />
          </EditableProfileField>
        </div>

        {/* Security Section */}
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-[0.22em] mb-2 px-1">Security</p>
          <div className="brand-panel rounded-2xl overflow-hidden divide-y divide-border">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="brand-teal-chip p-2 rounded-xl">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{profileData.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleChangePassword}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-accent/5 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="brand-accent-chip p-2 rounded-xl">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Change Password</p>
                  <p className="text-xs text-muted-foreground">Confirm current password, then verify the code sent to your email</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditableProfileFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

const EditableProfileField = ({ label, value, isEditing, isSaving, onEdit, onSave, onCancel, children }: EditableProfileFieldProps) => (
  <div className="px-4 py-3.5">
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      {!isEditing ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-accent font-semibold hover:underline active:scale-95 transition-all"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="p-1 rounded-lg hover:bg-accent/10 transition-colors text-accent disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
    {isEditing ? (
      <div>{children}</div>
    ) : (
      <p className="text-sm font-medium text-foreground">{value}</p>
    )}
  </div>
);

export default Profile;
