/**
 * Guest Workspace Service for dashboard, customers, collections, expenses, calculator, and reports.
 */

import { apiRequest } from "../api-client";

export interface WorkspaceData {
  public_id: string;
  name: string;
  business_category: number | null;
  business_category_name: string | null;
  mobile_number: string;
  gstin?: string | null;
  business_type?: string | null;
  owner_pan?: string | null;
  logo: string | null;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  subscription_plan: "free" | "premium";
  status: "active" | "suspended" | "read_only";
  allowed_collection_days?: string[];
  max_allowed_collection_days?: number;
  purchased_additional_days?: number;
  created_at: string;
}

export interface PlanOption {
  code: string;
  target_user_type?: "guest" | "lender";
  name: string;
  price: number;
  additional_days: number;
  max_collection_days: number;
  max_customers?: number | string;
  tagline: string;
  features: string[];
  is_popular?: boolean;
}

export interface UpgradePlansResponse {
  current_plan: string;
  base_free_days: number;
  purchased_additional_days: number;
  total_allowed_days: number;
  guest_plans?: PlanOption[];
  lender_plans?: PlanOption[];
  available_plans: PlanOption[];
}

export interface DashboardMetrics {
  total_customers: number;
  active_loans: number;
  collections_today: number;
  amount_collected_today: number;
  amount_collected_this_week: number;
  disbursements_today?: number;
  new_borrowers_today?: number;
  capital_today?: number;
  net_cash_today?: number;
  is_cash_deficit?: boolean;
  outstanding_balance: number;
  pending_today: number;
  expenses_today: number;
  expenses_this_month: number;
}

export interface CapitalEntry {
  public_id: string;
  entry_date: string;
  amount: number;
  remarks?: string;
  added_by_name?: string;
  created_at?: string;
}

export interface CashReconciliation {
  date: string;
  collections_total: number;
  collections_count: number;
  capital_total: number;
  capital_count: number;
  disbursements_total: number;
  disbursements_count: number;
  expenses_total: number;
  expenses_count: number;
  total_inflow: number;
  total_outflow: number;
  net_cash_handheld: number;
  is_cash_deficit: boolean;
}

export interface LineDaySchedule {
  day_of_week: string;
  portion: "morning" | "afternoon" | "both";
}

export interface CollectionLine {
  public_id: string;
  name: string;
  area?: string;
  is_active?: boolean;
  customers_count?: number;
  day_schedules?: LineDaySchedule[];
  created_at?: string;
}

export interface Customer {
  public_id: string;
  customer_code: string;
  sequence_number?: number | null;
  full_name: string;
  mobile_number: string;
  alternate_mobile?: string;
  photo?: string | null;
  id_proof_type?: string;
  id_proof_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  loan_amount: number;
  disbursed_amount?: number;
  total_due: number;
  outstanding_balance: number;
  interest_rate?: number;
  collection_frequency: number;
  collection_frequency_name?: string;
  collection_day?: string;
  line?: string | null;
  line_public_id?: string | null;
  line_name?: string | null;
  portion?: "morning" | "afternoon" | "both";
  interest_type: number;
  interest_type_name?: string;
  is_existing_borrower?: boolean;
  total_installments?: number;
  installments_paid_count?: number;
  remaining_installments_count?: number;
  skipped_installments_count?: number;
  amount_already_collected?: number;
  installment_amount?: number;
  status: "active" | "closed" | "defaulted" | "suspended";
  start_date: string;
  end_date?: string | null;
  notes?: string;
}

export interface Collection {
  public_id: string;
  receipt_number: string;
  customer_code: string;
  customer_name: string;
  customer_public_id: string;
  line_public_id?: string | null;
  line_name?: string | null;
  portion?: "morning" | "afternoon" | "both";
  total_installments?: number;
  installments_paid_count?: number;
  remaining_installments_count?: number;
  outstanding_balance?: number;
  disbursed_date?: string;
  customer_start_date?: string;
  collection_date: string;
  expected_amount: number;
  collected_amount: number;
  status: number;
  status_code?: string;
  status_name: string;
  payment_mode: number | null;
  payment_mode_name: string | null;
  remarks: string;
  is_collected_today?: boolean;
  is_edited?: boolean;
  edit_count?: number;
  created_at: string;
}

export interface Expense {
  public_id: string;
  category: number;
  category_name: string;
  amount: number;
  expense_date: string;
  description: string;
  payment_mode: number | null;
  payment_mode_name: string | null;
  receipt_image: string | null;
  created_at: string;
}

export interface CalculatorResult {
  principal_amount: number;
  interest_rate: number;
  interest_type: string;
  total_interest: number;
  total_payable: number;
  installment_amount: number;
  frequency: string;
  duration: number;
  schedule: Array<{
    installment_number: number;
    due_date: string;
    installment_amount: number;
    remaining_balance: number;
  }>;
}

