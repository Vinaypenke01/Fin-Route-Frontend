import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { customers, areas, inr } from "@/lib/erp-data";
import { Search, Plus, Users, Star, TrendingUp, Download, Upload, Filter } from "lucide-react";

export const Route = createFileRoute("/erp/customers/")({
  head: () => ({ meta: [{ title: "Customers — FinRoute ERP" }, { name: "description", content: "Every customer, timeline, guarantors and loan history." }] }),
  component: CustomersPage,
});

function initials(n: string) { return n.split(" ").map((p) => p[0]).slice(0, 2).join(""); }

function CustomersPage() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = useMemo(() => customers.filter((c) =>
    (area === "all" || c.area === area) &&
    (status === "all" || c.status.toLowerCase() === status) &&
    (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q) || c.id.toLowerCase().includes(q.toLowerCase()))
  ), [q, area, status]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const active = customers.filter((c) => c.status === "Active").length;
  const overdue = customers.filter((c) => c.status === "Overdue").length;
  const avgRating = (customers.reduce((s, c) => s + c.rating, 0) / customers.length).toFixed(1);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Customer management"
        description={`${customers.length} customers across ${areas.length} areas`}
        action={
          <>
            <Button variant="outline" size="sm"><Upload className="size-4" /> Import</Button>
            <Button variant="outline" size="sm"><Download className="size-4" /> Export</Button>
            <Button asChild size="sm"><Link to="/erp/customers"><Plus className="size-4" /> Add customer</Link></Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total customers" value={customers.length} icon={<Users className="size-4" />} />
        <KpiCard label="Active" value={active} tone="positive" />
        <KpiCard label="Overdue" value={overdue} tone="danger" />
        <KpiCard label="Avg rating" value={`${avgRating} ★`} tone="info" icon={<Star className="size-4" />} />
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <Card>
            <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, phone, ID…" className="pl-9" />
              </div>
              <Select value={area} onValueChange={(v) => { setArea(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Area" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {areas.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm"><Filter className="size-4" /> More</Button>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Loans</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.phone} · {c.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.area}</TableCell>
                      <TableCell>{c.activeLoans}</TableCell>
                      <TableCell className="text-right font-semibold">{inr(c.outstanding)}</TableCell>
                      <TableCell>{c.rating.toFixed(1)} ★</TableCell>
                      <TableCell><StatusChip status={c.status} /></TableCell>
                      <TableCell className="text-right"><Button asChild size="sm" variant="ghost"><Link to="/erp/customers/$id" params={{ id: c.id }}>Open</Link></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {paged.map((c) => (
                <Link key={c.id} to="/erp/customers/$id" params={{ id: c.id }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4">
                  <Avatar className="size-10"><AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.area} · {c.activeLoans} loans</p>
                    <StatusChip status={c.status} />
                  </div>
                  <p className="font-display text-sm font-bold">{inr(c.outstanding)}</p>
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

        <TabsContent value="cards" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 24).map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="size-11"><AvatarFallback>{initials(c.name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.area} · {c.occupation}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2 text-center text-xs">
                <div><p className="text-muted-foreground">Loans</p><p className="font-bold">{c.activeLoans}</p></div>
                <div><p className="text-muted-foreground">Outstanding</p><p className="font-bold">{inr(c.outstanding)}</p></div>
                <div><p className="text-muted-foreground">Rating</p><p className="font-bold">{c.rating.toFixed(1)}★</p></div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/erp/customers/$id" params={{ id: c.id }}>Profile</Link></Button>
                <Button size="sm" variant="ghost" className="flex-1"><TrendingUp className="size-3.5" /> Loan</Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
