import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Collection } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";

export const Route = createFileRoute("/app/collections/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Collection — FinRoute" },
      { name: "description", content: "Update a recorded collection entry." },
    ],
  }),
  component: EditCollectionPage,
});

function EditCollectionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [statuses, setStatuses] = useState<MasterItem[]>([]);
  
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<number>(1);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [collRes, modesRes, statusRes] = await Promise.all([
          guestWorkspaceService.getCollections(),
          mastersService.getPaymentModes(),
          mastersService.getCollectionStatuses(),
        ]);
        setPaymentModes(modesRes);
        setStatuses(statusRes);

        const found = collRes.data?.find((c) => c.public_id === id || c.receipt_number === id);
        if (found) {
          setCollection(found);
          setCollectedAmount(found.collected_amount || 0);
          setRemarks(found.remarks || "");
          if (found.payment_mode) setSelectedPaymentMode(found.payment_mode);
          if (found.status) setSelectedStatus(found.status);
        }
      } catch (err) {
        console.error("Failed to load collection for editing:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection) return;
    setSubmitting(true);
    setError(null);

    try {
      await guestWorkspaceService.recordCollection({
        customer: collection.customer_public_id,
        collection_date: collection.collection_date,
        expected_amount: collection.expected_amount,
        collected_amount: collectedAmount,
        status: selectedStatus,
        payment_mode: selectedPaymentMode,
        remarks,
      });

      navigate({ to: "/app/collections" as any });
    } catch (err: any) {
      setError(err.message || "Failed to update collection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-xs text-muted-foreground">
        Loading receipt for editing...
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-md p-8 text-center space-y-4">
        <h2 className="font-display text-lg font-bold">Collection Not Found</h2>
        <Button asChild><Link to="/app/collections">Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/app/collections/$id" params={{ id }}><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <h2 className="font-display text-xl font-bold">Edit Collection Entry</h2>
          <p className="text-xs text-muted-foreground font-mono">{collection.receipt_number}</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div>
            <Label className="text-xs">Borrower</Label>
            <p className="font-semibold text-sm mt-1">{collection.customer_name} ({collection.customer_code})</p>
          </div>

          <div>
            <Label className="text-xs">Collected Amount (₹)</Label>
            <Input
              type="number"
              className="mt-1 font-bold"
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <Label className="text-xs">Payment Mode</Label>
            <Select value={selectedPaymentMode.toString()} onValueChange={(v) => setSelectedPaymentMode(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentModes.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Status</Label>
            <Select value={selectedStatus.toString()} onValueChange={(v) => setSelectedStatus(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Remarks / Notes</Label>
            <Textarea
              className="mt-1"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
