import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  Plus,
  Save,
  Wallet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Edit3,
  Search,
  IndianRupee,
  Layers,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Eye,
  ArrowLeft,
  UserPlus,
  CalendarDays,
  ShieldCheck,
  Check,
  X,
  Calculator,
  History,
  Play,
  Square,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { inr } from "@/lib/utils";
import {
  guestWorkspaceService,
  CollectionLine,
  Customer,
  Collection,
  WorkspaceData,
} from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";
import { EditCustomerModal } from "@/routes/app.customers";
import { LineSetupDialog } from "@/components/line-setup-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/daily-sheet")({
  component: DailySheetPage,
});

interface SheetRowItem {
  customer_id: string;
  customer_code: string;
  sequence_number: number | string;
  full_name: string;
  mobile_number: string;
  expected_amount: number;
  collection_id?: string;
  collected_amount: string;
  status_id: number;
  payment_mode_id: number;
  is_saved: boolean;
  remarks: string;
}

function DailySheetPage() {
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const todayStr = getTodayStr();

  // Navigation Level State: "lines" (Level 1) | "days" (Level 2) | "customers" (Level 3)
  const [currentView, setCurrentView] = useState<"lines" | "days" | "customers">("lines");
  const [activeLine, setActiveLine] = useState<CollectionLine | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Data States
  const [lines, setLines] = useState<CollectionLine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [collectionsMap, setCollectionsMap] = useState<Record<string, Collection>>({});
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [statuses, setStatuses] = useState<MasterItem[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");

  // UI States
  const [sheetRows, setSheetRows] = useState<SheetRowItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Modals
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState<boolean>(false);
  const [lineToEdit, setLineToEdit] = useState<CollectionLine | null>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState<boolean>(false);
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState<boolean>(false);
  const [isStartRouteModalOpen, setIsStartRouteModalOpen] = useState<boolean>(false);
  const [openingCashInput, setOpeningCashInput] = useState<string>("0");
  const [customDateInput, setCustomDateInput] = useState<string>(todayStr);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Route Started Active Tracking State
  const [routeStartedMap, setRouteStartedMap] = useState<Record<string, { isStarted: boolean; openingCash: number }>>({});

  // Load Workspace, Lines & Master Data
  const loadInitial = async () => {
    setLoading(true);
    try {
      const [wsRes, linesRes, modesRes, statusRes] = await Promise.all([
        guestWorkspaceService.getWorkspace(),
        guestWorkspaceService.getLines(),
        mastersService.getPaymentModes(),
        mastersService.getCollectionStatuses(),
      ]);
      setWorkspace(wsRes);
      setLines(linesRes);
      setPaymentModes(modesRes);
      setStatuses(statusRes);
    } catch (err) {
      console.error("Daily sheet initial load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  // Fetch Customers & Collections when viewing Level 3 (Customers Sheet View)
  const loadSheetData = async () => {
    if (!activeLine) return;
    setLoading(true);
    try {
      const [custRes, collectionsRes] = await Promise.all([
        guestWorkspaceService.getCustomers({
          status: "active",
          line: activeLine.public_id,
          page_size: 1000,
        }),
        guestWorkspaceService.getCollections({
          date_from: selectedDate,
          date_to: selectedDate,
          line: activeLine.public_id,
        }),
      ]);

      const fetchedCusts = custRes.data || [];
      setCustomers(fetchedCusts);

      const colMap: Record<string, Collection> = {};
      collectionsRes.data.forEach((col) => {
        if (col.customer_public_id) {
          colMap[col.customer_public_id] = col;
        }
      });
      setCollectionsMap(colMap);

      const defaultStatusId = statuses[0]?.id || 1;
      const defaultModeId = paymentModes[0]?.id || 1;

      const rows: SheetRowItem[] = fetchedCusts.map((c) => {
        const existingCol = colMap[c.public_id];
        const expAmt = c.installment_amount || c.loan_amount || 0;

        return {
          customer_id: c.public_id,
          customer_code: c.customer_code,
          sequence_number: c.sequence_number ?? "-",
          full_name: c.full_name,
          mobile_number: c.mobile_number,
          expected_amount: expAmt,
          collection_id: existingCol?.public_id,
          collected_amount: existingCol ? String(existingCol.collected_amount) : String(expAmt),
          status_id: existingCol ? (existingCol.status || defaultStatusId) : defaultStatusId,
          payment_mode_id: existingCol ? (existingCol.payment_mode || defaultModeId) : defaultModeId,
          is_saved: !!existingCol,
          remarks: existingCol?.remarks || "",
        };
      });

      setSheetRows(rows);
    } catch (err) {
      console.error("Failed to load sheet rows:", err);
      toast.error("Failed to load customer sheet for selected date.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "customers" && activeLine) {
      loadSheetData();
    }
  }, [currentView, activeLine, selectedDate]);

  // Handle Save Payment for a Single Customer Row
  const handleSaveRow = async (row: SheetRowItem) => {
    setSavingRowId(row.customer_id);
    try {
      if (row.collection_id) {
        await guestWorkspaceService.updateCollection(row.collection_id, {
          collected_amount: parseFloat(row.collected_amount) || 0,
          status: row.status_id,
          payment_mode: row.payment_mode_id,
          remarks: row.remarks || "Daily Sheet collection entry",
        });
      } else {
        await guestWorkspaceService.recordCollection({
          customer: row.customer_id,
          collection_date: selectedDate,
          expected_amount: row.expected_amount,
          collected_amount: parseFloat(row.collected_amount) || 0,
          status: row.status_id,
          payment_mode: row.payment_mode_id,
          remarks: row.remarks || "Daily Sheet collection entry",
        });
      }

      toast.success(`Payment recorded for ${row.full_name}!`);
      loadSheetData();
    } catch (err: any) {
      console.error("Failed to save row payment:", err);
      toast.error(err?.message || "Failed to record payment.");
    } finally {
      setSavingRowId(null);
    }
  };

  const [customDatesList, setCustomDatesList] = useState<string[]>([]);

  // Date Generator for Level 2 (Days View) - Only Today and Past Days (No Auto Future Dates)
  const availableDates = useMemo(() => {
    const dates: { dateStr: string; label: string; isToday: boolean }[] = [];
    const now = new Date();

    // Only Today and Past 3 Days (No auto future dates)
    for (let i = -3; i <= 0; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      let label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
      if (i === 0) label = `Today (${label})`;
      if (i === -1) label = `Yesterday (${label})`;

      dates.push({
        dateStr,
        label,
        isToday: i === 0,
      });
    }

    // Include manually added dates from customDatesList or selectedDate
    const allCustom = Array.from(new Set([...customDatesList, selectedDate].filter(Boolean)));
    allCustom.forEach((customDateStr) => {
      if (!dates.some((d) => d.dateStr === customDateStr)) {
        const customD = new Date(customDateStr + "T00:00:00");
        dates.push({
          dateStr: customDateStr,
          label: customD.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
          isToday: customDateStr === todayStr,
        });
      }
    });

    return dates;
  }, [customDatesList, selectedDate, todayStr]);

  // Filtered Rows by Search Query
  const filteredSheetRows = useMemo(() => {
    if (!searchQuery.trim()) return sheetRows;
    const q = searchQuery.toLowerCase();
    return sheetRows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.customer_code.toLowerCase().includes(q) ||
        r.mobile_number.includes(q)
    );
  }, [sheetRows, searchQuery]);

  // Level 3 Sheet Metrics
  const sheetTotals = useMemo(() => {
    const expectedTotal = sheetRows.reduce((sum, r) => sum + r.expected_amount, 0);
    const collectedTotal = sheetRows.reduce((sum, r) => sum + (r.is_saved ? parseFloat(r.collected_amount) || 0 : 0), 0);
    const savedCount = sheetRows.filter((r) => r.is_saved).length;
    return { expectedTotal, collectedTotal, savedCount };
  }, [sheetRows]);

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ========================================================================= */}
      {/* LEVEL 1: LINES LIST VIEW */}
      {/* ========================================================================= */}
      {currentView === "lines" && (
        <div className="space-y-6">
          {/* Level 1 Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <MapPin className="size-6 text-primary" /> Route Collection Lines
                </h1>
                <Badge variant="outline" className="font-bold bg-primary/10 text-primary border-primary/30">
                  {lines.length} Active Lines
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Select a collection route line to view daily schedules and borrower registers.
              </p>
            </div>

            {/* Icon Add Button for Adding New Line */}
            <Button
              onClick={() => {
                setLineToEdit(null);
                setIsAddLineModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-5 rounded-2xl shadow-md gap-2"
            >
              <Plus className="size-5" /> Add New Line
            </Button>
          </div>

          {/* Lines Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading collection route lines...</div>
          ) : lines.length === 0 ? (
            <Card className="p-12 text-center space-y-4 rounded-3xl border-dashed border-2 border-border">
              <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <MapPin className="size-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">No Route Lines Found</h3>
                <p className="text-xs text-muted-foreground mt-1">Create your first collection route line to get started.</p>
              </div>
              <Button
                onClick={() => {
                  setLineToEdit(null);
                  setIsAddLineModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
              >
                <Plus className="size-4" /> Create Line 1
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lines.map((line) => {
                const daysList = (line.day_schedules || []).map((s) => s.day_of_week.toLowerCase());
                const uniqueDays = Array.from(new Set(daysList));

                return (
                  <Card
                    key={line.public_id}
                    onClick={() => {
                      setActiveLine(line);
                      setCurrentView("days");
                    }}
                    className="rounded-3xl border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group bg-card overflow-hidden relative"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                            <MapPin className="size-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                              {line.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{line.area || "General Area"}</p>
                          </div>
                        </div>

                        <Badge variant="outline" className="capitalize text-[10px] font-bold">
                          {(line as any).total_borrowers || (line as any).customer_count || 0} Borrowers
                        </Badge>
                      </div>

                      {/* Weekday Schedule Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {uniqueDays.length > 0 ? (
                          uniqueDays.map((day) => (
                            <Badge key={day} className="bg-primary/10 text-primary border-primary/20 capitalize text-[10px] font-semibold">
                              <CalendarIcon className="size-3 mr-1" /> {day}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">No Days Configured</Badge>
                        )}
                      </div>

                      {/* Bottom Transition Prompt */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-primary font-bold">
                        <span>View Collection Schedules</span>
                        <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: DAYS LIST VIEW FOR SELECTED LINE */}
      {/* ========================================================================= */}
      {currentView === "days" && activeLine && (
        <div className="space-y-6">
          {/* Level 2 Breadcrumb Header */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("lines")}
                className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1 px-0"
              >
                <ArrowLeft className="size-4" /> Back to All Lines
              </Button>

              {/* Icon Add Button for Adding a New Date */}
              <Button
                onClick={() => setIsAddDateModalOpen(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 rounded-xl"
              >
                <Plus className="size-4" /> Add Date / Schedule
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Line: {activeLine.name}
                  </h1>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold">
                    {activeLine.area || "Route Line"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a collection date schedule below to view borrower registers and record collections.
                </p>
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDates.map((item) => (
              <Card
                key={item.dateStr}
                onClick={() => {
                  setSelectedDate(item.dateStr);
                  setCurrentView("customers");
                }}
                className={`rounded-3xl border transition-all cursor-pointer p-5 space-y-3 hover:shadow-md ${
                  item.isToday
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={`size-5 ${item.isToday ? "text-emerald-600" : "text-primary"}`} />
                    <h3 className="font-bold text-sm text-foreground">{item.label}</h3>
                  </div>
                  {item.isToday && (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      ★ Today
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Date: <span className="font-mono font-bold text-foreground">{item.dateStr}</span>
                </p>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Open Borrower Sheet</span>
                  <ChevronRight className="size-4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: CUSTOMERS LIST VIEW FOR SELECTED LINE & DATE */}
      {/* ========================================================================= */}
      {currentView === "customers" && activeLine && (
        <div className="space-y-6">
          {/* Level 3 Breadcrumb Header */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("days")}
                className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1 px-0"
              >
                <ArrowLeft className="size-4" /> Back to Line Dates
              </Button>

              <div className="flex items-center gap-2">
                {/* Start Route Collection Button OR Active Badge */}
                {!routeStartedMap[`${activeLine.public_id}_${selectedDate}`]?.isStarted ? (
                  <Button
                    onClick={() => {
                      setOpeningCashInput("0");
                      setIsStartRouteModalOpen(true);
                    }}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 rounded-xl shadow-md"
                  >
                    <Play className="size-4 fill-current" /> Start Route Collection
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white font-bold gap-1.5 px-3 py-1.5 text-xs rounded-xl shadow-xs">
                      <span className="size-2 rounded-full bg-white animate-pulse" />
                      Route Active
                    </Badge>
                    <Button
                      onClick={() => {
                        toast.success(`Route closure summary generated for ${selectedDate}!`);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold gap-1 rounded-xl text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                    >
                      <Square className="size-3.5 fill-current" /> Close Route
                    </Button>
                  </div>
                )}

                {/* Icon Add Button for Adding New Customer */}
                <Button
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-1.5 rounded-xl shadow-sm"
                >
                  <UserPlus className="size-4" /> Add Borrower to Sheet
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <span>{activeLine.name}</span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                  <span className="text-primary font-mono">{selectedDate}</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily borrower collection sheet & handheld cash entry.
                </p>
              </div>

              {/* Search Filter Box */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search borrower by name, code or phone..."
                  className="pl-9 h-10 text-xs rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Metrics Summary Strip */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-muted/40 rounded-2xl border border-border text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Expected</span>
                <span className="text-sm font-extrabold font-mono text-foreground">{inr(sheetTotals.expectedTotal)}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-center">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Total Collected</span>
                <span className="text-sm font-extrabold font-mono text-emerald-700 dark:text-emerald-400">{inr(sheetTotals.collectedTotal)}</span>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/30 text-center">
                <span className="text-[10px] text-primary uppercase font-bold block">Paid / Total</span>
                <span className="text-sm font-extrabold font-mono text-primary">{sheetTotals.savedCount} / {sheetRows.length}</span>
              </div>
            </div>
          </div>

          {/* Customers Sheet Table & Cards */}
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading borrower collection sheet...</div>
          ) : filteredSheetRows.length === 0 ? (
            <Card className="p-12 text-center space-y-3 rounded-3xl border-dashed border-2 border-border">
              <Users className="size-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold">No Borrowers Found</h3>
              <p className="text-xs text-muted-foreground">No active borrowers assigned to this line and day schedule.</p>
              <Button
                onClick={() => setIsAddCustomerModalOpen(true)}
                size="sm"
                className="bg-primary text-primary-foreground font-bold gap-1.5"
              >
                <UserPlus className="size-4" /> Add First Borrower
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSheetRows.map((row) => (
                <Card
                  key={row.customer_id}
                  className={`p-4 rounded-2xl border transition-all ${
                    row.is_saved
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-card border-border shadow-xs"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Customer Information */}
                    <div className="flex items-start gap-3">
                      <div className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20 shrink-0">
                        #{row.sequence_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{row.full_name}</h4>
                          <span className="text-[11px] font-mono text-muted-foreground">({row.customer_code})</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Phone: <span className="font-mono text-foreground">{row.mobile_number}</span>
                        </p>
                      </div>
                    </div>

                    {/* Financial Inputs & Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Expected</span>
                        <span className="text-sm font-bold font-mono text-foreground">{inr(row.expected_amount)}</span>
                      </div>

                      {/* Amount Collected Input */}
                      <div className="w-32">
                        <Label className="text-[10px] text-muted-foreground font-bold">Collected (₹)</Label>
                        <Input
                          type="number"
                          className="h-9 font-mono font-bold text-xs"
                          value={row.collected_amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSheetRows((prev) =>
                              prev.map((r) => (r.customer_id === row.customer_id ? { ...r, collected_amount: val } : r))
                            );
                          }}
                        />
                      </div>

                      {/* Payment Mode */}
                      <div className="w-28">
                        <Label className="text-[10px] text-muted-foreground font-bold">Mode</Label>
                        <Select
                          value={String(row.payment_mode_id)}
                          onValueChange={(v) => {
                            setSheetRows((prev) =>
                              prev.map((r) => (r.customer_id === row.customer_id ? { ...r, payment_mode_id: Number(v) } : r))
                            );
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs font-semibold">
                            <SelectValue />
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

                      {/* Quick Profile Edit Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs px-2.5"
                        onClick={() => {
                          const targetCust = customers.find((c) => c.public_id === row.customer_id);
                          if (targetCust) setEditingCustomer(targetCust);
                        }}
                      >
                        <Edit3 className="size-3.5 mr-1" /> Profile
                      </Button>

                      {/* Save Collection Button */}
                      <Button
                        size="sm"
                        disabled={savingRowId === row.customer_id}
                        onClick={() => handleSaveRow(row)}
                        className={`h-9 text-xs px-3 font-bold gap-1.5 ${
                          row.is_saved
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        }`}
                      >
                        {savingRowId === row.customer_id ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : row.is_saved ? (
                          <>
                            <Check className="size-3.5" /> Saved
                          </>
                        ) : (
                          <>
                            <Save className="size-3.5" /> Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Line Setup Dialog (For Adding/Editing Lines) */}
      <LineSetupDialog
        open={isAddLineModalOpen}
        onOpenChange={setIsAddLineModalOpen}
        lineToEdit={lineToEdit}
        onSuccess={() => {
          setIsAddLineModalOpen(false);
          loadInitial();
        }}
      />

      {/* Dedicated Daily Sheet Borrower Add Modal */}
      {isAddCustomerModalOpen && activeLine && (
        <DailySheetAddCustomerModal
          open={isAddCustomerModalOpen}
          setOpen={setIsAddCustomerModalOpen}
          activeLine={activeLine}
          selectedDate={selectedDate}
          onSuccess={() => {
            setIsAddCustomerModalOpen(false);
            loadSheetData();
          }}
        />
      )}

      {/* Add Custom Date Modal */}
      <Dialog open={isAddDateModalOpen} onOpenChange={setIsAddDateModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" /> Select Collection Date
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose a specific date to view or enter collections for <strong>{activeLine?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Collection Date</Label>
              <Input
                type="date"
                className="mt-1 font-mono font-bold"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (customDateInput && !customDatesList.includes(customDateInput)) {
                    setCustomDatesList((prev) => [...prev, customDateInput]);
                  }
                  setSelectedDate(customDateInput);
                  setIsAddDateModalOpen(false);
                  setCurrentView("customers");
                }}
                className="w-full bg-primary font-bold"
              >
                Open Date Sheet
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Route Collection Dialog Modal */}
      <Dialog open={isStartRouteModalOpen} onOpenChange={setIsStartRouteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Play className="size-5 fill-current text-emerald-600" /> Start Route Collection
            </DialogTitle>
            <DialogDescription className="text-xs">
              Start daily field collection for <strong>{activeLine?.name}</strong> on <strong>{selectedDate}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (activeLine) {
                const key = `${activeLine.public_id}_${selectedDate}`;
                setRouteStartedMap((prev) => ({
                  ...prev,
                  [key]: { isStarted: true, openingCash: parseFloat(openingCashInput) || 0 },
                }));
                toast.success(`▶️ Route collection started for ${activeLine.name} (${selectedDate})!`);
                setIsStartRouteModalOpen(false);
              }
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <Label className="text-xs font-bold">Opening Handheld Cash Float (₹)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min="0"
                  className="pl-8 font-mono font-bold text-base h-11"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  placeholder="0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Starting cash in bag at the beginning of the field route.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsStartRouteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <Play className="size-4 fill-current" /> Confirm & Start Route
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Profile Edit Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          open={!!editingCustomer}
          setOpen={(v) => {
            if (!v) setEditingCustomer(null);
          }}
          onDeleteRequest={() => {}}
          onSuccess={() => {
            setEditingCustomer(null);
            if (activeLine) loadSheetData();
          }}
        />
      )}
    </div>
  );
}

{/* ========================================================================= */}
{/* DEDICATED DAILY SHEET BORROWER ADD MODAL (NEW & EXISTING BORROWERS) */}
{/* ========================================================================= */}
function DailySheetAddCustomerModal({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Borrower full name is required.");
      return;
    }
    if (!mobileNumber.trim()) {
      setError("Mobile number is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim(),
        line: activeLine.public_id,
        collection_day: selectedDayName,
        sequence_number: parseInt(sequenceNumber) || 1,
        loan_amount: disbursed,
        installment_amount: perInstallment,
        duration: totalInst,
        total_installments: totalInst,
        is_existing_borrower: borrowerType === "existing",
      };

      if (borrowerType === "existing") {
        payload.paid_installments_count = paidCount;
        payload.paid_amount_till_date = paidTillDate;
        if (estimatedStartDate) {
          payload.loan_start_date = estimatedStartDate;
        }
      }

      await guestWorkspaceService.createCustomer(payload);
      toast.success(`Borrower '${fullName}' added to ${activeLine.name}!`);
      onSuccess();
    } catch (err: any) {
      console.error("Failed to add borrower:", err);
      setError(err?.message || "Failed to create borrower record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && setOpen(false)}>
      <DialogContent className="max-w-xl rounded-3xl p-6">
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
