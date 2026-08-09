import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  Gem,
  Lock,
  Smartphone,
  KeyRound,
  ArrowLeft,
  Home,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
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
      { name: "description", content: "Reset your Vyas Finance account password via secure OTP verification." },
    ],
  }),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/portal/forgot-password" });

  const [accountType, setAccountType] = useState<"admin" | "customer">("admin");
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Admin Recovery Steps: 1 = Identify Email, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [adminStep, setAdminStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Admin inputs
  const [adminEmail, setAdminEmail] = useState("");
  const [adminOtp, setAdminOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Timers
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0); // 60s cooldown

  // Customer Recovery state
  const [custStep, setCustStep] = useState<"REQUEST_OTP" | "RESET_PASSWORD">("REQUEST_OTP");
  const [custIdentifier, setCustIdentifier] = useState("");
  const [custOtp, setCustOtp] = useState("");
  const [custNewPassword, setCustNewPassword] = useState("");
  const [custConfirmPassword, setCustConfirmPassword] = useState("");

  useEffect(() => {
    if (search.mode) {
      setAccountType(search.mode);
    }
  }, [search.mode]);

  // 10-minute OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (adminStep === 2 && otpSecondsLeft > 0) {
      interval = setInterval(() => {
        setOtpSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adminStep, otpSecondsLeft]);

  // 60-second resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSwitchMode = (mode: "admin" | "customer") => {
    setAccountType(mode);
    navigate({ to: "/portal/forgot-password", search: { mode } });
  };

  // Password Policy Checks
  const passLength = adminNewPassword.length >= 8;
  const passUpper = /[A-Z]/.test(adminNewPassword);
  const passLower = /[a-z]/.test(adminNewPassword);
  const passNumber = /[0-9]/.test(adminNewPassword);
  const passSpecial = /[^A-Za-z0-9]/.test(adminNewPassword);
  const passMatches = adminNewPassword.length > 0 && adminNewPassword === adminConfirmPassword;
  const isPasswordValid = passLength && passUpper && passLower && passNumber && passSpecial && passMatches;

  // Step 1: Admin Send OTP
  async function handleAdminSendOTP(e: FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim() || !emailRegex.test(adminEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.adminForgotPassword({ email: adminEmail.trim() });
      toast.success("If an account exists for this email address, a password reset OTP has been sent.");
      setAdminStep(2);
      setOtpSecondsLeft(600);
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Admin Verify OTP
  async function handleAdminVerifyOTP(e: FormEvent) {
    e.preventDefault();
    if (!adminOtp.trim() || adminOtp.trim().length !== 6 || !/^\d{6}$/.test(adminOtp.trim())) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    if (otpSecondsLeft <= 0) {
      toast.error("OTP has expired. Please click 'Resend OTP' to receive a new code.");
      return;
    }

    setLoading(true);
    try {
      const res = await ApiClient.adminVerifyOTP({
        email: adminEmail.trim(),
        otp: adminOtp.trim(),
      });
      setResetToken(res.resetToken);
      toast.success("OTP verified! Please create your new password.");
      setAdminStep(3);
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Admin Resend OTP
  async function handleAdminResendOTP() {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await ApiClient.adminResendOTP({ email: adminEmail.trim() });
      toast.success("If an account exists for this email address, a new OTP code has been sent.");
      setOtpSecondsLeft(600);
      setResendCooldown(60);
      setAdminOtp("");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Admin Change Password
  async function handleAdminResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error("Please ensure your new password satisfies all complexity requirements.");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.adminResetPassword({
        resetToken,
        newPassword: adminNewPassword,
        confirmPassword: adminConfirmPassword,
      });
      toast.success("Password changed successfully!");
      setAdminStep(4);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Customer Flow Handlers
  async function handleCustomerSendOTP(e: FormEvent) {
    e.preventDefault();
    if (!custIdentifier.trim()) {
      toast.error("Please enter your registered mobile number or email.");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.customerForgotPassword({ identifier: custIdentifier.trim() });
      toast.success("OTP sent! Please check your registered mobile/email.");
      setCustStep("RESET_PASSWORD");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomerResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!custOtp.trim()) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
    if (!custNewPassword || custNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (custNewPassword !== custConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.customerResetPassword({
        identifier: custIdentifier.trim(),
        otp: custOtp.trim(),
        newPassword: custNewPassword,
      });
      toast.success("Password reset successfully! Please log in.");
      navigate({ to: "/portal/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-muted/60 flex flex-col items-center justify-center px-4 py-10 selection:bg-gold/30 selection:text-gold">
      {/* Branch Contact Modal */}
      <BranchContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* Top Universal Navigation Bar */}
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
        
        {/* Card Header Branding */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <VFLogo size="sm" />
            <div>
              <h2 className="font-bold text-foreground leading-tight">Vyas Finance</h2>
              <p className="text-xs text-muted-foreground">
                {accountType === "admin" ? "Admin / Staff Recovery" : "Reset Customer Password"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setContactModalOpen(true)}
            className="flex items-center gap-1 text-xs text-gold hover:underline font-semibold cursor-pointer"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Branch Support
          </button>
        </div>

        {/* Account Role Selector */}
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

        {/* ADMIN / EMPLOYEE 4-STEP RECOVERY FLOW */}
        {accountType === "admin" ? (
          <div className="space-y-6">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between px-2 text-xs font-semibold border-b border-border/40 pb-3 text-muted-foreground">
              <span className={adminStep === 1 ? "text-gold font-bold" : adminStep > 1 ? "text-foreground" : ""}>
                1. Identify
              </span>
              <span className="text-border">→</span>
              <span className={adminStep === 2 ? "text-gold font-bold" : adminStep > 2 ? "text-foreground" : ""}>
                2. Verify OTP
              </span>
              <span className="text-border">→</span>
              <span className={adminStep === 3 ? "text-gold font-bold" : adminStep > 3 ? "text-foreground" : ""}>
                3. New Password
              </span>
              <span className="text-border">→</span>
              <span className={adminStep === 4 ? "text-gold font-bold text-success" : ""}>
                4. Success
              </span>
            </div>

            {/* STEP 1 — IDENTIFY ACCOUNT */}
            {adminStep === 1 && (
              <form onSubmit={handleAdminSendOTP} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">Reset your password</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter the email address registered with your Vyas Finance admin/employee account.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-xs font-medium">Registered Admin / Employee Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@vyasfinance.com"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold text-sm"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold rounded-xl h-11 text-sm shadow-md cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      Sending OTP...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send OTP <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* STEP 2 — OTP VERIFICATION */}
            {adminStep === 2 && (
              <form onSubmit={handleAdminVerifyOTP} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">Enter verification code</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    An OTP code has been sent to <span className="font-semibold text-foreground">{adminEmail}</span>.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="adminOtp" className="text-xs font-medium">6-Digit Verification Code</Label>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-mono font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>OTP expires in {formatTimer(otpSecondsLeft)}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminOtp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold tracking-widest font-mono text-center text-lg font-bold"
                      value={adminOtp}
                      onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAdminResendOTP}
                    disabled={loading || resendCooldown > 0}
                    className="w-1/2 rounded-xl h-11 text-xs font-semibold cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold rounded-xl h-11 text-sm shadow-md cursor-pointer"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3 — CHANGE PASSWORD */}
            {adminStep === 3 && (
              <form onSubmit={handleAdminResetPassword} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">Create New Password</h3>
                  <p className="text-xs text-muted-foreground">
                    Create a strong, unique password for your Vyas Finance account.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminNewPassword" className="text-xs font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminNewPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold text-sm"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adminConfirmPassword" className="text-xs font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminConfirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold text-sm"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Policy Checklist */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider mb-2">Password Requirements:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${passLength ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {passLength ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passUpper ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {passUpper ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passLower ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {passLower ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                      <span>1 Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passNumber ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {passNumber ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                      <span>1 Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passSpecial ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {passSpecial ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                      <span>1 Special char</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passMatches ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {passMatches ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold rounded-xl h-11 text-sm shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            )}

            {/* STEP 4 — SUCCESS */}
            {adminStep === 4 && (
              <div className="space-y-6 text-center py-4">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center mx-auto text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">Password Changed Successfully</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Your Vyas Finance admin/employee account password has been updated. Please sign in with your new credentials.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate({ to: "/", search: { mode: "admin" } })}
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold rounded-xl h-11 text-sm shadow-md cursor-pointer"
                >
                  Back to Admin Sign In
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Customer Forgot Password Form */
          <div>
            {custStep === "REQUEST_OTP" ? (
              <form onSubmit={handleCustomerSendOTP} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Forgot Password?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your registered mobile number or email address to receive a secure OTP code.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custIdentifier">Mobile Number or Email</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custIdentifier"
                      placeholder="10-digit number or name@example.com"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold text-sm"
                      value={custIdentifier}
                      onChange={(e) => setCustIdentifier(e.target.value)}
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
              <form onSubmit={handleCustomerResetPassword} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Set New Password</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the OTP sent to <span className="font-semibold text-foreground">{custIdentifier}</span> and choose a new password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="custOtp">6-Digit OTP Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custOtp"
                      placeholder="Enter 6-digit OTP"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold tracking-wider font-mono text-center text-lg"
                      value={custOtp}
                      onChange={(e) => setCustOtp(e.target.value)}
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="custNewPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custNewPassword"
                      type="password"
                      placeholder="Min 6 characters"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold text-sm"
                      value={custNewPassword}
                      onChange={(e) => setCustNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="custConfirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custConfirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-gold text-sm"
                      value={custConfirmPassword}
                      onChange={(e) => setCustConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/3 rounded-xl h-11 cursor-pointer"
                    onClick={() => setCustStep("REQUEST_OTP")}
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
        <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate({ to: accountType === "admin" ? "/" : "/portal/login", search: accountType === "admin" ? { mode: "admin" } : undefined })}
            className="hover:text-gold transition-colors flex items-center gap-1 cursor-pointer py-2 px-3 rounded-lg hover:bg-gold/10 active:scale-95 min-h-[40px] touch-manipulation font-semibold"
          >
            ← {accountType === "admin" ? "Back to Admin Sign In" : "Back to Customer Sign In"}
          </button>
          
          <button
            type="button"
            onClick={() => handleSwitchMode(accountType === "admin" ? "customer" : "admin")}
            className="text-gold hover:underline font-semibold cursor-pointer py-2 px-3 rounded-lg hover:bg-gold/10 active:scale-95 min-h-[40px] touch-manipulation"
          >
            Switch to {accountType === "admin" ? "Customer Reset" : "Admin Sign In"} →
          </button>
        </div>

      </Card>
    </div>
  );
}
