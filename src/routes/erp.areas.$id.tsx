import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader, KpiCard, EmptyState, StatusChip } from "@/components/erp/erp-ui";
import { areas, customers, erpRoutes, employees, inr, inrCompact } from "@/lib/erp-data";
import { MapPin, ArrowLeft, Users, Landmark, Percent, Route as RouteIcon } from "lucide-react";

export const Route = createFileRoute("/erp/areas/$id")({
  head: () => ({ meta: [{ title: "Area Detail — FinRoute ERP" }, { name: "description", content: "Territory performance, customers, routes and collectors." }] }),
  component: AreaDetail,
});

function AreaDetail() {
  const { id } = Route.useParams();
  const area = areas.find((a) => a.id === id);
  if (!area) return <EmptyState title="Area not found" description="This territory doesn't exist." action={<Button asChild><Link to="/erp/areas">Back to areas</Link></Button>} />;

  const custs = customers.filter((c) => c.area === area.name).slice(0, 8);
  const rts = erpRoutes.filter((r) => r.area === area.name);
  const collector = employees.find((e) => e.id === area.collectorId);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/erp/areas"><ArrowLeft className="size-4" /> Back</Link></Button>
      <SectionHeader
        title={area.name}
        description={`${area.city} · ${area.pincode} · ${area.id}`}
        action={
          <>
            <Button variant="outline" size="sm">Reassign collector</Button>
            <Button variant="outline" size="sm">Merge</Button>
            <Button variant="outline" size="sm">Split</Button>
            <Button variant="destructive" size="sm">Archive</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Customers" value={area.customers} icon={<Users className="size-4" />} />
        <KpiCard label="Loans" value={area.loans} icon={<Landmark className="size-4" />} />
        <KpiCard label="Outstanding" value={inrCompact(area.outstanding)} tone="warning" />
        <KpiCard label="Collection %" value={`${area.collectionPct}%`} tone="positive" icon={<Percent className="size-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold">Customers in this area</h3>
          <ul className="mt-3 divide-y divide-border">
            {custs.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.occupation} · {c.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={c.status} />
                  <span className="font-display text-sm font-bold">{inr(c.outstanding)}</span>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" asChild className="mt-2"><Link to="/erp/customers">View all customers</Link></Button>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-base font-semibold">Assigned collector</h3>
          {collector ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold">{collector.name}</p>
              <p className="text-xs text-muted-foreground">{collector.phone}</p>
              <Badge variant="secondary">{collector.role}</Badge>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/60 p-2">
                  <p className="text-muted-foreground">Attendance</p>
                  <p className="font-display text-sm font-bold">{collector.attendance}%</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2">
                  <p className="text-muted-foreground">Performance</p>
                  <p className="font-display text-sm font-bold">{collector.performance}%</p>
                </div>
              </div>
            </div>
          ) : <p className="mt-3 text-sm text-muted-foreground">No collector assigned.</p>}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-display text-base font-semibold">Routes in this area</h3>
        <ul className="mt-3 divide-y divide-border">
          {rts.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold"><RouteIcon className="size-3.5 text-primary" /> {r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.customers} cust · {r.distanceKm} km · {r.estimatedMin} min</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={r.status} />
                <span className="text-xs font-semibold">{r.completion}%</span>
              </div>
            </li>
          ))}
          {rts.length === 0 && <li className="py-4 text-sm text-muted-foreground">No routes assigned yet.</li>}
        </ul>
      </Card>

      <Card className="p-5">
        <div className="grid h-64 place-items-center rounded-xl bg-[linear-gradient(0deg,transparent_24%,var(--color-border)_25%,var(--color-border)_26%,transparent_27%,transparent_74%,var(--color-border)_75%,var(--color-border)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,var(--color-border)_25%,var(--color-border)_26%,transparent_27%,transparent_74%,var(--color-border)_75%,var(--color-border)_76%,transparent_77%)] bg-[length:40px_40px] text-center">
          <div>
            <MapPin className="mx-auto size-6 text-primary" />
            <p className="mt-1 text-sm font-semibold">Area map placeholder</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
