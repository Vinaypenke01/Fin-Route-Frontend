import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeader, KpiCard } from "@/components/erp/erp-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { areas, inr, inrCompact } from "@/lib/erp-data";
import { MapPin, Search, Plus, Users, Landmark, Percent } from "lucide-react";

export const Route = createFileRoute("/erp/areas/")({
  head: () => ({ meta: [{ title: "Area Management — FinRoute ERP" }, { name: "description", content: "Territories, allocation and area-level performance." }] }),
  component: AreasPage,
});

function AreasPage() {
  const [q, setQ] = useState("");
  const filtered = areas.filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.city.toLowerCase().includes(q.toLowerCase()));
  const totalCustomers = areas.reduce((s, a) => s + a.customers, 0);
  const totalOutstanding = areas.reduce((s, a) => s + a.outstanding, 0);
  const avgPct = Math.round(areas.reduce((s, a) => s + a.collectionPct, 0) / areas.length);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Area management"
        description={`${areas.length} territories · ${totalCustomers} customers`}
        action={<Button size="sm"><Plus className="size-4" /> New area</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total areas" value={areas.length} icon={<MapPin className="size-4" />} />
        <KpiCard label="Total customers" value={totalCustomers} icon={<Users className="size-4" />} />
        <KpiCard label="Outstanding" value={inrCompact(totalOutstanding)} tone="warning" icon={<Landmark className="size-4" />} />
        <KpiCard label="Avg collection %" value={`${avgPct}%`} tone="positive" icon={<Percent className="size-4" />} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <div className="flex items-center gap-2 border-b border-border p-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search area or city…" className="pl-9" />
              </div>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Loans</TableHead>
                    <TableHead>Routes</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Collection %</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.city} · {a.pincode}</TableCell>
                      <TableCell>{a.customers}</TableCell>
                      <TableCell>{a.loans}</TableCell>
                      <TableCell>{a.routes}</TableCell>
                      <TableCell className="text-right font-semibold">{inr(a.outstanding)}</TableCell>
                      <TableCell><Badge variant={a.collectionPct > 85 ? "default" : "secondary"}>{a.collectionPct}%</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link to="/erp/areas/$id" params={{ id: a.id }}>Open</Link></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {filtered.map((a) => (
                <Link to="/erp/areas/$id" params={{ id: a.id }} key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.city} · {a.customers} cust · {a.loans} loans</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold">{inr(a.outstanding)}</p>
                    <Badge variant="secondary" className="mt-1">{a.collectionPct}%</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.city} · {a.pincode}</p>
                </div>
                <Badge variant={a.collectionPct > 85 ? "default" : "secondary"}>{a.collectionPct}%</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Cust" value={a.customers} />
                <Stat label="Loans" value={a.loans} />
                <Stat label="Routes" value={a.routes} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-semibold">{inr(a.outstanding)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" asChild className="flex-1"><Link to="/erp/areas/$id" params={{ id: a.id }}>Open</Link></Button>
                <Button size="sm" variant="ghost">Assign</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <Card className="p-5">
            <div className="grid h-96 place-items-center rounded-xl bg-[linear-gradient(0deg,transparent_24%,var(--color-border)_25%,var(--color-border)_26%,transparent_27%,transparent_74%,var(--color-border)_75%,var(--color-border)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,var(--color-border)_25%,var(--color-border)_26%,transparent_27%,transparent_74%,var(--color-border)_75%,var(--color-border)_76%,transparent_77%)] bg-[length:40px_40px] text-center">
              <div>
                <MapPin className="mx-auto size-8 text-primary" />
                <p className="mt-2 font-display text-base font-semibold">Map view</p>
                <p className="text-xs text-muted-foreground">Interactive map placeholder · connect Mapbox in production</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold">{value}</p>
    </div>
  );
}
