import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, ChartCard, KpiCard } from "@/components/erp/erp-ui";
import { revenueTrend, collectionsTrend, outstandingTrend, areaPerformance, inr, inrCompact, kpis } from "@/lib/erp-data";
import { Download, Printer, Filter, Calendar } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/erp/reports")({
  head: () => ({ meta: [{ title: "Reports — FinRoute ERP" }, { name: "description", content: "Daily, weekly, monthly and functional reports." }] }),
  component: ReportsPage,
});

const reports = [
  "Daily Collection","Weekly","Monthly","Customer","Employee","Collector",
  "Loan","Expense","Profit & Loss","Cash Flow","Outstanding","Defaulter","Area","Route",
];

function ReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        description="Every report you need, exportable and printable."
        action={
          <>
            <Button variant="outline" size="sm"><Calendar className="size-4" /> Date range</Button>
            <Button variant="outline" size="sm"><Filter className="size-4" /> Filters</Button>
            <Button variant="outline" size="sm"><Printer className="size-4" /> Print</Button>
            <Button size="sm"><Download className="size-4" /> Export</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Revenue (12 mo.)" value={inrCompact(revenueTrend.reduce((s, r) => s + r.revenue, 0))} tone="positive" />
        <KpiCard label="Collected (12 mo.)" value={inrCompact(collectionsTrend.reduce((s, r) => s + r.collected, 0))} />
        <KpiCard label="Outstanding" value={inrCompact(kpis.outstanding)} tone="warning" />
        <KpiCard label="Recovery %" value={`${kpis.loanRecoveryPct}%`} />
      </div>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Available reports</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {reports.map((r) => (
            <Button key={r} variant="outline" size="sm">{r}</Button>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="revenue">
        <TabsList className="flex-wrap">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          <TabsTrigger value="area">Area</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <ChartCard title="Revenue trend" subtitle="Last 12 months">
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="target" stroke="var(--color-warning)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-success)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="collections" className="mt-4">
          <ChartCard title="Collections vs Expected">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={collectionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="expected" fill="var(--color-muted-foreground)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="outstanding" className="mt-4">
          <ChartCard title="Outstanding trend">
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={outstandingTrend}>
                  <defs>
                    <linearGradient id="rout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="outstanding" stroke="var(--color-warning)" fill="url(#rout)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="area" className="mt-4">
          <ChartCard title="Area performance">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={areaPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="collected" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Collected (₹k)" />
                  <Bar dataKey="pct" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
