/**
 * Masters Service for reference data (locations, frequencies, payment modes, etc.)
 * and public landing page data.
 */

import { apiRequest } from "../api-client";

export interface MasterItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  sort_order?: number;
}

export interface StateItem {
  id: number;
  public_id: string;
  name: string;
  code: string;
}

export interface DistrictItem {
  id: number;
  public_id: string;
  state: number;
  state_name: string;
  name: string;
  code: string;
}

export interface CityItem {
  id: number;
  public_id: string;
  district: number;
  district_name: string;
  name: string;
  location_type: string;
}

export interface PostalItem {
  postal_code: string;
  post_office_name: string;
  branch_type: string;
  district_name: string;
  state_name: string;
}

export interface LandingPlan {
  name: string;
  price: number | string;
  tagline?: string;
  desc?: string;
  highlight?: boolean;
  popular?: boolean;
  cta?: string;
  buttonText?: string;
  features: string[];
}

export interface LandingAddOn {
  name?: string;
  title?: string;
  price: string;
  desc: string;
}

export interface CustomerReview {
  id: number;
  public_id: string;
  author_name: string;
  business_name?: string;
  role_title?: string;
  rating: number;
  review_text: string;
  avatar_url?: string;
  status: "pending" | "approved" | "rejected";
  is_approved: boolean;
  created_at: string;
}

export interface PublicLandingData {
  pricing_plans: LandingPlan[];
  add_ons: LandingAddOn[];
  testimonials?: CustomerReview[];
  impact_stats: {
    lenders_count: number;
    collections_tracked: number;
    efficiency_lift: string;
  };
}

export const mastersService = {
  async getPublicLandingData(): Promise<PublicLandingData> {
    const res = await apiRequest<PublicLandingData>("/masters/public-landing/");
    return res.data;
  },

  async submitReview(data: {
    author_name: string;
    business_name?: string;
    role_title?: string;
    rating: number;
    review_text: string;
    avatar_url?: string;
  }): Promise<CustomerReview> {
    const res = await apiRequest<CustomerReview>("/masters/reviews/submit/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async submitContactInquiry(data: {
    first_name: string;
    last_name?: string;
    email: string;
    mobile_number: string;
    business_type?: string;
    message: string;
  }): Promise<void> {
    await apiRequest("/accounts/contact-us/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getCollectionFrequencies(): Promise<MasterItem[]> {
    const res = await apiRequest<MasterItem[]>("/masters/collection-frequencies/");
    return res.data;
  },

  async getInterestTypes(): Promise<MasterItem[]> {
    const res = await apiRequest<MasterItem[]>("/masters/interest-types/");
    return res.data;
  },

  async getPaymentModes(): Promise<MasterItem[]> {
    const res = await apiRequest<MasterItem[]>("/masters/payment-modes/");
    return res.data;
  },

  async getCollectionStatuses(): Promise<MasterItem[]> {
    const res = await apiRequest<MasterItem[]>("/masters/collection-statuses/");
    return res.data;
  },

  async getExpenseCategories(): Promise<MasterItem[]> {
    const res = await apiRequest<MasterItem[]>("/masters/expense-categories/");
    return res.data;
  },

  async getBusinessCategories(): Promise<MasterItem[]> {
    const res = await apiRequest<MasterItem[]>("/masters/business-categories/");
    return res.data;
  },

  async getStates(): Promise<StateItem[]> {
    const res = await apiRequest<StateItem[]>("/masters/states/");
    return res.data;
  },

  async getDistricts(stateId?: number | string): Promise<DistrictItem[]> {
    const query = stateId ? `?state_id=${stateId}` : "";
    const res = await apiRequest<DistrictItem[]>(`/masters/districts/${query}`);
    return res.data;
  },

  async getCities(districtId?: number | string): Promise<CityItem[]> {
    const query = districtId ? `?district_id=${districtId}` : "";
    const res = await apiRequest<CityItem[]>(`/masters/cities/${query}`);
    return res.data;
  },

  async lookupPostalCode(pin: string): Promise<PostalItem> {
    const res = await apiRequest<PostalItem>(`/masters/postal/?pin=${pin}`);
    return res.data;
  },
};
