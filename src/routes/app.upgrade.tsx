import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Calendar, Crown, RefreshCw, CheckCircle2, Zap, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, UpgradePlansResponse, PlanOption } from "@/lib/services/guest-workspace-service";
import { mastersService } from "@/lib/services/masters-service";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/upgrade")({
  head: () => ({
    meta: [
      { title: "Guest Plans & Add-Ons — FinRoute" },
      { name: "description", content: "Upgrade collection business days for your guest workspace." },
    ],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  const { user, workspace } = useAuth();
  const [data, setData] = useState<UpgradePlansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingCode, setPurchasingCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await guestWorkspaceService.getUpgradePlans();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load upgrade plans:", err);
      setErrorMsg(err.message || "Failed to load pricing plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleApplyPlan = async (plan: PlanOption) => {
    setPurchasingCode(plan.code);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Submit Upgrade Request to Backend (saved in DB as status="pending")
      await guestWorkspaceService.submitUpgradeRequest({
        plan_code: plan.code,
        plan_name: plan.name,
        additional_days: plan.additional_days,
        amount: plan.price,
      });

      setSuccessMsg(
        `Upgrade request for ${plan.name} submitted successfully! Opening WhatsApp to verify payment. An administrator will activate your plan upon verification.`
      );
    } catch (err: any) {
      console.warn("Upgrade request notice:", err);
      setSuccessMsg(
        `Opening WhatsApp for ${plan.name} upgrade inquiry... An administrator will activate your plan upon verification.`
      );
    } finally {
      setPurchasingCode(null);
    }

    // 2. Redirect to WhatsApp using configured Admin WhatsApp number or fallback .env
    const savedWa = localStorage.getItem("finroute_admin_whatsapp_number");
    let rawNumber = savedWa || import.meta.env.VITE_WHATSAPP_NUMBER || import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || "919876543210";

    try {
      const cfg = await mastersService.getPublicConfig();
      if (cfg.whatsapp_number) {
        rawNumber = cfg.whatsapp_number;
      }
    } catch (e) {}

    const cleanNumber = String(rawNumber).replace(/\D/g, "");
    const wsName = workspace?.name || `${user?.full_name || "Lender"} Finance`;

    const msg = `Hello FinRoute Support Team! 👋\n\nI want to purchase & activate the *${plan.name}* (${inr(plan.price)}/mo) for my workspace.\n\n• Workspace: ${wsName}\n• Mobile: ${user?.mobile_number || "N/A"}\n• Requested Plan: ${plan.name} (${plan.max_collection_days} Days/week)\n\nPlease verify my payment and activate the plan for my account.`;

    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  // Only display Guest User plans
  const guestPlansList = (data?.guest_plans && data.guest_plans.length > 0)
    ? data.guest_plans
    : (data?.available_plans || []).filter((p) => p.target_user_type !== "lender");

  const handleDowngradeToFree = async () => {
    setPurchasingCode("free");
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await guestWorkspaceService.applyUpgradePlan("free", 0);
      setSuccessMsg("Workspace plan successfully downgraded to Free Plan (1 Collection Day / Week).");
      await fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset plan to Free Plan.");
    } finally {
      setPurchasingCode(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Active Workspace Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-primary/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-white border border-primary/30 text-xs font-semibold">
              <Crown className="size-3.5 text-amber-400" /> Guest Workspace Plan
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Upgrade Collection Operating Days
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Every guest workspace includes <span className="font-bold text-amber-300">1 Collection Day / Week with Unlimited Customers</span> by default. Select a plan to increase your weekly collection days.
            </p>
          </div>

          {/* Current Plan Badge Card */}
          <Card className="p-5 bg-white/10 backdrop-blur-md border-white/20 text-white space-y-3 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Active Balance</span>
              <Badge variant="outline" className="text-[10px] text-white border-white/30 capitalize">
                {data?.purchased_additional_days && data.purchased_additional_days > 0 ? "Paid Plan" : "Free Plan"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white">{data?.total_allowed_days || 1}</span>
              <span className="text-xs text-slate-200">Collection Days / Wk</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-200 border-t border-white/15 pt-2">
              <Users className="size-3.5 text-emerald-400" />
              <span>Borrower Capacity: <b>Unlimited</b></span>
            </div>
          </Card>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
          <Zap className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Plans Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Select Operating Days Plan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">All plans include <b>unlimited customers</b> and full digital collection book access.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPlans} disabled={loading} className="text-xs h-8">
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 h-64 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Free Default Plan Box */}
            <Card className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 ${
              data?.purchased_additional_days === 0 ? "border-primary bg-primary/5" : "border-border/80 bg-card"
            }`}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-foreground">Free Tier</h3>
                    <Badge variant="secondary" className="text-[10px]">Default</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">1 Day / week for small finance setups</p>
                </div>

                <div className="flex items-baseline gap-1 py-1 border-y border-border/50">
                  <span className="text-2xl font-black font-mono text-foreground">₹0</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Calendar className="size-3.5 text-primary" /> Days / Week:</span>
                  <span className="font-bold font-mono">1 Day</span>
                </div>

                <ul className="space-y-2 text-xs pt-1">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>1 Collection Day per week</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span><b>Unlimited Borrowers</b></span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Digital Collection Book</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleDowngradeToFree}
                  disabled={data?.purchased_additional_days === 0 || purchasingCode === "free"}
                  variant={data?.purchased_additional_days === 0 ? "outline" : "default"}
                  className={`w-full text-xs font-bold h-9 ${
                    data?.purchased_additional_days === 0
                      ? "bg-muted text-muted-foreground cursor-default"
                      : "bg-slate-800 text-white hover:bg-slate-900"
                  }`}
                >
                  {purchasingCode === "free"
                    ? "Resetting..."
                    : data?.purchased_additional_days === 0
                    ? "Active Plan"
                    : "Downgrade to Free Plan"}
                </Button>
              </div>
            </Card>

            {/* Configured Upgrade Plans */}
            {guestPlansList.map((plan) => {
              const isCurrentQuotaMatch = data?.purchased_additional_days === plan.additional_days;

              return (
                <Card
                  key={plan.code}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl transition-all duration-200 border-2 ${
                    plan.is_popular
                      ? "border-amber-500 shadow-lg shadow-amber-500/10 bg-gradient-to-b from-amber-500/5 to-card"
                      : isCurrentQuotaMatch
                      ? "border-primary bg-primary/5"
                      : "border-border/80 hover:border-primary/40 bg-card"
                  }`}
                >
                  {plan.is_popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 shadow-sm">
                      Recommended
                    </Badge>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground leading-snug">{plan.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-1 py-1 border-y border-border/50">
                      <span className="text-2xl font-black font-mono text-foreground">{inr(plan.price)}</span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" /> Days / Week:
                      </span>
                      <span className="font-bold font-mono">{plan.max_collection_days} Days</span>
                    </div>

                    <ul className="space-y-2 text-xs pt-1">
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                        <span><b>{plan.max_collection_days} Collection Days</b> / week</span>
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                        <span><b>Unlimited Borrowers</b></span>
                      </li>
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="size-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={() => handleApplyPlan(plan)}
                      disabled={purchasingCode === plan.code || isCurrentQuotaMatch}
                      className={`w-full text-xs font-bold h-9 ${
                        isCurrentQuotaMatch
                          ? "bg-muted text-muted-foreground cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {purchasingCode === plan.code ? (
                        "Updating..."
                      ) : isCurrentQuotaMatch ? (
                        "Active Plan"
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          Select Plan <ArrowRight className="size-3.5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 3 Key Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Card className="p-5 space-y-2 border-border/70">
          <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Calendar className="size-5" />
          </div>
          <h3 className="font-display text-sm font-bold">More Collection Days</h3>
          <p className="text-xs text-muted-foreground">Record daily or multi-day collections easily without hitting weekly day limits.</p>
        </Card>
        <Card className="p-5 space-y-2 border-border/70">
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
            <Users className="size-5" />
          </div>
          <h3 className="font-display text-sm font-bold">Unlimited Borrowers</h3>
          <p className="text-xs text-muted-foreground">Add as many customer borrowers as you need without extra per-borrower charges.</p>
        </Card>
        <Card className="p-5 space-y-2 border-border/70">
          <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
            <ShieldCheck className="size-5" />
          </div>
          <h3 className="font-display text-sm font-bold">Instant Activation</h3>
          <p className="text-xs text-muted-foreground">Selected plan updates your workspace collection day allowance immediately.</p>
        </Card>
      </div>
    </div>
  );
}
