import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, RefreshCw, Crown, ShieldAlert, Check, X, Phone, Building2 } from "lucide-react";
import { adminService, PlanUpgradeRequestItem } from "@/lib/services/admin-service";
import { inr, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/upgrade-requests")({
  head: () => ({
    meta: [
      { title: "Plan Upgrade Requests — Super Admin Console" },
      { name: "description", content: "Review, approve, or reject guest lender plan upgrade requests." },
    ],
  }),
  component: AdminUpgradeRequestsPage,
});

function AdminUpgradeRequestsPage() {
  const [requests, setRequests] = useState<PlanUpgradeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUpgradeRequests({ status: filterStatus });
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to load upgrade requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const handleUpdateStatus = async (id: number, status: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      await adminService.updateUpgradeRequestStatus(id, status);
      await loadRequests();
    } catch (err: any) {
      alert(err.message || `Failed to update request to ${status}`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-primary/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-white border border-primary/30 text-xs font-semibold mb-2">
            <Crown className="size-3.5 text-amber-400" /> Plan Upgrade Moderation
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Plan Upgrade Requests</h1>
          <p className="text-xs text-slate-200 mt-1">
            Review guest lender upgrade inquiries submitted via WhatsApp/Upgrade page and activate their collection days capacity upon approval.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRequests} disabled={loading} className="text-white border-white/30 bg-white/10 hover:bg-white/20 self-start sm:self-auto">
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh List
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: "All Requests" },
            { key: "pending", label: `Pending (${pendingCount})` },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filterStatus === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus(tab.key)}
              className="text-xs font-semibold rounded-lg"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <Card className="p-0 overflow-hidden border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[180px]">Workspace & Lender</TableHead>
              <TableHead>Requested Plan</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Collection Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  Loading upgrade requests...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  No upgrade requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => {
                const isPending = r.status === "pending";
                const isApproved = r.status === "approved";

                return (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="space-y-1 py-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                        <Building2 className="size-3.5 text-primary shrink-0" />
                        <span>{r.workspace_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{r.lender_name}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="font-mono flex items-center gap-0.5"><Phone className="size-3 text-slate-400" /> {r.lender_mobile}</span>
                      </div>
                    </TableCell>

                    <TableCell className="space-y-1">
                      {r.plan_code === "full_module_unlock" ? (
                        <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] gap-1 px-2 py-0.5">
                          🔓 Full Module Unlock
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] gap-1 px-2 py-0.5">
                          🛣️ Line Quota Upgrade
                        </Badge>
                      )}
                      <span className="block font-semibold text-xs text-foreground mt-0.5">{r.plan_name}</span>
                    </TableCell>

                    <TableCell className="font-bold text-xs font-mono">
                      {inr(r.amount)}
                    </TableCell>

                    <TableCell className="text-xs">
                      {r.plan_code === "full_module_unlock" || r.additional_days === 0 ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-bold">
                          All Modules
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                          +{r.additional_days} Line{r.additional_days > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {r.status === "pending" ? (
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                          <Clock className="size-3 mr-1" /> Pending
                        </Badge>
                      ) : r.status === "approved" ? (
                        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          <CheckCircle2 className="size-3 mr-1" /> Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px]">
                          <XCircle className="size-3 mr-1" /> Rejected
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(r.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(r.id, "approved")}
                            disabled={processingId === r.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2.5 text-xs font-bold"
                          >
                            <Check className="size-3.5 mr-1" /> Approve & Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(r.id, "rejected")}
                            disabled={processingId === r.id}
                            className="text-rose-600 hover:bg-rose-50 border-rose-200 h-8 px-2 text-xs font-semibold"
                          >
                            <X className="size-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic capitalize">
                          {r.status}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
