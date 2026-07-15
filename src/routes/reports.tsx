import { createFileRoute } from "@tanstack/react-router";
import { Download, IndianRupee, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  head: () => ({
    meta: [
      { title: "Reports — GoldVault" },
      { name: "description", content: "Financial reports and exports." },
    ],
  }),
});

const CARDS = [
  { k: "Total Loan Amount", v: "₹4.2Cr", icon: Wallet },
  { k: "Interest Earned", v: "₹38.4L", icon: TrendingUp },
  { k: "Outstanding Amount", v: "₹1.8Cr", icon: IndianRupee },
  { k: "Closed Loans", v: "918", icon: CheckCircle2 },
];

const DATA = [
  { m: "Jul", disbursed: 42, collected: 28 },
  { m: "Aug", disbursed: 55, collected: 34 },
  { m: "Sep", disbursed: 48, collected: 40 },
  { m: "Oct", disbursed: 62, collected: 45 },
  { m: "Nov", disbursed: 71, collected: 52 },
  { m: "Dec", disbursed: 84, collected: 60 },
];

function ReportsPage() {
  return (
    <AppShell
      title="Reports"
      subtitle="Business performance overview"
      actions={
        <Button className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Download className="h-4 w-4 mr-1.5" /> Export PDF
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.k} className="p-5 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
              <div className="h-9 w-9 rounded-lg bg-[color:var(--muted)] grid place-items-center">
                <Icon className="h-4 w-4 text-[color:var(--gold)]" />
              </div>
              <p className="text-2xl font-semibold mt-4">{c.v}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.k}</p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Disbursed vs Collected</p>
            <p className="text-xs text-muted-foreground">Last 6 months · in Lakhs (₹)</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DATA} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
              <Bar dataKey="disbursed" fill="var(--gold)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="collected" fill="var(--success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppShell>
  );
}
