import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeader, KpiCard, EmptyState, StatusChip } from "@/components/erp/erp-ui";
import { erpRoutes, customers, inr } from "@/lib/erp-data";
import { ArrowLeft, GripVertical, MapPin, Timer, Users, Wallet, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/erp/routes/$id")({
  head: () => ({ meta: [{ title: "Route Detail — FinRoute ERP" }, { name: "description", content: "Sequence, timings and progress for a single route." }] }),
  component: RouteDetail,
});

function RouteDetail() {
  const { id } = Route.useParams();
  const route = erpRoutes.find((r) => r.id === id);
  const [seq, setSeq] = useState(() => customers.filter((c) => c.area === route?.area).slice(0, 10));

  if (!route) return <EmptyState title="Route not found" action={<Button asChild><Link to="/erp/routes">Back</Link></Button>} />;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= seq.length) return;
    const copy = [...seq];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setSeq(copy);
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/erp/routes"><ArrowLeft className="size-4" /> Back</Link></Button>
      <SectionHeader
        title={route.name}
        description={`${route.id} · ${route.collectorName}`}
        action={
          <>
            <StatusChip status={route.status} />
            <Button variant="outline" size="sm">Reassign</Button>
            <Button size="sm">Start</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Customers" value={route.customers} icon={<Users className="size-4" />} />
        <KpiCard label="Distance" value={`${route.distanceKm} km`} icon={<MapPin className="size-4" />} />
        <KpiCard label="Estimated" value={`${route.estimatedMin} min`} icon={<Timer className="size-4" />} />
        <KpiCard label="Collected" value={inr(route.collected)} tone="positive" icon={<Wallet className="size-4" />} />
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{route.completion}%</span>
        </div>
        <Progress value={route.completion} className="h-2" />
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Customer sequence</h3>
          <p className="text-xs text-muted-foreground">Drag to reorder (visual)</p>
        </div>
        <ul className="divide-y divide-border">
          {seq.map((c, i) => (
            <li key={c.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="flex items-center gap-2">
                <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.address}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="hidden text-right text-xs font-semibold sm:inline">{inr(c.outstanding)}</span>
                <Button variant="ghost" size="icon" onClick={() => move(i, i - 1)}><ArrowUp className="size-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => move(i, i + 1)}><ArrowDown className="size-3.5" /></Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
