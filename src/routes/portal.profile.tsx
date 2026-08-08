import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ApiClient, API_BASE_URL, getFileUrl } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, User, Phone, MapPin, Briefcase, Calendar, ShieldCheck, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/profile")({
  component: CustomerProfilePage,
});

function maskAadhaar(val: string) {
  if (!val) return "";
  const cleaned = val.trim();
  if (cleaned.length < 4) return "****";
  return "**** **** " + cleaned.substring(cleaned.length - 4);
}

function maskPAN(val: string) {
  if (!val) return "";
  const cleaned = val.trim();
  if (cleaned.length < 4) return "****";
  return cleaned.substring(0, 2) + "******" + cleaned.substring(cleaned.length - 2);
}

function CustomerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Editable fields
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getPortalProfile();
      setProfile(data);
      setAlternatePhone(data.alternatePhone || "");
      setAddress(data.address || "");
      setPhotoUrl(data.profilePhoto || null);
    } catch (error) {
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photo must be less than 5 MB");
      return;
    }

    setUploadingPhoto(true);
    const toastId = toast.loading("Uploading profile photo...");
    try {
      const uploadData = new FormData();
      uploadData.append("document", file);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/uploads/document`, {
        method: "POST",
        body: uploadData,
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Photo upload failed");
      }

      const payload = await res.json();
      const relativePath = payload.data.filePath; // e.g. /uploads/...

      // Update backend profile photo field
      await ApiClient.updatePortalProfile({ profilePhoto: relativePath });
      setPhotoUrl(relativePath);
      toast.success("Profile photo updated successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to upload profile photo", { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alternatePhone && !/^\d{10}$/.test(alternatePhone)) {
      toast.error("Alternate phone number must contain exactly 10 digits");
      return;
    }

    if (alternatePhone && alternatePhone === profile?.phone) {
      toast.error("Alternate phone number cannot be the same as primary phone number");
      return;
    }

    if (!address.trim()) {
      toast.error("Address is required");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving changes...");
    try {
      await ApiClient.updatePortalProfile({
        alternatePhone: alternatePhone || null,
        address,
      });
      toast.success("Profile details updated successfully!", { id: toastId });
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">My Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View your registered personal details and edit contact preferences.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Photo Upload & Stats */}
        <Card className="p-6 border border-border bg-card rounded-2xl flex flex-col items-center text-center shadow-[var(--shadow-card)]">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center font-bold text-gold text-3xl overflow-hidden shadow-md">
              {photoUrl ? (
                <img src={getFileUrl(photoUrl)} alt={profile?.name} className="h-full w-full object-cover" />
              ) : (
                profile?.name ? profile.name[0].toUpperCase() : "C"
              )}
            </div>
            
            <label className="absolute bottom-0 right-0 h-8 w-8 bg-gold hover:bg-gold/90 text-gold-foreground rounded-full flex items-center justify-center cursor-pointer shadow-md border border-background transition-transform hover:scale-105">
              <Camera className="h-4 w-4" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload} 
                disabled={uploadingPhoto} 
              />
            </label>
          </div>

          <div className="mt-4 space-y-1">
            <h3 className="font-bold text-lg text-foreground">{profile?.name}</h3>
            <p className="text-xs text-muted-foreground">{profile?.customerNumber}</p>
          </div>

          <div className="w-full border-t border-border my-5 pt-4 space-y-3 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Account Status</span>
              <span className="px-2 py-0.5 bg-success/15 text-success font-semibold rounded-full">
                Active KYC
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Joined Date</span>
              <span className="text-foreground font-semibold">
                {new Date(profile?.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Side: Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <Card className="p-6 border border-border bg-card rounded-2xl shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="h-4.5 w-4.5 text-gold" />
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Customer ID</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {profile?.customerNumber}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Date of Birth</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {profile?.dob || "Not provided"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Aadhaar (Masked)</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {maskAadhaar(profile?.aadhaar)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">PAN (Masked)</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {maskPAN(profile?.pan)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Primary Phone</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {profile?.phone}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="altPhone" className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Alternate Phone
                </Label>
                <Input
                  id="altPhone"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  maxLength={10}
                  className="rounded-lg h-9 border-border text-xs focus-visible:ring-gold"
                  placeholder="Enter 10-digit number"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Occupation</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {profile?.occupation}
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="address" className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Current Address
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-lg border-border text-xs focus-visible:ring-gold"
                  rows={3}
                  placeholder="Enter your complete address"
                />
              </div>
            </div>
          </Card>

          {/* Nominee Details */}
          <Card className="p-6 border border-border bg-card rounded-2xl shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Heart className="h-4.5 w-4.5 text-gold" />
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Nominee Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Nominee Name</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {profile?.nomineeName || "Not provided"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Nominee Phone</span>
                <p className="text-xs font-semibold text-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                  {profile?.nomineePhone || "Not provided"}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-10 px-6 font-medium shadow-[var(--shadow-gold)]"
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
