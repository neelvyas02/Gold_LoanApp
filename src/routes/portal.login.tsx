import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Lock, Smartphone, AlertCircle, Eye, EyeOff, HelpCircle, PhoneCall, ArrowRight, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { VFLogo } from "@/components/ui/vf-logo";
import { GoldWavesBg } from "@/components/ui/gold-waves-bg";
import { ThemeToggle } from "@/components/auth/theme-toggle";
import { BranchContactModal } from "@/components/auth/branch-contact-modal";

export const Route = createFileRoute("/portal/login")({
  component: CustomerLoginPage,
  head: () => ({
    meta: [
      { title: "Customer Sign In — Vyas Finance" },
      { name: "description", content: "Sign in to your Vyas Finance Customer Portal." },
    ],
  }),
});

function CustomerLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});

  useEffect(() => {
    // Check if already logged in as Customer
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role === "Customer") {
      navigate({ to: "/portal/dashboard" });
    }

    // Load saved identifier if remember me was checked
    const savedIdentifier = localStorage.getItem("remembered_identifier");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!identifier.trim()) {
      newErrors.identifier = "Mobile number or email is required.";
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
      await ApiClient.customerLogin({
        identifier: identifier.trim(),
        password,
      });
      
      toast.success("Welcome back to Vyas Finance!");
      
      if (rememberMe) {
        localStorage.setItem("remembered_identifier", identifier.trim());
      } else {
        localStorage.removeItem("remembered_identifier");
      }

      navigate({ to: "/portal/dashboard" });
    } catch (err: any) {
      const msg = err.message || "Invalid mobile number/email or password.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between overflow-x-hidden selection:bg-gold/30 selection:text-gold">
      {/* Branch Contact Modal */}
      <BranchContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* TOP FLOATING SLIM NAVBAR */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl bg-card/75 border border-border/70 rounded-full px-5 py-2.5 shadow-lg shadow-black/5">
          {/* LEFT: Branding */}
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-3 text-left cursor-pointer"
          >
            <VFLogo size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight leading-none text-foreground">
                Vyas <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">Finance</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline-block">
                Customer Portal
              </span>
            </div>
          </button>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <button
              type="button"
              onClick={() => navigate({ to: "/", search: { mode: "admin" } })}
              className="text-muted-foreground hover:text-gold transition-colors font-medium cursor-pointer hidden sm:inline-block"
            >
              Admin Sign In
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
        
        {/* LEFT BRANDING AREA */}
        <div className="relative lg:col-span-6 xl:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left py-6 lg:py-12 pr-0 lg:pr-8 space-y-6">
          <GoldWavesBg />

          <div className="relative z-10 flex flex-col items-center lg:items-start space-y-6 max-w-xl">
            {/* Standalone Premium Brand Logo Asset with Transparent Background */}
            <VFLogo size="2xl" variant="full" animated={true} />

            {/* Subtitle & Tagline outside the logo asset */}
            <div className="space-y-2 text-center lg:text-left pt-2">
              <p className="text-lg sm:text-xl font-bold tracking-wide text-amber-400 flex items-center gap-2 justify-center lg:justify-start">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Customer Portal Access
              </p>
              <p className="text-sm text-muted-foreground/85 leading-relaxed max-w-md">
                Track your gold loan status, inspect insured ornament valuations, and download official payment receipts.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN CARD */}
        <div className="relative lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end z-20">
          <Card className="w-full max-w-[540px] p-6 sm:p-10 rounded-2xl bg-card/90 border-border/80 shadow-2xl shadow-black/20 backdrop-blur-2xl transition-all duration-300">
            
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-gold">
              <UserCheck className="h-4 w-4" />
              <span>Customer Sign In</span>
            </div>

            <div className="space-y-1.5 mb-6 text-left">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Sign in to manage your Vyas Finance account.
              </p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errors.general}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-medium text-foreground">
                  Mobile Number or Email
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter mobile number or email"
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/portal/forgot-password" })}
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

                <button
                  type="button"
                  onClick={() => navigate({ to: "/portal/signup" })}
                  className="text-xs text-gold hover:underline font-semibold cursor-pointer"
                >
                  Activate Account
                </button>
              </div>

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
                    Customer Login
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-5 border-t border-border/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => navigate({ to: "/", search: { mode: "admin" } })}
                className="text-muted-foreground hover:text-gold font-medium cursor-pointer"
              >
                ← Switch to Admin Sign In
              </button>
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

      <footer className="w-full py-4 text-center text-[11px] text-muted-foreground/70 z-10">
        <p>© 2026 Vyas Finance. All rights reserved.</p>
      </footer>
    </div>
  );
}
