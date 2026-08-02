/**
 * Authentication Service for login, registration, OTP verification, and session me.
 */

import { apiRequest, setTokens, clearTokens, getRefreshToken, ApiResponse } from "../api-client";

export interface UserProfile {
  public_id: string;
  full_name: string;
  mobile_number: string;
  email: string | null;
  city?: string | null;
  state?: string | null;
  employee_id?: string | null;
  account_type: "guest" | "lender" | "employee" | "admin";
  is_mobile_verified: boolean;
  is_email_verified: boolean;
  created_at: string;
}

export interface WorkspaceSummary {
  public_id: string;
  name: string;
  plan: string;
  status: string;
}

export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
  workspace: WorkspaceSummary | null;
}

export const authService = {
  /**
   * Log in with mobile number/identifier + password.
   */
  async login(identifier: string, password: string): Promise<LoginResponseData> {
    const res = await apiRequest<LoginResponseData>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });

    if (res.data?.access_token) {
      setTokens(res.data.access_token, res.data.refresh_token);
    }
    return res.data;
  },

  /**
   * Register a new Guest Workspace user.
   */
  async register(data: {
    full_name: string;
    mobile_number: string;
    email?: string;
    password: string;
    confirm_password: string;
  }) {
    const res = await apiRequest("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Verify registration or password reset OTP.
   */
  async verifyOtp(mobile_number: string, otp: string, purpose: string = "registration") {
    const res = await apiRequest("/auth/otp/verify/", {
      method: "POST",
      body: JSON.stringify({ mobile_number, otp, purpose }),
    });
    return res.data;
  },

  /**
   * Request a new OTP.
   */
  async requestOtp(mobile_number: string, purpose: string = "registration") {
    const res = await apiRequest("/auth/otp/request/", {
      method: "POST",
      body: JSON.stringify({ mobile_number, purpose }),
    });
    return res.data;
  },

  /**
   * Resend OTP.
   */
  async resendOtp(mobile_number: string, purpose: string = "registration") {
    const res = await apiRequest("/auth/otp/resend/", {
      method: "POST",
      body: JSON.stringify({ mobile_number, purpose }),
    });
    return res.data;
  },

  /**
   * Log out server-side and clear tokens locally.
   */
  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiRequest("/auth/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    clearTokens();
  },

  /**
   * Fetch current authenticated user profile.
   */
  async getMe(): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>("/auth/me/");
    return res.data;
  },

  /**
   * Update profile details.
   */
  async updateProfile(data: {
    full_name?: string;
    email?: string;
    city?: string;
    state?: string;
    employee_id?: string;
  }): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Change user password.
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) {
    const res = await apiRequest("/auth/password/change/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Fetch live activity audit logs for the authenticated user with filters and pagination.
   */
  async getActivityLogs(params?: {
    action?: string;
    date?: string;
    day?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ActivityResponse> {
    const q = new URLSearchParams();
    if (params?.action && params.action !== "all") q.append("action", params.action);
    if (params?.date) q.append("date", params.date);
    if (params?.day && params.day !== "all") q.append("day", params.day);
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", String(params.page));
    if (params?.page_size) q.append("page_size", String(params.page_size));

    const res = await apiRequest<any>(`/auth/me/activity/?${q.toString()}`);
    if (Array.isArray(res.data)) {
      return { items: res.data, count: res.data.length, page: 1, total_pages: 1 };
    }
    const meta = res.meta?.pagination || {};
    return {
      items: res.data || [],
      count: meta.count || (res.data ? res.data.length : 0),
      page: meta.page || 1,
      total_pages: meta.total_pages || 1,
    };
  },

  /**
   * Fetch active sessions/devices for current user with optional pagination and search.
   */
  async getSessions(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<SessionResponse> {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", String(params.page));
    if (params?.page_size) q.append("page_size", String(params.page_size));

    const res = await apiRequest<any>(`/auth/sessions/?${q.toString()}`);
    if (Array.isArray(res.data)) {
      return { items: res.data, count: res.data.length, page: 1, total_pages: 1 };
    }
    const meta = res.meta?.pagination || {};
    return {
      items: res.data || [],
      count: meta.count || (res.data ? res.data.length : 0),
      page: meta.page || 1,
      total_pages: meta.total_pages || 1,
    };
  },

  /**
   * Revoke a specific session/device by ID.
   */
  async revokeSession(sessionId: number): Promise<void> {
    await apiRequest(`/auth/sessions/${sessionId}/`, {
      method: "DELETE",
    });
  },

  /**
   * Revoke all other active sessions.
   */
  async revokeAllSessions(): Promise<void> {
    await apiRequest("/auth/sessions/revoke-all/", {
      method: "POST",
    });
  },
};

export interface UserSessionItem {
  id: number;
  device_name: string;
  device_type: string;
  ip_address: string | null;
  user_agent: string;
  last_activity_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface SessionResponse {
  items: UserSessionItem[];
  count: number;
  page: number;
  total_pages: number;
}

export interface AuditLogItem {
  id: number;
  user: number;
  user_name: string;
  user_mobile: string;
  action: string;
  target_model: string;
  target_id: string;
  description: string;
  ip_address: string | null;
  user_agent: string;
  changes: Record<string, any>;
  created_at: string;
}

export interface ActivityResponse {
  items: AuditLogItem[];
  count: number;
  page: number;
  total_pages: number;
}
