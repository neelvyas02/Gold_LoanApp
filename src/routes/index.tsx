import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Lock, User, Smartphone, ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff, HelpCircle, PhoneCall, ArrowRight, Loader2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { z } from "zod";
import { VFLogo } from "@/components/ui/vf-logo";
import { GoldWavesBg } from "@/components/ui/gold-waves-bg";
import { ThemeToggle } from "@/components/auth/theme-toggle";
import { BranchContactModal } from "@/components/auth/branch-contact-modal";

const searchSchema = z.object({
  mode: z.enum(["admin", "customer"]).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (search) => searchSchema.parse(search),
  component: UnifiedLoginPage,
  head: () => ({
    meta: [
      { title: "Vyas Finance — Sign In" },
      { name: "description", content: "Secure portal sign in for Vyas Finance accounts." },
    ],
  }),
});

function UnifiedLoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });

  // Derive active account mode from URL search parameters (defaults to 'admin')
  const accountType: "admin" | "customer" = search.mode === "customer" ? "customer" : "admin";
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Load remembered identifier if saved
  useEffect(() => {
    const saved = localStorage.getItem("remembered_identifier");
    if (saved) {
      setIdentifier(saved);
      setRememberMe(true);
    }
  }, []);

  // Field validation state
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string; general?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = accountType === "admin"
        ? "Username is required."
        : "Mobile number or email is required.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (accountType === "admin") {
        await ApiClient.login({ username: identifier.trim(), password });
        
        if (rememberMe) {
          localStorage.setItem("remembered_identifier", identifier.trim());
        } else {
          localStorage.removeItem("remembered_identifier");
        }

        toast.success("Welcome back to Vyas Finance Admin Portal!");
        navigate({ to: "/dashboard" });
      } else {
        await ApiClient.customerLogin({ identifier: identifier.trim(), password });
        
        if (rememberMe) {
          localStorage.setItem("remembered_identifier", identifier.trim());
        } else {
          localStorage.removeItem("remembered_identifier");
        }

        toast.success("Welcome back to Vyas Finance Customer Portal!");
        navigate({ to: "/portal/dashboard" });
      }
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please verify and try again.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleSwitchMode = (mode: "admin" | "customer") => {
    setErrors({});
    if (mode === "admin") {
      navigate({ to: "/admin/login" });
    } else {
      navigate({ to: "/portal/login" });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between overflow-x-hidden selection:bg-gold/30 selection:text-gold">
      {/* Branch Contact Modal */}
      <BranchContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* TOP FLOATING SLIM NAVBAR */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl bg-card/75 border border-border/70 rounded-full px-5 py-2.5 shadow-lg shadow-black/5">
          {/* LEFT: Branding */}
          <div className="flex items-center gap-3">
            <VFLogo size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight leading-none text-foreground">
                Vyas <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">Finance</span>
              </span>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-gold" />
              <span>Help</span>
            </button>

            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <PhoneCall className="h-3.5 w-3.5 text-gold" />
              <span className="hidden sm:inline">Contact Branch</span>
              <span className="sm:hidden">Branch</span>
            </button>

            <div className="h-4 w-px bg-border/60 mx-1" />

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT HERO & LOGIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 grid lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* LEFT BRANDING AREA (55% desktop width - clean, uncarded) */}
        <div className="relative lg:col-span-6 xl:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left py-6 lg:py-12 pr-0 lg:pr-8 space-y-6">
          {/* Subtle Ambient Gold Waves Background (left side only) */}
          <GoldWavesBg />

          <div className="relative z-10 flex flex-col items-center lg:items-start space-y-6 max-w-xl">
            {/* Standalone Premium Brand Logo Asset with Transparent Background */}
            <VFLogo size="2xl" variant="full" animated={true} />
          </div>
        </div>

        {/* RIGHT LOGIN CARD AREA (45% desktop width) */}
        <div className="relative lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end z-20">
          <Card className="w-full max-w-[540px] p-6 sm:p-10 rounded-2xl bg-card/90 border-border/80 shadow-2xl shadow-black/20 backdrop-blur-2xl transition-all duration-300">
            
            {/* Card Header */}
            <div className="space-y-1.5 mb-6 text-left">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Sign in to continue to Vyas Finance.
              </p>
            </div>

            {/* General Error Alert */}
            {errors.general && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errors.general}</span>
              </div>
            )}

            {/* Segmented Role Selector */}
            <div className="mb-6 space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Account Role
              </Label>
              <div className="grid grid-cols-2 gap-2.5 p-1 rounded-xl bg-muted/40 border border-border/60">
                <button
                  type="button"
                  onClick={() => handleSwitchMode("admin")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
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

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-medium text-foreground">
                  {accountType === "admin" ? "Username" : "Mobile Number / Email"}
                </Label>
                <div className="relative">
                  {accountType === "admin" ? (
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    autoComplete={accountType === "admin" ? "username" : "email"}
                    placeholder={accountType === "admin" ? "Enter staff username" : "Enter mobile number or email"}
                    className={`pl-10 rounded-xl h-11 border text-sm transition-all duration-200 ${
                      errors.identifier
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-border/80 focus-visible:border-gold focus-visible:ring-gold/30"
                    }`}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
                    }}
                    disabled={loading}
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/portal/forgot-password", search: { mode: accountType } })}
                    className="text-xs text-gold hover:underline font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className={`pl-10 pr-10 rounded-xl h-11 border text-sm transition-all duration-200 ${
                      errors.password
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-border/80 focus-visible:border-gold focus-visible:ring-gold/30"
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Customer Activate Link */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-xs text-muted-foreground font-medium cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>

                {accountType === "customer" && (
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/portal/signup" })}
                    className="text-xs text-gold hover:underline font-semibold cursor-pointer"
                  >
                    Activate Account
                  </button>
                )}
              </div>

              {/* Primary Metallic Gold Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold rounded-xl h-11 text-sm shadow-lg shadow-gold/25 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer mt-3"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {accountType === "admin" ? "Login as Admin" : "Customer Login"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Bottom Card Footer Navigation */}
            <div className="mt-8 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {accountType === "customer" ? (
                <button
                  type="button"
                  onClick={() => handleSwitchMode("admin")}
                  className="text-muted-foreground hover:text-gold font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  ← Back to Admin / Staff Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitchMode("customer")}
                  className="text-muted-foreground hover:text-gold font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Switch to Customer Sign In →
                </button>
              )}

              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="text-gold hover:underline font-medium cursor-pointer"
              >
                Contact Branch
              </button>
            </div>

          </Card>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-[11px] text-muted-foreground/70 z-10">
        <p>© 2026 Vyas Finance. All rights reserved.</p>
      </footer>
    </div>
  );
}
