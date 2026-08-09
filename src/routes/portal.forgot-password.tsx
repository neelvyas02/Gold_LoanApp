import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Gem, Lock, Smartphone, KeyRound, ArrowLeft, Home, ShieldCheck, UserCheck, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { z } from "zod";
import { BranchContactModal } from "@/components/auth/branch-contact-modal";
import { VFLogo } from "@/components/ui/vf-logo";

const searchSchema = z.object({
  mode: z.enum(["admin", "customer"]).optional(),
});

export const Route = createFileRoute("/portal/forgot-password")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Forgot Password — Vyas Finance" },
      { name: "description", content: "Reset your Vyas Finance account password." },
    ],
  }),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/portal/forgot-password" });

  const [accountType, setAccountType] = useState<"admin" | "customer">("customer");
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Customer OTP flow states
  const [step, setStep] = useState<"REQUEST_OTP" | "RESET_PASSWORD">("REQUEST_OTP");
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (search.mode) {
      setAccountType(search.mode);
    }
  }, [search.mode]);

  const handleSwitchMode = (mode: "admin" | "customer") => {
    setAccountType(mode);
    navigate({ to: "/portal/forgot-password", search: { mode } });
  };

  async function handleSendOTP(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your registered mobile number or email.");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.customerForgotPassword({ identifier: identifier.trim() });
      toast.success("OTP sent! Please check your registered mobile/email (or server log).");
      setStep("RESET_PASSWORD");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.customerResetPassword({
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });

      toast.success("Password reset successfully! Please log in with your new password.");
      navigate({ to: "/portal/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-muted/60 flex flex-col items-center justify-center px-4 py-10 selection:bg-gold/30 selection:text-gold">
      {/* Branch Contact Modal */}
      <BranchContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* Top Navigation Bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Home className="h-4 w-4 text-gold" />
          <span>Home / Main Portal</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => navigate({ to: "/", search: { mode: "admin" } })}
            className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Admin Sign In
          </button>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={() => navigate({ to: "/portal/login" })}
            className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5 text-gold" /> Customer Sign In
          </button>
        </div>
      </div>

      <Card className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-card border-border shadow-2xl space-y-6">
        
        {/* Header branding */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <VFLogo size="sm" />
            <div>
              <h2 className="font-bold text-foreground leading-tight">Vyas Finance</h2>
              <p className="text-xs text-muted-foreground">
                {accountType === "admin" ? "Admin Credential Recovery" : "Reset Customer Password"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setContactModalOpen(true)}
            className="flex items-center gap-1 text-xs text-gold hover:underline font-semibold cursor-pointer"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Contact Branch
          </button>
        </div>

        {/* Segmented Account Role Switcher */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Select Account Role
          </Label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border/60">
            <button
              type="button"
              onClick={() => handleSwitchMode("admin")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                accountType === "admin"
                  ? "bg-gold/15 text-foreground border border-gold/40 shadow-sm shadow-gold/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              <ShieldCheck className={`h-4 w-4 ${accountType === "admin" ? "text-gold" : "text-muted-foreground"}`} />
              <span>Admin / Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode("customer")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                accountType === "customer"
                  ? "bg-gold/15 text-foreground border border-gold/40 shadow-sm shadow-gold/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              <UserCheck className={`h-4 w-4 ${accountType === "customer" ? "text-gold" : "text-muted-foreground"}`} />
              <span>Customer</span>
            </button>
          </div>
        </div>

        {/* Content based on Account Role */}
        {accountType === "admin" ? (
          <div className="space-y-5 pt-1">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gold" />
                Admin Credential Reset Notice
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For administrative security and strict access control, staff credentials cannot be self-reset via online OTP.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gold/10 border border-gold/20 text-xs space-y-2">
              <p className="font-semibold text-foreground">How to reset your Admin password:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Contact your Branch Manager or System Administrator directly.</li>
                <li>Provide your registered staff ID for identity verification.</li>
                <li>Your administrator will issue a secure temporary password reset.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold rounded-xl h-11 text-sm shadow-md cursor-pointer"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Contact Branch Administrator
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/", search: { mode: "admin" } })}
                className="w-full rounded-xl h-11 text-xs font-semibold cursor-pointer"
              >
                ← Return to Admin Sign In
              </Button>
            </div>
          </div>
        ) : (
          /* Customer Forgot Password Form */
          <div>
            {step === "REQUEST_OTP" ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Forgot Password?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your registered mobile number or email address to receive a secure OTP code.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identifier">Mobile Number or Email</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="identifier"
                      placeholder="10-digit number or name@example.com"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)] cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Set New Password</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the OTP sent to <span className="font-semibold text-foreground">{identifier}</span> and choose a new password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-Digit OTP Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      placeholder="Enter 6-digit OTP"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold tracking-wider font-mono text-center text-lg"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Min 6 characters"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/3 rounded-xl h-11 cursor-pointer"
                    onClick={() => setStep("REQUEST_OTP")}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-2/3 bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)] cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Navigation Links */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate({ to: accountType === "admin" ? "/" : "/portal/login", search: accountType === "admin" ? { mode: "admin" } : undefined })}
            className="hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← {accountType === "admin" ? "Back to Admin Sign In" : "Back to Customer Sign In"}
          </button>
          
          <button
            type="button"
            onClick={() => handleSwitchMode(accountType === "admin" ? "customer" : "admin")}
            className="text-gold hover:underline font-semibold cursor-pointer"
          >
            Switch to {accountType === "admin" ? "Customer Reset" : "Admin Sign In"} →
          </button>
        </div>

      </Card>
    </div>
  );
}
