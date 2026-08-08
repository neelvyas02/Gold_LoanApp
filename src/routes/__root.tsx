import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { VFLogo } from "@/components/ui/vf-logo";
import { ApiClient, subscribeConnectionStatus, type ConnectionStatus } from "@/lib/api-client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <VFLogo size="lg" className="mx-auto" />
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground transition-all hover:bg-gold/90 shadow-[var(--shadow-gold)] cursor-pointer"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const isConnectionError =
    (error as any)?.isConnectionError ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("Unable to connect") ||
    error?.message?.includes("NetworkError") ||
    error?.message?.includes("Server temporarily unavailable");

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await ApiClient.checkHealth();
      await router.invalidate();
      reset();
    } catch (e) {
      console.error("Retry failed:", e);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-5 p-6 rounded-2xl bg-card border border-border shadow-xl">
        <VFLogo size="lg" className="mx-auto" />
        
        {isConnectionError ? (
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 grid place-items-center mx-auto text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">
              Unable to connect to Vyas Finance
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The backend service is taking longer than expected to respond or waking up from sleep. Please try reconnecting.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 grid place-items-center mx-auto text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An unexpected application error occurred. You can retry or return home.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground transition-all hover:bg-gold/90 shadow-[var(--shadow-gold)] cursor-pointer disabled:opacity-50"
          >
            {retrying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-gold-foreground" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Try Again
              </>
            )}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vyas Finance — Gold Loan Management System" },
      {
        name: "description",
        content:
          "Vyas Finance is a clean, modern gold loan management system for small finance companies — customers, loans, payments, reminders and reports in one place.",
      },
      { property: "og:title", content: "Vyas Finance — Gold Loan Management System" },
      {
        property: "og:description",
        content: "Manage customers, gold loans, payments and reminders with Vyas Finance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>({ state: "connected" });

  useEffect(() => {
    const unsubscribe = subscribeConnectionStatus((status) => {
      setConnStatus(status);
    });
    return unsubscribe;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      
      {/* Cold Start / Reconnection Overlay */}
      {connStatus.state === "connecting" && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md px-4 animate-in fade-in-50 duration-200">
          <div className="max-w-sm w-full text-center space-y-5 p-6 rounded-2xl bg-card border border-border shadow-2xl">
            <VFLogo size="lg" className="mx-auto animate-pulse" />
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 text-gold animate-spin" />
                <h2 className="text-base font-bold text-foreground">Connecting securely...</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {connStatus.message || "Please wait while we establish a secure connection to Vyas Finance."}
              </p>
              {connStatus.attempt && connStatus.maxAttempts && (
                <div className="pt-2">
                  <span className="inline-block text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                    Attempt {connStatus.attempt} of {connStatus.maxAttempts}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
}
