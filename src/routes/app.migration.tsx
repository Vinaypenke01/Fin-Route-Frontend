import { useState, useRef, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Wallet, Users, FileSpreadsheet, Plus, Trash2, CheckCircle2, ArrowRight, ArrowLeft, Download, Upload, AlertCircle, Loader2, Calendar, IndianRupee, Keyboard, MapPin, Calculator, TrendingUp, ChevronLeft, Check, Sun, Sunset,
} from "lucide-react";
import { inr } from "@/lib/utils";
import { onboardingService, BulkBorrowerItem } from "@/lib/services/onboarding-service";
import { guestWorkspaceService, CollectionLine } from "@/lib/services/guest-workspace-service";

export const Route = createFileRoute("/app/migration")({
  head: () => ({
    meta: [
      { title: "Digital Migration — FinRoute" },
      { name: "description", content: "Onboard existing paper loans and set up your Day 1 cutover baseline." },
    ],
  }),
  component: DigitalMigrationPage,
});

interface EnhancedBorrowerRow {
  sequence_number?: number | string;
  full_name: string;
  mobile_number: string;
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

function DigitalMigrationPage() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<CollectionLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State: Selected Target Line, Cutover Baseline Date & Opening Cash Float
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [cutoverDate, setCutoverDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [openingCash, setOpeningCash] = useState<string>("0");

  // Step 2 State: Onboarding Mode & Borrowers List
  const [onboardingMode, setOnboardingMode] = useState<"table" | "excel">("table");
  const [borrowers, setBorrowers] = useState<EnhancedBorrowerRow[]>([]);

  // Step 3 State: Import Summary Result
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadWorkspaceLines() {
      try {
        const loadedLines = await guestWorkspaceService.getLines();
        const activeLines = loadedLines || [];
        setLines(activeLines);

        const firstLine = activeLines[0];
        const firstLineId = firstLine?.public_id || "";
        setSelectedLineId(firstLineId);

        const defaultDay = firstLine?.day_schedules?.[0]?.day_of_week.toLowerCase() || "monday";
        setBorrowers([
          {
            sequence_number: 1,
            full_name: "",
            mobile_number: "",
            collection_day: defaultDay,
            disbursed_amount: 10000,
            installment_amount: 600,
            total_installments: 20,
            installments_paid_count: 0,
            start_date: new Date().toISOString().slice(0, 10),
          },
        ]);
      } catch (err) {
        console.error("Failed to load workspace lines:", err);
      } finally {
        setLoadingLines(false);
      }
    }
    loadWorkspaceLines();
  }, []);

  // Currently selected line object in Step 1
  const selectedLineObj = useMemo(() => {
    return lines.find((l) => l.public_id === selectedLineId) || lines[0];
  }, [lines, selectedLineId]);

  // Get available days & sessions for the selected line
  const availableDaysForSelectedLine = useMemo(() => {
    const dayScheds = selectedLineObj?.day_schedules || [];
    if (dayScheds.length === 0) {
      return Object.entries(ALL_DAYS_MAP).map(([key, label]) => ({
        key,
        label,
        portion: undefined as string | undefined,
      }));
    }

    return dayScheds.map((s) => ({
      key: s.day_of_week.toLowerCase(),
      label: ALL_DAYS_MAP[s.day_of_week.toLowerCase()] || s.day_of_week,
      portion: s.portion as string | undefined,
    }));
  }, [selectedLineObj]);

  const handleAddRow = () => {
    const defaultDay = availableDaysForSelectedLine[0]?.key || "monday";
    setBorrowers((prev) => [
      ...prev,
      {
        sequence_number: prev.length + 1,
        full_name: "",
        mobile_number: "",
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
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index === borrowers.length - 1) {
      e.preventDefault();
      handleAddRow();
    }
  };

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

  const handleExecuteMigration = async () => {
    setLoading(true);
    setError(null);
    try {
      await onboardingService.setCutoverBaseline({
        cutover_date: cutoverDate,
        opening_cash: parseFloat(openingCash) || 0,
      });

      const payloadBorrowers: BulkBorrowerItem[] = borrowers
        .filter((b) => b.full_name.trim().length > 0)
        .map((b, idx) => {
          const installmentAmt = Number(b.installment_amount) || 0;
          const paidCount = Number(b.installments_paid_count) || 0;
          const amountAlreadyCollected = paidCount * installmentAmt;

          return {
            sequence_number: Number(b.sequence_number) || (idx + 1),
            full_name: b.full_name,
            mobile_number: b.mobile_number,
            line_id: selectedLineId || undefined,
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

      const result = await onboardingService.bulkImportBorrowers(payloadBorrowers);
      setImportResult(result);
      setStep(3);
    } catch (err: any) {
      setError(err?.message || "Migration import failed. Please check payload fields.");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-16 space-y-5 sm:space-y-6">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground hover:text-foreground">
            <Link to="/app">
              <ChevronLeft className="size-4 mr-1" /> Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2 mt-1">
            <Sparkles className="size-5 sm:size-6 text-amber-500 shrink-0" />
            <h1 className="font-display text-xl sm:text-2xl font-bold">Digital Migration & Onboarding Suite</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Cleanly transition your paper register loans to digital. Select target route line, set Day 1 cash float, and import active borrower passbooks.
          </p>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 p-1 rounded-xl border border-border">
          <Badge
            variant={step === 1 ? "default" : step > 1 ? "secondary" : "outline"}
            className="text-xs px-2.5 py-1 gap-1 cursor-pointer"
            onClick={() => setStep(1)}
          >
            {step > 1 ? <Check className="size-3 text-emerald-500" /> : "1."} Route & Cutover Float
          </Badge>

          <span className="text-muted-foreground text-xs">•</span>

          <Badge
            variant={step === 2 ? "default" : step > 2 ? "secondary" : "outline"}
            className="text-xs px-2.5 py-1 gap-1 cursor-pointer"
            onClick={() => step > 1 && setStep(2)}
          >
            {step > 2 ? <Check className="size-3 text-emerald-500" /> : "2."} Borrowers Onboarding
          </Badge>

          <span className="text-muted-foreground text-xs">•</span>

          <Badge variant={step === 3 ? "default" : "outline"} className="text-xs px-2.5 py-1">
            3. Cutover Complete
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Select Target Route Line & Establish Cutover Baseline */}
      {step === 1 && (
        <Card className="p-4 sm:p-6 space-y-5 sm:space-y-6 bg-card border-border shadow-xs">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
            <h3 className="font-bold text-xs sm:text-base text-foreground flex items-center gap-2">
              <Wallet className="size-4 sm:size-5 text-primary shrink-0" /> Step 1: Select Target Route Line & Day 1 Baseline
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              Select the route line you are migrating today and initialize your physical cash float.
            </p>
          </div>

          {/* Route Line Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 text-primary shrink-0" /> Select Target Route Line for Migration
              </Label>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-bold text-primary shrink-0">
                <Link to="/app/customers">Manage Lines</Link>
              </Button>
            </div>

            {loadingLines ? (
              <p className="text-xs text-muted-foreground">Loading workspace route lines...</p>
            ) : lines.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-300">
                ⚠️ No route lines configured yet. Default weekly days will be assigned automatically.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lines.map((ln) => {
                  const isSelected = ln.public_id === selectedLineId;
                  return (
                    <div
                      key={ln.public_id}
                      onClick={() => setSelectedLineId(ln.public_id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 text-xs ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-foreground flex items-center gap-1.5 text-sm">
                          <MapPin className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          {ln.name}
                        </span>
                        {isSelected && <Badge className="bg-primary text-primary-foreground text-[10px]">Selected</Badge>}
                      </div>

                      {ln.area && <p className="text-[11px] text-muted-foreground">Area: {ln.area}</p>}

                      <div className="flex flex-wrap gap-1 pt-1">
                        {ln.day_schedules?.map((sched) => (
                          <Badge key={sched.day_of_week} variant="secondary" className="text-[10px] capitalize px-2 py-0.5 font-medium border">
                            {sched.day_of_week.slice(0, 3)}: {sched.portion === "morning" ? "🌅 Morn" : sched.portion === "afternoon" ? "🌆 Aft" : "☀️ Full"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
            <div>
              <Label className="text-xs font-bold text-foreground block mb-1.5">Cutover Date (Day 1 Baseline)</Label>
              <Input
                type="date"
                value={cutoverDate}
                onChange={(e) => setCutoverDate(e.target.value)}
                className="h-10 text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground block mb-1.5">Opening Physical Handheld Cash (₹)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="e.g. 15000"
                className="h-10 text-xs sm:text-sm font-bold text-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button
              type="button"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm font-bold gap-1.5 px-4 sm:px-6"
            >
              Continue to Borrower Onboarding <ArrowRight className="size-4 shrink-0" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Paper Register Onboarding Suite (No Line Dropdown inside rows!) */}
      {step === 2 && (
        <Card className="p-4 sm:p-6 space-y-5 bg-card border-border shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Users className="size-5 text-primary shrink-0" /> Step 2: Onboard Borrowers for Route
                </h3>
                {selectedLineObj && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold text-xs">
                    📍 {selectedLineObj.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select collection day/session, enter loan details, and view auto-calculated portfolio ROI.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                variant={onboardingMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setOnboardingMode("table")}
                className="h-9 text-xs font-semibold gap-1.5 px-3"
              >
                <Keyboard className="size-4" /> Paper Register Grid
              </Button>
              <Button
                type="button"
                variant={onboardingMode === "excel" ? "default" : "outline"}
                size="sm"
                onClick={() => setOnboardingMode("excel")}
                className="h-9 text-xs font-semibold gap-1.5 px-3"
              >
                <FileSpreadsheet className="size-4" /> Excel / CSV Upload
              </Button>
            </div>
          </div>

          {/* Excel Upload Box */}
          {onboardingMode === "excel" && (
            <div className="p-6 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 text-center space-y-3">
              <FileSpreadsheet className="size-10 text-primary mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">Upload Borrower Excel / CSV Sheet</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Upload your spreadsheet to auto-populate all borrower rows for <strong>{selectedLineObj?.name || "Target Line"}</strong>.
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
                  className="h-9 text-xs font-bold gap-1.5 px-4"
                >
                  <Upload className="size-4" /> Browse File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadSampleTemplate}
                  size="sm"
                  className="h-9 text-xs font-semibold gap-1.5 px-4"
                >
                  <Download className="size-4" /> Download Sample CSV Template
                </Button>
              </div>
            </div>
          )}

          {/* Master Portfolio ROI Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-muted/40 rounded-2xl border text-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Total Disbursed</p>
              <p className="font-bold text-sm sm:text-base mt-0.5">{inr(portfolioSummary.totalDisbursed)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Pre-Digital Paid</p>
              <p className="font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                {inr(portfolioSummary.totalCollectedSoFar)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Active Outstanding</p>
              <p className="font-bold text-sm sm:text-base text-primary mt-0.5">{inr(portfolioSummary.totalOutstanding)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">Total Profit (ROI %)</p>
              <p className="font-bold text-sm sm:text-base text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-0.5 truncate">
                <TrendingUp className="size-4 text-emerald-500 shrink-0" />
                +{inr(portfolioSummary.totalProfit)} ({portfolioSummary.overallRoi.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Onboarding Rows List (Cleaned: No Line Dropdown per row!) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wide">
              <span>Borrower Records ({borrowers.length} rows)</span>
              <span className="text-primary">Press Enter ↵ to add new row</span>
            </div>

            <div className="space-y-3">
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

                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 bg-background rounded-2xl border border-border/90 space-y-3.5 shadow-xs text-xs"
                  >
                    {/* Header: Row # and Delete */}
                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30 font-bold px-2.5 py-0.5">
                          Borrower #{idx + 1}
                        </Badge>
                        {b.full_name && <span className="font-bold text-foreground text-sm truncate max-w-xs">{b.full_name}</span>}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={borrowers.length === 1}
                        className="h-7 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 gap-1 px-2.5"
                      >
                        <Trash2 className="size-3.5 text-rose-500" /> Delete Row
                      </Button>
                    </div>

                    {/* 1. Borrower Identification, Token / Seq # & Collection Day / Session Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-semibold text-foreground block mb-1">Seq # / Token</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={b.sequence_number ?? ""}
                          onChange={(e) => handleUpdateRow(idx, "sequence_number", e.target.value)}
                          placeholder="e.g. 1"
                          className="h-9 text-xs font-bold font-mono bg-background"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <Label className="text-xs font-semibold text-foreground block mb-1">Borrower Full Name *</Label>
                        <Input
                          value={b.full_name}
                          onChange={(e) => handleUpdateRow(idx, "full_name", e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="h-9 text-xs font-semibold bg-background"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-xs font-semibold text-muted-foreground block mb-1">Mobile Phone Number</Label>
                        <Input
                          value={b.mobile_number}
                          onChange={(e) => handleUpdateRow(idx, "mobile_number", e.target.value)}
                          placeholder="+919876543210"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-xs font-semibold text-foreground block mb-1">Collection Day / Session *</Label>
                        <Select
                          value={b.collection_day}
                          onValueChange={(val) => handleUpdateRow(idx, "collection_day", val)}
                        >
                          <SelectTrigger className="h-9 text-xs capitalize font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDaysForSelectedLine.map((d) => (
                              <SelectItem key={d.key} value={d.key} className="text-xs capitalize font-medium">
                                {d.label} {d.portion === "morning" ? "(🌅 Morning)" : d.portion === "afternoon" ? "(<ctrl42> Afternoon)" : "(☀️ Full Day)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 2. Loan Financials */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/50 bg-muted/30 p-3 rounded-xl items-center">
                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Disbursed (₹)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={b.disbursed_amount ?? ""}
                          onChange={(e) => handleUpdateRow(idx, "disbursed_amount", e.target.value)}
                          className="h-8 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Inst. Amount (₹)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={b.installment_amount ?? ""}
                          onChange={(e) => handleUpdateRow(idx, "installment_amount", e.target.value)}
                          className="h-8 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Total Inst.</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={b.total_installments ?? ""}
                          onChange={(e) => handleUpdateRow(idx, "total_installments", e.target.value)}
                          className="h-8 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Paid Count (Paper)</Label>
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

                    {/* 3. Calculated Balances */}
                    <div className="grid grid-cols-2 gap-3 p-2.5 bg-primary/5 rounded-xl border border-primary/20 items-center">
                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground block">Remaining Tenure</Label>
                        <p className="font-mono font-bold text-xs text-foreground mt-0.5">
                          {remainingInst} / {totalInst} Installments Left
                        </p>
                      </div>

                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground block">Calculated Balance Due</Label>
                        <p className="font-bold text-xs text-primary mt-0.5">
                          {inr(remainingBalance)}
                        </p>
                      </div>
                    </div>

                    {/* 4. ROI Profit Badge Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1 pt-1 font-medium text-muted-foreground border-t border-border/40">
                      <span>
                        Pre-Digital Paid: <strong className="text-emerald-600">{inr(alreadyPaidAmt)}</strong> ({paidInst} inst.) • Total Due: <strong className="text-foreground">{inr(totalReceivable)}</strong>
                      </span>

                      <Badge
                        variant="outline"
                        className={
                          profitAmt >= 0
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold px-2.5 py-1 text-xs"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/30 font-bold px-2.5 py-1 text-xs"
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
              onClick={handleAddRow}
              className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 text-primary border-primary/40"
            >
              <Plus className="size-4" /> Add Another Borrower Row (Enter ↵)
            </Button>
          </div>

          <div className="pt-4 border-t flex flex-col-reverse sm:flex-row justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10 text-xs sm:text-sm">
              Back to Target Line Selection
            </Button>
            <Button
              type="button"
              onClick={handleExecuteMigration}
              disabled={loading}
              className="h-10 text-xs sm:text-sm gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Import & Complete Digital Cutover
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Cutover Complete */}
      {step === 3 && importResult && (
        <Card className="p-4 sm:p-8 space-y-5 sm:space-y-6 text-center bg-card border-border shadow-xs max-w-2xl mx-auto">
          <div className="size-14 sm:size-16 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="size-8 sm:size-10" />
          </div>

          <div className="space-y-1.5 px-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight">
              🎉 Digital Cutover Completed Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your paper register loans are now fully digitized. Handheld cash float and borrower passbooks have been synchronized.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-5 rounded-2xl bg-muted/30 border border-border w-full">
            <div className="p-3 rounded-xl bg-background/60 border border-border/50 flex flex-col items-center justify-center space-y-1">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Imported Loans</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{importResult.imported_count}</p>
            </div>
            <div className="p-3 rounded-xl bg-background/60 border border-border/50 flex flex-col items-center justify-center space-y-1">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Pre-Digital Paid</p>
              <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {inr(parseFloat(importResult.total_collected_pre_digital))}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background/60 border border-border/50 flex flex-col items-center justify-center space-y-1">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Active Outstanding</p>
              <p className="text-base sm:text-xl font-bold text-primary">
                {inr(parseFloat(importResult.total_outstanding))}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full max-w-md mx-auto">
            <Button type="button" onClick={() => navigate({ to: "/app" })} className="w-full sm:w-auto h-11 text-xs sm:text-sm font-bold px-6">
              Go to Dashboard
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/app/customers" })} className="w-full sm:w-auto h-11 text-xs sm:text-sm font-semibold px-6">
              View Customers Register
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
