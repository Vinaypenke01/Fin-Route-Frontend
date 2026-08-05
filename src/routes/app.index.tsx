import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, Receipt, Target, Users, Plus, UserPlus, Filter, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { inr } from "@/lib/utils";
import { GuestPlanUsage } from "@/components/guest-plan-usage";
import { CollectionDaysSetup } from "@/components/collection-days-setup";
import { DailyCashReconciliationCard } from "@/components/daily-cash-reconciliation-card";
import { guestWorkspaceService, DashboardMetrics, Collection, Expense } from "@/lib/services/guest-workspace-service";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — FinRoute" }, { name: "description", content: "Your finance business at a glance." }] }),
  component: DashboardPage,
});

function KpiCard({ icon: Icon, label, value, sub, className }: any) {
  return (
    <Card className={`p-5 ${className || ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function DashboardPage() {
  const { user, workspace } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [recentCollections, setRecentCollections] = useState<Collection[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Date Range Filters (default to Today)
  const [dateFrom, setDateFrom] = useState<string>(getTodayStr());
  const [dateTo, setDateTo] = useState<string>(getTodayStr());

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashData, weeklyData, colRes, expRes] = await Promise.all([
        guestWorkspaceService.getDashboardData(),
        guestWorkspaceService.getWeeklySummary(),
        guestWorkspaceService.getCollections({ page_size: 1000 }),
        guestWorkspaceService.getExpenses({ page_size: 1000 }),
      ]);
      setMetrics(dashData.metrics);
      setRecentCollections(dashData.recent_collections);
      setWeeklyTrend(weeklyData);
      setAllCollections(colRes.data || []);
      setAllExpenses(expRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Quick Preset Handlers
  const handlePresetToday = () => {
    const t = getTodayStr();
    setDateFrom(t);
    setDateTo(t);
  };

  const handlePresetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const yStr = `${year}-${month}-${day}`;
    setDateFrom(yStr);
    setDateTo(yStr);
  };

  const handlePresetThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun
    const distanceToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);
    
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const day = String(monday.getDate()).padStart(2, "0");

    setDateFrom(`${year}-${month}-${day}`);
    setDateTo(getTodayStr());
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    setDateFrom(`${year}-${month}-01`);
    setDateTo(getTodayStr());
  };

  // Filtered collections for selected date range
  const filteredCollections = useMemo(() => {
    return allCollections.filter((c) => {
      const isOpening = c.remarks?.toLowerCase().includes("initial opening");
      const isSkipped = c.status_code === "skipped" || c.status_name?.toLowerCase().includes("skipped");
      if (isOpening || isSkipped) return false;

      const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : "";
      const createdDate = c.created_at ? String(c.created_at).slice(0, 10) : "";
      const targetDate = entryDate || createdDate;

      if (dateFrom && targetDate && targetDate < dateFrom) return false;
      if (dateTo && targetDate && targetDate > dateTo) return false;
      return true;
    });
  }, [allCollections, dateFrom, dateTo]);

  // Filtered expenses for selected date range
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      const expDate = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
      const createdDate = e.created_at ? String(e.created_at).slice(0, 10) : "";
      const targetDate = expDate || createdDate;

      if (dateFrom && targetDate && targetDate < dateFrom) return false;
      if (dateTo && targetDate && targetDate > dateTo) return false;
      return true;
    });
  }, [allExpenses, dateFrom, dateTo]);

  const dateRangeCollected = useMemo(() => {
    return filteredCollections.reduce((s, c) => s + Number(c.collected_amount || 0), 0);
  }, [filteredCollections]);

  const dateRangeExpenses = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const netCashCollected = dateRangeCollected - dateRangeExpenses;

  const formatDateLabel = () => {
    if (!dateFrom && !dateTo) return "All Time";
    if (dateFrom === dateTo) return dateFrom === getTodayStr() ? "Today" : dateFrom;
    return `${dateFrom || "Start"} to ${dateTo || "End"}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">
            Good day, {user?.full_name || "Lender"} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            {workspace?.name ? `${workspace.name} — business overview` : "Here's your business at a glance."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/app/collections">
              <Plus className="size-4" /> Record Collection
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/customers">
              <UserPlus className="size-4" /> Add Customer
            </Link>
          </Button>
        </div>
      </div>

      <DailyCashReconciliationCard onRefresh={loadDashboard} />

      <CollectionDaysSetup />

      <GuestPlanUsage />

      {/* Date Range Filtration Bar */}
      <Card className="p-4 space-y-3 bg-card border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Date & Range Filtration</h3>
            <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
              {formatDateLabel()}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant={dateFrom === getTodayStr() && dateTo === getTodayStr() ? "default" : "outline"} onClick={handlePresetToday} className="h-7 text-[11px] px-2.5">
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetYesterday} className="h-7 text-[11px] px-2.5">
              Yesterday
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetThisWeek} className="h-7 text-[11px] px-2.5">
              This Week
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetThisMonth} className="h-7 text-[11px] px-2.5">
              This Month
            </Button>
            <Button size="sm" variant="ghost" onClick={handlePresetToday} className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className="size-3 mr-1" /> Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">From Date</Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-8 h-8 sm:h-9 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">To Date</Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-8 h-8 sm:h-9 text-xs"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Summary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label={`Collections (${formatDateLabel()})`}
          value={loading ? "..." : inr(dateRangeCollected)}
          sub={`${filteredCollections.length} receipts recorded`}
          className="border-emerald-500/30 bg-emerald-500/5"
        />
        <KpiCard
          icon={Receipt}
          label={`Expenses (${formatDateLabel()})`}
          value={loading ? "..." : inr(dateRangeExpenses)}
          sub={`${filteredExpenses.length} expense vouchers`}
          className="border-red-500/30 bg-red-500/5"
        />
        <KpiCard
          icon={IndianRupee}
          label={`Net Cash In Hand (${formatDateLabel()})`}
          value={loading ? "..." : inr(netCashCollected)}
          sub="Gross collections minus expenses"
          className={netCashCollected >= 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-red-500/30 bg-red-500/5"}
        />
        <KpiCard
          icon={Target}
          label="Total Outstanding Balance"
          value={loading ? "..." : inr(metrics?.outstanding_balance || 0)}
          sub={`${metrics?.active_loans || 0} active borrower loans`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold">Weekly Collection Trend</h3>
              <p className="text-xs text-muted-foreground">Amount collected per day (Monday to Sunday)</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day_name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: any) => inr(v as number)} />
                <Area type="monotone" dataKey="amount_collected" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-base font-semibold mb-4">Recent Collections</h3>
          {recentCollections.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No recent collection entries recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCollections.map((c) => (
                <div key={c.public_id} className="flex items-center justify-between text-xs border-b border-border/50 pb-2.5 last:border-0">
                  <div>
                    <p className="font-medium">{c.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.customer_code} • {c.collection_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{inr(c.collected_amount)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{c.status_name || "Paid"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
