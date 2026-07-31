import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, UserPlus, Clock } from "lucide-react";
import { WorkspaceData } from "@/lib/services/guest-workspace-service";

const DAY_LABELS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

export function WeeklyUsageCalendar({
  workspace,
}: {
  workspace: WorkspaceData | null;
}) {
  const allowedTotalDays = workspace?.max_allowed_collection_days || 1;
  const configuredDays = (workspace?.allowed_collection_days || []).map((d) => d.toLowerCase());

  // Ordered Mon..Sun days for the current week as YYYY-MM-DD
  const now = new Date();
  const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon, 6=Sun

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <CalendarDays className="size-4 text-primary" /> Current Week Activity & Collection Days
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Plan Allowance: <b>{allowedTotalDays} collection day{allowedTotalDays === 1 ? "" : "s"} / week</b> • <b>Unlimited Borrowers</b>.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1 border-primary/40 text-primary bg-primary/5 font-semibold">
            <CalendarDays className="size-3" /> {configuredDays.length} / {allowedTotalDays} Day{allowedTotalDays === 1 ? "" : "s"} Configured
          </Badge>
          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600/30 bg-emerald-500/10">
            <UserPlus className="size-3" /> Unlimited Borrowers
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {DAY_LABELS.map((dayItem, i) => {
          const isConfigured = configuredDays.includes(dayItem.key);
          const isToday = i === currentDayIndex;

          return (
            <div
              key={dayItem.key}
              className={`relative flex flex-col items-center justify-between min-h-[90px] p-2.5 rounded-xl border text-center transition-all ${
                isConfigured
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 shadow-sm"
                  : "border-border/60 bg-muted/20 text-muted-foreground"
              } ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            >
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    {dayItem.label}
                  </span>
                  {isToday && (
                    <span className="size-2 rounded-full bg-primary animate-pulse" title="Today" />
                  )}
                </div>
              </div>

              <div className="my-1.5 grid place-items-center">
                {isConfigured ? (
                  <CheckCircle2 className="size-6 text-emerald-600" />
                ) : (
                  <Clock className="size-4 text-muted-foreground/40" />
                )}
              </div>

              <div className="w-full">
                {isConfigured ? (
                  <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-bold uppercase w-full justify-center">
                    Collection Day
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Off Day
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
