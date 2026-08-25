import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, Receipt, Target, Users, Plus, UserPlus, Filter, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, IndianRupee, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { inr } from "@/lib/utils";
import { GuestPlanUsage } from "@/components/guest-plan-usage";
import { SubscriptionExpiryBanner } from "@/components/subscription-expiry-banner";
import { CollectionDaysSetup } from "@/components/collection-days-setup";
import { MigrationOnboardingWizardModal } from "@/components/migration-onboarding-modal";
import { Sparkles } from "lucide-react";
import { guestWorkspaceService, DashboardMetrics, Collection, Expense, Customer } from "@/lib/services/guest-workspace-service";
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
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const today = getTodayStr();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [recentCollections, setRecentCollections] = useState<Collection[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Line / Route State
  const [lines, setLines] = useState<any[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("all");

  // Date & Cycle Filtration State
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const [showCustomRange, setShowCustomRange] = useState<boolean>(false);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number | null>(null);

  const loadLines = async () => {
    try {
      const data = await guestWorkspaceService.getLines();
      const loadedLines = data || [];
      setLines(loadedLines);

      const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const lineForToday = loadedLines.find((ln: any) =>
        ln.day_schedules?.some((s: any) => s.day_of_week.toLowerCase() === currentDayName)
      );
      if (lineForToday) {
        setSelectedLine(lineForToday.public_id);
      } else if (loadedLines.length > 0) {
        setSelectedLine(loadedLines[0].public_id);
      }
    } catch (err) {
      console.error("Failed to load lines:", err);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashData, weeklyData, colRes, expRes] = await Promise.all([
        guestWorkspaceService.getDashboardData(),
        guestWorkspaceService.getWeeklySummary(),
        guestWorkspaceService.getCollections({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          line: selectedLine === "all" ? undefined : selectedLine,
          page_size: 1000,
        }),
        guestWorkspaceService.getExpenses({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page_size: 1000,
        }),
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
    loadLines();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [dateFrom, dateTo, selectedLine]);

  const [anchorCustomers, setAnchorCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    async function loadWorkspaceAnchorData() {
      try {
        const cRes = await guestWorkspaceService.getCustomers({ status: "active", page_size: 1000 });
        setAnchorCustomers(cRes.data || []);
      } catch (err) {
        console.error("Failed to load anchor customers in dashboard:", err);
      }
    }
    loadWorkspaceAnchorData();
  }, []);

  // ─── Earliest Anchor Date & Weekly Cycles Calculation ───────────────────────
  const earliestAnchorDate = useMemo(() => {
    let earliest = today;
    anchorCustomers.forEach((c) => {
      if (c.start_date && c.start_date.slice(0, 10) < earliest) {
        earliest = c.start_date.slice(0, 10);
      }
    });
    allCollections.forEach((col) => {
      const cd = col.collection_date ? String(col.collection_date).slice(0, 10) : "";
      if (cd && cd < earliest) {
        earliest = cd;
      }
    });
    allExpenses.forEach((e) => {
      const ed = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
      if (ed && ed < earliest) {
        earliest = ed;
      }
    });
    // Ensure we include at least 12 past weeks prior to today so lender can always navigate back to past weeks
    const pastBoundary = new Date();
    pastBoundary.setDate(pastBoundary.getDate() - 84);
    const pastBoundaryStr = pastBoundary.toISOString().slice(0, 10);

    return earliest < pastBoundaryStr ? earliest : pastBoundaryStr;
  }, [anchorCustomers, allCollections, allExpenses, today]);

  const activeTargetDaysOfWeek = useMemo<number[]>(() => {
    const map: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    if (selectedLine && selectedLine !== "all") {
      const activeLineObj = lines.find((l) => l.public_id === selectedLine);
      const days: number[] = (activeLineObj?.day_schedules || [])
        .map((s: any) => map[s.day_of_week.toLowerCase()])
        .filter((d: any): d is number => typeof d === "number");

      if (days.length > 0) {
        return Array.from(new Set<number>(days)).sort((a, b) => a - b);
      }
    }

    return [new Date().getDay()];
  }, [selectedLine, lines]);

  const weeklyCycles = useMemo(() => {
    if (!earliestAnchorDate) return [];
    const cycles: { index: number; label: string; dateFrom: string; dateTo: string; isCurrent: boolean }[] = [];

    let weekStart = new Date(earliestAnchorDate);
    if (isNaN(weekStart.getTime())) return [];

    const dayNum = weekStart.getDay();
    const distToMon = (dayNum + 6) % 7;
    weekStart.setDate(weekStart.getDate() - distToMon);

    const now = new Date();
    let weekIndex = 1;

    const formatShortDate = (dStr: string) => {
      try {
        const [y, m, d] = dStr.split("-");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
      } catch {
        return dStr;
      }
    };

    const targetDays = activeTargetDaysOfWeek.length > 0 ? activeTargetDaysOfWeek : [1, 2, 3, 4, 5, 6, 0];

    while (weekIndex <= 156) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekFromStr = weekStart.toISOString().slice(0, 10);
      const weekToStr = weekEnd.toISOString().slice(0, 10);

      // Compute configured dates for this week based on targetDays
      const configuredDates: string[] = [];
      targetDays.forEach((dNum) => {
        const cycleDate = new Date(weekStart);
        const offsetFromMon = (dNum + 6) % 7;
        cycleDate.setDate(cycleDate.getDate() + offsetFromMon);
        configuredDates.push(cycleDate.toISOString().slice(0, 10));
      });

      configuredDates.sort();

      const cycleFrom = configuredDates[0] || weekFromStr;
      const cycleTo = configuredDates[configuredDates.length - 1] || weekToStr;
      const isCurrent = today >= weekFromStr && today <= weekToStr;

      const dateRangeLabel = cycleFrom === cycleTo
        ? formatShortDate(cycleFrom)
        : `${formatShortDate(cycleFrom)} - ${formatShortDate(cycleTo)}`;

      cycles.push({
        index: weekIndex,
        label: `Week ${weekIndex} (${dateRangeLabel})${isCurrent ? " ★ Current Week" : ""}`,
        dateFrom: cycleFrom,
        dateTo: cycleTo,
        isCurrent,
      });

      if (weekStart > now) break;
      weekStart.setDate(weekStart.getDate() + 7);
      weekIndex++;
    }

    return cycles;
  }, [earliestAnchorDate, activeTargetDaysOfWeek, today]);

  const [hasUserManuallySelectedCycle, setHasUserManuallySelectedCycle] = useState(false);

  // Auto-select active week cycle: restore from sessionStorage if available, else current active week
  useEffect(() => {
    if (weeklyCycles.length > 0 && !hasUserManuallySelectedCycle) {
      const savedCycleIdxStr = sessionStorage.getItem("finroute_active_week_cycle_index");
      let cycleToSelect = null;

      if (savedCycleIdxStr) {
        const savedIdx = parseInt(savedCycleIdxStr, 10);
        cycleToSelect = weeklyCycles.find((c) => c.index === savedIdx);
      }

      if (!cycleToSelect) {
        cycleToSelect = weeklyCycles.find((c) => c.isCurrent) || weeklyCycles[weeklyCycles.length - 1];
      }

      if (cycleToSelect) {
        setSelectedCycleIndex(cycleToSelect.index);
        setDateFrom(cycleToSelect.dateFrom);
        setDateTo(cycleToSelect.dateTo);
      }
    }
  }, [weeklyCycles, hasUserManuallySelectedCycle]);

  const handleSelectCycle = (index: number) => {
    const cycle = weeklyCycles.find((c) => c.index === index);
    if (cycle) {
      setSelectedCycleIndex(cycle.index);
      setDateFrom(cycle.dateFrom);
      setDateTo(cycle.dateTo);
      setHasUserManuallySelectedCycle(true);
      sessionStorage.setItem("finroute_active_week_cycle_index", String(cycle.index));
    }
  };

  const handlePrevWeek = () => {
    const currentIdx = selectedCycleIndex || 1;
    if (currentIdx > 1) {
      handleSelectCycle(currentIdx - 1);
    }
  };

  const handleNextWeek = () => {
    const currentIdx = selectedCycleIndex || 1;
    if (currentIdx < weeklyCycles.length) {
      handleSelectCycle(currentIdx + 1);
    }
  };

  const handlePresetCurrentWeek = () => {
    const active = weeklyCycles.find((c) => c.isCurrent);
    if (active) {
      handleSelectCycle(active.index);
    } else {
      handlePresetThisWeek();
    }
  };

  // Quick Preset Handlers
  const handlePresetToday = () => {
    const t = getTodayStr();
    setDateFrom(t);
    setDateTo(t);
    setSelectedCycleIndex(null);
  };

  const handlePresetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yStr = d.toISOString().slice(0, 10);
    setDateFrom(yStr);
    setDateTo(yStr);
    setSelectedCycleIndex(null);
  };

  const handlePresetThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);
    setDateFrom(monday.toISOString().slice(0, 10));
    setDateTo(today);
    setSelectedCycleIndex(null);
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    setDateFrom(`${year}-${month}-01`);
    setDateTo(today);
    setSelectedCycleIndex(null);
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
    if (selectedCycleIndex !== null) return dateFrom;
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
        {/* <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-1.5 font-bold border-amber-500/40 text-amber-900 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20">
            <Link to="/app/migration">
              <Sparkles className="size-4 text-amber-500" /> Digital Migration / Bulk Import
            </Link>
          </Button>
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
        </div> */}
      </div>

      <MigrationOnboardingWizardModal
        open={isMigrationModalOpen}
        onOpenChange={setIsMigrationModalOpen}
        lines={lines}
        onSuccess={() => loadDashboard()}
      />

      <CollectionDaysSetup />

      <GuestPlanUsage />
      <SubscriptionExpiryBanner />

      {/* 1. Route Line Filter Selection */}
      {lines.length > 0 && (
        <Card className="p-3.5 space-y-2 bg-card border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" /> Filter Dashboard by Route Line:
            </span>
            {selectedLine !== "all" && (
              <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={() => setSelectedLine("all")}>
                Show All Lines
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLine("all")}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${selectedLine === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground border-border"
                }`}
            >
              All Route Lines
            </button>
            {lines.map((ln) => {
              const isSelected = selectedLine === ln.public_id;
              return (
                <button
                  key={ln.public_id}
                  type="button"
                  onClick={() => setSelectedLine(isSelected ? "all" : ln.public_id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground hover:text-foreground border-border"
                    }`}
                >
                  <MapPin className={`size-3 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                  <span>{ln.name}</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* 2. Smart Weekly Collection & Dashboard Cycle Navigation Bar */}
      <Card className="p-4 space-y-3 bg-card border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Weekly Dashboard Cycles</h3>
            <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
              {formatDateLabel()}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant={selectedCycleIndex !== null && weeklyCycles.find((c) => c.index === selectedCycleIndex)?.isCurrent ? "default" : "outline"}
              onClick={handlePresetCurrentWeek}
              className="h-7 text-[11px] px-2.5 font-bold"
            >
              Current Week (Active)
            </Button>
            <Button size="sm" variant={dateFrom === today && dateTo === today ? "default" : "outline"} onClick={handlePresetToday} className="h-7 text-[11px] px-2.5">
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetYesterday} className="h-7 text-[11px] px-2.5">
              Yesterday
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetThisMonth} className="h-7 text-[11px] px-2.5">
              This Month
            </Button>
            <Button
              size="sm"
              variant={showCustomRange ? "secondary" : "outline"}
              onClick={() => setShowCustomRange(!showCustomRange)}
              className="h-7 text-[11px] px-2.5 gap-1 font-semibold"
            >
              <SlidersHorizontal className="size-3" /> Custom Range
            </Button>
            <Button size="sm" variant="ghost" onClick={handlePresetToday} className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className="size-3 mr-1" /> Reset
            </Button>
          </div>
        </div>

        {/* Primary Cycle Navigation Control: Prev Arrow - Cycle Dropdown - Next Arrow */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevWeek}
            disabled={!selectedCycleIndex || selectedCycleIndex <= 1}
            className="h-9 px-3 text-xs font-bold gap-1 shrink-0"
            title="Previous Week Cycle"
          >
            <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Prev Week</span>
          </Button>

          <div className="flex-1 min-w-[200px]">
            <Select
              value={selectedCycleIndex !== null ? String(selectedCycleIndex) : ""}
              onValueChange={(val) => handleSelectCycle(Number(val))}
            >
              <SelectTrigger className="h-9 font-semibold text-xs sm:text-sm text-primary border-primary/40 bg-primary/5">
                <SelectValue placeholder="Select Dashboard Week Cycle..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {weeklyCycles.map((cycle) => (
                  <SelectItem key={cycle.index} value={String(cycle.index)} className="text-xs font-medium">
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            disabled={!selectedCycleIndex || selectedCycleIndex >= weeklyCycles.length}
            className="h-9 px-3 text-xs font-bold gap-1 shrink-0"
            title="Next Week Cycle"
          >
            <span className="hidden sm:inline">Next Week</span> <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Collapsible Custom Date Range */}
        {showCustomRange && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40 bg-muted/20 p-2.5 rounded-lg">
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">From Date (Custom)</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setSelectedCycleIndex(null);
                }}
                className="mt-1 h-8 sm:h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">To Date (Custom)</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setSelectedCycleIndex(null);
                }}
                className="mt-1 h-8 sm:h-9 text-xs"
              />
            </div>
          </div>
        )}
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
