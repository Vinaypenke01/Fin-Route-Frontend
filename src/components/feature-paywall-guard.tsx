import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { mastersService } from "@/lib/services/masters-service";
import { guestWorkspaceService } from "@/lib/services/guest-workspace-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Sparkles,
  MessageCircle,
  Users,
  Wallet,
  Receipt,
  FileBarChart,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";

interface FeaturePaywallGuardProps {
  module: "customers" | "collections" | "expenses" | "reports";
  children: React.ReactNode;
}

const MODULE_DETAILS = {
  customers: {
    title: "Borrower Profiles & Passbook Suite",
    icon: Users,
    description: "Manage individual customer registers, full passbooks, loan terms, and customer card images.",
    features: [
      "🎴 Downloadable Passbook Cards (Share on WhatsApp)",
      "📱 Borrower Personal & Contact History Registers",
      "📜 20-Installment Strikethrough Passbook Grid",
      "🔄 Drag & Drop Custom Route Sequence Re-order",
      "⚡ Auto-Calculate Interest, Penalty & Principal",
      "🔍 Search & Filter Borrowers by Line & Status",
    ],
  },
  collections: {
    title: "Collections Register & Automated Email Receipts",
    icon: Wallet,
    description: "View historical collection audit logs, payment mode filters, and receive daily automated route email reports.",
    features: [
      "📧 Automated Route Closure Email Reports (Direct to Inbox)",
      "🖨️ Printable PDF Collection Receipts with Business Branding",
      "📲 WhatsApp Instant Payment Statements for Borrowers",
      "💳 Cash vs. Online / UPI Mode Reconciliation",
      "📜 Complete Collection Audit Logs & Timestamp History",
      "❌ Undo / Edit Collection Records with Full Audit Control",
    ],
  },
  expenses: {
    title: "Operational Expense Tracking & Net Profit",
    icon: Receipt,
    description: "Track route fuel expenses, office supplies, and daily cash outflows to compute net profit.",
    features: [
      "⛽ Daily Route Fuel & Operational Outflow Logging",
      "📷 Expense Receipt Photo Attachment Uploads",
      "📊 Category-Wise Outflow Breakdown (Fuel, Food, Rent)",
      "💰 Automated Net Profit Math (Collections minus Expenses)",
      "📑 Route Cash Reconciliation & Opening Handover Float",
      "📈 Daily Outflow Audit Summary Reports",
    ],
  },
  reports: {
    title: "Financial Analytics & Export Suite",
    icon: FileBarChart,
    description: "Export Excel/CSVs, print summary ledgers, and track route collection performance.",
    features: [
      "📥 1-Click Excel & CSV Full Raw Data Exports",
      "📊 Complete P&L Statements & Financial Analytics",
      "🖨️ Printable Branded PDF Summary Ledgers",
      "📧 Scheduled End-of-Day Email Reports with PDF Attachments",
      "📈 Route Collection Performance & Outstanding Balances",
      "📅 Custom Date Range & Weekly Cycle Performance Audits",
    ],
  },
};

