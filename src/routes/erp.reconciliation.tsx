import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeader, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { reconciliations, inr, inrCompact } from "@/lib/erp-data";
import { Coins, Search, CheckCheck, AlertOctagon } from "lucide-react";

export const Route = createFileRoute("/erp/reconciliation")({
  head: () => ({ meta: [{ title: "Cash Reconciliation — FinRoute ERP" }, { name: "description", content: "End-of-day cash reconciliation per collector." }] }),
  component: ReconciliationPage,
});

function ReconciliationPage() {
  const [q, setQ] = useState("");
  const filtered = reconciliations.filter((r) => !q || r.collectorName.toLowerCase().includes(q.toLowerCase()));
  const expected = reconciliations.reduce((s, r) => s + r.expected, 0);
  const collected = reconciliations.reduce((s, r) => s + r.collected, 0);
  const shortage = reconciliations.reduce((s, r) => s + r.shortage, 0);
  const excess = reconciliations.reduce((s, r) => s + r.excess, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Cash reconciliation"
        description="End-of-day cash summary per collector"
        action={<Button size="sm"><CheckCheck className="size-4" /> Close day</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Expected" value={inrCompact(expected)} icon={<Coins className="size-4" />} />
        <KpiCard label="Collected" value={inrCompact(collected)} tone="positive" />
        <KpiCard label="Shortage" value={inrCompact(shortage)} tone="danger" icon={<AlertOctagon className="size-4" />} />
        <KpiCard label="Excess" value={inrCompact(excess)} tone="info" />
      </div>

      <Card>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search collector…" className="pl-9" />
          </div>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Shortage</TableHead>
                <TableHead>Excess</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 40).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.date}</TableCell>
                  <TableCell className="font-medium">{r.collectorName}</TableCell>
                  <TableCell>{inr(r.expected)}</TableCell>
                  <TableCell>{inr(r.collected)}</TableCell>
                  <TableCell>{inr(r.submitted)}</TableCell>
                  <TableCell className={r.shortage ? "text-destructive font-semibold" : ""}>{r.shortage ? inr(r.shortage) : "—"}</TableCell>
                  <TableCell className={r.excess ? "text-success font-semibold" : ""}>{r.excess ? inr(r.excess) : "—"}</TableCell>
                  <TableCell><StatusChip status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm">Approve</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y divide-border md:hidden">
          {filtered.slice(0, 40).map((r) => (
            <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.collectorName}</p>
                <p className="truncate text-xs text-muted-foreground">{r.date} · exp {inr(r.expected)}</p>
                <p className="text-xs text-muted-foreground">{r.remarks}</p>
                <StatusChip status={r.status} />
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-bold">{inr(r.submitted)}</p>
                {r.shortage > 0 && <p className="text-xs text-destructive">-{inr(r.shortage)}</p>}
                {r.excess > 0 && <p className="text-xs text-success">+{inr(r.excess)}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
