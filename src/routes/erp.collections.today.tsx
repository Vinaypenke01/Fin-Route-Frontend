import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionHeader, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { collections, inr } from "@/lib/erp-data";
import { ArrowLeft, MapPin, Clock, Wallet } from "lucide-react";

export const Route = createFileRoute("/erp/collections/today")({
  head: () => ({ meta: [{ title: "Today's Collections — FinRoute ERP" }, { name: "description", content: "Collector view for today's visits and receipts." }] }),
  component: TodayPage,
});

function TodayPage() {
  const today = collections.slice(0, 60);
  const paid = today.filter((c) => c.status === "Paid").length;
  const partial = today.filter((c) => c.status === "Partial").length;
  const skipped = today.filter((c) => c.status === "Skipped").length;
  const pending = today.filter((c) => c.status === "Pending").length;
  const collected = today.reduce((s, c) => s + c.collected, 0);
  const expected = today.reduce((s, c) => s + c.expected, 0);
  const progress = Math.round(((paid + partial) / today.length) * 100);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/erp/collections"><ArrowLeft className="size-4" /> Back</Link></Button>

      <SectionHeader title="Today's collections" description={`${today.length} scheduled visits across all routes`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Paid" value={paid} tone="positive" />
        <KpiCard label="Partial" value={partial} tone="warning" />
        <KpiCard label="Skipped" value={skipped} tone="danger" />
        <KpiCard label="Pending" value={pending} />
        <KpiCard label="Collected" value={inr(collected)} icon={<Wallet className="size-4" />} />
      </div>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Route progress</span>
          <span className="font-semibold">{progress}% · {inr(collected)} of {inr(expected)}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {today.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.customerName}</p>
                <p className="truncate text-xs text-muted-foreground">{c.id}</p>
              </div>
              <StatusChip status={c.status} />
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1"><MapPin className="size-3" /> {c.area}</p>
              <p className="flex items-center gap-1"><Clock className="size-3" /> {c.timestamp}</p>
              <p>by {c.collectorName}</p>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/60 p-2 text-xs">
              <span>Expected {inr(c.expected)}</span>
              <span className="font-semibold">{inr(c.collected)}</span>
            </div>
            {c.remarks && <Badge variant="secondary" className="mt-2 text-[10px]">{c.remarks}</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}
