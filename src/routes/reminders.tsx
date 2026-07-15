import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, Phone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/reminders")({
  component: RemindersPage,
  head: () => ({
    meta: [
      { title: "Reminders — GoldVault" },
      { name: "description", content: "Track loans due in the next 10 days and overdue accounts." },
    ],
  }),
});

const R = [
  { name: "Arjun Rao", loan: "GV-1982", mobile: "+91 98450 12345", amount: 42000, days: -2, state: "Overdue" },
  { name: "Divya Menon", loan: "GV-1975", mobile: "+91 90876 76543", amount: 18500, days: 1, state: "Due" },
  { name: "Naveen K", loan: "GV-1968", mobile: "+91 91234 23456", amount: 64300, days: 3, state: "Due" },
  { name: "Lakshmi P", loan: "GV-1961", mobile: "+91 99889 87654", amount: 27800, days: 5, state: "Due" },
  { name: "Manish Rao", loan: "GV-1957", mobile: "+91 97890 12233", amount: 88000, days: 8, state: "Due" },
  { name: "Kiran Bhat", loan: "GV-1948", mobile: "+91 98761 55112", amount: 15200, days: 10, state: "Due" },
  { name: "Aditi Roy", loan: "GV-1902", mobile: "+91 90000 33221", amount: 33000, days: -1, state: "Paid" },
];

function tone(state: string, days: number) {
  if (state === "Paid")
    return "bg-[color:var(--success)]/10 text-[color:var(--success)]";
  if (state === "Overdue" || days <= 1)
    return "bg-destructive/10 text-destructive";
  if (days <= 5) return "bg-warning/20 text-[color:var(--warning-foreground)]";
  return "bg-muted text-muted-foreground";
}

function label(state: string, days: number) {
  if (state === "Paid") return "Paid";
  if (state === "Overdue") return `${Math.abs(days)}d overdue`;
  return `${days}d left`;
}

function RemindersPage() {
  return (
    <AppShell title="Reminders" subtitle="Loans due within 10 days">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {[
          { k: "10 Days", v: 24, tone: "text-muted-foreground", bg: "bg-[color:var(--muted)]" },
          { k: "5 Days", v: 11, tone: "text-[color:var(--warning-foreground)]", bg: "bg-warning/20" },
          { k: "1 Day / Overdue", v: 4, tone: "text-destructive", bg: "bg-destructive/10" },
        ].map((s) => (
          <Card key={s.k} className="p-5 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg grid place-items-center ${s.bg}`}>
                <Bell className={`h-4 w-4 ${s.tone}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{s.v}</p>
                <p className="text-xs text-muted-foreground">Due within {s.k}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Reminders</h3>
          <Tabs defaultValue="all">
            <TabsList className="bg-[color:var(--muted)]">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="10">10 days</TabsTrigger>
              <TabsTrigger value="5">5 days</TabsTrigger>
              <TabsTrigger value="1">1 day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ul className="divide-y divide-border">
          {R.map((r) => (
            <li key={r.loan} className="py-4 flex flex-wrap items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[color:var(--muted)] grid place-items-center text-xs font-semibold shrink-0">
                {r.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.loan} · {r.mobile}
                </p>
              </div>
              <p className="text-sm font-semibold">₹{r.amount.toLocaleString("en-IN")}</p>
              <Badge className={tone(r.state, r.days)}>{label(r.state, r.days)}</Badge>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-8">
                  <Phone className="h-3.5 w-3.5 mr-1" /> Call
                </Button>
                <Button size="sm" className="h-8 bg-gold text-gold-foreground hover:bg-gold/90">
                  <Check className="h-3.5 w-3.5 mr-1" /> Notify
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
