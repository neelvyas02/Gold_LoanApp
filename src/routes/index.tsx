import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Gem, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — GoldVault" },
      { name: "description", content: "Sign in to your GoldVault account." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 400);
  }

  return (
    <div className="min-h-screen w-full bg-[color:var(--muted)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Brand panel */}
        <div className="hidden md:flex flex-col justify-between rounded-2xl bg-white p-10 shadow-[var(--shadow-card)] h-full min-h-[520px]">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gold grid place-items-center shadow-[var(--shadow-gold)]">
              <Gem className="h-5 w-5 text-gold-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">GoldVault</p>
              <p className="text-xs text-muted-foreground">Gold Loan Management</p>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
              Trusted software for your gold loan business.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Manage customers, ornaments, loans, payments and reminders — all in one clean,
              lightweight dashboard built for small finance companies.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { k: "Customers", v: "1,240" },
              { k: "Active Loans", v: "312" },
              { k: "Recovered", v: "₹4.2Cr" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-[color:var(--muted)] py-4">
                <p className="text-base font-semibold">{s.v}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <Card className="p-8 md:p-10 rounded-2xl shadow-[var(--shadow-card)] border-border/70">
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gold grid place-items-center">
              <Gem className="h-5 w-5 text-gold-foreground" />
            </div>
            <p className="font-semibold">GoldVault</p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to continue to your dashboard.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" placeholder="admin" className="pl-9 h-11" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox id="remember" defaultChecked />
                Remember me
              </label>
              <a href="#" className="text-sm text-[color:var(--gold)] hover:underline">
                Forgot password?
              </a>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              By continuing you agree to GoldVault's terms of service.
            </p>
          </form>
        </Card>
      </div>
      <Link to="/dashboard" className="sr-only">
        Dashboard
      </Link>
    </div>
  );
}
