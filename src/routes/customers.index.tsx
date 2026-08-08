import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Plus, Search, Filter, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiClient, getFileUrl } from "@/lib/api-client";

export const Route = createFileRoute("/customers/")({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search?.search as string | undefined) || undefined,
    tab: (search?.tab as string | undefined) || "all",
  }),
  loaderDeps: ({ search: { search, tab } }) => ({ search, tab }),
  loader: async ({ deps: { search, tab } }: any) => {
    return ApiClient.getCustomers(search, tab);
  },
  component: CustomersIndexPage,
  head: () => ({
    meta: [
      { title: "Customers — Vyas Finance" },
      { name: "description", content: "Manage branch customers and records." },
    ],
  }),
});

function statusBadge(s: string) {
  if (s === "Active") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold";
  if (s === "Due Soon") return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold";
  if (s === "Overdue") return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold";
  if (s === "Archived") return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 font-semibold";
  if (s === "Closed") return "bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/30 font-semibold";
  return "bg-muted text-muted-foreground font-semibold";
}

function getDisplayStatus(r: any): "Active" | "Due Soon" | "Overdue" | "Closed" | "Archived" {
  if (r.isArchived) {
    return "Archived";
  }
  const activeLoans = r.loans?.filter((l: any) => l.status !== "Closed") || [];
  if (activeLoans.some((l: any) => l.status === "Overdue")) {
    return "Overdue";
  }
  if (activeLoans.some((l: any) => l.status === "Due Soon")) {
    return "Due Soon";
  }
  if (activeLoans.length > 0) {
    return "Active";
  }
  const allClosed = r.loans && r.loans.length > 0 && r.loans.every((l: any) => l.status === "Closed");
  if (allClosed) {
    return "Closed";
  }
  return "Active";
}

