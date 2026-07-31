import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles, CalendarClock, ShieldCheck, ArrowRight, Check } from "lucide-react";
import {
  setUserTier,
  getEffectiveLimits,
  formatNextReset,
  nextWeekStart,
  type EffectiveLimits,
  type UpsellDetail,
} from "@/lib/guest-plan";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function UpgradeUpsellModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpsellDetail | null>(null);
  const [before, setBefore] = useState<EffectiveLimits | null>(null);
  const [after, setAfter] = useState<EffectiveLimits | null>(null);

  useEffect(() => {
    const onUpsell = (e: Event) => {
      const ce = e as CustomEvent<UpsellDetail>;
      setDetail(ce.detail);
      setBefore(getEffectiveLimits());
      setAfter(null);
      setOpen(true);
    };
    window.addEventListener("finroute:upsell", onUpsell as EventListener);
    return () => window.removeEventListener("finroute:upsell", onUpsell as EventListener);
  }, []);

  const upgrade = () => {
    setUserTier("premium");
    const next = getEffectiveLimits();
    setAfter(next);
    toast.success("Switched to Premium (demo)", {
      description: `Limits refreshed: ${next.businessDaysPerWeek} days/wk · ${next.customersPerWeek} customers/wk.`,
    });
  };

  const revert = () => {
    setUserTier("free");
    setAfter(null);
    toast.message("Reverted to Free tier");
  };

  if (!detail) return null;
  const nextReset = detail.nextAvailable ? new Date(detail.nextAvailable) : nextWeekStart();
  const kindLabel = detail.kind === "days" ? "Operating days" : "Customer slots";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle className="font-display text-lg">
              {after ? "Premium unlocked" : `${kindLabel} limit reached`}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1 text-sm">
            {after
              ? "Your new limits are already active — go ahead and continue where you left off."
              : detail.reason}
          </DialogDescription>
        </DialogHeader>

        {!after && (
          <Card className="border-dashed p-3">
            <div className="flex items-start gap-2 text-xs">
              <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
              <span>
                Free plan resets on <b>{formatNextReset(nextReset)}</b>. Upgrade to Premium below to
                keep working today.
              </span>
            </div>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <PlanBox
            title="Free (current)"
            limits={before}
            active={!after}
            tone="muted"
          />
          <PlanBox
            title="Premium"
            limits={after ?? previewPremium(before)}
            active={!!after}
            tone="primary"
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {after ? (
            <>
              <Button variant="outline" onClick={revert}>Back to Free</Button>
              <Button onClick={() => setOpen(false)}><Check className="size-4" /> Continue</Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/app/upgrade" onClick={() => setOpen(false)}>Compare plans</Link>
              </Button>
              <Button onClick={upgrade}>
                <ShieldCheck className="size-4" /> Try Premium (demo) <ArrowRight className="size-4" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function previewPremium(before: EffectiveLimits | null): EffectiveLimits {
  // Optimistic preview using stored admin premium config (same as switching tier).
  const admin = getEffectiveLimits(); // current effective; still Free before switch
  // We can't cheaply recompute premium without importing more; the actual
  // "after" values are shown post-upgrade. This is only a hint before click.
  return {
    ...admin,
    tier: "premium",
    businessDaysPerWeek: Math.max(7, before?.businessDaysPerWeek ?? 7),
    customersPerWeek: Math.max(500, before?.customersPerWeek ?? 500),
    collectionsPerDay: Math.max(500, before?.collectionsPerDay ?? 500),
    overridden: false,
  };
}

function PlanBox({
  title,
  limits,
  active,
  tone,
}: {
  title: string;
  limits: EffectiveLimits | null;
  active: boolean;
  tone: "muted" | "primary";
}) {
  return (
    <Card
      className={`p-3 ${
        tone === "primary" ? "border-primary/50 bg-primary/5" : "bg-muted/30"
      } ${active ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
        {active && <Badge variant="default" className="text-[10px]">Active</Badge>}
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        <li className="flex justify-between"><span className="text-muted-foreground">Days / week</span><b>{limits?.businessDaysPerWeek ?? "—"}</b></li>
        <li className="flex justify-between"><span className="text-muted-foreground">Customers / week</span><b>{limits?.customersPerWeek ?? "—"}</b></li>
        <li className="flex justify-between"><span className="text-muted-foreground">Collections / day</span><b>{limits?.collectionsPerDay ?? "—"}</b></li>
      </ul>
    </Card>
  );
}
