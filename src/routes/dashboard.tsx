import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Clock,
  IndianRupee,
  Wallet,
  TrendingUp,
  HelpCircle,
  Plus
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
import { ApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    return ApiClient.getDashboard();
  },
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — Vyas Finance" },
      { name: "description", content: "Overview of customers, loans and payments." },
    ],
  }),
});

function DashboardPage() {
  const data = Route.useLoaderData();

  const STATS = [
    {
      label: "Active Loans",
      value: data.activeLoans.toLocaleString("en-IN"),
      change: `Overdue: ${data.overdue}`,
      icon: Wallet,
      tone: "text-[color:var(--gold)]",
    },
    {
      label: "Outstanding Loan Balance",
      value: `₹${data.outstandingBalance.toLocaleString("en-IN")}`,
      change: `Interest Earned: ₹${data.interestEarned.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      tone: "text-foreground",
      tooltip: "Total unpaid loan balance across all active loans.",
    },
    {
      label: "Today's Loans",
      value: `₹${data.todayDisbursed.toLocaleString("en-IN")}`,
      change: "Disbursed Today",
      icon: TrendingUp,
      tone: "text-[color:var(--success)]",
    },
    {
      label: "Today's Collections",
      value: `₹${data.todayCollected.toLocaleString("en-IN")}`,
      change: "Collected Today",
      icon: IndianRupee,
      tone: "text-foreground",
    },
    {
      label: "Due Soon / Overdue",
      value: (data.dueSoon + data.overdue).toLocaleString("en-IN"),
      change: `Due Soon: ${data.dueSoon}`,
      icon: Clock,
      tone: "text-destructive",
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Today's overview of your gold loan business"
      actions={
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Link to="/customers/add" search={{ search: undefined, tab: undefined }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Loan
          </Link>
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 rounded-2xl border-border bg-card shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center">
                  <Icon className={`h-4 w-4 ${s.tone}`} />
                </div>
                {s.tooltip ? (
                  <div className="flex items-center gap-1 cursor-help" title={s.tooltip}>
                    <span className="text-[11px] text-muted-foreground">{s.change}</span>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/75" />
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground">{s.change}</span>
                )}
              </div>
              <p className="text-2xl font-semibold mt-4 tracking-tight text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Chart + Due */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Monthly Loan Disbursed vs Collected</p>
              <p className="text-xs text-muted-foreground">Amount in Lakhs (₹) - Last 6 Months</p>
            </div>
            <Badge variant="secondary" className="bg-muted text-foreground">
              {new Date().getFullYear()}
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="success" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="v" name="Disbursed" stroke="var(--gold)" strokeWidth={2.5} fill="url(#gold)" />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="var(--success)" strokeWidth={2.5} fill="url(#success)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Upcoming Due Loans</p>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {data.upcomingDues.map((d: any) => (
              <li key={d.loan} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center text-xs font-semibold text-foreground">
                  {d.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.loan} · ₹{d.amount.toLocaleString("en-IN")}</p>
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
                  {d.days < 0 ? `${Math.abs(d.days)}d overdue` : `${d.days}d left`}
                </Badge>
              </li>
            ))}
            {data.upcomingDues.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No upcoming dues found.
              </div>
            )}
          </ul>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Recent Loan Disbursements</p>
            <Link to="/loans" className="text-xs text-[color:var(--gold)] hover:underline cursor-pointer">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentLoans.map((r: any) => (
              <div key={r.id} className="py-3 flex items-center gap-3 border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">Active Loan</p>
                </div>
                <p className="text-sm font-semibold text-foreground">₹{r.amount.toLocaleString("en-IN")}</p>
                <Badge
                  className={
                    r.status === "Active" || r.status === "Due Soon"
                      ? "bg-success/15 text-success border-transparent"
                      : r.status === "Overdue"
                      ? "bg-destructive/15 text-destructive border-transparent"
                      : "bg-muted text-muted-foreground border-transparent"
                  }
                >
                  {r.status}
                </Badge>
              </div>
            ))}
            {data.recentLoans.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No recent loans found.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Recent Payments Received</p>
            <Link to="/payments" className="text-xs text-[color:var(--gold)] hover:underline cursor-pointer">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentPayments.map((r: any) => (
              <div key={r.id} className="py-3 flex items-center gap-3 border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{r.cust}</p>
                  <p className="text-xs text-muted-foreground">{r.loan} · {r.mode}</p>
                </div>
                <p className="text-sm font-semibold text-[color:var(--success)]">₹{r.amount.toLocaleString("en-IN")}</p>
              </div>
            ))}
            {data.recentPayments.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No recent payments found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
