import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/loans", label: "Loans", icon: Wallet },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/reports", label: "Reports", icon: FileBarChart },
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

  return (
    <div className="min-h-screen bg-[color:var(--muted)] flex w-full">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-border">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="h-9 w-9 rounded-lg bg-gold grid place-items-center">
            <Gem className="h-4 w-4 text-gold-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">GoldVault</p>
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
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-border flex items-center gap-4 px-4 md:px-8">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gold grid place-items-center">
              <Gem className="h-4 w-4 text-gold-foreground" />
            </div>
            <span className="font-semibold">GoldVault</span>
          </div>
          <div className="hidden md:flex relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers, loans, receipts…"
              className="pl-9 h-10 bg-[color:var(--muted)] border-transparent focus-visible:bg-white"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative h-10 w-10 rounded-lg hover:bg-muted grid place-items-center">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gold text-gold-foreground text-xs font-semibold">
                  RM
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight">Ravi Menon</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Branch Manager</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 mb-6 sm:flex sm:flex-wrap sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
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
