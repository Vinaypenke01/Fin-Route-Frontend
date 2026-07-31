import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Search, Download, Printer, Eye, IndianRupee } from "lucide-react";
import { invoices, inr } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Admin" }] }),
  component: InvoicesPage,
});

const statusTone: Record<string, string> = {
  Paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Failed: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  Refunded: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
};

function InvoicesPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("all");
  const filtered = invoices.filter((i) => {
    if (tab !== "all" && i.status.toLowerCase() !== tab) return false;
    if (q && !`${i.id} ${i.lenderName} ${i.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (method !== "all" && i.method !== method) return false;
    return true;
  });
  const totals = {
    total: filtered.reduce((s, x) => s + x.total, 0),
    tax: filtered.reduce((s, x) => s + x.tax, 0),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Invoices</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} invoices · {inr(totals.total)} · GST {inr(totals.tax)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="size-4" /> Export</Button>
          <Button size="sm"><IndianRupee className="size-4" /> Record payment</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
        </TabsList>

        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice, lender, email…" className="pl-9" />
          </div>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="NetBanking">NetBanking</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Lender</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 30).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.id}</TableCell>
                      <TableCell><div className="font-medium">{i.lenderName}</div><div className="text-xs text-muted-foreground">{i.email}</div></TableCell>
                      <TableCell><Badge variant="outline">{i.plan}</Badge></TableCell>
                      <TableCell className="text-sm">{i.method}</TableCell>
                      <TableCell><Badge variant="outline" className={statusTone[i.status]}>{i.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{i.issuedOn}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{inr(i.total)}</TableCell>
                      <TableCell><InvoiceView invoice={i} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-2 p-3 md:hidden">
              {filtered.slice(0, 20).map((i) => (
                <div key={i.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                    <Badge variant="outline" className={statusTone[i.status]}>{i.status}</Badge>
                  </div>
                  <div className="mt-1 truncate font-medium">{i.lenderName}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{i.plan} · {i.method} · {i.issuedOn}</span>
                    <span className="font-medium text-foreground">{inr(i.total)}</span>
                  </div>
                  <div className="mt-2"><InvoiceView invoice={i} /></div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvoiceView({ invoice }: { invoice: typeof invoices[number] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm"><Eye className="size-4" /> View</Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-md overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Invoice {invoice.id}</SheetTitle>
          <SheetDescription>Issued on {invoice.issuedOn}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex justify-between">
            <div>
              <div className="text-muted-foreground">Billed to</div>
              <div className="font-medium">{invoice.lenderName}</div>
              <div className="text-xs text-muted-foreground">{invoice.email}</div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={statusTone[invoice.status]}>{invoice.status}</Badge>
              <div className="mt-1 text-xs text-muted-foreground">Due {invoice.dueOn}</div>
            </div>
          </div>
          <Separator />
          <div>
            <div className="mb-2 text-muted-foreground">Line items</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">FinRoute {invoice.plan} — monthly subscription</div>
                <div className="text-xs text-muted-foreground">1 × {inr(invoice.amount)}</div>
              </div>
              <div className="tabular-nums">{inr(invoice.amount)}</div>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <Row label="Subtotal" value={inr(invoice.amount)} />
            <Row label="GST (18%)" value={inr(invoice.tax)} />
            <Row label="Total" value={inr(invoice.total)} bold />
          </div>
          <div className="flex gap-2 pt-4">
            <Button className="flex-1" variant="outline"><Printer className="size-4" /> Print</Button>
            <Button className="flex-1"><Download className="size-4" /> Download PDF</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-base pt-1" : "text-muted-foreground"}`}>
      <span>{label}</span><span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
