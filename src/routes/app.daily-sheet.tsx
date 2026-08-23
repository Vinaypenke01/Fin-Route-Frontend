import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  CalendarDays,
  Plus,
  Play,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { inr } from "@/lib/utils";

// Import Modular Level View Components & Modals
import { Level1LinesView } from "@/components/daily-sheet/level1-lines-view";
import { Level2DaysView, RouteCycleItem } from "@/components/daily-sheet/level2-days-view";
import { Level3SheetView } from "@/components/daily-sheet/level3-sheet-view";
import { RecordCollectionModal, SheetRowItem } from "@/components/daily-sheet/record-collection-modal";
import { DailySheetAddCustomerModal } from "@/components/daily-sheet/add-customer-modal";
import { StopRouteSettlementModal, RouteSettlementAnalytics } from "@/components/daily-sheet/stop-route-modal";

export interface DailySheetSearch {
  view?: "lines" | "days" | "customers";
  lineId?: string;
  dateFrom?: string;
  dateTo?: string;
  dayTab?: string;
}

export const Route = createFileRoute("/app/daily-sheet")({
  validateSearch: (search: Record<string, unknown>): DailySheetSearch => ({
    view: (search.view as any) || "lines",
    lineId: (search.lineId as string) || "",
    dateFrom: (search.dateFrom as string) || "",
    dateTo: (search.dateTo as string) || "",
    dayTab: (search.dayTab as string) || "all",
  }),
  component: DailySheetPage,
});

