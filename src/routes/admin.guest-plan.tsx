import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, ShieldCheck, Plus, Trash2, Users, UserPlus, Settings2, Calendar, Edit, Power, PowerOff, Ban, Eye } from "lucide-react";
import { inr } from "@/lib/utils";
import { adminService, AdminWorkspace, SubscriptionPlanConfigItem } from "@/lib/services/admin-service";
import { TableSkeletonRows } from "@/components/ui/skeleton-loaders";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/guest-plan")({
  head: () => ({
    meta: [
      { title: "Guest Plans & User Management — FinRoute Admin" },
      { name: "description", content: "Create multiple guest user plans, configure day add-ons, and manage guest quotas." },
    ],
  }),
  component: GuestPlanAdmin,
});

function GuestPlanAdmin() {
  const [guestPlans, setGuestPlans] = useState<SubscriptionPlanConfigItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  // Modal State for Creating/Editing Guest Plan
  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanConfigItem | null>(null);
  const [planForm, setPlanForm] = useState({
    plan_code: "",
    name: "",
    monthly_price: 199,
    annual_price: 1990,
    additional_days: 1,
    tagline: "",
    features_text: "",
    is_popular: false,
    is_active: true,
  });
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  // Modal State for Creating New Guest User
  const [openCreateUserModal, setOpenCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: "",
    mobile_number: "",
    email: "",
    password: "",
    workspace_name: "",
    city: "Jaipur",
    subscription_plan: "guest",
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Override, Edit & Details Modal State
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState({ max_collection_days: "", max_customers: "" });
  const [selectedGuestDetail, setSelectedGuestDetail] = useState<AdminWorkspace | null>(null);

  const [editingGuestLender, setEditingGuestLender] = useState<AdminWorkspace | null>(null);
  const [editLenderForm, setEditLenderForm] = useState({
    owner_name: "",
    owner_mobile: "",
    owner_email: "",
    name: "",
    city: "",
    state: "",
    subscription_plan: "free",
    status: "active",
  });
  const [isUpdatingLender, setIsUpdatingLender] = useState(false);

  const loadData = async () => {
    setLoadingPlans(true);
    setLoadingWorkspaces(true);
    try {
      const [plansRes, wsRes] = await Promise.all([
        adminService.getGuestPlans(),
        adminService.getWorkspaces(),
      ]);
      setGuestPlans(plansRes || []);
      setWorkspaces(wsRes || []);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      toast.error(err.message || "Failed to load admin data");
    } finally {
      setLoadingPlans(false);
      setLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanForm({
      plan_code: "",
      name: "Plan 1 — 2 Days / Week",
      monthly_price: 199,
      annual_price: 1990,
      additional_days: 1,
      tagline: "2 Collection Days per week with unlimited customers",
      features_text: "2 Collection Days / Week, Unlimited Customers, Full Passbook & Ledger",
      is_popular: false,
      is_active: true,
    });
    setOpenPlanModal(true);
  };

  const openEditPlanModal = (plan: SubscriptionPlanConfigItem) => {
    setEditingPlan(plan);
    setPlanForm({
      plan_code: plan.plan_code,
      name: plan.name,
      monthly_price: Number(plan.monthly_price || 0),
      annual_price: Number(plan.annual_price || 0),
      additional_days: plan.additional_days || 1,
      tagline: plan.tagline || "",
      features_text: (plan.features || []).join(", "),
      is_popular: plan.is_popular,
      is_active: plan.is_active,
    });
    setOpenPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.plan_code || !planForm.name) {
      toast.error("Please provide Plan Code and Name.");
      return;
    }

    setIsSubmittingPlan(true);
    try {
      const featuresArray = planForm.features_text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const generatedCode =
        planForm.plan_code.trim() ||
        `guest_plan_${planForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "custom"}`;

      const payload: Partial<SubscriptionPlanConfigItem> = {
        plan_code: generatedCode,
        target_user_type: "guest",
        name: planForm.name,
        monthly_price: Number(planForm.monthly_price),
        annual_price: Number(planForm.annual_price || planForm.monthly_price * 10),
        additional_days: Number(planForm.additional_days),
        max_collection_days: 1 + Number(planForm.additional_days),
        max_customers: 0,
        tagline: planForm.tagline,
        features: featuresArray,
        is_popular: planForm.is_popular,
        is_active: planForm.is_active,
        sort_order: 10,
      };

      if (editingPlan && editingPlan.id) {
        await adminService.updateSubscriptionPlanConfig(editingPlan.id, payload);
        toast.success(`Guest plan ${planForm.name} updated successfully!`);
      } else {
        await adminService.createGuestPlan(payload);
        toast.success(`New guest plan ${planForm.name} created successfully!`);
      }

      setOpenPlanModal(false);
      await loadData();
    } catch (err: any) {
      console.error("Save plan error:", err);
      toast.error(err.message || "Failed to save guest plan.");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleDeletePlan = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete guest plan "${name}"?`)) return;
    try {
      await adminService.deleteSubscriptionPlanConfig(id);
      toast.success(`Guest plan "${name}" deleted.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete plan.");
    }
  };

  const handleCreateGuestUser = async () => {
    if (!newUserForm.full_name || !newUserForm.mobile_number || !newUserForm.password || !newUserForm.workspace_name) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsCreatingUser(true);
    try {
      await adminService.createLender({
        full_name: newUserForm.full_name,
        mobile_number: newUserForm.mobile_number,
        email: newUserForm.email || undefined,
        password: newUserForm.password,
        workspace_name: newUserForm.workspace_name,
        city: newUserForm.city,
        subscription_plan: newUserForm.subscription_plan,
        status: "active",
      });

      toast.success(`Guest User ${newUserForm.full_name} created successfully!`);
      setOpenCreateUserModal(false);
      setNewUserForm({
        full_name: "",
        mobile_number: "",
        email: "",
        password: "",
        workspace_name: "",
        city: "Jaipur",
        subscription_plan: "guest",
      });
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create guest user.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!editingWorkspaceId) return;
    try {
      await adminService.setQuotaOverride(editingWorkspaceId, {
        max_collection_days_override: overrideForm.max_collection_days ? Number(overrideForm.max_collection_days) : null,
        max_customers_override: overrideForm.max_customers ? Number(overrideForm.max_customers) : null,
      });
      toast.success("Guest Quota Override Saved");
      setEditingWorkspaceId(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to set quota override.");
    }
  };

  const handleOpenEditLender = (w: AdminWorkspace) => {
    setEditingGuestLender(w);
    setEditLenderForm({
      owner_name: w.owner_name,
      owner_mobile: w.owner_mobile,
      owner_email: w.owner_email || "",
      name: w.name,
      city: w.city || "",
      state: w.state || "",
      subscription_plan: w.subscription_plan || "free",
      status: w.status || "active",
    });
  };

  const handleSaveEditLender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuestLender) return;
    if (!editLenderForm.owner_name || !editLenderForm.owner_mobile || !editLenderForm.name) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsUpdatingLender(true);
    try {
      await adminService.updateLender(editingGuestLender.public_id, {
        owner_name: editLenderForm.owner_name,
        owner_mobile: editLenderForm.owner_mobile,
        owner_email: editLenderForm.owner_email || undefined,
        name: editLenderForm.name,
        city: editLenderForm.city,
        state: editLenderForm.state,
        subscription_plan: editLenderForm.subscription_plan,
        status: editLenderForm.status,
      });
      toast.success(`Updated lender details for ${editLenderForm.owner_name}`);
      setEditingGuestLender(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update lender details.");
    } finally {
      setIsUpdatingLender(false);
    }
  };

  const handleToggleWorkspaceStatus = async (id: string, currentStatus: string, name: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const actionLabel = nextStatus === "suspended" ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionLabel} workspace for "${name}"?`)) return;
    try {
      await adminService.updateWorkspaceStatus(id, nextStatus as any);
      toast.success(`Workspace for ${name} ${nextStatus === "suspended" ? "deactivated" : "activated"} successfully.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update workspace status.");
    }
  };

  const handleDeleteWorkspace = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete workspace and account for "${name}"? This action cannot be undone.`)) return;
    try {
      await adminService.deleteWorkspace(id);
      toast.success(`Guest workspace for ${name} deleted successfully.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete workspace.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <Card className="border-emerald-500/30 bg-gradient-to-tr from-emerald-500/10 via-emerald-500/5 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Guest User Plans & Day Add-Ons Configuration</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Configure multiple Guest User plans, set day-wise add-on prices, and manage guest quotas.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreatePlanModal} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md">
              <Plus className="size-4" /> Create Guest Plan
            </Button>
            <Button onClick={() => setOpenCreateUserModal(true)} variant="outline" className="gap-1.5 shadow-sm">
              <UserPlus className="size-4" /> Add Guest User
            </Button>
          </div>
        </div>
      </Card>

      {/* Guest User Plans Catalog Table */}
      <Card className="p-6 space-y-4 bg-card border-border shadow-sm rounded-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-display text-base font-bold flex items-center gap-2 text-foreground">
              <Calendar className="size-4 text-emerald-600" /> Configured Guest User Day Add-On Plans ({guestPlans.length})
            </h3>
            <p className="text-xs text-muted-foreground">Manage collection day add-on tiers available for Guest Users on the upgrade page.</p>
          </div>
          <Button onClick={openCreatePlanModal} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
            <Plus className="size-3.5" /> Add New Plan
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Plan Code</TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead>Monthly Price (₹)</TableHead>
              <TableHead>Add-on Days</TableHead>
              <TableHead>Total Allowed Days</TableHead>
              <TableHead>Tagline / Highlights</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPlans ? (
              <TableSkeletonRows rows={3} columns={8} />
            ) : guestPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  No guest plans configured yet. Click "Add New Plan" above to create one.
                </TableCell>
              </TableRow>
            ) : (
              guestPlans.map((plan) => (
                <TableRow key={plan.id || plan.plan_code}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{plan.plan_code}</TableCell>
                  <TableCell className="font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      {plan.name}
                      {plan.is_popular && (
                        <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-bold uppercase">Popular</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-700">{inr(plan.monthly_price)} / mo</TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-primary">+{plan.additional_days || 1} Day(s)</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {plan.max_collection_days || (1 + (plan.additional_days || 1))} Days / wk
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{plan.tagline || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={plan.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => openEditPlanModal(plan)} className="h-7 px-2 text-xs">
                        <Edit className="size-3.5 text-foreground" />
                      </Button>
                      {plan.id && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(plan.id!, plan.name)} className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Guest Users Table */}
      <Card className="p-6 space-y-4 bg-card border-border shadow-sm rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Users className="size-4 text-emerald-600" /> Registered Guest Lenders ({workspaces.length})
            </h3>
            <p className="text-xs text-muted-foreground">Manage guest user accounts, subscription tiers, and grant custom quota boosts.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpenCreateUserModal(true)} className="gap-1.5 text-xs">
            <Plus className="size-3.5" /> Add Guest Lender
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Guest Owner / Business</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Current Plan</TableHead>
              <TableHead>Purchased Add-Ons</TableHead>
              <TableHead>Allowed Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingWorkspaces ? (
              <TableSkeletonRows rows={5} columns={7} />
            ) : workspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  No guest lenders found.
                </TableCell>
              </TableRow>
            ) : (
              workspaces.map((w) => (
                <TableRow key={w.public_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border border-border">
                        <AvatarFallback className="bg-emerald-500/10 text-emerald-700 text-xs font-bold">
                          {w.owner_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{w.owner_name}</p>
                        <p className="text-xs text-muted-foreground">{w.name} {w.city ? `· ${w.city}` : ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{w.owner_mobile}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize bg-emerald-500/5 text-emerald-800">
                      {w.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{w.purchased_additional_days ? `+${w.purchased_additional_days} Days` : "0 Days"}</TableCell>
                  <TableCell className="text-xs font-bold font-mono text-emerald-700">{w.max_collection_days_override ?? (1 + (w.purchased_additional_days || 0))} Days / wk</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={w.status === "active" ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}>
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGuestDetail(w)}
                        className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        title="View Guest Plan & Day-Wise Breakdown"
                      >
                        <Eye className="size-3" /> <span className="hidden lg:inline font-semibold">View</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditLender(w)}
                        className="h-7 text-xs gap-1 border-blue-500/30 text-blue-700 hover:bg-blue-500/10 dark:text-blue-400"
                        title="Edit Guest Lender Details"
                      >
                        <Edit className="size-3" /> <span className="hidden lg:inline font-semibold">Edit</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingWorkspaceId(w.public_id);
                          setOverrideForm({
                            max_collection_days: w.max_collection_days_override ? String(w.max_collection_days_override) : "",
                            max_customers: w.max_customers_override ? String(w.max_customers_override) : "",
                          });
                        }}
                        className="h-7 text-xs gap-1"
                        title="Quota Override"
                      >
                        <Settings2 className="size-3" /> <span className="hidden lg:inline">Quota</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleWorkspaceStatus(w.public_id, w.status, w.owner_name)}
                        className={`h-7 text-xs gap-1 ${
                          w.status === "active"
                            ? "border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                            : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                        }`}
                        title={w.status === "active" ? "Deactivate Workspace" : "Activate Workspace"}
                      >
                        {w.status === "active" ? <PowerOff className="size-3" /> : <Power className="size-3" />}
                        <span className="hidden lg:inline">{w.status === "active" ? "Deactivate" : "Activate"}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWorkspace(w.public_id, w.owner_name)}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        title="Delete Workspace"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* CREATE / EDIT GUEST PLAN DIALOG MODAL */}
      <Dialog open={openPlanModal} onOpenChange={setOpenPlanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Calendar className="size-5" /> {editingPlan ? "Edit Guest User Plan" : "Create New Guest User Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure collection day add-on pricing and details for Guest Users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Plan Code</Label>
                <Input
                  placeholder="e.g. plan_2_days (auto-generated if empty)"
                  className="mt-1 font-mono text-xs"
                  value={planForm.plan_code}
                  onChange={(e) => setPlanForm({ ...planForm, plan_code: e.target.value })}
                  disabled={!!editingPlan}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Plan Display Name *</Label>
                <Input
                  placeholder="e.g. Plan 1 — 2 Days / Week"
                  className="mt-1 text-xs"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Monthly Price (₹) *</Label>
                <Input
                  type="number"
                  className="mt-1 font-mono font-bold text-emerald-700 text-xs"
                  value={planForm.monthly_price}
                  onChange={(e) => setPlanForm({ ...planForm, monthly_price: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Additional Business Days *</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  className="mt-1 font-mono font-bold text-xs"
                  value={planForm.additional_days}
                  onChange={(e) => setPlanForm({ ...planForm, additional_days: Number(e.target.value) })}
                  required
                />
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  1 Base Free Day + {Number(planForm.additional_days)} = <b>{1 + Number(planForm.additional_days)} Days / Wk Total</b>
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs flex items-center justify-between text-emerald-800">
              <span className="font-medium">Borrower Capacity:</span>
              <span className="font-bold">Unlimited Borrowers</span>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tagline / Description</Label>
              <Input
                placeholder="e.g. 2 Collection Days per week with unlimited customers"
                className="mt-1 text-xs"
                value={planForm.tagline}
                onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Features (Comma-separated)</Label>
              <Textarea
                placeholder="2 Collection Days / Week, Unlimited Borrowers, Full Passbook & Ledger"
                className="mt-1 text-xs"
                value={planForm.features_text}
                onChange={(e) => setPlanForm({ ...planForm, features_text: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={planForm.is_popular}
                  onChange={(e) => setPlanForm({ ...planForm, is_popular: e.target.checked })}
                  className="size-4 text-emerald-600 rounded"
                />
                Show "Recommended" Badge
              </label>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenPlanModal(false)} disabled={isSubmittingPlan}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmittingPlan}>
                {isSubmittingPlan ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE NEW GUEST USER DIALOG MODAL */}
      <Dialog open={openCreateUserModal} onOpenChange={setOpenCreateUserModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <UserPlus className="size-5" /> Add New Guest Lender
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a new guest lender account and provision their workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Lender Full Name *</Label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                className="mt-1 text-xs"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Mobile Number *</Label>
              <Input
                placeholder="e.g. 9876543210"
                className="mt-1 font-mono text-xs"
                value={newUserForm.mobile_number}
                onChange={(e) => setNewUserForm({ ...newUserForm, mobile_number: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Email Address (Optional)</Label>
              <Input
                type="email"
                placeholder="e.g. ramesh@finance.com"
                className="mt-1 text-xs"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Password *</Label>
              <PasswordInput
                placeholder="Set password for guest login"
                className="mt-1 text-xs"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Workspace / Business Name *</Label>
              <Input
                placeholder="e.g. Ramesh Daily Finance"
                className="mt-1 text-xs"
                value={newUserForm.workspace_name}
                onChange={(e) => setNewUserForm({ ...newUserForm, workspace_name: e.target.value })}
              />
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreateUserModal(false)} disabled={isCreatingUser}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateGuestUser} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isCreatingUser}>
                {isCreatingUser ? "Creating..." : "Create Guest User"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* QUOTA OVERRIDE MODAL */}
      <Dialog open={!!editingWorkspaceId} onOpenChange={() => setEditingWorkspaceId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Settings2 className="size-5" /> Set Custom Quota Override
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Grant custom collection day or customer limits for this specific guest workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Max Collection Days per Week</Label>
              <Input
                type="number"
                min={1}
                max={7}
                placeholder="Leave blank for plan default"
                className="mt-1 text-xs font-mono"
                value={overrideForm.max_collection_days}
                onChange={(e) => setOverrideForm({ ...overrideForm, max_collection_days: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Max Customers Override</Label>
              <Input
                type="number"
                placeholder="Leave blank for plan default"
                className="mt-1 text-xs font-mono"
                value={overrideForm.max_customers}
                onChange={(e) => setOverrideForm({ ...overrideForm, max_customers: e.target.value })}
              />
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingWorkspaceId(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveOverride} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Save Override
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* GUEST USER DETAILS & DAY-WISE CUSTOMER BREAKDOWN MODAL */}
      <Dialog open={!!selectedGuestDetail} onOpenChange={(open) => !open && setSelectedGuestDetail(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Users className="size-5 text-primary" /> Guest Workspace & Day-Wise Analysis
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Detailed configuration, current subscription plan, collection days, and day-wise customer distribution.
            </DialogDescription>
          </DialogHeader>

          {selectedGuestDetail && (
            <div className="space-y-4 pt-2">
              {/* Profile Header Card */}
              <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {selectedGuestDetail.owner_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-base text-foreground">{selectedGuestDetail.owner_name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{selectedGuestDetail.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize font-semibold bg-primary/10 text-primary border-primary/20">
                      Plan: {selectedGuestDetail.subscription_plan}
                    </Badge>
                    <Badge variant="outline" className={selectedGuestDetail.status === "active" ? "bg-emerald-500/15 text-emerald-700 font-semibold" : "bg-rose-500/15 text-rose-700 font-semibold"}>
                      {selectedGuestDetail.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-muted-foreground pt-1">
                  <div>📱 Mobile: <span className="font-mono font-bold text-foreground">{selectedGuestDetail.owner_mobile}</span></div>
                  <div>✉️ Email: <span className="font-medium text-foreground">{selectedGuestDetail.owner_email || "N/A"}</span></div>
                  <div>📍 Location: <span className="font-medium text-foreground">{[selectedGuestDetail.city, selectedGuestDetail.state].filter(Boolean).join(", ") || "N/A"}</span></div>
                  <div>📅 Registered: <span className="font-medium text-foreground">{new Date(selectedGuestDetail.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                </div>
              </div>

              {/* Plan & Capacity Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card className="p-3 bg-card border-border/80 text-center space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">Configured Days</span>
                  <p className="text-lg font-bold font-mono text-primary">
                    {selectedGuestDetail.configured_days_count || (selectedGuestDetail.allowed_collection_days?.length || 0)} Days
                  </p>
                  <p className="text-[10px] text-muted-foreground">of {selectedGuestDetail.max_collection_days || 1} allowed</p>
                </Card>

                <Card className="p-3 bg-card border-border/80 text-center space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">Active Plan</span>
                  <p className="text-lg font-bold capitalize text-emerald-700 dark:text-emerald-400">
                    {selectedGuestDetail.subscription_plan}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{selectedGuestDetail.purchased_additional_days ? `+${selectedGuestDetail.purchased_additional_days} Add-on Days` : "Base Plan"}</p>
                </Card>

                <Card className="p-3 bg-card border-border/80 text-center space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">Total Borrowers</span>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {selectedGuestDetail.customer_count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Outstanding: {inr(selectedGuestDetail.total_outstanding_amount || 0)}</p>
                </Card>
              </div>

              {/* Configured Route Collection Days */}
              <div className="p-3.5 bg-muted/30 border border-border/60 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" /> Configured Route Collection Days
                </h4>
                {selectedGuestDetail.allowed_collection_days && selectedGuestDetail.allowed_collection_days.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedGuestDetail.allowed_collection_days.map((day) => (
                      <Badge key={day} variant="secondary" className="capitalize font-semibold text-xs py-1 px-2.5 bg-primary/10 text-primary border border-primary/20">
                        {day}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No collection days explicitly configured yet.</p>
                )}
              </div>

              {/* Day-Wise Customer Added Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="size-3.5 text-primary" /> Borrowers Added Per Collection Day
                  </h4>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    Total: {selectedGuestDetail.customer_count} Borrowers
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "monday", label: "Monday" },
                    { key: "tuesday", label: "Tuesday" },
                    { key: "wednesday", label: "Wednesday" },
                    { key: "thursday", label: "Thursday" },
                    { key: "friday", label: "Friday" },
                    { key: "saturday", label: "Saturday" },
                    { key: "sunday", label: "Sunday" },
                    { key: "unassigned", label: "Unassigned" },
                  ].map(({ key, label }) => {
                    const count = selectedGuestDetail.day_wise_customer_counts?.[key] || 0;
                    const isConfigured = selectedGuestDetail.allowed_collection_days?.includes(key);

                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-lg border text-left space-y-1 transition-all ${
                          count > 0
                            ? "bg-primary/5 border-primary/30 text-foreground"
                            : isConfigured
                            ? "bg-muted/40 border-border/80 text-muted-foreground"
                            : "bg-muted/10 border-border/40 text-muted-foreground/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold">{label}</span>
                          {isConfigured && (
                            <span className="size-1.5 rounded-full bg-emerald-500" title="Configured Route Day" />
                          )}
                        </div>
                        <p className={`font-mono text-base font-extrabold ${count > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {count} <span className="text-[10px] font-normal text-muted-foreground">customers</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedGuestDetail(null)}>
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT GUEST LENDER DIALOG MODAL */}
      <Dialog open={!!editingGuestLender} onOpenChange={(open) => !open && setEditingGuestLender(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Edit className="size-5" /> Edit Guest Lender Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update account holder name, contact info, business name, location, and subscription plan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditLender} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Lender Full Name *</Label>
              <Input
                className="mt-1 text-xs"
                value={editLenderForm.owner_name}
                onChange={(e) => setEditLenderForm({ ...editLenderForm, owner_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Mobile Number *</Label>
                <Input
                  className="mt-1 font-mono text-xs"
                  value={editLenderForm.owner_mobile}
                  onChange={(e) => setEditLenderForm({ ...editLenderForm, owner_mobile: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  className="mt-1 text-xs"
                  value={editLenderForm.owner_email}
                  onChange={(e) => setEditLenderForm({ ...editLenderForm, owner_email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Workspace / Business Name *</Label>
              <Input
                className="mt-1 text-xs"
                value={editLenderForm.name}
                onChange={(e) => setEditLenderForm({ ...editLenderForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  className="mt-1 text-xs"
                  value={editLenderForm.city}
                  onChange={(e) => setEditLenderForm({ ...editLenderForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">State</Label>
                <Input
                  className="mt-1 text-xs"
                  value={editLenderForm.state}
                  onChange={(e) => setEditLenderForm({ ...editLenderForm, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Subscription Plan</Label>
                <Select value={editLenderForm.subscription_plan} onValueChange={(v) => setEditLenderForm({ ...editLenderForm, subscription_plan: v })}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free / Guest</SelectItem>
                    <SelectItem value="starter">ERP Starter</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={editLenderForm.status} onValueChange={(v) => setEditLenderForm({ ...editLenderForm, status: v })}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="read_only">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingGuestLender(null)} disabled={isUpdatingLender}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={isUpdatingLender}>
                {isUpdatingLender ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
