// FinRoute Lender ERP — static seed data. Deterministic (seeded) so lists are stable.
// All values are Indian-localised (₹, mobile, addresses, GST).

export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const inrCompact = (n: number) => {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "k";
  return "₹" + n;
};

const rand = (i: number, s = 1) => (Math.sin(i * 9973.13 + s * 131.7) + 1) / 2;
const pick = <T>(i: number, arr: readonly T[], s = 1) => arr[Math.floor(rand(i, s) * arr.length)];

const firstNames = [
  "Rajesh","Priya","Amit","Sunita","Vikram","Anjali","Suresh","Meena","Ravi","Kavita",
  "Manoj","Deepa","Sanjay","Pooja","Arun","Neha","Kiran","Rekha","Mahesh","Lakshmi",
  "Prakash","Shweta","Ganesh","Nisha","Ramesh","Divya","Ashok","Geeta","Naveen","Sarita",
  "Vinod","Anita","Dinesh","Radha","Rakesh","Jyoti","Mohan","Usha","Pankaj","Seema",
  "Tarun","Bhavna","Nitin","Rani","Anil","Mala","Sachin","Prerna","Harish","Shalini",
];
const lastNames = [
  "Sharma","Verma","Patel","Kumar","Singh","Reddy","Iyer","Nair","Gupta","Joshi",
  "Mehta","Shah","Rao","Menon","Chopra","Kapoor","Malhotra","Bansal","Agarwal","Yadav",
];
const cities = ["Bengaluru","Chennai","Hyderabad","Mumbai","Pune","Delhi","Coimbatore","Kochi","Ahmedabad","Jaipur"];
const areaNames = [
  "MG Road","Anna Nagar","Koramangala","Jubilee Hills","Bandra East","T Nagar","Whitefield","Salt Lake","Andheri West","Camp",
  "HSR Layout","Adyar","Banjara Hills","Vashi","Kothrud","Malviya Nagar","RS Puram","Fort Kochi","Navrangpura","Malviya Marg",
  "Indiranagar","Velachery","Gachibowli","Powai","Baner",
];
const purposes = ["Business Expansion","Working Capital","Vehicle Purchase","Home Renovation","Wedding","Medical","Education","Shop Setup","Inventory","Equipment"];
const modes = ["Cash","UPI","Bank Transfer","Cheque"] as const;
const tagsPool = ["VIP","New","Referral","High Risk","Repeat","Loyal","Salary","Business"];

