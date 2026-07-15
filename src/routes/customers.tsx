import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
  head: () => ({
    meta: [
      { title: "Customers — GoldVault" },
      { name: "description", content: "Browse and manage your gold loan customers." },
    ],
  }),
});

const ROWS = [
  { id: "CUST-1042", name: "Priya Nair", mobile: "+91 98456 12034", loan: "GV-2041", status: "Active" },
  { id: "CUST-1041", name: "Anand Kumar", mobile: "+91 90876 55123", loan: "GV-2040", status: "Active" },
  { id: "CUST-1040", name: "Sneha Reddy", mobile: "+91 97456 88900", loan: "GV-2039", status: "Overdue" },
  { id: "CUST-1039", name: "Vikram Shetty", mobile: "+91 91234 76512", loan: "GV-2038", status: "Active" },
  { id: "CUST-1038", name: "Meera Iyer", mobile: "+91 99887 34211", loan: "GV-2037", status: "Closed" },
  { id: "CUST-1037", name: "Rahul Das", mobile: "+91 98123 44567", loan: "GV-2036", status: "Active" },
  { id: "CUST-1036", name: "Kavita Sharma", mobile: "+91 90000 12345", loan: "GV-2035", status: "Overdue" },
  { id: "CUST-1035", name: "Suresh Pillai", mobile: "+91 94847 66700", loan: "GV-2034", status: "Closed" },
];

function statusBadge(status: string) {
  if (status === "Active")
    return "bg-[color:var(--success)]/10 text-[color:var(--success)] hover:bg-[color:var(--success)]/10";
  if (status === "Overdue")
    return "bg-destructive/10 text-destructive hover:bg-destructive/10";
  return "bg-muted text-muted-foreground hover:bg-muted";
}

function CustomersPage() {
  return (
    <AppShell
      title="Customers"
      subtitle="1,240 total customers"
      actions={
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Link to="/customers/add">
            <Plus className="h-4 w-4 mr-1.5" /> Add Customer
          </Link>
        </Button>
      }
    >
      <Card className="p-4 md:p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, loan number…"
              className="pl-9 h-10 bg-[color:var(--muted)] border-transparent focus-visible:bg-white"
            />
          </div>
          <Tabs defaultValue="all">
            <TabsList className="bg-[color:var(--muted)]">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="h-10">
            <Filter className="h-4 w-4 mr-1.5" /> Filters
          </Button>
        </div>

        <div className="overflow-x-auto -mx-4 md:-mx-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 md:pl-6">Customer ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Loan Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4 md:pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((r) => (
                <TableRow key={r.id} className="hover:bg-[color:var(--muted)]/60">
                  <TableCell className="pl-4 md:pl-6 font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.mobile}</TableCell>
                  <TableCell className="font-mono text-xs">{r.loan}</TableCell>
                  <TableCell>
                    <Badge className={statusBadge(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4 md:pr-6">
                    <Button variant="ghost" size="sm" className="text-[color:var(--gold)]">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">Edit</Button>
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
