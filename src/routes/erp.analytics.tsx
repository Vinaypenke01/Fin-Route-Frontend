import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { SectionHeader, ChartCard, KpiCard } from "@/components/erp/erp-ui";
import {
  revenueTrend, collectionsTrend, outstandingTrend, customerGrowth,
  areaPerformance, employeePerformance, loanDistribution, inrCompact, inr, kpis,
} from "@/lib/erp-data";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, Users, Percent, MapPin } from "lucide-react";

export const Route = createFileRoute("/erp/analytics")({
  head: () => ({ meta: [{ title: "Analytics — FinRoute ERP" }, { name: "description", content: "Executive dashboards across growth, risk and performance." }] }),
  component: AnalyticsPage,
});

const PIE = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)"];

function AnalyticsPage() {
  const riskData = [
    { name: "Low", value: 62 }, { name: "Medium", value: 25 }, { name: "High", value: 13 },
  ];
  const segments = [
    { name: "Loyal", value: 180 }, { name: "New", value: 120 }, { name: "At risk", value: 60 },
    { name: "VIP", value: 40 }, { name: "Dormant", value: 100 },
  ];
  const prediction = collectionsTrend.map((r, i) => ({
    ...r, forecast: r.collected + Math.round((rand(i) - 0.4) * 250000),
  }));
  const radar = [
    { m: "Speed", A: 84 }, { m: "Recovery", A: 78 }, { m: "Coverage", A: 91 },
    { m: "Compliance", A: 88 }, { m: "Efficiency", A: 74 }, { m: "Growth", A: 82 },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics" description="Executive dashboards across growth, risk and performance." />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Business growth" value="+18%" tone="positive" delta="YoY" icon={<TrendingUp className="size-4" />} />
        <KpiCard label="Active customers" value={kpis.activeCustomers} tone="info" icon={<Users className="size-4" />} />
        <KpiCard label="Recovery %" value={`${kpis.loanRecoveryPct}%`} icon={<Percent className="size-4" />} />
        <KpiCard label="Coverage" value="12 areas" tone="info" icon={<MapPin className="size-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue vs profit">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="var(--color-success)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Collection forecast" subtitle="Actual vs forecast">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={prediction}>
                <defs>
                  <linearGradient id="fore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="collected" stroke="var(--color-primary)" fill="url(#fore)" strokeWidth={2} />
                <Line type="monotone" dataKey="forecast" stroke="var(--color-warning)" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Risk analysis" subtitle="Portfolio distribution">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={2}>
                  {riskData.map((_, i) => <Cell key={i} fill={PIE[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Customer segmentation">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={segments}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Business scorecard">
          <div className="h-56">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="m" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Customer growth">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="new" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="active" stroke="var(--color-success)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Collector performance">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={employeePerformance} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Bar dataKey="perf" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <Card className="p-5">
        <h3 className="font-display text-base font-semibold">Area heatmap</h3>
        <p className="text-xs text-muted-foreground">Collection density placeholder</p>
        <div className="mt-3 grid grid-cols-8 gap-1 sm:grid-cols-12">
          {Array.from({ length: 96 }).map((_, i) => {
            const v = (Math.sin(i) + 1) / 2;
            const bg = v > 0.7 ? "bg-success/70" : v > 0.5 ? "bg-primary/60" : v > 0.3 ? "bg-warning/50" : "bg-muted";
            return <div key={i} className={`h-6 rounded ${bg}`} />;
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-base font-semibold">Branch comparison</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { n: "Bengaluru HQ", r: 1250000, g: "+22%" },
            { n: "Chennai", r: 620000, g: "+11%" },
            { n: "Hyderabad", r: 480000, g: "+8%" },
          ].map((b) => (
            <div key={b.n} className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">{b.n}</p>
              <p className="font-display text-xl font-bold">{inrCompact(b.r)}</p>
              <p className="text-xs text-success">{b.g} YoY</p>
            </div>
          ))}
        </div>
      </Card>

      <ChartCard title="Loan distribution">
        <div className="h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={loanDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {loanDistribution.map((_, i) => <Cell key={i} fill={PIE[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Area performance">
        <div className="h-56">
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
    </div>
  );
}

function rand(i: number) { return (Math.sin(i * 12.7) + 1) / 2; }
