import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Plus, UserPlus, MapPin, KeyRound, Edit, ShieldAlert } from "lucide-react";
import { adminService, AdminWorkspace } from "@/lib/services/admin-service";
import { isValidIndianMobile } from "@/lib/utils";

export const Route = createFileRoute("/admin/lenders")({
  head: () => ({ meta: [{ title: "Lender Management — Admin" }] }),
  component: LendersPage,
});

function LendersPage() {
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<AdminWorkspace | null>(null);
  const [grantingWorkspace, setGrantingWorkspace] = useState<AdminWorkspace | null>(null);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await adminService.getWorkspaces({
        search: q || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setWorkspaces(res || []);
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [q, statusFilter]);

  const handleToggleStatus = async (public_id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await adminService.updateWorkspaceStatus(public_id, newStatus);
      loadWorkspaces();
    } catch (err) {
      console.error("Failed to toggle workspace status:", err);
    }
  };

  const filtered = workspaces.filter(
    (w) =>
      !q ||
      w.name.toLowerCase().includes(q.toLowerCase()) ||
      w.owner_name.toLowerCase().includes(q.toLowerCase()) ||
      w.owner_mobile.includes(q) ||
      (w.city && w.city.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Registered Lender Management</h2>
          <p className="text-sm text-muted-foreground">Register new lenders, manage business locations, plans, and custom quota limits.</p>
        </div>
        <AddLenderModal open={isAddOpen} setOpen={setIsAddOpen} onSuccess={loadWorkspaces} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total Registered Lenders</p>
          <p className="mt-1 font-display text-2xl font-bold">{loading ? "..." : workspaces.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Active Workspaces</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-600">
            {loading ? "..." : workspaces.filter((w) => w.status === "active").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Suspended</p>
          <p className="mt-1 font-display text-2xl font-bold text-rose-600">
            {loading ? "..." : workspaces.filter((w) => w.status === "suspended").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Premium Subscribers</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">
            {loading ? "..." : workspaces.filter((w) => w.subscription_plan === "premium").length}
          </p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by workspace, owner name, mobile, or city…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="read_only">Read Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace Name</TableHead>
              <TableHead>Owner & Mobile</TableHead>
              <TableHead>Location (City / State)</TableHead>
              <TableHead>Borrowers</TableHead>
              <TableHead>Subscription Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  Loading registered lenders from database...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  No registered lenders found matching your filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((w) => (
                <TableRow key={w.public_id}>
                  <TableCell className="font-bold">{w.name}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{w.owner_name}</div>
                    <div className="text-xs text-muted-foreground">{w.owner_mobile}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {w.city || w.state ? `${w.city || ""}${w.city && w.state ? ", " : ""}${w.state || ""}` : "Not specified"}
                  </TableCell>
                  <TableCell>{w.customer_count || 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{w.subscription_plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={w.status === "active" ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}>
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    {w.subscription_plan !== "premium" && (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        onClick={() => setGrantingWorkspace(w)}
                      >
                        ⚡ Grant Access
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingWorkspace(w)}
                    >
                      <Edit className="size-4 mr-1" /> Edit / View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(w.public_id, w.status)}
                    >
                      {w.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {editingWorkspace && (
        <EditLenderModal
          workspace={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          onSuccess={loadWorkspaces}
        />
      )}

      {grantingWorkspace && (
        <GrantAccessDialogModal
          workspace={grantingWorkspace}
          onClose={() => setGrantingWorkspace(null)}
          onSuccess={loadWorkspaces}
        />
      )}
    </div>
  );
}

function AddLenderModal({ open, setOpen, onSuccess }: { open: boolean; setOpen: (v: boolean) => void; onSuccess: () => void }) {
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Lender@123456");
  const [workspaceName, setWorkspaceName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [plan, setPlan] = useState("free");
  const [maxCustomers, setMaxCustomers] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!isValidIndianMobile(mobileNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      setSubmitting(false);
      return;
    }

    try {
      await adminService.createLender({
        full_name: fullName,
        mobile_number: mobileNumber,
        email: email || undefined,
        password,
        workspace_name: workspaceName,
        address,
        city,
        state,
        pin_code: pinCode,
        subscription_plan: plan,
        max_customers_override: maxCustomers === "" ? null : Number(maxCustomers),
      });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to register new lender.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="size-4 mr-1" /> Add New Lender</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register New Lender Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <Tabs defaultValue="owner" className="space-y-3">
            <TabsList className="w-full">
              <TabsTrigger value="owner" className="flex-1">1. Owner Details</TabsTrigger>
              <TabsTrigger value="location" className="flex-1">2. Location & Business</TabsTrigger>
              <TabsTrigger value="quota" className="flex-1">3. Plan & Quotas</TabsTrigger>
            </TabsList>

            <TabsContent value="owner" className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium">Owner Full Name</label>
                <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="e.g. Ramesh Sharma" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Mobile Number</label>
                  <PhoneInput className="mt-1" value={mobileNumber.replace(/^\+91/, "")} onChange={(e) => setMobileNumber(e.target.value.startsWith("+91") ? e.target.value : `+91${e.target.value}`)} required placeholder="9876543210" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email (Optional)</label>
                  <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ramesh@sharmafinance.in" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Initial Password</label>
                <PasswordInput className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium">Business / Workspace Name</label>
                <Input className="mt-1" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required placeholder="e.g. Sharma Finance" />
              </div>
              <div>
                <label className="text-xs font-medium">Street Address</label>
                <Input className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop No 12, Main Bazaar" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">City</label>
                  <Input className="mt-1" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jaipur" />
                </div>
                <div>
                  <label className="text-xs font-medium">State</label>
                  <Input className="mt-1" value={state} onChange={(e) => setState(e.target.value)} placeholder="Rajasthan" />
                </div>
                <div>
                  <label className="text-xs font-medium">PIN Code</label>
                  <Input className="mt-1" value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="302001" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quota" className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium">Subscription Tier</label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Guest Free (50 customers limit)</SelectItem>
                    <SelectItem value="premium">Guest Premium (Unlimited)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Custom Customer Limit Override (Optional)</label>
                <Input type="number" className="mt-1" value={maxCustomers} onChange={(e) => setMaxCustomers(e.target.value ? Number(e.target.value) : "")} placeholder="Leave empty for plan default" />
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Registering Lender..." : "Create Lender Workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditLenderModal({ workspace, onClose, onSuccess }: { workspace: AdminWorkspace; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(workspace.name);
  const [address, setAddress] = useState(workspace.address || "");
  const [city, setCity] = useState(workspace.city || "");
  const [state, setState] = useState(workspace.state || "");
  const [pinCode, setPinCode] = useState(workspace.pin_code || "");
  const [plan, setPlan] = useState(workspace.subscription_plan);
  const [status, setStatus] = useState(workspace.status);
  const [maxCustomers, setMaxCustomers] = useState<number | "">(workspace.max_customers_override ?? "");
  const [newPassword, setNewPassword] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminService.updateLender(workspace.public_id, {
        name,
        address,
        city,
        state,
        pin_code: pinCode,
        subscription_plan: plan,
        status,
        max_customers_override: maxCustomers === "" ? null : Number(maxCustomers),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update lender details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setResetting(true);
    setError(null);
    try {
      await adminService.resetLenderPassword(workspace.public_id, newPassword);
      setMsg("Password reset successfully.");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Lender Profile & Location</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
          {msg && (
            <div className="p-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md">
              {msg}
            </div>
          )}

          <div>
            <label className="text-xs font-medium">Workspace / Business Name</label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-medium">Address</label>
            <Input className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">City</label>
              <Input className="mt-1" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">State</label>
              <Input className="mt-1" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">PIN Code</label>
              <Input className="mt-1" value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Subscription Plan</label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Tier</SelectItem>
                  <SelectItem value="premium">Premium Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="read_only">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Custom Customer Limit Override</label>
            <Input type="number" className="mt-1" value={maxCustomers} onChange={(e) => setMaxCustomers(e.target.value ? Number(e.target.value) : "")} placeholder="Plan default" />
          </div>

          <div className="border-t pt-3 space-y-2">
            <label className="text-xs font-semibold">Reset Lender Password</label>
            <div className="flex gap-2">
              <PasswordInput placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button type="button" variant="outline" onClick={handleResetPassword} disabled={resetting}>
                <KeyRound className="size-4 mr-1" /> Reset
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save Workspace Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GrantAccessDialogModal({
  workspace,
  onClose,
  onSuccess,
}: {
  workspace: AdminWorkspace;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [duration, setDuration] = useState("30 Days (1 Month)");
  const [allowedLines, setAllowedLines] = useState("Unlimited Lines");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await adminService.updateLender(workspace.public_id, {
        subscription_plan: "premium",
      });
      alert(`🎉 Granted Premium Access (${duration}, ${allowedLines}) to '${workspace.name}'!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to grant access.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700">
            ⚡ Grant Premium Access
          </DialogTitle>
          <DialogDescription className="text-xs">
            Confirm subscription plan activation for <strong>{workspace.name}</strong> ({workspace.owner_mobile}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGrant} className="space-y-4 pt-2">
          {error && <div className="p-2.5 bg-rose-500/10 text-rose-700 text-xs rounded-lg font-medium">{error}</div>}

          <div>
            <label className="text-xs font-bold">Configured Subscription Duration / Validity</label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="mt-1 font-bold">
                <SelectValue placeholder="Select Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 Days (1 Month)">30 Days (1 Month)</SelectItem>
                <SelectItem value="90 Days (3 Months)">90 Days (3 Months)</SelectItem>
                <SelectItem value="180 Days (6 Months)">180 Days (6 Months)</SelectItem>
                <SelectItem value="365 Days (1 Year)">365 Days (1 Year)</SelectItem>
                <SelectItem value="Lifetime Access">Lifetime Access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">Validity period for unlocking Customers, Collections, Expenses & Reports.</p>
          </div>

          <div>
            <label className="text-xs font-bold">Allowed Collection Lines Quota</label>
            <Select value={allowedLines} onValueChange={setAllowedLines}>
              <SelectTrigger className="mt-1 font-bold">
                <SelectValue placeholder="Select Line Quota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unlimited Lines">Unlimited Lines</SelectItem>
                <SelectItem value="5 Lines">5 Lines</SelectItem>
                <SelectItem value="10 Lines">10 Lines</SelectItem>
                <SelectItem value="20 Lines">20 Lines</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">Route lines allowed for this lender.</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" disabled={submitting}>
              {submitting ? "Granting..." : "⚡ Confirm & Grant Access"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
