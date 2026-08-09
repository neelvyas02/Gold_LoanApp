// API Client for communicating with the Express.js Backend of Vyas Finance
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export type ConnectionState = "connected" | "connecting" | "failed";

export interface ConnectionStatus {
  state: ConnectionState;
  message?: string;
  attempt?: number;
  maxAttempts?: number;
}

let currentConnectionStatus: ConnectionStatus = { state: "connected" };
const connectionListeners = new Set<(status: ConnectionStatus) => void>();

export function subscribeConnectionStatus(fn: (status: ConnectionStatus) => void) {
  connectionListeners.add(fn);
  fn(currentConnectionStatus);
  return () => {
    connectionListeners.delete(fn);
  };
}

export function getConnectionStatus(): ConnectionStatus {
  return currentConnectionStatus;
}

function setConnectionStatus(status: ConnectionStatus) {
  currentConnectionStatus = status;
  connectionListeners.forEach((fn) => fn(status));
}

const pendingGetRequests = new Map<string, Promise<any>>();
const RETRY_DELAYS = [1000, 2000, 4000, 6000];

export function getFileUrl(filePath?: string | null): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
}

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
}

function removeStorageItem(key: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
  }
}

async function refreshTokenExchange(): Promise<string | null> {
  const refreshToken = getStorageItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/customer/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;
    const payload = await res.json();
    if (payload.success && payload.data?.token) {
      setStorageItem("token", payload.data.token);
      return payload.data.token;
    }
  } catch (err) {
    console.error("Failed to auto-refresh access token:", err);
  }
  return null;
}

async function performFetchWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  isAuthRetry = false
): Promise<T> {
  const maxRetries = RETRY_DELAYS.length;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const token = getStorageItem("token");
      const isFormData = options?.body instanceof FormData;

      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options?.headers as Record<string, string>) || {}),
      };

      if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const url = `${API_BASE_URL}${cleanEndpoint}`;

      const res = await fetch(url, {
        ...options,
        headers,
      });

      if ([502, 503, 504].includes(res.status)) {
        throw new Error(`Server temporarily unavailable (HTTP ${res.status})`);
      }

      if (
        res.status === 401 &&
        !isAuthRetry &&
        endpoint !== "/customer/auth/login" &&
        endpoint !== "/customer/auth/signup" &&
        endpoint !== "/auth/login"
      ) {
        const newToken = await refreshTokenExchange();
        if (newToken) {
          return performFetchWithRetry<T>(endpoint, options, true);
        }
      }

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        const errorObj: any = new Error(
          errPayload.message || `API error: ${res.statusText} (${res.status})`
        );
        errorObj.status = res.status;
        if (errPayload.errors) {
          errorObj.errors = errPayload.errors;
        }
        throw errorObj;
      }

      const payload = await res.json();

      if (currentConnectionStatus.state !== "connected") {
        setConnectionStatus({ state: "connected" });
      }

      return payload.data as T;
    } catch (err: any) {
      lastError = err;

      const isNetworkOrColdStart =
        !err.status ||
        [502, 503, 504].includes(err.status) ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("Server temporarily unavailable");

      if (!isNetworkOrColdStart || attempt >= maxRetries) {
        if (isNetworkOrColdStart) {
          setConnectionStatus({
            state: "failed",
            message: "Unable to connect to the Vyas Finance service. Please try again.",
          });
          const connectionErr: any = new Error(
            "Unable to connect to the Vyas Finance service. Please try again."
          );
          connectionErr.isConnectionError = true;
          connectionErr.originalError = err;
          throw connectionErr;
        }
        throw err;
      }

      const nextDelay = RETRY_DELAYS[attempt];
      setConnectionStatus({
        state: "connecting",
        message: "Connecting securely... Please wait while we reconnect to Vyas Finance.",
        attempt: attempt + 1,
        maxAttempts: maxRetries,
      });

      await new Promise((resolve) => setTimeout(resolve, nextDelay));
    }
  }

  throw lastError;
}

async function safeFetch<T>(endpoint: string, options?: RequestInit, isRetry = false): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();
  const isGet = method === "GET";

  if (isGet) {
    const key = `${endpoint}:${options?.headers ? JSON.stringify(options.headers) : ""}`;
    if (pendingGetRequests.has(key)) {
      return pendingGetRequests.get(key) as Promise<T>;
    }
    const promise = performFetchWithRetry<T>(endpoint, options, isRetry).finally(() => {
      pendingGetRequests.delete(key);
    });
    pendingGetRequests.set(key, promise);
    return promise;
  }

  return performFetchWithRetry<T>(endpoint, options, isRetry);
}

