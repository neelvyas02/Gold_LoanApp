import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — GoldVault" },
      { name: "description", content: "Overview of customers, loans and payments." },
    ],
  }),
});

const STATS = [
  { label: "Total Customers", value: "1,240", change: "+3.4%", icon: Users, tone: "text-foreground" },
  { label: "Active Loans", value: "312", change: "+1.2%", icon: Wallet, tone: "text-[color:var(--gold)]" },
  { label: "Closed Loans", value: "918", change: "+5.1%", icon: CheckCircle2, tone: "text-[color:var(--success)]" },
  { label: "Total Loan Amount", value: "₹4.2Cr", change: "+2.8%", icon: IndianRupee, tone: "text-foreground" },
  { label: "Due in 10 Days", value: "24", change: "Attention", icon: Clock, tone: "text-destructive" },
];

const CHART = [
  { m: "Jan", v: 24 }, { m: "Feb", v: 32 }, { m: "Mar", v: 28 },
  { m: "Apr", v: 41 }, { m: "May", v: 38 }, { m: "Jun", v: 52 },
  { m: "Jul", v: 47 }, { m: "Aug", v: 61 }, { m: "Sep", v: 55 },
  { m: "Oct", v: 68 }, { m: "Nov", v: 72 }, { m: "Dec", v: 84 },
];

const RECENT_APPS = [
  { id: "GV-2041", name: "Priya Nair", amount: "₹1,20,000", status: "Approved" },
  { id: "GV-2040", name: "Anand Kumar", amount: "₹85,000", status: "Pending" },
  { id: "GV-2039", name: "Sneha Reddy", amount: "₹2,10,000", status: "Approved" },
  { id: "GV-2038", name: "Vikram Shetty", amount: "₹55,000", status: "Review" },
];

const RECENT_PAY = [
  { id: "RCPT-8821", name: "Meera Iyer", amount: "₹12,500", mode: "UPI" },
  { id: "RCPT-8820", name: "Rahul Das", amount: "₹8,200", mode: "Cash" },
  { id: "RCPT-8819", name: "Kavita Sharma", amount: "₹15,000", mode: "Bank" },
  { id: "RCPT-8818", name: "Suresh Pillai", amount: "₹6,750", mode: "UPI" },
];

const DUE = [
  { name: "Arjun Rao", loan: "GV-1982", days: 1, amount: "₹42,000" },
  { name: "Divya Menon", loan: "GV-1975", days: 3, amount: "₹18,500" },
  { name: "Naveen K", loan: "GV-1968", days: 6, amount: "₹64,300" },
  { name: "Lakshmi P", loan: "GV-1961", days: 9, amount: "₹27,800" },
];

function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Today's overview of your gold loan business"
      actions={
        <Button className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          New Loan
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 rounded-2xl border-border/70 shadow-[var(--shadow-soft)] bg-white">
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-[color:var(--muted)] grid place-items-center">
                  <Icon className={`h-4 w-4 ${s.tone}`} />
                </div>
                <span className="text-[11px] text-muted-foreground">{s.change}</span>
              </div>
              <p className="text-2xl font-semibold mt-4 tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Chart + Due */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">Monthly Loan Disbursed</p>
              <p className="text-xs text-muted-foreground">Amount in Lakhs (₹)</p>
            </div>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              2025
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="v" stroke="var(--gold)" strokeWidth={2.5} fill="url(#gold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Upcoming Due Loans</p>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {DUE.map((d) => (
              <li key={d.loan} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[color:var(--muted)] grid place-items-center text-xs font-semibold">
                  {d.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.loan} · {d.amount}</p>
                </div>
                <Badge
                  className={
                    d.days <= 1
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
                      : d.days <= 5
                      ? "bg-warning/20 text-[color:var(--warning-foreground)] hover:bg-warning/20"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }
                >
                  {d.days}d
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Recent Loan Applications</p>
            <a className="text-xs text-[color:var(--gold)] hover:underline cursor-pointer">View all</a>
          </div>
          <div className="divide-y divide-border">
            {RECENT_APPS.map((r) => (
              <div key={r.id} className="py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.id}</p>
                </div>
                <p className="text-sm font-semibold">{r.amount}</p>
                <Badge
                  variant="secondary"
                  className={
                    r.status === "Approved"
                      ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                      : r.status === "Pending"
                      ? "bg-warning/20 text-[color:var(--warning-foreground)]"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Recent Payments</p>
            <a className="text-xs text-[color:var(--gold)] hover:underline cursor-pointer">View all</a>
          </div>
          <div className="divide-y divide-border">
            {RECENT_PAY.map((r) => (
              <div key={r.id} className="py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.id} · {r.mode}</p>
                </div>
                <p className="text-sm font-semibold text-[color:var(--success)]">{r.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
