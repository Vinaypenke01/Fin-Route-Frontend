import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  ArrowLeft,
  CalendarDays,
  Play,
  Square,
  CheckCircle2,
  UserPlus,
  Search,
  Users,
  Pencil,
  Info,
  Check,
  X,
  XCircle,
  RefreshCw,
  Wallet,
  IndianRupee,
  Clock,
  Calculator,
  TrendingUp,
  TrendingDown,
  Receipt,
  Sparkles,
} from "lucide-react";
import { inr } from "@/lib/utils";
import { CollectionLine, Customer } from "@/lib/services/guest-workspace-service";
import { SheetRowItem } from "./record-collection-modal";
import { RouteSettlementAnalytics } from "./stop-route-modal";

export function Level3SheetView({
  activeLine,
  selectedDate,
  selectedDateFrom,
  selectedDateTo,
  activeDayTab,
  setActiveDayTab,
  searchQuery,
  setSearchQuery,
  filteredSheetRows,
  customers,
  loading,
  savingRowId,
  isRouteStarted,
  routeOpeningCash,
  settlementAnalytics,
  onBackToCycles,
  onStartRouteClick,
  onStopRouteClick,
  onAddCustomerClick,
  onEditCustomerClick,
  onOpenConfirmModal,
  onSkipRow,
}: {
  activeLine: CollectionLine;
  selectedDate: string;
  selectedDateFrom: string;
  selectedDateTo: string;
  activeDayTab: string;
  setActiveDayTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredSheetRows: SheetRowItem[];
  customers: Customer[];
  loading: boolean;
  savingRowId: string | null;
  isRouteStarted: boolean;
  routeOpeningCash: number;
  settlementAnalytics?: RouteSettlementAnalytics;
  onBackToCycles: () => void;
  onStartRouteClick: () => void;
  onStopRouteClick: () => void;
  onAddCustomerClick: () => void;
  onEditCustomerClick: (customer: Customer) => void;
  onOpenConfirmModal: (row: SheetRowItem) => void;
  onSkipRow: (row: SheetRowItem) => void;
}) {
  // Financial Summary Totals
  const totalExpected = filteredSheetRows.reduce(
    (acc, r) => acc + (parseFloat(String(r.expected_amount)) || 0),
    0
  );
  const totalCollected = filteredSheetRows.reduce(
    (acc, r) => acc + (parseFloat(String(r.collected_amount)) || 0),
    0
  );
  const totalRemaining = Math.max(0, totalExpected - totalCollected);

  const activeDaySchedules = activeLine.day_schedules || [];
  const isSettled = !!settlementAnalytics?.isSettled;

  // Calculate cycle range based ONLY on configured days
  const configuredCycleRangeText = useMemo(() => {
    const configuredDays = activeDaySchedules.map((s) => s.day_of_week.toLowerCase());
    
    if (configuredDays.length > 0 && selectedDateFrom && selectedDateTo) {
      const startD = new Date(selectedDateFrom + "T00:00:00");
      const endD = new Date(selectedDateTo + "T00:00:00");
      const validDates: string[] = [];

      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const name = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (configuredDays.includes(name)) {
          validDates.push(d.toISOString().slice(0, 10));
        }
      }

      if (validDates.length === 1) {
        return validDates[0];
      } else if (validDates.length > 1) {
        validDates.sort();
        return `${validDates[0]} to ${validDates[validDates.length - 1]}`;
      }
    }

    if (selectedDateFrom === selectedDateTo || !selectedDateTo) {
      return selectedDateFrom || selectedDate;
    }
    return `${selectedDateFrom} to ${selectedDateTo}`;
  }, [activeDaySchedules, selectedDateFrom, selectedDateTo, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Level 3 Breadcrumb Header & Summary */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToCycles}
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1 px-0 self-start"
          >
            <ArrowLeft className="size-4" /> Back to Route Cycles
          </Button>

          {/* Distinct 3-State Route Status Indicators */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {isSettled ? (
              <Badge className="bg-emerald-600 text-white font-black text-xs px-3 py-1 gap-1.5 shadow-xs">
                <CheckCircle2 className="size-3.5" /> Route Settled & Closed
              </Badge>
            ) : isRouteStarted ? (
              <>
                <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 gap-1.5 shadow-xs animate-pulse">
                  <Play className="size-3.5 fill-current" /> Active (Opening: {inr(routeOpeningCash)})
                </Badge>
                
                {/* Floating Info Tooltip Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-xl text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/30"
                      title="Route Information"
                    >
                      <Info className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs p-3 font-semibold border-emerald-500/30 w-72 shadow-lg">
                    <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold mb-1">
                      <Play className="size-3.5 fill-current" /> Active Route Session
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      Route session active & in progress. Log collections below and click <strong>Stop Route</strong> when finished to settle cash bag.
                    </p>
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={onStopRouteClick}
                  size="sm"
                  variant="destructive"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-xs rounded-xl"
                  title="Stop Route & Settle Session"
                >
                  <Square className="size-3.5 fill-current" /> Stop Route
                </Button>
              </>
            ) : (
              <>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-xs px-3 py-1 gap-1.5">
                  <Clock className="size-3.5 text-amber-600" /> Route Not Started
                </Badge>

                {/* Floating Info Tooltip Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-xl text-amber-600 hover:bg-amber-500/10 border border-amber-500/30"
                      title="Route Information"
                    >
                      <Info className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs p-3 font-semibold border-amber-500/30 w-72 shadow-lg">
                    <p className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold mb-1">
                      <Clock className="size-3.5" /> Route Session Not Started
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      Route session not started yet. Click <strong>Start Route Collection</strong> to enter opening cash float.
                    </p>
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={onStartRouteClick}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs rounded-xl"
                >
                  <Play className="size-3.5 fill-current" /> Start Route Collection
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Closed & Settled Analytics Banner */}
        {isSettled && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" /> Session Status: Closed & Settled
              </span>
              <Badge className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-0.5">
                {inr(settlementAnalytics.netHandCash)} Net Handover Cash
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Opening Cash</span>
                <span className="font-bold text-foreground">{inr(settlementAnalytics.openingCash)}</span>
              </div>
              <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Collected</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{inr(settlementAnalytics.totalCollected)}</span>
              </div>
              <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                <span className="text-[9px] text-rose-600 dark:text-rose-400 uppercase font-bold block">Disbursed</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{inr(settlementAnalytics.totalDisbursed)}</span>
              </div>
              <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Expenses</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{inr(settlementAnalytics.totalExpenses)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <CalendarDays className="size-6 text-primary" /> Daily Sheet for {activeLine.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cycle Range: <strong>{configuredCycleRangeText}</strong>
            </p>
          </div>

          <Button
            onClick={onAddCustomerClick}
            size="sm"
            className="bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-xs rounded-xl self-start sm:self-auto"
          >
            <UserPlus className="size-4" /> Add Borrower to Line
          </Button>
        </div>

        {/* Dynamic Financial Summary Cards (Rendered in ONE Single Row) */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-muted/50 border border-border text-center overflow-hidden">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold block truncate">Total Expected</span>
            <span className="text-xs sm:text-base font-black font-mono text-foreground block truncate">{inr(totalExpected)}</span>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center overflow-hidden">
            <span className="text-[9px] sm:text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block truncate">Collected Today</span>
            <span className="text-xs sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 block truncate">{inr(totalCollected)}</span>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center overflow-hidden">
            <span className="text-[9px] sm:text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block truncate">Remaining Pending</span>
            <span className="text-xs sm:text-base font-black font-mono text-amber-600 dark:text-amber-400 block truncate">{inr(totalRemaining)}</span>
          </div>
        </div>

        {/* Multi-Session Day Tab Switcher (For Route Lines with multiple sessions) */}
        {activeDaySchedules.length > 1 && (
          <div className="pt-2">
            <Tabs value={activeDayTab} onValueChange={setActiveDayTab} className="w-full">
              <TabsList className="flex items-center gap-1.5 w-full overflow-x-auto bg-muted/60 p-1.5 rounded-2xl no-scrollbar">
                <TabsTrigger value="all" className="rounded-xl font-bold text-xs shrink-0 whitespace-nowrap px-3 py-1.5">
                  🌟 All Sessions ({filteredSheetRows.length})
                </TabsTrigger>
                {activeDaySchedules.map((s) => {
                  const dayNameCap = s.day_of_week.charAt(0).toUpperCase() + s.day_of_week.slice(1);
                  const portionText = s.portion === "morning" ? "☀️ Morning" : s.portion === "afternoon" ? "🌙 Afternoon" : "🌕 Full";
                  return (
                    <TabsTrigger key={s.day_of_week} value={s.day_of_week.toLowerCase()} className="rounded-xl font-bold text-xs capitalize shrink-0 whitespace-nowrap px-3 py-1.5">
                      {dayNameCap} ({portionText})
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative pt-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search borrower by name, code, or sequence #..."
            className="pl-10 h-10 font-semibold text-xs rounded-xl bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            onClick={onAddCustomerClick}
            size="sm"
            className="bg-primary text-primary-foreground font-bold gap-1.5"
          >
            <UserPlus className="size-4" /> Add First Borrower
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredSheetRows.map((row) => {
            const isSkipped = row.is_saved && (parseFloat(row.collected_amount) === 0 || row.status_id === 5);
            const isCollected = row.is_saved && parseFloat(row.collected_amount) > 0;

            return (
              <Card
                key={row.customer_id}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all space-y-1.5 ${
                  isCollected
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : isSkipped
                    ? "bg-rose-500/5 border-rose-500/30"
                    : "bg-card border-border shadow-xs"
                }`}
              >
                {/* Row 1: ID, Name, Code + Status Badge + Pencil Icon */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[11px] font-black border border-primary/20 shrink-0">
                      #{row.sequence_number}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{row.full_name}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">({row.customer_code})</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Saved Status Badge */}
                    {isCollected ? (
                      <Badge className="bg-emerald-600 text-white text-[9px] font-bold py-0 px-1.5 gap-0.5 shadow-xs">
                        <CheckCircle2 className="size-2.5" /> {inr(parseFloat(row.collected_amount))}
                      </Badge>
                    ) : isSkipped ? (
                      <Badge className="bg-rose-600 text-white text-[9px] font-bold py-0 px-1.5 gap-0.5 shadow-xs">
                        <XCircle className="size-2.5" /> Skipped
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-semibold text-muted-foreground py-0 px-1.5">
                        Pending
                      </Badge>
                    )}

                    {/* Single Pencil Icon Edit Button at Top Right */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                      title="Edit Borrower Profile"
                      onClick={() => {
                        const targetCust = customers.find((c) => c.public_id === row.customer_id);
                        if (targetCust) onEditCustomerClick(targetCust);
                      }}
                    >
                      <Pencil className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Row 2: Phone + Collection Day (Left) | Expected Amount (Right) */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="truncate">Phone: <strong className="font-mono text-foreground">{row.mobile_number}</strong></span>
                    {row.collection_day && (
                      <>
                        <span>•</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20 capitalize text-[9px] font-bold py-0 px-1 shrink-0">
                          {row.collection_day}
                        </Badge>
                      </>
                    )}
                  </div>

                  <div className="shrink-0 font-semibold text-[11px]">
                    Exp: <strong className="font-mono font-bold text-foreground text-xs">{inr(row.expected_amount)}</strong>
                  </div>
                </div>

                {/* Row 3: 50% / 50% Full-Width Action Buttons (Tick ✓ & Cross X Icon-Only) */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {/* Tick Button (✓) - 50% Width, Icon-Only */}
                  <Button
                    disabled={savingRowId === row.customer_id}
                    onClick={() => onOpenConfirmModal(row)}
                    className="h-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xs transition-all active:scale-95 flex items-center justify-center"
                    title="Collect Payment (✓)"
                  >
                    {savingRowId === row.customer_id ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-4 stroke-[3]" />
                    )}
                  </Button>

                  {/* Cross Button (X) - 50% Width, Icon-Only */}
                  <Button
                    disabled={savingRowId === row.customer_id}
                    onClick={() => onSkipRow(row)}
                    className="h-8 w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-xs transition-all active:scale-95 flex items-center justify-center"
                    title="Skip for Week (X)"
                  >
                    {savingRowId === row.customer_id ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-4 stroke-[3]" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
