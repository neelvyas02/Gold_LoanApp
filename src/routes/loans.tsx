import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/loans")({
  loader: async () => {
    return ApiClient.getLoans();
  },
  component: LoansPage,
  head: () => ({
    meta: [
      { title: "Loans — Vyas Finance" },
      { name: "description", content: "All active, closed and overdue gold loans." },
    ],
  }),
});

function statusBadge(s: string) {
  if (s === "Active") return "bg-[color:var(--success)]/10 text-[color:var(--success)]";
  if (s === "Due Soon") return "bg-warning/20 text-[color:var(--warning-foreground)]";
  if (s === "Overdue") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

interface LoanItem {
  id: string;
  loanNumber: string;
  customer?: { name: string };
  loanAmount: number;
  interestRate: number;
  loanDate: string;
  maturityDate: string;
  balance: number;
  status: string;
}

function LoansPage() {
  const router = useRouter();
  const loans = Route.useLoaderData() as LoanItem[];

  return (
    <AppShell
      title="Loans"
      subtitle="Manage all gold loans across your branch"
      actions={
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Link to="/customers/add" search={{ search: undefined, tab: undefined }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Loan
          </Link>
        </Button>
      }
    >
      <Card className="rounded-2xl bg-card border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="pl-6">Loan No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Loan Date</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((l) => (
                <TableRow key={l.id} className="hover:bg-muted/40 border-border">
                  <TableCell className="pl-6 font-mono text-xs text-foreground">{l.loanNumber}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {l.customer?.name || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">₹{l.loanAmount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="font-semibold text-destructive">₹{l.balance.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-muted-foreground">{l.interestRate}% p.a.</TableCell>
                  <TableCell className="text-muted-foreground">{l.loanDate}</TableCell>
                  <TableCell className="text-muted-foreground">{l.maturityDate}</TableCell>
                  <TableCell><Badge className={statusBadge(l.status)}>{l.status}</Badge></TableCell>
                  <TableCell className="text-right pr-6">
                    {l.status !== "Closed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive ml-2"
                        onClick={async () => {
                          if (l.balance > 0.01) {
                            toast.error(
                              `Cannot close loan. Outstanding balance is ₹${l.balance.toLocaleString(
                                "en-IN"
                              )}. Must be zero. Please record a payment to settle.`
                            );
                            return;
                          }
                          if (confirm(`Are you sure you want to close loan ${l.loanNumber}?`)) {
                            try {
                              await ApiClient.closeLoan(l.id);
                              toast.success("Loan closed successfully!");
                              router.invalidate();
                            } catch (e: any) {
                              toast.error(e.message || "Failed to close loan");
                            }
                          }
                        }}
                      >
                        Close
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {loans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No loans found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppShell>
  );
}
