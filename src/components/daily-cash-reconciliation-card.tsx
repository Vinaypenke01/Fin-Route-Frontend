import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Wallet, ArrowDownRight, ArrowUpRight, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, CashReconciliation } from "@/lib/services/guest-workspace-service";

interface DailyCashReconciliationCardProps {
  date?: string;
  onRefresh?: () => void;
  className?: string;
}

export function DailyCashReconciliationCard({
  date,
  onRefresh,
  className = "",
}: DailyCashReconciliationCardProps) {
  const [recon, setRecon] = useState<CashReconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [capitalAmountStr, setCapitalAmountStr] = useState("5000");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReconciliation = async () => {
    setLoading(true);
    try {
      const data = await guestWorkspaceService.getCashReconciliation(date);
      setRecon(data);
    } catch (err) {
      console.error("Failed to load daily cash reconciliation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliation();
  }, [date]);

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amountNum = parseFloat(capitalAmountStr) || 0;
    if (amountNum <= 0) {
      setError("Capital amount must be greater than ₹0.");
      return;
    }
    setSubmitting(true);
    try {
      const targetDate = date || new Date().toISOString().split("T")[0];
      await guestWorkspaceService.recordCapital({
        entry_date: targetDate,
        amount: amountNum,
        remarks: remarks.trim() || "Starting cash / route capital",
      });
      setIsModalOpen(false);
      setCapitalAmountStr("5000");
      setRemarks("");
      loadReconciliation();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to record starting cash.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !recon) {
    return (
      <Card className={`p-4 animate-pulse bg-card border-border ${className}`}>
        <div className="h-20 bg-muted/40 rounded-lg"></div>
      </Card>
    );
  }

  const collections = recon?.collections_total || 0;
  const capital = recon?.capital_total || 0;
  const disbursements = recon?.disbursements_total || 0;
  const expenses = recon?.expenses_total || 0;
  const netCash = recon?.net_cash_handheld || 0;
  const isDeficit = recon?.is_cash_deficit || false;

  return (
    <>
      <Card className={`p-4 bg-gradient-to-br from-card to-muted/20 border-border/80 shadow-xs space-y-3 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDeficit ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
              <Wallet className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Daily Route Cash Position
                {isDeficit && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold gap-1">
                    <ShieldAlert className="size-3" /> Cash Deficit
                  </Badge>
                )}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                (Collections + Starting Cash) − (New Loan Disbursements + Expenses)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold px-2.5 border-primary/30 text-primary hover:bg-primary/10 gap-1"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="size-3.5" /> Add Starting Cash
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                loadReconciliation();
                if (onRefresh) onRefresh();
              }}
              title="Refresh cash position"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* 4 Pillars Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Collections (+Inflow) */}
          <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span>Collections</span>
              <ArrowUpRight className="size-3.5" />
            </div>
            <p className="text-base font-bold font-mono text-emerald-800 dark:text-emerald-300">
              +{inr(collections)}
            </p>
            <p className="text-[10px] text-emerald-700/80">
              {recon?.collections_count || 0} receipts today
            </p>
          </div>

          {/* 2. Capital Injected (+Inflow) */}
          <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              <span>Starting Cash</span>
              <Sparkles className="size-3.5" />
            </div>
            <p className="text-base font-bold font-mono text-blue-800 dark:text-blue-300">
              +{inr(capital)}
            </p>
            <p className="text-[10px] text-blue-700/80">
              {recon?.capital_count || 0} capital added
            </p>
          </div>

          {/* 3. New Disbursements (-Outflow) */}
          <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700 dark:text-purple-400">
              <span>New Loan Disbursed</span>
              <ArrowDownRight className="size-3.5" />
            </div>
            <p className="text-base font-bold font-mono text-purple-800 dark:text-purple-300">
              −{inr(disbursements)}
            </p>
            <p className="text-[10px] text-purple-700/80">
              {recon?.disbursements_count || 0} new borrowers
            </p>
          </div>

          {/* 4. Expenses (-Outflow) */}
          <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              <span>Route Expenses</span>
              <ArrowDownRight className="size-3.5" />
            </div>
            <p className="text-base font-bold font-mono text-rose-800 dark:text-rose-300">
              −{inr(expenses)}
            </p>
            <p className="text-[10px] text-rose-700/80">
              {recon?.expenses_count || 0} entries logged
            </p>
          </div>
        </div>

        {/* Total Net Cash Handheld Bar */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
            isDeficit
              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
              : "bg-emerald-600/10 border-emerald-600/30 text-emerald-950 dark:text-emerald-100"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wide">
              {isDeficit ? "⚠️ Net Cash Deficit (Additional Capital Needed)" : "💰 Net Route Cash Handheld"}
            </span>
            <p className="text-[11px] opacity-80">
              {isDeficit
                ? "Disbursements & expenses exceed collections. Add starting cash to balance liquidity."
                : "Actual physical cash in hand to be reconciled at end of route day."}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-mono text-xl font-extrabold ${isDeficit ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
              {inr(netCash)}
            </p>
          </div>
        </div>
      </Card>

      {/* Add Starting Cash Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-blue-600" /> Log Starting Route Cash / Capital
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-muted-foreground pt-1">
                <p>
                  Record starting capital or additional cash brought to the field for disbursing new loans.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCapital} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold">Amount (₹) *</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-1 font-mono font-bold text-base"
                value={capitalAmountStr}
                onChange={(e) => setCapitalAmountStr(e.target.value.replace(/\D/g, ""))}
                placeholder="5000"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Description / Remarks</label>
              <Input
                className="mt-1 text-xs"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Starting cash brought from bank for new disbursements"
              />
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={submitting}>
              {submitting ? "Saving Cash Entry..." : "Add Starting Cash (+)"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
