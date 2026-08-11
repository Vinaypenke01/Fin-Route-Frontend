import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Download, ListChecks, Calendar, CheckCircle2, Lock, Users, ArrowRight, Eye, Pencil, MapPin, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Collection, Customer, WorkspaceData, CollectionLine } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";
import { ExtendInstallmentsDialog } from "@/components/extend-installments-dialog";
import { DailyCashReconciliationCard } from "@/components/daily-cash-reconciliation-card";
import { LineSetupDialog } from "@/components/line-setup-dialog";
import { TableSkeletonRows, CardSkeleton } from "@/components/ui/skeleton-loaders";

export const Route = createFileRoute("/app/collections/")({
  head: () => ({ meta: [{ title: "Collections — FinRoute" }, { name: "description", content: "Digital collection register and route customer schedule." }] }),
  component: CollectionsPage,
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

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const today = getTodayStr();

export const formatFilterDate = (dStr: string) => {
  if (!dStr) return "All";
  if (dStr === today) return "Today";
  try {
    const [y, m, d] = dStr.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch {
    return dStr;
  }
};

export function buildHistoryStatuses(collections?: Collection[]): ("paid" | "skipped")[] {
  if (!collections || collections.length === 0) return [];
  const sorted = [...collections].sort((a, b) => {
    if (a.collection_date !== b.collection_date) {
      return a.collection_date.localeCompare(b.collection_date);
    }
    return String(a.receipt_number || a.public_id).localeCompare(String(b.receipt_number || b.public_id));
  });

  return sorted.map((c) => {
    const isSkipped =
      c.status_code === "skipped" ||
      (c.status_name && c.status_name.toLowerCase().includes("skipped")) ||
      Number(c.collected_amount || 0) === 0;
    return isSkipped ? "skipped" : "paid";
  });
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

      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-muted/40 rounded-lg border border-border/60">
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
              className={`size-6 rounded text-[10px] font-mono font-bold flex items-center justify-center border transition-all ${isPaid
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

function CollectionsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [configuredDays, setConfiguredDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("all");

  // Date Range Filtration
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [routeCustomers, setRouteCustomers] = useState<Customer[]>([]);
  const [loadingCollections, setLoadingCollections] = useState<boolean>(true);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [q, setQ] = useState("");

  const [markingPaidCustomer, setMarkingPaidCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [extendingCustomer, setExtendingCustomer] = useState<Customer | null>(null);

  const isSelectedDateToday = selectedDate === today;

  const handlePresetToday = () => {
    setDateFrom(today);
    setDateTo(today);
    setSelectedDate(today);
  };

  const handlePresetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const yStr = `${year}-${month}-${day}`;
    setDateFrom(yStr);
    setDateTo(yStr);
    setSelectedDate(yStr);
  };

  const handlePresetThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const day = String(monday.getDate()).padStart(2, "0");

    setDateFrom(`${year}-${month}-${day}`);
    setDateTo(today);
    setSelectedDate(today);
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    setDateFrom(`${year}-${month}-01`);
    setDateTo(today);
    setSelectedDate(today);
  };

  const handleResetDates = () => {
    setDateFrom(today);
    setDateTo(today);
    setSelectedDate(today);
    setQ("");
  };

  const formatDateRangeLabel = () => {
    if (!dateFrom && !dateTo) return "All Time";
    if (dateFrom === dateTo) return dateFrom === today ? "Today" : formatFilterDate(dateFrom);
    return `${formatFilterDate(dateFrom)} to ${formatFilterDate(dateTo)}`;
  };  // Line / Route State
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

  const loadWorkspaceAndData = async () => {
    try {
      const ws = await guestWorkspaceService.getWorkspace();
      setWorkspace(ws);
      const savedDays = ws.allowed_collection_days || [];
      setConfiguredDays(savedDays);

      const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      if (savedDays.includes(currentDayName)) {
        setSelectedDay(currentDayName);
      } else if (savedDays.length === 1) {
        setSelectedDay(savedDays[0]);
      } else if (savedDays.length > 1) {
        setSelectedDay("all");
      } else {
        setSelectedDay(currentDayName);
      }
    } catch (err) {
      console.error("Workspace load error:", err);
    }
  };

  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await guestWorkspaceService.getCollections({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        line: selectedLine === "all" ? undefined : selectedLine,
        portion: selectedPortion === "all" ? undefined : selectedPortion,
        page_size: 1000,
      });
      setCollections(res.data || []);
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setLoadingCollections(false);
    }
  };

  useEffect(() => {
    loadWorkspaceAndData();
    loadLines();
  }, []);

  useEffect(() => {
    loadCollections();
  }, [dateFrom, dateTo, selectedLine, selectedPortion]);

  const loadRouteCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await guestWorkspaceService.getCustomers({
        status: "active",
        collection_day: selectedDay === "all" ? undefined : selectedDay,
        line: selectedLine === "all" ? undefined : selectedLine,
        portion: selectedPortion === "all" ? undefined : selectedPortion,
      });
      setRouteCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to load route customers:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    loadRouteCustomers();
  }, [selectedDay, selectedLine, selectedPortion]);

  const maxAllowedDays = workspace?.max_allowed_collection_days || (workspace?.subscription_plan === "free" ? 1 : 7);
  const isSingleDayPlan = configuredDays.length === 1;
  const isDaysSaved = configuredDays.length > 0;

  // Paid and Skipped sets on selected date or range
  const { paidOnSelectedDateSet, skippedOnSelectedDateSet } = useMemo(() => {
    const paid = new Set<string>();
    const skipped = new Set<string>();
    collections.forEach((c) => {
      const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : (c.created_at ? String(c.created_at).slice(0, 10) : "");
      const isOpeningBalance = c.remarks?.toLowerCase().includes("initial opening");
      const isSkippedStatus = c.status_code === "skipped" || c.status_name?.toLowerCase().includes("skipped");

      const inRange = (!dateFrom || entryDate >= dateFrom) && (!dateTo || entryDate <= dateTo);

      if (inRange && !isOpeningBalance) {
        const pId = c.customer_public_id ? String(c.customer_public_id).toLowerCase() : "";
        const cCode = c.customer_code ? String(c.customer_code).toLowerCase() : "";

        if (isSkippedStatus) {
          if (pId) skipped.add(pId);
          if (cCode) skipped.add(cCode);
        } else if (Number(c.collected_amount || 0) > 0 || c.status_code === "paid") {
          if (pId) paid.add(pId);
          if (cCode) paid.add(cCode);
        }
      }
    });
    return { paidOnSelectedDateSet: paid, skippedOnSelectedDateSet: skipped };
  }, [collections, dateFrom, dateTo]);

  const customerHistoryMap = useMemo(() => {
    const map: Record<string, ("paid" | "skipped")[]> = {};
    const customerCollectionsMap: Record<string, Collection[]> = {};

    collections.forEach((col) => {
      const pId = col.customer_public_id ? String(col.customer_public_id).toLowerCase() : "";
      const cCode = col.customer_code ? String(col.customer_code).toLowerCase() : "";

      if (pId) {
        if (!customerCollectionsMap[pId]) customerCollectionsMap[pId] = [];
        customerCollectionsMap[pId].push(col);
      }
      if (cCode) {
        if (!customerCollectionsMap[cCode]) customerCollectionsMap[cCode] = [];
        customerCollectionsMap[cCode].push(col);
      }
    });

    Object.entries(customerCollectionsMap).forEach(([key, cols]) => {
      map[key] = buildHistoryStatuses(cols);
    });

    return map;
  }, [collections]);

  // Total Expected
  const totalExpected = useMemo(() => {
    return routeCustomers.reduce((s, c) => s + Number(c.installment_amount || c.loan_amount || 0), 0);
  }, [routeCustomers]);

  // Total Collected in Selected Date Range
  const totalCollectedForSelectedDate = useMemo(() => {
    const customerIds = selectedDay === "all" ? null : new Set(
      routeCustomers.flatMap((c) => [
        String(c.public_id).toLowerCase(),
        String(c.customer_code).toLowerCase(),
      ])
    );

    return collections
      .filter((c) => {
        const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : (c.created_at ? String(c.created_at).slice(0, 10) : "");
        const isOpeningBalance = c.remarks?.toLowerCase().includes("initial opening");
        const isSkipped = c.status_code === "skipped" || c.status_name?.toLowerCase().includes("skipped");

        const inRange = (!dateFrom || entryDate >= dateFrom) && (!dateTo || entryDate <= dateTo);
        if (!inRange || isOpeningBalance || isSkipped) return false;

        if (customerIds) {
          const cpId = c.customer_public_id ? String(c.customer_public_id).toLowerCase() : "";
          const ccCode = c.customer_code ? String(c.customer_code).toLowerCase() : "";
          if (!customerIds.has(cpId) && !customerIds.has(ccCode)) return false;
        }
        return true;
      })
      .reduce((s, c) => s + Number(c.collected_amount || 0), 0);
  }, [collections, routeCustomers, selectedDay, dateFrom, dateTo]);

  // Filter customers by search query
  const filteredCustomers = useMemo(() => {
    const searchLower = q.toLowerCase();
    const matched = routeCustomers.filter(
      (c) =>
        !q ||
        c.full_name?.toLowerCase().includes(searchLower) ||
        c.customer_code?.toLowerCase().includes(searchLower) ||
        c.mobile_number?.includes(q) ||
        (c.sequence_number && String(c.sequence_number) === q.trim())
    );
    // Sort: unpaid customers first, paid customers at bottom
    return [...matched].sort((a, b) => {
      const aPaid = paidOnSelectedDateSet.has(String(a.public_id).toLowerCase()) || paidOnSelectedDateSet.has(String(a.customer_code).toLowerCase()) ? 1 : 0;
      const bPaid = paidOnSelectedDateSet.has(String(b.public_id).toLowerCase()) || paidOnSelectedDateSet.has(String(b.customer_code).toLowerCase()) ? 1 : 0;
      return aPaid - bPaid;
    });
  }, [routeCustomers, q, paidOnSelectedDateSet]);

  const filteredCollections = collections.filter((c) => {
    const entryDate = c.collection_date ? String(c.collection_date).slice(0, 10) : (c.created_at ? String(c.created_at).slice(0, 10) : "");
    const matchesDate = !selectedDate || entryDate === selectedDate;
    const matchesSearch =
      !q ||
      c.customer_name?.toLowerCase().includes(q.toLowerCase()) ||
      c.receipt_number?.toLowerCase().includes(q.toLowerCase());
    return matchesDate && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 0. Daily Cash Flow & Reconciliation Card */}
      <DailyCashReconciliationCard date={selectedDate} onRefresh={loadCollections} />

      {/* 1. Current Week Activity & Configured Collection Lines Card */}
      <Card className="p-4 bg-card border-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Current Week Activity & Collection Lines</h3>
                <Badge variant={workspace?.subscription_plan === "premium" ? "default" : "secondary"} className="capitalize text-[10px]">
                  {lines.length} Line{lines.length !== 1 ? "s" : ""} Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select active route line & time slot portion (Morning 1am–1pm / Afternoon 1pm–12am) to record collections.
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
              size="sm"
              variant="outline"
              onClick={() => {
                setLineToEdit(null);
                setIsLineModalOpen(true);
              }}
              className="h-8 px-2.5 text-xs font-semibold gap-1 bg-background"
            >
              <Plus className="size-3.5 text-primary" /> + Add Line / Route
            </Button>
          </div>
        </div>

        {/* Lines Overview Cards */}
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
                    
                    {/* Line Actions: Edit & Delete */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                        title="Edit Line"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLineToEdit(ln);
                          setIsLineModalOpen(true);
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md"
                        title="Delete Line"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete line "${ln.name}"?`)) {
                            try {
                              await guestWorkspaceService.deleteLine(ln.public_id);
                              await loadLines();
                            } catch (err: any) {
                              alert(err?.message || "Failed to delete line");
                            }
                          }
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
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
          loadCollections();
          loadRouteCustomers();
        }}
      />

      {/* 2. Date Range & Preset Filter Bar */}
      <Card className="p-4 space-y-3 bg-card border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Date Range & Date Filtration</h3>
            <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
              {formatDateRangeLabel()}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant={dateFrom === today && dateTo === today ? "default" : "outline"} onClick={handlePresetToday} className="h-7 text-[11px] px-2.5">
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetYesterday} className="h-7 text-[11px] px-2.5">
              Yesterday
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetThisWeek} className="h-7 text-[11px] px-2.5">
              This Week
            </Button>
            <Button size="sm" variant="outline" onClick={handlePresetThisMonth} className="h-7 text-[11px] px-2.5">
              This Month
            </Button>
            <Button size="sm" variant="ghost" onClick={handleResetDates} className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setSelectedDate(e.target.value);
              }}
              className="mt-1 h-8 sm:h-9 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 h-8 sm:h-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* 3. Metrics Row (Total Expected, Total Collected & Unpaid/Skipped) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 sm:p-4 bg-card border-border shadow-xs">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Expected ({formatDateRangeLabel()})</p>
          <p className="mt-1 font-display text-lg sm:text-2xl font-bold">{loadingCollections ? "..." : inr(totalExpected)}</p>
        </Card>
        <Card className="p-3.5 sm:p-4 bg-card border-border shadow-xs border-emerald-500/30 bg-emerald-500/5">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Total Collected ({formatDateRangeLabel()})</p>
          <p className="mt-1 font-display text-lg sm:text-2xl font-bold text-emerald-600">{loadingCollections ? "..." : inr(totalCollectedForSelectedDate)}</p>
        </Card>
        <Card className="p-3.5 sm:p-4 bg-card border-border shadow-xs border-amber-500/30 bg-amber-500/5">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">Unpaid / Pending ({formatDateRangeLabel()})</p>
          <p className="mt-1 font-display text-lg sm:text-2xl font-bold text-amber-600">{loadingCollections ? "..." : inr(Math.max(0, totalExpected - totalCollectedForSelectedDate))}</p>
        </Card>
      </div>

      {/* 3. Route Day Customers List Card */}
      <Card className="overflow-hidden">
        {/* Card Header with title and batch button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Borrowers on{" "}
                <span className="text-primary capitalize font-mono">{selectedDay === "all" ? "All Days" : selectedDay}</span>{" "}
                Route
                {!loadingCustomers && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({filteredCustomers.length} borrowers · {paidOnSelectedDateSet.size} paid on {formatFilterDate(selectedDate)})
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Active installment passbook & payment status for <span className="font-semibold text-foreground">{formatFilterDate(selectedDate)}</span>.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/collections/batch" search={{ day: selectedDay }}>
              <ListChecks className="size-4 mr-1" /> Batch Collect
            </Link>
          </Button>
        </div>

        {/* ─── Search & Date Filter Bar ─── */}
        <div className="border-b border-border/60 p-4 bg-muted/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, code or mobile…"
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Date Picker Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1.5 text-xs shadow-xs">
                <Calendar className="size-4 text-primary shrink-0" />
                <span className="font-semibold text-muted-foreground hidden sm:inline">Collection Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value || today)}
                  className="bg-transparent text-foreground font-mono font-bold focus:outline-none cursor-pointer"
                />
              </div>

              {!isSelectedDateToday && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs px-2.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
                  onClick={() => setSelectedDate(today)}
                >
                  Reset to Today
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              {paidOnSelectedDateSet.size} Paid on {formatFilterDate(selectedDate)}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-[11px] font-semibold text-orange-700">
              {routeCustomers.length - paidOnSelectedDateSet.size} Pending
            </div>
          </div>
        </div>

        {/* Mobile View: Individual Cards */}
        <div className="block md:hidden p-4 space-y-3">
          {loadingCustomers ? (
            <p className="text-center py-6 text-xs text-muted-foreground">Loading route customers...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">
              No active borrowers assigned to {selectedDay === "all" ? "any day" : selectedDay}.
            </p>
          ) : (
            filteredCustomers.map((c) => {
              const pId = String(c.public_id).toLowerCase();
              const cCode = String(c.customer_code).toLowerCase();
              const isPaidOnDate = paidOnSelectedDateSet.has(pId) || paidOnSelectedDateSet.has(cCode);
              const isSkippedOnDate = skippedOnSelectedDateSet.has(pId) || skippedOnSelectedDateSet.has(cCode);

              return (
                <div
                  key={c.public_id}
                  className={`p-3.5 rounded-xl border bg-card shadow-sm space-y-3 transition-all ${isPaidOnDate
                      ? "border-emerald-500/40 bg-emerald-500/5 opacity-80"
                      : isSkippedOnDate
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-border"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {c.sequence_number && (
                          <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                            #{c.sequence_number}
                          </span>
                        )}
                        <h4 className="font-bold text-xs text-foreground">{c.full_name}</h4>
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground">{c.customer_code} • {c.mobile_number}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="font-mono text-[10px] capitalize bg-primary/5 text-primary border-primary/20">
                        {c.collection_day || "monday"}
                      </Badge>
                      {isPaidOnDate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
                          <CheckCircle2 className="size-3" /> {isSelectedDateToday ? "PAID TODAY" : `PAID (${formatFilterDate(selectedDate)})`}
                        </span>
                      ) : isSkippedOnDate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          SKIPPED ({formatFilterDate(selectedDate)})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-medium">Disbursed Date:</span>
                      <p className="font-medium font-mono text-foreground">{c.start_date ? formatFilterDate(c.start_date) : "-"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-medium">Installment Due:</span>
                      <p className="font-semibold font-mono text-emerald-700">{inr(c.installment_amount || c.loan_amount || 0)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-medium">Outstanding:</span>
                      <p className="font-bold font-mono text-primary">{inr(c.outstanding_balance || 0)}</p>
                    </div>
                  </div>

                  <InstallmentPassbookGrid
                    total={c.total_installments || 20}
                    paid={c.installments_paid_count || 0}
                    skipped={c.skipped_installments_count || 0}
                    outstanding={c.outstanding_balance}
                    onExtend={() => setExtendingCustomer(c)}
                    historyStatuses={customerHistoryMap[pId] || customerHistoryMap[cCode]}
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setViewingCustomer(c)}
                    >
                      <Eye className="size-3.5 mr-1" /> View
                    </Button>
                    {!isPaidOnDate ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => setMarkingPaidCustomer(c)}
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Mark as Paid
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        <Link to="/app/collections/new" search={{ customer: c.public_id }}>
                          Record Entry <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Customer Code & Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Disbursed Date</TableHead>
                <TableHead>Collection Day</TableHead>
                <TableHead>Per Installment (₹)</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead className="min-w-[200px]">Installment Passbook</TableHead>
                <TableHead>{formatFilterDate(selectedDate)} Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingCustomers ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-xs text-muted-foreground">
                    Loading route customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-xs text-muted-foreground">
                    No active borrowers assigned to {selectedDay === "all" ? "any day" : selectedDay}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => {
                  const pId = String(c.public_id).toLowerCase();
                  const cCode = String(c.customer_code).toLowerCase();
                  const isPaidOnDate = paidOnSelectedDateSet.has(pId) || paidOnSelectedDateSet.has(cCode);
                  const isSkippedOnDate = skippedOnSelectedDateSet.has(pId) || skippedOnSelectedDateSet.has(cCode);

                  return (
                    <TableRow
                      key={c.public_id}
                      className={isPaidOnDate ? "bg-emerald-500/5 opacity-80" : isSkippedOnDate ? "bg-amber-500/5" : ""}
                    >
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {c.sequence_number && (
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                                #{c.sequence_number}
                              </span>
                            )}
                            <p className="font-semibold text-xs">{c.full_name}</p>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground">{c.customer_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.mobile_number}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {c.start_date ? formatFilterDate(c.start_date) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] capitalize bg-primary/5 text-primary border-primary/20">
                          {c.collection_day || "monday"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-emerald-700 font-mono">
                        {inr(c.installment_amount || c.loan_amount || 0)}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-primary font-mono">
                        {inr(c.outstanding_balance || 0)}
                      </TableCell>
                      <TableCell className="py-2 min-w-[200px]">
                        <InstallmentPassbookGrid
                          total={c.total_installments || 20}
                          paid={c.installments_paid_count || 0}
                          skipped={c.skipped_installments_count || 0}
                          outstanding={c.outstanding_balance}
                          onExtend={() => setExtendingCustomer(c)}
                          historyStatuses={customerHistoryMap[pId] || customerHistoryMap[cCode]}
                        />
                      </TableCell>
                      <TableCell>
                        {isPaidOnDate ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-600 text-white whitespace-nowrap">
                            <CheckCircle2 className="size-3.5" /> {isSelectedDateToday ? "PAID TODAY" : `PAID (${formatFilterDate(selectedDate)})`}
                          </span>
                        ) : isSkippedOnDate ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                            SKIPPED ({formatFilterDate(selectedDate)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-orange-500/15 text-orange-700 border border-orange-400/30 whitespace-nowrap">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setViewingCustomer(c)}
                          >
                            <Eye className="size-3.5 mr-1" /> View
                          </Button>
                          {!isPaidOnDate ? (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              onClick={() => setMarkingPaidCustomer(c)}
                            >
                              <CheckCircle2 className="size-3.5 mr-1" /> Mark as Paid
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5">
                              <Link to="/app/collections/new" search={{ customer: c.public_id }}>
                                Record Entry <ArrowRight className="size-3 ml-1" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pop-up Modal: View Customer Details & Payment History */}
      {viewingCustomer && (
        <ViewCustomerHistoryModal
          customer={viewingCustomer}
          allCollections={collections}
          open={Boolean(viewingCustomer)}
          setOpen={(v) => !v && setViewingCustomer(null)}
        />
      )}

      {/* Pop-up Modal: Mark as Paid */}
      {markingPaidCustomer && (
        <MarkAsPaidModal
          customer={markingPaidCustomer}
          open={Boolean(markingPaidCustomer)}
          setOpen={(v) => !v && setMarkingPaidCustomer(null)}
          onSuccess={() => {
            setMarkingPaidCustomer(null);
            loadRouteCustomers();
            loadCollections();
          }}
        />
      )}

      {/* Collection Register Card */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="text-sm font-bold">Collection Register</h3>
            <p className="text-xs text-muted-foreground">All recorded payment entries for this workspace.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Export
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/app/collections/batch" search={{ day: selectedDay }}>
                <ListChecks className="size-4 mr-1" /> Batch Record
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/app/collections/new" search={{ day: selectedDay }}>
                <Plus className="size-4 mr-1" /> New Entry
              </Link>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No</TableHead>
                <TableHead>Collection Date</TableHead>
                <TableHead>Disbursed Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Expected Amount</TableHead>
                <TableHead>Collected Amount</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingCollections ? (
                <TableSkeletonRows rows={4} columns={9} />
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                    No collection entries yet. Click "New Entry" or "Mark as Paid" to record a collection.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollections.map((c) => (
                  <TableRow key={c.public_id}>
                    <TableCell className="font-mono text-xs font-semibold">{c.receipt_number}</TableCell>
                    <TableCell className="text-xs">{c.collection_date}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {c.disbursed_date ? formatFilterDate(c.disbursed_date) : c.customer_start_date ? formatFilterDate(c.customer_start_date) : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{c.customer_name} ({c.customer_code})</TableCell>
                    <TableCell>{inr(c.expected_amount)}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{inr(c.collected_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.payment_mode_name || "Cash"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{c.status_name || "Paid"}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{c.remarks || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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
          onSuccess={() => {
            loadCollections();
            loadRouteCustomers();
          }}
        />
      )}
    </div>
  );
}

function MarkAsPaidModal({
  customer,
  open,
  setOpen,
  onSuccess,
}: {
  customer: Customer;
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const defaultAmount = customer.installment_amount || customer.loan_amount || 0;

  const [collectionDate, setCollectionDate] = useState<string>(today);
  const [expectedAmount, setExpectedAmount] = useState<number>(defaultAmount);
  const [collectedAmount, setCollectedAmount] = useState<number>(defaultAmount);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [statuses, setStatuses] = useState<MasterItem[]>([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<number>(1);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);
  const [remarks, setRemarks] = useState<string>("");

  const [isCollectedToday, setIsCollectedToday] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMasters() {
      try {
        const [modesRes, statusesRes] = await Promise.all([
          mastersService.getPaymentModes(),
          mastersService.getCollectionStatuses(),
        ]);
        setPaymentModes(modesRes);
        setStatuses(statusesRes);
        if (modesRes[0]) setSelectedPaymentMode(modesRes[0].id);
        if (statusesRes[0]) setSelectedStatus(statusesRes[0].id);
      } catch (err) {
        console.error("Master load error:", err);
      }
    }
    if (open) loadMasters();
  }, [open]);

  const currentStatusObj = statuses.find((s) => s.id === selectedStatus);
  const isSkippedSelected = currentStatusObj?.code === "skipped" || currentStatusObj?.name?.toLowerCase().includes("skipped");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await guestWorkspaceService.recordCollection({
        customer: customer.public_id,
        collection_date: collectionDate,
        expected_amount: expectedAmount,
        collected_amount: isSkippedSelected ? 0 : collectedAmount,
        status: selectedStatus,
        payment_mode: isSkippedSelected ? undefined : selectedPaymentMode,
        remarks,
        is_collected_today: isCollectedToday,
      });

      setOpen(false);
      onSuccess();
    } catch (err: any) {
      if (err.upgradePrompt) {
        setError(`${err.message} (${err.upgradePrompt.message})`);
      } else {
        setError(err.message || "Failed to record collection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nextInstallmentNo = (customer.installments_paid_count || 0) + 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="size-5" /> Mark Installment #{nextInstallmentNo} as Paid
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Record a payment for <span className="font-semibold text-foreground">{customer.full_name}</span>. This will strike through installment #{nextInstallmentNo} in the passbook.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Borrower Profile Card Header */}
          <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1 text-xs">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>{customer.full_name} ({customer.customer_code})</span>
              <Badge variant="outline" className="font-mono text-[10px] capitalize bg-primary/5 text-primary">
                Day: {customer.collection_day || "monday"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-0.5 gap-x-2">
              <span>Mobile: <span className="font-mono text-foreground">{customer.mobile_number}</span></span>
              <span>Disbursed: <span className="font-mono text-foreground font-semibold">{customer.start_date ? formatFilterDate(customer.start_date) : "-"}</span></span>
              <span>Outstanding: <span className="font-mono font-bold text-primary">{inr(customer.outstanding_balance || 0)}</span></span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Collection Timing *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                variant={isCollectedToday ? "default" : "outline"}
                className={isCollectedToday ? "bg-emerald-600 text-white hover:bg-emerald-700 h-8 text-xs font-bold" : "h-8 text-xs"}
                onClick={() => setIsCollectedToday(true)}
              >
                Collected Today
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!isCollectedToday ? "secondary" : "outline"}
                className={!isCollectedToday ? "bg-muted-foreground/20 font-bold h-8 text-xs" : "h-8 text-xs"}
                onClick={() => setIsCollectedToday(false)}
              >
                Past Collection
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isCollectedToday
                ? "Included in Reports calculations & daily net revenue figures."
                : "Stored for passbook history, but excluded from Reports revenue calculations."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Collection Date *</Label>
              <Input
                type="date"
                className="mt-1"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Expected Installment (₹) *</Label>
              <Input
                type="number"
                className="mt-1 font-mono font-semibold"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Collected Amount (₹) *</Label>
              <Input
                type="number"
                className={`mt-1 font-mono font-bold ${isSkippedSelected ? "text-amber-600 bg-muted/40" : "text-emerald-700"}`}
                value={collectedAmount}
                onChange={(e) => setCollectedAmount(Number(e.target.value))}
                disabled={isSkippedSelected}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Payment Status *</Label>
              <Select
                value={selectedStatus.toString()}
                onValueChange={(v) => {
                  const statusId = Number(v);
                  setSelectedStatus(statusId);
                  const st = statuses.find((s) => s.id === statusId);
                  const isSkip = st?.code === "skipped" || st?.name?.toLowerCase().includes("skipped");
                  if (isSkip) {
                    setCollectedAmount(0);
                  } else {
                    setCollectedAmount(expectedAmount);
                  }
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isSkippedSelected && (
            <div>
              <Label className="text-xs font-semibold">Payment Mode *</Label>
              <Select value={selectedPaymentMode.toString()} onValueChange={(v) => setSelectedPaymentMode(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentModes.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold">Remarks / Notes</Label>
            <Textarea
              className="mt-1 text-xs"
              placeholder={isSkippedSelected ? "e.g. Borrower requested 2 days extension due to travel" : "e.g. Collected cash on Wednesday route"}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className={isSkippedSelected ? "bg-amber-600 hover:bg-amber-700 text-white font-semibold" : "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"} disabled={submitting}>
              {submitting ? "Processing..." : isSkippedSelected ? "Save as Skipped / Promised Later" : `Mark Installment #${nextInstallmentNo} as Paid`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewCustomerHistoryModal({
  customer,
  allCollections,
  open,
  setOpen,
  onRefresh,
}: {
  customer: Customer;
  allCollections: Collection[];
  open: boolean;
  setOpen: (v: boolean) => void;
  onRefresh?: () => void;
}) {
  const [detail, setDetail] = useState<Customer>(customer);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingDates, setSavingDates] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const loadFreshDetail = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const fresh = await guestWorkspaceService.getCustomerDetail(customer.public_id);
      if (fresh) setDetail(fresh);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to load fresh customer detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFreshDetail();
      setIsEditMode(false);
      setDraftDates({});
      setSaveMsg(null);
    }
  }, [open, customer]);

  const history = useMemo(() => {
    if (!customer) return [];
    const pId = String(customer.public_id).toLowerCase();
    const cCode = String(customer.customer_code).toLowerCase();
    return allCollections.filter((c) => {
      const cpId = c.customer_public_id ? String(c.customer_public_id).toLowerCase() : "";
      const ccCode = c.customer_code ? String(c.customer_code).toLowerCase() : "";
      return (cpId && cpId === pId) || (ccCode && ccCode === cCode);
    });
  }, [allCollections, customer]);

  const activeCustomer = detail || customer;
  const totalCollected = history.reduce((s, h) => s + Number(h.collected_amount || 0), 0);

  // Filter modified records
  const modifiedRecords = useMemo(() => {
    return history.filter((h) => {
      const isAlreadyEdited = h.is_edited || (h.edit_count && h.edit_count >= 1);
      if (isAlreadyEdited) return false;
      const draft = draftDates[h.public_id];
      return draft && draft !== h.collection_date;
    });
  }, [history, draftDates]);

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setDraftDates({});
  };

  const handleConfirmSaveDates = async () => {
    if (modifiedRecords.length === 0) return;
    setSavingDates(true);
    setSaveMsg(null);
    try {
      await Promise.all(
        modifiedRecords.map((h) =>
          guestWorkspaceService.updateCollection(h.public_id, {
            collection_date: draftDates[h.public_id],
          })
        )
      );
      setSaveMsg(`Successfully updated ${modifiedRecords.length} record(s). Audit log generated!`);
      setShowConfirmModal(false);
      setIsEditMode(false);
      setDraftDates({});
      loadFreshDetail();
    } catch (err: any) {
      setSaveMsg(err.message || "Failed to update collection dates.");
    } finally {
      setSavingDates(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5 text-primary" /> Borrower Profile & Payment Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete account summary and collection history for <span className="font-semibold text-foreground">{activeCustomer.full_name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {saveMsg && (
              <div className="p-2 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-md flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" />
                {saveMsg}
              </div>
            )}

            {/* Header Card */}
            <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1.5">
                  {activeCustomer.sequence_number && (
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                      #{activeCustomer.sequence_number}
                    </span>
                  )}
                  <span className="text-sm font-bold">{activeCustomer.full_name}</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] capitalize bg-primary/5 text-primary">
                  Day: {activeCustomer.collection_day || "monday"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <div>Code: <span className="font-mono font-semibold text-foreground">{activeCustomer.customer_code}</span></div>
                <div>Mobile: <span className="font-mono font-semibold text-foreground">{activeCustomer.mobile_number}</span></div>
                <div>Disbursed Date: <span className="font-mono font-semibold text-foreground">{activeCustomer.start_date ? formatFilterDate(activeCustomer.start_date) : "-"}</span></div>
                <div>Status: <span className="capitalize font-semibold text-emerald-700">{activeCustomer.status}</span></div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium">Principal</p>
                <p className="font-bold text-foreground mt-0.5 font-mono">{inr(Number(activeCustomer.loan_amount || 0))}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium">Total Due</p>
                <p className="font-bold text-foreground mt-0.5 font-mono">{inr(Number(activeCustomer.total_due || 0))}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-primary font-medium">Outstanding</p>
                <p className="font-bold text-primary mt-0.5 font-mono">{inr(Number(activeCustomer.outstanding_balance || 0))}</p>
              </div>
            </div>

            {/* Installment Passbook */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Installment Passbook</h4>
              <InstallmentPassbookGrid
                total={activeCustomer.total_installments || 20}
                paid={activeCustomer.installments_paid_count || 0}
                skipped={activeCustomer.skipped_installments_count || 0}
                outstanding={activeCustomer.outstanding_balance}
                historyStatuses={buildHistoryStatuses(history)}
              />
            </div>

            {/* Collection Receipts History */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground">Recorded Payments ({history.length})</h4>
                  {!isEditMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 font-medium text-muted-foreground hover:text-foreground"
                      onClick={handleCancelEdit}
                    >
                      Cancel Editing
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditMode && modifiedRecords.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-6 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs gap-1"
                      onClick={() => setShowConfirmModal(true)}
                    >
                      Save ({modifiedRecords.length}) Changes
                    </Button>
                  )}
                  <span className="text-xs font-bold text-emerald-700 font-mono">Total Paid: {inr(totalCollected)}</span>
                </div>
              </div>

              {loading && history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">No payment entries recorded yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-[11px]">
                        <TableHead className="py-2">Receipt #</TableHead>
                        <TableHead className="py-2">Collection Date</TableHead>
                        <TableHead className="py-2">Amount</TableHead>
                        <TableHead className="py-2">Mode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h) => {
                        const isAlreadyEdited = h.is_edited || (h.edit_count && h.edit_count >= 1);
                        const isSkipped = h.status_code === "skipped" || h.status_name?.toLowerCase().includes("skipped");

                        return (
                          <TableRow key={h.public_id} className="text-xs">
                            <TableCell className="font-mono text-[11px] py-1.5 font-semibold">{h.receipt_number}</TableCell>
                            <TableCell className="py-1.5 text-[11px]">
                              {isEditMode ? (
                                isAlreadyEdited ? (
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono">{h.collection_date}</span>
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 text-amber-700 bg-amber-500/10 font-bold">
                                      <Lock className="size-2.5 mr-0.5" /> Locked
                                    </Badge>
                                  </div>
                                ) : (
                                  <input
                                    type="date"
                                    value={draftDates[h.public_id] ?? h.collection_date}
                                    onChange={(e) =>
                                      setDraftDates((prev) => ({
                                        ...prev,
                                        [h.public_id]: e.target.value,
                                      }))
                                    }
                                    className="h-7 text-xs font-mono border border-primary/40 rounded px-1.5 bg-background text-foreground focus:ring-1 focus:ring-primary"
                                  />
                                )
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-mono">{h.collection_date}</span>
                                  {isAlreadyEdited && (
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 text-amber-700 bg-amber-500/10 font-bold">
                                      <Lock className="size-2.5 mr-0.5" /> Edited
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className={`font-bold font-mono py-1.5 ${isSkipped ? "text-amber-600" : "text-emerald-600"}`}>
                              {isSkipped ? "Skipped (₹0)" : inr(h.collected_amount)}
                            </TableCell>
                            <TableCell className="py-1.5 text-[11px]">{h.payment_mode_name || "Cash"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Lock className="size-5 text-amber-600" /> Confirm Date Modification
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-muted-foreground space-y-2 pt-1">
                <p>
                  You are modifying collection dates for <strong>{modifiedRecords.length} record(s)</strong>.
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                  <p className="font-bold">⚠️ One-Time Edit Rule & Mandatory Audit Trail:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>An installment record can be edited <strong>ONLY ONCE</strong>.</li>
                    <li>This action will log an <strong>audit entry</strong> with your username and date changes.</li>
                    <li>Modified record(s) will be permanently locked after saving.</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)} disabled={savingDates}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={handleConfirmSaveDates}
              disabled={savingDates}
            >
              {savingDates ? "Saving & Logging..." : "Confirm & Save (Log Audit)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
