import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — GoldVault" },
      { name: "description", content: "Company, branch and notification preferences." },
    ],
  }),
});

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Manage your company and preferences">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          <h3 className="text-base font-semibold mb-5">Company Profile</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Company Name</Label>
              <Input defaultValue="GoldVault Finance Pvt. Ltd." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contact</Label>
                <Input defaultValue="+91 98450 00000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input defaultValue="hello@goldvault.in" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input defaultValue="MG Road, Bengaluru, KA 560001" />
            </div>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">Save Changes</Button>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          <h3 className="text-base font-semibold mb-2">Preferences</h3>
          <Separator className="my-2" />
          <Row label="SMS Reminders" hint="Send SMS 10, 5 and 1 day before due">
            <Switch defaultChecked />
          </Row>
          <Separator />
          <Row label="Email Notifications" hint="Daily summary at 8:00 AM">
            <Switch defaultChecked />
          </Row>
          <Separator />
          <Row label="Auto Interest Calculation" hint="Compute interest on loan save">
            <Switch defaultChecked />
          </Row>
          <Separator />
          <Row label="Overdue Alerts" hint="Flag loans past maturity date">
            <Switch defaultChecked />
          </Row>
        </Card>
      </div>
    </AppShell>
  );
}
