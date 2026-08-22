import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CalendarDays,
  Play,
  Square,
  CheckCircle2,
  UserPlus,
  Search,
  Users,
  Edit3,
  Check,
  X,
  XCircle,
  RefreshCw,
  Wallet,
  IndianRupee,
} from "lucide-react";
import { inr } from "@/lib/utils";
import { CollectionLine, Customer } from "@/lib/services/guest-workspace-service";
import { SheetRowItem } from "./record-collection-modal";

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

  return (
    <div className="space-y-6">
      {/* Level 3 Breadcrumb Header */}
      <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToCycles}
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1 px-0"
          >
            <ArrowLeft className="size-4" /> Back to Route Cycles
          </Button>

          {/* Route Active Status Indicator & Actions */}
          <div className="flex items-center gap-2">
            {isRouteStarted ? (
              <>
                <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 gap-1.5 shadow-xs">
                  <CheckCircle2 className="size-3.5" /> Route Active (Opening Cash: {inr(routeOpeningCash)})
                </Badge>
                <Button
                  onClick={onStopRouteClick}
                  size="sm"
                  variant="destructive"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-xs rounded-xl"
                  title="Stop Route Collection"
                >
                  <Square className="size-3.5 fill-current" /> Stop Route
                </Button>
              </>
            ) : (
              <Button
                onClick={onStartRouteClick}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs rounded-xl"
              >
                <Play className="size-3.5 fill-current" /> Start Route Collection
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <CalendarDays className="size-6 text-primary" /> Daily Sheet for {activeLine.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cycle Range: <strong>{selectedDateFrom || selectedDate}</strong> to <strong>{selectedDateTo || selectedDate}</strong>
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

        {/* Dynamic Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Expected</span>
            <span className="text-base font-black font-mono text-foreground">{inr(totalExpected)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Collected Today</span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{inr(totalCollected)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">Remaining Pending</span>
            <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">{inr(totalRemaining)}</span>
          </div>
        </div>

        {/* Multi-Session Day Tab Switcher (For Route Lines with multiple sessions) */}
        {activeDaySchedules.length > 1 && (
          <div className="pt-2">
            <Tabs value={activeDayTab} onValueChange={setActiveDayTab} className="w-full">
              <TabsList className="grid grid-cols-3 sm:grid-cols-4 w-full h-11 rounded-2xl bg-muted/60 p-1">
                <TabsTrigger value="all" className="rounded-xl font-bold text-xs">
                  🌟 All Sessions Combined ({filteredSheetRows.length})
                </TabsTrigger>
                {activeDaySchedules.map((s) => {
                  const dayNameCap = s.day_of_week.charAt(0).toUpperCase() + s.day_of_week.slice(1);
                  const portionText = s.portion === "morning" ? "☀️ Morning" : s.portion === "afternoon" ? "🌙 Afternoon" : "🌕 Full";
                  return (
                    <TabsTrigger key={s.day_of_week} value={s.day_of_week.toLowerCase()} className="rounded-xl font-bold text-xs capitalize">
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
        <div className="space-y-3">
          {filteredSheetRows.map((row) => {
            const isSkipped = row.is_saved && (parseFloat(row.collected_amount) === 0 || row.status_id === 5);
            const isCollected = row.is_saved && parseFloat(row.collected_amount) > 0;

            return (
              <Card
                key={row.customer_id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCollected
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : isSkipped
                    ? "bg-rose-500/5 border-rose-500/30"
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground">{row.full_name}</h4>
                        <span className="text-[11px] font-mono text-muted-foreground">({row.customer_code})</span>
                        {row.collection_day && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 capitalize text-[10px] font-bold gap-1 py-0.5">
                            <CalendarDays className="size-3" /> {row.collection_day}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Phone: <span className="font-mono text-foreground">{row.mobile_number}</span>
                      </p>
                    </div>
                  </div>

                  {/* Financial Badges & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right pr-1">
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Expected</span>
                      <span className="text-sm font-bold font-mono text-foreground">{inr(row.expected_amount)}</span>
                    </div>

                    {/* Saved Collection Status Badge */}
                    {isCollected ? (
                      <Badge className="bg-emerald-600 text-white text-xs font-bold py-1 px-2.5 gap-1 shadow-xs">
                        <CheckCircle2 className="size-3.5" /> Collected {inr(parseFloat(row.collected_amount))}
                      </Badge>
                    ) : isSkipped ? (
                      <Badge className="bg-rose-600 text-white text-xs font-bold py-1 px-2.5 gap-1 shadow-xs">
                        <XCircle className="size-3.5" /> Skipped for Week
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs font-semibold text-muted-foreground py-1">
                        Pending
                      </Badge>
                    )}

                    {/* Quick Profile Edit Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs px-2.5 font-bold"
                      onClick={() => {
                        const targetCust = customers.find((c) => c.public_id === row.customer_id);
                        if (targetCust) onEditCustomerClick(targetCust);
                      }}
                    >
                      <Edit3 className="size-3.5 mr-1" /> Profile
                    </Button>

                    {/* Action Buttons: Tick (✓) & Cross (X) */}
                    <div className="flex items-center gap-2">
                      {/* Tick Button (✓) - Opens Collection Confirmation Modal */}
                      <Button
                        size="sm"
                        disabled={savingRowId === row.customer_id}
                        onClick={() => onOpenConfirmModal(row)}
                        className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm gap-1 shadow-xs transition-all active:scale-95"
                        title="Collect Payment"
                      >
                        {savingRowId === row.customer_id ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="size-4 stroke-[3]" /> Log
                          </>
                        )}
                      </Button>

                      {/* Cross Button (X) - Skips Week */}
                      <Button
                        size="sm"
                        disabled={savingRowId === row.customer_id}
                        onClick={() => onSkipRow(row)}
                        className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-sm gap-1 shadow-xs transition-all active:scale-95"
                        title="Skip for Week"
                      >
                        {savingRowId === row.customer_id ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <>
                            <X className="size-4 stroke-[3]" /> Skip
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
