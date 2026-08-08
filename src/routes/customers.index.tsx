import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
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
import { ApiClient, getFileUrl } from "@/lib/api-client";

export const Route = createFileRoute("/customers/")({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search?.search as string | undefined) || undefined,
    tab: (search?.tab as string | undefined) || "all",
  }),
  loader: async ({ search }: any) => {
    return ApiClient.getCustomers(search?.search, search?.tab);
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
  if (s === "Active") return "bg-[color:var(--success)]/10 text-[color:var(--success)]";
  if (s === "Overdue") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function CustomersIndexPage() {
  const router = useRouter();
  const navigate = useNavigate({ from: Route.fullPath });
  const { search, tab } = Route.useSearch();
  const customers = Route.useLoaderData() as any[];

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
      toast.error("Phone Number must be exactly 10 digits");
      return;
    }
    if (editAlternateMobile && !/^\d{10}$/.test(editAlternateMobile)) {
      toast.error("Alternate Phone must be exactly 10 digits");
      return;
    }
    if (!/^\d{12}$/.test(editAadhaar)) {
      toast.error("Aadhaar Number must be exactly 12 digits");
      return;
    }
    if (editPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(editPan)) {
      toast.error("Invalid PAN format (expected ABCDE1234F)");
      return;
    }
    if (editDob) {
      const d = new Date(editDob);
      if (d > new Date()) {
        toast.error("Date of birth cannot be a future date");
        return;
      }
    }
    if (!editOccupation.trim()) {
      toast.error("Occupation is required");
      return;
    }
    if (!editNomineeName.trim()) {
      toast.error("Nominee Name is required");
      return;
    }
    if (!/^\d{10}$/.test(editNomineeMobile)) {
      toast.error("Nominee Phone must be exactly 10 digits");
      return;
    }
    if (!editAddress.trim()) {
      toast.error("Address is required");
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        name: editName,
        phone: editMobile,
        alternatePhone: editAlternateMobile || undefined,
        aadhaar: editAadhaar,
        pan: editPan || undefined,
        dob: editDob || undefined,
        occupation: editOccupation,
        nomineeName: editNomineeName,
        nomineePhone: editNomineeMobile,
        address: editAddress,
      };

      await ApiClient.updateCustomer(activeCustomer.id, payload);
      toast.success("Customer details updated successfully");
      
      // Reload details and list
      const updatedData = await ApiClient.getCustomer(activeCustomer.id);
      setActiveCustomer(updatedData);
      setSheetMode("view");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update customer");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AppShell
      title="Customers"
      subtitle={`${customers.length} total customers`}
      actions={
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
          <Link to="/customers/add" search={{ search: undefined, tab: undefined }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Customer
          </Link>
        </Button>
      }
    >
      <Card className="p-4 md:p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, loan number…"
              className="pl-9 h-10 bg-muted/50 border-transparent focus-visible:bg-transparent"
              value={search || ""}
              onChange={(e) =>
                navigate({
                  search: (old) => ({ ...old, search: e.target.value || undefined }),
                })
              }
            />
          </div>
          <Tabs
            value={tab}
            onValueChange={(val) =>
              navigate({
                search: (old) => ({ ...old, tab: val }),
              })
            }
          >
            <TabsList className="bg-muted">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto -mx-4 md:-mx-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="pl-4 md:pl-6">Customer No.</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Loan Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4 md:pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((r) => {
                // Determine active status: active if any active/overdue loan exists
                const activeLoans = r.loans?.filter((l: any) => l.status !== "Closed") || [];
                const isOverdue = activeLoans.some((l: any) => l.status === "Overdue");
                const hasActive = activeLoans.length > 0;
                const status = r.isArchived ? "Archived" : isOverdue ? "Overdue" : hasActive ? "Active" : "Closed";

                return (
                  <TableRow key={r.id} className="hover:bg-muted/40 border-border">
                    <TableCell className="pl-4 md:pl-6 font-mono text-xs">{r.customerNumber}</TableCell>
                    <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.loans?.[0]?.loanNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4 md:pr-6 space-x-1">
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
                          className="text-[color:var(--success)]"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to restore customer ${r.name}?`)) {
                              try {
                                await ApiClient.restoreCustomer(r.id);
                                toast.success("Customer restored successfully!");
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
                          className="text-destructive"
                          onClick={async () => {
                            if (
                              confirm(
                                `Archive Customer ${r.name}?\n\nThis customer will be hidden from the active list but their records will be preserved.`
                              )
                            ) {
                              try {
                                await ApiClient.archiveCustomer(r.id);
                                toast.success("Customer archived successfully!");
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
                    </TableCell>
                  </TableRow>
                );
              })}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
    </AppShell>
  );
}
