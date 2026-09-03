import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { inr } from "@/lib/utils";
import { MasterItem } from "@/lib/services/masters-service";

export interface SheetRowItem {
  customer_id: string;
  customer_code: string;
  sequence_number: number | string;
  full_name: string;
  mobile_number: string;
  collection_day?: string;
  expected_amount: number;
  collection_id?: string;
  collected_amount: string;
  status_id: number;
  payment_mode_id: number;
  is_saved: boolean;
  remarks: string;
}

export function RecordCollectionModal({
  open,
  row,
  paymentModes,
  onClose,
  onConfirm,
  submitting,
}: {
  open: boolean;
  row: SheetRowItem;
  paymentModes: MasterItem[];
  onClose: () => void;
  onConfirm: (amount: number, modeId: number, remarks: string) => void;
  submitting: boolean;
}) {
  const [collectedAmountInput, setCollectedAmountInput] = useState<string>(
    parseFloat(row.collected_amount) > 0 ? row.collected_amount : String(row.expected_amount)
  );
  const [selectedModeId, setSelectedModeId] = useState<string>(
    String(row.payment_mode_id || paymentModes[0]?.id || 1)
  );
  const [remarksInput, setRemarksInput] = useState<string>(row.remarks || "");

  const numAmount = parseFloat(collectedAmountInput) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(numAmount, Number(selectedModeId), remarksInput);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" /> Collect Payment
          </DialogTitle>
          <DialogDescription className="text-xs">
            Log installment payment for <strong>{row.full_name}</strong> ({row.customer_code}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Customer Info Highlight Card */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold">
                #{row.sequence_number}
              </div>
              <div>
                <h4 className="font-bold text-xs text-foreground">{row.full_name}</h4>
                <p className="text-[10px] text-muted-foreground">Expected: {inr(row.expected_amount)}</p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
              {inr(row.expected_amount)} / inst
            </Badge>
          </div>

          {/* Amount Collected Input */}
          <div>
            <Label className="text-xs font-bold">Installment Amount Collected (₹) *</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">₹</span>
              <Input
                type="number"
                min="0"
                step="any"
                required
                className="pl-7 font-mono font-bold text-sm h-10 bg-background"
                value={collectedAmountInput}
                onChange={(e) => setCollectedAmountInput(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Type / Mode */}
          <div>
            <Label className="text-xs font-bold">Payment Type / Mode *</Label>
            <Select value={selectedModeId} onValueChange={setSelectedModeId}>
              <SelectTrigger className="mt-1 font-semibold text-xs h-10 bg-background">
                <SelectValue placeholder="Select payment type" />
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

          {/* Remarks (Optional) */}
          <div>
            <Label className="text-xs font-bold">Remarks / Notes (Optional)</Label>
            <Input
              type="text"
              className="mt-1 text-xs h-9"
              placeholder="e.g. Paid cash at market shop"
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || numAmount < 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
            >
              {submitting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Confirm Collection ({inr(numAmount)})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
