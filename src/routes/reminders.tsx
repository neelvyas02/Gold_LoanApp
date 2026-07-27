import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, Phone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/reminders")({
  loader: async () => {
    return ApiClient.getReminders();
  },
  component: RemindersPage,
  head: () => ({
    meta: [
      { title: "Reminders — Vyas Finance" },
      { name: "description", content: "Track loans due in the next 10 days and overdue accounts." },
    ],
  }),
});

function tone(days: number) {
  if (days < 0) return "bg-destructive/10 text-destructive"; // Overdue
  if (days <= 1) return "bg-destructive/10 text-destructive"; // 1 day left
  if (days <= 5) return "bg-warning/20 text-[color:var(--warning-foreground)]"; // 5 days left
  return "bg-muted text-muted-foreground"; // 10 days left
}

function label(days: number) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

function RemindersPage() {
  const data = Route.useLoaderData() as any[];
  const [filterTab, setFilterTab] = useState("all");

  const overdueOrOneDay = data.filter((d) => d.days <= 1).length;
  const fiveDays = data.filter((d) => d.days <= 5).length;
  const tenDays = data.length;

  const filteredDues = data.filter((d) => {
    if (filterTab === "1") return d.days <= 1;
    if (filterTab === "5") return d.days <= 5;
    if (filterTab === "10") return d.days <= 10;
    return true;
  });

  return (
    <AppShell title="Reminders" subtitle="Loans due within 10 days">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {[
          { k: "10 Days", v: tenDays, tone: "text-muted-foreground", bg: "bg-muted" },
          { k: "5 Days", v: fiveDays, tone: "text-[color:var(--warning-foreground)]", bg: "bg-warning/20" },
          { k: "1 Day / Overdue", v: overdueOrOneDay, tone: "text-destructive", bg: "bg-destructive/10" },
        ].map((s) => (
          <Card key={s.k} className="p-5 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg grid place-items-center ${s.bg}`}>
                <Bell className={`h-4 w-4 ${s.tone}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{s.v}</p>
                <p className="text-xs text-muted-foreground">Due within {s.k}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Reminders</h3>
          <Tabs value={filterTab} onValueChange={setFilterTab}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="10">10 days</TabsTrigger>
              <TabsTrigger value="5">5 days</TabsTrigger>
              <TabsTrigger value="1">1 day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ul className="divide-y divide-border">
          {filteredDues.map((r) => (
            <li key={r.loan} className="py-4 flex flex-wrap items-center gap-4 border-border">
              <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center text-xs font-semibold text-muted-foreground shrink-0">
                {r.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.loan}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">₹{r.amount.toLocaleString("en-IN")}</p>
              <Badge className={tone(r.days)}>{label(r.days)}</Badge>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-8" asChild>
                  <a href={`tel:${r.phone}`}>
                    <Phone className="h-3.5 w-3.5 mr-1" /> Call
                  </a>
                </Button>
                <Button size="sm" className="h-8 bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => toast.success(`Notification sent to ${r.name}!`)}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Notify
                </Button>
              </div>
            </li>
          ))}
          {filteredDues.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No loans matching this filter are due soon.
            </div>
          )}
        </ul>
      </Card>
    </AppShell>
  );
}
