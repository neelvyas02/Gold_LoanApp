import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CreditCard,
  FileBarChart,
  Gem,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
  Wallet,
  Sun,
  Moon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  LifeBuoy
} from "lucide-react";
import { type ReactNode, useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/loans", label: "Loans", icon: Wallet },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/support-tickets", label: "Support Tickets", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // User Authentication Info
  const currentUser = ApiClient.getCurrentUser() || { username: "admin", role: "Admin" };

  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 1. Initial Theme & Data Loading
  useEffect(() => {
    // Theme setup
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Notifications initial fetch
    fetchNotifications();

    // Event listener for click outsides
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Fetch notifications helper
  const fetchNotifications = async () => {
    try {
      const data = await ApiClient.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  // 3. Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await ApiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success("Notification marked as read");
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  // 4. Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 5. Run Global Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      setIsSearchOpen(true);
      try {
        const results = await ApiClient.searchGlobal(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleLogout = () => {
    ApiClient.logout();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r border-border">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="h-9 w-9 rounded-lg bg-gold grid place-items-center">
            <Gem className="h-4 w-4 text-gold-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate text-foreground">Vyas Finance</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Loan Management</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-[color:var(--gold)]")} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center gap-4 px-4 md:px-8 relative z-50">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gold grid place-items-center">
              <Gem className="h-4 w-4 text-gold-foreground" />
            </div>
            <span className="font-semibold text-foreground">Vyas Finance</span>
          </div>

          {/* Search bar */}
          <div ref={searchRef} className="hidden md:flex relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers, loans, receipts…"
              className="pl-9 h-10 bg-muted border-transparent focus-visible:bg-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
            {isSearchOpen && (searchQuery.trim().length >= 2) && (
              <div className="absolute top-11 left-0 w-full bg-card border border-border shadow-xl rounded-xl p-3 space-y-3 max-h-[350px] overflow-y-auto">
                {searching ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    Searching...
                  </div>
                ) : searchResults ? (
                  <div className="space-y-3 text-xs">
                    {/* Customers */}
                    {searchResults.customers?.length > 0 && (
                      <div>
                        <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1.5">Customers</p>
                        <div className="space-y-1">
                          {searchResults.customers.map((c: any) => (
                            <Link
                              key={c.id}
                              to="/customers"
                              search={{ search: c.name, tab: "all" }}
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-1.5 rounded hover:bg-muted font-medium text-foreground transition-colors"
                            >
                              {c.name} ({c.customerNumber}) · {c.phone}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Loans */}
                    {searchResults.loans?.length > 0 && (
                      <div>
                        <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1.5">Loans</p>
                        <div className="space-y-1">
                          {searchResults.loans.map((l: any) => (
                            <Link
                              key={l.id}
                              to="/loans"
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-1.5 rounded hover:bg-muted font-medium text-foreground transition-colors font-mono text-[11px]"
                            >
                              {l.loanNumber} · {l.customerName} · ₹{l.amount.toLocaleString("en-IN")}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payments */}
                    {searchResults.payments?.length > 0 && (
                      <div>
                        <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1.5">Receipts</p>
                        <div className="space-y-1">
                          {searchResults.payments.map((p: any) => (
                            <Link
                              key={p.id}
                              to="/payments"
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-1.5 rounded hover:bg-muted font-medium text-foreground transition-colors font-mono text-[11px]"
                            >
                              {p.receiptNumber} · {p.customerName} · ₹{p.amount.toLocaleString("en-IN")}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ornaments */}
                    {searchResults.ornaments?.length > 0 && (
                      <div>
                        <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1.5">Ornaments Collateral</p>
                        <div className="space-y-1">
                          {searchResults.ornaments.map((o: any) => (
                            <Link
                              key={o.id}
                              to="/loans"
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-1.5 rounded hover:bg-muted font-medium text-foreground transition-colors text-[11px]"
                            >
                              {o.type} ({o.loanNumber} · {o.customerName})
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty states */}
                    {(!searchResults.customers?.length &&
                      !searchResults.loans?.length &&
                      !searchResults.payments?.length &&
                      !searchResults.ornaments?.length) && (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        No grouped matches found.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground transition-colors"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-gold" />}
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) fetchNotifications();
                }}
                className="relative h-10 w-10 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden py-1">
                  <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-muted/30">
                    <span className="text-xs font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                        {unreadCount} Unread
                      </Badge>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                    {notifications.map((n) => {
                      const isRead = n.isRead;
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!isRead) handleMarkAsRead(n.id);
                          }}
                          className={cn(
                            "p-3 flex items-start gap-2.5 hover:bg-muted/40 transition-colors cursor-pointer",
                            !isRead && "bg-accent/15"
                          )}
                        >
                          <div className="shrink-0 mt-0.5">
                            {n.type?.includes("overdue") ? (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            ) : n.type?.includes("success") || n.type?.includes("closed") ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Info className="h-4 w-4 text-gold" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center gap-1">
                              <p className={cn("text-xs font-semibold truncate text-foreground", !isRead && "font-bold")}>
                                {n.title}
                              </p>
                              {!isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {notifications.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No notifications to show.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gold text-gold-foreground text-xs font-bold">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-foreground">{currentUser.username}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 p-4 md:p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 mb-6 sm:flex sm:flex-wrap sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