export const guestWorkspaceService = {
  // ─── Workspace ─────────────────────────────────────────────────────────────
  async getWorkspace(): Promise<WorkspaceData> {
    const res = await apiRequest<WorkspaceData>("/app/workspace/");
    return res.data;
  },

  async updateWorkspace(data: Partial<WorkspaceData>): Promise<WorkspaceData> {
    const res = await apiRequest<WorkspaceData>("/app/workspace/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardData(): Promise<{ metrics: DashboardMetrics; recent_collections: Collection[] }> {
    const res = await apiRequest<{ metrics: DashboardMetrics; recent_collections: Collection[] }>("/app/dashboard/");
    return res.data;
  },

  async getWeeklySummary(): Promise<Array<{ date: string; day_name: string; amount_collected: number; count: number }>> {
    const res = await apiRequest<Array<{ date: string; day_name: string; amount_collected: number; count: number }>>("/app/dashboard/weekly-summary/");
    return res.data;
  },

  // ─── Customers ─────────────────────────────────────────────────────────────
  async getCustomers(params?: { search?: string; status?: string; frequency?: string; collection_day?: string; line?: string; portion?: string; page?: number; page_size?: number }) {
    const cleanedParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "all") {
          cleanedParams[k] = String(v);
        }
      });
    }
    const query = new URLSearchParams(cleanedParams).toString();
    const res = await apiRequest<any>(`/app/customers/${query ? `?${query}` : ""}`);

    let items: Customer[] = [];
    if (Array.isArray(res.data)) {
      items = res.data;
    } else if (res.data && Array.isArray((res.data as any).results)) {
      items = (res.data as any).results;
    } else if (res && Array.isArray((res as any).results)) {
      items = (res as any).results;
    }

    return { ...res, data: items };
  },

  async getCustomerDetail(id: string): Promise<Customer> {
    const res = await apiRequest<Customer>(`/app/customers/${id}/`);
    return res.data;
  },

  async createCustomer(data: any): Promise<Customer> {
    const res = await apiRequest<Customer>("/app/customers/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateCustomer(id: string, data: any): Promise<Customer> {
    const res = await apiRequest<Customer>(`/app/customers/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async archiveCustomer(id: string): Promise<void> {
    await apiRequest(`/app/customers/${id}/`, { method: "DELETE" });
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiRequest(`/app/customers/${id}/`, { method: "DELETE" });
  },

  // ─── Collections ───────────────────────────────────────────────────────────
  async getCollections(params?: { date_from?: string; date_to?: string; customer?: string; status?: string; line?: string; portion?: string; page?: number; page_size?: number }) {
    const cleanedParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "all") {
          cleanedParams[k] = String(v);
        }
      });
    }
    const query = new URLSearchParams(cleanedParams).toString();
    const res = await apiRequest<any>(`/app/collections/${query ? `?${query}` : ""}`);

    let items: Collection[] = [];
    if (Array.isArray(res.data)) {
      items = res.data;
    } else if (res.data && Array.isArray((res.data as any).results)) {
      items = (res.data as any).results;
    } else if (res && Array.isArray((res as any).results)) {
      items = (res.data as any).results;
    }

    return { ...res, data: items };
  },

  async recordCollection(data: {
    customer: string;
    collection_date: string;
    expected_amount: number;
    collected_amount: number;
    status: number;
    payment_mode?: number | null;
    remarks?: string;
    is_collected_today?: boolean;
  }): Promise<Collection> {
    const res = await apiRequest<Collection>("/app/collections/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateCollection(id: string, data: Record<string, any>): Promise<Collection> {
    const res = await apiRequest<Collection>(`/app/collections/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async recordBatchCollections(data: {
    collection_date: string;
    entries: Array<{
      customer: string;
      expected_amount?: number;
      collected_amount: number;
      status: number;
      payment_mode?: number | null;
      remarks?: string;
      is_collected_today?: boolean;
    }>;
  }): Promise<Collection[]> {
    const res = await apiRequest<Collection[]>("/app/collections/batch/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteCollection(id: string): Promise<void> {
    await apiRequest(`/app/collections/${id}/`, { method: "DELETE" });
  },

  // ─── Expenses ──────────────────────────────────────────────────────────────
  async getExpenses(params?: { date_from?: string; date_to?: string; category?: string; page?: number; page_size?: number }) {
    const cleanedParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "all") {
          cleanedParams[k] = String(v);
        }
      });
    }
    const query = new URLSearchParams(cleanedParams).toString();
    const res = await apiRequest<any>(`/app/expenses/${query ? `?${query}` : ""}`);

    let items: Expense[] = [];
    if (Array.isArray(res.data)) {
      items = res.data;
    } else if (res.data && Array.isArray((res.data as any).results)) {
      items = (res.data as any).results;
    } else if (res && Array.isArray((res as any).results)) {
      items = (res as any).results;
    }

    return { ...res, data: items };
  },

  async recordExpense(data: {
    category: number;
    amount: number;
    expense_date: string;
    description?: string;
    payment_mode?: number | null;
  }): Promise<Expense> {
    const res = await apiRequest<Expense>("/app/expenses/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await apiRequest(`/app/expenses/${id}/`, { method: "DELETE" });
  },

  // ─── Calculator ────────────────────────────────────────────────────────────
  async calculateLoan(data: {
    amount: number;
    interest_rate: number;
    interest_type: string;
    frequency: string;
    duration: number;
    start_date?: string;
  }): Promise<CalculatorResult> {
    const res = await apiRequest<CalculatorResult>("/app/calculator/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },



  // ─── Upgrade & Plans ───────────────────────────────────────────────────────
  async getUpgradePlans(): Promise<UpgradePlansResponse> {
    const res = await apiRequest<UpgradePlansResponse>("/app/upgrade/plans/");
    return res.data;
  },

  async applyUpgradePlan(planCode: string, additionalDays?: number): Promise<any> {
    const res = await apiRequest<any>("/app/upgrade/", {
      method: "POST",
      body: JSON.stringify({ plan_code: planCode, additional_days: additionalDays }),
    });
    return res.data;
  },

  async submitUpgradeRequest(payload: {
    plan_code: string;
    plan_name: string;
    additional_days: number;
    amount: number;
  }): Promise<any> {
    const res = await apiRequest<any>("/app/upgrade/request/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ─── Reports & Data Backup ──────────────────────────────────────────────────
  getReportExportUrl(type: string, format: string = "csv", params?: any): string {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    const query = new URLSearchParams({ type, format, ...params }).toString();
    return `${API_BASE_URL}/app/reports/export/?${query}`;
  },

  // ─── Capital Entries & Daily Cash Reconciliation ──────────────────────────────
  async recordCapital(payload: { entry_date: string; amount: number; remarks?: string }): Promise<CapitalEntry> {
    const res = await apiRequest<CapitalEntry>("/app/capital/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async getCapitalEntries(entry_date?: string): Promise<CapitalEntry[]> {
    const query = entry_date ? `?entry_date=${entry_date}` : "";
    const res = await apiRequest<CapitalEntry[]>(`/app/capital/${query}`);
    return res.data || [];
  },

  async deleteCapital(public_id: string): Promise<void> {
    await apiRequest(`/app/capital/${public_id}/`, {
      method: "DELETE",
    });
  },

  async getCashReconciliation(date?: string, line?: string): Promise<CashReconciliation> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (line && line !== "all") params.line = line;
    const query = new URLSearchParams(params).toString();
    const res = await apiRequest<CashReconciliation>(`/app/cash-reconciliation/${query ? `?${query}` : ""}`);
    return res.data;
  },

  async sendRouteClosureReport(payload: { date?: string; line?: string; line_name?: string }): Promise<{ email_sent: boolean; recipient: string; message: string }> {
    const res = await apiRequest<{ email_sent: boolean; recipient: string; message: string }>(`/app/cash-reconciliation/send-report/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Download complete JSON backup of all workspace records.
   */
  async downloadFullDataBackup(): Promise<void> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    const token = localStorage.getItem("finroute_access_token");
    const res = await fetch(`${API_BASE_URL}/app/backup/download/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to download workspace data backup.");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finroute_workspace_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // ─── Lines (Routes) ────────────────────────────────────────────────────────
  async getLines(): Promise<CollectionLine[]> {
    const res = await apiRequest<CollectionLine[]>("/app/lines/");
    return res.data || [];
  },

  async getLineDetail(id: string): Promise<CollectionLine> {
    const res = await apiRequest<CollectionLine>(`/app/lines/${id}/`);
    return res.data;
  },

  async createLine(data: {
    name: string;
    area?: string;
    schedules?: Array<{ day_of_week: string; portion: string }>;
  }): Promise<CollectionLine> {
    const res = await apiRequest<CollectionLine>("/app/lines/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateLine(
    id: string,
    data: {
      name?: string;
      area?: string;
      schedules?: Array<{ day_of_week: string; portion: string }>;
    }
  ): Promise<CollectionLine> {
    const res = await apiRequest<CollectionLine>(`/app/lines/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteLine(id: string): Promise<void> {
    await apiRequest(`/app/lines/${id}/`, { method: "DELETE" });
  },

  async getAvailablePortions(excludeLineId?: string): Promise<Record<string, string[]>> {
    const query = excludeLineId ? `?exclude_line_id=${excludeLineId}` : "";
    const res = await apiRequest<Record<string, string[]>>(`/app/lines/available-portions/${query}`);
    return res.data;
  },
};
