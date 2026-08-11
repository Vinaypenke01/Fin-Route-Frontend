import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserPlus, Download, Filter, Calculator, Sparkles, UserCheck, Edit3, Calendar, CheckCircle2, Lock, Save, ShieldAlert, Trash2, Eye, MessageSquare, Image as ImageIcon, MapPin, Plus, RefreshCw, Users } from "lucide-react";
import { inr } from "@/lib/utils";
import { GuestPlanUsage } from "@/components/guest-plan-usage";
import { BorrowerProfileDetailsModal } from "@/components/borrower-profile-modal";
import { ExtendInstallmentsDialog } from "@/components/extend-installments-dialog";
import { LineSetupDialog } from "@/components/line-setup-dialog";
import { ReassignRouteDialog } from "@/components/reassign-route-dialog";
import { TableSkeletonRows } from "@/components/ui/skeleton-loaders";
import { guestWorkspaceService, Customer, WorkspaceData, Collection, CollectionLine } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";
import { downloadCustomerCardImage, generateBatchPassbookPages } from "@/lib/download-customer-image";
import { validateMobileNumber } from "@/lib/auth-validation";

export const Route = createFileRoute("/app/customers")({
  head: () => ({ meta: [{ title: "Customers — FinRoute" }, { name: "description", content: "Manage your customers, loans and collection history." }] }),
  component: CustomersPage,
});

