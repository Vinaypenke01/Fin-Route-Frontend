// Field collector mobile app — seed data. Reuses the ERP dataset where possible
// and adds a few collector-scoped extras (attendance, announcements, sync queue).

import {
  customers as erpCustomers,
  loans as erpLoans,
  collections as erpCollections,
  employees,
  erpRoutes,
  expenses as erpExpenses,
  notifications as erpNotifications,
  inr,
  inrCompact,
} from "@/lib/erp-data";

export { inr, inrCompact };

const seed = (i: number, s = 1) => (Math.sin(i * 9277.31 + s * 71.13) + 1) / 2;
const pick = <T,>(i: number, arr: readonly T[], s = 1) => arr[Math.floor(seed(i, s) * arr.length)];

// The signed-in collector
export const me = {
  ...employees.find((e) => e.role === "Collector")!,
  designation: "Senior Field Collector",
  avatarInitials: "RS",
  code: "FC-102",
  joinedYears: 3,
  languages: ["English", "हिन्दी", "தமிழ்"],
  supervisor: "Manoj Sharma",
};

// 200 customers assigned to this collector (deterministic subset of ERP customers)
export const fieldCustomers = erpCustomers.slice(0, 200).map((c, i) => {
  const loan = erpLoans.find((l) => l.customerId === c.id) ?? erpLoans[i % erpLoans.length];
  const dueDay = Math.floor(seed(i, 11) * 30) - 5; // -5 (overdue) .. +25
  const isToday = dueDay >= 0 && dueDay <= 1;
  const isOverdue = dueDay < 0;
  const distanceKm = Math.round((0.3 + seed(i, 12) * 8) * 10) / 10;
  return {
    ...c,
    loanId: loan.id,
    installment: loan.installment,
    outstanding: loan.outstanding,
    frequency: loan.frequency,
    dueDate: new Date(Date.now() + dueDay * 86400000).toISOString().slice(0, 10),
    dueBadge: isOverdue ? "Overdue" : isToday ? "Due Today" : `${dueDay}d`,
    dueTone: isOverdue ? "danger" : isToday ? "warning" : "muted",
    distanceKm,
    visitStatus: pick(i, ["pending", "visited", "skipped", "pending", "pending"] as const, 13),
    lastRemark: pick(
      i,
      ["Paid on time", "Requested one-day extension", "Not at home — will retry", "Partial paid", "Contacted via UPI"] as const,
      14,
    ),
    photoSeed: (i * 37) % 100,
  };
});

// 1000 collection records the field app cares about (from ERP but scoped to me)
export const fieldCollections = erpCollections.slice(0, 1000).map((c, i) => ({
  ...c,
  receipt: `RCPT-${String(600001 + i)}`,
  paymentIcon: c.mode as string,
}));

// Today's route — sequence of ~14 customers
export const todaysRoute = {
  ...erpRoutes[0],
  name: "HSR Layout · Route 1",
  startTime: "09:15",
  eta: "18:30",
  stops: fieldCustomers.slice(0, 14).map((c, i) => ({
    seq: i + 1,
    customer: c,
    status:
      i < 4 ? ("done" as const) : i === 4 ? ("current" as const) : i === 7 ? ("skipped" as const) : ("upcoming" as const),
    eta: `${9 + Math.floor(i * 0.6)}:${String((i * 17) % 60).padStart(2, "0")}`,
  })),
};

// 30 attendance records
const monthNow = new Date();
export const attendance = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(monthNow);
  d.setDate(d.getDate() - i);
  const weekend = d.getDay() === 0;
  const late = seed(i, 21) > 0.85;
  return {
    date: d.toISOString().slice(0, 10),
    checkIn: weekend ? null : late ? "09:42" : "09:0" + Math.floor(seed(i, 22) * 9),
    checkOut: weekend ? null : "18:" + String(10 + Math.floor(seed(i, 23) * 40)).slice(0, 2),
    hours: weekend ? 0 : Math.round((8 + seed(i, 24) * 2) * 10) / 10,
    status: weekend ? ("off" as const) : late ? ("late" as const) : seed(i, 25) > 0.95 ? ("absent" as const) : ("present" as const),
    location: "HSR Layout, Bengaluru",
  };
});

// 100 expenses attributed to this collector
export const fieldExpenses = erpExpenses.slice(0, 100);

// Cash handover history (last 20 days)
export const handovers = Array.from({ length: 20 }, (_, i) => {
  const expected = 8000 + Math.floor(seed(i, 31) * 24000);
  const collected = Math.round(expected * (0.82 + seed(i, 32) * 0.2));
  const exp = Math.floor(seed(i, 33) * 1200);
  const submitted = collected - exp + Math.round((seed(i, 34) - 0.5) * 400);
  const diff = submitted - (collected - exp);
  return {
    id: `HND-${String(500001 + i)}`,
    date: new Date(Date.now() - (i + 1) * 86400000).toISOString().slice(0, 10),
    expected,
    collected,
    expenses: exp,
    submitted,
    difference: diff,
    status: diff === 0 ? ("matched" as const) : diff > 0 ? ("excess" as const) : ("short" as const),
    approver: "Manoj Sharma",
  };
});

