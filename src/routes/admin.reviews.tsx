import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Star, CheckCircle, XCircle, Trash2, RefreshCw, ShieldCheck, Clock } from "lucide-react";
import { adminService } from "@/lib/services/admin-service";
import { CustomerReview } from "@/lib/services/masters-service";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Customer Reviews Moderation — Admin Console" },
      { name: "description", content: "Approve, reject, or delete submitted customer reviews and testimonials." },
    ],
  }),
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionId, setActionId] = useState<number | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const list = await adminService.getReviews({ status: statusFilter });
      setReviews(list);
    } catch (err) {
      console.error("Failed to load customer reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: number, newStatus: "approved" | "rejected") => {
    setActionId(id);
    try {
      await adminService.updateReviewStatus(id, newStatus);
      await loadReviews();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    setActionId(id);
    try {
      await adminService.deleteReview(id);
      await loadReviews();
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="size-6 text-primary" /> Customer Reviews & Testimonials Moderation
          </h2>
          <p className="text-sm text-muted-foreground">
            Approve submitted customer feedback before it appears live on the public landing page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReviews} disabled={loading} className="h-9">
          <RefreshCw className={`size-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1 bg-card border-border shadow-xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Total Submitted Reviews</p>
          <p className="text-2xl font-bold font-mono text-foreground">{reviews.length}</p>
        </Card>
        <Card className="p-4 space-y-1 bg-amber-500/10 border-amber-500/30">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
            <Clock className="size-3.5" /> Pending Admin Approval
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{pendingCount}</p>
        </Card>
        <Card className="p-4 space-y-1 bg-emerald-500/10 border-emerald-500/30">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> Approved & Live on Landing Page
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{approvedCount}</p>
        </Card>
      </div>

      {/* Main Reviews Moderation Table */}
      <Card className="p-4 space-y-4 border-border">
        <div className="flex items-center justify-between gap-4 border-b pb-3">
          <h3 className="text-sm font-bold text-foreground">Reviews Directory</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Status Filter:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="approved">Approved Only</SelectItem>
                <SelectItem value="rejected">Rejected Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground py-10 text-center">Loading customer reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-muted-foreground py-10 text-center">No reviews found matching the filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="py-2.5">Author & Business</TableHead>
                  <TableHead className="py-2.5">Rating</TableHead>
                  <TableHead className="py-2.5 max-w-md">Review Content</TableHead>
                  <TableHead className="py-2.5">Status</TableHead>
                  <TableHead className="py-2.5 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="py-3">
                      <p className="font-bold text-foreground">{r.author_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.role_title || "Lender"} {r.business_name ? `• ${r.business_name}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-current" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 max-w-md">
                      <p className="text-xs leading-relaxed text-foreground/90 italic">"{r.review_text}"</p>
                    </TableCell>
                    <TableCell className="py-3">
                      {r.status === "approved" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-400/30 text-[10px] py-0 font-bold">
                          Approved & Live
                        </Badge>
                      ) : r.status === "rejected" ? (
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-400/30 text-[10px] py-0 font-bold">
                          Rejected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-400/30 text-[10px] py-0 font-bold">
                          Pending Approval
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {r.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border-emerald-500/30 font-semibold"
                            disabled={actionId === r.id}
                            onClick={() => handleUpdateStatus(r.id, "approved")}
                          >
                            <CheckCircle className="size-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/30 font-semibold"
                            disabled={actionId === r.id}
                            onClick={() => handleUpdateStatus(r.id, "rejected")}
                          >
                            <XCircle className="size-3.5 mr-1" /> Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                          disabled={actionId === r.id}
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
