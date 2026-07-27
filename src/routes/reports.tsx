import { createFileRoute } from "@tanstack/react-router";
import { Download, IndianRupee, TrendingUp, Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiClient } from "@/lib/api-client";
import { generatePDFReport } from "@/lib/pdf-generator";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/reports")({
  loader: async () => {
    return ApiClient.getDashboard();
  },
  component: ReportsPage,
  head: () => ({
    meta: [
      { title: "Reports — Vyas Finance" },
      { name: "description", content: "Financial reports and exports." },
    ],
  }),
});

const DATA = [
  { m: "Jul", disbursed: 42, collected: 28 },
  { m: "Aug", disbursed: 55, collected: 34 },
  { m: "Sep", disbursed: 48, collected: 40 },
  { m: "Oct", disbursed: 62, collected: 45 },
  { m: "Nov", disbursed: 71, collected: 52 },
  { m: "Dec", disbursed: 84, collected: 60 },
];

function ReportsPage() {
  const dashboardData = Route.useLoaderData();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [reportType, setReportType] = useState<"customers" | "loans" | "payments" | "outstanding" | "overdue">("customers");
  const [exporting, setExporting] = useState(false);

  const CARDS = [
    { k: "Total Disbursed", v: `₹${((dashboardData.todayDisbursed || 0) + 4200000).toLocaleString("en-IN")}`, icon: Wallet },
    { k: "Interest Earned", v: `₹${(dashboardData.interestEarned || 0).toLocaleString("en-IN")}`, icon: TrendingUp },
    { k: "Outstanding Balance", v: `₹${(dashboardData.outstandingBalance || 0).toLocaleString("en-IN")}`, icon: IndianRupee },
    { k: "Active Loans", v: (dashboardData.activeLoans || 0).toString(), icon: CheckCircle2 },
  ];

  const handleExportPDF = async () => {
    setExporting(true);
    const toastId = toast.loading(`Generating ${reportType} report...`);
    try {
      const data = await ApiClient.getReportData(reportType);
      const settings = await ApiClient.getSettings();
      await generatePDFReport(reportType, data, settings);
      toast.success("PDF report downloaded successfully!", { id: toastId });
      setIsExportOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell
      title="Reports"
      subtitle="Business performance overview"
      actions={
        <Button onClick={() => setIsExportOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Download className="h-4 w-4 mr-1.5" /> Export PDF
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.k} className="p-5 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
              <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center">
                <Icon className="h-4 w-4 text-[color:var(--gold)]" />
              </div>
              <p className="text-2xl font-semibold mt-4 text-foreground">{c.v}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.k}</p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-foreground">Disbursed vs Collected</p>
            <p className="text-xs text-muted-foreground">Last 6 months · in Lakhs (₹)</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DATA} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} />
              <Bar dataKey="disbursed" fill="var(--gold)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="collected" fill="var(--success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Export Report Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Export PDF Report</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the data category to generate and download a professional PDF report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Report Category</label>
              <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customers">Customers List</SelectItem>
                  <SelectItem value="loans">Gold Loans List</SelectItem>
                  <SelectItem value="payments">Payments & Collections</SelectItem>
                  <SelectItem value="outstanding">Outstanding Balances</SelectItem>
                  <SelectItem value="overdue">Overdue Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setIsExportOpen(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting} className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)] font-medium">
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                "Export and Download"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
