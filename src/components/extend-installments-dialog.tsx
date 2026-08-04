import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, AlertTriangle } from "lucide-react";
import { guestWorkspaceService } from "@/lib/services/guest-workspace-service";
import { toast } from "sonner";
import { inr } from "@/lib/utils";

interface ExtendInstallmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerPublicId: string;
  customerName: string;
  currentTotalInstallments: number;
  installmentsPaidCount: number;
  outstandingBalance: number;
  installmentAmount?: number;
  onSuccess?: () => void;
}

export function ExtendInstallmentsDialog({
  open,
  onOpenChange,
  customerPublicId,
  customerName,
  currentTotalInstallments,
  installmentsPaidCount,
  outstandingBalance,
  installmentAmount = 0,
  onSuccess,
}: ExtendInstallmentsDialogProps) {
  const [addCount, setAddCount] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);

  const newTotal = currentTotalInstallments + Number(addCount || 0);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addCount <= 0) {
      toast.error("Please enter at least 1 additional installment.");
      return;
    }
    setSubmitting(true);
    try {
      await guestWorkspaceService.updateCustomer(customerPublicId, {
        total_installments: newTotal,
      });
      toast.success(`Extended installment count to ${newTotal} for ${customerName}`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to extend installments.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <CalendarPlus className="size-5 text-amber-600" /> Extend Installment Count
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Borrower completed scheduled installments but has pending balance due to skipped payments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-4 pt-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span>{customerName}</span>
            </div>
            <p>
              Completed <strong>{installmentsPaidCount}</strong> of <strong>{currentTotalInstallments}</strong> installments.
            </p>
            <p className="font-semibold text-rose-600 dark:text-rose-400">
              Pending Balance: {inr(outstandingBalance)}
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold">Quick Add Options</Label>
            <div className="flex gap-2 mt-1.5">
              {[3, 5, 10, 15, 20].map((num) => (
                <Button
                  key={num}
                  type="button"
                  size="sm"
                  variant={addCount === num ? "default" : "outline"}
                  className="text-xs flex-1 h-8"
                  onClick={() => setAddCount(num)}
                >
                  +{num}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Additional Installment Count *</Label>
            <Input
              type="number"
              min={1}
              max={200}
              className="mt-1 font-mono text-sm font-bold"
              value={addCount}
              onChange={(e) => setAddCount(Math.max(1, Number(e.target.value)))}
              required
            />
          </div>

          <div className="p-3 bg-muted/60 rounded-lg space-y-1 text-xs border border-border">
            <div className="flex justify-between text-muted-foreground">
              <span>Current Planned Installments:</span>
              <span className="font-mono font-semibold">{currentTotalInstallments}</span>
            </div>
            <div className="flex justify-between text-foreground font-bold">
              <span>New Total Installments:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{newTotal} installments</span>
            </div>
            {installmentAmount > 0 && (
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/50 text-[11px]">
                <span>Installment Amount:</span>
                <span className="font-mono">{inr(installmentAmount)} / installment</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" disabled={submitting}>
              {submitting ? "Updating..." : `Confirm Extension (+${addCount})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
