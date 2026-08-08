// API Client for communicating with the Express.js Backend of Vyas Finance
const API_BASE_URL = "http://localhost:5000/api";

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

async function safeFetch<T>(endpoint: string, options?: RequestInit, isRetry = false): Promise<T> {
  try {
    const token = getStorageItem("token");
    const isFormData = options?.body instanceof FormData;
    
    const headers: Record<string, string> = {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> || {}),
    };

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (res.status === 401 && !isRetry && endpoint !== "/customer/auth/login" && endpoint !== "/customer/auth/signup") {
      // Attempt token refresh
      const newToken = await refreshTokenExchange();
      if (newToken) {
        return safeFetch<T>(endpoint, options, true);
      }
    }

    if (!res.ok) {
      const errPayload = await res.json().catch(() => ({}));
      const errorObj: any = new Error(errPayload.message || `API error: ${res.statusText}`);
      if (errPayload.errors) {
        errorObj.errors = errPayload.errors;
      }
      throw errorObj;
    }
    
    const payload = await res.json();
    return payload.data as T;
  } catch (error) {
    console.error(`Backend connection failed for endpoint ${endpoint}.`, error);
    throw error;
  }
}

export const ApiClient = {
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
