import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadReceiptPDF } from "@/lib/pdf-generator";
import { 
  Shield, 
  TrendingDown, 
  Calendar, 
  Clock, 
  CreditCard, 
  ArrowUpRight, 
  Download, 
  MessageSquare,
  ChevronRight,
  Loader2,
  Bell
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/dashboard")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getPortalDashboard();
      setMetrics(data);

      const appSettings = await ApiClient.getSettings();
      setSettings(appSettings);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLastReceipt = () => {
    if (!metrics?.lastPayment) {
      toast.info("No payments recorded yet.");
      return;
    }
    try {
      const mockPayment = {
        ...metrics.lastPayment,
        customerName: JSON.parse(localStorage.getItem("user") || "{}").name || "Customer",
      };
      downloadReceiptPDF(mockPayment, settings);
      toast.success("Receipt PDF downloaded successfully!");
    } catch (e) {
      toast.error("Failed to generate receipt PDF.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-28 bg-card border-border border p-5 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2 h-80 bg-card border border-border rounded-2xl" />
          <Card className="h-80 bg-card border border-border rounded-2xl" />
        </div>
      </div>
    );
  }

  const outstanding = metrics?.outstandingBalance || 0;
  const interest = metrics?.interestDue || 0;
  const totalPaidVal = metrics?.totalPaid || 0;
  const totalPayableVal = outstanding + interest + totalPaidVal;
  
  // Calculate progress percentage
  const progressPercent = totalPayableVal > 0 
    ? Math.min(Math.round((totalPaidVal / totalPayableVal) * 100), 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overview of your gold loans, outstanding balance, and recent activities.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Loan */}
        <Card className="bg-card border-border p-5 rounded-2xl shadow-[var(--shadow-card)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Active Loans</span>
            <p className="text-2xl font-bold text-foreground">{metrics?.activeLoanCount || 0}</p>
            <span className="inline-flex items-center text-[10px] text-success font-semibold px-2 py-0.5 bg-success/10 rounded-full">
              {metrics?.activeLoanStatus || "Inactive"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-gold/10 grid place-items-center text-gold">
            <Shield className="h-5 w-5" />
          </div>
        </Card>

        {/* Outstanding Balance */}
        <Card className="bg-card border-border p-5 rounded-2xl shadow-[var(--shadow-card)] flex items-center justify-between border-l-4 border-l-gold">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Outstanding</span>
            <p className="text-2xl font-bold text-foreground">
              ₹{(metrics?.outstandingBalance || 0).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-muted-foreground">Principal remaining</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center text-muted-foreground">
            <TrendingDown className="h-5 w-5" />
          </div>
        </Card>

        {/* Interest Due */}
        <Card className="bg-card border-border p-5 rounded-2xl shadow-[var(--shadow-card)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Interest Due</span>
            <p className="text-2xl font-bold text-foreground">
              ₹{(metrics?.interestDue || 0).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-muted-foreground">Accrued interest</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-gold/10 grid place-items-center text-gold">
            <Clock className="h-5 w-5" />
          </div>
        </Card>

        {/* Loan Closing Date */}
        <Card className="bg-card border-border p-5 rounded-2xl shadow-[var(--shadow-card)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Closing Date</span>
            <p className="text-sm font-bold text-foreground truncate max-w-[140px]">
              {metrics?.loanClosingDate 
                ? new Date(metrics.loanClosingDate).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "No date set"}
            </p>
            <span className="text-[10px] text-destructive font-semibold">
              {metrics?.loanClosingDate ? "Action required before due" : "No active loan"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Repayment Progress Bar */}
      <Card className="p-5 border-border rounded-2xl bg-card shadow-[var(--shadow-card)]">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Repayment Progress</span>
            <p className="text-sm font-bold text-foreground">
              Paid ₹{totalPaidVal.toLocaleString("en-IN")} of ₹{totalPayableVal.toLocaleString("en-IN")}
            </p>
          </div>
          <span className="text-sm font-bold text-gold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gold h-full rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Activity & Payments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border rounded-2xl bg-card shadow-[var(--shadow-card)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-foreground">Last Payment</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gold font-semibold"
                onClick={() => navigate({ to: "/portal/payments" })}
              >
                View History <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>

            {metrics?.lastPayment ? (
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-success/10 text-success grid place-items-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{metrics.lastPayment.receiptNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(metrics.lastPayment.paymentDate).toLocaleDateString("en-IN")} · {metrics.lastPayment.paymentMode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">
                    + ₹{metrics.lastPayment.amount.toLocaleString("en-IN")}
                  </p>
                  <span className="inline-flex text-[9px] px-1.5 py-0.5 bg-success/10 text-success rounded font-semibold mt-0.5">
                    Completed
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl">
                No payments made yet.
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "View Loan", icon: Shield, click: () => navigate({ to: "/portal/loan" }) },
              { label: "Pay History", icon: CreditCard, click: () => navigate({ to: "/portal/payments" }) },
              { label: "Download Receipt", icon: Download, click: handleDownloadLastReceipt },
              { label: "Contact Support", icon: MessageSquare, click: () => navigate({ to: "/portal/support" }) },
            ].map((act, i) => (
              <button
                key={i}
                onClick={act.click}
                className="flex flex-col items-center justify-center p-4 bg-card border border-border hover:border-gold hover:shadow-md rounded-2xl text-center gap-3.5 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-gold/5 text-gold grid place-items-center">
                  <act.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Notifications */}
        <Card className="p-6 border-border rounded-2xl bg-card shadow-[var(--shadow-card)] flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-foreground">Recent Alerts</h3>
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {metrics?.recentNotifications?.length > 0 ? (
              metrics.recentNotifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-xl border border-border transition-colors ${
                    !notif.isRead ? "bg-gold/5 border-gold/10" : "bg-muted/30"
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">{notif.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-pre-wrap leading-normal">
                    {notif.message}
                  </p>
                  <span className="text-[8px] text-muted-foreground/60 block mt-1">
                    {new Date(notif.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No recent notifications.
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