function name(i: number) {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[Math.floor(rand(i, 3) * lastNames.length)];
  return `${fn} ${ln}`;
}
function mobile(i: number) {
  const n = 6000000000 + Math.floor(rand(i, 5) * 3999999999);
  return "+91 " + String(n).slice(0, 5) + " " + String(n).slice(5);
}
function gstin(i: number) {
  const s = "27ABCDE" + String(1000 + Math.floor(rand(i, 8) * 8999)) + "F1Z" + Math.floor(rand(i, 9) * 9);
  return s.slice(0, 15).toUpperCase();
}
function aadhaar(i: number) {
  const n = Math.floor(1000 + rand(i, 12) * 8999);
  return `XXXX XXXX ${n}`;
}
function date(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

// ================= Areas =================
export type Area = {
  id: string; name: string; city: string; pincode: string;
  customers: number; loans: number; outstanding: number; collectionPct: number;
  collectorId: string; routes: number;
};
export const areas: Area[] = Array.from({ length: 25 }, (_, i) => ({
  id: `AR-${(1001 + i).toString()}`,
  name: areaNames[i % areaNames.length] + (i >= areaNames.length ? " Ext." : ""),
  city: cities[i % cities.length],
  pincode: String(500001 + Math.floor(rand(i, 21) * 99998)),
  customers: 8 + Math.floor(rand(i, 22) * 45),
  loans: 12 + Math.floor(rand(i, 23) * 60),
  outstanding: Math.round((50000 + rand(i, 24) * 950000) / 1000) * 1000,
  collectionPct: 70 + Math.round(rand(i, 25) * 28),
  collectorId: `EMP-${(2001 + (i % 30)).toString()}`,
  routes: 1 + Math.floor(rand(i, 26) * 3),
}));

// ================= Employees =================
export type Employee = {
  id: string; name: string; role: "Collector" | "Manager" | "Accountant" | "Field Officer" | "Support";
  phone: string; email: string; area: string; joined: string; salary: number;
  status: "Active" | "On Leave" | "Inactive"; attendance: number; performance: number;
  routesAssigned: number; areasAssigned: number; gps: "Online" | "Offline" | "Idle";
  emergencyContact: string;
};
const roles: Employee["role"][] = ["Collector","Collector","Collector","Manager","Accountant","Field Officer","Support"];
export const employees: Employee[] = Array.from({ length: 75 }, (_, i) => {
  const n = name(i + 200);
  const role = roles[i % roles.length];
  return {
    id: `EMP-${(2001 + i).toString()}`,
    name: n,
    role,
    phone: mobile(i + 200),
    email: n.toLowerCase().replace(/\s+/g, ".") + "@finroute.example",
    area: areas[i % areas.length].name,
    joined: date(60 + Math.floor(rand(i, 41) * 900)),
    salary: 12000 + Math.floor(rand(i, 42) * 38000),
    status: rand(i, 43) > 0.9 ? "On Leave" : rand(i, 44) > 0.96 ? "Inactive" : "Active",
    attendance: 78 + Math.round(rand(i, 45) * 22),
    performance: 60 + Math.round(rand(i, 46) * 40),
    routesAssigned: role === "Collector" ? 1 + Math.floor(rand(i, 47) * 3) : 0,
    areasAssigned: role === "Collector" ? 1 + Math.floor(rand(i, 48) * 2) : 0,
    gps: role === "Collector" ? (rand(i, 49) > 0.6 ? "Online" : rand(i, 50) > 0.5 ? "Idle" : "Offline") : "Offline",
    emergencyContact: mobile(i + 500),
  };
});

// ================= Customers =================
export type Customer = {
  id: string; name: string; phone: string; email: string; area: string; city: string;
  address: string; aadhaar: string; rating: number; tags: string[];
  activeLoans: number; totalBorrowed: number; outstanding: number; paid: number;
  joined: string; lastContact: string;
  status: "Active" | "Overdue" | "Closed" | "Prospect";
  guarantor: string; guarantorPhone: string; occupation: string;
};
const occupations = ["Shop Owner","Trader","Farmer","Driver","Salaried","Contractor","Small Business","Vendor"];
export const customers: Customer[] = Array.from({ length: 500 }, (_, i) => {
  const n = name(i);
  const area = areas[i % areas.length];
  const paid = Math.round((5000 + rand(i, 61) * 145000) / 100) * 100;
  const outstanding = Math.round((rand(i, 62) * 120000) / 100) * 100;
  const totalBorrowed = paid + outstanding + Math.round(rand(i, 63) * 40000);
  const active = 1 + Math.floor(rand(i, 64) * 3);
  const st = rand(i, 65);
  const status: Customer["status"] = outstanding === 0 ? "Closed" : st > 0.82 ? "Overdue" : st > 0.05 ? "Active" : "Prospect";
  return {
    id: `CUST-${(10001 + i).toString()}`,
    name: n,
    phone: mobile(i),
    email: n.toLowerCase().replace(/\s+/g, ".") + "@mail.example",
    area: area.name,
    city: area.city,
    address: `${100 + (i % 800)}, ${area.name}, ${area.city} ${area.pincode}`,
    aadhaar: aadhaar(i),
    rating: Math.round((3 + rand(i, 66) * 2) * 10) / 10,
    tags: [pick(i, tagsPool, 67), pick(i, tagsPool, 68)].filter((v, ix, a) => a.indexOf(v) === ix),
    activeLoans: active,
    totalBorrowed, outstanding, paid,
    joined: date(30 + Math.floor(rand(i, 69) * 900)),
    lastContact: date(Math.floor(rand(i, 70) * 40)),
    status,
    guarantor: name(i + 900),
    guarantorPhone: mobile(i + 900),
    occupation: pick(i, occupations, 71),
  };
});

// ================= Loans =================
export type Loan = {
  id: string; customerId: string; customerName: string; area: string;
  principal: number; interestPct: number; term: number;
  frequency: "Daily" | "Weekly" | "Monthly"; installment: number;
  totalPayable: number; paid: number; outstanding: number;
  startDate: string; endDate: string; purpose: string;
  status: "Pending" | "Approved" | "Active" | "Overdue" | "Closed" | "Rejected" | "Defaulted";
  penaltyAccrued: number;
};
const statuses: Loan["status"][] = ["Pending","Approved","Active","Active","Active","Overdue","Closed","Rejected","Defaulted"];
export const loans: Loan[] = Array.from({ length: 1000 }, (_, i) => {
  const cust = customers[i % customers.length];
  const principal = Math.round((10000 + rand(i, 81) * 490000) / 500) * 500;
  const freq = (["Daily","Weekly","Monthly"] as const)[i % 3];
  const term = freq === "Daily" ? 100 : freq === "Weekly" ? 20 : 12;
  const interestPct = [18, 24, 30, 36][i % 4];
  const totalPayable = Math.round(principal * (1 + (interestPct / 100) * (term / (freq === "Daily" ? 365 : freq === "Weekly" ? 52 : 12))));
  const paidRatio = rand(i, 82);
  const paid = Math.round(totalPayable * paidRatio);
  const outstanding = Math.max(0, totalPayable - paid);
  const status = outstanding === 0 ? "Closed" : statuses[i % statuses.length];
  return {
    id: `LN-${(50001 + i).toString()}`,
    customerId: cust.id, customerName: cust.name, area: cust.area,
    principal, interestPct, term, frequency: freq,
    installment: Math.round(totalPayable / term),
    totalPayable, paid, outstanding,
    startDate: date(30 + Math.floor(rand(i, 83) * 400)),
    endDate: date(-Math.floor(rand(i, 84) * 200)),
    purpose: pick(i, purposes, 85),
    status,
    penaltyAccrued: status === "Overdue" || status === "Defaulted" ? Math.round(rand(i, 86) * 5000) : 0,
  };
});

// ================= Collections =================
export type Collection = {
  id: string; loanId: string; customerId: string; customerName: string; area: string;
  date: string; expected: number; collected: number; mode: typeof modes[number];
  collectorId: string; collectorName: string;
  status: "Paid" | "Partial" | "Skipped" | "Pending";
  remarks: string; gps: string; timestamp: string;
};
const remarksList = ["Paid full","Partial – balance next visit","Not at home","Postponed to tomorrow","Insufficient funds","Traveling","Medical emergency","Disputed amount"];
export const collections: Collection[] = Array.from({ length: 5000 }, (_, i) => {
  const loan = loans[i % loans.length];
  const expected = loan.installment;
  const r = rand(i, 91);
  const status: Collection["status"] = r > 0.7 ? "Paid" : r > 0.5 ? "Partial" : r > 0.35 ? "Skipped" : "Pending";
  const collected = status === "Paid" ? expected : status === "Partial" ? Math.round(expected * (0.3 + rand(i, 92) * 0.5)) : 0;
  const emp = employees[i % employees.length];
  return {
    id: `COL-${(300001 + i).toString()}`,
    loanId: loan.id, customerId: loan.customerId, customerName: loan.customerName, area: loan.area,
    date: date(Math.floor(rand(i, 93) * 120)),
    expected, collected, mode: modes[i % modes.length],
    collectorId: emp.id, collectorName: emp.name,
    status,
    remarks: pick(i, remarksList, 94),
    gps: `${(12.9 + rand(i, 95) * 0.3).toFixed(4)}, ${(77.5 + rand(i, 96) * 0.3).toFixed(4)}`,
    timestamp: `${8 + Math.floor(rand(i, 97) * 10)}:${String(Math.floor(rand(i, 98) * 60)).padStart(2, "0")}`,
  };
});

// ================= Routes =================
export type RouteRow = {
  id: string; name: string; area: string; collectorId: string; collectorName: string;
  customers: number; distanceKm: number; estimatedMin: number;
  status: "Planned" | "In Progress" | "Completed" | "Delayed";
  completion: number; expected: number; collected: number;
};
export const erpRoutes: RouteRow[] = Array.from({ length: 40 }, (_, i) => {
  const area = areas[i % areas.length];
  const emp = employees.filter((e) => e.role === "Collector")[i % 25];
  const customersCt = 6 + Math.floor(rand(i, 101) * 18);
  const completion = Math.floor(rand(i, 102) * 100);
  return {
    id: `RT-${(4001 + i).toString()}`,
    name: `${area.name} · Route ${1 + (i % 3)}`,
    area: area.name,
    collectorId: emp.id, collectorName: emp.name,
    customers: customersCt,
    distanceKm: Math.round((3 + rand(i, 103) * 22) * 10) / 10,
    estimatedMin: 60 + Math.floor(rand(i, 104) * 200),
    status: completion === 100 ? "Completed" : completion > 60 ? "In Progress" : rand(i, 105) > 0.85 ? "Delayed" : "Planned",
    completion,
    expected: 5000 + Math.floor(rand(i, 106) * 45000),
    collected: Math.floor((5000 + rand(i, 106) * 45000) * (completion / 100)),
  };
});

// ================= Expenses =================
export type Expense = {
  id: string; date: string; category: string; note: string;
  paidBy: string; amount: number; mode: typeof modes[number];
  status: "Approved" | "Pending" | "Rejected"; receipt: boolean;
};
const expCats = ["Fuel","Salary","Travel","Office","Marketing","Internet","Utilities","Maintenance","Other"];
export const expenses: Expense[] = Array.from({ length: 500 }, (_, i) => ({
  id: `EXP-${(70001 + i).toString()}`,
  date: date(Math.floor(rand(i, 111) * 120)),
  category: expCats[i % expCats.length],
  note: `${expCats[i % expCats.length]} — ${pick(i, ["monthly","team","branch","field","office","utility"], 112)}`,
  paidBy: employees[i % employees.length].name,
  amount: Math.round((300 + rand(i, 113) * 9700) / 50) * 50,
  mode: modes[i % modes.length],
  status: rand(i, 114) > 0.85 ? "Pending" : rand(i, 115) > 0.95 ? "Rejected" : "Approved",
  receipt: rand(i, 116) > 0.3,
}));

// ================= Reconciliation =================
export type Reconciliation = {
  id: string; date: string; collectorId: string; collectorName: string;
  expected: number; collected: number; submitted: number; shortage: number; excess: number;
  status: "Reconciled" | "Pending" | "Discrepancy"; remarks: string;
};
export const reconciliations: Reconciliation[] = Array.from({ length: 100 }, (_, i) => {
  const emp = employees.filter((e) => e.role === "Collector")[i % 25];
  const expected = 5000 + Math.floor(rand(i, 121) * 45000);
  const collected = Math.round(expected * (0.7 + rand(i, 122) * 0.35));
  const submitted = Math.round(collected * (0.9 + rand(i, 123) * 0.12));
  const diff = submitted - collected;
  return {
    id: `REC-${(90001 + i).toString()}`,
    date: date(i),
    collectorId: emp.id, collectorName: emp.name,
    expected, collected, submitted,
    shortage: diff < 0 ? -diff : 0,
    excess: diff > 0 ? diff : 0,
    status: diff === 0 ? "Reconciled" : rand(i, 124) > 0.7 ? "Pending" : "Discrepancy",
    remarks: diff === 0 ? "All matched" : diff > 0 ? "Excess deposited" : "Shortage — under review",
  };
});

// ================= Notifications =================
export type NotificationRow = {
  id: string; type: "reminder" | "approval" | "alert" | "info" | "salary";
  title: string; desc: string; time: string; unread: boolean;
};
const notifTemplates = [
  { type: "reminder", title: "Collection due today", desc: "12 customers scheduled in HSR Layout route" },
  { type: "approval", title: "Loan approval pending", desc: "New loan of ₹45,000 awaiting review" },
  { type: "alert", title: "Overdue: ₹28,500", desc: "Sunita Verma is 8 days overdue" },
  { type: "info", title: "Route completed", desc: "Anna Nagar route wrapped early" },
  { type: "salary", title: "Payroll ready", desc: "September payroll ready to disburse" },
  { type: "approval", title: "Expense approval", desc: "Fuel expense ₹2,400 needs sign-off" },
  { type: "alert", title: "Cash shortage flagged", desc: "Collector Ravi K. submitted ₹1,200 short" },
] as const;
export const notifications: NotificationRow[] = Array.from({ length: 50 }, (_, i) => {
  const t = notifTemplates[i % notifTemplates.length];
  return {
    id: `NTF-${(80001 + i).toString()}`,
    type: t.type,
    title: t.title,
    desc: t.desc,
    time: `${1 + (i % 12)}h ago`,
    unread: i < 12,
  };
});

// ================= Analytics (12 months) =================
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const revenueTrend = months.map((m, i) => ({
  month: m,
  revenue: 850000 + Math.floor(rand(i, 131) * 700000),
  target: 1000000 + i * 40000,
  profit: 250000 + Math.floor(rand(i, 132) * 350000),
}));
export const collectionsTrend = months.map((m, i) => ({
  month: m,
  expected: 1200000 + i * 30000,
  collected: 900000 + Math.floor(rand(i, 133) * 500000),
}));
export const dailyCollections = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  amount: 30000 + Math.floor(rand(i, 141) * 60000),
}));
export const weeklyCollections = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  amount: 220000 + Math.floor(rand(i, 142) * 180000),
}));
export const loanDistribution = [
  { name: "Daily", value: 420 },
  { name: "Weekly", value: 320 },
  { name: "Monthly", value: 260 },
];
export const outstandingTrend = months.map((m, i) => ({
  month: m,
  outstanding: 1800000 + Math.floor(rand(i, 143) * 600000),
}));
export const customerGrowth = months.map((m, i) => ({
  month: m,
  new: 25 + Math.floor(rand(i, 144) * 40),
  active: 380 + i * 12,
}));
export const areaPerformance = areas.slice(0, 8).map((a) => ({
  name: a.name.length > 12 ? a.name.slice(0, 12) : a.name,
  collected: Math.round(a.outstanding * (a.collectionPct / 100) / 1000),
  pct: a.collectionPct,
}));
export const employeePerformance = employees.filter((e) => e.role === "Collector").slice(0, 8).map((e) => ({
  name: e.name.split(" ")[0],
  perf: e.performance,
}));

