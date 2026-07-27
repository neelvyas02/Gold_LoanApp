import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClient } from "@/lib/api-client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  loader: async () => {
    return ApiClient.getSettings();
  },
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Vyas Finance" },
      { name: "description", content: "Company, branch and system preferences." },
    ],
  }),
});

function SettingsPage() {
  const router = useRouter();
  const initialSettings = Route.useLoaderData();
  
  // States
  const [companyName, setCompanyName] = useState(initialSettings.companyName || "Vyas Finance");
  const [contactNumber, setContactNumber] = useState(initialSettings.contactNumber || "");
  const [companyAddress, setCompanyAddress] = useState(initialSettings.companyAddress || "");
  const [defaultInterestRate, setDefaultInterestRate] = useState(initialSettings.defaultInterestRate || 12.0);
  const [defaultGoldRate, setDefaultGoldRate] = useState(initialSettings.defaultGoldRate || 6000.0);
  const [reminderDays, setReminderDays] = useState(initialSettings.reminderDays || 10);
  const [loanPrefix, setLoanPrefix] = useState(initialSettings.loanPrefix || "GL");
  const [receiptPrefix, setReceiptPrefix] = useState(initialSettings.receiptPrefix || "RCPT");
  
  const [submitting, setSubmitting] = useState(false);

  const handleSaveChanges = async () => {
    setSubmitting(true);
    const toastId = toast.loading("Saving settings...");
    try {
      await ApiClient.updateSettings({
        companyName,
        contactNumber,
        companyAddress,
        defaultInterestRate: Number(defaultInterestRate),
        defaultGoldRate: Number(defaultGoldRate),
        reminderDays: Number(reminderDays),
        loanPrefix,
        receiptPrefix,
        theme: initialSettings.theme || "light",
      });
      toast.success("Settings saved successfully!", { id: toastId });
      router.invalidate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save settings", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Manage your branch configurations and system defaults">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
          <h3 className="text-base font-semibold text-foreground mb-5">Company Profile</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground">Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground">Contact Number</Label>
              <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground">Address</Label>
              <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} disabled={submitting} />
            </div>
            <Button onClick={handleSaveChanges} disabled={submitting} className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)] mt-2">
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
          <h3 className="text-base font-semibold text-foreground mb-5">System Defaults & Parameters</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground">Default Interest Rate (% p.a.)</Label>
                <Input type="number" step="0.1" value={defaultInterestRate} onChange={(e) => setDefaultInterestRate(Number(e.target.value))} disabled={submitting} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground">Default Gold Rate (₹/g)</Label>
                <Input type="number" value={defaultGoldRate} onChange={(e) => setDefaultGoldRate(Number(e.target.value))} disabled={submitting} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground">Reminder Days (Alert window)</Label>
              <Input type="number" value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))} disabled={submitting} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground">Loan Number Prefix</Label>
                <Input value={loanPrefix} onChange={(e) => setLoanPrefix(e.target.value)} disabled={submitting} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground">Receipt Number Prefix</Label>
                <Input value={receiptPrefix} onChange={(e) => setReceiptPrefix(e.target.value)} disabled={submitting} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
