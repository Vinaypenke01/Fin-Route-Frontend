import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { collections, inr, inrCompact } from "@/lib/erp-data";
import { Wallet, Search, Plus, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/erp/collections/")({
  head: () => ({ meta: [{ title: "Collections — FinRoute ERP" }, { name: "description", content: "Every visit, payment and receipt across your collectors." }] }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [mode, setMode] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 25;

  const filtered = useMemo(() => collections.filter((c) =>
    (status === "all" || c.status.toLowerCase() === status) &&
    (mode === "all" || c.mode.toLowerCase().replace(" ", "") === mode) &&
    (!q || c.customerName.toLowerCase().includes(q.toLowerCase()) || c.id.toLowerCase().includes(q.toLowerCase()))
  ), [q, status, mode]);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const today = collections.slice(0, 200);
  const todayPaid = today.filter((c) => c.status === "Paid").length;
  const todayPartial = today.filter((c) => c.status === "Partial").length;
  const todaySkipped = today.filter((c) => c.status === "Skipped").length;
  const collectedToday = today.filter((c) => c.status === "Paid" || c.status === "Partial").reduce((s, c) => s + c.collected, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Collections"
        description={`${collections.length.toLocaleString("en-IN")} records · ${today.length} today`}
        action={
          <>
            <Button asChild variant="outline" size="sm"><Link to="/erp/collections/today">Today</Link></Button>
            <Button size="sm"><Plus className="size-4" /> Record</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Collected today" value={inrCompact(collectedToday)} tone="positive" icon={<Wallet className="size-4" />} />
        <KpiCard label="Paid" value={todayPaid} tone="positive" />
        <KpiCard label="Partial" value={todayPartial} tone="warning" />
        <KpiCard label="Skipped" value={todaySkipped} tone="danger" />
        <KpiCard label="Collection rate" value={`${Math.round((todayPaid / today.length) * 100)}%`} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="corrections">Correction requests</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search customer or receipt…" className="pl-9" />
              </div>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mode} onValueChange={(v) => { setMode(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="banktransfer">Bank</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Collector</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="text-sm">{c.date} · {c.timestamp}</TableCell>
                      <TableCell className="text-sm font-medium">{c.customerName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.area}</TableCell>
                      <TableCell className="text-sm">{c.collectorName}</TableCell>
                      <TableCell className="text-sm">{c.mode}</TableCell>
                      <TableCell>{inr(c.expected)}</TableCell>
                      <TableCell className="font-semibold">{inr(c.collected)}</TableCell>
                      <TableCell><StatusChip status={c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {paged.map((c) => (
                <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.id} · {c.mode}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {c.area}
                      <Clock className="size-3" /> {c.date} {c.timestamp}
                    </p>
                    <StatusChip status={c.status} />
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold">{inr(c.collected)}</p>
                    <p className="text-xs text-muted-foreground">/ {inr(c.expected)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.collectorName}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
              <p className="text-muted-foreground">Page {page} of {totalPages} · {filtered.length.toLocaleString("en-IN")} results</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="corrections" className="mt-4">
          <Card className="p-5">
            <h3 className="mb-3 font-display text-base font-semibold">Correction requests</h3>
            <ul className="divide-y divide-border">
              {collections.filter((c) => c.status === "Partial").slice(0, 6).map((c) => (
                <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.customerName} · {c.id}</p>
                    <p className="truncate text-xs text-muted-foreground">Requested by {c.collectorName} · {c.remarks}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Reject</Button>
                    <Button size="sm">Approve</Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
