import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeader, EmptyState, StatusChip, KpiCard } from "@/components/erp/erp-ui";
import { customers, loans, collections, inr } from "@/lib/erp-data";
import { ArrowLeft, Phone, Mail, MapPin, FileText, Star, MessageSquare, Printer, Edit3, Archive } from "lucide-react";

export const Route = createFileRoute("/erp/customers/$id")({
  head: () => ({ meta: [{ title: "Customer Profile — FinRoute ERP" }, { name: "description", content: "Timeline, loans, collections, documents and guarantors." }] }),
  component: CustomerDetail,
});

function initials(n: string) { return n.split(" ").map((p) => p[0]).slice(0, 2).join(""); }

function CustomerDetail() {
  const { id } = Route.useParams();
  const cust = customers.find((c) => c.id === id);
  if (!cust) return <EmptyState title="Customer not found" action={<Button asChild><Link to="/erp/customers">Back</Link></Button>} />;
  const custLoans = loans.filter((l) => l.customerId === cust.id).slice(0, 6);
  const custCols = collections.filter((c) => c.customerId === cust.id).slice(0, 10);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/erp/customers"><ArrowLeft className="size-4" /> Back</Link></Button>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-14"><AvatarFallback>{initials(cust.name)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{cust.name}</p>
              <p className="truncate text-xs text-muted-foreground">{cust.id} · {cust.occupation}</p>
              <StatusChip status={cust.status} />
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> {cust.phone}</p>
            <p className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {cust.email}</p>
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 text-muted-foreground" /> {cust.address}</p>
            <p className="flex items-center gap-2"><FileText className="size-3.5 text-muted-foreground" /> Aadhaar {cust.aadhaar}</p>
            <p className="flex items-center gap-2"><Star className="size-3.5 text-warning" /> Rating {cust.rating.toFixed(1)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {cust.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline"><MessageSquare className="size-3.5" /> Message</Button>
            <Button size="sm" variant="outline"><Edit3 className="size-3.5" /> Edit</Button>
            <Button size="sm" variant="outline"><Printer className="size-3.5" /> Print</Button>
            <Button size="sm" variant="destructive"><Archive className="size-3.5" /> Archive</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <KpiCard label="Active loans" value={cust.activeLoans} />
            <KpiCard label="Total borrowed" value={inr(cust.totalBorrowed)} />
            <KpiCard label="Paid" value={inr(cust.paid)} tone="positive" />
            <KpiCard label="Outstanding" value={inr(cust.outstanding)} tone="warning" />
          </div>

          <Card className="p-5">
            <Tabs defaultValue="timeline">
              <TabsList className="w-full flex-wrap">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="loans">Loans</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
                <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="comms">Communications</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4">
                <ol className="relative ml-3 space-y-4 border-l border-border pl-6">
                  {[
                    { d: cust.lastContact, t: "Follow-up call", desc: "Confirmed next payment on Friday." },
                    { d: custCols[0]?.date, t: `Payment received · ${inr(custCols[0]?.collected ?? 0)}`, desc: `${custCols[0]?.mode} · ${custCols[0]?.collectorName}` },
                    { d: custLoans[0]?.startDate, t: `Loan disbursed · ${inr(custLoans[0]?.principal ?? 0)}`, desc: `${custLoans[0]?.purpose} · ${custLoans[0]?.frequency}` },
                    { d: cust.joined, t: "Customer onboarded", desc: "KYC verified, guarantor added." },
                  ].filter((e) => e.d).map((e, i) => (
                    <li key={i}>
                      <span className="absolute -left-[7px] mt-1.5 size-3 rounded-full bg-primary" />
                      <p className="text-xs text-muted-foreground">{e.d}</p>
                      <p className="text-sm font-semibold">{e.t}</p>
                      <p className="text-xs text-muted-foreground">{e.desc}</p>
                    </li>
                  ))}
                </ol>
              </TabsContent>

              <TabsContent value="loans" className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Freq</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custLoans.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell><Link to="/erp/loans/$id" params={{ id: l.id }} className="text-primary hover:underline">{l.id}</Link></TableCell>
                        <TableCell>{inr(l.principal)}</TableCell>
                        <TableCell>{l.frequency}</TableCell>
                        <TableCell>{inr(l.outstanding)}</TableCell>
                        <TableCell><StatusChip status={l.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="collections" className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custCols.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{c.date}</TableCell>
                        <TableCell className="font-semibold">{inr(c.collected)}</TableCell>
                        <TableCell>{c.mode}</TableCell>
                        <TableCell className="text-sm">{c.collectorName}</TableCell>
                        <TableCell><StatusChip status={c.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="guarantors" className="mt-4">
                <div className="rounded-xl border border-border p-4">
                  <p className="font-semibold">{cust.guarantor}</p>
                  <p className="text-xs text-muted-foreground">{cust.guarantorPhone} · Relation: Family</p>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-4 grid gap-2 sm:grid-cols-2">
                {["Aadhaar Card","PAN Card","Address Proof","Photo","Signature","Guarantor KYC"].map((d) => (
                  <div key={d} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <FileText className="size-4 text-primary" />
                    <p className="flex-1 text-sm font-medium">{d}</p>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="comms" className="mt-4 space-y-3">
                {[
                  { t: "SMS · Payment reminder", d: "3 days ago", m: "Your installment of ₹1,200 is due on 22 Sep." },
                  { t: "Call · Follow-up", d: "1 week ago", m: "Customer confirmed payment next Friday." },
                  { t: "WhatsApp · Receipt", d: "2 weeks ago", m: "Receipt for ₹1,200 shared." },
                ].map((c, i) => (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between text-sm"><p className="font-semibold">{c.t}</p><p className="text-xs text-muted-foreground">{c.d}</p></div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.m}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
