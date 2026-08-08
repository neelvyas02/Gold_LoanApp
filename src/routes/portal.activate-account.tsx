import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Gem, Lock, Mail, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Home, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/activate-account")({
  component: CustomerActivationPage,
  head: () => ({
    meta: [
      { title: "Account Activation — Vyas Finance Customer Portal" },
      { name: "description", content: "Activate your Vyas Finance Customer Portal account." },
    ],
  }),
});

function CustomerActivationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"ENTER_EMAIL" | "VERIFY_AND_SET_PASSWORD">("ENTER_EMAIL");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customerName, setCustomerName] = useState("");

  // Error messaging
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role === "Customer") {
      navigate({ to: "/portal/dashboard" });
    }
  }, [navigate]);

  // Step 1: Send Activation OTP
  async function handleSendOtp(e?: FormEvent) {
    if (e) e.preventDefault();
    setErrors({});

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrors({ email: "Email is required." });
      toast.error("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrors({ email: "Please enter a valid email address." });
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await ApiClient.customerSendActivationOTP({ email: cleanEmail });
      if (res && res.data?.customerName) {
        setCustomerName(res.data.customerName);
      }
      toast.success(res.message || "An OTP has been sent to your registered email address.");
      setStep("VERIFY_AND_SET_PASSWORD");
      setResendCooldown(60);
    } catch (err: any) {
      const msg = err.message || "No customer found with this email address. Please enter the email registered by your branch.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Activate Account
  async function handleActivateAccount(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};

    if (!otp.trim()) {
      newErrors.otp = "Please enter the 6-digit OTP code sent to your email.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please resolve the validation errors below.");
      return;
    }

    setLoading(true);
    try {
      const res = await ApiClient.customerActivateAccount({
        email: email.trim(),
        otp: otp.trim(),
        password,
        confirmPassword,
      });

      toast.success(res.message || "Account activated successfully. Redirecting to dashboard...");
      setTimeout(() => {
        navigate({ to: "/portal/dashboard" });
      }, 1000);
    } catch (err: any) {
      const msg = err.message || "Activation failed. Please check your OTP and try again.";
      setErrors({ general: msg });
      toast.error(msg);
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
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Home className="h-4 w-4 text-gold" />
          <span>Home / Main Portal</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <button
            onClick={() => navigate({ to: "/portal/login" })}
            className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5 text-gold" /> Sign In
          </button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center border border-gold/30 shadow-[var(--shadow-gold)]">
            <Gem className="h-6 w-6 text-gold" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vyas Finance</h1>
          <p className="text-sm font-medium text-muted-foreground">Customer Portal Account Activation</p>
        </div>

        <Card className="p-6 md:p-8 rounded-2xl border-border bg-card shadow-[var(--shadow-soft)]">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border text-xs font-semibold">
            <div className={`flex items-center gap-1.5 ${step === "ENTER_EMAIL" ? "text-gold font-bold" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "ENTER_EMAIL" ? "bg-gold text-white" : "bg-muted text-muted-foreground"}`}>1</span>
              <span>Enter Registered Email</span>
            </div>
            <div className="h-0.5 w-8 bg-border" />
            <div className={`flex items-center gap-1.5 ${step === "VERIFY_AND_SET_PASSWORD" ? "text-gold font-bold" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "VERIFY_AND_SET_PASSWORD" ? "bg-gold text-white" : "bg-muted text-muted-foreground"}`}>2</span>
              <span>OTP & Password</span>
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {step === "ENTER_EMAIL" ? (
            /* STEP 1: Enter Registered Email */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">
                  Registered Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    className={`pl-10 rounded-xl h-11 border ${errors.email ? "border-destructive focus-visible:ring-destructive" : "border-border focus-visible:ring-gold"}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
                    }}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.email}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Enter the email address registered with your branch during gold loan creation.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)] cursor-pointer mt-2"
                disabled={loading}
              >
                {loading ? "Verifying & Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            /* STEP 2: Enter OTP & Set Password */
            <form onSubmit={handleActivateAccount} className="space-y-4">
              <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-xs font-medium text-foreground flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>An OTP has been sent to <strong>{email}</strong> {customerName ? `(${customerName})` : ""}.</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-xs font-medium">
                  6-Digit OTP Code <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className={`pl-10 rounded-xl h-11 tracking-widest text-center text-base font-bold border ${errors.otp ? "border-destructive focus-visible:ring-destructive" : "border-border focus-visible:ring-gold"}`}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined, general: undefined }));
                    }}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {errors.otp && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.otp}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">
                  Create Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    className={`pl-10 pr-10 rounded-xl h-11 border ${errors.password ? "border-destructive focus-visible:ring-destructive" : "border-border focus-visible:ring-gold"}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    className={`pl-10 rounded-xl h-11 border ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : "border-border focus-visible:ring-gold"}`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined, general: undefined }));
                    }}
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)] cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Activating Account..." : "Activate Account & Login"}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep("ENTER_EMAIL")}
                    className="font-semibold text-muted-foreground hover:text-gold cursor-pointer"
                    disabled={loading}
                  >
                    ← Change Email Address
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading || resendCooldown > 0}
                    className="font-semibold text-gold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold">
            <button
              type="button"
              onClick={() => navigate({ to: "/portal/login" })}
              className="text-gold font-semibold hover:underline cursor-pointer"
            >
              Already activated? Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/", search: { mode: "admin" } })}
              className="text-muted-foreground hover:text-gold cursor-pointer"
            >
              Admin Sign In
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
