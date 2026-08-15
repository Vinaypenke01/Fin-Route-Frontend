import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Filter, Calendar, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, Users, Trash2 } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Expense } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";
import { TableSkeletonRows } from "@/components/ui/skeleton-loaders";

export const Route = createFileRoute("/app/expenses")({
  head: () => ({ meta: [{ title: "Expenses — FinRoute" }, { name: "description", content: "Track every rupee spent." }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const today = getTodayStr();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      // Auto-select line matching today's weekday
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

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await guestWorkspaceService.getExpenses({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page_size: 1000,
      });
      setExpenses(res.data || []);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [dateFrom, dateTo]);

  // ─── Earliest Anchor Date & Weekly Cycles Calculation ───────────────────────
  const earliestAnchorDate = useMemo(() => {
    let earliest = today;
    expenses.forEach((e) => {
      const ed = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
      if (ed && ed < earliest) {
        earliest = ed;
      }
    });
    return earliest;
  }, [expenses, today]);

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

  const handleClearDates = () => {
    setDateFrom(today);
    setDateTo(today);
    setSelectedCycleIndex(null);
    setQ("");
  };

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
      const createdDate = e.created_at ? String(e.created_at).slice(0, 10) : "";
      const targetDate = expDate || createdDate;

      if (dateFrom && targetDate && targetDate < dateFrom) return false;
      if (dateTo && targetDate && targetDate > dateTo) return false;

      // Filter by Route Line if assigned
      if (selectedLine !== "all") {
        const lineId = (e as any).line_public_id || (e as any).line;
        if (lineId && lineId !== selectedLine) return false;
      }

      if (q.trim()) {
        const qLower = q.toLowerCase();
        const matchDesc = e.description?.toLowerCase().includes(qLower);
        const matchCat = e.category_name?.toLowerCase().includes(qLower);
        const matchMode = e.payment_mode_name?.toLowerCase().includes(qLower);
        if (!matchDesc && !matchCat && !matchMode) return false;
      }
      return true;
    });
  }, [expenses, dateFrom, dateTo, selectedLine, q]);

  const totalExpense = useMemo(() => {
    return filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filtered]);

  const formatDateLabel = () => {
    if (!dateFrom && !dateTo) return "All Time";
    if (dateFrom === dateTo) return dateFrom === getTodayStr() ? "Today" : dateFrom;
    return `${dateFrom || "Start"} to ${dateTo || "End"}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4 bg-red-500/5 border-red-500/20">
          <p className="text-xs font-medium uppercase tracking-wide text-red-800">Operational Expenses ({formatDateLabel()})</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-red-700">{loading ? "..." : inr(totalExpense)}</p>
          <p className="text-xs text-red-800/80">{filtered.length} entries recorded</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Average Expense ({formatDateLabel()})</p>
          <p className="mt-1.5 font-display text-2xl font-bold">
            {loading ? "..." : inr(filtered.length ? totalExpense / filtered.length : 0)}
          </p>
          <p className="text-xs text-muted-foreground">Per entry average</p>
        </Card>
      </div>

      {/* 1. Route Line Filter Selection */}
      {lines.length > 0 && (
        <Card className="p-3.5 space-y-2 bg-card border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" /> Filter by Route Line:
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
              All Lines ({expenses.length})
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

      {/* 2. Smart Weekly Collection Cycle Navigation Bar */}
      <Card className="p-4 space-y-3 bg-card border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Weekly Expense Cycles</h3>
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
            <Button size="sm" variant="ghost" onClick={handleClearDates} className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
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
                <SelectValue placeholder="Select Expense Week Cycle..." />
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

        {/* Search & Collapsible Custom Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Search Expenses</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Category or notes…" className="pl-8 h-8 sm:h-9 text-xs" />
            </div>
          </div>
          {showCustomRange && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground">From Date</Label>
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
                <Label className="text-[11px] font-semibold text-muted-foreground">To Date</Label>
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
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">Expense Register</h3>
            <span className="text-xs text-muted-foreground">({filtered.length} entries)</span>
          </div>
          <AddExpenseModal
            open={isModalOpen}
            setOpen={setIsModalOpen}
            onSuccess={loadExpenses}
            defaultExpenseDate={dateFrom || today}
            lines={lines}
            defaultLineId={selectedLine !== "all" ? selectedLine : ""}
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Route Line</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows rows={4} columns={6} />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No expense entries recorded for this filter. Click "Add Expense" to log your operational expense.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e: any) => (
                  <TableRow key={e.public_id}>
                    <TableCell className="text-xs font-mono font-medium">{e.expense_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.category_name || "General"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {e.line_name ? (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <MapPin className="size-3 text-primary" /> {e.line_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">General</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{e.description || "-"}</TableCell>
                    <TableCell className="text-xs font-medium">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                        {e.payment_mode_name || "Cash"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{inr(e.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function AddExpenseModal({
  open,
  setOpen,
  onSuccess,
  defaultExpenseDate,
  lines = [],
  defaultLineId = "",
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  defaultExpenseDate?: string;
  lines?: any[];
  defaultLineId?: string;
}) {
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<number>(1);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<number | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [amountStr, setAmountStr] = useState<string>("500");
  const [expenseDate, setExpenseDate] = useState<string>(defaultExpenseDate || new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMasters() {
      try {
        const [cats, modes] = await Promise.all([
          mastersService.getExpenseCategories(),
          mastersService.getPaymentModes(),
        ]);
        setCategories(cats);
        setPaymentModes(modes);
        if (cats[0]) setSelectedCat(cats[0].id);
        if (modes[0]) setSelectedPaymentMode(modes[0].id);
      } catch (err) {
        console.error("Failed to load master data:", err);
      }
    }
    if (open) {
      loadMasters();
      setAmountStr("500");
      setDescription("");
      setError(null);
      setExpenseDate(defaultExpenseDate || new Date().toISOString().split("T")[0]);
      setSelectedLineId(defaultLineId || "");
    }
  }, [open, defaultExpenseDate, defaultLineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amountStr) || 0;
    if (numAmount <= 0) {
      setError("Expense amount must be greater than ₹0.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description or note for this expense.");
      return;
    }
    setSubmitting(true);
    try {
      await guestWorkspaceService.recordExpense({
        category: selectedCat,
        amount: numAmount,
        expense_date: expenseDate,
        description: description.trim(),
        payment_mode: selectedPaymentMode || undefined,
        line: selectedLineId || undefined,
      } as any);
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to record expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const isBackdated = expenseDate && expenseDate !== todayStr;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-bold gap-1">
          <Plus className="size-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Operational Expense</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Record fuel, agent tea/snacks, stationery, or line operational expenses.
          </DialogDescription>
        </DialogHeader>

        {isBackdated && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between font-medium">
            <span>📅 Auto-prefilled for selected date: <strong>{expenseDate}</strong></span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-[10px] text-amber-800 dark:text-amber-200 underline"
              onClick={() => setExpenseDate(todayStr)}
            >
              Set to Today
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {lines.length > 0 && (
            <div>
              <label className="text-xs font-semibold">Route Line (Optional)</label>
              <Select value={selectedLineId} onValueChange={(v) => setSelectedLineId(v)}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="All Lines / General Workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General Workspace (No specific line)</SelectItem>
                  {lines.map((l) => (
                    <SelectItem key={l.public_id} value={l.public_id}>
                      📍 {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">Expense Category *</label>
              <Select value={selectedCat.toString()} onValueChange={(v) => setSelectedCat(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold">Payment Mode / Option *</label>
              <Select
                value={selectedPaymentMode ? selectedPaymentMode.toString() : ""}
                onValueChange={(v) => setSelectedPaymentMode(Number(v))}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
                <SelectContent>
                  {paymentModes.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Amount (₹) *</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="mt-1 font-mono font-bold text-base"
              value={amountStr}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "");
                setAmountStr(cleaned);
              }}
              placeholder="e.g. 500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Expense Date *</label>
            <Input type="date" className="mt-1" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-semibold">Description / Remarks *</label>
            <Input className="mt-1 text-xs" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Petrol for collection bike / Chai for field agents" required />
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={submitting}>
            {submitting ? "Saving Expense..." : "Record Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
