import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserPlus, History, CalendarDays, Calculator, Sparkles, RefreshCw } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, CollectionLine } from "@/lib/services/guest-workspace-service";
import { toast } from "sonner";

export function DailySheetAddCustomerModal({
  open,
  setOpen,
  activeLine,
  selectedDate,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeLine: CollectionLine;
  selectedDate: string;
  onSuccess: () => void;
}) {
  const [borrowerType, setBorrowerType] = useState<"new" | "existing">("new");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [sequenceNumber, setSequenceNumber] = useState("1");
  const [loanAmount, setLoanAmount] = useState("10000");
  const [installmentAmount, setInstallmentAmount] = useState("100");
  const [totalInstallments, setTotalInstallments] = useState("100");

  // Additional Fields for Existing Borrower History
  const [paidInstallmentsCount, setPaidInstallmentsCount] = useState("20");
  const [paidAmountTillDate, setPaidAmountTillDate] = useState("2000");

  // On-Boarding 1st Installment Collection Toggle State (Default ON)
  const [autoCollectFirst, setAutoCollectFirst] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Financial Math & Calculations
  const disbursed = parseFloat(loanAmount) || 0;
  const perInstallment = parseFloat(installmentAmount) || 0;
  const totalInst = parseInt(totalInstallments) || 0;

  const totalAmountToCollect = perInstallment * totalInst;
  const totalInterest = Math.max(0, totalAmountToCollect - disbursed);
  const roiPercentage = disbursed > 0 ? ((totalInterest / disbursed) * 100).toFixed(1) : "0.0";

  // History Math for Existing Borrower
  const paidCount = parseInt(paidInstallmentsCount) || 0;
  const paidTillDate = parseFloat(paidAmountTillDate) || (paidCount * perInstallment);
  const remainingBalance = Math.max(0, totalAmountToCollect - paidTillDate);

  // Estimated Start Date Calculation
  const estimatedStartDate = useMemo(() => {
    if (borrowerType !== "existing" || paidCount <= 0 || !selectedDate) return null;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (paidCount * 7)); // weekly schedule interval estimate
    return d.toISOString().slice(0, 10);
  }, [borrowerType, paidCount, selectedDate]);

  // Determine weekday name from selectedDate
  const selectedDayName = useMemo(() => {
    if (!selectedDate) return "monday";
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  }, [selectedDate]);

  const [assignedDay, setAssignedDay] = useState<string>(() => {
    const configuredDays = (activeLine?.day_schedules || []).map((s) => s.day_of_week.toLowerCase());
    if (configuredDays.length > 0) return configuredDays[0];
    return selectedDayName;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Field Validation 1: Borrower Full Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Borrower full name must be at least 2 characters.");
      return;
    }

    // Field Validation 2: Mobile Phone Number (10-digit Indian mobile format)
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    // Field Validation 3: Sequence Number
    const seqNum = parseInt(sequenceNumber, 10);
    if (isNaN(seqNum) || seqNum < 1) {
      setError("Sequence number must be a valid positive integer (≥ 1).");
      return;
    }

    // Field Validation 4: Disbursed Loan Amount
    if (isNaN(disbursed) || disbursed <= 0) {
      setError("Disbursed loan amount must be greater than ₹0.");
      return;
    }

    // Field Validation 5: Installment Amount
    if (isNaN(perInstallment) || perInstallment <= 0) {
      setError("Installment amount must be greater than ₹0.");
      return;
    }

    // Field Validation 6: Total Installments Count
    if (isNaN(totalInst) || totalInst < 1) {
      setError("Total installments count must be at least 1.");
      return;
    }

    // Field Validation 7 & 8: Existing Borrower History
    if (borrowerType === "existing") {
      if (paidCount < 0) {
        setError("Paid installments count cannot be negative.");
        return;
      }
      if (paidCount > totalInst) {
        setError(`Paid installments count (${paidCount}) cannot exceed total installments (${totalInst}).`);
        return;
      }
      if (paidTillDate < 0) {
        setError("Paid amount till date cannot be negative.");
        return;
      }
      if (paidTillDate > totalAmountToCollect) {
        setError(`Paid amount till date (${inr(paidTillDate)}) cannot exceed total collectable amount (${inr(totalAmountToCollect)}).`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const targetStartDate = borrowerType === "existing" && estimatedStartDate ? estimatedStartDate : selectedDate;

      const payload: Record<string, any> = {
        full_name: fullName.trim(),
        mobile_number: cleanMobile,
        line: activeLine.public_id,
        collection_day: assignedDay,
        sequence_number: seqNum,
        loan_amount: disbursed,
        disbursed_amount: disbursed,
        installment_amount: perInstallment,
        duration: totalInst,
        total_installments: totalInst,
        is_existing_borrower: borrowerType === "existing",
        start_date: targetStartDate,
        loan_start_date: targetStartDate,
      };

      if (borrowerType === "existing") {
        payload.paid_installments_count = paidCount;
        payload.paid_amount_till_date = paidTillDate;
      }

      const newCustomer = await guestWorkspaceService.createCustomer(payload);

      // On-Boarding Collection Record Handler (Toggle ON = Paid ₹perInstallment, Toggle OFF = Skipped ₹0)
      if (newCustomer?.public_id) {
        if (autoCollectFirst && perInstallment > 0) {
          try {
            await guestWorkspaceService.recordCollection({
              customer: newCustomer.public_id,
              collection_date: selectedDate,
              expected_amount: perInstallment,
              collected_amount: perInstallment,
              status: 1, // Paid status
              remarks: "Initial onboarding collection",
            });
            toast.success(`Borrower '${fullName}' added & 1st installment (${inr(perInstallment)}) logged as collected for today!`);
          } catch (colErr: any) {
            console.error("Failed to auto-record 1st installment:", colErr);
            toast.success(`Borrower '${fullName}' added.`);
          }
        } else {
          // Toggle is OFF -> Record today's installment as SKIPPED
          try {
            await guestWorkspaceService.recordCollection({
              customer: newCustomer.public_id,
              collection_date: selectedDate,
              expected_amount: perInstallment,
              collected_amount: 0,
              status: 5, // Skipped status
              remarks: "Onboarding installment skipped",
            });
            toast.success(`Borrower '${fullName}' added & marked as skipped for today.`);
          } catch (colErr: any) {
            console.error("Failed to record skipped installment:", colErr);
            toast.success(`Borrower '${fullName}' added to ${activeLine.name}!`);
          }
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error("Failed to add borrower:", err);
      setError(err?.message || "Failed to create borrower record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
      <DialogContent className="max-w-xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="size-6 text-primary" /> Add Borrower to {activeLine.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pre-assigned to <strong>{activeLine.name}</strong> ({activeLine.area}) for <strong>{selectedDate}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Borrower Type Tabs */}
        <Tabs value={borrowerType} onValueChange={(v) => setBorrowerType(v as any)} className="pt-1">
          <TabsList className="grid grid-cols-2 w-full h-11 rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="new" className="rounded-xl font-bold text-xs gap-1.5">
              <UserPlus className="size-3.5" /> 🆕 New Borrower
            </TabsTrigger>
            <TabsTrigger value="existing" className="rounded-xl font-bold text-xs gap-1.5">
              <History className="size-3.5" /> 📜 Existing Borrower (Migration)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <div className="p-3 bg-rose-500/10 text-rose-600 text-xs rounded-xl font-bold">{error}</div>}

          {/* Basic Borrower Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold">Borrower Full Name *</Label>
              <Input
                type="text"
                required
                className="mt-1 font-semibold text-xs h-10"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Sequence #</Label>
              <Input
                type="number"
                min="1"
                required
                className="mt-1 font-mono font-bold text-xs h-10"
                value={sequenceNumber}
                onChange={(e) => setSequenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Mobile Phone Number *</Label>
              <Input
                type="tel"
                required
                className="mt-1 font-mono font-bold text-xs h-10"
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs font-bold flex items-center gap-1">
                <CalendarDays className="size-3.5 text-primary" /> Assigned Collection Day / Session *
              </Label>
              <Select value={assignedDay} onValueChange={setAssignedDay}>
                <SelectTrigger className="mt-1 font-bold text-xs h-10 bg-background">
                  <SelectValue placeholder="Select collection day" />
                </SelectTrigger>
                <SelectContent>
                  {activeLine.day_schedules && activeLine.day_schedules.length > 0 ? (
                    activeLine.day_schedules.map((s) => {
                      const dayNameCap = s.day_of_week.charAt(0).toUpperCase() + s.day_of_week.slice(1);
                      const portionText = s.portion === "morning" ? " ☀️ (Morning)" : s.portion === "afternoon" ? " 🌙 (Afternoon)" : " 🌕 (Full Day)";
                      return (
                        <SelectItem key={s.day_of_week} value={s.day_of_week.toLowerCase()}>
                          {dayNameCap}{portionText}
                        </SelectItem>
                      );
                    })
                  ) : (
                    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loan & Installment Math Inputs */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <Label className="text-xs font-bold">Disbursed Amount (₹)</Label>
              <Input
                type="number"
                required
                className="mt-1 font-mono font-bold text-xs h-10"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Installment (₹)</Label>
              <Input
                type="number"
                required
                className="mt-1 font-mono font-bold text-xs h-10"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Total Installments</Label>
              <Input
                type="number"
                required
                className="mt-1 font-mono font-bold text-xs h-10"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
              />
            </div>
          </div>

          {/* Additional Existing Borrower History Fields */}
          {borrowerType === "existing" && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <History className="size-4" /> Past Payment History (Till Date)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">Paid Installments Count</Label>
                  <Input
                    type="number"
                    min="0"
                    className="mt-1 font-mono font-bold text-xs h-9 bg-background"
                    value={paidInstallmentsCount}
                    onChange={(e) => setPaidInstallmentsCount(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Paid Amount Till Date (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    className="mt-1 font-mono font-bold text-xs h-9 bg-background"
                    value={paidAmountTillDate}
                    onChange={(e) => setPaidAmountTillDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Auto-Calculated Financial Summary Box */}
          <div className="p-4 bg-muted/50 rounded-2xl border border-border space-y-2 text-xs">
            <h4 className="font-bold text-foreground uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Calculator className="size-3.5 text-primary" /> Auto-Calculated Terms & Financials:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground block">Total to Collect:</span>
                <span className="font-bold text-foreground text-sm">{inr(totalAmountToCollect)}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Total Interest:</span>
                <span className="font-bold text-emerald-600 text-sm">{inr(totalInterest)}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Estimated ROI:</span>
                <Badge className="bg-primary/10 text-primary font-bold text-xs border-primary/20">
                  {roiPercentage}% ROI
                </Badge>
              </div>
            </div>

            {borrowerType === "existing" && (
              <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Remaining Balance:</span>
                  <span className="font-bold text-amber-600 text-sm">{inr(remainingBalance)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Estimated Start Date:</span>
                  <span className="font-bold text-foreground text-xs">{estimatedStartDate || "Calculated on Save"}</span>
                </div>
              </div>
            )}
          </div>

          {/* On-Boarding 1st Installment Collection Toggle */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <Label htmlFor="auto-collect-toggle" className="text-xs font-bold cursor-pointer text-foreground">
                  Collect 1st Installment Today ({inr(perInstallment)})
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                When enabled, automatically logs <strong>{inr(perInstallment)}</strong> collected under today's date ({selectedDate}) upon saving.
              </p>
            </div>
            <Switch
              id="auto-collect-toggle"
              checked={autoCollectFirst}
              onCheckedChange={setAutoCollectFirst}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary font-bold gap-2">
              {submitting ? <RefreshCw className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {borrowerType === "existing" ? "Add Existing Borrower" : "Create New Borrower"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
