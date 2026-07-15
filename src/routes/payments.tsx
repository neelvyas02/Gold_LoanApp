import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
  head: () => ({
    meta: [
      { title: "Payments — GoldVault" },
      { name: "description", content: "Record customer loan payments and view payment history." },
    ],
  }),
});

const HIST = [
  { date: "12 Nov 2025", rcpt: "RCPT-8821", amt: 12500, int: 3500, prin: 9000, bal: 96000, mode: "UPI" },
  { date: "12 Oct 2025", rcpt: "RCPT-8798", amt: 12500, int: 3800, prin: 8700, bal: 105000, mode: "Cash" },
  { date: "12 Sep 2025", rcpt: "RCPT-8770", amt: 12500, int: 4100, prin: 8400, bal: 113700, mode: "UPI" },
  { date: "12 Aug 2025", rcpt: "RCPT-8741", amt: 12500, int: 4300, prin: 8200, bal: 122100, mode: "Bank" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function PaymentsPage() {
  return (
    <AppShell title="Payments" subtitle="Record a new payment or view history">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)] h-fit">
          <h3 className="text-base font-semibold mb-5">Record Payment</h3>
          <div className="space-y-4">
            <Field label="Loan Number">
              <Select defaultValue="gv-2041">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gv-2041">GV-2041 · Priya Nair</SelectItem>
                  <SelectItem value="gv-2040">GV-2040 · Anand Kumar</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Payment Date"><Input type="date" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount Paid (₹)"><Input type="number" placeholder="0" /></Field>
              <Field label="Interest Paid (₹)"><Input type="number" placeholder="0" /></Field>
              <Field label="Principal Paid (₹)"><Input type="number" placeholder="0" /></Field>
              <Field label="Remaining (₹)">
                <Input type="number" readOnly value={96000} className="bg-[color:var(--muted)]" />
              </Field>
            </div>
            <Field label="Payment Mode">
              <Select defaultValue="upi">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Receipt Number"><Input value="RCPT-8822" readOnly className="bg-[color:var(--muted)]" /></Field>
            <Field label="Remarks"><Textarea rows={2} placeholder="Optional notes" /></Field>
            <Button className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
              Save Payment
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl bg-white shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Payment History</h3>
              <p className="text-xs text-muted-foreground mt-1">Loan GV-2041 · Priya Nair</p>
            </div>
            <Badge className="bg-[color:var(--success)]/10 text-[color:var(--success)]">
              Balance ₹96,000
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="pr-6">Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HIST.map((h) => (
                  <TableRow key={h.rcpt} className="hover:bg-[color:var(--muted)]/60">
                    <TableCell className="pl-6">{h.date}</TableCell>
                    <TableCell className="font-mono text-xs">{h.rcpt}</TableCell>
                    <TableCell className="font-medium">₹{h.amt.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-muted-foreground">₹{h.int.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-muted-foreground">₹{h.prin.toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{h.bal.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="pr-6"><Badge variant="secondary">{h.mode}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
