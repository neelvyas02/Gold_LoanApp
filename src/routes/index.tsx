import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Gem, Lock, User, Smartphone, UserCheck, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["admin", "customer"]).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (search) => searchSchema.parse(search),
  component: UnifiedLoginPage,
  head: () => ({
    meta: [
      { title: "Welcome — Vyas Finance Portal" },
      { name: "description", content: "Sign in to Vyas Finance Admin or Customer Portal." },
    ],
  }),
});

function UnifiedLoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });

  const [accountType, setAccountType] = useState<"admin" | "customer">("admin");
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Sync state if search param mode is passed (e.g., /?mode=admin or /?mode=customer)
  useEffect(() => {
    if (search.mode) {
      setAccountType(search.mode);
    }
  }, [search.mode]);

  // Inline field errors state
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
        toast.success("Welcome to Vyas Finance Admin Portal!");
        navigate({ to: "/dashboard" });
      } else {
        await ApiClient.customerLogin({ identifier: identifier.trim(), password });
        toast.success("Welcome to Vyas Finance Customer Portal!");
        navigate({ to: "/portal/dashboard" });
      }
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please try again.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleSwitchMode = (mode: "admin" | "customer") => {
    setAccountType(mode);
    setIdentifier("");
    setPassword("");
    setErrors({});
  };

  return (
    <div className="min-h-screen w-full bg-muted flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Brand Panel */}
        <div className="hidden md:flex flex-col justify-between rounded-2xl bg-card border border-border p-10 shadow-[var(--shadow-card)] h-full min-h-[540px]">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gold grid place-items-center shadow-[var(--shadow-gold)]">
              <Gem className="h-5 w-5 text-gold-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-foreground">Vyas Finance</p>
              <p className="text-xs text-muted-foreground">Gold Loan Management System</p>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
              {accountType === "admin"
                ? "Manage loans, branch operations & customers."
                : "Track your gold loans, collateral & payments in real-time."}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              {accountType === "admin"
                ? "Unified administrative portal for branch officers, loan evaluations, payments, and automated reminders."
                : "Access your customer profile, view insured gold ornament details, download payment receipts, and submit support tickets."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { k: "Security", v: "Role-Based" },
              { k: "Database", v: "PostgreSQL" },
              { k: "Portal", v: accountType === "admin" ? "Admin Mode" : "Customer Mode" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-muted py-4">
                <p className="text-base font-semibold text-foreground">{s.v}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Login Card */}
        <Card className="p-8 md:p-10 rounded-2xl bg-card border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gold grid place-items-center shadow-[var(--shadow-gold)]">
              <Gem className="h-5 w-5 text-gold-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight">Vyas Finance</p>
              <p className="text-xs text-muted-foreground">Unified Sign In</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-0.5 mb-6">
            Select your account type to log in.
          </p>

          {/* General Error Banner */}
          {errors.general && (
            <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {/* Select Account Type Buttons */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Select Account Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSwitchMode("admin")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    accountType === "admin"
                      ? "border-gold bg-gold/10 font-semibold ring-1 ring-gold shadow-sm"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded-full border grid place-items-center ${accountType === "admin" ? "border-gold bg-gold" : "border-muted-foreground"}`}>
                      {accountType === "admin" && <div className="h-1.5 w-1.5 rounded-full bg-gold-foreground" />}
                    </div>
                    <span className="text-xs font-semibold text-foreground">Admin / Staff</span>
                  </div>
                  <ShieldCheck className={`h-4 w-4 ${accountType === "admin" ? "text-gold" : "text-muted-foreground"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchMode("customer")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    accountType === "customer"
                      ? "border-gold bg-gold/10 font-semibold ring-1 ring-gold shadow-sm"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded-full border grid place-items-center ${accountType === "customer" ? "border-gold bg-gold" : "border-muted-foreground"}`}>
                      {accountType === "customer" && <div className="h-1.5 w-1.5 rounded-full bg-gold-foreground" />}
                    </div>
                    <span className="text-xs font-semibold text-foreground">Customer</span>
                  </div>
                  <UserCheck className={`h-4 w-4 ${accountType === "customer" ? "text-gold" : "text-muted-foreground"}`} />
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-foreground">
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
                    placeholder={accountType === "admin" ? "e.g. admin" : "10-digit number or name@example.com"}
                    className={`pl-10 rounded-xl h-11 border ${
                      errors.identifier
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-border focus-visible:ring-gold"
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-10 rounded-xl h-11 border ${
                      errors.password
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-border focus-visible:ring-gold"
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-11 font-medium shadow-[var(--shadow-gold)] mt-2"
                disabled={loading}
              >
                {loading ? "Signing in..." : `Login as ${accountType === "admin" ? "Admin" : "Customer"}`}
              </Button>
            </div>
          </form>

          {/* Conditional Customer Links */}
          {accountType === "customer" && (
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold">
              <button
                type="button"
                onClick={() => navigate({ to: "/portal/signup" })}
                className="text-gold hover:underline"
              >
                Activate Account
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/portal/forgot-password" })}
                className="text-gold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