const ALL_DAYS_LIST = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${months[monthIdx] || ""} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function InstallmentPassbookGrid({
  total = 20,
  paid = 0,
  skipped = 0,
  outstanding = 0,
  onExtend,
  historyStatuses,
}: {
  total?: number;
  paid?: number;
  skipped?: number;
  outstanding?: number;
  onExtend?: () => void;
  historyStatuses?: ("paid" | "skipped")[];
}) {
  const safeTotal = Math.min(Math.max(total || 1, 1), 300);
  const safePaid = Math.min(paid || 0, safeTotal);
  const remaining = Math.max(0, safeTotal - safePaid);
  const hasSkipped = skipped > 0;
  const isCompletedWithBalance = safePaid >= safeTotal && outstanding > 0;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex flex-wrap items-center justify-between text-[11px] font-medium gap-1">
        <span className="text-muted-foreground font-semibold flex items-center gap-1">
          Progress:
          <span className={hasSkipped ? "text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30" : "text-emerald-700 dark:text-emerald-400 font-bold"}>
            {safePaid} Paid {hasSkipped ? `(${skipped} Skipped)` : ""}
          </span> / <span className="text-foreground">{safeTotal} Total</span>
        </span>

        <div className="flex items-center gap-1">
          <Badge variant="outline" className={`font-mono text-[10px] ${hasSkipped ? "text-rose-600 border-rose-300 dark:text-rose-400" : ""}`}>
            {remaining} Remaining
          </Badge>

          {isCompletedWithBalance && onExtend && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExtend}
              className="h-5 px-1.5 text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25 font-bold gap-0.5"
              title="Schedule installments completed but balance pending. Click to extend tenure."
            >
              <Calendar className="size-3 text-amber-600" /> + Extend
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-muted/40 rounded-lg border border-border/60">
        {Array.from({ length: safeTotal }, (_, i) => {
          const num = i + 1;
          let isPaid = false;
          let isSkipped = false;

          if (historyStatuses && historyStatuses[i]) {
            isPaid = historyStatuses[i] === "paid";
            isSkipped = historyStatuses[i] === "skipped";
          } else {
            isPaid = num <= safePaid;
            const safeSkipped = Math.min(skipped || 0, Math.max(0, safeTotal - safePaid));
            isSkipped = !isPaid && num <= safePaid + safeSkipped;
          }

          return (
            <div
              key={num}
              title={
                isPaid
                  ? `Installment #${num}: PAID (Struck)`
                  : isSkipped
                  ? `Installment #${num}: SKIPPED (Struck Red)`
                  : `Installment #${num}: Pending`
              }
              className={`size-6 rounded text-[10px] font-mono font-bold flex items-center justify-center border transition-all ${
                isPaid
                  ? "bg-emerald-600 text-white border-emerald-700 opacity-90 shadow-xs"
                  : isSkipped
                  ? "bg-rose-600 text-white border-rose-700 font-extrabold shadow-xs"
                  : "bg-background text-muted-foreground border-border/80"
              }`}
            >
              {isPaid || isSkipped ? <s>{num}</s> : num}
            </div>
          );
        })}
      </div>

      {isCompletedWithBalance && (
        <div className="flex items-center justify-between p-1.5 bg-amber-500/10 rounded-md border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-300 font-medium">
          <span>Installments completed, but {inr(outstanding)} remains due.</span>
          {onExtend && (
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] text-amber-800 dark:text-amber-200 font-bold underline" onClick={onExtend}>
              Increase Installments
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function CustomersPage() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [extendingCustomer, setExtendingCustomer] = useState<Customer | null>(null);
  const [reassigningCustomer, setReassigningCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Collection Days Configuration State
  const [configuredDays, setConfiguredDays] = useState<string[]>([]);
  const [editingDays, setEditingDays] = useState<boolean>(false);
  const [draftDays, setDraftDays] = useState<string[]>(["monday"]);
  const [savingDays, setSavingDays] = useState<boolean>(false);
  const [daysError, setDaysError] = useState<string | null>(null);

  const handleReconfigureClick = () => {
    setEditingDays(true);
    setDraftDays(configuredDays.length > 0 ? configuredDays : ["monday"]);
  };

  // Line / Route State
  const [lines, setLines] = useState<CollectionLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedPortion, setSelectedPortion] = useState<string>("all");
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [lineToEdit, setLineToEdit] = useState<CollectionLine | null>(null);

  const loadLines = async () => {
    try {
      const data = await guestWorkspaceService.getLines();
      const loadedLines = data || [];
      setLines(loadedLines);

      // Auto-select line that includes today's current day of the week by default
      const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const lineForToday = loadedLines.find((ln) =>
        ln.day_schedules?.some((s) => s.day_of_week.toLowerCase() === currentDayName)
      );

      if (lineForToday) {
        setSelectedLine(lineForToday.public_id);
      } else if (loadedLines.length > 0) {
        setSelectedLine(loadedLines[0].public_id);
      }
    } catch (err) {
      console.error("Failed to load lines:", err);
    }
  };

  const loadWorkspace = async () => {
    try {
      const ws = await guestWorkspaceService.getWorkspace();
      setWorkspace(ws);
      const savedDays = ws.allowed_collection_days || [];
      setConfiguredDays(savedDays);
      setDraftDays(savedDays.length > 0 ? savedDays : ["monday"]);
      setEditingDays(savedDays.length === 0);
    } catch (err) {
      console.error("Workspace load error:", err);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await guestWorkspaceService.getCustomers({
        search: q || undefined,
        status: status === "all" ? undefined : status,
        collection_day: selectedDay === "all" ? undefined : selectedDay,
        line: selectedLine === "all" ? undefined : selectedLine,
        portion: selectedPortion === "all" ? undefined : selectedPortion,
      });
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    loadLines();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [q, status, selectedDay, selectedLine, selectedPortion]);

  const maxAllowedDays = workspace?.max_allowed_collection_days || (workspace?.subscription_plan === "free" ? 1 : 7);
  const isDaysSaved = configuredDays.length > 0;

  const handleToggleDraftDay = (dayKey: string) => {
    setDaysError(null);
    if (draftDays.includes(dayKey)) {
      if (draftDays.length === 1) {
        setDaysError("You must select at least 1 collection day.");
        return;
      }
      setDraftDays(draftDays.filter((d) => d !== dayKey));
    } else {
      if (draftDays.length >= maxAllowedDays) {
        if (maxAllowedDays === 1) {
          // Free Plan: Replace selection with the clicked day
          setDraftDays([dayKey]);
          return;
        }
        setDaysError(`Your ${workspace?.subscription_plan?.toUpperCase() || "current"} plan allows up to ${maxAllowedDays} collection days per week.`);
        return;
      }
      setDraftDays([...draftDays, dayKey]);
    }
  };

  const handleSaveCollectionDays = async () => {
    if (draftDays.length === 0) {
      setDaysError("Please select at least 1 collection day.");
      return;
    }
    setSavingDays(true);
    setDaysError(null);
    try {
      const updatedWs = await guestWorkspaceService.updateWorkspace({
        allowed_collection_days: draftDays,
      });
      setWorkspace(updatedWs);
      setConfiguredDays(draftDays);
      setEditingDays(false);

      // Reload customers so all updated borrower route days reflect instantly
      await loadCustomers();

      if (!draftDays.includes(selectedDay) && selectedDay !== "all") {
        setSelectedDay(draftDays[0]);
      }
    } catch (err: any) {
      setDaysError(err.message || "Failed to save collection days.");
    } finally {
      setSavingDays(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setDeleting(true);
    try {
      await guestWorkspaceService.deleteCustomer(deletingCustomer.public_id);
      setDeletingCustomer(null);
      loadCustomers();
    } catch (err) {
      console.error("Delete customer error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!customers.length) {
      alert("No borrower records available to export.");
      return;
    }

    try {
      // Fetch all collections to map exact installment dates & amounts for each borrower
      const colRes = await guestWorkspaceService.getCollections({ page_size: 1000 });
      const allCollections: Collection[] = colRes.data || [];

      // Group collections by borrower (by public_id or customer_code)
      const customerCollectionsMap: Record<string, Collection[]> = {};
      allCollections.forEach((entry) => {
        const isOpening = entry.remarks?.toLowerCase().includes("initial opening");
        const isSkipped = entry.status_code === "skipped" || entry.status_name?.toLowerCase().includes("skipped");
        if (isOpening || isSkipped) return;

        const keys = [
          entry.customer_public_id ? String(entry.customer_public_id).toLowerCase() : "",
          entry.customer_code ? String(entry.customer_code).toLowerCase() : "",
        ].filter(Boolean);

        keys.forEach((key) => {
          if (!customerCollectionsMap[key]) {
            customerCollectionsMap[key] = [];
          }
          // Avoid duplicate entries if keyed by both ID and code
          if (!customerCollectionsMap[key].some((e) => e.public_id === entry.public_id)) {
            customerCollectionsMap[key].push(entry);
          }
        });
      });

      // Sort each borrower's collection history chronologically by date
      Object.keys(customerCollectionsMap).forEach((k) => {
        customerCollectionsMap[k].sort((a, b) => {
          const dateA = a.collection_date || a.created_at || "";
          const dateB = b.collection_date || b.created_at || "";
          return dateA.localeCompare(dateB);
        });
      });

      // Determine max installments paid by any borrower to build header columns
      let maxInstallmentCount = 0;
      customers.forEach((c) => {
        const pId = String(c.public_id).toLowerCase();
        const cCode = String(c.customer_code).toLowerCase();
        const cList = customerCollectionsMap[pId] || customerCollectionsMap[cCode] || [];
        if (cList.length > maxInstallmentCount) {
          maxInstallmentCount = cList.length;
        }
      });
      if (maxInstallmentCount < 1) maxInstallmentCount = 1;

      // Base headers
      const baseHeaders = [
        "Seq #",
        "Customer Code",
        "Borrower Full Name",
        "Mobile Number",
        "Route Day",
        "Principal Amount (Rs)",
        "Interest Rate (%)",
        "Total Due (Rs)",
        "Amount Paid (Rs)",
        "Outstanding Balance (Rs)",
        "Per Installment Amount (Rs)",
        "Collection Frequency",
        "Total Installments",
        "Paid Installments Count",
        "Remaining Installments Count",
        "Status",
        "Start Date",
        "End Date",
        "Address",
      ];

      // Dynamic Installment Headers (Inst #1 Date, Inst #1 Amount, Inst #2 Date, Inst #2 Amount...)
      const installmentHeaders: string[] = [];
      for (let i = 1; i <= maxInstallmentCount; i++) {
        installmentHeaders.push(`Inst #${i} Date`, `Inst #${i} Amount (Rs)`);
      }

      const headers = [...baseHeaders, ...installmentHeaders];
      const csvRows = [headers.join(",")];

      customers.forEach((c) => {
        const pId = String(c.public_id).toLowerCase();
        const cCode = String(c.customer_code).toLowerCase();
        const cList = customerCollectionsMap[pId] || customerCollectionsMap[cCode] || [];

        // Sum actual collections for this customer
        const collectionSum = cList.reduce((sum, entry) => sum + Number(entry.collected_amount || 0), 0);

        // Paid amount is maximum of collection records sum or customer's recorded amount_already_collected
        const actualPaidAmount = Math.max(Number(c.amount_already_collected || 0), collectionSum);

        const totalDue = Number(c.total_due || c.loan_amount || 0);
        const actualOutstanding = Math.max(0, totalDue - actualPaidAmount);

        const totalInst = c.total_installments || 0;
        const paidInstCount = cList.length > 0 ? cList.length : (c.installments_paid_count || 0);
        const remInstCount = Math.max(0, totalInst - paidInstCount);

        // Clean mobile number for Excel so +91 is not treated as a math formula
        const cleanMobile = c.mobile_number ? c.mobile_number.replace(/^\+91/, "").replace(/\D/g, "") : "";
        const mobileCell = cleanMobile ? `="${cleanMobile}"` : '""';

        // Interest rate calculation fallback if 0
        let interestRate = c.interest_rate;
        if (!interestRate && c.loan_amount && totalDue > c.loan_amount) {
          interestRate = Number((((totalDue - c.loan_amount) / c.loan_amount) * 100).toFixed(1));
        }

        const baseRow = [
          c.sequence_number || "",
          `"${c.customer_code || ""}"`,
          `"${(c.full_name || "").replace(/"/g, '""')}"`,
          mobileCell,
          `"${(c.collection_day || "").toUpperCase()}"`,
          Number(c.loan_amount || 0).toFixed(2),
          interestRate ? `${interestRate}%` : "0%",
          totalDue.toFixed(2),
          actualPaidAmount.toFixed(2),
          actualOutstanding.toFixed(2),
          Number(c.installment_amount || 0).toFixed(2),
          `"${c.collection_frequency_name || c.collection_frequency || "Weekly"}"`,
          totalInst,
          paidInstCount,
          remInstCount,
          `"${(c.status || "active").toUpperCase()}"`,
          `"${c.start_date || ""}"`,
          `"${c.end_date || ""}"`,
          `"${(c.address || "").replace(/"/g, '""')}"`,
        ];

        // Append individual installment dates & amounts
        const installmentCells: string[] = [];
        for (let i = 0; i < maxInstallmentCount; i++) {
          const entry = cList[i];
          if (entry) {
            const instDate = entry.collection_date || (entry.created_at ? String(entry.created_at).slice(0, 10) : "");
            const instAmt = Number(entry.collected_amount || 0).toFixed(2);
            installmentCells.push(`"${instDate}"`, instAmt);
          } else {
            installmentCells.push('""', '""');
          }
        }

        const fullRow = [...baseRow, ...installmentCells];
        csvRows.push(fullRow.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `FinRoute_Borrowers_${selectedDay}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export CSV error:", err);
      alert("Failed to export CSV. Please try again.");
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (Number(c.outstanding_balance) || 0), 0);
  const activeCount = customers.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <GuestPlanUsage />

      {/* Metrics Row */}
      <div className="space-y-3">
        {/* 3 Cards in one row on mobile */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <Card className="p-3 sm:p-4 text-center sm:text-left">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">Total Borrowers</p>
            <p className="mt-1 font-display text-lg sm:text-2xl font-bold">{loading ? "..." : customers.length}</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center sm:text-left">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">Active Loans</p>
            <p className="mt-1 font-display text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{loading ? "..." : activeCount}</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center sm:text-left">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">Closed / Settled</p>
            <p className="mt-1 font-display text-lg sm:text-2xl font-bold">{loading ? "..." : customers.filter(c => c.status === "closed").length}</p>
          </Card>
        </div>

        {/* Total Outstanding Card */}
        <Card className="p-4 border-primary/40 bg-primary/5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Total Outstanding Balance</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-primary">{loading ? "..." : inr(totalOutstanding)}</p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs hidden sm:inline-flex">
            All Active Borrowers
          </Badge>
        </Card>
      </div>

      {/* 1. Current Week Activity & Configured Collection Lines Card */}
      <Card className="p-4 bg-card border-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Current Week Activity & Configured Lines</h3>
                <Badge variant={workspace?.subscription_plan === "premium" ? "default" : "secondary"} className="capitalize text-[10px]">
                  {lines.length} Line{lines.length !== 1 ? "s" : ""} Configured
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                View your active collection routes, day time slots (Morning 1am–1pm / Afternoon 1pm–12am), and weekly borrower schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedPortion} onValueChange={setSelectedPortion}>
              <SelectTrigger className="h-8 text-xs w-40 bg-background">
                <SelectValue placeholder="All Time Slots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time Slots</SelectItem>
                <SelectItem value="morning">🌅 Morning (1am–1pm)</SelectItem>
                <SelectItem value="afternoon">🌆 Afternoon (1pm–12am)</SelectItem>
                <SelectItem value="both">☀️ Full Day</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLineToEdit(null);
                setIsLineModalOpen(true);
              }}
              className="h-8 px-2.5 text-xs font-semibold gap-1 bg-background"
            >
              <Plus className="size-3.5 text-primary" /> Manage / Add Line
            </Button>
          </div>
        </div>

        {/* Lines & Assigned Portions Overview Grid */}
        {lines.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 space-y-3 my-2">
            <div className="size-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="size-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-base text-foreground">No Collection Lines Configured Yet</h3>
              <p className="text-xs text-muted-foreground">
                Set up your market collection routes (lines), operating days, and time slot portions (Morning 1am–1pm / Afternoon 1pm–12am) to organize your borrowers.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setLineToEdit(null);
                setIsLineModalOpen(true);
              }}
              className="gap-1.5 font-bold shadow-md"
              size="sm"
            >
              <Plus className="size-4" /> Set Up Your First Collection Line
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {lines.map((ln) => (
              <div
                key={ln.public_id}
                onClick={() => {
                  const nextLine = selectedLine === ln.public_id ? "all" : ln.public_id;
                  setSelectedLine(nextLine);
                  setSelectedDay("all");
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                  selectedLine === ln.public_id
                    ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                    : "bg-muted/30 hover:bg-muted/60 border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" /> {ln.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30 font-bold">
                      <Users className="size-3" /> {ln.customers_count ?? 0} Borrower{(ln.customers_count ?? 0) !== 1 ? "s" : ""}
                    </Badge>
                    {ln.area && <Badge variant="outline" className="text-[10px] font-normal">{ln.area}</Badge>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {ln.day_schedules?.map((sched) => (
                    <Badge
                      key={sched.day_of_week}
                      variant="secondary"
                      className="text-[10px] capitalize px-1.5 py-0.5 font-medium border"
                    >
                      {sched.day_of_week.slice(0, 3)}: {sched.portion === "morning" ? "🌅 Morn" : sched.portion === "afternoon" ? "🌆 Aft" : "☀️ Full"}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assigned Route Days & Time Slots of Selected Line */}
        <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            {selectedLine === "all" ? "All Route Schedules:" : "Assigned Days for Selected Line:"}
          </span>
          <button
            type="button"
            onClick={() => setSelectedDay("all")}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
              selectedDay === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {selectedLine === "all" ? "All Days (All Routes)" : "All Days in this Route"}
          </button>

          {(() => {
            const currentLineObj = lines.find((l) => l.public_id === selectedLine);
            const scheds = selectedLine === "all"
              ? lines.flatMap((l) => l.day_schedules || [])
              : currentLineObj?.day_schedules || [];

            if (scheds.length === 0) {
              return <span className="text-xs text-muted-foreground italic">No assigned days for this route line.</span>;
            }

            return scheds.map((sched, idx) => {
              const isSelected = selectedDay === sched.day_of_week.toLowerCase();
              const portionLabel =
                sched.portion === "morning"
                  ? "🌅 Morning (1am–1pm)"
                  : sched.portion === "afternoon"
                  ? "🌆 Afternoon (1pm–12am)"
                  : "☀️ Full Day";

              return (
                <button
                  key={`${sched.day_of_week}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? "all" : sched.day_of_week.toLowerCase())}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 capitalize ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  <CheckCircle2 className={`size-3 ${isSelected ? "text-primary-foreground" : "text-emerald-500"}`} />
                  <span>{sched.day_of_week}</span>
                  <span className={`text-[10px] px-1 rounded ${isSelected ? "bg-primary-foreground/20 text-white" : "bg-muted text-muted-foreground"}`}>
                    {portionLabel}
                  </span>
                </button>
              );
            });
          })()}
        </div>
      </Card>

      <LineSetupDialog
        open={isLineModalOpen}
        onOpenChange={setIsLineModalOpen}
        lineToEdit={lineToEdit}
        onSuccess={() => {
          loadLines();
          loadCustomers();
        }}
      />

      {/* 2. Customer List Header & Action Bar */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, code or phone…" className="pl-9 h-9 text-xs sm:text-sm" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36 h-9 text-xs sm:text-sm">
                <Filter className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 px-3 text-xs sm:text-sm">
              <Download className="size-3.5 mr-1" /> Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchModalOpen(true)}
              className="h-9 px-3 text-xs sm:text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-semibold dark:bg-emerald-950 dark:text-emerald-300"
            >
              <ImageIcon className="size-3.5 mr-1" /> Passbooks
            </Button>

            {/* Locked vs Unlocked Add Customer Button */}
            {!isDaysSaved ? (
              <Button size="sm" variant="secondary" className="h-9 px-3 text-xs sm:text-sm cursor-not-allowed opacity-75" disabled title="Save your collection days first to unlock adding customers.">
                <Lock className="size-3.5 mr-1.5 text-amber-600" /> Save Days First
              </Button>
            ) : (
              <NewCustomerModal
                onSuccess={(createdDay) => {
                  if (createdDay && selectedDay !== "all" && selectedDay !== createdDay) {
                    setSelectedDay(createdDay);
                  } else {
                    loadCustomers();
                  }
                }}
                open={isNewDialogOpen}
                setOpen={setIsNewDialogOpen}
                configuredDays={configuredDays}
                defaultDay={selectedDay !== "all" ? selectedDay : configuredDays[0] || "monday"}
              />
            )}
          </div>
        </div>

        {/* Mobile View: Individual Cards */}
        <div className="block md:hidden p-4 space-y-3">
          {!isDaysSaved ? (
            <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
              <Lock className="size-8 text-amber-500/80 mx-auto" />
              <p className="font-bold text-sm text-foreground">Collection Days Not Saved</p>
              <p>Please select and save your collection day(s) in the top card above to unlock adding customers.</p>
            </div>
          ) : loading ? (
            <p className="text-center py-8 text-xs text-muted-foreground">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              No customers found for {selectedDay === "all" ? "any day" : selectedDay}. Click "Add Customer" to assign a new borrower.
            </p>
          ) : (
            customers.map((c) => (
              <div key={c.public_id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {c.sequence_number && (
                        <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                          #{c.sequence_number}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-foreground">{c.full_name}</h4>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {c.customer_code} • {c.mobile_number}
                      {c.start_date && (
                        <span className="ml-1 text-emerald-700 dark:text-emerald-400 font-semibold">• Disbursed: {formatDate(c.start_date)}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="font-mono text-[10px] capitalize bg-primary/5 text-primary border-primary/20">
                      {c.collection_day || "monday"}
                    </Badge>
                    <Badge variant="outline" className={c.status === "active" ? "bg-emerald-500/15 text-emerald-700 capitalize text-[10px]" : "capitalize text-[10px]"}>
                      {c.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <p className="text-[10px] text-muted-foreground font-medium">Principal</p>
                    <p className="font-semibold text-foreground mt-0.5">{inr(c.loan_amount)}</p>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <p className="text-[10px] text-muted-foreground font-medium">Total Due</p>
                    <p className="font-semibold text-foreground mt-0.5">{inr(c.total_due)}</p>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <p className="text-[10px] text-primary font-medium">Outstanding</p>
                    <p className="font-bold text-primary mt-0.5">{inr(c.outstanding_balance)}</p>
                  </div>
                </div>

                {/* Struck Installment Passbook Grid */}
                <InstallmentPassbookGrid
                  total={c.total_installments || 20}
                  paid={c.installments_paid_count || 0}
                  skipped={c.skipped_installments_count || 0}
                  outstanding={c.outstanding_balance}
                  onExtend={() => setExtendingCustomer(c)}
                />

                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingCustomer(c)}
                    className="h-8 px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye className="size-3.5 mr-1" /> View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReassigningCustomer(c)}
                    className="h-8 px-2.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1"
                  >
                    <RefreshCw className="size-3.5" /> Re-assign Route
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCustomer(c)}
                    className="h-8 px-3 text-xs font-semibold"
                  >
                    <Edit3 className="size-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingCustomer(c)}
                    className="h-8 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Code & Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Disbursal Date</TableHead>
                <TableHead>Collection Day & Line Route</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead className="min-w-[220px]">Installment Struck Passbook</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isDaysSaved ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Lock className="size-8 text-amber-500/80" />
                      <p className="font-bold text-sm text-foreground">Collection Days Not Saved</p>
                      <p>Please select and save your operational collection day(s) in the top card above to unlock adding customers and managing loans.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : loading ? (
                <TableSkeletonRows rows={5} columns={10} />
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-xs text-muted-foreground">
                    No customers found for {selectedDay === "all" ? "any day" : selectedDay}. Click "Add Customer" to assign a new borrower.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.public_id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1.5">
                          {c.sequence_number && (
                            <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                              #{c.sequence_number}
                            </span>
                          )}
                          <p className="font-semibold text-sm">{c.full_name}</p>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{c.customer_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.mobile_number}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                      {formatDate(c.start_date)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <Badge variant="outline" className="font-mono text-[11px] capitalize bg-primary/5 text-primary border-primary/20">
                          {c.collection_day || "monday"}
                        </Badge>
                        {c.line_name && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3 text-primary shrink-0" /> {c.line_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{inr(c.loan_amount)}</TableCell>
                    <TableCell>{inr(c.total_due)}</TableCell>
                    <TableCell className="font-bold text-primary">{inr(c.outstanding_balance)}</TableCell>
                    <TableCell className="py-2 min-w-[220px]">
                      <InstallmentPassbookGrid
                        total={c.total_installments || 20}
                        paid={c.installments_paid_count || 0}
                        skipped={c.skipped_installments_count || 0}
                        outstanding={c.outstanding_balance}
                        onExtend={() => setExtendingCustomer(c)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.status === "active" ? "bg-emerald-500/15 text-emerald-700 capitalize" : "capitalize"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReassigningCustomer(c)}
                          className="h-8 px-2 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary gap-1"
                          title="Re-assign Route Line / Day / Time Slot"
                        >
                          <RefreshCw className="size-3.5" /> Re-assign
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingCustomer(c)}
                          className="h-8 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="size-3.5 mr-1" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCustomer(c)}
                          className="h-8 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit3 className="size-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCustomer(c)}
                          className="h-8 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Re-assign Route Line & Day Portion Modal */}
      <ReassignRouteDialog
        open={Boolean(reassigningCustomer)}
        onOpenChange={(v) => !v && setReassigningCustomer(null)}
        customer={reassigningCustomer}
        lines={lines}
        onSuccess={() => {
          loadCustomers();
          loadLines();
        }}
      />

      {/* Borrower Profile & Payment Details Modal */}
      {viewingCustomer && (
        <BorrowerProfileDetailsModal
          customer={viewingCustomer}
          open={Boolean(viewingCustomer)}
          setOpen={(v) => !v && setViewingCustomer(null)}
        />
      )}

      {/* Batch Passbooks Multi-Select Modal */}
      <BatchPassbooksModal
        open={isBatchModalOpen}
        setOpen={setIsBatchModalOpen}
        allCustomers={customers}
        workspaceName={workspace?.name}
      />

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          open={Boolean(editingCustomer)}
          setOpen={(v) => !v && setEditingCustomer(null)}
          configuredDays={configuredDays}
          onSuccess={() => {
            setEditingCustomer(null);
            loadCustomers();
          }}
          onDeleteRequest={(cust) => {
            setEditingCustomer(null);
            setDeletingCustomer(cust);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <Dialog open={Boolean(deletingCustomer)} onOpenChange={(v) => !v && setDeletingCustomer(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="size-5" /> Delete Borrower Profile
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="font-semibold text-foreground">
                Are you sure you want to delete borrower <span className="text-primary font-bold">{deletingCustomer.full_name}</span> ({deletingCustomer.customer_code})?
              </p>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive space-y-1">
                <p className="font-bold">⚠️ Warning: Permanent Action</p>
                <p>This will permanently delete this borrower and their loan records from your workspace database.</p>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeletingCustomer(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteCustomer} disabled={deleting}>
                {deleting ? "Deleting..." : "Permanently Delete Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Extend Installments Dialog */}
      {extendingCustomer && (
        <ExtendInstallmentsDialog
          open={Boolean(extendingCustomer)}
          onOpenChange={(v) => !v && setExtendingCustomer(null)}
          customerPublicId={extendingCustomer.public_id}
          customerName={extendingCustomer.full_name}
          currentTotalInstallments={extendingCustomer.total_installments || 20}
          installmentsPaidCount={extendingCustomer.installments_paid_count || 0}
          outstandingBalance={extendingCustomer.outstanding_balance}
          installmentAmount={extendingCustomer.installment_amount}
          onSuccess={loadCustomers}
        />
      )}
    </div>
  );
}

function NewCustomerModal({
  onSuccess,
  open,
  setOpen,
  configuredDays = ["monday"],
  defaultDay = "monday",
  lines = [],
}: {
  onSuccess: (day?: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  configuredDays?: string[];
  defaultDay?: string;
  lines?: CollectionLine[];
}) {
  const [isExistingBorrower, setIsExistingBorrower] = useState(false);
  const [sequenceNumber, setSequenceNumber] = useState<number | "">("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [loanAmount, setLoanAmount] = useState(50000);
  const [disbursedAmount, setDisbursedAmount] = useState(48000);
  const [interestRate, setInterestRate] = useState(20);
  const [collectionDay, setCollectionDay] = useState(defaultDay);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [selectedPortion, setSelectedPortion] = useState<"morning" | "afternoon" | "both">("both");

  // Derived target line object and allowed days
  const selectedLineObj = lines.find((l) => l.public_id === selectedLineId);
  const allowedDaysForSelectedLine = ALL_DAYS_LIST.filter((dObj) => {
    if (!selectedLineObj || !selectedLineObj.day_schedules || selectedLineObj.day_schedules.length === 0) {
      return configuredDays.includes(dObj.key);
    }
    return selectedLineObj.day_schedules.some((s) => s.day_of_week.toLowerCase() === dObj.key);
  });

  // When selected line changes, ensure valid day
  useEffect(() => {
    if (allowedDaysForSelectedLine.length > 0) {
      const dayExists = allowedDaysForSelectedLine.some((d) => d.key === collectionDay.toLowerCase());
      if (!dayExists) {
        setCollectionDay(allowedDaysForSelectedLine[0].key);
      }
    }
  }, [selectedLineId]);

  // Auto-set portion for selected day on chosen line
  useEffect(() => {
    const sched = selectedLineObj?.day_schedules?.find(
      (s) => s.day_of_week.toLowerCase() === collectionDay.toLowerCase()
    );
    if (sched?.portion) {
      setSelectedPortion(sched.portion as any);
    }
  }, [selectedLineId, collectionDay]);

  // Installments state
  const [totalInstallmentsInput, setTotalInstallmentsInput] = useState(100);
  const [installmentsPaidCount, setInstallmentsPaidCount] = useState(20);
  const [remainingInstallmentsCount, setRemainingInstallmentsCount] = useState(80);
  const [amountAlreadyCollected, setAmountAlreadyCollected] = useState(12000);
  const [customInstallmentAmount, setCustomInstallmentAmount] = useState<string>("");
  const [isCustomInstallmentEdited, setIsCustomInstallmentEdited] = useState(false);

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [frequencies, setFrequencies] = useState<MasterItem[]>([]);
  const [interestTypes, setInterestTypes] = useState<MasterItem[]>([]);
  const [selectedFreq, setSelectedFreq] = useState<number>(1);
  const [selectedInterestType, setSelectedInterestType] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setIsExistingBorrower(false);
    setSequenceNumber("");
    setFullName("");
    setMobileNumber("");
    setLoanAmount(50000);
    setDisbursedAmount(48000);
    setInterestRate(20);
    setCollectionDay(configuredDays.includes(defaultDay) ? defaultDay : (configuredDays[0] || "monday"));
    setTotalInstallmentsInput(100);
    setInstallmentsPaidCount(20);
    setRemainingInstallmentsCount(80);
    setAmountAlreadyCollected(12000);
    setCustomInstallmentAmount("");
    setIsCustomInstallmentEdited(false);
    setStartDate(new Date().toISOString().split("T")[0]);
    setError(null);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, defaultDay, configuredDays]);

  useEffect(() => {
    async function loadMasters() {
      try {
        const [freqList, interestList] = await Promise.all([
          mastersService.getCollectionFrequencies(),
          mastersService.getInterestTypes(),
        ]);
        setFrequencies(freqList);
        setInterestTypes(interestList);
        if (freqList[0]) setSelectedFreq(freqList[0].id);
        if (interestList[0]) setSelectedInterestType(interestList[0].id);
      } catch (err) {
        console.error("Master data fetch error:", err);
      }
    }
    if (open) loadMasters();
  }, [open]);

  // Dynamic Calculations
  const totalPayable = loanAmount + (loanAmount * interestRate) / 100;

  const effectiveTotalInstallments = isExistingBorrower
    ? installmentsPaidCount + remainingInstallmentsCount
    : totalInstallmentsInput;

  const calculatedPerInstallment = effectiveTotalInstallments > 0 ? totalPayable / effectiveTotalInstallments : 0;

  // Auto-fill customInstallmentAmount when loan details change unless manually edited
  useEffect(() => {
    if (!isCustomInstallmentEdited) {
      if (calculatedPerInstallment > 0) {
        setCustomInstallmentAmount(Math.round(calculatedPerInstallment).toString());
      } else {
        setCustomInstallmentAmount("");
      }
    }
  }, [calculatedPerInstallment, isCustomInstallmentEdited]);

  const effectivePerInstallment =
    customInstallmentAmount.trim() !== "" && !isNaN(Number(customInstallmentAmount))
      ? Number(customInstallmentAmount)
      : Math.round(calculatedPerInstallment * 100) / 100;

  const remainingOutstanding = isExistingBorrower
    ? Math.max(0, totalPayable - amountAlreadyCollected)
    : totalPayable;
  const nextDueInstallmentNo = isExistingBorrower ? installmentsPaidCount + 1 : 1;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Borrower Name Validation
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setError("Please enter borrower's full name (minimum 3 characters).");
      return;
    }

    // 2. Mobile Number Validation (Indian 10-digit format starting with 6-9)
    const mobileVal = validateMobileNumber(mobileNumber);
    if (!mobileVal.isValid) {
      setError(mobileVal.error || "Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9 (e.g. 9876543210).");
      return;
    }
    const cleanMobile = mobileVal.cleaned;

    // 3. Principal & Disbursed Loan Validation
    if (!loanAmount || loanAmount <= 0) {
      setError("Principal loan amount must be greater than ₹0.");
      return;
    }
    if (disbursedAmount < 0) {
      setError("Disbursed amount cannot be negative.");
      return;
    }
    if (interestRate < 0) {
      setError("Interest rate cannot be negative.");
      return;
    }

    // 4. Installments & Frequency Validation
    if (!selectedFreq) {
      setError("Please select a collection frequency.");
      return;
    }
    if (!selectedInterestType) {
      setError("Please select an interest calculation type.");
      return;
    }
    if (!isExistingBorrower && (!totalInstallmentsInput || totalInstallmentsInput < 1)) {
      setError("Total installments must be at least 1.");
      return;
    }
    if (isExistingBorrower && remainingInstallmentsCount < 1) {
      setError("Remaining installments count must be at least 1.");
      return;
    }

    setSubmitting(true);
    const fullMobile = `+91${cleanMobile}`;

    try {
      await guestWorkspaceService.createCustomer({
        sequence_number: sequenceNumber !== "" ? Number(sequenceNumber) : null,
        full_name: trimmedName,
        mobile_number: fullMobile,
        loan_amount: loanAmount,
        disbursed_amount: disbursedAmount,
        interest_rate: interestRate,
        collection_frequency: selectedFreq,
        collection_day: collectionDay,
        line: selectedLineId || undefined,
        portion: selectedPortion,
        interest_type: selectedInterestType,
        start_date: startDate,
        is_existing_borrower: isExistingBorrower,
        total_installments: effectiveTotalInstallments,
        installments_paid_count: isExistingBorrower ? installmentsPaidCount : 0,
        remaining_installments_count: isExistingBorrower ? remainingInstallmentsCount : effectiveTotalInstallments,
        amount_already_collected: isExistingBorrower ? amountAlreadyCollected : 0,
        installment_amount: effectivePerInstallment,
      });
      resetForm();
      setOpen(false);
      onSuccess(collectionDay);
    } catch (err: any) {
      setError(err.message || "Failed to create customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (!v) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4 mr-1" /> Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" /> Register Borrower & Issue Loan
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter borrower details and loan parameters to register a new customer in your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* 1. Borrower Status Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Borrower Category</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg border border-border">
              <button
                type="button"
                className={`py-2 px-3 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${!isExistingBorrower ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setIsExistingBorrower(false)}
              >
                <UserCheck className="size-3.5 text-emerald-600" /> New Borrower (Fresh Loan)
              </button>
              <button
                type="button"
                className={`py-2 px-3 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${isExistingBorrower ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setIsExistingBorrower(true)}
              >
                <Sparkles className="size-3.5" /> Existing Borrower (Ongoing Loan)
              </button>
            </div>
          </div>

          {/* Borrower Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">Seq No. / ID</label>
              <Input
                type="number"
                className="mt-1 font-mono font-bold"
                value={sequenceNumber}
                onChange={(e) => setSequenceNumber(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Borrower Full Name *</label>
              <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="e.g. Ramesh Kumar" />
            </div>
            <div>
              <label className="text-xs font-medium">Mobile Number *</label>
              <PhoneInput
                className="mt-1"
                value={mobileNumber.replace(/^\+91/, "")}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
          </div>

          {/* Loan Principal & Disbursed */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Principal Amount (₹) *</label>
              <Input type="number" className="mt-1" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} required />
            </div>
            <div>
              <label className="text-xs font-medium">Disbursed Amount (₹) *</label>
              <Input type="number" className="mt-1" value={disbursedAmount} onChange={(e) => setDisbursedAmount(Number(e.target.value))} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Interest Rate (%) *</label>
              <Input type="number" className="mt-1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} required />
            </div>
            <div>
              <label className="text-xs font-medium">Start Date *</label>
              <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
          </div>

          {/* Collection Line & Time Slot Portion */}
          {lines.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Collection Line (Route)</label>
                <Select value={selectedLineId} onValueChange={setSelectedLineId}>
                  <SelectTrigger className="mt-1 font-medium"><SelectValue placeholder="Select Route Line" /></SelectTrigger>
                  <SelectContent>
                    {lines.map((ln) => (
                      <SelectItem key={ln.public_id} value={ln.public_id}>
                        {ln.name} {ln.area ? `(${ln.area})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Day Time Slot Portion</label>
                <Select value={selectedPortion} onValueChange={(v) => setSelectedPortion(v as any)}>
                  <SelectTrigger className="mt-1 font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const sched = selectedLineObj?.day_schedules?.find(
                        (s) => s.day_of_week.toLowerCase() === collectionDay.toLowerCase()
                      );
                      const confPortion = sched?.portion || "both";
                      if (confPortion === "morning") {
                        return <SelectItem value="morning">🌅 Morning Only (1am–1pm)</SelectItem>;
                      }
                      if (confPortion === "afternoon") {
                        return <SelectItem value="afternoon">🌆 Afternoon Only (1pm–12am)</SelectItem>;
                      }
                      return (
                        <>
                          <SelectItem value="morning">🌅 Morning (1am–1pm)</SelectItem>
                          <SelectItem value="afternoon">🌆 Afternoon (1pm–12am)</SelectItem>
                          <SelectItem value="both">☀️ Full Day</SelectItem>
                        </>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Assigned Collection Day *</label>
              <Select value={collectionDay} onValueChange={setCollectionDay}>
                <SelectTrigger className="mt-1 font-semibold text-primary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedDaysForSelectedLine.map((dayObj) => (
                    <SelectItem key={dayObj.key} value={dayObj.key} className="capitalize font-medium">
                      {dayObj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Collection Frequency</label>
              <Select value={selectedFreq.toString()} onValueChange={(v) => setSelectedFreq(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {frequencies.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2. Installments Entry Section */}
          {!isExistingBorrower ? (
            <div>
              <label className="text-xs font-semibold">Total Number of Installments *</label>
              <Input
                type="number"
                className="mt-1 font-mono"
                value={totalInstallmentsInput}
                onChange={(e) => setTotalInstallmentsInput(Number(e.target.value))}
                placeholder="e.g. 100 installments"
                required
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Enter total number of scheduled payments/days for this fresh loan.</p>
            </div>
          ) : (
            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-primary">
                <span className="flex items-center gap-1.5"><Sparkles className="size-4" /> Ongoing Loan Prior History</span>
                <Badge variant="outline" className="font-mono text-[10px]">Total: {effectiveTotalInstallments} Installments</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold">Paid Count *</label>
                  <Input
                    type="number"
                    className="mt-1 h-8 text-xs font-mono"
                    value={installmentsPaidCount}
                    onChange={(e) => setInstallmentsPaidCount(Number(e.target.value))}
                    placeholder="e.g. 20"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold">Remaining Count *</label>
                  <Input
                    type="number"
                    className="mt-1 h-8 text-xs font-mono"
                    value={remainingInstallmentsCount}
                    onChange={(e) => setRemainingInstallmentsCount(Number(e.target.value))}
                    placeholder="e.g. 80"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold">Already Collected (₹) *</label>
                  <Input
                    type="number"
                    className="mt-1 h-8 text-xs font-mono"
                    value={amountAlreadyCollected}
                    onChange={(e) => setAmountAlreadyCollected(Number(e.target.value))}
                    placeholder="e.g. 12000"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Editable Per Installment Amount */}
          <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1">
                <Edit3 className="size-3.5 text-primary" /> Estimated Per Installment Amount (₹) *
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Auto: {inr(calculatedPerInstallment)}
                </span>
                {isCustomInstallmentEdited && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] text-primary hover:bg-primary/10 font-bold"
                    onClick={() => {
                      setIsCustomInstallmentEdited(false);
                      setCustomInstallmentAmount(Math.round(calculatedPerInstallment).toString());
                    }}
                  >
                    Reset Auto
                  </Button>
                )}
              </div>
            </div>
            <Input
              type="number"
              step="any"
              min="0.01"
              className="font-mono font-bold text-primary h-9 text-xs sm:text-sm"
              value={customInstallmentAmount}
              onChange={(e) => {
                setIsCustomInstallmentEdited(true);
                setCustomInstallmentAmount(e.target.value);
              }}
              placeholder={`Auto: ₹${Math.round(calculatedPerInstallment)}`}
              required
            />
          </div>

          {/* 4. Automatic Schedule Calculation Box */}
          <div className="p-3 bg-muted/60 border border-border rounded-xl space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Calculator className="size-4 text-primary" /> Payment Schedule & Upcoming Installment Summary
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground pt-1">
              <div>Total Loan Payable: <span className="font-bold text-foreground font-mono">{inr(totalPayable)}</span></div>
              <div>Remaining Balance: <span className="font-bold text-primary font-mono">{inr(remainingOutstanding)}</span></div>
              <div>Effective Installment: <span className="font-bold text-foreground font-mono">{inr(effectivePerInstallment)}</span></div>
              <div>Upcoming Next Due: <span className="font-bold text-emerald-700 bg-emerald-500/15 px-1.5 py-0.5 rounded">Installment #{nextDueInstallmentNo}</span></div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : isExistingBorrower ? "Import Existing Borrower & Calculate Schedule" : "Create Customer & Issue Loan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCustomerModal({
  customer,
  open,
  setOpen,
  configuredDays = ["monday"],
  onSuccess,
  onDeleteRequest,
}: {
  customer: Customer;
  open: boolean;
  setOpen: (v: boolean) => void;
  configuredDays?: string[];
  onSuccess: () => void;
  onDeleteRequest: (c: Customer) => void;
}) {
  const [sequenceNumber, setSequenceNumber] = useState<number | "">(customer.sequence_number ?? "");
  const [fullName, setFullName] = useState(customer.full_name || "");
  const [mobileNumber, setMobileNumber] = useState((customer.mobile_number || "").replace(/^\+91/, ""));
  const [loanAmount, setLoanAmount] = useState(customer.loan_amount || 0);
  const [disbursedAmount, setDisbursedAmount] = useState(customer.disbursed_amount || 0);
  const [interestRate, setInterestRate] = useState(customer.interest_rate || 0);
  const [collectionDay, setCollectionDay] = useState(customer.collection_day || "monday");
  const [status, setStatus] = useState(customer.status || "active");

  const [installmentsPaidCount, setInstallmentsPaidCount] = useState(customer.installments_paid_count || 0);
  const [remainingInstallmentsCount, setRemainingInstallmentsCount] = useState(customer.remaining_installments_count || 1);
  const [amountAlreadyCollected, setAmountAlreadyCollected] = useState(customer.amount_already_collected || 0);
  const [installmentAmount, setInstallmentAmount] = useState(customer.installment_amount || 0);
  const [notes, setNotes] = useState(customer.notes || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fullMobile = mobileNumber.startsWith("+91") ? mobileNumber : `+91${mobileNumber.replace(/^\+91/, "").trim()}`;
    const totalInstallments = installmentsPaidCount + remainingInstallmentsCount;

    try {
      await guestWorkspaceService.updateCustomer(customer.public_id, {
        sequence_number: sequenceNumber !== "" ? Number(sequenceNumber) : null,
        full_name: fullName,
        mobile_number: fullMobile,
        loan_amount: loanAmount,
        disbursed_amount: disbursedAmount,
        interest_rate: interestRate,
        collection_day: collectionDay,
        status: status,
        total_installments: totalInstallments,
        installments_paid_count: installmentsPaidCount,
        remaining_installments_count: remainingInstallmentsCount,
        amount_already_collected: amountAlreadyCollected,
        installment_amount: installmentAmount,
        notes: notes,
      });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5 text-primary" /> Edit Customer & Loan Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Borrower Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">Seq No. / ID</label>
              <Input
                type="number"
                className="mt-1 font-mono font-bold"
                value={sequenceNumber}
                onChange={(e) => setSequenceNumber(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Borrower Full Name *</label>
              <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium">Mobile Number *</label>
              <PhoneInput className="mt-1" value={mobileNumber.replace(/^\+91/, "")} onChange={(e) => setMobileNumber(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Assigned Collection Day *</label>
              <Select value={collectionDay} onValueChange={setCollectionDay}>
                <SelectTrigger className="mt-1 font-semibold text-primary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {configuredDays.map((dKey) => {
                    const dayObj = ALL_DAYS_LIST.find((d) => d.key === dKey);
                    return (
                      <SelectItem key={dKey} value={dKey} className="capitalize font-medium">
                        {dayObj?.label || dKey}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Loan Status *</label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed / Settled</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financial Amounts */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium">Principal (₹) *</label>
              <Input type="number" className="mt-1 text-xs" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} required />
            </div>
            <div>
              <label className="text-xs font-medium">Disbursed (₹) *</label>
              <Input type="number" className="mt-1 text-xs" value={disbursedAmount} onChange={(e) => setDisbursedAmount(Number(e.target.value))} required />
            </div>
            <div>
              <label className="text-xs font-medium">Interest (%) *</label>
              <Input type="number" className="mt-1 text-xs" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} required />
            </div>
          </div>

          {/* Installments & Collections */}
          <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-3">
            <div className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Installment & Progress Counters</span>
              <span className="font-mono text-[11px] text-muted-foreground">Total: {installmentsPaidCount + remainingInstallmentsCount} Installments</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium">Paid Count</label>
                <Input type="number" className="mt-1 h-8 text-xs font-mono" value={installmentsPaidCount} onChange={(e) => setInstallmentsPaidCount(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-[11px] font-medium">Remaining Count</label>
                <Input type="number" className="mt-1 h-8 text-xs font-mono" value={remainingInstallmentsCount} onChange={(e) => setRemainingInstallmentsCount(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-[11px] font-medium">Collected (₹)</label>
                <Input type="number" className="mt-1 h-8 text-xs font-mono" value={amountAlreadyCollected} onChange={(e) => setAmountAlreadyCollected(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold">Estimated Per Installment Amount (₹) *</label>
              <Input type="number" step="any" min="0.01" className="mt-1 h-9 font-mono font-bold text-primary text-xs" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value ? Number(e.target.value) : 0)} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Notes / Remarks</label>
            <Input className="mt-1 text-xs" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any custom notes or loan history context" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDeleteRequest(customer)}
            >
              <Trash2 className="size-4 mr-1" /> Delete Customer
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Customer Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BatchPassbooksModal({
  open,
  setOpen,
  allCustomers,
  workspaceName,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  allCustomers: Customer[];
  workspaceName?: string;
}) {
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const filtered = allCustomers.filter((c) => {
    const matchesQuery =
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_code?.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile_number?.includes(search);
    const matchesDay = dayFilter === "all" || (c.collection_day || "").toLowerCase() === dayFilter.toLowerCase();
    return matchesQuery && matchesDay;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.public_id)));
    }
  };

  const toggleCustomer = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleGenerate = async () => {
    const selectedCustomers = allCustomers.filter((c) => selectedIds.has(c.public_id));
    if (selectedCustomers.length === 0) return;

    setGenerating(true);
    try {
      await generateBatchPassbookPages(selectedCustomers, workspaceName);
      setOpen(false);
    } catch (err) {
      console.error("Failed to generate batch passbooks:", err);
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = selectedIds.size;
  const pageCount = Math.ceil(selectedCount / 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-5 text-emerald-600" /> Batch Customer Passbook Images (A4 Pages)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select customers to export. Each A4 page fits <span className="font-bold text-foreground">EXACTLY 2 Customer Passbooks</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name, code or phone..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="tuesday">Tuesday</SelectItem>
              <SelectItem value="wednesday">Wednesday</SelectItem>
              <SelectItem value="thursday">Thursday</SelectItem>
              <SelectItem value="friday">Friday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Select All & Summary Header */}
        <div className="flex items-center justify-between py-2 px-1 border-b border-border text-xs">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onCheckedChange={toggleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="font-semibold cursor-pointer">
              Select All ({filtered.length})
            </label>
          </div>

          <Badge variant="outline" className="font-mono text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
            {selectedCount} Selected ({pageCount} A4 {pageCount === 1 ? "Page" : "Pages"})
          </Badge>
        </div>

        {/* Customer Checkbox List */}
        <div className="flex-1 max-h-72 overflow-y-auto space-y-1 py-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No matching customers found.</p>
          ) : (
            filtered.map((c) => {
              const isChecked = selectedIds.has(c.public_id);
              return (
                <div
                  key={c.public_id}
                  onClick={() => toggleCustomer(c.public_id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${isChecked
                    ? "bg-emerald-50/60 border-emerald-300 dark:bg-emerald-950/40"
                    : "bg-card border-border/60 hover:bg-muted/40"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onCheckedChange={() => toggleCustomer(c.public_id)} />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{c.full_name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">({c.customer_code})</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{c.mobile_number}</span>
                        <span>·</span>
                        <span className="capitalize">{c.collection_day || "monday"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px]">
                    <div className="font-bold text-foreground">{inr(c.loan_amount)}</div>
                    <div className="text-emerald-600 font-semibold">{inr(c.outstanding_balance)} left</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={selectedCount === 0 || generating}
            onClick={handleGenerate}
            className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
          >
            {generating ? "Generating A4 Pages..." : `Generate ${pageCount} A4 ${pageCount === 1 ? "Page" : "Pages"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
