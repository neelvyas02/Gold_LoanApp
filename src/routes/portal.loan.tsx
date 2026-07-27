import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { downloadLoanAgreementPDF } from "@/lib/pdf-generator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Calendar, 
  Percent, 
  Coins, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  FileDown, 
  Grid,
  Image as ImageIcon,
  Loader2,
  X
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/loan")({
  component: CustomerLoansPage,
});

function CustomerLoansPage() {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchLoansData();
  }, []);

  const fetchLoansData = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getPortalLoans();
      setLoans(data || []);

      const custProfile = await ApiClient.getPortalProfile();
      setProfile(custProfile);

      const appSettings = await ApiClient.getSettings();
      setSettings(appSettings);
    } catch (error) {
      toast.error("Failed to load loan details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAgreement = (loan: any) => {
    if (!profile) {
      toast.error("Profile data not loaded yet.");
      return;
    }
    try {
      downloadLoanAgreementPDF(loan, profile, settings);
      toast.success("Loan Agreement PDF downloaded successfully!");
    } catch (e) {
      toast.error("Failed to generate agreement PDF.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto space-y-4">
        <div className="h-16 w-16 bg-muted rounded-full grid place-items-center mx-auto text-muted-foreground">
          <Shield className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Loans Found</h2>
        <p className="text-sm text-muted-foreground">
          You do not have any active or closed gold loans registered under your account. Please contact your Vyas Finance branch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">My Loans</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View details of your pledged gold collateral, timelines, and financial summaries.
        </p>
      </div>

      {loans.map((loan) => {
        const principal = loan.loanAmount || 0;
        const interest = loan.totalInterest || 0;
        const totalPayable = principal + interest;
        const totalPaid = loan.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const remainingBalance = Math.max(totalPayable - totalPaid, 0);

        const progressPercent = totalPayable > 0 
          ? Math.min(Math.round((totalPaid / totalPayable) * 100), 100) 
          : 0;

        // Timeline status logic
        const steps = [
          { label: "Loan Created", active: true, done: true },
          { label: "Gold Verified", active: true, done: true },
          { label: "Loan Disbursed", active: true, done: true },
          { 
            label: "Payments", 
            active: loan.status === "Active" || loan.status === "Due Soon" || loan.status === "Overdue" || loan.status === "Closed",
            done: loan.payments?.length > 0 || loan.status === "Closed"
          },
          { label: "Loan Closed", active: loan.status === "Closed", done: loan.status === "Closed" },
        ];

        return (
          <div key={loan.id} className="space-y-6 border-b border-border pb-8 last:border-0 last:pb-0">
            {/* Top Bar for Loan */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Loan Number</span>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {loan.loanNumber}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    loan.status === "Closed" 
                      ? "bg-success/15 text-success" 
                      : loan.status === "Overdue" 
                      ? "bg-destructive/15 text-destructive"
                      : "bg-gold/15 text-gold"
                  }`}>
                    {loan.status}
                  </span>
                </h3>
              </div>
              <Button
                variant="outline"
                onClick={() => handleDownloadAgreement(loan)}
                className="rounded-xl border-gold text-gold hover:bg-gold/5 text-xs h-9 gap-1.5 self-start sm:self-center"
              >
                <FileDown className="h-4 w-4" />
                Download Agreement
              </Button>
            </div>

            {/* Repayment Progress */}
            <Card className="p-5 border-border rounded-2xl bg-card shadow-[var(--shadow-card)]">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Repayment Progress</span>
                  <p className="text-sm font-bold text-foreground">
                    Paid ₹{totalPaid.toLocaleString("en-IN")} of ₹{totalPayable.toLocaleString("en-IN")}
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

            {/* Timetable/Milestone Line */}
            <div className="py-6 overflow-x-auto">
              <div className="flex items-center min-w-[600px] justify-between relative px-8">
                {/* Horizontal line */}
                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-muted -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-8 h-0.5 bg-gold -translate-y-1/2 z-0 transition-all duration-500" 
                  style={{ 
                    width: `${
                      loan.status === "Closed" ? 100 : loan.payments?.length > 0 ? 75 : 50
                    }%` 
                  }}
                />

                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center relative z-10 space-y-2">
                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                      step.done 
                        ? "bg-gold border-gold text-gold-foreground" 
                        : step.active
                        ? "bg-background border-gold text-gold"
                        : "bg-background border-muted text-muted-foreground"
                    }`}>
                      {step.done ? <CheckCircle2 className="h-4.5 w-4.5" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      step.active ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Loan Amount", val: loan.loanAmount, icon: Coins },
                { label: "Interest Rate", val: `${loan.interestRate}% p.a.`, icon: Percent },
                { label: "Loan Date", val: loan.loanDate, icon: Calendar },
                { label: "Closing Date", val: loan.loanClosingDate, icon: Clock },
                { label: "Total Interest", val: loan.totalInterest, icon: TrendingUp },
                { label: "Total Payable", val: totalPayable, icon: Coins },
                { label: "Total Paid", val: totalPaid, icon: CheckCircle2 },
                { label: "Remaining Balance", val: remainingBalance, icon: TrendingUp, highlight: true },
              ].map((item: any, i) => (
                <Card 
                  key={i} 
                  className={`p-4 border-border rounded-xl bg-card shadow-[var(--shadow-card)] flex items-center gap-3 ${
                    item.highlight ? "border-l-4 border-l-gold bg-gold/5" : ""
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg grid place-items-center ${
                    item.highlight ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
                  }`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">{item.label}</span>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {typeof item.val === "number" ? `₹${item.val.toLocaleString("en-IN")}` : item.val}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Gold Ornaments / Collaterals */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Grid className="h-4.5 w-4.5 text-gold" />
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">Pledged Gold Ornaments</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(loan.ornaments || []).map((o: any, idx: number) => (
                  <Card key={o.id} className="p-4 border-border bg-card rounded-xl shadow-[var(--shadow-card)] space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Ornament #{idx + 1}</span>
                        <h5 className="text-xs font-bold text-foreground">
                          {o.category === "Other" ? (o.customOrnamentName || "Other Item") : o.category}
                        </h5>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gold/15 text-gold rounded">
                        {o.purity}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-muted/40 py-2 rounded-lg">
                        <p className="text-[10px] text-muted-foreground font-medium">Gross Wt</p>
                        <p className="font-bold text-foreground mt-0.5">{o.grossWeight}g</p>
                      </div>
                      <div className="bg-muted/40 py-2 rounded-lg">
                        <p className="text-[10px] text-muted-foreground font-medium">Net Wt</p>
                        <p className="font-bold text-foreground mt-0.5">{o.netWeight}g</p>
                      </div>
                      <div className="bg-muted/40 py-2 rounded-lg">
                        <p className="text-[10px] text-muted-foreground font-medium">Est Value</p>
                        <p className="font-bold text-foreground mt-0.5">₹{o.estimatedValue.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {/* Collateral Photos */}
                    {o.photos?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> Collateral Photos
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {o.photos.map((p: any) => (
                            <div 
                              key={p.id}
                              onClick={() => setLightboxPhoto(`http://localhost:5000${p.filePath}`)}
                              className="h-12 w-12 rounded-lg overflow-hidden border border-border cursor-pointer hover:border-gold hover:shadow transition-all relative group"
                            >
                              <img 
                                src={`http://localhost:5000${p.filePath}`} 
                                alt="Gold ornament" 
                                className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

          </div>
        );
      })}

      {/* Lightbox Overlay */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl">
            <button 
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/75 z-10 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <img 
              src={lightboxPhoto} 
              alt="Ornament Lightbox" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
