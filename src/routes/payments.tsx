import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/payments")({
  loader: async () => {
    const loans = await ApiClient.getLoans();
    // Filter active and overdue loans
    const activeLoans = loans.filter((l) => l.status !== "Closed");
    return { activeLoans };
  },
  component: PaymentsPage,
  head: () => ({
    meta: [
      { title: "Payments — Vyas Finance" },
      { name: "description", content: "Record customer loan payments and view payment history." },
    ],
  }),
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

interface PaymentItem {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  remarks?: string | null;
}

function PaymentsPage() {
  const router = useRouter();
  const { activeLoans } = Route.useLoaderData();
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amt, setAmt] = useState(0);
  const [mode, setMode] = useState("UPI");
  const [remarks, setRemarks] = useState("");

  // Initialize selected loan
  useEffect(() => {
    if (activeLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(activeLoans[0].id);
    }
  }, [activeLoans, selectedLoanId]);

  // Load payment history when selection changes
  useEffect(() => {
    if (selectedLoanId) {
      ApiClient.getPayments(selectedLoanId).then((res) => {
        setPayments(res);
      });
    }
  }, [selectedLoanId]);

  const selectedLoan = activeLoans.find((l) => l.id === selectedLoanId);
  const remainingBalance = selectedLoan?.balance || 0;

  const handleSavePayment = async () => {
    if (!selectedLoanId) {
      toast.error("Please select a loan");
      return;
    }
    if (amt <= 0) {
      toast.error("Amount paid must be greater than zero");
      return;
    }
    if (amt > remainingBalance) {
      toast.error(`Payment amount cannot exceed outstanding loan balance (₹${remainingBalance.toLocaleString("en-IN")})`);
      return;
    }

    if (!confirm(`Are you sure you want to record a payment of ₹${amt.toLocaleString("en-IN")}?`)) {
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving payment record...");

    try {
      await ApiClient.createPayment({
        loanId: selectedLoanId,
        paymentDate: date,
        amount: amt,
        paymentMode: mode,
        remarks: remarks || undefined,
      });

      toast.success("Payment recorded successfully!", { id: toastId });
      
      // Reset input fields
      setAmt(0);
      setRemarks("");

      // Reload payment history and stats
      router.invalidate();
      const res = await ApiClient.getPayments(selectedLoanId);
      setPayments(res);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to record payment", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Payments" subtitle="Record a new payment or view history">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)] h-fit">
          <h3 className="text-base font-semibold text-foreground mb-5">Record Payment</h3>
          <div className="space-y-4">
            <Field label="Loan Number">
              <Select value={selectedLoanId} onValueChange={setSelectedLoanId} disabled={submitting}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select active loan..." />
                </SelectTrigger>
                <SelectContent>
                  {activeLoans.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.loanNumber} · {l.customer?.name || l.cust}
                    </SelectItem>
                  ))}
                  {activeLoans.length === 0 && (
                    <SelectItem value="none" disabled>No active loans</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>
            
            <Field label="Payment Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={submitting} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Amount Paid (₹)">
                <Input type="number" placeholder="0" value={amt || ""} onChange={(e) => setAmt(Number(e.target.value))} disabled={submitting} />
              </Field>
              <Field label="Outstanding Balance (₹)">
                <Input type="text" readOnly value={`₹${remainingBalance.toLocaleString("en-IN")}`} className="bg-muted font-semibold text-destructive" />
              </Field>
            </div>

            <Field label="Payment Mode">
              <Select value={mode} onValueChange={setMode} disabled={submitting}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Receipt Number">
              <Input value="Auto-generated" readOnly className="bg-muted text-xs font-mono" />
            </Field>

            <Field label="Remarks">
              <Textarea rows={2} placeholder="Optional notes" value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={submitting} />
            </Field>

            <Button
              onClick={handleSavePayment}
              disabled={submitting || activeLoans.length === 0}
              className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]"
            >
              {submitting ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Payment History</h3>
              {selectedLoan ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Loan {selectedLoan.loanNumber} · {selectedLoan.customer?.name}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No loan selected</p>
              )}
            </div>
            <Badge className="bg-success/15 text-success border-transparent">
              Balance: ₹{remainingBalance.toLocaleString("en-IN")}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((h) => (
                  <TableRow key={h.receiptNumber} className="hover:bg-muted/40 border-border">
                    <TableCell className="pl-6 text-muted-foreground">{h.paymentDate}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground">{h.receiptNumber}</TableCell>
                    <TableCell className="font-semibold text-foreground">₹{h.amount.toLocaleString("en-IN")}</TableCell>
                    <TableCell><Badge variant="secondary">{h.paymentMode}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{h.remarks || "-"}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive p-0 h-auto font-medium"
                        onClick={async () => {
                          if (confirm(`Reverse Payment ${h.receiptNumber}?\n\nThe payment will be voided and the outstanding balance will be recalculated.`)) {
                            try {
                              await ApiClient.reversePayment(h.receiptNumber);
                              toast.success("Payment reversed successfully!");
                              router.invalidate();
                              const res = await ApiClient.getPayments(selectedLoanId);
                              setPayments(res);
                            } catch (e: any) {
                              toast.error(e.message || "Failed to reverse payment");
                            }
                          }
                        }}
                      >
                        Reverse
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No payments recorded for this loan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
