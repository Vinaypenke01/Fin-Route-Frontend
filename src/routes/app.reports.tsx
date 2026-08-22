import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Download, Calendar, IndianRupee, Wallet, ArrowDownRight, ArrowUpRight, Filter, RefreshCw, FileText, CheckCircle2, Printer, Eye, Image as ImageIcon, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, Users } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Collection, Expense, Customer } from "@/lib/services/guest-workspace-service";
import { downloadFinancialReportImage } from "@/lib/download-report-image";
import { FeaturePaywallGuard } from "@/components/feature-paywall-guard";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports & Financial Summary — FinRoute" }, { name: "description", content: "Daily, day-wise, and net financial collection & expense reports." }] }),
  component: ReportsPage,
});

const DAYS_LIST = [
  { key: "all", label: "All Days" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

interface DailySummaryRow {
  dateKey: string;
  displayDate: string;
  dayName: string;
  grossCollected: number;
  totalExpenses: number;
  netCollection: number;
  collectionCount: number;
  expenseCount: number;
}

function ReportsPage() {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const today = getTodayStr();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [configuredDays, setConfiguredDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Line / Route State
  const [lines, setLines] = useState<any[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("all");

  // Filters & Cycle Filtration State
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const [selectedDays, setSelectedDays] = useState<string[]>(["all"]);
  const [isAllTimeSelected, setIsAllTimeSelected] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [viewingSummaryDate, setViewingSummaryDate] = useState<string | null>(null);
  const [viewingCycle, setViewingCycle] = useState<{ cycleIndex: number; dateFrom: string; dateTo: string; label: string } | null>(null);
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

  const [cashRecon, setCashRecon] = useState<any>(null);
  const [capitalEntries, setCapitalEntries] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [colRes, expRes, custRes, ws, reconRes, capRes] = await Promise.all([
        guestWorkspaceService.getCollections({
          line: selectedLine === "all" ? undefined : selectedLine,
          page_size: 1000,
        }),
        guestWorkspaceService.getExpenses({
          page_size: 1000,
        }),
        guestWorkspaceService.getCustomers({ status: "active", page_size: 1000 }),
        guestWorkspaceService.getWorkspace(),
        guestWorkspaceService.getCashReconciliation(
          isAllTimeSelected ? undefined : (dateFrom || undefined),
          selectedLine === "all" ? undefined : selectedLine
        ).catch(() => null),
        guestWorkspaceService.getCapitalEntries().catch(() => []),
      ]);
      setCollections(colRes.data || []);
      setExpenses(expRes.data || []);
      setCustomers(custRes.data || []);
      setCapitalEntries(capRes || []);
      if (reconRes) setCashRecon(reconRes);

      const savedDays = ws.allowed_collection_days || [];
      setConfiguredDays(savedDays);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
  }, []);

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, selectedLine, isAllTimeSelected]);

  // ─── Earliest Anchor Date & Weekly Cycles Calculation ───────────────────────
  const earliestAnchorDate = useMemo(() => {
    let earliest = today;
    customers.forEach((c) => {
      if (c.start_date && c.start_date.slice(0, 10) < earliest) {
        earliest = c.start_date.slice(0, 10);
      }
    });
    collections.forEach((col) => {
      const cd = col.collection_date ? String(col.collection_date).slice(0, 10) : "";
      if (cd && cd < earliest) {
        earliest = cd;
      }
    });
    expenses.forEach((e) => {
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
  }, [customers, collections, expenses, today]);

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

  const fullWeekCycles = useMemo(() => {
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
    if (fullWeekCycles.length > 0 && !hasUserManuallySelectedCycle) {
      const savedCycleIdxStr = sessionStorage.getItem("finroute_active_week_cycle_index");
      let cycleToSelect = null;

      if (savedCycleIdxStr) {
        const savedIdx = parseInt(savedCycleIdxStr, 10);
        cycleToSelect = fullWeekCycles.find((c) => c.index === savedIdx);
      }

      if (cycleToSelect) {
        setSelectedCycleIndex(cycleToSelect.index);
        setDateFrom(cycleToSelect.dateFrom);
        setDateTo(cycleToSelect.dateTo);
        setIsAllTimeSelected(false);
      }
    }
  }, [fullWeekCycles, hasUserManuallySelectedCycle]);

  const handleSelectCycle = (index: number) => {
    const cycle = fullWeekCycles.find((c) => c.index === index);
    if (cycle) {
      setSelectedCycleIndex(cycle.index);
      setDateFrom(cycle.dateFrom);
      setDateTo(cycle.dateTo);
      setHasUserManuallySelectedCycle(true);
      setIsAllTimeSelected(false);
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
    if (currentIdx < fullWeekCycles.length) {
      handleSelectCycle(currentIdx + 1);
    }
  };

  const handlePresetCurrentWeek = () => {
    const active = fullWeekCycles.find((c) => c.isCurrent);
    if (active) {
      handleSelectCycle(active.index);
    } else {
      handlePresetThisWeek();
    }
  };

  const dynamicDaysList = useMemo(() => {
    if (!configuredDays || configuredDays.length === 0) {
      return DAYS_LIST;
    }
    const list = [{ key: "all", label: "All Configured Days" }];
    configuredDays.forEach((dayKey) => {
      const capitalized = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
      list.push({ key: dayKey.toLowerCase(), label: capitalized });
    });
    return list;
  }, [configuredDays]);

  // Multi-Day Toggle Handler
  const toggleDayFilter = (dayKey: string) => {
    setIsAllTimeSelected(false);
    if (dayKey === "all") {
      setSelectedDays(["all"]);
      return;
    }
    setSelectedDays((prev) => {
      const withoutAll = prev.filter((d) => d !== "all");
      if (withoutAll.includes(dayKey)) {
        const next = withoutAll.filter((d) => d !== dayKey);
        return next.length === 0 ? ["all"] : next;
      } else {
        return [...withoutAll, dayKey];
      }
    });
  };

  // Quick Preset Handlers
  const handlePresetAllTime = () => {
    setIsAllTimeSelected(true);
    setDateFrom("");
    setDateTo("");
    setSelectedDays(["all"]);
    setSelectedCycleIndex(null);
  };

  const handlePresetToday = () => {
    setIsAllTimeSelected(false);
    const t = getTodayStr();
    setDateFrom(t);
    setDateTo(t);
    setSelectedCycleIndex(null);
  };

  const handlePresetThisWeek = () => {
    setIsAllTimeSelected(false);
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
    setIsAllTimeSelected(false);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    setDateFrom(`${year}-${month}-01`);
    setDateTo(today);
    setSelectedCycleIndex(null);
  };

  const handleClearFilters = () => {
    setIsAllTimeSelected(false);
    setDateFrom(today);
    setDateTo(today);
    setSelectedDays(["all"]);
    setSelectedCycleIndex(null);
    setSearchQuery("");
  };

  // Filter collections by date, multi-day, and search query
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Exclude initial opening balance entries from regular revenue reports
      const isOpening = c.remarks?.toLowerCase().includes("initial opening");
      if (isOpening) return false;

      const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : "";
      const createdDate = c.created_at ? String(c.created_at).slice(0, 10) : "";
      const targetDate = entryDate || createdDate;

      if (!isAllTimeSelected) {
        if (dateFrom && targetDate && targetDate < dateFrom) return false;
        if (dateTo && targetDate && targetDate > dateTo) return false;
      }

      if (!selectedDays.includes("all") && selectedDays.length > 0) {
        const d = new Date(targetDate);
        if (!isNaN(d.getTime())) {
          const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          if (!selectedDays.includes(dayName)) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = c.customer_code?.toLowerCase().includes(q);
        const matchesName = c.customer_name?.toLowerCase().includes(q);
        const matchesReceipt = c.receipt_number?.toLowerCase().includes(q);
        const matchesRemarks = c.remarks?.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesReceipt && !matchesRemarks) return false;
      }

      return true;
    });
  }, [collections, dateFrom, dateTo, selectedDays, isAllTimeSelected, searchQuery]);

  // Filter expenses by date, multi-day, and search query
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
      const createdDate = e.created_at ? String(e.created_at).slice(0, 10) : "";
      const targetDate = expDate || createdDate;

      if (!isAllTimeSelected) {
        if (dateFrom && targetDate && targetDate < dateFrom) return false;
        if (dateTo && targetDate && targetDate > dateTo) return false;
      }

      if (!selectedDays.includes("all") && selectedDays.length > 0) {
        const d = new Date(targetDate);
        if (!isNaN(d.getTime())) {
          const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          if (!selectedDays.includes(dayName)) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCat = e.category_name?.toLowerCase().includes(q);
        const matchesDesc = e.description?.toLowerCase().includes(q);
        const matchesMode = e.payment_mode_name?.toLowerCase().includes(q);
        if (!matchesCat && !matchesDesc && !matchesMode) return false;
      }

      return true;
    });
  }, [expenses, dateFrom, dateTo, selectedDays, isAllTimeSelected, searchQuery]);

  // Filter disbursements (loans given to borrowers) by date, line, and search query
  const filteredDisbursements = useMemo(() => {
    return customers.filter((c) => {
      const startDate = c.start_date ? String(c.start_date).slice(0, 10) : "";
      if (!isAllTimeSelected) {
        if (dateFrom && startDate && startDate < dateFrom) return false;
        if (dateTo && startDate && startDate > dateTo) return false;
      }
      if (selectedLine !== "all" && (c as any).line_public_id !== selectedLine && (c as any).line_id !== selectedLine && (c as any).line !== selectedLine) {
        return false;
      }
      if (!selectedDays.includes("all") && selectedDays.length > 0) {
        if (c.collection_day) {
          if (!selectedDays.includes(c.collection_day.toLowerCase())) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = c.customer_code?.toLowerCase().includes(q);
        const matchesName = c.full_name?.toLowerCase().includes(q);
        const matchesPhone = c.mobile_number?.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [customers, dateFrom, dateTo, selectedLine, selectedDays, isAllTimeSelected, searchQuery]);

  const totalDisbursedAmount = useMemo(() => {
    return filteredDisbursements.reduce((sum, c) => sum + Number(c.disbursed_amount || c.loan_amount || 0), 0);
  }, [filteredDisbursements]);

  const totalPendingBalance = useMemo(() => {
    return filteredDisbursements.reduce((sum, c) => sum + Number(c.outstanding_balance || 0), 0);
  }, [filteredDisbursements]);

  // Total Metrics
  const grossCollections = useMemo(() => {
    return filteredCollections.reduce((sum, c) => sum + Number(c.collected_amount || 0), 0);
  }, [filteredCollections]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const masterStartingFloat = useMemo(() => {
    if (capitalEntries.length > 0) {
      return capitalEntries.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    }
    return 150000;
  }, [capitalEntries]);

  const masterActualCashInHand = masterStartingFloat + grossCollections - totalDisbursedAmount - totalExpenses;

  const netCollections = grossCollections - totalExpenses;
  const netMarginPct = grossCollections > 0 ? ((netCollections / grossCollections) * 100).toFixed(1) : "0.0";

  // Grouped Weekly Summary (Financial Week Cycle wise breakdown deducting expenses)
  const weeklySummaries = useMemo(() => {
    const list: {
      cycleIndex: number;
      dateFrom: string;
      dateTo: string;
      label: string;
      dateKey: string;
      displayDate: string;
      dayName: string;
      isCurrent: boolean;
      isFuture: boolean;
      grossCollected: number;
      totalExpenses: number;
      netCollection: number;
      collectionCount: number;
      expenseCount: number;
    }[] = [];

    fullWeekCycles.forEach((cycle) => {
      const isFuture = cycle.dateFrom > today;

      const cycleCollections = filteredCollections.filter((c) => {
        const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : (c.created_at ? String(c.created_at).slice(0, 10) : "");
        const isOpeningBalance = c.remarks?.toLowerCase().includes("initial opening");
        return entryDate >= cycle.dateFrom && entryDate <= cycle.dateTo && !isOpeningBalance;
      });

      const cycleExpenses = filteredExpenses.filter((e) => {
        const entryDate = e.expense_date ? String(e.expense_date).slice(0, 10) : (e.created_at ? String(e.created_at).slice(0, 10) : "");
        return entryDate >= cycle.dateFrom && entryDate <= cycle.dateTo;
      });

      const grossCollected = cycleCollections.reduce((sum, c) => sum + Number(c.collected_amount || 0), 0);
      const totalExpenses = cycleExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const netCollection = grossCollected - totalExpenses;

      // Show cycle if it has activity or is current/past cycle up to target
      if (grossCollected > 0 || totalExpenses > 0 || cycle.isCurrent || cycle.dateTo <= today) {
        list.push({
          cycleIndex: cycle.index,
          dateFrom: cycle.dateFrom,
          dateTo: cycle.dateTo,
          label: `Week ${cycle.index} (${cycle.dateFrom} - ${cycle.dateTo})`,
          dateKey: `Week ${cycle.index}`,
          displayDate: `${cycle.dateFrom} to ${cycle.dateTo}`,
          dayName: `Week ${cycle.index}`,
          isCurrent: cycle.isCurrent,
          isFuture,
          grossCollected,
          totalExpenses,
          netCollection,
          collectionCount: cycleCollections.length,
          expenseCount: cycleExpenses.length,
        });
      }
    });

    return list.sort((a, b) => b.cycleIndex - a.cycleIndex);
  }, [fullWeekCycles, filteredCollections, filteredExpenses, today]);

  // Export CSV Handler
  const handleExportCsv = (type: "summary" | "collection" | "expense") => {
    if (type === "summary") {
      let csv = "Week Cycle,From Date,To Date,Gross Collections (INR),Expenses Deducted (INR),Net Collection (INR),Collection Receipts,Expense Entries\n";
      weeklySummaries.forEach((row) => {
        csv += `"Week ${row.cycleIndex}","${row.dateFrom}","${row.dateTo}",${row.grossCollected},${row.totalExpenses},${row.netCollection},${row.collectionCount},${row.expenseCount}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finroute_weekly_net_summary_${getTodayStr()}.csv`;
      a.click();
    } else {
      const url = guestWorkspaceService.getReportExportUrl(type, "csv");
      window.open(url, "_blank");
    }
  };

  const handleExportReportImage = () => {
    downloadFinancialReportImage(weeklySummaries, {
      dateFrom: isAllTimeSelected ? "All Time" : dateFrom,
      dateTo: isAllTimeSelected ? "All Time" : dateTo,
      dayFilter: selectedDays.join(", "),
      workspaceName: "FinRoute Finance Workspace",
      startingFloat: cashRecon?.capital_total || 0,
      givenToBorrowers: totalDisbursedAmount,
      totalDisbursedCount: filteredDisbursements.length,
      grossCollections: grossCollections,
      totalExpenses: totalExpenses,
      remainingPendingDue: totalPendingBalance,
      actualCashInHand: (cashRecon?.capital_total || 0) + grossCollections - totalDisbursedAmount - totalExpenses,
    });
  };

  return (
    <FeaturePaywallGuard module="reports">
      <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Business Reports & Net Cash Flow</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track daily collections, route day breakdowns, and net revenue after deducting operational expenses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4 mr-1.5" /> Print Statement
          </Button>
          <Button size="sm" onClick={() => handleExportCsv("summary")} className="bg-primary text-primary-foreground font-semibold">
            <Download className="size-4 mr-1.5" /> Export Summary CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => guestWorkspaceService.downloadFullDataBackup()}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300 font-semibold dark:bg-blue-950 dark:text-blue-300"
            title="Download complete JSON backup of all customers, loans, collections & expenses"
          >
            <Download className="size-4 mr-1.5" /> Full Data Backup (JSON)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportReportImage}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-semibold dark:bg-emerald-950 dark:text-emerald-300"
          >
            <ImageIcon className="size-4 mr-1.5" /> Report Image
          </Button>
        </div>
      </div>

      {/* Unified Filter Dashboard Bar */}
      <Card className="p-4 bg-card border-border/80 shadow-xs space-y-3.5">
        {/* Top Bar: Quick Time Presets & Active Range Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Report Filters</h3>
            <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20 font-bold">
              {isAllTimeSelected
                ? "🌐 All-Time Summary"
                : dateFrom === dateTo
                ? dateFrom === today
                  ? "Today"
                  : dateFrom
                : `${dateFrom || "Start"} → ${dateTo || "End"}`}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant={isAllTimeSelected ? "default" : "outline"}
              onClick={handlePresetAllTime}
              className={`h-7 text-[11px] px-2.5 font-bold ${
                isAllTimeSelected ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs" : ""
              }`}
            >
              🌐 All-Time Totals
            </Button>
            <Button
              size="sm"
              variant={!isAllTimeSelected && dateFrom === today && dateTo === today ? "default" : "outline"}
              onClick={handlePresetToday}
              className="h-7 text-[11px] px-2.5 font-semibold"
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={!isAllTimeSelected && selectedCycleIndex !== null && fullWeekCycles.find((c) => c.index === selectedCycleIndex)?.isCurrent ? "default" : "outline"}
              onClick={handlePresetCurrentWeek}
              className="h-7 text-[11px] px-2.5 font-semibold"
            >
              Current Week
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetThisMonth} className="h-7 text-[11px] px-2.5 font-semibold">
              This Month
            </Button>
            <Button
              size="sm"
              variant={showCustomRange ? "secondary" : "outline"}
              onClick={() => {
                setIsAllTimeSelected(false);
                setShowCustomRange(!showCustomRange);
              }}
              className="h-7 text-[11px] px-2.5 gap-1 font-semibold"
            >
              <SlidersHorizontal className="size-3" /> Custom Range
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearFilters} className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className="size-3 mr-1" /> Reset
            </Button>
          </div>
        </div>

        {/* Collapsible Custom Date & Financial Week Picker */}
        {showCustomRange && (
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" /> Select Specific Week Cycle or Custom Dates:
              </span>
              {selectedCycleIndex !== null && (
                <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20 font-bold">
                  Week {selectedCycleIndex} Selected
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Week-Wise Selector */}
              <div>
                <Label className="text-[11px] font-bold text-foreground">Financial Week Cycle</Label>
                <Select
                  value={selectedCycleIndex !== null ? String(selectedCycleIndex) : ""}
                  onValueChange={(val) => {
                    const idx = Number(val);
                    handleSelectCycle(idx);
                  }}
                >
                  <SelectTrigger className="mt-1 h-8.5 text-xs bg-background font-semibold text-primary border-primary/30">
                    <SelectValue placeholder="Select Week (e.g. Week 1)..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {fullWeekCycles.map((c) => (
                      <SelectItem key={c.index} value={String(c.index)} className="text-xs font-medium">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* From Date */}
              <div>
                <Label className="text-[11px] font-bold text-foreground">From Date</Label>
                <Input
                  type="date"
                  className="mt-1 h-8.5 text-xs font-mono bg-background"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setSelectedCycleIndex(null);
                    setIsAllTimeSelected(false);
                  }}
                />
              </div>

              {/* To Date */}
              <div>
                <Label className="text-[11px] font-bold text-foreground">To Date</Label>
                <Input
                  type="date"
                  className="mt-1 h-8.5 text-xs font-mono bg-background"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setSelectedCycleIndex(null);
                    setIsAllTimeSelected(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3-Column Interactive Filter Bar: Route Line, Day Pills, Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Column 1: Route Line Dropdown */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3 text-primary" /> Route Line
            </Label>
            <Select value={selectedLine} onValueChange={setSelectedLine}>
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Select Route Line..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold">All Route Lines</SelectItem>
                {lines.map((ln) => (
                  <SelectItem key={ln.public_id} value={ln.public_id} className="text-xs">
                    {ln.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Column 2: Route Days Multi-Select Filter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3 text-primary" /> Days of Week
              </Label>
              {!selectedDays.includes("all") && (
                <span className="text-[10px] text-primary font-bold">
                  {selectedDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(" + ")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {dynamicDaysList.map((d) => {
                const isSelected = selectedDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDayFilter(d.key)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
                    }`}
                  >
                    {isSelected && d.key !== "all" ? "✓ " : ""}{d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: Search Bar */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Search className="size-3 text-primary" /> Search Records
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search borrower name, code, receipt..."
                className="pl-8 h-8.5 text-xs bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Master Cash & Portfolio Financial Ledger Position Card */}
      <Card className="p-4.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border-emerald-500/30 dark:border-emerald-500/40 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-xs">
              <Wallet className="size-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight flex items-center gap-2 flex-wrap">
                <span>MASTER CASH & PORTFOLIO FINANCIAL POSITION</span>
                <Badge variant="outline" className="text-[10px] font-mono bg-emerald-600 text-white border-none font-bold">
                  Includes Starting Float Cash
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Actual Cash in Hand = (Starting Float + Installment Collections) − (Loan Disbursements + Expenses)
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
              {inr(masterActualCashInHand)}
            </p>
            <p className="text-[11px] text-muted-foreground font-semibold">Actual Physical Cash in Hand</p>
          </div>
        </div>

        {/* 6 Comprehensive Financial Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs pt-0.5">
          <div className="p-2.5 rounded-lg bg-background/90 border border-border/60 space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Starting Float Cash</span>
            <span className="font-mono font-extrabold text-blue-700 dark:text-blue-300 text-sm">+{inr(masterStartingFloat)}</span>
            <span className="text-[10px] text-blue-600 block italic">Total Injected Capital</span>
          </div>

          <div className="p-2.5 rounded-lg bg-background/90 border border-border/60 space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Given to Borrowers</span>
            <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300 text-sm">−{inr(totalDisbursedAmount)}</span>
            <span className="text-[10px] text-purple-600 block font-medium">{filteredDisbursements.length} Loans Disbursed</span>
          </div>

          <div className="p-2.5 rounded-lg bg-background/90 border border-border/60 space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Installments Collected</span>
            <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">+{inr(grossCollections)}</span>
            <span className="text-[10px] text-emerald-600 block font-medium">{filteredCollections.length} Receipts</span>
          </div>

          <div className="p-2.5 rounded-lg bg-background/90 border border-border/60 space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Expenses Deducted</span>
            <span className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm">−{inr(totalExpenses)}</span>
            <span className="text-[10px] text-rose-600 block font-medium">{filteredExpenses.length} Vouchers</span>
          </div>

          <div className="p-2.5 rounded-lg bg-background/90 border border-border/60 space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Remaining Pending Due</span>
            <span className="font-mono font-extrabold text-amber-700 dark:text-amber-300 text-sm">{inr(totalPendingBalance)}</span>
            <span className="text-[10px] text-amber-600 block font-medium">Uncollected Balance</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-0.5">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block uppercase tracking-wider">Actual Cash In Hand</span>
            <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
              {inr(masterActualCashInHand)}
            </span>
            <span className="text-[10px] text-emerald-600 block font-bold">Reconciled Float</span>
          </div>
        </div>
      </Card>

      {/* Top Metric Cards (Collections, Expenses, Net Revenue) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Gross Collections</span>
            <div className="p-1.5 rounded-full bg-emerald-600/15 text-emerald-700">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-800">{inr(grossCollections)}</p>
          <p className="text-[11px] text-emerald-700/80 font-medium">{filteredCollections.length} Payment Receipts</p>
        </Card>

        <Card className="p-4 bg-red-500/10 border-red-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800">Expenses Deducted</span>
            <div className="p-1.5 rounded-full bg-red-600/15 text-red-700">
              <ArrowDownRight className="size-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-red-800">{inr(totalExpenses)}</p>
          <p className="text-[11px] text-red-700/80 font-medium">{filteredExpenses.length} Expense Vouchers</p>
        </Card>

        <Card className="p-4 bg-primary/10 border-primary/20 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Net Collection (In Hand)</span>
            <div className="p-1.5 rounded-full bg-primary/15 text-primary">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className={`text-xl font-bold font-mono ${netCollections >= 0 ? "text-primary" : "text-red-600"}`}>
            {inr(netCollections)}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono bg-background">
              {netMarginPct}% Margin
            </Badge>
            <span>After Expenses</span>
          </div>
        </Card>

        <Card className="p-4 bg-muted/50 border-border/80 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Total Activity</span>
            <div className="p-1.5 rounded-full bg-foreground/10 text-foreground">
              <FileText className="size-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {filteredCollections.length + filteredExpenses.length} Records
          </p>
          <p className="text-[11px] text-muted-foreground font-medium">Combined Transactions</p>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex w-full sm:w-auto overflow-x-auto p-1 bg-muted/60 justify-start gap-1 rounded-xl">
          <TabsTrigger value="summary" className="text-xs px-3 py-1.5 whitespace-nowrap font-semibold">
            <span className="hidden sm:inline">Weekly Net Summary (Deducting Expenses)</span>
            <span className="sm:hidden">Weekly Net Summary</span>
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs px-3 py-1.5 whitespace-nowrap font-semibold">
            <span className="hidden sm:inline">Collection Receipts ({filteredCollections.length})</span>
            <span className="sm:hidden">Collections ({filteredCollections.length})</span>
          </TabsTrigger>
          <TabsTrigger value="disbursements" className="text-xs px-3 py-1.5 whitespace-nowrap font-semibold text-purple-700 dark:text-purple-300">
            <span className="hidden sm:inline">Loan Disbursements / Borrower Given Amount ({filteredDisbursements.length})</span>
            <span className="sm:hidden">Disbursements ({filteredDisbursements.length})</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs px-3 py-1.5 whitespace-nowrap font-semibold">
            <span className="hidden sm:inline">Expense Vouchers ({filteredExpenses.length})</span>
            <span className="sm:hidden">Expenses ({filteredExpenses.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Weekly Collection Cycle Breakdown Table */}
        <TabsContent value="summary">
          <Card className="p-4 space-y-3 border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Calendar className="size-4 text-primary" /> Weekly Collections & Expense Deduction Breakdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Financial week cycle breakdown showing gross collected amounts minus operational expenses for each week.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportCsv("summary")} className="h-8 text-xs">
                <Download className="size-3.5 mr-1" /> Export CSV
              </Button>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading summary report...</p>
            ) : weeklySummaries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No collections or expenses found matching selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="py-2.5 font-bold">Week Cycle & Date Range</TableHead>
                      <TableHead className="py-2.5 font-bold text-right">Gross Collections</TableHead>
                      <TableHead className="py-2.5 font-bold text-right">Expenses Deducted</TableHead>
                      <TableHead className="py-2.5 font-bold text-right">Net Cash Collected</TableHead>
                      <TableHead className="py-2.5 font-bold text-center">Receipts & Vouchers</TableHead>
                      <TableHead className="py-2.5 font-bold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklySummaries.map((row) => (
                      <TableRow key={row.cycleIndex} className="text-xs hover:bg-muted/30">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-foreground text-xs">{row.label}</span>
                            {row.isCurrent ? (
                              <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
                                ★ Current Week
                              </Badge>
                            ) : row.isFuture ? (
                              <Badge variant="outline" className="text-[10px] font-normal bg-muted text-muted-foreground border-border">
                                Upcoming
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                                ✅ Completed Cycle
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-emerald-700">
                          {inr(row.grossCollected)}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-semibold text-rose-600">
                          {row.totalExpenses > 0 ? `- ${inr(row.totalExpenses)}` : "₹0"}
                        </TableCell>
                        <TableCell className={`py-3 text-right font-mono font-bold text-sm ${row.netCollection >= 0 ? "text-primary" : "text-rose-700"}`}>
                          {inr(row.netCollection)}
                        </TableCell>
                        <TableCell className="py-3 text-center font-mono">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-[11px] font-medium text-foreground">
                            {row.collectionCount} Collections • {row.expenseCount} Expenses
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5 bg-primary/5 hover:bg-primary/15 text-primary border-primary/20 font-semibold"
                            onClick={() => {
                              setViewingCycle(row);
                            }}
                          >
                            <Eye className="size-3.5 mr-1" /> View Week Breakdown
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Detailed Collections Register */}
        <TabsContent value="collections">
          <Card className="p-4 space-y-3 border-border/80">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Collection Receipts Register</h3>
                <p className="text-xs text-muted-foreground">List of all borrower payment receipts.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportCsv("collection")} className="h-8 text-xs">
                <Download className="size-3.5 mr-1" /> Export Collections CSV
              </Button>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading receipts...</p>
            ) : filteredCollections.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No collection records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="py-2.5">Receipt #</TableHead>
                      <TableHead className="py-2.5">Date</TableHead>
                      <TableHead className="py-2.5">Borrower Code</TableHead>
                      <TableHead className="py-2.5">Borrower Name</TableHead>
                      <TableHead className="py-2.5 text-right">Amount Collected</TableHead>
                      <TableHead className="py-2.5">Payment Mode</TableHead>
                      <TableHead className="py-2.5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCollections.map((c) => (
                      <TableRow key={c.public_id} className="text-xs">
                        <TableCell className="font-mono font-semibold py-2.5">{c.receipt_number}</TableCell>
                        <TableCell className="font-mono text-[11px] py-2.5">{c.collection_date}</TableCell>
                        <TableCell className="font-mono py-2.5">{c.customer_code}</TableCell>
                        <TableCell className="font-semibold py-2.5">{c.customer_name}</TableCell>
                        <TableCell className="font-mono font-bold text-emerald-700 text-right py-2.5">
                          {inr(Number(c.collected_amount || 0))}
                        </TableCell>
                        <TableCell className="capitalize py-2.5">{c.payment_mode_name || "Cash"}</TableCell>
                        <TableCell className="py-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
                            <CheckCircle2 className="size-3" /> {c.status_name || "Paid"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 3: Loan Disbursements / Borrower Given Amount */}
        <TabsContent value="disbursements">
          <Card className="p-4 space-y-4 border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Users className="size-4 text-purple-600" /> Borrower Loan Disbursements (Given Amount from Route Start)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Complete register of actual physical cash handed out to borrowers when loans were issued.
                </p>
              </div>
              <Badge variant="outline" className="font-mono font-bold text-xs bg-purple-500/10 text-purple-700 border-purple-500/30 px-3 py-1">
                Total Given: {inr(totalDisbursedAmount)}
              </Badge>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading disbursement records...</p>
            ) : filteredDisbursements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No borrower loan disbursements found matching selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="py-2.5 font-bold">Borrower Code & Name</TableHead>
                      <TableHead className="py-2.5 font-bold">Disbursement Date</TableHead>
                      <TableHead className="py-2.5 font-bold">Route Line / Day</TableHead>
                      <TableHead className="py-2.5 font-bold text-right">Principal Loan</TableHead>
                      <TableHead className="py-2.5 font-bold text-right text-purple-700 dark:text-purple-300">Amount Given (Handed Out)</TableHead>
                      <TableHead className="py-2.5 font-bold text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisbursements.map((c) => (
                      <TableRow key={c.public_id} className="text-xs hover:bg-muted/30">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {c.customer_code}
                            </span>
                            <span className="font-bold text-foreground">{c.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 font-mono text-xs">
                          {c.start_date ? String(c.start_date).slice(0, 10) : "-"}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-xs">{(c as any).line_name || c.line || "General Workspace"}</span>
                            {c.collection_day && (
                              <Badge variant="outline" className="text-[10px] capitalize bg-muted font-normal">
                                {c.collection_day}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono text-foreground font-semibold">
                          {inr(Number(c.loan_amount || 0))}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-purple-700 dark:text-purple-300 text-sm">
                          {inr(Number(c.disbursed_amount || c.loan_amount || 0))}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="outline" className={`text-[10px] capitalize font-bold ${
                            c.status === "active" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-muted text-muted-foreground"
                          }`}>
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 4: Detailed Expense Vouchers */}
        <TabsContent value="expenses">
          <Card className="p-4 space-y-3 border-border/80">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Operational Expense Vouchers</h3>
                <p className="text-xs text-muted-foreground">List of all operational expenses deducted from route collections.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportCsv("expense")} className="h-8 text-xs">
                <Download className="size-3.5 mr-1" /> Export Expenses CSV
              </Button>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading expense vouchers...</p>
            ) : filteredExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No expense records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="py-2.5">Date</TableHead>
                      <TableHead className="py-2.5">Category</TableHead>
                      <TableHead className="py-2.5">Description / Notes</TableHead>
                      <TableHead className="py-2.5 text-right">Amount (₹)</TableHead>
                      <TableHead className="py-2.5">Payment Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((e) => (
                      <TableRow key={e.public_id} className="text-xs">
                        <TableCell className="font-mono text-[11px] py-2.5">{e.expense_date}</TableCell>
                        <TableCell className="font-semibold py-2.5">
                          <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-700 border-red-500/20">
                            {e.category_name || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">{e.description || "N/A"}</TableCell>
                        <TableCell className="font-mono font-bold text-red-600 text-right py-2.5">
                          - {inr(Number(e.amount || 0))}
                        </TableCell>
                        <TableCell className="capitalize py-2.5">{e.payment_mode_name || "Cash"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <DailyBreakdownModal
        dateKey={viewingSummaryDate}
        open={Boolean(viewingSummaryDate)}
        setOpen={(v) => {
          if (!v) setViewingSummaryDate(null);
        }}
        collections={collections}
        expenses={expenses}
        customers={customers}
      />

      {/* Weekly Breakdown Detail Modal */}
      <WeeklyBreakdownModal
        cycle={viewingCycle}
        open={!!viewingCycle}
        setOpen={(v) => { if (!v) setViewingCycle(null); }}
        collections={collections}
        expenses={expenses}
        customers={customers}
      />
    </div>
  </FeaturePaywallGuard>
  );
}

function WeeklyBreakdownModal({
  cycle,
  open,
  setOpen,
  collections,
  expenses,
  customers,
}: {
  cycle: { cycleIndex: number; dateFrom: string; dateTo: string; label: string } | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  collections: Collection[];
  expenses: Expense[];
  customers: Customer[];
}) {
  if (!cycle) return null;

  const cycleCollections = collections.filter((c) => {
    const isOpening = c.remarks?.toLowerCase().includes("initial opening");
    if (isOpening) return false;
    const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : (c.created_at ? String(c.created_at).slice(0, 10) : "");
    return entryDate >= cycle.dateFrom && entryDate <= cycle.dateTo;
  });

  const cycleExpenses = expenses.filter((e) => {
    const expDate = e.expense_date ? String(e.expense_date).slice(0, 10) : (e.created_at ? String(e.created_at).slice(0, 10) : "");
    return expDate >= cycle.dateFrom && expDate <= cycle.dateTo;
  });

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => {
    if (c.public_id) customerMap.set(String(c.public_id).toLowerCase(), c);
    if (c.customer_code) customerMap.set(String(c.customer_code).toLowerCase(), c);
  });

  const grossTotal = cycleCollections.reduce((s, c) => s + Number(c.collected_amount || 0), 0);
  const expenseTotal = cycleExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netInHand = grossTotal - expenseTotal;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5 text-primary" /> Week {cycle.cycleIndex} Breakdown — <span className="font-mono text-primary font-bold">{cycle.dateFrom} - {cycle.dateTo}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Detailed list of borrowers who paid, sequence numbers, and net cash calculation after deducting operational expenses for this week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Section 1: Customer Collections List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">Customer Payments ({cycleCollections.length})</h4>
              <span className="font-mono text-xs font-bold text-emerald-700">Gross: {inr(grossTotal)}</span>
            </div>

            {cycleCollections.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center bg-muted/20 rounded-lg">No collection receipts recorded in this week cycle.</p>
            ) : (
              <div className="border border-border rounded-lg max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px]">
                      <TableHead className="py-2">Seq # & Borrower</TableHead>
                      <TableHead className="py-2">Status</TableHead>
                      <TableHead className="py-2">Payment Mode</TableHead>
                      <TableHead className="py-2 text-right">Collected (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycleCollections.map((c) => {
                      const cust = customerMap.get(String(c.customer_public_id).toLowerCase()) ||
                                   customerMap.get(String(c.customer_code).toLowerCase());
                      const seqNo = cust?.sequence_number;
                      const isSkipped = c.status_code === "skipped" || c.status_name?.toLowerCase().includes("skipped");

                      return (
                        <TableRow key={c.public_id} className="text-xs">
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              {seqNo && (
                                <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                                  #{seqNo}
                                </span>
                              )}
                              <div>
                                <p className="font-bold text-foreground">{c.customer_name}</p>
                                <p className="font-mono text-[10px] text-muted-foreground">{c.customer_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {isSkipped ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-400/30 text-[10px] py-0 font-bold">
                                Skipped
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-400/30 text-[10px] py-0 font-bold">
                                Paid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-[11px]">
                            {isSkipped ? "N/A" : (c.payment_mode_name || "Cash")}
                          </TableCell>
                          <TableCell className={`py-2 text-right font-mono font-bold ${isSkipped ? "text-amber-600" : "text-emerald-700"}`}>
                            {isSkipped ? "Skipped (₹0)" : inr(c.collected_amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Section 2: Operational Expenses List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">Operational Expenses ({cycleExpenses.length})</h4>
              <span className="font-mono text-xs font-bold text-rose-600">Deducted: - {inr(expenseTotal)}</span>
            </div>

            {cycleExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center bg-muted/20 rounded-lg">No operational expenses recorded in this week cycle.</p>
            ) : (
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px]">
                      <TableHead className="py-2">Category & Description</TableHead>
                      <TableHead className="py-2">Payment Mode</TableHead>
                      <TableHead className="py-2 text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycleExpenses.map((e) => (
                      <TableRow key={e.public_id} className="text-xs">
                        <TableCell className="py-2">
                          <p className="font-semibold text-foreground">{e.category_name || "General"}</p>
                          <p className="text-[10px] text-muted-foreground">{e.description || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-2 text-[11px]">{e.payment_mode_name || "Cash"}</TableCell>
                        <TableCell className="py-2 text-right font-mono font-bold text-rose-600">
                          - {inr(e.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Section 3: Bottom Net Calculation Box */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Gross Collections Total</span>
              <span className="font-mono font-semibold text-emerald-800">{inr(grossTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Operational Expenses Total</span>
              <span className="font-mono font-semibold text-rose-700">- {inr(expenseTotal)}</span>
            </div>
            <div className="border-t border-emerald-500/20 pt-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-foreground">Week {cycle.cycleIndex} Net Cash Collected</span>
              <span className={`font-mono text-base font-extrabold ${netInHand >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-rose-700"}`}>
                {inr(netInHand)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DailyBreakdownModal({
  dateKey,
  open,
  setOpen,
  collections,
  expenses,
  customers,
}: {
  dateKey: string | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  collections: Collection[];
  expenses: Expense[];
  customers: Customer[];
}) {
  if (!dateKey) return null;

  const dateCollections = collections.filter((c) => {
    const isOpening = c.remarks?.toLowerCase().includes("initial opening");
    if (isOpening) return false;
    const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : "";
    const createdDate = c.created_at ? String(c.created_at).slice(0, 10) : "";
    return (entryDate || createdDate) === dateKey;
  });

  const dateExpenses = expenses.filter((e) => {
    const expDate = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
    const createdDate = e.created_at ? String(e.created_at).slice(0, 10) : "";
    return (expDate || createdDate) === dateKey;
  });

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => {
    if (c.public_id) customerMap.set(String(c.public_id).toLowerCase(), c);
    if (c.customer_code) customerMap.set(String(c.customer_code).toLowerCase(), c);
  });

  const grossTotal = dateCollections.reduce((s, c) => s + Number(c.collected_amount || 0), 0);
  const expenseTotal = dateExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netInHand = grossTotal - expenseTotal;

  const d = new Date(dateKey);
  const dayName = !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { weekday: "long" }) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5 text-primary" /> Daily Breakdown — <span className="font-mono text-primary font-bold">{dateKey}</span> ({dayName})
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Detailed list of borrowers who paid, sequence numbers, and net cash calculation after deducting operational expenses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Section 1: Customer Collections List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">Customer Payments ({dateCollections.length})</h4>
              <span className="font-mono text-xs font-bold text-emerald-700">Gross: {inr(grossTotal)}</span>
            </div>

            {dateCollections.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center bg-muted/20 rounded-lg">No collection receipts recorded on this date.</p>
            ) : (
              <div className="border border-border rounded-lg max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px]">
                      <TableHead className="py-2">Seq # & Borrower</TableHead>
                      <TableHead className="py-2">Status</TableHead>
                      <TableHead className="py-2">Payment Mode</TableHead>
                      <TableHead className="py-2 text-right">Collected (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateCollections.map((c) => {
                      const cust = customerMap.get(String(c.customer_public_id).toLowerCase()) ||
                                   customerMap.get(String(c.customer_code).toLowerCase());
                      const seqNo = cust?.sequence_number;
                      const isSkipped = c.status_code === "skipped" || c.status_name?.toLowerCase().includes("skipped");

                      return (
                        <TableRow key={c.public_id} className="text-xs">
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              {seqNo && (
                                <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                                  #{seqNo}
                                </span>
                              )}
                              <div>
                                <p className="font-bold text-foreground">{c.customer_name}</p>
                                <p className="font-mono text-[10px] text-muted-foreground">{c.customer_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {isSkipped ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-400/30 text-[10px] py-0 font-bold">
                                Skipped
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-400/30 text-[10px] py-0 font-bold">
                                Paid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-[11px]">
                            {isSkipped ? "N/A" : (c.payment_mode_name || "Cash")}
                          </TableCell>
                          <TableCell className={`py-2 text-right font-mono font-bold ${isSkipped ? "text-amber-600" : "text-emerald-700"}`}>
                            {isSkipped ? "Skipped (₹0)" : inr(c.collected_amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Section 2: Operational Expenses List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">Operational Expenses ({dateExpenses.length})</h4>
              <span className="font-mono text-xs font-bold text-red-600">Deducted: - {inr(expenseTotal)}</span>
            </div>

            {dateExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center bg-muted/20 rounded-lg">No operational expenses recorded on this date.</p>
            ) : (
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px]">
                      <TableHead className="py-2">Category & Description</TableHead>
                      <TableHead className="py-2">Payment Mode</TableHead>
                      <TableHead className="py-2 text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateExpenses.map((e) => (
                      <TableRow key={e.public_id} className="text-xs">
                        <TableCell className="py-2">
                          <p className="font-semibold text-foreground">{e.category_name || "General"}</p>
                          <p className="text-[10px] text-muted-foreground">{e.description || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-2 text-[11px]">{e.payment_mode_name || "Cash"}</TableCell>
                        <TableCell className="py-2 text-right font-mono font-bold text-red-600">
                          - {inr(e.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Section 3: Bottom Net Calculation Box */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Gross Collections Total</span>
              <span className="font-mono font-semibold text-emerald-800">{inr(grossTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium border-b border-emerald-500/20 pb-2">
              <span className="text-muted-foreground">(-) Operational Expenses Deducted</span>
              <span className="font-mono font-semibold text-red-600">- {inr(expenseTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold pt-0.5">
              <span className="text-emerald-900 font-bold">NET CASH IN HAND ({dateKey})</span>
              <span className={`font-mono text-lg font-bold ${netInHand >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {inr(netInHand)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
