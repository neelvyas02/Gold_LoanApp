import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  KeyRound, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Globe,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/settings")({
  component: CustomerSettingsPage,
});

function CustomerSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Preference States
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [dueReminders, setDueReminders] = useState(true);
  const [language, setLanguage] = useState("en-IN");

  useEffect(() => {
    // Read theme from documentElement classes or localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);

    // Read preferences
    const storedPaymentAlerts = localStorage.getItem("pref_payment_alerts");
    const storedDueReminders = localStorage.getItem("pref_due_reminders");
    if (storedPaymentAlerts !== null) setPaymentAlerts(storedPaymentAlerts === "true");
    if (storedDueReminders !== null) setDueReminders(storedDueReminders === "true");
  }, []);

  const handleToggleTheme = (val: boolean) => {
    const nextTheme = val ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast.success(`Switched to ${nextTheme} theme`);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("pref_payment_alerts", String(paymentAlerts));
    localStorage.setItem("pref_due_reminders", String(dueReminders));
    toast.success("Notification preferences saved successfully!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 5) {
      toast.error("New password must be at least 5 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSubmittingPassword(true);
    const toastId = toast.loading("Updating password...");
    try {
      await ApiClient.changePortalPassword({
        currentPassword,
        newPassword
      });
      toast.success("Password changed successfully!", { id: toastId });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password", { id: toastId });
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Portal Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your customer portal preferences, notification rules, and change password.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Account Security (Change Password) */}
        <Card className="p-6 border border-border bg-card rounded-2xl shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <KeyRound className="h-4.5 w-4.5 text-gold" />
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currPass" className="text-xs text-muted-foreground font-semibold">Current Password</Label>
              <Input
                id="currPass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="rounded-xl h-10 border-border text-xs focus-visible:ring-gold"
                disabled={submittingPassword}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPass" className="text-xs text-muted-foreground font-semibold">New Password</Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 5 characters"
                className="rounded-xl h-10 border-border text-xs focus-visible:ring-gold"
                disabled={submittingPassword}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confPass" className="text-xs text-muted-foreground font-semibold">Confirm Password</Label>
              <Input
                id="confPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="rounded-xl h-10 border-border text-xs focus-visible:ring-gold"
                disabled={submittingPassword}
              />
            </div>

            <Button
              type="submit"
              disabled={submittingPassword}
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-10 font-medium shadow-[var(--shadow-gold)]"
            >
              {submittingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>

        {/* Portal Preferences (Theme, Notifications, Lang) */}
        <div className="space-y-6">
          {/* Appearance & Themes */}
          <Card className="p-6 border border-border bg-card rounded-2xl shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <SettingsIcon className="h-4.5 w-4.5 text-gold" />
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Appearance</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Dark Theme</p>
                <p className="text-[10px] text-muted-foreground">Switch between light and dark portal theme.</p>
              </div>
              <div className="flex items-center gap-2">
                {theme === "light" ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4 text-gold" />}
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={handleToggleTheme}
                />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6 border border-border bg-card rounded-2xl shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Bell className="h-4.5 w-4.5 text-gold" />
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Notification Rules</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Payment Success Alerts</p>
                  <p className="text-[10px] text-muted-foreground">Receive instant confirmation on your payments.</p>
                </div>
                <Switch
                  checked={paymentAlerts}
                  onCheckedChange={(val) => {
                    setPaymentAlerts(val);
                    localStorage.setItem("pref_payment_alerts", String(val));
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Interest Due Reminders</p>
                  <p className="text-[10px] text-muted-foreground">Receive alert notifications before interest due dates.</p>
                </div>
                <Switch
                  checked={dueReminders}
                  onCheckedChange={(val) => {
                    setDueReminders(val);
                    localStorage.setItem("pref_due_reminders", String(val));
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Language Selection */}
          <Card className="p-6 border border-border bg-card rounded-2xl shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Globe className="h-4.5 w-4.5 text-gold" />
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Language Selection</h3>
            </div>

            <div className="space-y-2">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  toast.success("Language preference updated (Future-Ready)");
                }}
                className="w-full bg-background border border-border text-foreground text-xs rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (Coming Soon)</option>
                <option value="kn-IN">Kannada (Coming Soon)</option>
              </select>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
