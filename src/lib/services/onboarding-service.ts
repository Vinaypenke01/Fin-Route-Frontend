import { apiRequest } from "@/lib/api-client";

export interface MigrationCutoverPayload {
  cutover_date: string;
  opening_cash: number;
}

export interface BulkBorrowerItem {
  sequence_number?: number;
  full_name: string;
  mobile_number?: string;
  line_id?: string;
  line_public_id?: string;
  collection_day?: string;
  loan_amount?: number;
  disbursed_amount?: number;
  installment_amount?: number;
  total_installments?: number;
  amount_already_collected?: number;
  paid_amount?: number;
  start_date?: string;
}

export interface BulkImportResponse {
  imported_count: number;
  total_loan_amount: string;
  total_collected_pre_digital: string;
  total_outstanding: string;
  customers: {
    public_id: string;
    customer_code: string;
    full_name: string;
    outstanding_balance: string;
    status: string;
  }[];
}

export interface HistoricalAdjustmentPayload {
  type: "income" | "expense";
  amount: number;
  description?: string;
}

export const onboardingService = {
  /**
   * Day 1 Cutover Baseline Cash Initialization
   */
  async setCutoverBaseline(payload: MigrationCutoverPayload) {
    const res = await apiRequest<{
      public_id: string;
      cutover_date: string;
      opening_cash: string;
      remarks: string;
    }>("/app/onboarding/cutover/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Bulk Existing Borrower Onboarding
   */
  async bulkImportBorrowers(borrowers: BulkBorrowerItem[]): Promise<BulkImportResponse> {
    const res = await apiRequest<BulkImportResponse>("/app/onboarding/bulk-borrowers/", {
      method: "POST",
      body: JSON.stringify({ borrowers }),
    });
    return res.data;
  },

  /**
   * Record Historical Lump-Sum P&L Overhead Adjustment
   */
  async recordHistoricalAdjustment(payload: HistoricalAdjustmentPayload) {
    const res = await apiRequest<{
      public_id: string;
      amount: string;
      remarks: string;
    }>("/app/onboarding/historical-adjustment/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
};
