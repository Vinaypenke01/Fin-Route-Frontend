import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CalendarDays, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { WeeklyUsageCalendar } from "@/components/weekly-usage-calendar";
import { guestWorkspaceService, WorkspaceData } from "@/lib/services/guest-workspace-service";

export function GuestPlanUsage({ compact = false, showCalendar = true }: { compact?: boolean; showCalendar?: boolean }) {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const ws = await guestWorkspaceService.getWorkspace();
      setWorkspace(ws);
    } catch (err) {
      console.error("GuestPlanUsage fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("guest-plan-change", loadData);
    return () => window.removeEventListener("guest-plan-change", loadData);
  }, []);

  const totalAllowedDays = workspace?.max_allowed_collection_days || 1;
  const configuredDays = workspace?.allowed_collection_days || [];
  const isFreePlan = workspace?.subscription_plan === "free";
  const tierLabel = isFreePlan ? "Free Plan" : "Paid Plan";

  const startDateStr = workspace?.subscription_start_date || (workspace?.created_at ? workspace.created_at.slice(0, 10) : "");
  let endDateStr = workspace?.subscription_end_date;
  if (!endDateStr && startDateStr) {
    const startObj = new Date(startDateStr + "T00:00:00");
    startObj.setDate(startObj.getDate() + 30);
    endDateStr = startObj.toISOString().slice(0, 10);
  }

  let daysRemaining: number | null = null;
  let isExpired = false;
  if (endDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endObj = new Date(endDateStr + "T00:00:00");
    const diff = endObj.getTime() - today.getTime();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining <= 0;
  }

  return (
    <div>
      <Card className={`p-3.5 sm:p-4 ${!isFreePlan ? "border-primary/40" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-sm sm:text-base font-semibold">Guest Plan · Active Balance</h3>
              <Badge variant={!isFreePlan ? "default" : "secondary"} className="text-[11px] px-2 py-0.5">{tierLabel}</Badge>
              {workspace?.purchased_additional_days ? (
                <Badge variant="outline" className="gap-1 border-primary/40 text-primary text-[11px] px-2 py-0.5">
                  <ShieldCheck className="size-3" /> +{workspace.purchased_additional_days} Add-on Day(s)
                </Badge>
              ) : null}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {isFreePlan
                  ? `Free Tier Allowance: ${totalAllowedDays} collection day per week with Unlimited Borrowers.`
                  : `Active Plan Allowance: ${totalAllowedDays} collection days per week with Unlimited Borrowers.`}
              </p>
              {startDateStr && endDateStr && (
                <div className="flex items-center gap-2 flex-wrap font-mono text-[11px] font-semibold">
                  <span className="text-emerald-700 dark:text-emerald-300">
                    🗓️ Membership Validity: {startDateStr} to {endDateStr}
                  </span>
                  <Badge
                    className={`text-[10px] font-bold py-0.5 px-2 font-mono ${
                      isExpired
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : daysRemaining !== null && daysRemaining <= 5
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30"
                    }`}
                  >
                    {isExpired
                      ? "🚨 Plan Expired — Renew Now"
                      : daysRemaining === 0
                      ? "⏳ Plan Expires Today!"
                      : `⏳ ${daysRemaining} Day${daysRemaining && daysRemaining > 1 ? "s" : ""} Remaining`}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          {isFreePlan && (
            <Button asChild size="sm" className="h-8 text-xs px-3">
              <Link to="/app/upgrade"><Sparkles className="size-3.5 mr-1" /> Upgrade Plan</Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
