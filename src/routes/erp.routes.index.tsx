import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SectionHeader, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { erpRoutes, inr } from "@/lib/erp-data";
import { Route as RouteIcon, Plus, Search, MapPin, Timer, Wallet, Sparkles, Shuffle, Split, GitMerge } from "lucide-react";

export const Route = createFileRoute("/erp/routes/")({
  head: () => ({ meta: [{ title: "Route Management — FinRoute ERP" }, { name: "description", content: "Field routes, sequencing and collector optimization." }] }),
  component: RoutesPage,
});

function RoutesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = erpRoutes.filter((r) =>
    (status === "all" || r.status.toLowerCase() === status) &&
    (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.collectorName.toLowerCase().includes(q.toLowerCase()))
  );

  const inProgress = erpRoutes.filter((r) => r.status === "In Progress").length;
  const completed = erpRoutes.filter((r) => r.status === "Completed").length;
  const delayed = erpRoutes.filter((r) => r.status === "Delayed").length;
  const expected = erpRoutes.reduce((s, r) => s + r.expected, 0);
  const collected = erpRoutes.reduce((s, r) => s + r.collected, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Route management"
        description={`${erpRoutes.length} routes · ${inProgress} in progress`}
        action={
          <>
            <Button variant="outline" size="sm"><Sparkles className="size-4" /> Optimize</Button>
            <Button size="sm"><Plus className="size-4" /> New route</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total routes" value={erpRoutes.length} icon={<RouteIcon className="size-4" />} />
        <KpiCard label="In progress" value={inProgress} tone="info" />
        <KpiCard label="Completed" value={completed} tone="positive" />
        <KpiCard label="Delayed" value={delayed} tone="warning" />
        <KpiCard label="Today · collected / expected" value={`${inr(collected).replace("₹","")} / ${inr(expected).replace("₹","")}`} icon={<Wallet className="size-4" />} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search route or collector…" className="pl-9" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.collectorName} · {r.id}</p>
                    </div>
                    <StatusChip status={r.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span><MapPin className="mr-1 inline size-3" /> {r.distanceKm} km</span>
                    <span><Timer className="mr-1 inline size-3" /> {r.estimatedMin} min</span>
                    <span>{r.customers} cust</span>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{r.completion}%</span>
                    </div>
                    <Progress value={r.completion} className="h-1.5" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Collected</span>
                    <span className="font-semibold">{inr(r.collected)} / {inr(r.expected)}</span>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/erp/routes/$id" params={{ id: r.id }}>Open</Link></Button>
                    <Button size="sm" variant="ghost" title="Reassign"><Shuffle className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Split"><Split className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Merge"><GitMerge className="size-3.5" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <Card className="p-5">
            <h3 className="font-display text-base font-semibold">Today's schedule</h3>
            <ul className="mt-3 divide-y divide-border">
              {erpRoutes.slice(0, 8).map((r) => (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.collectorName} · Start 09:00 · {r.estimatedMin} min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={r.status} />
                    <span className="text-xs font-semibold">{r.completion}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card className="p-5">
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <div key={d} className="p-2 font-semibold text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div key={i} className="min-h-20 rounded-md border border-border p-1.5 text-left">
                  <p className="text-[10px] text-muted-foreground">{i + 1}</p>
                  {i % 3 === 0 && <p className="mt-1 truncate rounded bg-primary/15 px-1 text-[10px] text-primary">3 routes</p>}
                  {i % 5 === 0 && <p className="mt-1 truncate rounded bg-warning/15 px-1 text-[10px] text-warning">1 delayed</p>}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <Card className="p-5">
            <div className="grid h-96 place-items-center rounded-xl bg-[linear-gradient(0deg,transparent_24%,var(--color-border)_25%,var(--color-border)_26%,transparent_27%,transparent_74%,var(--color-border)_75%,var(--color-border)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,var(--color-border)_25%,var(--color-border)_26%,transparent_27%,transparent_74%,var(--color-border)_75%,var(--color-border)_76%,transparent_77%)] bg-[length:40px_40px] text-center">
              <div>
                <MapPin className="mx-auto size-8 text-primary" />
                <p className="mt-2 font-display text-base font-semibold">Live route map</p>
                <p className="text-xs text-muted-foreground">Connect Mapbox / Google Maps in production</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
