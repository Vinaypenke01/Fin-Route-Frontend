/**
 * Authentication Service for login, registration, OTP verification, and session me.
 */

import { apiRequest, setTokens, clearTokens, getRefreshToken, ApiResponse } from "../api-client";

export interface UserProfile {
  public_id: string;
  full_name: string;
  mobile_number: string;
  email: string | null;
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
  async updateProfile(data: { full_name?: string; email?: string }): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },
};
