import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Gem, Lock, Smartphone, Eye, EyeOff, AlertCircle, Home, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";

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
    <div className="min-h-screen w-full bg-muted flex flex-col items-center justify-center px-4 py-10">
      {/* Top Universal Navigation Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <Home className="h-4 w-4 text-gold" />
          <span>Home / Main Login</span>
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
            onClick={() => navigate({ to: "/portal/signup" })}
            className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5 text-gold" /> Activate Account
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Brand Panel */}
        <div className="hidden md:flex flex-col justify-between rounded-2xl bg-card border border-border p-10 shadow-[var(--shadow-card)] h-full min-h-[500px]">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gold grid place-items-center shadow-[var(--shadow-gold)]">
              <Gem className="h-5 w-5 text-gold-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-foreground">Vyas Finance</p>
              <p className="text-xs text-muted-foreground">Customer Portal</p>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
              Track your gold loans in real-time.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Sign in to view your collateral ornaments, download payment receipts, inspect loan timelines, and submit support tickets.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { k: "My Profile", v: "Verified" },
              { k: "Gold Collateral", v: "Insured" },
              { k: "Receipts", v: "Downloadable" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-muted py-4">
                <p className="text-base font-semibold text-foreground">{s.v}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Login Card */}
        <Card className="p-8 md:p-10 rounded-2xl bg-card border-border shadow-[var(--shadow-card)]">
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gold grid place-items-center">
              <Gem className="h-5 w-5 text-gold-foreground" />
            </div>
            <p className="font-semibold text-foreground">Vyas Finance Portal</p>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Customer Sign In</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Access your secure Vyas Finance account.
          </p>

          {/* General Error Banner */}
          {errors.general && (
            <div className="mt-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-foreground">Mobile Number or Email</Label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  placeholder="10-digit number or name@example.com"
                  className={`pl-10 rounded-xl h-11 border ${
                    errors.identifier ? "border-destructive focus-visible:ring-destructive" : "border-border focus-visible:ring-gold"
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
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
                  placeholder="••••••••"
                  className={`pl-10 pr-10 rounded-xl h-11 border ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : "border-border focus-visible:ring-gold"
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

            <div className="flex items-center justify-between">
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
                  Remember Me
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)] cursor-pointer"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold">
            <button
              type="button"
              onClick={() => navigate({ to: "/portal/activate-account" })}
              className="text-gold font-semibold hover:underline cursor-pointer"
            >
              Activate Account
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
