import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wallet, ArrowDownRight, ArrowUpRight, ShieldAlert, Sparkles, RefreshCw, Play, Square, CheckCircle2, Mail, Loader2 } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, CashReconciliation } from "@/lib/services/guest-workspace-service";
import { toast } from "sonner";

interface DailyCashReconciliationCardProps {
  date?: string;
  line?: string;
  lineName?: string;
  onRefresh?: () => void;
  className?: string;
}

export function DailyCashReconciliationCard({
  date,
  line,
  lineName,
  onRefresh,
  className = "",
}: DailyCashReconciliationCardProps) {
  const [recon, setRecon] = useState<CashReconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isStopConfirmModalOpen, setIsStopConfirmModalOpen] = useState(false);
  const [isAddCapitalModalOpen, setIsAddCapitalModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [capitalAmountStr, setCapitalAmountStr] = useState("5000");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetDate = date || new Date().toISOString().split("T")[0];
  const storageKey = `finroute_route_status_${line || "all"}_${targetDate}`;

  const [routeState, setRouteState] = useState<"idle" | "started" | "stopped">("idle");

  const loadReconciliation = async () => {
    setLoading(true);
    try {
      const data = await guestWorkspaceService.getCashReconciliation(date, line);
      setRecon(data);

      const savedStatus = localStorage.getItem(storageKey) as "idle" | "started" | "stopped" | null;
      if (savedStatus) {
        setRouteState(savedStatus);
      } else if ((data?.capital_total || 0) > 0 || (data?.opening_carried_forward || 0) > 0 || (data?.collections_total || 0) > 0) {
        setRouteState("started");
      } else {
        setRouteState("idle");
      }
    } catch (err) {
      console.error("Failed to load daily cash reconciliation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliation();
  }, [date, line]);

  const handleStartRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amountNum = parseFloat(capitalAmountStr) || 0;
    if (amountNum < 0) {
      setError("Capital amount cannot be negative.");
      return;
    }
    setSubmitting(true);
    try {
      if (amountNum > 0) {
        await guestWorkspaceService.recordCapital({
          entry_date: targetDate,
          amount: amountNum,
          remarks: remarks.trim() || "Starting route cash / opening capital",
          line: line && line !== "all" ? line : undefined,
        });
      }
      localStorage.setItem(storageKey, "started");
      setRouteState("started");
      setIsStartModalOpen(false);
      setCapitalAmountStr("5000");
      setRemarks("");
      loadReconciliation();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to start route.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmStopRoute = async () => {
    localStorage.setItem(storageKey, "stopped");
    setRouteState("stopped");
    setIsStopConfirmModalOpen(false);
    if (onRefresh) onRefresh();

    setSendingEmail(true);
    try {
      const res = await guestWorkspaceService.sendRouteClosureReport({
        date: targetDate,
        line: line,
        line_name: lineName || "Selected Route Line",
      });
      toast.success(`✉️ Daily Route Closure Report emailed to ${res.recipient}`);
    } catch (err: any) {
      console.error("Failed to send route closure report email:", err);
      toast.error("Route closed, but email report sending failed.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReopenRoute = () => {
    localStorage.setItem(storageKey, "started");
    setRouteState("started");
    if (onRefresh) onRefresh();
  };

  const handleAddAdditionalCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amountNum = parseFloat(capitalAmountStr) || 0;
    if (amountNum <= 0) {
      setError("Amount must be greater than ₹0.");
      return;
    }
    setSubmitting(true);
    try {
      await guestWorkspaceService.recordCapital({
        entry_date: targetDate,
        amount: amountNum,
        remarks: remarks.trim() || "Additional cash added during route",
        line: line && line !== "all" ? line : undefined,
      });
      setIsAddCapitalModalOpen(false);
      setCapitalAmountStr("5000");
      setRemarks("");
      loadReconciliation();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to record cash.");
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
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              routeState === "stopped"
                ? "bg-muted text-muted-foreground"
                : routeState === "started"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-primary/10 text-primary"
            }`}>
              <Wallet className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Daily Route Cash Position
                {routeState === "idle" && (
                  <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                    Idle / Not Started
                  </Badge>
                )}
                {routeState === "started" && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-bold animate-pulse">
                    🟢 Route In Progress
                  </Badge>
                )}
                {routeState === "stopped" && (
                  <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 font-bold">
                    ✅ Route Closed & Reconciled
                  </Badge>
                )}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {routeState === "idle"
                  ? "Click Start Route to log starting cash and begin tracking daily collections & expenses."
                  : "(Collections + Starting Cash) − (New Loan Disbursements + Expenses)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {routeState === "idle" && (
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs font-bold px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                onClick={() => {
                  if (recon?.opening_carried_forward && recon.opening_carried_forward > 0) {
                    setCapitalAmountStr(recon.opening_carried_forward.toString());
                  } else {
                    setCapitalAmountStr("5000");
                  }
                  setIsStartModalOpen(true);
                }}
              >
                <Play className="size-3.5 fill-current" /> Start Route
              </Button>
            )}

            {routeState === "started" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold px-2.5 border-primary/30 text-primary hover:bg-primary/10 gap-1"
                  onClick={() => setIsAddCapitalModalOpen(true)}
                >
                  <Plus className="size-3.5" /> Starting Cash
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs font-bold px-3 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                  onClick={() => setIsStopConfirmModalOpen(true)}
                >
                  <Square className="size-3.5 fill-current" /> Stop Route
                </Button>
              </>
            )}

            {routeState === "stopped" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sendingEmail}
                  className="h-8 text-xs font-semibold px-2.5 gap-1 text-emerald-700 border-emerald-500/30 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                  onClick={async () => {
                    setSendingEmail(true);
                    try {
                      const res = await guestWorkspaceService.sendRouteClosureReport({
                        date: targetDate,
                        line: line,
                        line_name: lineName || "Selected Route Line",
                      });
                      toast.success(`✉️ Closure Report emailed to ${res.recipient}`);
                    } catch (err: any) {
                      toast.error("Failed to send email report.");
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                >
                  {sendingEmail ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                  Email Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold px-2.5 gap-1"
                  onClick={handleReopenRoute}
                >
                  <RefreshCw className="size-3.5" /> Re-open Route
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Breakdown Grid (Displayed when Started or Stopped) */}
        {routeState !== "idle" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

              <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-0.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                  <span>Starting Cash</span>
                  <Sparkles className="size-3.5" />
                </div>
                <p className="text-base font-bold font-mono text-blue-800 dark:text-blue-300">
                  +{inr(capital)}
                </p>
                <p className="text-[10px] text-blue-700/80">
                  {recon?.is_carried_forward ? "Carried forward from yesterday" : `${recon?.capital_count || 0} capital added`}
                </p>
              </div>

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
                <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                  {isDeficit ? "⚠️ Net Cash Deficit" : "💰 Net Route Cash Handheld"}
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
          </>
        )}
      </Card>

      {/* START ROUTE DIALOG */}
      <Dialog open={isStartModalOpen} onOpenChange={setIsStartModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Play className="size-5 fill-current" /> Start Daily Collection Route
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter starting cash in hand for route <b>{lineName || "Selected Line"}</b> on <b>{targetDate}</b>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStartRouteSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold">Starting / Opening Cash Amount (₹)</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-1 font-mono font-bold text-base"
                value={capitalAmountStr}
                onChange={(e) => setCapitalAmountStr(e.target.value.replace(/\D/g, ""))}
                placeholder="5000"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Leave 0 if starting with ₹0 opening cash.</p>
            </div>

            <div>
              <label className="text-xs font-semibold">Description / Note</label>
              <Input
                className="mt-1 text-xs"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Starting float cash from office safe"
              />
            </div>

            <Button type="submit" className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitting}>
              {submitting ? "Starting Route..." : "Start Route Now"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* STOP ROUTE CONFIRMATION & RECONCILIATION SUMMARY DIALOG */}
      <Dialog open={isStopConfirmModalOpen} onOpenChange={setIsStopConfirmModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Square className="size-5 fill-current text-rose-600" /> Confirm Route Closure & Cash Summary
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review your final daily route cash breakdown before closing operations for <b>{lineName || "Selected Line"}</b> ({targetDate}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <span className="font-semibold text-muted-foreground">💵 Starting Amount:</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-sm">+{inr(capital)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <span className="font-semibold text-muted-foreground">📥 Total Collected Amount:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">+{inr(collections)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <span className="font-semibold text-muted-foreground">📤 Amount Paid to New Customers:</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-sm">−{inr(disbursements)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <span className="font-semibold text-muted-foreground">💸 Total Expenses:</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300 text-sm">−{inr(expenses)}</span>
              </div>

              <div className="flex justify-between items-center pt-1 font-bold">
                <span className="text-foreground text-sm">🧮 Final Handheld Cash:</span>
                <span className="font-mono text-base font-extrabold text-primary">{inr(netCash)}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic text-center">
              Clicking confirm will lock the route summary for today. You can re-open at any time.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsStopConfirmModalOpen(false)}>
              Cancel / Continue Route
            </Button>
            <Button type="button" variant="destructive" className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={handleConfirmStopRoute}>
              <CheckCircle2 className="size-4 mr-1" /> Confirm & Close Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD ADDITIONAL CAPITAL MODAL */}
      <Dialog open={isAddCapitalModalOpen} onOpenChange={setIsAddCapitalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-blue-600" /> Log Additional Starting Cash / Capital
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add starting float or extra cash brought to the field for route <b>{lineName || "Selected Line"}</b>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAdditionalCapital} className="space-y-4 pt-2">
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
                placeholder="e.g. Additional cash added mid-day"
              />
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={submitting}>
              {submitting ? "Saving Cash Entry..." : "Add Cash (+)"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
