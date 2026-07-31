import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, KpiCard, EmptyState, StatusChip } from "@/components/erp/erp-ui";
import { loans, collections, inr } from "@/lib/erp-data";
import { ArrowLeft, Printer, RefreshCcw, RotateCw, Ban, ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/erp/loans/$id")({
  head: () => ({ meta: [{ title: "Loan Detail — FinRoute ERP" }, { name: "description", content: "Schedule, repayments, interest and penalty for a single loan." }] }),
  component: LoanDetail,
});

function LoanDetail() {
  const { id } = Route.useParams();
  const loan = loans.find((l) => l.id === id);
  if (!loan) return <EmptyState title="Loan not found" action={<Button asChild><Link to="/erp/loans">Back</Link></Button>} />;

  const schedule = Array.from({ length: loan.term }, (_, i) => {
    const paidCount = Math.floor((loan.paid / loan.totalPayable) * loan.term);
    return {
      n: i + 1,
      due: `${loan.frequency} #${i + 1}`,
      amount: loan.installment,
      status: i < paidCount ? "Paid" : i === paidCount ? "Due" : "Upcoming",
    };
  }).slice(0, 12);

  const repays = collections.filter((c) => c.loanId === loan.id).slice(0, 10);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/erp/loans"><ArrowLeft className="size-4" /> Back</Link></Button>

      <SectionHeader
        title={`${loan.customerName}`}
        description={`Loan ${loan.id} · ${loan.purpose}`}
        action={
          <>
            <StatusChip status={loan.status} />
            <Button variant="outline" size="sm"><Printer className="size-3.5" /> Print</Button>
            <Button variant="outline" size="sm"><RefreshCcw className="size-3.5" /> Renew</Button>
            <Button variant="outline" size="sm"><ArrowLeftRight className="size-3.5" /> Transfer</Button>
            <Button variant="outline" size="sm"><RotateCw className="size-3.5" /> Adjust</Button>
            <Button variant="destructive" size="sm"><Ban className="size-3.5" /> Close</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Principal" value={inr(loan.principal)} />
        <KpiCard label="Total payable" value={inr(loan.totalPayable)} />
        <KpiCard label="Paid" value={inr(loan.paid)} tone="positive" />
        <KpiCard label="Outstanding" value={inr(loan.outstanding)} tone="warning" />
        <KpiCard label="Penalty" value={inr(loan.penaltyAccrued)} tone="danger" />
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Repayment progress</span>
          <span className="font-semibold">{Math.round((loan.paid / loan.totalPayable) * 100)}%</span>
        </div>
        <Progress value={(loan.paid / loan.totalPayable) * 100} className="h-2" />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">Frequency</p><p className="font-semibold">{loan.frequency}</p></div>
          <div><p className="text-xs text-muted-foreground">Term</p><p className="font-semibold">{loan.term} installments</p></div>
          <div><p className="text-xs text-muted-foreground">EMI</p><p className="font-semibold">{inr(loan.installment)}</p></div>
          <div><p className="text-xs text-muted-foreground">Interest</p><p className="font-semibold">{loan.interestPct}% p.a.</p></div>
          <div><p className="text-xs text-muted-foreground">Start</p><p className="font-semibold">{loan.startDate}</p></div>
          <div><p className="text-xs text-muted-foreground">End</p><p className="font-semibold">{loan.endDate}</p></div>
        </div>
      </Card>

      <Card className="p-5">
        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="repayments">Repayments</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((s) => (
                  <TableRow key={s.n}>
                    <TableCell>{s.n}</TableCell>
                    <TableCell>{s.due}</TableCell>
                    <TableCell>{inr(s.amount)}</TableCell>
                    <TableCell><StatusChip status={s.status.toLowerCase() === "paid" ? "Paid" : s.status.toLowerCase() === "due" ? "Pending" : "Planned"} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="repayments" className="mt-4 overflow-x-auto">
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
                {repays.map((c) => (
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

          <TabsContent value="timeline" className="mt-4">
            <ol className="relative ml-3 space-y-4 border-l border-border pl-6">
              {[
                { d: loan.startDate, t: "Loan disbursed", desc: `${inr(loan.principal)} · ${loan.frequency}` },
                { d: repays[0]?.date, t: `Payment · ${inr(repays[0]?.collected ?? 0)}`, desc: repays[0]?.mode ?? "" },
                { d: repays[1]?.date, t: `Payment · ${inr(repays[1]?.collected ?? 0)}`, desc: repays[1]?.mode ?? "" },
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
        </Tabs>
      </Card>
    </div>
  );
}
