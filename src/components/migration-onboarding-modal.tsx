import { useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Wallet, Users, FileSpreadsheet, Plus, Trash2, CheckCircle2, ArrowRight, Download, Upload, AlertCircle, Loader2, Calendar, IndianRupee, Keyboard, MapPin, Calculator, TrendingUp, Smartphone,
} from "lucide-react";
import { inr } from "@/lib/utils";
import { onboardingService, BulkBorrowerItem } from "@/lib/services/onboarding-service";
import { CollectionLine } from "@/lib/services/guest-workspace-service";

interface MigrationOnboardingWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CollectionLine[];
  onSuccess: () => void;
}

interface EnhancedBorrowerRow {
  full_name: string;
  mobile_number: string;
  line_id: string;
  collection_day: string;
  disbursed_amount: number | string;
  installment_amount: number | string;
  total_installments: number | string;
  installments_paid_count: number | string;
  start_date: string;
}

const ALL_DAYS_MAP: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function MigrationOnboardingWizardModal({
  open,
  onOpenChange,
  lines,
  onSuccess,
}: MigrationOnboardingWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State: Cutover Baseline
  const [cutoverDate, setCutoverDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [openingCash, setOpeningCash] = useState<string>("0");

  // Step 2 State: Onboarding Mode & Borrowers List
  const [onboardingMode, setOnboardingMode] = useState<"table" | "excel">("table");
  const [borrowers, setBorrowers] = useState<EnhancedBorrowerRow[]>([
    {
      full_name: "",
      mobile_number: "",
      line_id: lines[0]?.public_id || "",
      collection_day: lines[0]?.day_schedules?.[0]?.day_of_week.toLowerCase() || "monday",
      disbursed_amount: 10000,
      installment_amount: 600,
      total_installments: 20,
      installments_paid_count: 0,
      start_date: new Date().toISOString().slice(0, 10),
    },
  ]);

  // Step 3 State: Import Summary Result
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRow = () => {
    const defaultLine = lines[0];
    const defaultDay = defaultLine?.day_schedules?.[0]?.day_of_week.toLowerCase() || "monday";
    setBorrowers((prev) => [
      ...prev,
      {
        full_name: "",
        mobile_number: "",
        line_id: defaultLine?.public_id || "",
        collection_day: defaultDay,
        disbursed_amount: 10000,
        installment_amount: 600,
        total_installments: 20,
        installments_paid_count: 0,
        start_date: cutoverDate,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (borrowers.length === 1) return;
    setBorrowers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: keyof EnhancedBorrowerRow, value: any) => {
    setBorrowers((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // If line changed, auto-select first day schedule of that line
      if (field === "line_id") {
        const selectedLineObj = lines.find((l) => l.public_id === value);
        const firstDay = selectedLineObj?.day_schedules?.[0]?.day_of_week.toLowerCase();
        if (firstDay) {
          target.collection_day = firstDay;
        }
      }

      updated[index] = target;
      return updated;
    });
  };

  // Get available days for a specific borrower based on selected line_id
  const getAvailableDaysForLine = (lineId?: string) => {
    const lineObj = lines.find((l) => l.public_id === lineId);
    const dayScheds = lineObj?.day_schedules || [];
    if (dayScheds.length === 0) {
      return Object.entries(ALL_DAYS_MAP).map(([key, label]) => ({ key, label, portion: undefined as string | undefined }));
    }

    return dayScheds.map((s) => ({
      key: s.day_of_week.toLowerCase(),
      label: ALL_DAYS_MAP[s.day_of_week.toLowerCase()] || s.day_of_week,
      portion: s.portion as string | undefined,
    }));
  };

  // Keyboard navigation: Enter on last field creates new row
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index === borrowers.length - 1) {
      e.preventDefault();
      handleAddRow();
    }
  };

  // Download Sample Excel CSV Template
  const handleDownloadSampleTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Full Name,Mobile Number,Collection Day,Disbursed Amount,Installment Amount,Total Installments,Installments Paid Count,Start Date\n" +
      "Ramesh Kumar,+919876543210,monday,10000,600,20,5,2026-05-01\n" +
      "Suresh Sharma,+919876543211,tuesday,20000,1200,20,10,2026-04-15\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finroute_borrower_onboarding_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV / Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const linesArr = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (linesArr.length <= 1) {
        setError("Uploaded file is empty or missing data rows.");
        return;
      }

      const parsedBorrowers: EnhancedBorrowerRow[] = [];
      for (let i = 1; i < linesArr.length; i++) {
        const cols = linesArr[i].split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
        if (cols.length >= 4 && cols[0]) {
          parsedBorrowers.push({
            full_name: cols[0],
            mobile_number: cols[1] || "",
            collection_day: (cols[2] || "monday").toLowerCase(),
            disbursed_amount: parseFloat(cols[3]) || 10000,
            installment_amount: parseFloat(cols[4]) || 600,
            total_installments: parseInt(cols[5], 10) || 20,
            installments_paid_count: parseInt(cols[6], 10) || 0,
            start_date: cols[7] || cutoverDate,
            line_id: lines[0]?.public_id || "",
          });
        }
      }

      if (parsedBorrowers.length > 0) {
        setBorrowers(parsedBorrowers);
        setOnboardingMode("table");
        setError(null);
      } else {
        setError("Could not parse valid borrower records from CSV file.");
      }
    };
    reader.readAsText(file);
  };

  // Submit Cutover & Bulk Import
  const handleExecuteMigration = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Initialize Cutover Baseline
      await onboardingService.setCutoverBaseline({
        cutover_date: cutoverDate,
        opening_cash: parseFloat(openingCash) || 0,
      });

      // 2. Prepare payload items with auto-calculated pre-digital collected amounts
      const payloadBorrowers: BulkBorrowerItem[] = borrowers
        .filter((b) => b.full_name.trim().length > 0)
        .map((b) => {
          const installmentAmt = Number(b.installment_amount) || 0;
          const paidCount = Number(b.installments_paid_count) || 0;
          const amountAlreadyCollected = paidCount * installmentAmt;

          return {
            full_name: b.full_name,
            mobile_number: b.mobile_number,
            line_id: b.line_id || undefined,
            collection_day: b.collection_day,
            loan_amount: Number(b.disbursed_amount) || 0,
            disbursed_amount: Number(b.disbursed_amount) || 0,
            installment_amount: installmentAmt,
            total_installments: Number(b.total_installments) || 1,
            amount_already_collected: amountAlreadyCollected,
            start_date: b.start_date,
          };
        });

      if (payloadBorrowers.length === 0) {
        setError("Please enter at least 1 borrower with a valid name.");
        setLoading(false);
        return;
      }

      // 3. Execute Bulk Borrower Import
      const result = await onboardingService.bulkImportBorrowers(payloadBorrowers);
      setImportResult(result);
      setStep(3);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Migration import failed. Please check payload fields.");
    } finally {
      setLoading(false);
    }
  };

  // Master Portfolio Summary Calculations
  const portfolioSummary = useMemo(() => {
    let totalDisbursed = 0;
    let totalReceivable = 0;
    let totalCollectedSoFar = 0;
    let totalOutstanding = 0;

    borrowers.forEach((b) => {
      const disbursed = Number(b.disbursed_amount) || 0;
      const instAmt = Number(b.installment_amount) || 0;
      const totalInst = Number(b.total_installments) || 1;
      const paidInst = Math.min(Number(b.installments_paid_count) || 0, totalInst);

      const receivable = totalInst * instAmt;
      const collected = paidInst * instAmt;
      const outstanding = Math.max(0, receivable - collected);

      totalDisbursed += disbursed;
      totalReceivable += receivable;
      totalCollectedSoFar += collected;
      totalOutstanding += outstanding;
    });

    const totalProfit = totalReceivable - totalDisbursed;
    const overallRoi = totalDisbursed > 0 ? (totalProfit / totalDisbursed) * 100 : 0;

    return {
      totalDisbursed,
      totalReceivable,
      totalCollectedSoFar,
      totalOutstanding,
      totalProfit,
      overallRoi,
    };
  }, [borrowers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto p-3.5 sm:p-6 space-y-4">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Sparkles className="size-5 text-amber-500 shrink-0" />
            <DialogTitle className="text-base sm:text-xl font-display font-bold">
              Digital Migration & Onboarding Suite
            </DialogTitle>
          </div>
          <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground">
            Onboard existing paper loans, set Day 1 physical cash float, assign route line days, and auto-calculate borrower ROI.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Day 1 Cutover Baseline & Configured Route Lines Overview */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-5 py-1 sm:py-2">
            <div className="p-3.5 sm:p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
                <Wallet className="size-4 text-primary shrink-0" /> Step 1: Establish Day 1 Cutover Baseline
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Initialize your physical cash in hand today. This prevents missing past paper logs from corrupting your daily route cash balancing.
              </p>
            </div>

            {/* Configured Route Lines Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary shrink-0" /> Configured Route Lines ({lines.length} Configured)
                </Label>
              </div>

              {lines.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-300">
                  ⚠️ No route lines configured yet. Default week days will be assigned. You can configure route lines anytime from the top bar!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                  {lines.map((ln) => (
                    <div key={ln.public_id} className="p-2.5 sm:p-3 rounded-xl border border-border bg-muted/20 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-foreground flex items-center gap-1">
                          <MapPin className="size-3 text-primary shrink-0" /> {ln.name}
                        </span>
                        {ln.area && <Badge variant="outline" className="text-[10px] truncate max-w-[120px]">{ln.area}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ln.day_schedules?.map((sched) => (
                          <Badge key={sched.day_of_week} variant="secondary" className="text-[10px] capitalize px-1.5 py-0.5">
                            {sched.day_of_week.slice(0, 3)}: {sched.portion === "morning" ? "🌅 Morn" : sched.portion === "afternoon" ? "🌆 Aft" : "☀️ Full"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-border/40">
              <div>
                <Label className="text-[11px] sm:text-xs font-semibold">Cutover Date (Day 1 Baseline)</Label>
                <Input
                  type="date"
                  value={cutoverDate}
                  onChange={(e) => setCutoverDate(e.target.value)}
                  className="mt-1 h-8 sm:h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px] sm:text-xs font-semibold">Opening Physical Handheld Cash (₹)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="e.g. 15000"
                  className="mt-1 h-8 sm:h-9 text-xs font-bold text-primary"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t flex justify-end">
              <Button type="button" onClick={() => setStep(2)} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm font-bold gap-1.5">
                Continue to Borrower Onboarding <ArrowRight className="size-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Dual Onboarding Suite with Mobile & Desktop Responsive Design */}
        {step === 2 && (
          <div className="space-y-3 sm:space-y-4 py-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                  <Users className="size-4 text-primary shrink-0" /> Step 2: Onboard Active Existing Borrowers
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Select route line, assign collection day, enter loan details, and view auto-calculated ROI.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <Button
                  type="button"
                  variant={onboardingMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOnboardingMode("table")}
                  className="h-7 sm:h-8 text-[11px] sm:text-xs font-semibold gap-1 px-2.5"
                >
                  <Keyboard className="size-3.5" /> Paper Register Grid
                </Button>
                <Button
                  type="button"
                  variant={onboardingMode === "excel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOnboardingMode("excel")}
                  className="h-7 sm:h-8 text-[11px] sm:text-xs font-semibold gap-1 px-2.5"
                >
                  <FileSpreadsheet className="size-3.5" /> Excel / CSV Upload
                </Button>
              </div>
            </div>

            {/* Excel Upload Mode */}
            {onboardingMode === "excel" && (
              <div className="p-4 sm:p-6 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 text-center space-y-3">
                <FileSpreadsheet className="size-8 sm:size-10 text-primary mx-auto" />
                <div className="space-y-1">
                  <h5 className="font-bold text-xs sm:text-sm">Upload Borrower Excel / CSV Sheet</h5>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Upload your file to auto-fill the onboarding grid below.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    className="h-8 text-xs font-bold gap-1.5"
                  >
                    <Upload className="size-3.5" /> Browse File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadSampleTemplate}
                    size="sm"
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <Download className="size-3.5" /> Download CSV Template
                  </Button>
                </div>
              </div>
            )}

            {/* Portfolio ROI & Outstanding Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 bg-muted/40 rounded-xl border text-xs">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Total Disbursed</p>
                <p className="font-bold text-xs sm:text-sm">{inr(portfolioSummary.totalDisbursed)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Pre-Digital Paid</p>
                <p className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">{inr(portfolioSummary.totalCollectedSoFar)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Active Balance</p>
                <p className="font-bold text-xs sm:text-sm text-primary">{inr(portfolioSummary.totalOutstanding)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Profit (ROI %)</p>
                <p className="font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5 truncate">
                  <TrendingUp className="size-3 text-emerald-500 shrink-0" />
                  +{inr(portfolioSummary.totalProfit)} ({portfolioSummary.overallRoi.toFixed(1)}%)
                </p>
              </div>
            </div>

            {/* Interactive Paper Register Table (Mobile & Desktop Pixel-Perfect Responsive Card View) */}
            <div className="space-y-2">
              <div className="max-h-[380px] sm:max-h-[440px] overflow-y-auto border rounded-xl p-1.5 sm:p-2 bg-muted/20 space-y-3">
                {borrowers.map((b, idx) => {
                  const disbursedAmt = Number(b.disbursed_amount) || 0;
                  const instAmt = Number(b.installment_amount) || 0;
                  const totalInst = Number(b.total_installments) || 1;
                  const paidInst = Math.min(Number(b.installments_paid_count) || 0, totalInst);

                  const remainingInst = Math.max(0, totalInst - paidInst);
                  const totalReceivable = totalInst * instAmt;
                  const alreadyPaidAmt = paidInst * instAmt;
                  const remainingBalance = remainingInst * instAmt;

                  const profitAmt = totalReceivable - disbursedAmt;
                  const roiPercent = disbursedAmt > 0 ? (profitAmt / disbursedAmt) * 100 : 0;

                  const availableDays = getAvailableDaysForLine(b.line_id);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-background rounded-xl border border-border/90 space-y-3 shadow-xs text-xs"
                    >
                      {/* Borrower Card Header: Row Number Badge & Delete Action */}
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[11px] bg-primary/10 text-primary border-primary/30 font-bold px-2 py-0.5">
                            Borrower #{idx + 1}
                          </Badge>
                          {b.full_name && <span className="font-bold text-foreground truncate max-w-[180px] sm:max-w-xs">{b.full_name}</span>}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={borrowers.length === 1}
                          className="h-7 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 gap-1 px-2"
                        >
                          <Trash2 className="size-3.5 text-rose-500" /> <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>

                      {/* Grid Row 1: Identification (Full Name & Mobile Phone) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <Label className="text-[11px] font-semibold text-foreground mb-1 block">Full Name *</Label>
                          <Input
                            value={b.full_name}
                            onChange={(e) => handleUpdateRow(idx, "full_name", e.target.value)}
                            placeholder="e.g. Ramesh Kumar"
                            className="h-9 text-xs font-semibold bg-background"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Mobile Phone</Label>
                          <Input
                            value={b.mobile_number}
                            onChange={(e) => handleUpdateRow(idx, "mobile_number", e.target.value)}
                            placeholder="+919876543210"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      {/* Grid Row 2: Route Assignment (Route Line & Collection Day) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Route Line</Label>
                          <Select
                            value={b.line_id}
                            onValueChange={(val) => handleUpdateRow(idx, "line_id", val)}
                          >
                            <SelectTrigger className="h-9 text-xs font-semibold">
                              <SelectValue placeholder="Select Line..." />
                            </SelectTrigger>
                            <SelectContent>
                              {lines.map((l) => (
                                <SelectItem key={l.public_id} value={l.public_id} className="text-xs">
                                  {l.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Collection Day</Label>
                          <Select
                            value={b.collection_day}
                            onValueChange={(val) => handleUpdateRow(idx, "collection_day", val)}
                          >
                            <SelectTrigger className="h-9 text-xs capitalize font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDays.map((d) => (
                                <SelectItem key={d.key} value={d.key} className="text-xs capitalize">
                                  {d.label} {d.portion ? `(${d.portion})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Grid Row 3: Loan Financials Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 bg-muted/30 p-2.5 rounded-xl items-center">
                        <div>
                          <Label className="text-[10px] font-medium text-muted-foreground block mb-1">Disbursed (₹)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={b.disbursed_amount ?? ""}
                            onChange={(e) => handleUpdateRow(idx, "disbursed_amount", e.target.value)}
                            className="h-8 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-medium text-muted-foreground block mb-1">Inst. Amount (₹)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={b.installment_amount ?? ""}
                            onChange={(e) => handleUpdateRow(idx, "installment_amount", e.target.value)}
                            className="h-8 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-medium text-muted-foreground block mb-1">Total Inst.</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={b.total_installments ?? ""}
                            onChange={(e) => handleUpdateRow(idx, "total_installments", e.target.value)}
                            className="h-8 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-medium text-muted-foreground block mb-1">Paid Count</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={b.installments_paid_count ?? ""}
                            onChange={(e) => handleUpdateRow(idx, "installments_paid_count", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className="h-8 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                      </div>

                      {/* Grid Row 4: Calculated Balances & ROI Summary */}
                      <div className="grid grid-cols-2 gap-2 p-2 bg-primary/5 rounded-xl border border-primary/20 items-center">
                        <div>
                          <Label className="text-[10px] font-medium text-muted-foreground block">Remaining Tenure</Label>
                          <p className="font-mono font-bold text-xs text-foreground mt-0.5">
                            {remainingInst} / {totalInst} Installments Left
                          </p>
                        </div>

                        <div>
                          <Label className="text-[10px] font-medium text-muted-foreground block">Calculated Balance Due</Label>
                          <p className="font-bold text-xs text-primary mt-0.5">
                            {inr(remainingBalance)}
                          </p>
                        </div>
                      </div>

                      {/* Section 5: Profit & ROI Badge Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] px-1 pt-1 font-medium text-muted-foreground border-t border-border/40">
                        <span className="truncate">
                          Paid: <strong className="text-emerald-600">{inr(alreadyPaidAmt)}</strong> ({paidInst} inst.) • Total: <strong className="text-foreground">{inr(totalReceivable)}</strong>
                        </span>

                        <Badge
                          variant="outline"
                          className={
                            profitAmt >= 0
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold px-2 py-0.5"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/30 font-bold px-2 py-0.5"
                          }
                        >
                          Profit (ROI): {profitAmt >= 0 ? `+${inr(profitAmt)}` : inr(profitAmt)} ({roiPercent.toFixed(1)}%)
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="w-full sm:w-auto h-8 text-xs font-semibold gap-1 text-primary border-primary/40"
              >
                <Plus className="size-3.5" /> Add Another Borrower Row (Enter ↵)
              </Button>
            </div>

            <DialogFooter className="pt-3 border-t flex flex-col-reverse sm:flex-row justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-9 text-xs sm:text-sm">
                Back to Baseline
              </Button>
              <Button
                type="button"
                onClick={handleExecuteMigration}
                disabled={loading}
                className="h-9 sm:h-10 text-xs sm:text-sm gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Import & Complete Cutover
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Cutover Summary Confirmation */}
        {step === 3 && importResult && (
          <div className="space-y-4 sm:space-y-5 py-3 text-center">
            <div className="size-12 sm:size-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="size-7 sm:size-8" />
            </div>

            <div className="space-y-1">
              <h4 className="font-display text-lg sm:text-xl font-bold text-foreground">
                🎉 Digital Cutover Completed Successfully!
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Your existing paper loans are now fully digitized. Handheld cash float and borrower passbooks have been synchronized.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border text-xs sm:text-sm">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Imported Loans</p>
                <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">{importResult.imported_count}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Pre-Digital Paid</p>
                <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {inr(parseFloat(importResult.total_collected_pre_digital))}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Active Outstanding</p>
                <p className="text-base sm:text-lg font-bold text-primary mt-0.5">
                  {inr(parseFloat(importResult.total_outstanding))}
                </p>
              </div>
            </div>

            <DialogFooter className="justify-center pt-2">
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setStep(1);
                }}
                className="w-full sm:w-auto h-9 sm:h-10 font-bold px-8"
              >
                Go to Dashboard / Customers Register
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
