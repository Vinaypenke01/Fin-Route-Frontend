// FinRoute Clean Data File.
// Operational mock seed data has been removed. Live data is fetched from the Django REST API.

export { inr } from "./utils";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  loanAmount: number;
  installment: number;
  frequency: "Daily" | "Weekly" | "Monthly";
  outstanding: number;
  paid: number;
  totalPayable: number;
  status: "Active" | "Overdue" | "Closed";
  startDate: string;
  endDate: string;
  purpose: string;
  avatarColor: string;
};

export const customers: Customer[] = [];

export type Collection = {
  id: string;
  receiptNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  area: string;
  expected: number;
  collected: number;
  date: string;
  time: string;
  mode: "Cash" | "UPI" | "Bank Transfer";
  status: "Full" | "Partial" | "Missed";
  notes?: string;
};

export const collections: Collection[] = [];

export type Expense = {
  id: string;
  category: "Petrol / Fuel" | "Office Supplies" | "Food / Tea" | "Travel / Auto" | "Staff Salary" | "Other";
  amount: number;
  date: string;
  notes: string;
  loggedBy: string;
};

export const expenses: Expense[] = [];

export const kpis = {
  todayCollection: 0,
  expectedToday: 0,
  todayExpense: 0,
  outstandingAmount: 0,
  totalActive: 0,
  collectionPct: 0,
};

export const collectionTrend: any[] = [];
export const monthlyCollections: any[] = [];
export const expenseBreakdown: any[] = [];
export const activities: any[] = [];
export const upcomingDues: any[] = [];
export const notifications: any[] = [];

// Landing page static marketing copy
export const trustedCompanies = ["Sharma Finance", "Balaji Capital", "Lakshmi Money", "Surya Fincorp"];

export const features = [
  { icon: "Wallet", title: "Digital Collection Book", desc: "Replace paper notebooks with live collection recording." },
  { icon: "Calculator", title: "Smart Loan Calculator", desc: "Instant daily, weekly, and monthly interest schedules." },
  { icon: "FileBarChart", title: "Realtime Reports", desc: "Export CSV and PDF reports for your finance business." },
];

export const testimonials = [
  { name: "Rajesh Sharma", role: "Proprietor, Sharma Finance", quote: "FinRoute made our daily collection tracking completely seamless.", initials: "RS" },
  { name: "Suresh Patel", role: "Owner, Balaji Fincorp", quote: "Field agents submit daily cash handovers on time without manual ledger entry errors.", initials: "SP" },
];

export const faqs = [
  {
    q: "Is the Guest Workspace really free forever?",
    a: "Yes! The Guest Workspace is 100% free with no credit card required. You can manage up to 50 active borrowers, log daily/weekly collections, track operational expenses, and calculate net cash flow at zero cost.",
  },
  {
    q: "Does FinRoute collect borrower repayments or hold money on my behalf?",
    a: "No. FinRoute is strictly a software record-management and business analytics tool. You collect repayments directly from your borrowers via Cash, UPI, or Bank Transfer. FinRoute does not process, hold, or transfer borrower funds.",
  },
  {
    q: "How does FinRoute handle skipped or delayed payments on collection day?",
    a: "When a borrower skips payment, you can mark their status as 'Skipped' during collection recording. Payment mode and collected amount will automatically set to ₹0, ensuring your total collected revenue and net cash metrics remain 100% accurate without artificial inflation.",
  },
  {
    q: "Can I generate PDF passbooks and WhatsApp collection receipts?",
    a: "Yes! For every recorded payment or borrower account, you can generate a digital receipt or passbook and share it directly with the customer via WhatsApp or print a hard copy.",
  },
  {
    q: "Is my finance data and borrower information private and secure?",
    a: "Absolutely. Your workspace data is completely isolated, encrypted with HTTPS in transit, and secured with role-based access controls. We never sell or share your borrower records.",
  },
  {
    q: "Can I upgrade to the full Multi-Agent ERP as my business grows?",
    a: "Yes! You can upgrade anytime to unlock unlimited borrowers, field agent collector logins, live GPS route suggestions, and multi-branch agency reports.",
  },
  {
    q: "Can I export my financial data for accounting?",
    a: "Yes, you can export your daily net summaries, collection registers, and expense vouchers as CSV or PDF at any time with a single click.",
  },
  {
    q: "What is FinRoute's subscription cancellation and refund policy?",
    a: "Paid subscriptions can be canceled anytime from your account settings. For billing queries or refund requests due to duplicate charges, you can contact support@finroute.in.",
  },
];

export const pricingPlans = [
  {
    name: "Guest Free",
    price: 0,
    tagline: "Perfect for single lenders starting out",
    desc: "Perfect for single lenders starting out",
    features: ["Up to 50 active customers", "2 collection days / week", "Loan Calculator", "CSV Reports"],
    cta: "Start Free",
    buttonText: "Start Free",
    highlight: false,
    popular: false,
  },
  {
    name: "Guest Premium",
    price: 499,
    tagline: "For growing finance businesses",
    desc: "For growing finance businesses",
    features: ["Unlimited customers", "7 collection days / week", "Expense Tracking", "Priority Support"],
    cta: "Upgrade to Premium",
    buttonText: "Upgrade to Premium",
    highlight: true,
    popular: true,
  },
];

export const addOns = [
  { name: "WhatsApp Reminders", title: "WhatsApp Reminders", price: "₹199/mo", desc: "Send automated payment reminders to borrowers via WhatsApp." },
];