function DailySheetPage() {
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const todayStr = getTodayStr();

  // Router Search Parameters for URL State Persistence & Page Refresh Support
  const search = useSearch({ from: "/app/daily-sheet" });
  const navigate = useNavigate({ from: "/app/daily-sheet" });

  const currentView = search.view || "lines";
  const activeLineId = search.lineId || "";
  const selectedDateFrom = search.dateFrom || todayStr;
  const selectedDateTo = search.dateTo || todayStr;
  const activeDayTab = search.dayTab || "all";
  const selectedDate = selectedDateFrom || todayStr;

  // Data States
  const [lines, setLines] = useState<CollectionLine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [statuses, setStatuses] = useState<MasterItem[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);

  // Active Line Derived State
  const activeLine = useMemo(() => {
    if (!activeLineId) return null;
    return lines.find((l) => l.public_id === activeLineId) || null;
  }, [lines, activeLineId]);

  // Search Query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sheet Rows State & UI Loading
  const [sheetRows, setSheetRows] = useState<SheetRowItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Modals State
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState<boolean>(false);
  const [lineToEdit, setLineToEdit] = useState<CollectionLine | null>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState<boolean>(false);
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState<boolean>(false);
  const [isStartRouteModalOpen, setIsStartRouteModalOpen] = useState<boolean>(false);
  const [isStopRouteModalOpen, setIsStopRouteModalOpen] = useState<boolean>(false);
  const [openingCashInput, setOpeningCashInput] = useState<string>("0");
  const [customDateInput, setCustomDateInput] = useState<string>(todayStr);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmCollectionRow, setConfirmCollectionRow] = useState<SheetRowItem | null>(null);

  // Route Started Active Tracking State (Persisted in localStorage across page refreshes & sessions)
  const [routeStartedMap, setRouteStartedMap] = useState<
    Record<string, { isStarted: boolean; openingCash: number }>
  >(() => {
    try {
      const saved = localStorage.getItem("finroute_active_routes_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Route Settlement Analytics State (Persisted in localStorage across sessions)
  const [settlementMap, setSettlementMap] = useState<Record<string, RouteSettlementAnalytics>>(() => {
    try {
      const saved = localStorage.getItem("finroute_settlement_analytics_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleStartRouteConfirm = (openingCash: number) => {
    if (!activeLine) return;
    const cycleKey = `${activeLine.public_id}_${selectedDateFrom}_${selectedDateTo}`;
    const singleKey = `${activeLine.public_id}_${activeDayTab === "all" ? selectedDateFrom : activeDayTab}`;

    const nextMap = {
      ...routeStartedMap,
      [cycleKey]: { isStarted: true, openingCash },
      [singleKey]: { isStarted: true, openingCash },
    };
    setRouteStartedMap(nextMap);
    try {
      localStorage.setItem("finroute_active_routes_map", JSON.stringify(nextMap));
    } catch (e) {
      console.error("Failed to save active route state:", e);
    }
    toast.success(`▶️ Route collection started for ${activeLine.name}!`);
    setIsStartRouteModalOpen(false);
  };

  const handleStopRoute = () => {
    if (!activeLine) return;
    setIsStopRouteModalOpen(true);
  };

  const handleConfirmSettlement = (analytics: RouteSettlementAnalytics) => {
    if (!activeLine) return;
    const cycleKey = `${activeLine.public_id}_${selectedDateFrom}_${selectedDateTo}`;
    const singleDateKey = `${activeLine.public_id}_${selectedDate}_${selectedDate}`;

    const nextMap = {
      ...settlementMap,
      [cycleKey]: analytics,
      [singleDateKey]: analytics,
    };
    setSettlementMap(nextMap);
    try {
      localStorage.setItem("finroute_settlement_analytics_map", JSON.stringify(nextMap));
    } catch (e) {
      console.error("Failed to save settlement analytics:", e);
    }

    // Stop active route state for cycle, single, and fallback keys
    const singleKey = `${activeLine.public_id}_${activeDayTab === "all" ? selectedDateFrom : activeDayTab}`;
    const fallbackKey = `${activeLine.public_id}_${selectedDate}`;
    const nextRouteMap = { ...routeStartedMap };
    delete nextRouteMap[cycleKey];
    delete nextRouteMap[singleKey];
    delete nextRouteMap[fallbackKey];
    setRouteStartedMap(nextRouteMap);
    try {
      localStorage.setItem("finroute_active_routes_map", JSON.stringify(nextRouteMap));
    } catch (e) {}

    setIsStopRouteModalOpen(false);
    toast.success(`Route session closed & settled! Net closing hand cash float: ${inr(analytics.netHandCash)}`);
  };

  // Navigation URL Updater helper
  const updateNav = (params: Partial<DailySheetSearch>) => {
    navigate({
      search: (prev: DailySheetSearch) => ({
        ...prev,
        ...params,
      }),
      replace: true,
    });
  };

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
      const resolvedTabDate = getSaveDateForRow({ collection_day: activeDayTab } as any);
      const fetchFrom = activeDayTab === "all" ? selectedDateFrom : resolvedTabDate;
      const fetchTo = activeDayTab === "all" ? selectedDateTo : resolvedTabDate;

      const [custRes, collectionsRes] = await Promise.all([
        guestWorkspaceService.getCustomers({
          status: "active",
          line: activeLine.public_id,
          page_size: 1000,
        }),
        guestWorkspaceService.getCollections({
          date_from: fetchFrom || selectedDate,
          date_to: fetchTo || selectedDate,
          line: activeLine.public_id,
        }),
      ]);

      const fetchedCusts = custRes.data || [];
      setCustomers(fetchedCusts);

      // Filter customers by activeDayTab if viewing a specific session day (e.g. Sunday or Saturday)
      let displayCusts = fetchedCusts;
      if (activeDayTab !== "all") {
        let targetDay = activeDayTab.toLowerCase();
        if (/^\d{4}-\d{2}-\d{2}$/.test(activeDayTab)) {
          const dObj = new Date(activeDayTab);
          if (!isNaN(dObj.getTime())) {
            targetDay = dObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          }
        }
        displayCusts = fetchedCusts.filter(
          (c) => c.collection_day && c.collection_day.toLowerCase() === targetDay
        );
      }

      const colMap: Record<string, Collection> = {};
      (collectionsRes.data || []).forEach((col) => {
        if (col.customer_public_id) {
          colMap[col.customer_public_id] = col;
        }
      });

      const defaultStatusId = statuses[0]?.id || 1;
      const defaultModeId = paymentModes[0]?.id || 1;

      const rows: SheetRowItem[] = displayCusts.map((c) => {
        const existingCol = colMap[c.public_id];
        const expAmt = c.installment_amount || c.loan_amount || 0;

        return {
          customer_id: c.public_id,
          customer_code: c.customer_code,
          sequence_number: c.sequence_number ?? "-",
          full_name: c.full_name,
          mobile_number: c.mobile_number,
          collection_day: c.collection_day || "",
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

      // Auto-recalculate settlement analytics if route was already settled for this line/date
      if (activeLine) {
        const cycleSettlementKey = `${activeLine.public_id}_${selectedDateFrom}_${selectedDateTo}`;
        const singleSettlementKey = `${activeLine.public_id}_${selectedDate}_${selectedDate}`;
        const existingSettlement = settlementMap[cycleSettlementKey] || settlementMap[singleSettlementKey];

        if (existingSettlement?.isSettled) {
          const liveColSum = Object.values(colMap).reduce(
            (acc, col) => acc + (parseFloat(String(col.collected_amount)) || 0),
            0
          );
          const liveDisbursedSum = fetchedCusts.reduce((acc, c) => {
            const createdD = (c.start_date || (c as any).created_at || "").slice(0, 10);
            if (createdD >= selectedDateFrom && createdD <= selectedDateTo) {
              return acc + (parseFloat(String(c.disbursed_amount || c.loan_amount)) || 0);
            }
            return acc;
          }, 0);

          const updatedAnalytics: RouteSettlementAnalytics = {
            ...existingSettlement,
            totalCollected: liveColSum,
            totalDisbursed: liveDisbursedSum,
            netHandCash: existingSettlement.openingCash + liveColSum - liveDisbursedSum - existingSettlement.totalExpenses,
          };

          setSettlementMap((prev) => {
            const nextMap = {
              ...prev,
              [cycleSettlementKey]: updatedAnalytics,
              [singleSettlementKey]: updatedAnalytics,
            };
            try {
              localStorage.setItem("finroute_settlement_analytics_map", JSON.stringify(nextMap));
            } catch (e) {}
            return nextMap;
          });
        }
      }
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
  }, [currentView, activeLine, selectedDateFrom, selectedDateTo, activeDayTab]);

  // Helper to dynamically resolve collection date for customer row based on collection_day
  const getSaveDateForRow = (row: SheetRowItem): string => {
    if (activeDayTab !== "all" && /^\d{4}-\d{2}-\d{2}$/.test(activeDayTab)) {
      return activeDayTab;
    }
    if (row.collection_day && selectedDateFrom && selectedDateTo) {
      const targetDayName = row.collection_day.toLowerCase();
      const startD = new Date(selectedDateFrom);
      const endD = new Date(selectedDateTo);

      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const dayOfWeekName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (dayOfWeekName === targetDayName) {
          return d.toISOString().slice(0, 10);
        }
      }
    }
    return selectedDateFrom || selectedDate;
  };

  // Handle Skipping an Installment (X Button Click)
  const handleSkipRow = async (row: SheetRowItem) => {
    if (!isRouteStarted && !currentSettlement?.isSettled) {
      toast.info("Please start route collection and enter opening cash float first!");
      setIsStartRouteModalOpen(true);
      return;
    }

    setSavingRowId(row.customer_id);
    try {
      const saveDate = getSaveDateForRow(row);
      const skippedStatusObj = statuses.find(
        (s) => s.code === "skipped" || s.name.toLowerCase().includes("skip")
      ) || statuses[statuses.length - 1];
      const statusId = skippedStatusObj ? skippedStatusObj.id : 5;

      if (row.collection_id) {
        await guestWorkspaceService.updateCollection(row.collection_id, {
          collected_amount: 0,
          status: statusId,
          payment_mode: row.payment_mode_id,
          remarks: "Skipped for week",
        });
      } else {
        await guestWorkspaceService.recordCollection({
          customer: row.customer_id,
          collection_date: saveDate,
          expected_amount: row.expected_amount,
          collected_amount: 0,
          status: statusId,
          payment_mode: row.payment_mode_id,
          remarks: "Skipped for week",
        });
      }

      toast.error(`Installment skipped for ${row.full_name}.`);
      loadSheetData();
    } catch (err: any) {
      console.error("Failed to skip collection:", err);
      toast.error(err?.message || "Failed to skip installment.");
    } finally {
      setSavingRowId(null);
    }
  };

  // Handle Confirming Payment from Popup Modal (✓ Button Click -> Modal -> Confirm)
  const handleConfirmCollection = async (
    row: SheetRowItem,
    collectedAmt: number,
    paymentModeId: number,
    remarks: string
  ) => {
    if (isNaN(collectedAmt) || collectedAmt < 0) {
      toast.error(`Invalid collection amount. Must be ≥ ₹0.`);
      return;
    }

    setSavingRowId(row.customer_id);
    try {
      const saveDate = getSaveDateForRow(row);
      const paidStatusObj = statuses.find(
        (s) => s.code === "paid" || s.name.toLowerCase().includes("paid")
      ) || statuses[0];
      const statusId = paidStatusObj ? paidStatusObj.id : 1;

      if (row.collection_id) {
        await guestWorkspaceService.updateCollection(row.collection_id, {
          collected_amount: collectedAmt,
          status: statusId,
          payment_mode: paymentModeId,
          remarks: remarks || "Daily Sheet collection entry",
        });
      } else {
        await guestWorkspaceService.recordCollection({
          customer: row.customer_id,
          collection_date: saveDate || selectedDate,
          expected_amount: row.expected_amount,
          collected_amount: collectedAmt,
          status: statusId,
          payment_mode: paymentModeId,
          remarks: remarks || "Daily Sheet collection entry",
        });
      }

      toast.success(`Payment of ${inr(collectedAmt)} logged for ${row.full_name}!`);
      setConfirmCollectionRow(null);
      loadSheetData();
    } catch (err: any) {
      console.error("Failed to save collection:", err);
      toast.error(err?.message || "Failed to save collection.");
    } finally {
      setSavingRowId(null);
    }
  };

  const [customDatesList, setCustomDatesList] = useState<string[]>([]);

  // Date/Cycle Generator for Level 2 (Days & Cycles View)
  const availableCycles = useMemo(() => {
    const cycles: RouteCycleItem[] = [];

    const now = new Date();
    const configuredDays = (activeLine?.day_schedules || []).map((s) => s.day_of_week.toLowerCase());
    const lineStartDate = activeLine?.created_at ? activeLine.created_at.slice(0, 10) : null;

    // Fallback: If line has no configured days, show daily cards
    if (configuredDays.length === 0) {
      for (let i = 0; i >= -14; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        const dStr = d.toISOString().slice(0, 10);
        if (lineStartDate && dStr < lineStartDate) break;

        let lbl = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
        if (i === 0) lbl = `Today (${lbl})`;
        cycles.push({
          dateFrom: dStr,
          dateTo: dStr,
          label: lbl,
          subLabel: "Daily Session",
          isCurrent: i === 0,
          daysCount: 1,
        });
      }
      return cycles;
    }

    // Generate Weekly Cycles (from +1 week in future down to -8 weeks in past)
    for (let w = 1; w >= -8; w--) {
      const curr = new Date(now);
      const dayOfWeek = curr.getDay(); // 0 = Sunday
      const distanceToMon = (dayOfWeek + 6) % 7; // Days since Monday
      const mondayOfWeek = new Date(curr);
      mondayOfWeek.setDate(curr.getDate() - distanceToMon + w * 7);

      const weekDates: { dateStr: string; dayName: string; dateObj: Date }[] = [];
      for (let d = 0; d < 7; d++) {
        const checkD = new Date(mondayOfWeek);
        checkD.setDate(mondayOfWeek.getDate() + d);
        const checkStr = checkD.toISOString().slice(0, 10);
        const name = checkD.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (configuredDays.includes(name)) {
          weekDates.push({ dateStr: checkStr, dayName: name, dateObj: checkD });
        }
      }

      if (weekDates.length === 0) continue;

      weekDates.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
      const minDateStr = weekDates[0].dateStr;
      const maxDateStr = weekDates[weekDates.length - 1].dateStr;

      if (lineStartDate && maxDateStr < lineStartDate) continue;

      let cycleLabel = "";
      if (weekDates.length === 1) {
        cycleLabel = weekDates[0].dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      } else {
        const fromFmt = weekDates[0].dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const toFmt = weekDates[weekDates.length - 1].dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        cycleLabel = `${fromFmt} - ${toFmt}`;
      }

      let subLbl = `Weekly Route Cycle (${weekDates.length} Days)`;
      let isCurrentCycle = false;
      let isUpcomingCycle = false;

      if (w === 0) {
        subLbl = `Current Week (${weekDates.length} Days)`;
        isCurrentCycle = true;
      } else if (w === 1) {
        subLbl = "Upcoming Week";
        isUpcomingCycle = true;
      } else {
        subLbl = `Past Route (${Math.abs(w)} week${Math.abs(w) > 1 ? "s" : ""} ago)`;
      }

      cycles.push({
        dateFrom: minDateStr,
        dateTo: maxDateStr,
        label: cycleLabel,
        subLabel: subLbl,
        isCurrent: isCurrentCycle,
        isUpcoming: isUpcomingCycle,
        daysCount: weekDates.length,
      });
    }

    // Add Custom Selected Dates
    customDatesList.forEach((cD) => {
      if (!cycles.some((c) => c.dateFrom <= cD && cD <= c.dateTo)) {
        const dObj = new Date(cD);
        const cLbl = dObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        cycles.push({
          dateFrom: cD,
          dateTo: cD,
          label: `Custom Date (${cLbl})`,
          subLabel: "Custom Selected Session",
          isCurrent: cD === todayStr,
          daysCount: 1,
        });
      }
    });

    // Attach settlement analytics from settlementMap
    cycles.forEach((c) => {
      if (activeLine) {
        const k = `${activeLine.public_id}_${c.dateFrom}_${c.dateTo}`;
        const singleK = `${activeLine.public_id}_${c.dateFrom}_${c.dateFrom}`;
        c.settlementAnalytics = settlementMap[k] || settlementMap[singleK];
      }
    });

    return cycles;
  }, [activeLine, customDatesList, todayStr, settlementMap]);

  // Filtered Sheet Rows
  const filteredSheetRows = useMemo(() => {
    if (!searchQuery.trim()) return sheetRows;
    const q = searchQuery.toLowerCase().trim();
    return sheetRows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.customer_code.toLowerCase().includes(q) ||
        r.mobile_number.includes(q) ||
        String(r.sequence_number).includes(q)
    );
  }, [sheetRows, searchQuery]);

  // Route Started state for activeLine & date (Supports both multi-day 2-day cycles and single day tabs)
  const cycleRouteKey = activeLine ? `${activeLine.public_id}_${selectedDateFrom}_${selectedDateTo}` : "";
  const singleRouteKey = activeLine ? `${activeLine.public_id}_${activeDayTab === "all" ? selectedDateFrom : activeDayTab}` : "";
  const activeRouteTrack = routeStartedMap[cycleRouteKey] || routeStartedMap[singleRouteKey];
  const isRouteStarted = !!activeRouteTrack?.isStarted;
  const routeOpeningCash = activeRouteTrack?.openingCash || 0;
  const cycleSettlementKey = activeLine ? `${activeLine.public_id}_${selectedDateFrom}_${selectedDateTo}` : "";
  const singleSettlementKey = activeLine ? `${activeLine.public_id}_${selectedDate}_${selectedDate}` : "";
  const currentSettlement = settlementMap[cycleSettlementKey] || settlementMap[singleSettlementKey];

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      {/* ========================================================================= */}
      {/* LEVEL 1: LINES LIST VIEW */}
      {/* ========================================================================= */}
      {currentView === "lines" && (
        <Level1LinesView
          lines={lines}
          loading={loading}
          onSelectLine={(line) => {
            updateNav({ view: "days", lineId: line.public_id });
          }}
          onAddLineClick={() => {
            setLineToEdit(null);
            setIsAddLineModalOpen(true);
          }}
          onEditLineClick={(line, e) => {
            e.stopPropagation();
            setLineToEdit(line);
            setIsAddLineModalOpen(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: DAYS & ROUTE CYCLES VIEW */}
      {/* ========================================================================= */}
      {currentView === "days" && activeLine && (
        <Level2DaysView
          activeLine={activeLine}
          availableCycles={availableCycles}
          onBackToLines={() => {
            updateNav({ view: "lines", lineId: "", dateFrom: "", dateTo: "", dayTab: "all" });
          }}
          onSelectCycle={(cycle) => {
            updateNav({
              view: "customers",
              lineId: activeLine.public_id,
              dateFrom: cycle.dateFrom,
              dateTo: cycle.dateTo,
              dayTab: "all",
            });
          }}
          onAddCustomDateClick={() => setIsAddDateModalOpen(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: BORROWER COLLECTION SHEET VIEW */}
      {/* ========================================================================= */}
      {currentView === "customers" && activeLine && (
        <Level3SheetView
          activeLine={activeLine}
          selectedDate={selectedDate}
          selectedDateFrom={selectedDateFrom}
          selectedDateTo={selectedDateTo}
          activeDayTab={activeDayTab}
          setActiveDayTab={(tab) => updateNav({ dayTab: tab })}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredSheetRows={filteredSheetRows}
          customers={customers}
          loading={loading}
          savingRowId={savingRowId}
          isRouteStarted={isRouteStarted}
          routeOpeningCash={routeOpeningCash}
          settlementAnalytics={currentSettlement}
          onBackToCycles={() => updateNav({ view: "days" })}
          onStartRouteClick={() => setIsStartRouteModalOpen(true)}
          onStopRouteClick={handleStopRoute}
          onAddCustomerClick={() => {
            if (!isRouteStarted && !currentSettlement?.isSettled) {
              toast.info("Please start route collection and enter opening cash float first!");
              setIsStartRouteModalOpen(true);
              return;
            }
            setIsAddCustomerModalOpen(true);
          }}
          onEditCustomerClick={(cust) => setEditingCustomer(cust)}
          onOpenConfirmModal={(row) => {
            if (!isRouteStarted && !currentSettlement?.isSettled) {
              toast.info("Please start route collection and enter opening cash float first!");
              setIsStartRouteModalOpen(true);
              return;
            }
            setConfirmCollectionRow(row);
          }}
          onSkipRow={(row) => handleSkipRow(row)}
        />
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
                  setIsAddDateModalOpen(false);
                  if (activeLine) {
                    updateNav({
                      view: "customers",
                      lineId: activeLine.public_id,
                      dateFrom: customDateInput,
                      dateTo: customDateInput,
                      dayTab: "all",
                    });
                  }
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
              handleStartRouteConfirm(parseFloat(openingCashInput) || 0);
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

      {/* Collection Confirmation Popup Modal (Triggered by Tick ✓ Button) */}
      {confirmCollectionRow && (
        <RecordCollectionModal
          open={!!confirmCollectionRow}
          row={confirmCollectionRow}
          paymentModes={paymentModes}
          onClose={() => setConfirmCollectionRow(null)}
          onConfirm={(amount, modeId, remarks) =>
            handleConfirmCollection(confirmCollectionRow, amount, modeId, remarks)
          }
          submitting={savingRowId === confirmCollectionRow.customer_id}
        />
      )}

      {/* Stop Route Settlement & Analytics Dialog Modal */}
      {isStopRouteModalOpen && activeLine && (
        <StopRouteSettlementModal
          open={isStopRouteModalOpen}
          onClose={() => setIsStopRouteModalOpen(false)}
          activeLine={activeLine}
          selectedDate={selectedDate}
          openingCash={routeOpeningCash}
          totalCollected={filteredSheetRows.reduce(
            (acc, r) => acc + (parseFloat(String(r.collected_amount)) || 0),
            0
          )}
          customers={customers}
          onConfirmSettlement={handleConfirmSettlement}
        />
      )}
    </div>
  );
}
