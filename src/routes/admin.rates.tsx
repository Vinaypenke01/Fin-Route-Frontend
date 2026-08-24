import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  IndianRupee,
  MessageCircle,
  ShieldCheck,
  Layers,
  Save,
  Sparkles,
  Users,
  Wallet,
  Receipt,
  FileBarChart,
  CheckCircle2,
  Lock,
  RefreshCw,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/lib/services/admin-service";

export const Route = createFileRoute("/admin/rates")({
  head: () => ({ meta: [{ title: "Rates & Pricing Setup — Admin" }] }),
  component: RatesAdminPage,
});

function RatesAdminPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pricing & Limit State
  const [fixedMonthlyPrice, setFixedMonthlyPrice] = useState<string>("499");
  const [fixedLifetimePrice, setFixedLifetimePrice] = useState<string>("1999");
  const [maxFreeLines, setMaxFreeLines] = useState<string>("3 Lines");
  const [upgradedLinesCount, setUpgradedLinesCount] = useState<string>("Unlimited Lines");
  const [planDuration, setPlanDuration] = useState<string>("1 Month (30 Days)");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("919876543210");
  const [messageTemplate, setMessageTemplate] = useState<string>(
    "Hi FinRoute Admin! 👋\nI would like to unlock Customers, Collections, Expenses & Reports for my workspace.\n\nBusiness Name: {workspace_name}\nWorkspace Code: {workspace_code}\nFree Plan Limit: {free_lines}\nRequesting Upgrade: {upgraded_lines} ({plan_duration})\nContact: {mobile_number}\n\nPlease share payment details to activate my account!"
  );

  // Locked Modules Switches
  const [lockCustomers, setLockCustomers] = useState(true);
  const [lockCollections, setLockCollections] = useState(true);
  const [lockExpenses, setLockExpenses] = useState(true);
  const [lockReports, setLockReports] = useState(true);

  // Load Saved Pricing Config from LocalStorage / Backend API
  useEffect(() => {
    // 1. Load locally for instant rendering
    const savedPrice = localStorage.getItem("finroute_admin_upgrade_price");
    const savedFreeLines = localStorage.getItem("finroute_admin_max_free_lines");
    const savedUpgradedLines = localStorage.getItem("finroute_admin_upgraded_lines");
    const savedDuration = localStorage.getItem("finroute_admin_plan_duration");
    const savedWa = localStorage.getItem("finroute_admin_whatsapp_number");
    const savedTpl = localStorage.getItem("finroute_admin_whatsapp_template");

    if (savedPrice) setFixedMonthlyPrice(savedPrice);
    if (savedFreeLines) setMaxFreeLines(savedFreeLines);
    if (savedUpgradedLines) setUpgradedLinesCount(savedUpgradedLines);
    if (savedDuration) setPlanDuration(savedDuration);
    if (savedWa) setWhatsappNumber(savedWa);
    if (savedTpl) setMessageTemplate(savedTpl);

    // 2. Fetch latest configuration from Backend API
    adminService.getConfiguration().then((configs) => {
      if (!Array.isArray(configs)) return;
      configs.forEach((item) => {
        if (item.key === "finroute_admin_upgrade_price" && item.value) setFixedMonthlyPrice(item.value);
        if (item.key === "finroute_admin_max_free_lines" && item.value) setMaxFreeLines(item.value);
        if (item.key === "finroute_admin_upgraded_lines" && item.value) setUpgradedLinesCount(item.value);
        if (item.key === "finroute_admin_plan_duration" && item.value) setPlanDuration(item.value);
        if (item.key === "finroute_admin_whatsapp_number" && item.value) setWhatsappNumber(item.value);
        if (item.key === "finroute_admin_whatsapp_template" && item.value) setMessageTemplate(item.value);
      });
    }).catch((err) => {
      console.warn("Could not fetch remote admin configs:", err);
    });
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Save locally for fallback
      localStorage.setItem("finroute_admin_upgrade_price", fixedMonthlyPrice);
      localStorage.setItem("finroute_admin_max_free_lines", maxFreeLines);
      localStorage.setItem("finroute_admin_upgraded_lines", upgradedLinesCount);
      localStorage.setItem("finroute_admin_plan_duration", planDuration);
      localStorage.setItem("finroute_admin_whatsapp_number", whatsappNumber);
      localStorage.setItem("finroute_admin_whatsapp_template", messageTemplate);

      // 2. Call backend API to persist all configuration settings to Django PostgreSQL database
      await Promise.all([
        adminService.updateConfiguration("finroute_admin_upgrade_price", fixedMonthlyPrice),
        adminService.updateConfiguration("finroute_admin_max_free_lines", maxFreeLines),
        adminService.updateConfiguration("finroute_admin_upgraded_lines", upgradedLinesCount),
        adminService.updateConfiguration("finroute_admin_plan_duration", planDuration),
        adminService.updateConfiguration("finroute_admin_whatsapp_number", whatsappNumber),
        adminService.updateConfiguration("finroute_admin_whatsapp_template", messageTemplate),
      ]);

      toast.success("Rates, Line Limits & WhatsApp Number saved to server & database successfully!");
    } catch (err: any) {
      console.error("Failed to save admin rates config:", err);
      toast.error(err?.message || "Failed to save configuration to server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <IndianRupee className="size-6 text-emerald-600" /> Rates & Upgrade Setup
            </h1>
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border-emerald-500/30">
              Admin Rates Console
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure upgrade pricing, free vs upgraded line limits, plan duration, and WhatsApp automation.
          </p>
        </div>

        <Button
          onClick={handleSaveConfig}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 shadow-md gap-2"
        >
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Rates & Pricing
        </Button>
      </div>

      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Fixed Pricing & Line Limits Card */}
        <Card className="rounded-3xl border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <IndianRupee className="size-5 text-primary" /> Upgrade Pricing & Line Quotas
            </CardTitle>
            <CardDescription className="text-xs">
              Set price fee, free tier line limit, upgraded line count, and plan duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold">Fixed Monthly Upgrade Price (₹)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="pl-8 font-mono font-bold text-base"
                  value={fixedMonthlyPrice}
                  onChange={(e) => setFixedMonthlyPrice(e.target.value)}
                  placeholder="499"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Amount displayed on the Paywall Lock Screen for unlocking Customers, Collections, Expenses, and Reports.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Upgraded Plan Lines Count</Label>
                <Input
                  type="text"
                  className="mt-1 font-mono font-bold"
                  value={upgradedLinesCount}
                  onChange={(e) => setUpgradedLinesCount(e.target.value)}
                  placeholder="Unlimited Lines"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Lines available after payment.</p>
              </div>

              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase block">Free Tier Days & Quotas</span>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Free tier collection day limits and guest user quotas are managed in Guest Plans.
                </p>
                <Button asChild variant="outline" size="sm" className="h-7 text-[10px] font-bold mt-1 gap-1 text-primary border-primary/30">
                  <Link to="/admin/guest-plan">
                    <Sparkles className="size-3" /> Manage Guest Plans
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Subscription Plan Duration / Validity</Label>
              <Select value={planDuration} onValueChange={setPlanDuration}>
                <SelectTrigger className="mt-1 font-bold">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Month (30 Days)">1 Month (30 Days)</SelectItem>
                  <SelectItem value="3 Months (90 Days)">3 Months (90 Days)</SelectItem>
                  <SelectItem value="6 Months (180 Days)">6 Months (180 Days)</SelectItem>
                  <SelectItem value="1 Year (365 Days)">1 Year (365 Days)</SelectItem>
                  <SelectItem value="Lifetime Access">Lifetime Access</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Active duration granted when Admin approves subscription upon receiving WhatsApp message.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. WhatsApp Navigation Checkout Card */}
        <Card className="rounded-3xl border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="size-5 text-emerald-600" /> WhatsApp Checkout Automation
            </CardTitle>
            <CardDescription className="text-xs">
              Configure Admin WhatsApp phone number and message template variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold">Admin WhatsApp Number (Country Code + Mobile)</Label>
              <Input
                type="text"
                className="mt-1 font-mono font-bold"
                placeholder="919876543210"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Include country code without '+' (e.g. 919876543210 for India).
              </p>
            </div>

            <div>
              <Label className="text-xs font-bold">Pre-filled WhatsApp Message Template</Label>
              <Textarea
                rows={6}
                className="mt-1 font-mono text-xs"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Available Tags: <code className="text-primary">{`{workspace_name}`}</code>, <code className="text-primary">{`{workspace_code}`}</code>, <code className="text-primary">{`{free_lines}`}</code>, <code className="text-primary">{`{upgraded_lines}`}</code>, <code className="text-primary">{`{plan_duration}`}</code>, <code className="text-primary">{`{mobile_number}`}</code>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Gated Modules Status Card (Full Width) */}
        <Card className="md:col-span-2 rounded-3xl border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Lock className="size-5 text-amber-500" /> Paywall Module Protection Status
            </CardTitle>
            <CardDescription className="text-xs">
              Modules locked behind the Paywall for Free Guest workspaces until Admin permission grant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customers */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="size-5 text-primary" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Customers Screen</h4>
                    <p className="text-[10px] text-muted-foreground">Borrower Profiles & Passbooks</p>
                  </div>
                </div>
                <Switch checked={lockCustomers} onCheckedChange={setLockCustomers} />
              </div>

              {/* Collections */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wallet className="size-5 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Collections Register</h4>
                    <p className="text-[10px] text-muted-foreground">Audit Log & Receipt PDFs</p>
                  </div>
                </div>
                <Switch checked={lockCollections} onCheckedChange={setLockCollections} />
              </div>

              {/* Expenses */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Receipt className="size-5 text-orange-600" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Expenses Screen</h4>
                    <p className="text-[10px] text-muted-foreground">Outflow Logging & Receipts</p>
                  </div>
                </div>
                <Switch checked={lockExpenses} onCheckedChange={setLockExpenses} />
              </div>

              {/* Reports */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileBarChart className="size-5 text-blue-600" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Reports Screen</h4>
                    <p className="text-[10px] text-muted-foreground">Net P&L & CSV Exports</p>
                  </div>
                </div>
                <Switch checked={lockReports} onCheckedChange={setLockReports} />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
