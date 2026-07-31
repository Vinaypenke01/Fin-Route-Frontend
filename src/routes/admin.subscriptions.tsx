import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, Sparkles, Plus, Edit, Trash2, Settings2 } from "lucide-react";
import { inr } from "@/lib/utils";
import { adminService, SubscriptionSummary, InvoiceItem, SubscriptionPlanConfigItem } from "@/lib/services/admin-service";
import { planDetails, type Plan } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions & Plan Config — Admin" }] }),
  component: SubscriptionsPage,
});

const defaultPlans: Plan[] = ["Free", "Starter", "Professional", "Enterprise"];

function SubscriptionsPage() {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [planConfigs, setPlanConfigs] = useState<SubscriptionPlanConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State for Plan Configuration Modal (POST / PUT)
  const [openModal, setOpenModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlanConfigItem> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [subData, invData, configs] = await Promise.all([
        adminService.getSubscriptions(),
        adminService.getInvoices(),
        adminService.getSubscriptionPlanConfigs(),
      ]);
      setSummary(subData);
      setInvoices(invData);
      setPlanConfigs(configs);
    } catch (err) {
      console.error("Subscription load error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateModal() {
    setEditingPlan({
      plan_code: "",
      name: "",
      monthly_price: 0,
      annual_price: 0,
      tagline: "Designed for growing lending businesses",
      max_customers: 50,
      max_collection_days: 7,
      is_popular: false,
      is_active: true,
      sort_order: (planConfigs.length + 1) * 10,
    });
    setOpenModal(true);
  }

  function handleOpenEditModal(config: SubscriptionPlanConfigItem) {
    setEditingPlan({ ...config });
    setOpenModal(true);
  }

  async function handleSavePlan() {
    if (!editingPlan || !editingPlan.name || !editingPlan.plan_code) return;
    setIsSubmitting(true);
    try {
      if (editingPlan.id) {
        // PUT /api/v1/admin/subscriptions/plan-configs/{id}/
        await adminService.updateSubscriptionPlanConfig(editingPlan.id, editingPlan);
      } else {
        // POST /api/v1/admin/subscriptions/plan-configs/
        await adminService.createSubscriptionPlanConfig(editingPlan);
      }
      setOpenModal(false);
      setEditingPlan(null);
      await loadAllData();
    } catch (err) {
      console.error("Failed to save plan config:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeletePlan(id: number) {
    if (!confirm("Are you sure you want to remove this subscription plan configuration?")) return;
    try {
      await adminService.deleteSubscriptionPlanConfig(id);
      await loadAllData();
    } catch (err) {
      console.error("Failed to delete plan config:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Subscriptions & SaaS Plan Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure pricing tiers, customer quotas, MRR/ARR analytics, and billing invoices.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="gap-1.5 shadow-sm">
          <Plus className="size-4" /> Add Subscription Plan
        </Button>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Active Workspaces</div>
          <div className="mt-1 font-display text-2xl font-bold">{loading ? "..." : summary?.total_active || 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Free Tier Accounts</div>
          <div className="mt-1 font-display text-2xl font-bold">{loading ? "..." : summary?.total_trials || 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Monthly Recurring Revenue (MRR)</div>
          <div className="mt-1 font-display text-2xl font-bold text-emerald-600">{loading ? "..." : inr(summary?.monthly_recurring_revenue || 0)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Annual Recurring Revenue (ARR)</div>
          <div className="mt-1 font-display text-2xl font-bold text-primary">{loading ? "..." : inr(summary?.annual_recurring_revenue || 0)}</div>
        </CardContent></Card>
      </div>

      {/* Configured Plan Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Configured Subscription Tiers</h3>
          <span className="text-xs text-muted-foreground">Super Admin Config Catalog</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {planConfigs.length > 0
            ? planConfigs.map((cfg) => (
                <Card key={cfg.id} className={cfg.is_popular ? "border-primary shadow-sm" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cfg.name}</CardTitle>
                      {cfg.is_popular && <Badge className="gap-1 text-[10px]"><Sparkles className="size-3" /> Popular</Badge>}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-2xl font-bold">{cfg.monthly_price > 0 ? inr(cfg.monthly_price) : "Free"}</span>
                      {cfg.monthly_price > 0 ? <span className="text-xs text-muted-foreground">/ month</span> : null}
                    </div>
                    <CardDescription className="text-xs">{cfg.tagline || `Code: ${cfg.plan_code}`}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-border py-2">
                      <div><span className="text-muted-foreground">Max Borrowers:</span> <span className="font-semibold">{cfg.max_customers === 0 ? "Unlimited" : cfg.max_customers}</span></div>
                      <div><span className="text-muted-foreground">Collection Days:</span> <span className="font-semibold">{cfg.max_collection_days} days</span></div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(cfg)} className="h-8 gap-1 text-xs">
                        <Edit className="size-3.5" /> Edit Config (PUT)
                      </Button>
                      {cfg.id && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(cfg.id!)} className="h-8 text-xs text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            : defaultPlans.map((p) => {
                const d = planDetails[p] || { price: 0, trial: "Free", cycle: "Monthly", support: "Community", storage: "1 GB", users: "1", apiLimit: "1k", features: [] };
                const isPopular = p === "Professional";
                return (
                  <Card key={p} className={isPopular ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{p}</CardTitle>
                        {isPopular && <Badge className="gap-1"><Sparkles className="size-3" /> Popular</Badge>}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="font-display text-2xl font-bold">{d.price ? inr(d.price) : "Free"}</span>
                        {d.price ? <span className="text-xs text-muted-foreground">/ month</span> : null}
                      </div>
                      <CardDescription>{d.trial} · {d.cycle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-xs">
                        {(d.features || []).slice(0, 3).map((f: string) => (
                          <li key={f} className="flex items-center gap-1.5"><Check className="size-3 text-emerald-600" /> {f}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="workspaces">
        <TabsList>
          <TabsTrigger value="workspaces">Subscribed Workspaces ({summary?.workspaces.length || 0})</TabsTrigger>
          <TabsTrigger value="configs">Backend Subscription Configs ({planConfigs.length})</TabsTrigger>
          <TabsTrigger value="invoices">Billing Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Current Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">Loading subscribed workspaces...</TableCell>
                  </TableRow>
                ) : summary?.workspaces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No workspace records found.</TableCell>
                  </TableRow>
                ) : (
                  summary?.workspaces.map((w) => (
                    <TableRow key={w.public_id}>
                      <TableCell className="font-bold">{w.name}</TableCell>
                      <TableCell>{w.owner_name}</TableCell>
                      <TableCell>{w.owner_mobile}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{w.subscription_plan}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={w.status === "active" ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.created_at.split("T")[0]}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="configs">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Code</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Monthly Price</TableHead>
                  <TableHead>Annual Price</TableHead>
                  <TableHead>Max Borrowers</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      No custom plan configurations created yet. Click "Add Subscription Plan" to configure new tiers.
                    </TableCell>
                  </TableRow>
                ) : (
                  planConfigs.map((cfg) => (
                    <TableRow key={cfg.id}>
                      <TableCell className="font-mono text-xs font-bold">{cfg.plan_code}</TableCell>
                      <TableCell className="font-semibold">{cfg.name}</TableCell>
                      <TableCell>{cfg.monthly_price > 0 ? inr(cfg.monthly_price) : "Free"}</TableCell>
                      <TableCell>{cfg.annual_price > 0 ? inr(cfg.annual_price) : "Free"}</TableCell>
                      <TableCell>{cfg.max_customers === 0 ? "Unlimited" : cfg.max_customers}</TableCell>
                      <TableCell>{cfg.is_popular ? <Badge className="bg-primary/20 text-primary">Yes</Badge> : "No"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}>
                          {cfg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(cfg)} className="h-7 text-xs">
                          <Edit className="size-3 mr-1" /> PUT Edit
                        </Button>
                        {cfg.id && (
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(cfg.id!)} className="h-7 text-xs text-destructive">
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No invoices issued yet.</TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-bold">{inv.id}</TableCell>
                      <TableCell>{inv.workspace_name}</TableCell>
                      <TableCell>{inv.plan}</TableCell>
                      <TableCell className="font-semibold">{inr(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={inv.status === "paid" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{inv.issue_date}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Configuration Modal Dialog (POST / PUT API) */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="size-5 text-primary" />
              {editingPlan?.id ? "Edit Subscription Plan Config (PUT)" : "Create New Subscription Plan (POST)"}
            </DialogTitle>
            <DialogDescription>
              Configure pricing rates, borrower quota limits, and popular status badge for this plan tier.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="plan_code" className="text-xs font-semibold">Plan Code</Label>
                  <Input
                    id="plan_code"
                    placeholder="e.g. starter, premium"
                    value={editingPlan.plan_code || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, plan_code: e.target.value.toLowerCase() })}
                    disabled={!!editingPlan.id}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold">Plan Display Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. ERP Starter"
                    value={editingPlan.name || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="monthly_price" className="text-xs font-semibold">Monthly Price (₹)</Label>
                  <Input
                    id="monthly_price"
                    type="number"
                    value={editingPlan.monthly_price ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="annual_price" className="text-xs font-semibold">Annual Price (₹)</Label>
                  <Input
                    id="annual_price"
                    type="number"
                    value={editingPlan.annual_price ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, annual_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="max_customers" className="text-xs font-semibold">Max Borrowers (0 = unlimited)</Label>
                  <Input
                    id="max_customers"
                    type="number"
                    value={editingPlan.max_customers ?? 50}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_customers: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="max_collection_days" className="text-xs font-semibold">Max Collection Days / Wk</Label>
                  <Input
                    id="max_collection_days"
                    type="number"
                    value={editingPlan.max_collection_days ?? 7}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_collection_days: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tagline" className="text-xs font-semibold">Tagline / Description</Label>
                <Input
                  id="tagline"
                  placeholder="e.g. Best value for growing daily finance lenders"
                  value={editingPlan.tagline || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_popular || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })}
                    className="rounded border-border"
                  />
                  Mark as Popular Tier
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active ?? true}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                    className="rounded border-border"
                  />
                  Active in Catalog
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={isSubmitting || !editingPlan?.name || !editingPlan?.plan_code}>
              {isSubmitting ? "Saving..." : editingPlan?.id ? "Update Configuration (PUT)" : "Create Plan (POST)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
