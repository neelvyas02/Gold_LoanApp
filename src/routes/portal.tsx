import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gem, LayoutDashboard, ScrollText, IndianRupee, LifeBuoy, Settings, User, LogOut, Bell, Sun, Moon, Check, Trash2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const authRoutes = ["/portal/login", "/portal/signup", "/portal/forgot-password"];
  const isAuthPage = authRoutes.includes(location.pathname);

  useEffect(() => {
    // Read auth data from localStorage
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedUserStr = localStorage.getItem("user");

    // Guard route access
    if (!savedToken || savedRole !== "Customer") {
      if (!isAuthPage) {
        navigate({ to: "/portal/login" });
      }
    } else {
      setToken(savedToken);
      if (savedUserStr) {
        setUser(JSON.parse(savedUserStr));
      }
      if (location.pathname === "/portal" || location.pathname === "/portal/") {
        navigate({ to: "/portal/dashboard" });
      }
    }

    // Read and apply theme
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [location.pathname, navigate, isAuthPage]);

  // Fetch notifications periodically
  useEffect(() => {
    if (token && !isAuthPage) {
      fetchNotifications();
    }
  }, [token, isAuthPage]);

  const fetchNotifications = async () => {
    try {
      const list = await ApiClient.getPortalNotifications();
      setNotifications(list || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await ApiClient.portalLogout();
      toast.success("Successfully logged out");
      navigate({ to: "/portal/login" });
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.markPortalNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.deletePortalNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.markAllPortalNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isAuthPage) {
    return <Outlet />;
  }

  const menuItems = [
    { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { label: "My Loan", href: "/portal/loan", icon: ScrollText },
    { label: "Payments", href: "/portal/payments", icon: IndianRupee },
    { label: "Support", href: "/portal/support", icon: LifeBuoy },
    { label: "Profile", href: "/portal/profile", icon: User },
    { label: "Settings", href: "/portal/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border z-20">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center shadow-[var(--shadow-gold)]">
            <Gem className="h-4 w-4 text-gold-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">Vyas Finance</p>
            <p className="text-[10px] text-muted-foreground">Customer Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Button
                key={item.label}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
                  isActive ? "text-gold font-semibold bg-gold/5" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => navigate({ to: item.href })}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-3">
              <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-bold text-gold overflow-hidden shrink-0">
                {user.profilePhoto ? (
                  <img src={`http://localhost:5000${user.profilePhoto}`} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name ? user.name[0].toUpperCase() : "C"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.customerNumber}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl px-4"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 pb-16 md:pb-0 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-gold grid place-items-center">
              <Gem className="h-4 w-4 text-gold-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground">Vyas Finance</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-sm font-medium text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{user?.name || "Customer"}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-muted"
              onClick={handleToggleTheme}
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </Button>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-muted relative"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-lg z-50 py-2 max-h-[440px] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <span className="font-semibold text-sm">Notifications ({unreadCount} unread)</span>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-gold hover:underline font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifDropdown(false)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors flex gap-3 ${
                            !n.isRead ? "bg-gold/5" : ""
                          }`}
                          onClick={() => {
                            if (n.actionUrl) {
                              navigate({ to: n.actionUrl });
                              setShowNotifDropdown(false);
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                              {n.priority === "high" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive flex items-center gap-0.5">
                                  <AlertCircle className="h-2.5 w-2.5" /> High
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-line leading-relaxed">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-1 text-[9px] text-muted-foreground/60">
                              <span>{new Date(n.createdAt).toLocaleString("en-IN")}</span>
                              {n.isRead && n.readAt && (
                                <span className="text-muted-foreground/40">Read {new Date(n.readAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            {!n.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(n.id, e)}
                                className="h-6 w-6 rounded-md hover:bg-success/10 text-success flex items-center justify-center"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotif(n.id, e)}
                              className="h-6 w-6 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Logout (Header) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-muted text-destructive md:hidden"
              onClick={handleLogout}
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 z-40 w-full h-16 bg-card border-t border-border flex items-center justify-around md:hidden">
          {menuItems.slice(0, 5).map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => navigate({ to: item.href })}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
