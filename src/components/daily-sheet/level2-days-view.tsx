import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Layers,
  MapPin,
  Users,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
} from "lucide-react";
import { inr } from "@/lib/utils";
import { CollectionLine } from "@/lib/services/guest-workspace-service";
import { RouteSettlementAnalytics } from "./stop-route-modal";

export interface RouteCycleItem {
  dateFrom: string;
  dateTo: string;
  label: string;
  subLabel: string;
  isCurrent: boolean;
  isUpcoming?: boolean;
  daysCount: number;
  settlementAnalytics?: RouteSettlementAnalytics;
}

export function Level2DaysView({
  activeLine,
  availableCycles,
  onBackToLines,
  onSelectCycle,
  onAddCustomDateClick,
}: {
  activeLine: CollectionLine;
  availableCycles: RouteCycleItem[];
  onBackToLines: () => void;
  onSelectCycle: (cycle: RouteCycleItem) => void;
  onAddCustomDateClick: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Level 2 Breadcrumb Header */}
      <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLines}
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1 px-0"
          >
            <ArrowLeft className="size-4" /> Back to All Lines
          </Button>

          {/* Icon Add Button for Adding a Custom Date */}
          <Button
            onClick={onAddCustomDateClick}
            size="sm"
            className="bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-xs rounded-xl"
          >
            <Plus className="size-4" /> Select Date
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Layers className="size-6 text-primary" /> {activeLine.name}
              </h2>
              {activeLine.area && (
                <Badge variant="outline" className="text-xs font-semibold">
                  <MapPin className="size-3 mr-1" /> {activeLine.area}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Weekly Route Cycles and scheduled collection dates for this line.
            </p>
          </div>

          <Badge className="bg-primary/10 text-primary font-bold text-xs px-3 py-1 self-start sm:self-auto border-primary/20">
            <Users className="size-3.5 mr-1.5" /> {activeLine.customers_count || 0} Borrowers Assigned
          </Badge>
        </div>

        {/* Combined Weekly Route Cycle Summary Banner (For Multi-Session Lines) */}
        {activeLine.day_schedules && activeLine.day_schedules.length > 1 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Layers className="size-4" /> Multi-Session Weekly Route Cycle Summary
              </span>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {activeLine.day_schedules.length} Sessions Configured
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This route operates across <strong>{activeLine.day_schedules.map((s) => `${s.day_of_week.toUpperCase()} (${s.portion})`).join(" + ")}</strong>. Open any individual session below to enter collections — your route reports automatically aggregate both session totals!
            </p>
          </div>
        )}
      </div>

      {/* Route Cycles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableCycles.map((item) => (
          <Card
            key={`${item.dateFrom}_${item.dateTo}`}
            onClick={() => onSelectCycle(item)}
            className={`rounded-3xl border transition-all cursor-pointer p-5 space-y-3 hover:shadow-md ${
              item.settlementAnalytics?.isSettled
                ? "bg-emerald-500/5 border-emerald-500/30"
                : item.isCurrent
                ? "bg-emerald-500/10 border-emerald-500/40"
                : item.isUpcoming
                ? "bg-blue-500/10 border-blue-500/40"
                : "bg-card border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className={`size-5 ${item.isCurrent ? "text-emerald-600" : item.isUpcoming ? "text-blue-600" : "text-primary"}`} />
                <h3 className="font-bold text-sm text-foreground">{item.label}</h3>
              </div>
              {item.settlementAnalytics?.isSettled ? (
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                  <CheckCircle2 className="size-3" /> Settled
                </Badge>
              ) : item.isCurrent ? (
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  ★ Active Cycle
                </Badge>
              ) : item.isUpcoming ? (
                <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                  Next Cycle
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {item.daysCount} Day{item.daysCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Route Session Settlement Analytics Breakdown Card */}
            {item.settlementAnalytics && (
              <div className="p-3 bg-muted/60 border border-border/80 rounded-2xl space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> Route Closed & Settled
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-background">
                    {inr(item.settlementAnalytics.netHandCash)} Net Float
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-1 text-[10px]">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Opening</span>
                    <span className="font-bold text-foreground">{inr(item.settlementAnalytics.openingCash)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Collected</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{inr(item.settlementAnalytics.totalCollected)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Disbursed</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{inr(item.settlementAnalytics.totalDisbursed)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Expenses</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{inr(item.settlementAnalytics.totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{item.subLabel}</span>
              <span className="text-primary font-bold">Open Sheet →</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