export const ApiClient = {
  async checkHealth() {
    try {
      setConnectionStatus({ state: "connecting", message: "Reconnecting to Vyas Finance..." });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        setConnectionStatus({ state: "connected" });
        return true;
      }
    } catch (e) {
      console.warn("Health check failed:", e);
    }
    setConnectionStatus({ state: "failed", message: "Unable to connect to the Vyas Finance service. Please try again." });
    return false;
  },

  // Admin Auth
  async login(credentials: any) {
    const data = await safeFetch<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data && data.token) {
      setStorageItem("token", data.token);
      setStorageItem("role", "Admin");
      setStorageItem("user", JSON.stringify(data.user));
    }
    return data;
  },

  async adminForgotPassword(payload: { email: string }) {
    return safeFetch<any>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminVerifyOTP(payload: { email: string; otp: string }) {
    return safeFetch<{ resetToken: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminResendOTP(payload: { email: string }) {
    return safeFetch<any>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminResetPassword(payload: { resetToken: string; newPassword: string; confirmPassword: string }) {
    return safeFetch<any>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  logout() {
    removeStorageItem("token");
    removeStorageItem("refreshToken");
    removeStorageItem("role");
    removeStorageItem("user");
  },

  getCurrentUser() {
    const user = getStorageItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Admin Dashboard
  async getDashboard() {
    return safeFetch<any>("/dashboard", { method: "GET" });
  },

  // Admin Customers
  async getCustomers(search?: string, tab?: string) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (tab) params.append("tab", tab);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return safeFetch<any[]>(`/customers${queryStr}`, { method: "GET" });
  },

  async getCustomer(id: string) {
    return safeFetch<any>(`/customers/${id}`, { method: "GET" });
  },

  async createCustomer(data: any) {
    return safeFetch<any>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCustomer(id: string, data: any) {
    return safeFetch<any>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async archiveCustomer(id: string) {
    return safeFetch<any>(`/customers/${id}/archive`, { method: "PATCH" });
  },

  async restoreCustomer(id: string) {
    return safeFetch<any>(`/customers/${id}/restore`, { method: "PATCH" });
  },

  async deleteCustomerPermanently(id: string) {
    return safeFetch<any>(`/customers/${id}/permanent`, { method: "DELETE" });
  },

  // Admin Loans
  async getLoans() {
    return safeFetch<any[]>("/loans", { method: "GET" });
  },

  async getLoan(loanNo: string) {
    return safeFetch<any>(`/loans/${loanNo}`, { method: "GET" });
  },

  async createLoan(data: any) {
    return safeFetch<any>("/loans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async closeLoan(loanNo: string) {
    return safeFetch<any>(`/loans/${loanNo}/close`, { method: "PATCH" });
  },

  // Admin Payments
  async getPayments(loanNo?: string) {
    const endpoint = loanNo ? `/payments?loanNo=${loanNo}` : "/payments";
    return safeFetch<any[]>(endpoint, { method: "GET" });
  },

  async createPayment(data: any) {
    return safeFetch<any>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async reversePayment(receiptNo: string) {
    return safeFetch<any>(`/payments/${receiptNo}/reverse`, { method: "PATCH" });
  },

  // Admin Settings
  async getSettings() {
    return safeFetch<any>("/settings", { method: "GET" });
  },

  async updateSettings(data: any) {
    return safeFetch<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Search
  async searchGlobal(q: string) {
    return safeFetch<any>(`/search?q=${encodeURIComponent(q)}`, { method: "GET" });
  },

  // Reminders
  async getReminders() {
    return safeFetch<any[]>("/reminders", { method: "GET" });
  },

  // Notifications
  async getNotifications() {
    return safeFetch<any[]>("/notifications", { method: "GET" });
  },

  async markNotificationRead(id: string) {
    return safeFetch<any>(`/notifications/read/${id}`, { method: "PATCH" });
  },

  // Reports
  async getReportData(type: "customers" | "loans" | "payments" | "outstanding" | "overdue") {
    return safeFetch<any[]>(`/reports/${type}`, { method: "GET" });
  },

  // ==========================================
  // CUSTOMER AUTHENTICATION APIs
  // ==========================================
  async customerSendActivationOTP(payload: { email: string; identifier?: string; mobile?: string }) {
    return safeFetch<any>("/customer/auth/send-activation-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async customerVerifyOTP(payload: { email: string; otp: string; purpose?: string }) {
    return safeFetch<any>("/customer/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async customerActivateAccount(payload: { email: string; password: string; confirmPassword?: string; otp?: string }) {
    const data = await safeFetch<any>("/customer/auth/activate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.token) {
      setStorageItem("token", data.token);
      if (data.refreshToken) setStorageItem("refreshToken", data.refreshToken);
      setStorageItem("role", "Customer");
      if (data.customer) {
        setStorageItem("user", JSON.stringify({
          id: data.customer.id,
          username: data.customer.phone || data.customer.email,
          role: "Customer",
          name: data.customer.name,
          customerNumber: data.customer.customerNumber,
          profilePhoto: data.customer.profilePhoto,
          email: data.customer.email,
        }));
      }
    }
    return data;
  },

  async customerLogin(credentials: { identifier: string; password: string }) {
    const data = await safeFetch<any>("/customer/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data && data.token) {
      setStorageItem("token", data.token);
      if (data.refreshToken) setStorageItem("refreshToken", data.refreshToken);
      setStorageItem("role", "Customer");
      if (data.customer) {
        setStorageItem("user", JSON.stringify({
          id: data.customer.id,
          username: data.customer.phone || data.customer.email,
          role: "Customer",
          name: data.customer.name,
          customerNumber: data.customer.customerNumber,
          profilePhoto: data.customer.profilePhoto,
          email: data.customer.email,
        }));
      }
    }
    return data;
  },

  async customerLogout() {
    const refreshToken = getStorageItem("refreshToken");
    try {
      await safeFetch<any>("/customer/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      // ignore
    }
    removeStorageItem("token");
    removeStorageItem("refreshToken");
    removeStorageItem("role");
    removeStorageItem("user");
  },

  async customerSendOTP(payload: { email: string }) {
    return safeFetch<any>("/customer/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async customerForgotPassword(payload: { email?: string; identifier?: string }) {
    return safeFetch<any>("/customer/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async customerResetPassword(payload: { email?: string; identifier?: string; otp: string; newPassword: string; confirmPassword?: string }) {
    return safeFetch<any>("/customer/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Backward-compatible portal aliases
  async portalLogin(credentials: any) {
    return this.customerLogin(credentials);
  },

  async portalLogout() {
    return this.customerLogout();
  },

  // ==========================================
  // CUSTOMER PORTAL DATA APIs
  // ==========================================
  async getPortalDashboard() {
    return safeFetch<any>("/customer/dashboard", { method: "GET" });
  },

  async getPortalProfile() {
    return safeFetch<any>("/customer/profile", { method: "GET" });
  },

  async updatePortalProfile(data: any | FormData) {
    const isFormData = data instanceof FormData;
    const options: RequestInit = {
      method: "PUT",
      body: isFormData ? data : JSON.stringify(data),
    };

    const updated = await safeFetch<any>("/customer/profile", options);
    
    // Sync to user storage item
    const userStr = getStorageItem("user");
    if (userStr && updated) {
      const userObj = JSON.parse(userStr);
      if (updated.profilePhoto) userObj.profilePhoto = updated.profilePhoto;
      if (updated.name) userObj.name = updated.name;
      if (updated.email) userObj.email = updated.email;
      setStorageItem("user", JSON.stringify(userObj));
    }
    return updated;
  },

  async getPortalLoans() {
    return safeFetch<any[]>("/customer/loans", { method: "GET" });
  },

  async getPortalPayments() {
    return safeFetch<any[]>("/customer/payments", { method: "GET" });
  },

  async getPortalDocuments() {
    return safeFetch<any[]>("/customer/documents", { method: "GET" });
  },

  async getPortalOrnaments() {
    return safeFetch<any[]>("/customer/ornaments", { method: "GET" });
  },

  async getPortalNotifications() {
    return safeFetch<any[]>("/customer/notifications", { method: "GET" });
  },

  async markPortalNotificationRead(id: string) {
    return safeFetch<any>(`/customer/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllPortalNotificationsRead() {
    return safeFetch<any>("/customer/notifications/read-all", { method: "PATCH" });
  },

  async deletePortalNotification(id: string) {
    return safeFetch<any>(`/customer/notifications/${id}`, { method: "DELETE" });
  },

  async getPortalSupportTickets() {
    return safeFetch<any[]>("/customer/support", { method: "GET" });
  },

  async submitPortalSupportTicket(ticket: any) {
    return safeFetch<any>("/customer/support", {
      method: "POST",
      body: JSON.stringify(ticket),
    });
  },

  async changePortalPassword(passwords: any) {
    return safeFetch<any>("/customer/password", {
      method: "PUT",
      body: JSON.stringify(passwords),
    });
  },

  // Admin Tickets & Customer Inspection APIs
  async getAdminTickets(status?: string, search?: string) {
    return safeFetch<any[]>(`/admin/tickets?status=${status || ""}&search=${search || ""}`, { method: "GET" });
  },

  async updateTicketStatus(id: string, data: { status?: string; adminReply?: string }) {
    return safeFetch<any>(`/admin/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getAdminCustomers() {
    return safeFetch<any[]>("/admin/customers", { method: "GET" });
  },

  async getAdminCustomer(id: string) {
    return safeFetch<any>(`/admin/customer/${id}`, { method: "GET" });
  },
};
