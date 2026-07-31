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

  return (
    <div className="space-y-4">
      <Card className={`p-5 ${!isFreePlan ? "border-primary/40" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-semibold">Guest Plan · Active Balance</h3>
              <Badge variant={!isFreePlan ? "default" : "secondary"}>{tierLabel}</Badge>
              {workspace?.purchased_additional_days ? (
                <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                  <ShieldCheck className="size-3" /> +{workspace.purchased_additional_days} Add-on Day(s)
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isFreePlan
                ? `Free Tier Allowance: ${totalAllowedDays} collection day per week with Unlimited Borrowers.`
                : `Active Plan Allowance: ${totalAllowedDays} collection days per week with Unlimited Borrowers.`}
            </p>
          </div>
          {isFreePlan && (
            <Button asChild size="sm">
              <Link to="/app/upgrade"><Sparkles className="size-4" /> Upgrade Plan</Link>
            </Button>
          )}
        </div>

        <div className={"mt-4 grid gap-4 " + (compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium"><CalendarDays className="size-4 text-primary" /> Collection Days Allowance</span>
              <span className="tabular-nums font-mono font-bold text-foreground">
                {configuredDays.length} / {totalAllowedDays} day{totalAllowedDays === 1 ? "" : "s"} configured
              </span>
            </div>
            <Progress value={Math.min(100, (configuredDays.length / totalAllowedDays) * 100)} className="mt-2 h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium"><Users className="size-4 text-primary" /> Borrower Capacity</span>
              <span className="tabular-nums text-emerald-600 font-semibold">Unlimited Borrowers</span>
            </div>
            <Progress value={100} className="mt-2 h-2 [&>div]:bg-emerald-500" />
          </div>
        </div>
      </Card>

      {showCalendar && <WeeklyUsageCalendar workspace={workspace} />}
    </div>
  );
}
