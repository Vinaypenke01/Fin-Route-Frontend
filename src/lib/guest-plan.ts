// Client-side mock config for the Guest Workspace free/premium plan limits.
// All state is kept in localStorage so it works without a backend.

export type PlanLimits = {
  businessDaysPerWeek: number; // how many days per week a guest can operate
  customersPerWeek: number; // new customers a guest can add per week
  collectionsPerDay: number; // safety cap on daily collections
};

export type PlanTier = "free" | "premium";

export const FREE_LIMITS: PlanLimits = {
  businessDaysPerWeek: 1,
  customersPerWeek: 0, // 0 = Unlimited
  collectionsPerDay: 500,
};

export const DEFAULT_PREMIUM_LIMITS: PlanLimits = {
  businessDaysPerWeek: 7,
  customersPerWeek: 500,
  collectionsPerDay: 500,
};

// Mock: current signed-in guest user id (in a real app this comes from auth).
export const CURRENT_GUEST_ID = "guest-rajesh";

const LS_ADMIN = "finroute-admin-plans-v1";
const LS_USER_PLAN = "finroute-guest-plan-v1"; // { tier }
const LS_USAGE = "finroute-guest-usage-v1"; // { weekKey, days, customersAdded }
const LS_ACTIVITY = "finroute-admin-plan-activity-v1";

export type AdminConfig = {
  free: PlanLimits;
  premium: PlanLimits;
  overrides: Record<string, Partial<PlanLimits> & { note?: string; tier?: PlanTier }>;
};

const isBrowser = () => typeof window !== "undefined";