function CustomersIndexPage() {
  const router = useRouter();
  const navigate = useNavigate({ from: Route.fullPath });
  const { search, tab } = Route.useSearch();
  const customers = (Route.useLoaderData() as any[]) || [];

  // Filter Counts
  const allCount = customers.length;
  const activeCount = customers.filter(c => !c.isArchived && c.loans?.some((l: any) => ["Active", "Due Soon", "Overdue"].includes(l.status))).length;
  const archivedCount = customers.filter(c => c.isArchived || (c.loans && c.loans.length > 0 && c.loans.every((l: any) => l.status === "Closed"))).length;

  // Detail Sheet States
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);

  // Edit fields states
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAlternateMobile, setEditAlternateMobile] = useState("");
  const [editAadhaar, setEditAadhaar] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editNomineeName, setEditNomineeName] = useState("");
  const [editNomineeMobile, setEditNomineeMobile] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Permanent Delete Modal States
  const [deleteModalCustomer, setDeleteModalCustomer] = useState<any | null>(null);
  const [confirmCustomerNoInput, setConfirmCustomerNoInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePermanentDelete = async () => {
    if (!deleteModalCustomer) return;
    if (confirmCustomerNoInput.trim() !== deleteModalCustomer.customerNumber) {
      toast.error(`Please type "${deleteModalCustomer.customerNumber}" exactly to confirm.`);
      return;
    }

    setIsDeleting(true);
    try {
      await ApiClient.deleteCustomerPermanently(deleteModalCustomer.id);
      toast.success("Customer permanently deleted successfully.");
      setDeleteModalCustomer(null);
      setConfirmCustomerNoInput("");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to permanently delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenSheet = async (id: string, mode: "view" | "edit") => {
    setIsSheetOpen(true);
    setSheetMode(mode);
    setLoadingDetails(true);
    try {
      const data = await ApiClient.getCustomer(id);
      setActiveCustomer(data);
      // populate edit states
      setEditName(data.name || "");
      setEditMobile(data.phone || "");
      setEditAlternateMobile(data.alternatePhone || "");
      setEditAadhaar(data.aadhaar || "");
      setEditPan(data.pan || "");
      setEditDob(data.dob || "");
      setEditOccupation(data.occupation || "");
      setEditNomineeName(data.nomineeName || "");
      setEditNomineeMobile(data.nomineePhone || "");
      setEditAddress(data.address || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch customer details");
      setIsSheetOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editName.trim() || editName.trim().length < 3) {
      toast.error("Full Name must be at least 3 characters");
      return;
    }
    if (!/^\d{10}$/.test(editMobile)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    if (editAlternateMobile && !/^\d{10}$/.test(editAlternateMobile)) {
      toast.error("Alternate Mobile must be exactly 10 digits");
      return;
    }

    setSavingEdit(true);
    try {
      await ApiClient.updateCustomer(activeCustomer.id, {
        name: editName,
        phone: editMobile,
        alternatePhone: editAlternateMobile || undefined,
        aadhaar: editAadhaar,
        pan: editPan,
        dob: editDob || undefined,
        occupation: editOccupation,
        nomineeName: editNomineeName,
        nomineePhone: editNomineeMobile,
        address: editAddress,
      });

      toast.success("Customer details updated successfully");
      router.invalidate();
      setIsSheetOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update customer details");
    } finally {
      setSavingEdit(false);
    }
  };

  const activeTabValue = tab || "all";

  return (
    <AppShell
      title="Customers"
      subtitle={`${allCount} total customer records`}
      actions={
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Link to="/customers/add" search={{ search: undefined, tab: undefined }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Customer
          </Link>
        </Button>
      }
    >
      <Card className="p-4 md:p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)] space-y-4">
        {/* Top Control Bar: Search & Smooth Aligned Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-2 border-b border-border/60">
          {/* Search Input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, loan number…"
              className="pl-10 h-10 rounded-xl bg-muted/40 border-border/80 text-sm transition-all focus-visible:bg-background focus-visible:border-gold focus-visible:ring-gold/20"
              value={search || ""}
              onChange={(e) =>
                navigate({
                  search: (old) => ({ ...old, search: e.target.value || undefined }),
                })
              }
            />
          </div>

          {/* Cleanly Aligned Filter Tabs */}
          <Tabs
            value={activeTabValue}
            onValueChange={(val) =>
              navigate({
                search: (old) => ({ ...old, tab: val }),
              })
            }
            className="w-full lg:w-auto overflow-x-auto no-scrollbar"
          >
            <TabsList className="h-10 bg-muted/60 p-1 rounded-xl flex items-center gap-1 w-max min-w-full lg:min-w-0 border border-border/50">
              <TabsTrigger
                value="all"
                className="h-8 rounded-lg px-3.5 text-xs font-semibold transition-all duration-200 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm"
              >
                All {allCount > 0 && `(${allCount})`}
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="h-8 rounded-lg px-3.5 text-xs font-semibold transition-all duration-200 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm"
              >
                Active Loans {activeCount > 0 && `(${activeCount})`}
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="h-8 rounded-lg px-3.5 text-xs font-semibold transition-all duration-200 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm"
              >
                Archived {archivedCount > 0 && `(${archivedCount})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Smooth Transition Animated Content Container */}
        <div
          key={`${activeTabValue}-${search || ""}`}
          className="animate-in fade-in-50 slide-in-from-bottom-1 duration-300 ease-out"
        >
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto -mx-4 md:-mx-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="pl-4 md:pl-6">Customer No.</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Loan Number</TableHead>
                  <TableHead className="text-right">Loan Amount</TableHead>
                  <TableHead className="text-right">Outstanding Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-4 md:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((r) => {
                  const status = getDisplayStatus(r);
                  const primaryLoan = r.loans?.[0];
                  const loanAmount = primaryLoan?.loanAmount || 0;
                  const balance = primaryLoan?.outstandingBalance ?? primaryLoan?.balance ?? 0;

                  return (
                    <TableRow key={r.id} className="hover:bg-muted/40 border-border">
                      <TableCell className="pl-4 md:pl-6 font-mono text-xs text-muted-foreground">{r.customerNumber}</TableCell>
                      <TableCell className="font-semibold text-foreground truncate max-w-[180px]">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{r.phone}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {primaryLoan?.loanNumber || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {primaryLoan ? `₹${loanAmount.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {primaryLoan ? `₹${balance.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={statusBadge(status)}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 md:pr-6 space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[color:var(--gold)]"
                          onClick={() => handleOpenSheet(r.id, "view")}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSheet(r.id, "edit")}
                        >
                          Edit
                        </Button>
                        {r.isArchived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to restore customer ${r.name}?`)) {
                                try {
                                  await ApiClient.restoreCustomer(r.id);
                                  toast.success("Customer restored successfully!");
                                  navigate({ search: (old) => ({ ...old, tab: "all" }) });
                                  router.invalidate();
                                } catch (e: any) {
                                  toast.error(e.message || "Failed to restore customer");
                                }
                              }
                            }}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive cursor-pointer"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Archive Customer ${r.name}?\n\nThis customer will be hidden from active lists but their records will be preserved.`
                                )
                              ) {
                                try {
                                  await ApiClient.archiveCustomer(r.id);
                                  toast.success("Customer archived successfully!");
                                  navigate({ search: (old) => ({ ...old, tab: "archived" }) });
                                  router.invalidate();
                                } catch (e: any) {
                                  toast.error(e.message || "Failed to archive customer");
                                }
                              }
                            }}
                          >
                            Archive
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer font-medium"
                          onClick={() => {
                            setDeleteModalCustomer(r);
                            setConfirmCustomerNoInput("");
                          }}
                        >
                          Delete Permanently
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-medium">
                      {activeTabValue === "archived"
                        ? "No archived records found."
                        : activeTabValue === "active"
                        ? "No active loans found."
                        : activeTabValue === "closed"
                        ? "No closed loans found."
                        : "No customer records found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Responsive Stacked Card View */}
          <div className="block md:hidden space-y-3">
            {customers.map((r) => {
              const status = getDisplayStatus(r);
              const primaryLoan = r.loans?.[0];
              const loanAmount = primaryLoan?.loanAmount || 0;
              const balance = primaryLoan?.outstandingBalance ?? primaryLoan?.balance ?? 0;

              return (
                <Card key={r.id} className="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{r.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{r.customerNumber} · {r.phone}</p>
                    </div>
                    <Badge className={statusBadge(status)}>{status}</Badge>
                  </div>
                  {primaryLoan && (
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 text-xs border border-border/50">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Loan No</span>
                        <span className="font-mono text-foreground font-medium truncate block">{primaryLoan.loanNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Amount</span>
                        <span className="font-mono font-semibold text-foreground">₹{loanAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Balance</span>
                        <span className="font-mono font-semibold text-foreground">₹{balance.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-gold" onClick={() => handleOpenSheet(r.id, "view")}>View</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleOpenSheet(r.id, "edit")}>Edit</Button>
                    {r.isArchived ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-emerald-600 dark:text-emerald-400"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to restore customer ${r.name}?`)) {
                            try {
                              await ApiClient.restoreCustomer(r.id);
                              toast.success("Customer restored successfully!");
                              navigate({ search: (old) => ({ ...old, tab: "all" }) });
                              router.invalidate();
                            } catch (e: any) {
                              toast.error(e.message || "Failed to restore customer");
                            }
                          }
                        }}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive"
                        onClick={async () => {
                          if (confirm(`Archive Customer ${r.name}?`)) {
                            try {
                              await ApiClient.archiveCustomer(r.id);
                              toast.success("Customer archived successfully!");
                              navigate({ search: (old) => ({ ...old, tab: "archived" }) });
                              router.invalidate();
                            } catch (e: any) {
                              toast.error(e.message || "Failed to archive customer");
                            }
                          }
                        }}
                      >
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer font-medium"
                      onClick={() => {
                        setDeleteModalCustomer(r);
                        setConfirmCustomerNoInput("");
                      }}
                    >
                      Delete Permanently
                    </Button>
                  </div>
                </Card>
              );
            })}
            {customers.length === 0 && (
              <div className="text-center py-10 px-4 text-muted-foreground text-sm font-medium bg-muted/20 rounded-xl border border-border/60">
                {activeTabValue === "archived"
                  ? "No archived records found."
                  : activeTabValue === "active"
                  ? "No active loans found."
                  : activeTabValue === "closed"
                  ? "No closed loans found."
                  : "No customer records found."}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Side Sheet Drawer for View / Edit details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md w-full bg-card border-border shadow-2xl p-6 overflow-y-auto">
          {loadingDetails ? (
            <div className="h-full flex flex-col justify-center items-center gap-2">
              <Loader2 className="h-8 w-8 text-gold animate-spin" />
              <p className="text-xs text-muted-foreground">Loading details...</p>
            </div>
          ) : activeCustomer ? (
            <div className="h-full flex flex-col justify-between space-y-4">
              <SheetHeader className="mb-2">
                <SheetTitle className="text-xl font-bold tracking-tight text-foreground">{activeCustomer.name}</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {sheetMode === "view" ? "Detailed customer profile & loan accounts history." : "Update customer registration fields."}
                </SheetDescription>
              </SheetHeader>

              {sheetMode === "view" ? (
                <div className="space-y-6 flex-1 pr-1">
                  {/* Overview details */}
                  <div className="bg-muted/40 p-4 rounded-xl space-y-3.5 border border-border">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Customer Number</span>
                      <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">{activeCustomer.customerNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Phone Number</span>
                      <span className="font-medium text-foreground">{activeCustomer.phone}</span>
                    </div>
                    {activeCustomer.alternatePhone && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Alt Phone</span>
                        <span className="font-medium text-foreground">{activeCustomer.alternatePhone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Aadhaar Card</span>
                      <span className="font-mono text-foreground">{activeCustomer.aadhaar}</span>
                    </div>
                    {activeCustomer.pan && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">PAN Card</span>
                        <span className="font-mono text-foreground">{activeCustomer.pan}</span>
                      </div>
                    )}
                    {activeCustomer.dob && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Date of Birth</span>
                        <span className="font-medium text-foreground">{activeCustomer.dob}</span>
                      </div>
                    )}
                    {activeCustomer.occupation && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Occupation</span>
                        <span className="font-medium text-foreground">{activeCustomer.occupation}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start text-xs">
                      <span className="text-muted-foreground font-medium">Address</span>
                      <span className="font-medium text-right max-w-[200px] text-foreground">{activeCustomer.address}</span>
                    </div>
                  </div>

                  {/* Nominee details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nominee Details</h4>
                    <div className="bg-muted/40 p-4 rounded-xl space-y-3.5 border border-border">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Name</span>
                        <span className="font-medium text-foreground">{activeCustomer.nomineeName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Phone</span>
                        <span className="font-medium text-foreground">{activeCustomer.nomineePhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity Documents</h4>
                    {activeCustomer.documents && activeCustomer.documents.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {activeCustomer.documents.map((doc: any) => (
                          <a
                            key={doc.id}
                            href={getFileUrl(doc.filePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors text-xs font-medium text-foreground"
                          >
                            <div className="h-7 w-7 rounded bg-gold/15 text-gold grid place-items-center font-bold text-[10px]">
                              DOC
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{doc.documentType}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{doc.fileName}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                        No documents uploaded.
                      </div>
                    )}
                  </div>

                  {/* Active Loans */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan Information</h4>
                    {activeCustomer.loans && activeCustomer.loans.length > 0 ? (
                      <div className="space-y-3">
                        {activeCustomer.loans.map((l: any) => (
                          <div key={l.id} className="border border-border p-4 rounded-xl space-y-2 bg-card shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-foreground">{l.loanNumber}</span>
                              <Badge className={l.status === 'Active' ? 'bg-success/10 text-success' : l.status === 'Closed' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}>{l.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <p className="text-muted-foreground">Loan Amount</p>
                                <p className="font-semibold text-foreground">₹{l.loanAmount.toLocaleString("en-IN")}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">ROI</p>
                                <p className="font-semibold text-foreground">{l.interestRate}% p.a.</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Balance</p>
                                <p className="font-semibold text-foreground text-destructive">₹{l.balance.toLocaleString("en-IN")}</p>
                              </div>
                              <div className="col-span-2 border-t border-border pt-1.5 mt-1">
                                <p className="text-muted-foreground">Pledged Ornaments</p>
                                <p className="font-medium text-foreground">
                                  {l.ornaments && l.ornaments.length > 0
                                    ? l.ornaments.map((o: any) => `${o.pieces}x ${o.type} (${o.grossWeight}g)`).join(", ")
                                    : "No ornaments recorded"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                        No loans associated with this customer.
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 border-t border-border flex gap-2">
                    <Button onClick={() => setSheetMode("edit")} className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
                      Edit Customer Info
                    </Button>
                    <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1 pr-1 pb-6">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground">Full Name <span className="text-destructive">*</span></Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">Phone Number <span className="text-destructive">*</span></Label>
                        <Input value={editMobile} onChange={(e) => setEditMobile(e.target.value)} maxLength={10} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">Alternate Phone</Label>
                        <Input value={editAlternateMobile} onChange={(e) => setEditAlternateMobile(e.target.value)} maxLength={10} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">Aadhaar Card <span className="text-destructive">*</span></Label>
                        <Input value={editAadhaar} onChange={(e) => setEditAadhaar(e.target.value)} maxLength={12} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">PAN Card</Label>
                        <Input value={editPan} onChange={(e) => setEditPan(e.target.value.toUpperCase())} maxLength={10} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">Date of Birth</Label>
                        <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">Occupation <span className="text-destructive">*</span></Label>
                        <Input value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 mt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">Nominee Name <span className="text-destructive">*</span></Label>
                        <Input value={editNomineeName} onChange={(e) => setEditNomineeName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground">Nominee Phone <span className="text-destructive">*</span></Label>
                        <Input value={editNomineeMobile} onChange={(e) => setEditNomineeMobile(e.target.value)} maxLength={10} />
                      </div>
                    </div>
                    <div className="space-y-1.5 border-t border-border pt-3">
                      <Label className="text-xs text-foreground">Address <span className="text-destructive">*</span></Label>
                      <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex gap-2">
                    <Button onClick={handleSaveChanges} disabled={savingEdit} className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
                      {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setSheetMode("view")} disabled={savingEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Strong Confirmation Dialog for Permanent Customer Deletion */}
      <Dialog
        open={Boolean(deleteModalCustomer)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteModalCustomer(null);
            setConfirmCustomerNoInput("");
          }
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-rose-500/30 shadow-2xl space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" /> Delete Customer Permanently?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action is <strong className="text-rose-600 dark:text-rose-400">irreversible</strong>. The customer record, loans, ornaments, payments, uploaded documents, and authentication data will be <strong>permanently removed</strong> from the system database.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1.5">
            <p className="font-semibold text-rose-600 dark:text-rose-400">Record to be deleted:</p>
            <p className="text-foreground"><strong>Name:</strong> {deleteModalCustomer?.name}</p>
            <p className="text-foreground"><strong>Customer No:</strong> <code className="font-mono bg-background px-1.5 py-0.5 rounded text-rose-600 font-bold">{deleteModalCustomer?.customerNumber}</code></p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              To confirm, type <span className="font-mono font-bold text-rose-600">{deleteModalCustomer?.customerNumber}</span> below:
            </Label>
            <Input
              value={confirmCustomerNoInput}
              onChange={(e) => setConfirmCustomerNoInput(e.target.value)}
              placeholder={`Type ${deleteModalCustomer?.customerNumber} to confirm`}
              className="font-mono text-sm h-10 border-rose-500/40 focus-visible:ring-rose-500/40"
              disabled={isDeleting}
            />
          </div>

          <DialogFooter className="flex gap-2 justify-end pt-3 border-t border-border/60">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalCustomer(null);
                setConfirmCustomerNoInput("");
              }}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmCustomerNoInput.trim() !== deleteModalCustomer?.customerNumber || isDeleting}
              onClick={handlePermanentDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer font-semibold min-w-[160px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Customer Permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
