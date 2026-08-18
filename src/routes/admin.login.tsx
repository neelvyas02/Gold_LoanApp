import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Lock, User, ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff, PhoneCall, ArrowRight, Loader2, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin Sign In — Vyas Finance" },
      { name: "description", content: "Secure Administrator Portal sign in for Vyas Finance." },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Field validation state
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});

  useEffect(() => {
    // Redirect if already logged in as Admin
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role === "Admin") {
      navigate({ to: "/dashboard" });
    }

    const saved = localStorage.getItem("remembered_admin_username");
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors: { username?: string; password?: string; general?: string } = {};

    if (!username.trim()) {
      newErrors.username = "Admin username is required.";
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
      toast.error("Please enter your admin credentials.");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.login({
        username: username.trim(),
        password,
        requiredRole: "Admin",
      });

      if (rememberMe) {
        localStorage.setItem("remembered_admin_username", username.trim());
      } else {
        localStorage.removeItem("remembered_admin_username");
      }

      toast.success("Welcome back to Vyas Finance Admin Portal!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const msg = err.message || "Invalid admin username or password.";
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
              <span className="text-sm font-extrabold tracking-tight leading-none text-foreground flex items-center gap-2">
                Vyas <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">Finance</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0 border-amber-500/40 text-amber-500 bg-amber-500/10 font-bold">
                  ADMIN
                </Badge>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline-block">
                Management Portal
              </span>
            </div>
          </button>

          {/* RIGHT: Switcher Links & Actions */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <button
              type="button"
              onClick={() => navigate({ to: "/portal/login" })}
              className="text-muted-foreground hover:text-foreground transition-colors font-semibold flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md hover:bg-muted/40 hidden sm:flex"
            >
              <span>Customer Portal</span>
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 grid lg:grid-cols-12 gap-8 items-center z-10">
        {/* LEFT BRANDING AREA */}
        <div className="relative lg:col-span-6 xl:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left py-6 lg:py-12 pr-0 lg:pr-8 space-y-6">
          <GoldWavesBg />
          <div className="relative z-10 flex flex-col items-center lg:items-start space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              System Administration & Control Center
            </div>
            <VFLogo size="2xl" variant="full" animated={true} />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Authorized access for executive administration, audit reporting, risk configuration, and system control operations.
            </p>
          </div>
        </div>

        {/* RIGHT LOGIN CARD AREA */}
        <div className="relative lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end z-20">
          <Card className="w-full max-w-[500px] p-6 sm:p-10 rounded-2xl bg-card/90 border-amber-500/30 shadow-2xl shadow-black/20 backdrop-blur-2xl transition-all duration-300">
            {/* Header */}
            <div className="space-y-2 mb-6 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Administrator Sign In
                </span>
                <span className="text-xs text-muted-foreground">Admin Access</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter your administrative credentials to continue.
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
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm shadow-amber-500/10 cursor-default"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  <span>Admin / Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate({ to: "/portal/login" })}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all duration-200 cursor-pointer"
                >
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Customer</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-foreground">
                  Admin Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter admin username"
                    className={`pl-10 rounded-xl h-11 border text-sm transition-all duration-200 ${
                      errors.username
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-border/80 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"
                    }`}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                    }}
                    disabled={loading}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.username}
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
                    onClick={() => navigate({ to: "/portal/forgot-password", search: { mode: "admin" } })}
                    className="text-xs text-amber-500 hover:underline font-medium cursor-pointer"
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
                    placeholder="Enter admin password"
                    className={`pl-10 pr-10 rounded-xl h-11 border text-sm transition-all duration-200 ${
                      errors.password
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-border/80 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
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
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-xs font-medium leading-none text-muted-foreground cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-lg shadow-amber-500/20 transition-all duration-200 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating Admin...
                  </>
                ) : (
                  <>
                    Admin Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-end text-xs">
              <button
                type="button"
                onClick={() => navigate({ to: "/portal/login" })}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                Customer Portal →
              </button>
            </div>
          </Card>
        </div>
      </main>

      <footer className="w-full py-4 px-4 text-center text-xs text-muted-foreground border-t border-border/40 bg-card/40 z-10">
        <p>© 2026 Vyas Finance. All Rights Reserved. Administrator Security Portal.</p>
      </footer>
    </div>
  );
}
