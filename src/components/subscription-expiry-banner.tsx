import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { guestWorkspaceService, WorkspaceData } from "@/lib/services/guest-workspace-service";

export function SubscriptionExpiryBanner() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    guestWorkspaceService.getWorkspace().then((ws) => {
      setWorkspace(ws);
    }).catch(() => {});

    const handlePlanChange = () => {
      guestWorkspaceService.getWorkspace().then((ws) => setWorkspace(ws)).catch(() => {});
    };
    window.addEventListener("guest-plan-change", handlePlanChange);
    return () => window.removeEventListener("guest-plan-change", handlePlanChange);
  }, []);

  if (isDismissed) return null;

  let endDateStr = workspace?.subscription_end_date;
  if (!endDateStr && workspace?.subscription_start_date) {
    const startObj = new Date(workspace.subscription_start_date + "T00:00:00");
    startObj.setDate(startObj.getDate() + 30);
    endDateStr = startObj.toISOString().slice(0, 10);
  } else if (!endDateStr && workspace?.created_at) {
    const createdObj = new Date(workspace.created_at);
    createdObj.setDate(createdObj.getDate() + 30);
    endDateStr = createdObj.toISOString().slice(0, 10);
  }

  if (!endDateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(endDateStr + "T00:00:00");
  const diffTime = endDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Show banner if plan expires within 7 days or is already expired
  if (daysRemaining > 7) return null;

  const isExpired = daysRemaining <= 0;
  const isCritical = daysRemaining <= 3;

  const endDateFormatted = endDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs my-2 relative ${
        isExpired
          ? "bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-200"
          : isCritical
          ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200"
          : "bg-primary/10 border-primary/30 text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`size-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
            isExpired
              ? "bg-rose-600 text-white"
              : isCritical
              ? "bg-amber-600 text-white"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {isExpired ? <ShieldAlert className="size-5" /> : <AlertTriangle className="size-5" />}
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-sm tracking-tight">
              {isExpired
                ? "🚨 Subscription Plan Expired!"
                : `⚠️ Subscription Expiring Soon (${daysRemaining === 0 ? "Expires Today!" : `In ${daysRemaining} Day${daysRemaining > 1 ? "s" : ""}`})`}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold py-0 px-2 font-mono ${
                isExpired
                  ? "bg-rose-600 text-white border-rose-700"
                  : "bg-amber-600 text-white border-amber-700"
              }`}
            >
              {isExpired ? "EXPIRED" : `Valid Until: ${endDateFormatted}`}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-tight">
            {isExpired
              ? `Your membership expired on ${endDateFormatted}. Please renew your plan to continue accessing all premium tools.`
              : `Your membership expires on ${endDateFormatted}. Renew today to ensure uninterrupted access.`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          asChild
          size="sm"
          className={`font-bold text-xs gap-1.5 shadow-xs rounded-xl shrink-0 ${
            isExpired
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }`}
        >
          <Link to="/app/upgrade">
            <Sparkles className="size-3.5" /> {isExpired ? "Renew Plan Now" : "Renew / Extend Plan"}
          </Link>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsDismissed(true)}
          className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
          title="Dismiss warning banner"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