export function weekKey(d = new Date()): string {
  // ISO week key: YYYY-Www
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+t - +yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Start (Monday) of the current ISO week in local time.
export function weekStart(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay() || 7; // Sun=0 -> 7
  x.setDate(x.getDate() - (day - 1));
  return x;
}

// Next Monday 00:00 local — used as "next available" for weekly resets.
export function nextWeekStart(d = new Date()): Date {
  const s = weekStart(d);
  s.setDate(s.getDate() + 7);
  return s;
}

export function formatNextReset(d: Date = nextWeekStart()): string {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

// Ordered Mon..Sun days for the current week as YYYY-MM-DD.
export function currentWeekDays(d = new Date()): string[] {
  const s = weekStart(d);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(s);
    x.setDate(s.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

export function getAdminConfig(): AdminConfig {
  if (!isBrowser()) return { free: FREE_LIMITS, premium: DEFAULT_PREMIUM_LIMITS, overrides: {} };
  try {
    const raw = localStorage.getItem(LS_ADMIN);
    if (!raw) return { free: FREE_LIMITS, premium: DEFAULT_PREMIUM_LIMITS, overrides: {} };
    const parsed = JSON.parse(raw);
    return {
      free: { ...FREE_LIMITS, ...(parsed.free ?? {}) },
      premium: { ...DEFAULT_PREMIUM_LIMITS, ...(parsed.premium ?? {}) },
      overrides: parsed.overrides ?? {},
    };
  } catch {
    return { free: FREE_LIMITS, premium: DEFAULT_PREMIUM_LIMITS, overrides: {} };
  }
}

export function setAdminConfig(cfg: AdminConfig) {
  if (!isBrowser()) return;
  localStorage.setItem(LS_ADMIN, JSON.stringify(cfg));
  window.dispatchEvent(new Event("guest-plan-change"));
}

export function getUserTier(): PlanTier {
  if (!isBrowser()) return "free";
  try {
    return (JSON.parse(localStorage.getItem(LS_USER_PLAN) || "{}").tier as PlanTier) || "free";
  } catch {
    return "free";
  }
}

export function setUserTier(tier: PlanTier) {
  if (!isBrowser()) return;
  localStorage.setItem(LS_USER_PLAN, JSON.stringify({ tier }));
  window.dispatchEvent(new Event("guest-plan-change"));
}

export type EffectiveLimits = PlanLimits & {
  tier: PlanTier;
  overridden: boolean;
  overrideNote?: string;
};

export function getEffectiveLimits(userId: string = CURRENT_GUEST_ID): EffectiveLimits {
  const admin = getAdminConfig();
  const tier = getUserTier();
  const base = tier === "premium" ? admin.premium : admin.free;
  const ov = admin.overrides[userId];
  if (!ov) return { ...base, tier, overridden: false };
  return {
    businessDaysPerWeek: ov.businessDaysPerWeek ?? base.businessDaysPerWeek,
    customersPerWeek: ov.customersPerWeek ?? base.customersPerWeek,
    collectionsPerDay: ov.collectionsPerDay ?? base.collectionsPerDay,
    tier: ov.tier ?? tier,
    overridden: true,
    overrideNote: ov.note,
  };
}

export type Usage = { weekKey: string; days: string[]; customersAdded: number };

export function getUsage(): Usage {
  const key = weekKey();
  if (!isBrowser()) return { weekKey: key, days: [], customersAdded: 0 };
  try {
    const raw = JSON.parse(localStorage.getItem(LS_USAGE) || "{}");
    if (raw.weekKey !== key) return { weekKey: key, days: [], customersAdded: 0 };
    return { weekKey: key, days: raw.days ?? [], customersAdded: raw.customersAdded ?? 0 };
  } catch {
    return { weekKey: key, days: [], customersAdded: 0 };
  }
}

function saveUsage(u: Usage) {
  if (!isBrowser()) return;
  localStorage.setItem(LS_USAGE, JSON.stringify(u));
  window.dispatchEvent(new Event("guest-plan-change"));
}

export function markTodayActive() {
  const u = getUsage();
  const today = new Date().toISOString().slice(0, 10);
  if (!u.days.includes(today)) {
    u.days.push(today);
    saveUsage(u);
  }
}

export function incrementCustomers(n = 1) {
  const u = getUsage();
  u.customersAdded += n;
  saveUsage(u);
}

export function resetUsage() {
  saveUsage({ weekKey: weekKey(), days: [], customersAdded: 0 });
}

export type LimitCheck =
  | { ok: true }
  | { ok: false; reason: string; kind: "days" | "customers"; nextAvailable: Date };

export function canOperateToday(limits: EffectiveLimits, usage: Usage): LimitCheck {
  const today = new Date().toISOString().slice(0, 10);
  if (usage.days.includes(today)) return { ok: true };
  if (usage.days.length >= limits.businessDaysPerWeek) {
    const next = nextWeekStart();
    return {
      ok: false,
      kind: "days",
      nextAvailable: next,
      reason: `You've used all ${limits.businessDaysPerWeek} operating ${
        limits.businessDaysPerWeek === 1 ? "day" : "days"
      } this week. Recording resumes ${formatNextReset(next)}.`,
    };
  }
  return { ok: true };
}

export function canAddCustomer(limits: EffectiveLimits, usage: Usage): LimitCheck {
  if (limits.customersPerWeek > 0 && usage.customersAdded >= limits.customersPerWeek) {
    const next = nextWeekStart();
    return {
      ok: false,
      kind: "customers",
      nextAvailable: next,
      reason: `Customer limit reached (${usage.customersAdded}/${limits.customersPerWeek}).`,
    };
  }
  return { ok: true };
}

// ---------- Admin activity log ----------

export type PlanActivity = {
  id: string;
  ts: number;
  actor: string; // admin display name
  action:
    | "premium_updated"
    | "override_added"
    | "override_updated"
    | "override_removed"
    | "tier_changed";
  targetId?: string;
  targetName?: string;
  detail: string;
};

export function getPlanActivity(): PlanActivity[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(LS_ACTIVITY) || "[]");
  } catch {
    return [];
  }
}

export function logPlanActivity(entry: Omit<PlanActivity, "id" | "ts"> & { ts?: number }) {
  if (!isBrowser()) return;
  const list = getPlanActivity();
  const next: PlanActivity = {
    id: Math.random().toString(36).slice(2, 10),
    ts: entry.ts ?? Date.now(),
    actor: entry.actor,
    action: entry.action,
    targetId: entry.targetId,
    targetName: entry.targetName,
    detail: entry.detail,
  };
  list.unshift(next);
  localStorage.setItem(LS_ACTIVITY, JSON.stringify(list.slice(0, 200)));
  window.dispatchEvent(new Event("guest-plan-change"));
}

export function clearPlanActivity() {
  if (!isBrowser()) return;
  localStorage.removeItem(LS_ACTIVITY);
  window.dispatchEvent(new Event("guest-plan-change"));
}

// ---------- Upsell event helper ----------

export type UpsellDetail = {
  kind: "days" | "customers";
  reason: string;
  nextAvailable?: string; // ISO
};

export function requestUpsell(detail: UpsellDetail) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent<UpsellDetail>("finroute:upsell", { detail }));
}