export function FeaturePaywallGuard({ module, children }: FeaturePaywallGuardProps) {
  const { workspace, user } = useAuth();
  const plan = (workspace?.plan || (workspace as any)?.subscription_plan || "free").toLowerCase();

  // Configured pricing & line limit values
  const [price, setPrice] = useState("499");
  const [freeLines, setFreeLines] = useState("3 Lines");
  const [upgradedLines, setUpgradedLines] = useState("Unlimited Lines");
  const [duration, setDuration] = useState("1 Month (30 Days)");
  const [waNumber, setWaNumber] = useState("919876543210");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Read local storage for instant render
    const savedPrice = localStorage.getItem("finroute_admin_upgrade_price");
    const savedFreeLines = localStorage.getItem("finroute_admin_max_free_lines");
    const savedUpgradedLines = localStorage.getItem("finroute_admin_upgraded_lines");
    const savedDuration = localStorage.getItem("finroute_admin_plan_duration");
    const savedWa = localStorage.getItem("finroute_admin_whatsapp_number");

    if (savedPrice) setPrice(savedPrice);
    if (savedFreeLines) setFreeLines(savedFreeLines);
    if (savedUpgradedLines) setUpgradedLines(savedUpgradedLines);
    if (savedDuration) setDuration(savedDuration);
    if (savedWa) setWaNumber(savedWa);

    // 2. Fetch live admin configuration from Backend REST API
    mastersService.getPublicConfig().then((cfg) => {
      if (cfg.upgrade_price) setPrice(cfg.upgrade_price);
      if (cfg.max_free_lines) setFreeLines(cfg.max_free_lines);
      if (cfg.upgraded_lines) setUpgradedLines(cfg.upgraded_lines);
      if (cfg.plan_duration) setDuration(cfg.plan_duration);
      if (cfg.whatsapp_number) setWaNumber(cfg.whatsapp_number);
    }).catch((err) => {
      console.warn("Could not load public config for paywall:", err);
    });
  }, []);

  // If user has upgraded (e.g. premium, enterprise, starter, or active paid plan), render normal feature children
  const isUnlocked = plan === "premium" || plan === "enterprise" || plan === "starter";

  if (isUnlocked) {
    return <>{children}</>;
  }

  const details = MODULE_DETAILS[module] || MODULE_DETAILS.customers;
  const ModuleIcon = details.icon;

  const workspaceName = workspace?.name || "My Business";
  const workspaceCode = workspace?.public_id || `FR00${(workspace as any)?.id || 1}`;

  const messageText = encodeURIComponent(
    `Hi FinRoute Admin! 👋\nI would like to unlock Customers, Collections, Expenses & Reports for my workspace.\n\nBusiness Name: ${workspaceName}\nWorkspace Code: ${workspaceCode}\nFree Plan Limit: ${freeLines}\nRequesting Upgrade: ${upgradedLines} (${duration})\nContact: ${user?.mobile_number || ""}\n\nPlease share payment details to activate my account!`
  );

  const cleanWaNumber = String(waNumber).replace(/\D/g, "") || "919876543210";
  const whatsappUrl = `https://wa.me/${cleanWaNumber}?text=${messageText}`;

  const handleWhatsAppClick = async () => {
    setSubmitting(true);
    try {
      // Record upgrade request in database so Admin sees it in /admin/upgrade-requests
      await guestWorkspaceService.submitUpgradeRequest({
        plan_code: "full_module_unlock",
        plan_name: `Full Premium Unlock (${details.title})`,
        additional_days: 0,
        amount: parseFloat(price) || 499,
      });
    } catch (err) {
      console.warn("Backend upgrade request notice:", err);
    } finally {
      setSubmitting(false);
    }

    // Open WhatsApp link
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 rounded-3xl shadow-xl overflow-hidden relative">
        {/* Top Decorative Banner */}
        <div className="bg-primary/10 border-b border-primary/20 p-4 text-center">
          <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-xs gap-1.5 shadow-xs">
            <Sparkles className="size-3.5 animate-spin" /> Full Premium Feature Unlock
          </Badge>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6 text-center">
          {/* Module Icon & Lock Header */}
          <div className="relative inline-block mx-auto">
            <div className="size-16 sm:size-20 rounded-3xl bg-primary/15 flex items-center justify-center text-primary mx-auto border border-primary/30 shadow-inner">
              <ModuleIcon className="size-8 sm:size-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-background">
              <Lock className="size-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Unlock {details.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {details.description}
            </p>
          </div>

          {/* Line Quota & Plan Duration Highlight Banner */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <MapPin className="size-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Free Plan: <span className="font-mono text-muted-foreground">{freeLines}</span> → Upgraded: <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">{upgradedLines}</span>
                </span>
                <span className="text-[11px] text-muted-foreground">Unlimited route collections, borrower passbooks & reports</span>
              </div>
            </div>
            <Badge variant="outline" className="bg-background text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/40 text-[11px] shrink-0 gap-1">
              <Clock className="size-3" /> Validity: {duration}
            </Badge>
          </div>

          {/* Features Grid */}
          <div className="p-4 bg-muted/50 rounded-2xl border border-border/60 text-left space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" /> What's Included in Your Upgrade:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {details.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-foreground font-medium">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Value Conversion Highlights Banner */}
          <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/20 text-left grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-foreground">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📧</span>
              <span>Daily Email Reports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🎴</span>
              <span>Passbook Cards</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🖨️</span>
              <span>Printable Receipts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📥</span>
              <span>Excel/CSV Exports</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">Special Fixed Upgrade Price</span>
              <span className="text-2xl font-black font-mono text-foreground">₹{price} <span className="text-xs font-normal text-muted-foreground">/ {duration}</span></span>
            </div>
            <div className="text-xs text-muted-foreground text-right sm:text-right">
              <span className="font-semibold text-foreground block">Instant Activation</span>
              <span>1-Click Admin Permission Approval</span>
            </div>
          </div>

          {/* Terms, Rules & Cancellation Policy Disclaimer Box */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
              <ShieldCheck className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Important Subscription Terms & Rules:</span>
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1 pl-1 list-none font-medium">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold shrink-0">•</span>
                <span><strong className="text-foreground font-semibold">No Cancellations or Refunds:</strong> Payments are final, fixed, and non-refundable once activated by Admin.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold shrink-0">•</span>
                <span><strong className="text-foreground font-semibold">Fixed Plan Duration:</strong> Valid for {duration} from the exact time of Admin approval.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold shrink-0">•</span>
                <span><strong className="text-foreground font-semibold">Non-Transferable License:</strong> Bound exclusively to your registered workspace code <span className="font-mono font-bold text-foreground">{workspaceCode}</span>.</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-1">
            <Button
              onClick={handleWhatsAppClick}
              disabled={submitting}
              size="lg"
              className="w-full h-12 text-sm sm:text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg hover:shadow-emerald-600/25"
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <MessageCircle className="size-5" />
              )}
              Unlock Features via WhatsApp
              <ArrowRight className="size-4 ml-auto" />
            </Button>
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 text-center">
              <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" /> By clicking above, you agree to FinRoute Upgrade Terms & No-Cancellation Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
