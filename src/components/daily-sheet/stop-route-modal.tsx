import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Square, CheckCircle2, RefreshCw, Calculator, TrendingUp, TrendingDown, Receipt, Plus, Trash2, AlertTriangle, XCircle } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, CollectionLine, Customer } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";

export interface RouteSettlementAnalytics {
  isSettled: boolean;
  settledAt?: string;
  openingCash: number;
  totalCollected: number;
  totalDisbursed: number;
  totalExpenses: number;
  netHandCash: number;
}

export interface ExpenseItemDraft {
  id: string;
  category_id: number;
  amount: string;
  payment_mode_id: number;
  description: string;
  isExisting?: boolean;
}

export function StopRouteSettlementModal({
  open,
  onClose,
  activeLine,
  selectedDate,
  openingCash,
  totalCollected,
  customers,
  onConfirmSettlement,
}: {
  open: boolean;
  onClose: () => void;
  activeLine: CollectionLine;
  selectedDate: string;
  openingCash: number;
  totalCollected: number;
  customers: Customer[];
  onConfirmSettlement: (analytics: RouteSettlementAnalytics) => void;
}) {
  // Automatically calculate Total Loans Disbursed Today based on new customers added for this line/date
  const autoDisbursedSum = useMemo(() => {
    return customers.reduce((acc, c) => {
      const createdDate = (c.start_date || (c as any).created_at || "").slice(0, 10);
      if (createdDate === selectedDate) {
        return acc + (parseFloat(String(c.disbursed_amount || c.loan_amount)) || 0);
      }
      return acc;
    }, 0);
  }, [customers, selectedDate]);

  const [openingCashInput, setOpeningCashInput] = useState<string>(String(openingCash));
  const [disbursedInput, setDisbursedInput] = useState<string>(String(autoDisbursedSum));

  // Master Data States
  const [expenseCategories, setExpenseCategories] = useState<MasterItem[]>([]);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);

  // Multiple Expense Items List State
  const [expenseEntries, setExpenseEntries] = useState<ExpenseItemDraft[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load Master Data & Existing Expenses for selectedDate
  useEffect(() => {
    if (open && selectedDate) {
      setOpeningCashInput(String(openingCash));
      setLoadingInitial(true);
      Promise.all([
        mastersService.getExpenseCategories(),
        mastersService.getPaymentModes(),
        guestWorkspaceService.getExpenses({ date_from: selectedDate, date_to: selectedDate }),
      ])
        .then(([cats, modes, expRes]) => {
          setExpenseCategories(cats || []);
          setPaymentModes(modes || []);

          const fetchedExp = expRes.data || [];
          if (fetchedExp.length > 0) {
            const mapped: ExpenseItemDraft[] = fetchedExp.map((item, idx) => ({
              id: item.public_id || String(idx),
              category_id: typeof item.category === "object" ? (item.category as any)?.id : (item.category || cats[0]?.id || 1),
              amount: String(item.amount),
              payment_mode_id: item.payment_mode || modes[0]?.id || 1,
              description: item.description || "",
              isExisting: true,
            }));
            setExpenseEntries(mapped);
          } else {
            setExpenseEntries([]);
          }
        })
        .catch((err) => {
          console.error("Failed to load settlement master data:", err);
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [open, selectedDate, openingCash]);

  // Keep disbursedInput in sync with autoDisbursedSum when modal opens
  useEffect(() => {
    setDisbursedInput(String(autoDisbursedSum));
  }, [autoDisbursedSum]);

  // Total Expenses Calculated dynamically from expenseEntries list
  const totalExpenses = useMemo(() => {
    return expenseEntries.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  }, [expenseEntries]);

  const numOpeningCash = parseFloat(openingCashInput) || 0;
  const numDisbursed = parseFloat(disbursedInput) || 0;
  const netClosingCash = numOpeningCash + totalCollected - numDisbursed - totalExpenses;
  const isNegativeClosingCash = netClosingCash < 0;

  // Add new blank expense row
  const handleAddExpenseRow = () => {
    const defaultCat = expenseCategories[0]?.id || 1;
    const defaultMode = paymentModes[0]?.id || 1;
    setExpenseEntries((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}_${Math.random()}`,
        category_id: defaultCat,
        amount: "",
        payment_mode_id: defaultMode,
        description: "",
        isExisting: false,
      },
    ]);
  };

  // Remove expense row
  const handleRemoveExpenseRow = (id: string) => {
    setExpenseEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Update expense row field
  const handleUpdateExpenseRow = (id: string, field: keyof ExpenseItemDraft, value: any) => {
    setExpenseEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNegativeClosingCash) return;

    setSubmitting(true);

    try {
      // Save any newly added expense entries to backend API
      const newDrafts = expenseEntries.filter((e) => !e.isExisting && (parseFloat(e.amount) || 0) > 0);
      for (const draft of newDrafts) {
        await guestWorkspaceService.recordExpense({
          category: draft.category_id,
          amount: parseFloat(draft.amount),
          expense_date: selectedDate,
          payment_mode: draft.payment_mode_id,
          description: draft.description || `Route expense for ${activeLine.name}`,
        });
      }

      const analytics: RouteSettlementAnalytics = {
        isSettled: true,
        settledAt: new Date().toISOString(),
        openingCash: numOpeningCash,
        totalCollected,
        totalDisbursed: numDisbursed,
        totalExpenses,
        netHandCash: netClosingCash,
      };

      onConfirmSettlement(analytics);
    } catch (err: any) {
      console.error("Failed to save settlement expenses:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Square className="size-6 fill-rose-600 text-rose-600" /> Close & Settle Route Session
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review collection analytics, new disbursements, and expenses for <strong>{activeLine.name}</strong> on <strong>{selectedDate}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Opening & Collected Analytics Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Editable Starting Opening Cash Float */}
            <div className="p-3.5 bg-muted/60 border border-border rounded-2xl space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold block">
                Starting Opening Cash Float (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  className="pl-7 font-mono font-bold text-sm h-10 bg-background"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  placeholder="0"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Opening cash float in bag at start (editable if extra cash was added).
              </p>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold flex items-center gap-1">
                <TrendingUp className="size-3 text-emerald-600" /> Total Collected Today
              </span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{inr(totalCollected)}</span>
            </div>
          </div>

          {/* New Loans Disbursed Input (Auto-Calculated from new borrowers) */}
          <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <TrendingDown className="size-4 text-rose-600" /> Total Loans Disbursed Today (₹)
              </Label>
              {autoDisbursedSum > 0 && (
                <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold">
                  Auto-Calculated from New Borrowers
                </Badge>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">₹</span>
              <Input
                type="number"
                min="0"
                step="any"
                className="pl-7 font-mono font-bold text-sm h-10 bg-background"
                value={disbursedInput}
                onChange={(e) => setDisbursedInput(e.target.value)}
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Principal disbursed for new borrowers added on this route today: <strong>{inr(autoDisbursedSum)}</strong>.
            </p>
          </div>

          {/* Inline Route Expenses Entry List Section */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Receipt className="size-4 text-amber-600" /> Route Expenses Recorded Today
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Log petrol, food, travel, and route expenses across different payment modes.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddExpenseRow}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1 rounded-xl h-8 px-2.5"
              >
                <Plus className="size-3.5" /> Add Expense
              </Button>
            </div>

            {loadingInitial ? (
              <p className="text-xs text-muted-foreground py-2">Loading expense categories...</p>
            ) : expenseEntries.length === 0 ? (
              <div className="p-3 text-center border border-dashed rounded-xl bg-background text-xs text-muted-foreground">
                No expenses logged for this route session today. Click <strong>+ Add Expense</strong> to record petrol, food, or travel costs.
              </div>
            ) : (
              <div className="space-y-2">
                {expenseEntries.map((item) => (
                  <div key={item.id} className="p-3 bg-background border border-border rounded-xl space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Expense Category */}
                      <div>
                        <Label className="text-[10px] font-bold">Category</Label>
                        <Select
                          value={String(item.category_id)}
                          onValueChange={(v) => handleUpdateExpenseRow(item.id, "category_id", Number(v))}
                        >
                          <SelectTrigger className="h-8 text-xs font-semibold">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Expense Amount */}
                      <div>
                        <Label className="text-[10px] font-bold">Amount (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="h-8 font-mono font-bold text-xs"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => handleUpdateExpenseRow(item.id, "amount", e.target.value)}
                        />
                      </div>

                      {/* Payment Method / Mode */}
                      <div>
                        <Label className="text-[10px] font-bold">Payment Mode</Label>
                        <Select
                          value={String(item.payment_mode_id)}
                          onValueChange={(v) => handleUpdateExpenseRow(item.id, "payment_mode_id", Number(v))}
                        >
                          <SelectTrigger className="h-8 text-xs font-semibold">
                            <SelectValue placeholder="Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentModes.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Description / Notes & Trash Button */}
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        className="h-8 text-xs flex-1"
                        placeholder="Notes (e.g. Petrol for bike, Tea for team)"
                        value={item.description}
                        onChange={(e) => handleUpdateExpenseRow(item.id, "description", e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExpenseRow(item.id)}
                        className="size-8 text-rose-600 hover:bg-rose-500/10 rounded-lg shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between text-xs font-bold font-mono pt-1 text-amber-700 dark:text-amber-300">
                  <span>Total Route Expenses ({expenseEntries.length} items):</span>
                  <span>{inr(totalExpenses)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Negative Balance Alert Warning Banner */}
          {isNegativeClosingCash && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="size-4 shrink-0 text-rose-600" /> Negative Handover Cash Balance ({inr(netClosingCash)})
              </div>
              <p className="text-[11px] leading-relaxed">
                Opening Cash + Collected ({inr(numOpeningCash + totalCollected)}) is less than total Disbursed Loans & Expenses ({inr(numDisbursed + totalExpenses)}). Please update your <strong>Starting Opening Cash Float</strong> above.
              </p>
            </div>
          )}

          {/* Calculated Net Closing Handbag Cash Float Box */}
          <div className={`p-4 rounded-2xl space-y-2 border transition-all ${
            isNegativeClosingCash
              ? "bg-rose-500/10 border-rose-500/40"
              : "bg-emerald-500/10 border-emerald-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                <Calculator className="size-4 text-primary" /> Net Closing Handbag Float (To Handover):
              </span>
              <Badge className={`font-mono font-bold text-sm px-2.5 py-0.5 ${
                isNegativeClosingCash
                  ? "bg-rose-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}>
                {inr(netClosingCash)}
              </Badge>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">
              Formula: {inr(numOpeningCash)} (Opening) + {inr(totalCollected)} (Collected) - {inr(numDisbursed)} (Disbursed) - {inr(totalExpenses)} (Expenses) = <strong className={isNegativeClosingCash ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>{inr(netClosingCash)}</strong>
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || isNegativeClosingCash}
              className={`font-bold gap-1.5 transition-all ${
                isNegativeClosingCash
                  ? "bg-slate-400 cursor-not-allowed opacity-60 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {submitting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : isNegativeClosingCash ? (
                <XCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {isNegativeClosingCash ? "Cannot Settle (Negative Float)" : "Confirm & Settle Route Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
