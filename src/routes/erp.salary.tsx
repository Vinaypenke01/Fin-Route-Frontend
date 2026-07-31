import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeader, KpiCard, StatusChip, ChartCard } from "@/components/erp/erp-ui";
import { payroll, inr, inrCompact } from "@/lib/erp-data";
import { BadgeIndianRupee, Download, Printer } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/erp/salary")({
  head: () => ({ meta: [{ title: "Payroll — FinRoute ERP" }, { name: "description", content: "Salary, bonuses, incentives and payslips." }] }),
  component: SalaryPage,
});

function SalaryPage() {
  const totalNet = payroll.reduce((s, p) => s + p.net, 0);
  const totalBase = payroll.reduce((s, p) => s + p.base, 0);
  const totalBonus = payroll.reduce((s, p) => s + p.bonus, 0);
  const paid = payroll.filter((p) => p.status === "Paid").length;

  const byRole = ["Collector","Manager","Accountant","Field Officer","Support"].map((r) => ({
    role: r,
    base: payroll.filter((p) => p.role === r).reduce((s, p) => s + p.base, 0),
    incentive: payroll.filter((p) => p.role === r).reduce((s, p) => s + p.incentive + p.bonus, 0),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Payroll — Sep 2026"
        description={`${payroll.length} employees · ${paid} paid`}
        action={
          <>
            <Button variant="outline" size="sm"><Download className="size-4" /> Export CSV</Button>
            <Button size="sm"><BadgeIndianRupee className="size-4" /> Run payroll</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Net payout" value={inrCompact(totalNet)} tone="positive" icon={<BadgeIndianRupee className="size-4" />} />
        <KpiCard label="Base" value={inrCompact(totalBase)} />
        <KpiCard label="Bonus" value={inrCompact(totalBonus)} tone="info" />
        <KpiCard label="Paid / Pending" value={`${paid} / ${payroll.length - paid}`} />
      </div>

      <ChartCard title="Payroll by role" subtitle="Base vs incentive">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byRole}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="role" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => inr(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="base" stackId="a" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="incentive" stackId="a" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card>
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>OT</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Incentive</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.slice(0, 30).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.role}</TableCell>
                  <TableCell>{inr(p.base)}</TableCell>
                  <TableCell>{inr(p.overtime)}</TableCell>
                  <TableCell>{inr(p.bonus)}</TableCell>
                  <TableCell>{inr(p.incentive)}</TableCell>
                  <TableCell className="text-destructive">-{inr(p.deductions)}</TableCell>
                  <TableCell className="text-right font-semibold">{inr(p.net)}</TableCell>
                  <TableCell><StatusChip status={p.status} /></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost"><Printer className="size-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y divide-border md:hidden">
          {payroll.slice(0, 30).map((p) => (
            <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.role} · Base {inr(p.base)}</p>
                <StatusChip status={p.status} />
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-bold">{inr(p.net)}</p>
                <Button size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs">Payslip</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
