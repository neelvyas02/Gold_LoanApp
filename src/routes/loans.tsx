import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/loans")({
  component: LoansPage,
  head: () => ({
    meta: [
      { title: "Loans — GoldVault" },
      { name: "description", content: "All active, closed and overdue gold loans." },
    ],
  }),
});

const LOANS = [
  { no: "GV-2041", cust: "Priya Nair", amount: 120000, rate: 12, date: "12 Oct 2025", maturity: "12 Oct 2026", status: "Active" },
  { no: "GV-2040", cust: "Anand Kumar", amount: 85000, rate: 11, date: "08 Oct 2025", maturity: "08 Oct 2026", status: "Active" },
  { no: "GV-2039", cust: "Sneha Reddy", amount: 210000, rate: 13, date: "01 Jun 2025", maturity: "01 Jun 2026", status: "Overdue" },
  { no: "GV-2038", cust: "Vikram Shetty", amount: 55000, rate: 12, date: "22 Sep 2025", maturity: "22 Sep 2026", status: "Active" },
  { no: "GV-2037", cust: "Meera Iyer", amount: 145000, rate: 12, date: "15 Feb 2025", maturity: "15 Feb 2026", status: "Closed" },
  { no: "GV-2036", cust: "Rahul Das", amount: 72000, rate: 11.5, date: "02 Oct 2025", maturity: "02 Oct 2026", status: "Active" },
];

function statusBadge(s: string) {
  if (s === "Active") return "bg-[color:var(--success)]/10 text-[color:var(--success)]";
  if (s === "Overdue") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function LoansPage() {
  return (
    <AppShell
      title="Loans"
      subtitle="Manage all gold loans across your branch"
      actions={
        <Button className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Plus className="h-4 w-4 mr-1.5" /> New Loan
        </Button>
      }
    >
      <Card className="rounded-2xl bg-white shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Loan No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Loan Date</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOANS.map((l) => (
                <TableRow key={l.no} className="hover:bg-[color:var(--muted)]/60">
                  <TableCell className="pl-6 font-mono text-xs">{l.no}</TableCell>
                  <TableCell className="font-medium">{l.cust}</TableCell>
                  <TableCell>₹{l.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>{l.rate}%</TableCell>
                  <TableCell className="text-muted-foreground">{l.date}</TableCell>
                  <TableCell className="text-muted-foreground">{l.maturity}</TableCell>
                  <TableCell><Badge className={statusBadge(l.status)}>{l.status}</Badge></TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="text-[color:var(--gold)]">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppShell>
  );
}
