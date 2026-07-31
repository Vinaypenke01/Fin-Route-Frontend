import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader, KpiCard, StatusChip, ChartCard } from "@/components/erp/erp-ui";
import { expenses, inr, inrCompact } from "@/lib/erp-data";
import { Receipt, Plus, Search, Paperclip } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/erp/expenses")({
  head: () => ({ meta: [{ title: "Expenses — FinRoute ERP" }, { name: "description", content: "Categorised expenses with approval workflow." }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const categories = useMemo(() => Array.from(new Set(expenses.map((e) => e.category))), []);
  const filtered = expenses.filter((e) =>
    (cat === "all" || e.category === cat) &&
    (!q || e.note.toLowerCase().includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase()))
  );

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const approved = expenses.filter((e) => e.status === "Approved").length;
  const pending = expenses.filter((e) => e.status === "Pending").length;
  const byCat = categories.map((c) => ({ name: c, value: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0) }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Expense management"
        description={`${expenses.length} entries · ${inrCompact(total)} total`}
        action={<Button size="sm"><Plus className="size-4" /> New expense</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total" value={inrCompact(total)} icon={<Receipt className="size-4" />} />
        <KpiCard label="Approved" value={approved} tone="positive" />
        <KpiCard label="Pending" value={pending} tone="warning" />
        <KpiCard label="Categories" value={categories.length} />
      </div>

      <ChartCard title="Category breakdown">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={byCat} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => inr(v)} />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card>
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expense…" className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 40).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.id}</TableCell>
                  <TableCell className="text-sm">{e.date}</TableCell>
                  <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                  <TableCell className="text-sm">{e.note}</TableCell>
                  <TableCell className="text-sm">{e.paidBy}</TableCell>
                  <TableCell className="text-sm">{e.mode}</TableCell>
                  <TableCell className="text-right font-semibold">{inr(e.amount)}</TableCell>
                  <TableCell><StatusChip status={e.status} /></TableCell>
                  <TableCell>{e.receipt && <Paperclip className="size-4 text-muted-foreground" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y divide-border md:hidden">
          {filtered.slice(0, 40).map((e) => (
            <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
              <div className="min-w-0">
                <Badge variant="outline" className="text-[10px]">{e.category}</Badge>
                <p className="mt-1 truncate text-sm font-medium">{e.note}</p>
                <p className="text-xs text-muted-foreground">{e.date} · {e.paidBy} · {e.mode}</p>
                <StatusChip status={e.status} />
              </div>
              <p className="font-display text-sm font-bold">{inr(e.amount)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