// ================= Payroll =================
export type PayrollRow = {
  id: string; employeeId: string; name: string; role: Employee["role"];
  base: number; overtime: number; bonus: number; incentive: number; deductions: number; net: number;
  month: string; status: "Paid" | "Pending" | "Processing";
};
export const payroll: PayrollRow[] = employees.map((e, i) => {
  const base = e.salary;
  const overtime = Math.floor(rand(i, 151) * 3000);
  const bonus = Math.floor(rand(i, 152) * 4000);
  const incentive = Math.floor(rand(i, 153) * 5000);
  const deductions = Math.floor(rand(i, 154) * 2500);
  return {
    id: `PAY-${(60001 + i).toString()}`,
    employeeId: e.id, name: e.name, role: e.role,
    base, overtime, bonus, incentive, deductions,
    net: base + overtime + bonus + incentive - deductions,
    month: "Sep 2026",
    status: rand(i, 155) > 0.75 ? "Pending" : rand(i, 156) > 0.9 ? "Processing" : "Paid",
  };
});

// ================= KPIs =================
export const kpis = {
  todayCollections: 128500,
  expectedCollections: 165000,
  outstanding: 4820000,
  activeCustomers: customers.filter((c) => c.status === "Active").length,
  activeLoans: loans.filter((l) => l.status === "Active").length,
  employees: employees.length,
  collectorsOnField: employees.filter((e) => e.gps === "Online").length,
  todayExpenses: 18400,
  cashBalance: 342000,
  profit: 92500,
  collectionPct: 78,
  loanRecoveryPct: 84,
  routeCompletionPct: 71,
  newCustomersThisMonth: 42,
  overdueLoans: loans.filter((l) => l.status === "Overdue").length,
  pendingApprovals: loans.filter((l) => l.status === "Pending").length,
};

export const business = {
  name: "Sharma Finance Pvt. Ltd.",
  legal: "Sharma Finance Private Limited",
  gst: "29ABCDE1234F1Z5",
  cin: "U65999KA2018PTC112345",
  pan: "ABCDE1234F",
  address: "42, MG Road, Bengaluru, Karnataka 560001",
  phone: "+91 80 4567 8900",
  email: "hello@sharmafinance.in",
  website: "https://sharmafinance.in",
  currency: "INR (₹)",
  timezone: "Asia/Kolkata (IST)",
  workingHours: "09:00 – 19:00",
  branches: [
    { id: "BR-01", name: "Bengaluru HQ", city: "Bengaluru", staff: 42, active: true },
    { id: "BR-02", name: "Chennai Branch", city: "Chennai", staff: 18, active: true },
    { id: "BR-03", name: "Hyderabad Branch", city: "Hyderabad", staff: 15, active: true },
  ],
  rules: {
    penaltyPct: 2,
    graceDays: 3,
    interestModel: "Simple Interest",
    minLoan: 5000,
    maxLoan: 500000,
  },
};
