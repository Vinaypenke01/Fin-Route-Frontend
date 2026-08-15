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
import { Search, Download, Calendar, IndianRupee, Wallet, ArrowDownRight, ArrowUpRight, Filter, RefreshCw, FileText, CheckCircle2, Printer, Eye, Image as ImageIcon, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Collection, Expense, Customer } from "@/lib/services/guest-workspace-service";
import { downloadFinancialReportImage } from "@/lib/download-report-image";

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
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [viewingSummaryDate, setViewingSummaryDate] = useState<string | null>(null);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [colRes, expRes, custRes, ws] = await Promise.all([
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
        guestWorkspaceService.getCustomers({ status: "active", page_size: 1000 }),
        guestWorkspaceService.getWorkspace(),
      ]);
      setCollections(colRes.data || []);
      setExpenses(expRes.data || []);
      setCustomers(custRes.data || []);

      const savedDays = ws.allowed_collection_days || [];
      setConfiguredDays(savedDays);
      setSelectedDay("all");
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
  }, [dateFrom, dateTo, selectedLine]);

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
    return earliest;
  }, [customers, collections, expenses, today]);

  const weeklyCycles = useMemo(() => {
    if (!earliestAnchorDate) return [];
    const cycles: { index: number; label: string; dateFrom: string; dateTo: string; isCurrent: boolean }[] = [];

    let currStart = new Date(earliestAnchorDate);
    if (isNaN(currStart.getTime())) return [];

    const now = new Date();
    let index = 1;

    const formatFilterDate = (dStr: string) => {
      if (!dStr) return "All";
      if (dStr === today) return "Today";
      try {
        const [y, m, d] = dStr.split("-");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
      } catch {
        return dStr;
      }
    };

    while (index <= 156) {
      const currEnd = new Date(currStart);
      currEnd.setDate(currEnd.getDate() + 6);

      const fromStr = currStart.toISOString().slice(0, 10);
      const toStr = currEnd.toISOString().slice(0, 10);
      const isCurrent = today >= fromStr && today <= toStr;

      cycles.push({
        index,
        label: `Week ${index}: ${formatFilterDate(fromStr)} – ${formatFilterDate(toStr)}${isCurrent ? " (Active)" : ""}`,
        dateFrom: fromStr,
        dateTo: toStr,
        isCurrent,
      });

      if (currStart > now) break;

      currStart = new Date(currEnd);
      currStart.setDate(currStart.getDate() + 1);
      index++;
    }

    return cycles;
  }, [earliestAnchorDate, today]);

  // Auto-select current active week cycle on initial load
  useEffect(() => {
    if (weeklyCycles.length > 0 && selectedCycleIndex === null) {
      const currentCycle = weeklyCycles.find((c) => c.isCurrent);
      if (currentCycle) {
        setSelectedCycleIndex(currentCycle.index);
        setDateFrom(currentCycle.dateFrom);
        setDateTo(currentCycle.dateTo);
      } else {
        const lastCycle = weeklyCycles[weeklyCycles.length - 1];
        setSelectedCycleIndex(lastCycle.index);
        setDateFrom(lastCycle.dateFrom);
        setDateTo(lastCycle.dateTo);
      }
    }
  }, [weeklyCycles]);

  const handleSelectCycle = (index: number) => {
    const cycle = weeklyCycles.find((c) => c.index === index);
    if (cycle) {
      setSelectedCycleIndex(cycle.index);
      setDateFrom(cycle.dateFrom);
      setDateTo(cycle.dateTo);
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

  // Quick Preset Handlers
  const handlePresetToday = () => {
    const t = getTodayStr();
    setDateFrom(t);
    setDateTo(t);
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

  const handleClearFilters = () => {
    setDateFrom(today);
    setDateTo(today);
    setSelectedDay("all");
    setSelectedCycleIndex(null);
    setSearchQuery("");
  };

  // Filter collections by date and search query
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Exclude initial opening balance entries from regular revenue reports
      const isOpening = c.remarks?.toLowerCase().includes("initial opening");
      if (isOpening) return false;

      const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : "";
      const createdDate = c.created_at ? String(c.created_at).slice(0, 10) : "";
      const targetDate = entryDate || createdDate;

      if (dateFrom && targetDate && targetDate < dateFrom) return false;
      if (dateTo && targetDate && targetDate > dateTo) return false;

      if (selectedDay !== "all") {
        const d = new Date(targetDate);
        if (!isNaN(d.getTime())) {
          const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          if (dayName !== selectedDay.toLowerCase()) return false;
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
  }, [collections, dateFrom, dateTo, selectedDay, searchQuery]);

  // Filter expenses by date and search query
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
      const createdDate = e.created_at ? String(e.created_at).slice(0, 10) : "";
      const targetDate = expDate || createdDate;

      if (dateFrom && targetDate && targetDate < dateFrom) return false;
      if (dateTo && targetDate && targetDate > dateTo) return false;

      if (selectedDay !== "all") {
        const d = new Date(targetDate);
        if (!isNaN(d.getTime())) {
          const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          if (dayName !== selectedDay.toLowerCase()) return false;
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
  }, [expenses, dateFrom, dateTo, selectedDay, searchQuery]);

  // Total Metrics
  const grossCollections = useMemo(() => {
    return filteredCollections.reduce((sum, c) => sum + Number(c.collected_amount || 0), 0);
  }, [filteredCollections]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const netCollections = grossCollections - totalExpenses;
  const netMarginPct = grossCollections > 0 ? ((netCollections / grossCollections) * 100).toFixed(1) : "0.0";

  // Grouped Daily Summary (Date/Day wise breakdown deducting expenses)
  const dailySummaries = useMemo(() => {
    const map = new Map<string, DailySummaryRow>();

    // 1. Accumulate collections by date
    filteredCollections.forEach((c) => {
      const dateKey = c.collection_date ? String(c.collection_date).slice(0, 10) : "Unknown";
      const d = new Date(dateKey);
      const dayName = !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { weekday: "long" }) : "";
      
      const existing = map.get(dateKey) || {
        dateKey,
        displayDate: dateKey,
        dayName,
        grossCollected: 0,
        totalExpenses: 0,
        netCollection: 0,
        collectionCount: 0,
        expenseCount: 0,
      };

      existing.grossCollected += Number(c.collected_amount || 0);
      existing.collectionCount += 1;
      existing.netCollection = existing.grossCollected - existing.totalExpenses;
      map.set(dateKey, existing);
    });

    // 2. Accumulate expenses by date
    filteredExpenses.forEach((e) => {
      const dateKey = e.expense_date ? String(e.expense_date).slice(0, 10) : "Unknown";
      const d = new Date(dateKey);
      const dayName = !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { weekday: "long" }) : "";

      const existing = map.get(dateKey) || {
        dateKey,
        displayDate: dateKey,
        dayName,
        grossCollected: 0,
        totalExpenses: 0,
        netCollection: 0,
        collectionCount: 0,
        expenseCount: 0,
      };

      existing.totalExpenses += Number(e.amount || 0);
      existing.expenseCount += 1;
      existing.netCollection = existing.grossCollected - existing.totalExpenses;
      map.set(dateKey, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredCollections, filteredExpenses]);

  // Export CSV Handler
  const handleExportCsv = (type: "summary" | "collection" | "expense") => {
    if (type === "summary") {
      let csv = "Date,Day,Gross Collections (INR),Expenses Deducted (INR),Net Collection (INR),Collection Receipts,Expense Entries\n";
      dailySummaries.forEach((row) => {
        csv += `"${row.dateKey}","${row.dayName}",${row.grossCollected},${row.totalExpenses},${row.netCollection},${row.collectionCount},${row.expenseCount}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finroute_daily_net_summary_${getTodayStr()}.csv`;
      a.click();
    } else {
      const url = guestWorkspaceService.getReportExportUrl(type, "csv");
      window.open(url, "_blank");
    }
  };

  const handleExportReportImage = () => {
    downloadFinancialReportImage(dailySummaries, {
      dateFrom,
      dateTo,
      dayFilter: selectedDay,
      workspaceName: "FinRoute Finance Workspace",
    });
  };

  return (
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

      {/* 1. Route Line Filter Selection */}
      {lines.length > 0 && (
        <Card className="p-3.5 space-y-2 bg-card border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" /> Filter Reports by Route Line:
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
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                selectedLine === "all"
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
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    isSelected
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

      {/* 2. Smart Weekly Collection & Financial Cycle Navigation Bar */}
      <Card className="p-4 space-y-3 bg-card border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Weekly Financial Report Cycles</h3>
            <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
              {dateFrom === dateTo ? (dateFrom === today ? "Today" : dateFrom) : `${dateFrom || "Start"} to ${dateTo || "End"}`}
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
            <Button size="sm" variant="ghost" onClick={handleClearFilters} className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
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
                <SelectValue placeholder="Select Report Week Cycle..." />
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

        {/* Route Day Filter & Search & Custom Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Route Day Filter</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="mt-1 h-8 sm:h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {dynamicDaysList.map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Search Records</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search borrower, receipt, category..."
                className="pl-8 h-8 sm:h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {showCustomRange && (
            <div className="grid grid-cols-2 gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground">From Date</Label>
                <Input
                  type="date"
                  className="mt-1 h-8 sm:h-9 text-xs font-mono px-2"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setSelectedCycleIndex(null);
                  }}
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground">To Date</Label>
                <Input
                  type="date"
                  className="mt-1 h-8 sm:h-9 text-xs font-mono px-2"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setSelectedCycleIndex(null);
                  }}
                />
              </div>
            </div>
          )}
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
            <span className="hidden sm:inline">Daily Net Summary (Deducting Expenses)</span>
            <span className="sm:hidden">Daily Net Summary</span>
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs px-3 py-1.5 whitespace-nowrap font-semibold">
            <span className="hidden sm:inline">Collection Receipts ({filteredCollections.length})</span>
            <span className="sm:hidden">Collections ({filteredCollections.length})</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs px-3 py-1.5 whitespace-nowrap font-semibold">
            <span className="hidden sm:inline">Expense Vouchers ({filteredExpenses.length})</span>
            <span className="sm:hidden">Expenses ({filteredExpenses.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Daily & Route Day Breakdown Table */}
        <TabsContent value="summary">
          <Card className="p-4 space-y-3 border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Calendar className="size-4 text-primary" /> Daily Collections & Expense Deduction Breakdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Individual date-wise summary showing gross collected amounts minus operational expenses.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportCsv("summary")} className="h-8 text-xs">
                <Download className="size-3.5 mr-1" /> Export CSV
              </Button>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading summary report...</p>
            ) : dailySummaries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No collections or expenses found matching selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="py-2.5 font-bold">Date & Route Day</TableHead>
                      <TableHead className="py-2.5 font-bold text-right">Gross Collections</TableHead>
                      <TableHead className="py-2.5 font-bold text-right">Expenses Deducted</TableHead>
                      <TableHead className="py-2.5 font-bold text-right">Net Cash Collected</TableHead>
                      <TableHead className="py-2.5 font-bold text-center">Receipts Count</TableHead>
                      <TableHead className="py-2.5 font-bold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySummaries.map((row) => (
                      <TableRow key={row.dateKey} className="text-xs hover:bg-muted/30">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground text-xs">{row.dateKey}</span>
                            {row.dayName && (
                              <Badge variant="outline" className="text-[10px] capitalize font-medium bg-primary/5 text-primary border-primary/20">
                                {row.dayName}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-emerald-700">
                          {inr(row.grossCollected)}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-semibold text-red-600">
                          {row.totalExpenses > 0 ? `- ${inr(row.totalExpenses)}` : "₹0"}
                        </TableCell>
                        <TableCell className={`py-3 text-right font-mono font-bold text-sm ${row.netCollection >= 0 ? "text-primary" : "text-red-700"}`}>
                          {inr(row.netCollection)}
                        </TableCell>
                        <TableCell className="py-3 text-center font-mono">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-foreground">
                            {row.collectionCount} Collections • {row.expenseCount} Expenses
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5 bg-primary/5 hover:bg-primary/15 text-primary border-primary/20 font-semibold"
                            onClick={() => setViewingSummaryDate(row.dateKey)}
                          >
                            <Eye className="size-3.5 mr-1" /> View
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

        {/* Tab 3: Detailed Expenses Register */}
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
    </div>
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
