import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { downloadReceiptPDF } from "@/lib/pdf-generator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Download, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  Filter,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/payments")({
  component: CustomerPaymentsPage,
});

function CustomerPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getPortalPayments();
      setPayments(data || []);

      const appSettings = await ApiClient.getSettings();
      setSettings(appSettings);
    } catch (error) {
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (payment: any) => {
    try {
      const mockPayment = {
        ...payment,
        customerName: JSON.parse(localStorage.getItem("user") || "{}").name || "Customer",
      };
      downloadReceiptPDF(mockPayment, settings);
      toast.success("Receipt PDF downloaded successfully!");
    } catch (e) {
      toast.error("Failed to generate receipt PDF.");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesMode = selectedMode === "all" || p.paymentMode.toLowerCase() === selectedMode.toLowerCase();
    return matchesSearch && matchesMode;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Payment History</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View details and download official receipts for all your transactions.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-card border border-border p-4 rounded-2xl shadow-[var(--shadow-card)]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border focus-visible:ring-gold text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="bg-background border border-border text-foreground text-xs rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="all">All Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payments Listing */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <p className="text-xs text-muted-foreground">No matching payments found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-border rounded-2xl bg-card shadow-[var(--shadow-card)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase font-bold">
                  <th className="p-4">Receipt Number</th>
                  <th className="p-4">Loan Number</th>
                  <th className="p-4">Payment Date</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4 text-right">Amount Paid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono font-semibold text-foreground">{p.receiptNumber}</td>
                    <td className="p-4 font-mono text-muted-foreground">{p.loan?.loanNumber}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4 font-medium">{p.paymentMode}</td>
                    <td className="p-4 text-right font-bold text-success">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex text-[9px] px-1.5 py-0.5 bg-success/15 text-success rounded font-semibold">
                        Completed
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-muted text-gold"
                        onClick={() => handleDownloadReceipt(p)}
                        title="Download Receipt"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredPayments.map((p) => (
              <Card key={p.id} className="p-4 border-border bg-card rounded-xl space-y-3.5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Receipt Number</span>
                    <p className="text-xs font-mono font-bold text-foreground">{p.receiptNumber}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-success/15 text-success rounded font-bold">
                    Completed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold">Loan Number</span>
                    <p className="font-mono text-foreground font-medium">{p.loan?.loanNumber}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold">Payment Date</span>
                    <p className="text-foreground font-medium">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold">Payment Mode</span>
                    <p className="text-foreground font-semibold">{p.paymentMode}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold">Amount Paid</span>
                    <p className="text-success font-bold">₹{p.amount.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleDownloadReceipt(p)}
                  className="w-full bg-gold/5 border border-gold/15 text-gold hover:bg-gold/10 text-xs rounded-lg py-2 h-9 flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Download PDF Receipt
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
