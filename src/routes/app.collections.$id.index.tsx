import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Collection } from "@/lib/services/guest-workspace-service";

export const Route = createFileRoute("/app/collections/$id/")({
  head: () => ({
    meta: [
      { title: "Collection Receipt — FinRoute" },
      { name: "description", content: "View a collection entry receipt." },
    ],
  }),
  component: ViewCollectionPage,
});

function ViewCollectionPage() {
  const { id } = Route.useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await guestWorkspaceService.getCollections();
        const found = res.data?.find((c) => c.public_id === id || c.receipt_number === id);
        if (found) setCollection(found);
      } catch (err) {
        console.error("Failed to load collection receipt:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-xs text-muted-foreground">
        Loading receipt details from database...
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-md p-8 text-center space-y-4">
        <h2 className="font-display text-lg font-bold">Collection Not Found</h2>
        <p className="text-xs text-muted-foreground">This receipt no longer exists in your workspace.</p>
        <Button asChild><Link to="/app/collections">Back to Collections</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/app/collections"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold">Collection Receipt</h2>
          <p className="text-xs text-muted-foreground font-mono">{collection.receipt_number}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4 mr-1" /> Print Receipt
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <p className="text-xs text-muted-foreground">Receipt Number</p>
            <p className="font-mono font-bold text-sm">{collection.receipt_number}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground text-right">Date</p>
            <p className="text-sm font-semibold">{collection.collection_date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Borrower Name</p>
            <p className="font-bold text-sm">{collection.customer_name}</p>
            <p className="text-muted-foreground mt-0.5">{collection.customer_code}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Amount Collected</p>
            <p className="font-bold text-lg text-emerald-600">{inr(collection.collected_amount)}</p>
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Payment Mode</p>
            <Badge variant="outline" className="mt-1">{collection.payment_mode_name || "Cash"}</Badge>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Status</p>
            <Badge variant="outline" className="mt-1 capitalize">{collection.status_name || "Paid"}</Badge>
          </div>
        </div>

        {collection.remarks && (
          <div className="border-t pt-4 text-xs">
            <p className="text-muted-foreground">Remarks</p>
            <p className="mt-1 font-medium">{collection.remarks}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
