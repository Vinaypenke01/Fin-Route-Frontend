import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, UserPlus, Download, Filter, Calculator, Sparkles, UserCheck, Edit3, Calendar, CheckCircle2, Lock, Save, ShieldAlert, Trash2, Eye, MessageSquare } from "lucide-react";
import { inr } from "@/lib/utils";
import { GuestPlanUsage } from "@/components/guest-plan-usage";
import { BorrowerProfileDetailsModal } from "@/components/borrower-profile-modal";
import { guestWorkspaceService, Customer, WorkspaceData, Collection } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";

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

function InstallmentPassbookGrid({ total = 20, paid = 0 }: { total?: number; paid?: number }) {
  const safeTotal = Math.min(Math.max(total || 1, 1), 100);
  const safePaid = Math.min(paid || 0, safeTotal);
  const remaining = safeTotal - safePaid;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="text-muted-foreground font-semibold">
          Progress: <span className="text-emerald-700 font-bold">{safePaid} Struck Paid</span> / <span className="text-foreground">{safeTotal} Total</span>
        </span>
        <Badge variant="outline" className="font-mono text-[10px]">
          {remaining} Remaining
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-muted/40 rounded-lg border border-border/60">
        {Array.from({ length: safeTotal }, (_, i) => {
          const num = i + 1;
          const isPaid = num <= safePaid;
          return (
            <div
              key={num}
              title={isPaid ? `Installment #${num}: PAID (Struck Through)` : `Installment #${num}: Pending`}
              className={`size-6 rounded text-[10px] font-mono font-bold flex items-center justify-center border transition-all ${isPaid
                  ? "bg-emerald-600 text-white border-emerald-700 line-through opacity-85 shadow-xs"
                  : "bg-background text-muted-foreground border-border/80"
                }`}
            >
              {isPaid ? <s>{num}</s> : num}
            </div>
          );
        })}
      </div>
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
  const [deleting, setDeleting] = useState(false);

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
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [q, status, selectedDay]);

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

      {/* 1. Collection Days Plan Configuration Card */}
      <Card className={`p-5 transition-all border-2 ${!isDaysSaved ? "border-amber-500/50 bg-amber-500/5 shadow-md" : "border-border bg-card"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${!isDaysSaved ? "bg-amber-500 text-white" : "bg-primary/10 text-primary"}`}>
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Workspace Collection Days Configuration</h3>
                <Badge variant={workspace?.subscription_plan === "premium" ? "default" : "secondary"} className="capitalize text-[10px]">
                  {workspace?.subscription_plan || "Free"} Plan ({maxAllowedDays} Day{maxAllowedDays > 1 ? "s" : ""} Max)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!isDaysSaved
                  ? "Select and save your weekly collection day(s) based on your plan to unlock adding customers."
                  : `Your workspace is configured for ${configuredDays.length} collection day(s).`}
              </p>
            </div>
          </div>

          {isDaysSaved && !editingDays && (
            <Button variant="outline" size="sm" onClick={handleReconfigureClick}>
              <Edit3 className="size-3.5 mr-1" /> Re-configure Days
            </Button>
          )}
        </div>

        {daysError && (
          <div className="mt-3 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" /> {daysError}
          </div>
        )}

        {/* Days Configuration UI */}
        {editingDays ? (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Select your collection day(s) ({draftDays.length}/{maxAllowedDays} selected):
              </span>
              {workspace?.subscription_plan === "free" && (
                <span className="text-amber-600 font-medium text-[11px]">
                  Free plan allows 1 collection day. Upgrade to Premium for all 7 days!
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ALL_DAYS_LIST.map((d) => {
                const isSelected = draftDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleToggleDraftDay(d.key)}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.03]"
                        : "bg-background text-muted-foreground hover:text-foreground border-border hover:border-primary/40"
                      }`}
                  >
                    <span className={`size-2 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-muted-foreground/30"}`} />
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {isDaysSaved && (
                <Button variant="ghost" size="sm" onClick={() => setEditingDays(false)}>
                  Cancel
                </Button>
              )}
              <Button size="sm" onClick={handleSaveCollectionDays} disabled={savingDays}>
                <Save className="size-4 mr-1.5" />
                {savingDays ? "Saving..." : "Save Collection Days & Unlock Customers"}
              </Button>
            </div>
          </div>
        ) : (
          /* Saved Days Tab Selector */
          <div className="pt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay("all")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${selectedDay === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground hover:text-foreground border-border"
                  }`}
              >
                All Configured Days ({configuredDays.length})
              </button>

              {configuredDays.map((dKey) => {
                const dayObj = ALL_DAYS_LIST.find((d) => d.key === dKey);
                const isSelected = selectedDay === dKey;
                return (
                  <button
                    key={dKey}
                    type="button"
                    onClick={() => setSelectedDay(dKey)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 capitalize ${isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-muted-foreground hover:text-foreground border-border"
                      }`}
                  >
                    <CheckCircle2 className={`size-3.5 ${isSelected ? "text-primary-foreground" : "text-emerald-500"}`} />
                    {dayObj?.label || dKey}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* 2. Customer List Header & Action Bar */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, code or phone…" className="pl-9" />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="size-4 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="defaulted">Defaulted</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="size-4" /> Export
            </Button>

            {/* Locked vs Unlocked Add Customer Button */}
            {!isDaysSaved ? (
              <Button size="sm" variant="secondary" className="cursor-not-allowed opacity-75" disabled title="Save your collection days first to unlock adding customers.">
                <Lock className="size-4 mr-1.5 text-amber-600" /> Save Days First
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
                />

                <div className="flex items-center justify-end gap-2 pt-1">
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
                <TableHead>Collection Day</TableHead>
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
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-xs text-muted-foreground">
                    Loading customers...
                  </TableCell>
                </TableRow>
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
                      <Badge variant="outline" className="font-mono text-[11px] capitalize bg-primary/5 text-primary border-primary/20">
                        {c.collection_day || "monday"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{inr(c.loan_amount)}</TableCell>
                    <TableCell>{inr(c.total_due)}</TableCell>
                    <TableCell className="font-bold text-primary">{inr(c.outstanding_balance)}</TableCell>
                    <TableCell className="py-2 min-w-[220px]">
                      <InstallmentPassbookGrid
                        total={c.total_installments || 20}
                        paid={c.installments_paid_count || 0}
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

      {/* Borrower Profile & Payment Details Modal */}
      {viewingCustomer && (
        <BorrowerProfileDetailsModal
          customer={viewingCustomer}
          open={Boolean(viewingCustomer)}
          setOpen={(v) => !v && setViewingCustomer(null)}
        />
      )}

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
    </div>
  );
}

function NewCustomerModal({
  onSuccess,
  open,
  setOpen,
  configuredDays = ["monday"],
  defaultDay = "monday",
}: {
  onSuccess: (day?: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  configuredDays?: string[];
  defaultDay?: string;
}) {
  const [isExistingBorrower, setIsExistingBorrower] = useState(false);
  const [sequenceNumber, setSequenceNumber] = useState<number | "">("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [loanAmount, setLoanAmount] = useState(50000);
  const [disbursedAmount, setDisbursedAmount] = useState(48000);
  const [interestRate, setInterestRate] = useState(20);
  const [collectionDay, setCollectionDay] = useState(defaultDay);

  // Installments state
  const [totalInstallmentsInput, setTotalInstallmentsInput] = useState(100);
  const [installmentsPaidCount, setInstallmentsPaidCount] = useState(20);
  const [remainingInstallmentsCount, setRemainingInstallmentsCount] = useState(80);
  const [amountAlreadyCollected, setAmountAlreadyCollected] = useState(12000);
  const [customInstallmentAmount, setCustomInstallmentAmount] = useState<number | "">("");

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
  const effectivePerInstallment = customInstallmentAmount !== "" ? Number(customInstallmentAmount) : calculatedPerInstallment;

  const remainingOutstanding = isExistingBorrower
    ? Math.max(0, totalPayable - amountAlreadyCollected)
    : totalPayable;
  const nextDueInstallmentNo = isExistingBorrower ? installmentsPaidCount + 1 : 1;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fullMobile = mobileNumber.startsWith("+91") ? mobileNumber : `+91${mobileNumber.replace(/^\+91/, "").trim()}`;

    try {
      await guestWorkspaceService.createCustomer({
        sequence_number: sequenceNumber !== "" ? Number(sequenceNumber) : null,
        full_name: fullName,
        mobile_number: fullMobile,
        loan_amount: loanAmount,
        disbursed_amount: disbursedAmount,
        interest_rate: interestRate,
        collection_frequency: selectedFreq,
        collection_day: collectionDay,
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
              <PhoneInput className="mt-1" value={mobileNumber.replace(/^\+91/, "")} onChange={(e) => setMobileNumber(e.target.value)} required placeholder="9876543210" />
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
              <span className="text-[10px] font-mono text-muted-foreground">
                Auto-calculated: {inr(calculatedPerInstallment)}
              </span>
            </div>
            <Input
              type="number"
              className="font-mono font-bold text-primary h-9"
              value={customInstallmentAmount !== "" ? customInstallmentAmount : Math.round(calculatedPerInstallment)}
              onChange={(e) => setCustomInstallmentAmount(e.target.value ? Number(e.target.value) : "")}
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
              <Input type="number" className="mt-1 h-9 font-mono font-bold text-primary text-xs" value={installmentAmount} onChange={(e) => setInstallmentAmount(Number(e.target.value))} required />
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
