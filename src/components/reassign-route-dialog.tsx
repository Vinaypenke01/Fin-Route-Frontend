import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Sun, Moon, ArrowRight, ShieldAlert, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { guestWorkspaceService, Customer, CollectionLine } from "@/lib/services/guest-workspace-service";

interface ReassignRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  lines: CollectionLine[];
  onSuccess: () => void;
}

const ALL_DAYS_LIST = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function ReassignRouteDialog({
  open,
  onOpenChange,
  customer,
  lines,
  onSuccess,
}: ReassignRouteDialogProps) {
  const [targetLineId, setTargetLineId] = useState<string>("");
  const [targetDay, setTargetDay] = useState<string>("monday");
  const [targetPortion, setTargetPortion] = useState<"morning" | "afternoon" | "both">("both");

  const [showConfirmationAlert, setShowConfirmationAlert] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && customer) {
      setError(null);
      setShowConfirmationAlert(false);
      const currLineId = customer.line_public_id || (lines[0]?.public_id || "");
      setTargetLineId(currLineId);
      setTargetDay(customer.collection_day?.toLowerCase() || "monday");
      setTargetPortion((customer.portion as any) || "both");
    }
  }, [open, customer, lines]);

  const targetLineObj = lines.find((l) => l.public_id === targetLineId);

  // Available days configured for this selected line
  const allowedDaysForLine = ALL_DAYS_LIST.filter((dObj) => {
    if (!targetLineObj || !targetLineObj.day_schedules || targetLineObj.day_schedules.length === 0) {
      return true;
    }
    return targetLineObj.day_schedules.some((s) => s.day_of_week.toLowerCase() === dObj.key);
  });

  // When target line changes, update target day if current day is not in allowed days
  useEffect(() => {
    if (allowedDaysForLine.length > 0) {
      const dayExists = allowedDaysForLine.some((d) => d.key === targetDay);
      if (!dayExists) {
        setTargetDay(allowedDaysForLine[0].key);
      }
    }
  }, [targetLineId, allowedDaysForLine, targetDay]);

  // Portion configured for selected target day on this line
  const configuredPortionForDay = (() => {
    const sched = targetLineObj?.day_schedules?.find(
      (s) => s.day_of_week.toLowerCase() === targetDay.toLowerCase()
    );
    return sched?.portion || "both";
  })();

  // Auto-set portion when target day or line changes
  useEffect(() => {
    setTargetPortion(configuredPortionForDay as any);
  }, [targetDay, targetLineId, configuredPortionForDay]);

  if (!customer) return null;

  const currentLineName = customer.line_name || "Unassigned Line";
  const currentDayLabel = customer.collection_day
    ? customer.collection_day.charAt(0).toUpperCase() + customer.collection_day.slice(1)
    : "Monday";
  const currentPortionLabel =
    customer.portion === "morning"
      ? "🌅 Morning (1am–1pm)"
      : customer.portion === "afternoon"
      ? "🌆 Afternoon (1pm–12am)"
      : "☀️ Full Day";

  const targetLineName = targetLineObj?.name || "Selected Line";
  const targetDayLabel = targetDay.charAt(0).toUpperCase() + targetDay.slice(1);
  const targetPortionLabel =
    targetPortion === "morning"
      ? "🌅 Morning (1am–1pm)"
      : targetPortion === "afternoon"
      ? "🌆 Afternoon (1pm–12am)"
      : "☀️ Full Day";

  const handleOpenConfirmAlert = () => {
    setError(null);
    setShowConfirmationAlert(true);
  };

  const handleFinalConfirmReassign = async () => {
    setSaving(true);
    setError(null);
    try {
      await guestWorkspaceService.updateCustomer(customer.public_id, {
        line: targetLineId || undefined,
        collection_day: targetDay,
        portion: targetPortion,
      });
      setShowConfirmationAlert(false);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to re-assign borrower route.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* 1. Main Re-assignment Selection Dialog */}
      <Dialog open={open && !showConfirmationAlert} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <RefreshCw className="size-5 text-primary" /> Re-assign / Transfer Route Line
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-muted-foreground space-y-1">
                <span>Transfer <strong className="text-foreground">{customer.full_name}</strong> ({customer.customer_code}) to a new collection line, day, or time slot.</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Current Route Snapshot Card */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">Current Assigned Route</span>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 font-medium">
              <Badge variant="outline" className="bg-background">{currentLineName}</Badge>
              <Badge variant="outline" className="bg-background">{currentDayLabel}</Badge>
              <Badge variant="outline" className="bg-background">{currentPortionLabel}</Badge>
            </div>
          </div>

          <div className="space-y-3.5 py-1 text-xs">
            {/* Target Line Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">1. Target Collection Line (Route) *</Label>
              <Select value={targetLineId} onValueChange={setTargetLineId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select target line" />
                </SelectTrigger>
                <SelectContent>
                  {lines.map((ln) => (
                    <SelectItem key={ln.public_id} value={ln.public_id}>
                      {ln.name} {ln.area ? `(${ln.area})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Day Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">2. Target Collection Day *</Label>
              <Select value={targetDay} onValueChange={setTargetDay}>
                <SelectTrigger className="h-9 text-xs capitalize">
                  <SelectValue placeholder="Select collection day" />
                </SelectTrigger>
                <SelectContent>
                  {allowedDaysForLine.map((d) => (
                    <SelectItem key={d.key} value={d.key} className="capitalize">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Portion Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">3. Day Time Slot Portion *</Label>
              {configuredPortionForDay === "morning" ? (
                <div className="p-2.5 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-center gap-2 font-semibold text-xs">
                  <Sun className="size-4 text-amber-600 shrink-0" />
                  <span>🌅 Morning Only (1:00 AM – 1:00 PM)</span>
                </div>
              ) : configuredPortionForDay === "afternoon" ? (
                <div className="p-2.5 rounded-lg border bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-300 flex items-center gap-2 font-semibold text-xs">
                  <Moon className="size-4 text-indigo-600 shrink-0" />
                  <span>🌆 Afternoon Only (1:00 PM – 12:00 AM)</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={targetPortion === "morning" ? "default" : "outline"}
                    onClick={() => setTargetPortion("morning")}
                    className={`h-8 text-[11px] font-medium gap-1 ${targetPortion === "morning" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                  >
                    <Sun className="size-3" /> Morning (1am-1pm)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={targetPortion === "afternoon" ? "default" : "outline"}
                    onClick={() => setTargetPortion("afternoon")}
                    className={`h-8 text-[11px] font-medium gap-1 ${targetPortion === "afternoon" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}`}
                  >
                    <Moon className="size-3" /> Afternoon (1pm-12am)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={targetPortion === "both" ? "default" : "outline"}
                    onClick={() => setTargetPortion("both")}
                    className={`h-8 text-[11px] font-medium gap-1 ${targetPortion === "both" ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    Full Day
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleOpenConfirmAlert}>
              Continue to Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Final Confirmation Alert Pop-up Modal */}
      <Dialog open={showConfirmationAlert} onOpenChange={setShowConfirmationAlert}>
        <DialogContent className="sm:max-w-md border-2 border-primary/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-primary">
              <ShieldAlert className="size-5 text-amber-500" /> Confirm Borrower Route Re-assignment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <p className="font-semibold text-foreground">
              Are you sure you want to re-assign borrower <strong className="text-primary font-bold">{customer.full_name}</strong> ({customer.customer_code})?
            </p>

            {/* Transfer Comparison Table */}
            <div className="p-3 bg-muted/50 rounded-xl border space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-foreground uppercase">From (Current Route)</span>
                <ArrowRight className="size-4 text-primary shrink-0" />
                <span className="font-bold text-primary uppercase">To (New Target Route)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{currentLineName}</p>
                  <p className="text-muted-foreground">{currentDayLabel}</p>
                  <p className="text-[11px] text-muted-foreground">{currentPortionLabel}</p>
                </div>
                <div className="space-y-1 pl-2 border-l border-border/60">
                  <p className="font-bold text-primary">{targetLineName}</p>
                  <p className="font-semibold text-foreground">{targetDayLabel}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{targetPortionLabel}</p>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-900 dark:text-amber-300 font-medium">
              ℹ️ This will immediately update the borrower's collection route register schedule and daily route lists.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmationAlert(false)} disabled={saving}>
              Back
            </Button>
            <Button size="sm" onClick={handleFinalConfirmReassign} disabled={saving} className="bg-primary text-primary-foreground font-bold">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Re-assigning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-1.5" /> Confirm & Re-assign Borrower
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
