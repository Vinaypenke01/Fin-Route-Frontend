import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { loans, inr, inrCompact } from "@/lib/erp-data";
import { Landmark, Plus, Search, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/erp/loans/")({
  head: () => ({ meta: [{ title: "Loans — FinRoute ERP" }, { name: "description", content: "Loan lifecycle: pending, approved, active, overdue, closed." }] }),
  component: LoansPage,
});

function LoansPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [freq, setFreq] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 25;

  const filtered = useMemo(() => loans.filter((l) =>
    (status === "all" || l.status.toLowerCase() === status) &&
    (freq === "all" || l.frequency.toLowerCase() === freq) &&
    (!q || l.customerName.toLowerCase().includes(q.toLowerCase()) || l.id.toLowerCase().includes(q.toLowerCase()))
  ), [q, status, freq]);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const totalPrincipal = loans.reduce((s, l) => s + l.principal, 0);
  const totalOutstanding = loans.reduce((s, l) => s + l.outstanding, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Loan management"
        description={`${loans.length} loans · ${inrCompact(totalPrincipal)} disbursed`}
        action={<Button size="sm"><Plus className="size-4" /> New loan</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total loans" value={loans.length} icon={<Landmark className="size-4" />} />
        <KpiCard label="Active" value={loans.filter((l) => l.status === "Active").length} tone="positive" icon={<CheckCircle2 className="size-4" />} />
        <KpiCard label="Pending" value={loans.filter((l) => l.status === "Pending").length} tone="warning" icon={<Clock className="size-4" />} />
        <KpiCard label="Overdue / Defaulted" value={loans.filter((l) => l.status === "Overdue" || l.status === "Defaulted").length} tone="danger" icon={<AlertTriangle className="size-4" />} />
        <KpiCard label="Outstanding" value={inrCompact(totalOutstanding)} tone="warning" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All loans</TabsTrigger>
          <TabsTrigger value="queue">Approval queue</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search customer or loan ID…" className="pl-9" />
              </div>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {["Pending","Approved","Active","Overdue","Closed","Rejected","Defaulted"].map((s) => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={freq} onValueChange={(v) => { setFreq(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Frequency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>EMI</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.id}</TableCell>
                      <TableCell className="text-sm font-medium">{l.customerName}</TableCell>
                      <TableCell>{inr(l.principal)}</TableCell>
                      <TableCell className="text-sm">{l.frequency} · {l.term}</TableCell>
                      <TableCell>{inr(l.installment)}</TableCell>
                      <TableCell className="text-right font-semibold">{inr(l.outstanding)}</TableCell>
                      <TableCell><StatusChip status={l.status} /></TableCell>
                      <TableCell className="text-right"><Button asChild size="sm" variant="ghost"><Link to="/erp/loans/$id" params={{ id: l.id }}>Open</Link></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {paged.map((l) => (
                <Link key={l.id} to="/erp/loans/$id" params={{ id: l.id }} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{l.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.id} · {l.frequency} · EMI {inr(l.installment)}</p>
                    <StatusChip status={l.status} />
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold">{inr(l.outstanding)}</p>
                    <p className="text-xs text-muted-foreground">of {inr(l.totalPayable)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
              <p className="text-muted-foreground">Page {page} of {totalPages} · {filtered.length} results</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {[
          { v: "queue", filter: (l: typeof loans[number]) => l.status === "Pending", label: "Awaiting approval" },
          { v: "overdue", filter: (l: typeof loans[number]) => l.status === "Overdue" || l.status === "Defaulted", label: "Overdue & defaulted" },
          { v: "closed", filter: (l: typeof loans[number]) => l.status === "Closed", label: "Closed" },
        ].map((tab) => (
          <TabsContent key={tab.v} value={tab.v} className="mt-4">
            <Card className="p-5">
              <h3 className="mb-3 font-display text-base font-semibold">{tab.label}</h3>
              <ul className="divide-y divide-border">
                {loans.filter(tab.filter).slice(0, 12).map((l) => (
                  <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{l.customerName} <span className="text-muted-foreground">· {l.id}</span></p>
                      <p className="truncate text-xs text-muted-foreground">{l.frequency} · {l.term} · {l.purpose}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden text-sm font-semibold sm:inline">{inr(l.outstanding || l.principal)}</span>
                      <StatusChip status={l.status} />
                      <Button asChild size="sm" variant="outline"><Link to="/erp/loans/$id" params={{ id: l.id }}>Review</Link></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