// Notifications for the collector (50)
export const fieldNotifications = notificationsForField();
function notificationsForField() {
  const templates: Array<{ type: "due" | "message" | "loan" | "reminder" | "attendance" | "expense" | "announcement"; title: string; desc: string; icon: string }> = [
    { type: "due", title: "12 due today", desc: "HSR Layout · Route 1 has 12 customers due", icon: "bell" },
    { type: "message", title: "Manoj Sharma", desc: "Please prioritise Sunita Verma's collection today.", icon: "message" },
    { type: "loan", title: "New loan disbursed", desc: "Amit Patel's ₹35,000 loan is now active", icon: "wallet" },
    { type: "reminder", title: "Collection reminder", desc: "Kavita Reddy hasn't paid this week", icon: "clock" },
    { type: "attendance", title: "Mark attendance", desc: "Don't forget to check-in before 9:30 AM", icon: "user" },
    { type: "expense", title: "Expense approved", desc: "Fuel ₹450 approved by Accounts", icon: "receipt" },
    { type: "announcement", title: "Team meeting Friday 6 PM", desc: "Monthly review at Bengaluru HQ", icon: "megaphone" },
  ];
  return Array.from({ length: 50 }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      id: `N-${String(700001 + i)}`,
      ...t,
      time: `${1 + (i % 23)}h ago`,
      unread: i < 8,
    };
  });
}

// 25 manager announcements
export const announcements = Array.from({ length: 25 }, (_, i) => ({
  id: `ANN-${String(800001 + i)}`,
  title: pick(
    i,
    [
      "Diwali holiday schedule",
      "Revised interest rate — Weekly loans",
      "New training module released",
      "Uniform distribution on Saturday",
      "Bengaluru branch relocated",
      "Incentive scheme launched",
    ] as const,
    41,
  ),
  by: "Manoj Sharma",
  date: new Date(Date.now() - i * 86400000 * 2).toISOString().slice(0, 10),
  read: i > 4,
  body: "Please read the full announcement in the app. Contact your area manager for any clarification.",
}));

// 12 months performance analytics
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const performanceMonthly = months.map((m, i) => ({
  month: m,
  target: 260000 + i * 8000,
  collected: 200000 + Math.floor(seed(i, 51) * 140000),
  visits: 380 + Math.floor(seed(i, 52) * 120),
  success: 70 + Math.round(seed(i, 53) * 25),
}));
export const performanceWeekly = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  collected: 42000 + Math.floor(seed(i, 61) * 22000),
}));
export const performanceDaily = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  collected: 5200 + Math.floor(seed(i, 71) * 6800),
  visits: 8 + Math.floor(seed(i, 72) * 12),
}));

// Sync queue (offline scenario)
export const syncQueue = [
  { id: "Q1", type: "Collection", label: "Ravi Kumar · ₹1,200 · Cash", time: "2m ago", state: "pending" as const },
  { id: "Q2", type: "Collection", label: "Priya Sharma · ₹850 · UPI", time: "9m ago", state: "pending" as const },
  { id: "Q3", type: "Expense", label: "Fuel · ₹300", time: "14m ago", state: "conflict" as const },
  { id: "Q4", type: "Visit", label: "Sunita Verma · Skipped", time: "22m ago", state: "pending" as const },
];

// KPIs for dashboard
export const fieldKpis = {
  assigned: todaysRoute.stops.length + 4,
  collectionsToday: 9,
  expected: 21400,
  collected: 14650,
  pendingVisits: 5,
  completedVisits: 9,
  expensesToday: 780,
  cashInHand: 13870,
  routeCompletionPct: 64,
  performanceScore: 87,
};

// Payment modes
export const paymentModes = [
  { id: "cash", label: "Cash", desc: "Physical cash" },
  { id: "upi", label: "UPI", desc: "GPay · PhonePe · Paytm" },
  { id: "bank", label: "Bank", desc: "IMPS / NEFT" },
  { id: "wallet", label: "Wallet", desc: "Digital wallet" },
  { id: "cheque", label: "Cheque", desc: "Bank cheque" },
] as const;

export const skipReasons = [
  "Not at home",
  "Requested to visit tomorrow",
  "No cash available today",
  "Traveling out of station",
  "Medical emergency",
  "Business closed",
  "Insufficient funds",
  "Family function",
  "Phone switched off",
  "Wrong address",
] as const;
