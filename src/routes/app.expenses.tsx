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
import { Plus, Search, Filter, Calendar, RefreshCw } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Expense } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";
import { TableSkeletonRows } from "@/components/ui/skeleton-loaders";

export const Route = createFileRoute("/app/expenses")({
  head: () => ({ meta: [{ title: "Expenses — FinRoute" }, { name: "description", content: "Track every rupee spent." }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Date Filters
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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
    loadExpenses();
  }, [dateFrom, dateTo]);

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
    const dayOfWeek = now.getDay();
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

  const handleClearDates = () => {
    setDateFrom("");
    setDateTo("");
    setQ("");
  };

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = e.expense_date ? String(e.expense_date).slice(0, 10) : "";
      const createdDate = e.created_at ? String(e.created_at).slice(0, 10) : "";
      const targetDate = expDate || createdDate;

      if (dateFrom && targetDate && targetDate < dateFrom) return false;
      if (dateTo && targetDate && targetDate > dateTo) return false;

      if (q.trim()) {
        const qLower = q.toLowerCase();
        const matchDesc = e.description?.toLowerCase().includes(qLower);
        const matchCat = e.category_name?.toLowerCase().includes(qLower);
        const matchMode = e.payment_mode_name?.toLowerCase().includes(qLower);
        if (!matchDesc && !matchCat && !matchMode) return false;
      }
      return true;
    });
  }, [expenses, dateFrom, dateTo, q]);

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

      {/* Date Range Filtration Bar */}
      <Card className="p-4 space-y-3 bg-card border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Date Range & Search Filter</h3>
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
            <Button size="sm" variant="ghost" onClick={handleClearDates} className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className="size-3 mr-1" /> Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Search Expenses</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Category or notes…" className="pl-8 h-8 sm:h-9 text-xs" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">Expense Register</h3>
            <span className="text-xs text-muted-foreground">({filtered.length} entries)</span>
          </div>
          <AddExpenseModal open={isModalOpen} setOpen={setIsModalOpen} onSuccess={loadExpenses} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows rows={4} columns={5} />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    No expense entries recorded yet. Click "Add Expense" to log your first operational expense.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.public_id}>
                    <TableCell className="text-xs">{e.expense_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.category_name || "General"}</Badge>
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
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<number>(1);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<number | null>(null);
  const [amountStr, setAmountStr] = useState<string>("500");
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split("T")[0]);
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
    }
  }, [open]);

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
      });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to record expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4 mr-1" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Operational Expense</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Record fuel, agent tea/snacks, stationery, or workspace operational expenses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
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
