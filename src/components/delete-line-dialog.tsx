import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Trash2, ArrowRightLeft, ShieldAlert, Loader2 } from "lucide-react";
import { CollectionLine, guestWorkspaceService } from "@/lib/services/guest-workspace-service";
import { toast } from "sonner";

interface DeleteLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: CollectionLine | null;
  allLines: CollectionLine[];
  customersCount: number;
  onSuccess: () => void;
}

export function DeleteLineDialog({
  open,
  onOpenChange,
  line,
  allLines,
  customersCount,
  onSuccess,
}: DeleteLineDialogProps) {
  const [deleteMode, setDeleteMode] = useState<"reassign" | "delete_customers">("reassign");
  const [targetLineId, setTargetLineId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTargetLines = allLines.filter((l) => l.public_id !== line?.public_id);

  const handleDelete = async () => {
    if (!line) return;
    setError(null);

    if (customersCount > 0 && deleteMode === "reassign" && !targetLineId && availableTargetLines.length > 0) {
      setError("Please select a destination route line to reassign borrowers to.");
      return;
    }

    setSubmitting(true);
    try {
      if (customersCount === 0) {
        await guestWorkspaceService.deleteLine(line.public_id, { mode: "unassign" });
        toast.success(`Route line "${line.name}" deleted successfully.`);
      } else if (deleteMode === "reassign") {
        await guestWorkspaceService.deleteLine(line.public_id, {
          mode: "reassign",
          targetLineId: targetLineId || undefined,
        });
        toast.success(`Reassigned ${customersCount} borrower(s) and deleted route line "${line.name}".`);
      } else {
        await guestWorkspaceService.deleteLine(line.public_id, { mode: "delete_customers" });
        toast.success(`Deleted route line "${line.name}" along with ${customersCount} borrower profile(s) and payment records.`);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to delete route line.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!line) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
            <Trash2 className="size-5" /> Delete Route Line: {line.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {customersCount > 0
              ? `This route line currently has ${customersCount} active borrower(s) assigned.`
              : `Are you sure you want to delete route line "${line.name}"?`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        {customersCount > 0 ? (
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                Active Borrowers Linked to Route ({customersCount})
              </p>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                Would you like to reassign them to another route line before deleting, or delete them along with the route line?
              </p>
            </div>

            {/* Option A: Reassign */}
            <div
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                deleteMode === "reassign"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border/80 hover:bg-muted/40"
              }`}
              onClick={() => setDeleteMode("reassign")}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  id="mode_reassign"
                  name="delete_mode"
                  checked={deleteMode === "reassign"}
                  onChange={() => setDeleteMode("reassign")}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <label htmlFor="mode_reassign" className="text-xs font-bold cursor-pointer flex items-center gap-1.5">
                    <ArrowRightLeft className="size-3.5 text-primary" />
                    Reassign Borrowers to Another Route Line (Recommended)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Moves all {customersCount} borrower(s) and their payment receipts safely to another route line.
                  </p>

                  {deleteMode === "reassign" && availableTargetLines.length > 0 && (
                    <div className="pt-2">
                      <label className="text-[11px] font-semibold text-foreground">Select Destination Route Line *</label>
                      <Select value={targetLineId} onValueChange={setTargetLineId}>
                        <SelectTrigger className="mt-1 text-xs">
                          <SelectValue placeholder="Choose target route line..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTargetLines.map((l) => (
                            <SelectItem key={l.public_id} value={l.public_id}>
                              📍 {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {deleteMode === "reassign" && availableTargetLines.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic pt-1">
                      (No other route lines exist. Borrowers will be moved to Unassigned General Workspace.)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Option B: Delete with route */}
            <div
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                deleteMode === "delete_customers"
                  ? "border-rose-500 bg-rose-500/5 ring-2 ring-rose-500/20"
                  : "border-border/80 hover:bg-muted/40"
              }`}
              onClick={() => setDeleteMode("delete_customers")}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  id="mode_delete_cust"
                  name="delete_mode"
                  checked={deleteMode === "delete_customers"}
                  onChange={() => setDeleteMode("delete_customers")}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <label htmlFor="mode_delete_cust" className="text-xs font-bold cursor-pointer flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="size-3.5" />
                    Delete Route Line & Purge all linked {customersCount} Borrower(s) & Payment Records
                  </label>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                    ⚠️ Permanently purges all {customersCount} borrower profile(s), unassigned customer records, and their complete payment receipt history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            No active borrowers are linked to this line. Deleting it will remove the route line configuration.
          </p>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant={deleteMode === "delete_customers" && customersCount > 0 ? "destructive" : "default"}
            className={deleteMode === "reassign" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : "font-bold"}
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : customersCount === 0 ? (
              "Confirm Delete"
            ) : deleteMode === "reassign" ? (
              "Reassign & Delete Line"
            ) : (
              `Delete Line & ${customersCount} Borrower(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
