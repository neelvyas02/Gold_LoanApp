import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Gem, Lock, Smartphone, KeyRound, ArrowLeft, Home, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/forgot-password")({
  component: CustomerForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Forgot Password — Vyas Finance Customer Portal" },
      { name: "description", content: "Reset your Vyas Finance Customer Portal password via OTP verification." },
    ],
  }),
});

function CustomerForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"REQUEST_OTP" | "RESET_PASSWORD">("REQUEST_OTP");
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    <div className="min-h-screen w-full bg-muted flex flex-col items-center justify-center px-4 py-10">
      {/* Top Universal Navigation Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <button
          onClick={() => navigate({ to: "/" })}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <Home className="h-4 w-4 text-gold" />
          <span>Home / Main Portal</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <button
            onClick={() => navigate({ to: "/portal/login" })}
            className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
          >
            <UserCheck className="h-3.5 w-3.5 text-gold" /> Login
          </button>
          <span className="text-border">|</span>
          <button
            onClick={() => navigate({ to: "/portal/activate-account" })}
            className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5 text-gold" /> Activate
          </button>
        </div>
      </div>

      <Card className="w-full max-w-md p-8 rounded-2xl bg-card border-border shadow-[var(--shadow-card)]">
        <button
          onClick={() => navigate({ to: "/portal/login" })}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 text-gold" />
          Back to Customer Login
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gold grid place-items-center">
            <Gem className="h-5 w-5 text-gold-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-foreground leading-tight">Vyas Finance</h2>
            <p className="text-xs text-muted-foreground">Reset Customer Password</p>
          </div>
        </div>

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
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)]"
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
                className="w-1/3 rounded-xl h-11"
                onClick={() => setStep("REQUEST_OTP")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="w-2/3 bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)]"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
