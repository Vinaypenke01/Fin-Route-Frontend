/**
 * Super Admin Service for platform monitoring and tenant management.
 */

import { apiRequest } from "../api-client";
import { MasterItem } from "./masters-service";

export interface AdminDashboardMetrics {
  total_users: number;
  guest_users: number;
  total_workspaces: number;
  active_workspaces: number;
  collections_today_count: number;
  collections_today_amount: number;
}

export interface SystemHealthData {
  database: {
    status: string;
    engine: string;
  };
  api_server: {
    status: string;
    uptime: string;
  };
  redis_cache: {
    status: string;
  };
}

export interface AdminWorkspace {
  public_id: string;
  name: string;
  owner_name: string;
  owner_mobile: string;
  owner_email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  subscription_plan: string;
  status: string;
  max_customers_override: number | null;
  max_collection_days_override: number | null;
  allowed_collection_days?: string[];
  configured_days_count?: number;
  max_collection_days?: number;
  purchased_additional_days?: number;
  max_customers?: number;
  customer_count: number;
  day_wise_customer_counts?: Record<string, number>;
  total_outstanding_amount?: number;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_name: string;
  user_mobile: string;
  action: string;
  target_model: string;
  target_id: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export interface CouponItem {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface SubscriptionSummary {
  total_active: number;
  total_trials: number;
  total_cancelled: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  workspaces: AdminWorkspace[];
}

export interface InvoiceItem {
  id: string;
  workspace_name: string;
  plan: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
}

export interface GlobalConfigItem {
  id: number;
  key: string;
  value: string;
  description: string;
  is_active: boolean;
  updated_at: string;
}

export interface SubscriptionPlanConfigItem {
  id?: number;
  plan_code: string;
  target_user_type?: "guest" | "lender";
  name: string;
  monthly_price: number;
  annual_price: number;
  tagline: string;
  max_customers: number;
  max_collection_days: number;
  additional_days?: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export const adminService = {
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const res = await apiRequest<AdminDashboardMetrics>("/admin/dashboard/");
    return res.data;
  },

  async getSystemHealth(): Promise<SystemHealthData> {
    const res = await apiRequest<SystemHealthData>("/admin/system-health/");
    return res.data;
  },

  async getWorkspaces(params?: { search?: string; status?: string; page?: number }): Promise<AdminWorkspace[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiRequest<AdminWorkspace[]>(`/admin/workspaces/${query ? `?${query}` : ""}`);
    return res.data;
  },

  async createLender(data: {
    full_name: string;
    mobile_number: string;
    email?: string;
    password: string;
    workspace_name: string;
    address?: string;
    city?: string;
    state?: string;
    pin_code?: string;
    subscription_plan?: string;
    status?: string;
    max_customers_override?: number | null;
    max_collection_days_override?: number | null;
  }): Promise<AdminWorkspace> {
    const res = await apiRequest<AdminWorkspace>("/admin/workspaces/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateLender(
    public_id: string,
    data: {
      owner_name?: string;
      owner_mobile?: string;
      owner_email?: string;
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      pin_code?: string;
      subscription_plan?: string;
      status?: string;
      max_customers_override?: number | null;
      max_collection_days_override?: number | null;
    }
  ): Promise<AdminWorkspace> {
    const res = await apiRequest<AdminWorkspace>(`/admin/workspaces/${public_id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateWorkspaceStatus(id: string, status: string): Promise<void> {
    await apiRequest(`/admin/workspaces/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async resetLenderPassword(id: string, new_password: string): Promise<void> {
    await apiRequest(`/admin/workspaces/${id}/reset-password/`, {
      method: "POST",
      body: JSON.stringify({ new_password }),
    });
  },

  async setQuotaOverride(id: string, limits: { max_customers_override?: number | null; max_collection_days_override?: number | null }): Promise<void> {
    await apiRequest(`/admin/workspaces/${id}/quota-override/`, {
      method: "PATCH",
      body: JSON.stringify(limits),
    });
  },

  async deleteWorkspace(id: string): Promise<void> {
    await apiRequest(`/admin/workspaces/${id}/`, {
      method: "DELETE",
    });
  },

  async createMasterItem(category: string, data: { name: string; code?: string }): Promise<MasterItem> {
    const res = await apiRequest<MasterItem>(`/admin/masters/${category}/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateMasterItem(category: string, id: number, data: { name?: string; code?: string }): Promise<MasterItem> {
    const res = await apiRequest<MasterItem>(`/admin/masters/${category}/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteMasterItem(category: string, id: number): Promise<void> {
    await apiRequest(`/admin/masters/${category}/${id}/`, {
      method: "DELETE",
    });
  },

  async getSubscriptions(): Promise<SubscriptionSummary> {
    const res = await apiRequest<SubscriptionSummary>("/admin/subscriptions/");
    return res.data;
  },

  async getSubscriptionPlanConfigs(): Promise<SubscriptionPlanConfigItem[]> {
    const res = await apiRequest<SubscriptionPlanConfigItem[]>("/admin/subscriptions/plan-configs/");
    return res.data;
  },

  async createSubscriptionPlanConfig(data: Partial<SubscriptionPlanConfigItem>): Promise<SubscriptionPlanConfigItem> {
    const res = await apiRequest<SubscriptionPlanConfigItem>("/admin/subscriptions/plan-configs/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateSubscriptionPlanConfig(id: number, data: Partial<SubscriptionPlanConfigItem>): Promise<SubscriptionPlanConfigItem> {
    const res = await apiRequest<SubscriptionPlanConfigItem>(`/admin/subscriptions/plan-configs/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteSubscriptionPlanConfig(id: number): Promise<void> {
    await apiRequest(`/admin/subscriptions/plan-configs/${id}/`, {
      method: "DELETE",
    });
  },

  async getGuestPlans(): Promise<SubscriptionPlanConfigItem[]> {
    const res = await apiRequest<SubscriptionPlanConfigItem[]>("/admin/guest-plans/");
    return res.data;
  },

  async createGuestPlan(data: Partial<SubscriptionPlanConfigItem>): Promise<SubscriptionPlanConfigItem> {
    const res = await apiRequest<SubscriptionPlanConfigItem>("/admin/guest-plans/", {
      method: "POST",
      body: JSON.stringify({ ...data, target_user_type: "guest" }),
    });
    return res.data;
  },

  async getInvoices(): Promise<InvoiceItem[]> {
    const res = await apiRequest<InvoiceItem[]>("/admin/invoices/");
    return res.data;
  },

  async broadcastNotification(data: { title: string; message: string; notification_type?: string; target_plan?: string }): Promise<void> {
    await apiRequest("/admin/notifications/broadcast/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getConfiguration(): Promise<GlobalConfigItem[]> {
    const res = await apiRequest<GlobalConfigItem[]>("/admin/configuration/");
    return res.data;
  },

  async updateConfiguration(key: string, value: string): Promise<void> {
    await apiRequest("/admin/configuration/", {
      method: "PUT",
      body: JSON.stringify({ key, value }),
    });
  },

  async getAuditLogs(params?: { page?: number }): Promise<AuditLogItem[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiRequest<AuditLogItem[]>(`/admin/audit-logs/${query ? `?${query}` : ""}`);
    return res.data;
  },

  async getCoupons(): Promise<CouponItem[]> {
    const res = await apiRequest<CouponItem[]>("/admin/coupons/");
    return res.data;
  },

  async createCoupon(data: any): Promise<CouponItem> {
    const res = await apiRequest<CouponItem>("/admin/coupons/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getReviews(params?: { status?: string }): Promise<import("./masters-service").CustomerReview[]> {
    const query = params?.status ? `?status=${params.status}` : "";
    const res = await apiRequest<import("./masters-service").CustomerReview[]>(`/admin/reviews/${query}`);
    return res.data;
  },

  async updateReviewStatus(id: number, status: "approved" | "rejected" | "pending"): Promise<import("./masters-service").CustomerReview> {
    const res = await apiRequest<import("./masters-service").CustomerReview>(`/admin/reviews/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async deleteReview(id: number): Promise<void> {
    await apiRequest(`/admin/reviews/${id}/`, {
      method: "DELETE",
    });
  },

  async getUpgradeRequests(params?: { status?: string }): Promise<PlanUpgradeRequestItem[]> {
    const query = params?.status ? `?status=${params.status}` : "";
    const res = await apiRequest<PlanUpgradeRequestItem[]>(`/admin/upgrade-requests/${query}`);
    return res.data;
  },

  async updateUpgradeRequestStatus(id: number, status: "approved" | "rejected" | "pending", admin_notes?: string): Promise<PlanUpgradeRequestItem> {
    const res = await apiRequest<PlanUpgradeRequestItem>(`/admin/upgrade-requests/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status, admin_notes }),
    });
    return res.data;
  },
};

export interface PlanUpgradeRequestItem {
  id: number;
  workspace_name: string;
  lender_name: string;
  lender_mobile: string;
  plan_code: string;
  plan_name: string;
  additional_days: number;
  amount: number;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}
