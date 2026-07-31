// Super Admin Data File.
// All mock seed data has been removed. Live data is fetched from the Super Admin backend APIs.

export { inr } from "./utils";

export type Plan = "Free" | "Starter" | "Professional" | "Enterprise";
export type LenderStatus = "Active" | "Trial" | "Expired" | "Suspended";

export type Lender = {
  id: string;
  name: string;
  logo: string;
  owner: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  gst: string;
  registeredAt: string;
  plan: Plan;
  status: LenderStatus;
  renewalDate: string;
  businessType: string;
  employees: number;
  customers: number;
  loans: number;
  collections: number;
  storageUsedGB: number;
  storageLimitGB: number;
  apiUsage: number;
  apiLimit: number;
  monthlyRevenue: number;
  lastLogin: string;
};

export const lenders: Lender[] = [];

export const kpis = {
  totalLenders: 0,
  activeLenders: 0,
  trialAccounts: 0,
  expiredAccounts: 0,
  monthlyRevenue: 0,
  annualRevenue: 0,
  platformUsagePct: 0,
  apiRequests: 0,
  activeSessions: 0,
  storageUsedGB: 0,
  totalUsers: 0,
  supportTickets: 0,
};

export const revenueTrend: any[] = [];
export const planDistribution: any[] = [];
export const lenderGrowth: any[] = [];
export const apiRequestSeries: any[] = [];
export const storageSeries: any[] = [];
export const geoDistribution: any[] = [];
export const activities: any[] = [];
export const dashboardStats = { revenueThisMonth: 0 };
export const subscriptions: any[] = [];
export const planDetails: Record<Plan, any> = {
  Free: { price: 0, trial: "Forever free", cycle: "Monthly", support: "Community", storage: "1 GB", users: "1", apiLimit: "1,000 / mo", features: ["Up to 50 borrowers", "2 collection days / week", "Loan Calculator"] },
  Starter: { price: 499, trial: "14-day trial", cycle: "Monthly", support: "Standard", storage: "10 GB", users: "3", apiLimit: "10,000 / mo", features: ["Unlimited borrowers", "7 collection days / week", "Expense tracking", "CSV exports"] },
  Professional: { price: 1499, trial: "14-day trial", cycle: "Monthly", support: "Priority", storage: "50 GB", users: "10", apiLimit: "50,000 / mo", features: ["Multi-staff tracking", "GPS route mapping", "WhatsApp reminders", "Priority support"] },
  Enterprise: { price: 4999, trial: "Custom demo", cycle: "Annual", support: "Dedicated", storage: "500 GB", users: "Unlimited", apiLimit: "Unlimited", features: ["Multi-branch ERP", "Dedicated account manager", "Custom REST APIs", "SLA guarantee"] },
};
export const invoices: any[] = [];
export const notificationTemplates: any[] = [];
export const notifications: any[] = [];
export const auditLogs: any[] = [];
export const activeSessions: any[] = [];
export const apiKeys: any[] = [];
export const coupons: any[] = [];

export const systemHealth = {
  cpu: 0,
  memory: 0,
  disk: 0,
  server: { status: "Operational", uptime: "99.9%", region: "ap-south-1 (Mumbai)" },
  database: { status: "Operational", connections: 0, latencyMs: 0 },
  redis: { status: "Operational", hitRate: 0, memory: 0 },
  apiHealth: { status: "Operational", p95Ms: 0, errorRate: 0 },
  storage: { used: 0, limit: 1000, unit: "GB" },
  ssl: { status: "Valid", expiresIn: "240 days", issuer: "Let's Encrypt" },
  domain: { status: "Active", expiresIn: "310 days" },
  queue: { pending: 0, processed24h: 0, failed: 0 },
  emailService: { status: "Operational", delivered24h: 0, bounceRate: 0 },
  smsGateway: { status: "Operational", delivered24h: 0, failureRate: 0 },
  whatsapp: { status: "Operational", delivered24h: 0, failureRate: 0 },
  backgroundJobs: { running: 0, scheduled: 0, failed24h: 0 },
};

export const healthTimeSeries: any[] = [];
