import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeader, KpiCard, ChartCard } from "@/components/erp/erp-ui";
import { inr, inrCompact } from "@/lib/erp-data";
import { Sparkles, HardDrive, Server, UsersRound, Users, Download } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/erp/subscription")({
  head: () => ({ meta: [{ title: "Subscription — FinRoute ERP" }, { name: "description", content: "Plan, usage and billing." }] }),
  component: SubscriptionPage,
});

const usage = Array.from({ length: 30 }, (_, i) => ({ day: `D${i + 1}`, api: 2000 + Math.round(Math.sin(i) * 800) + i * 20 }));

const invoices = Array.from({ length: 8 }, (_, i) => ({
  id: `INV-${(20240 + i).toString()}`,
  date: `${(i + 1).toString().padStart(2, "0")} Feb 2026`,
  amount: 4999, status: i === 0 ? "Due" : "Paid",
}));

function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Subscription"
        description="Current plan, usage and billing"
        action={<Button size="sm"><Sparkles className="size-4" /> Upgrade plan</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="secondary">Growth Plan · Annual</Badge>
              <p className="mt-2 font-display text-2xl font-bold">₹4,999<span className="text-sm font-medium text-muted-foreground">/mo</span></p>
              <p className="text-xs text-muted-foreground">Renews on 12 Feb 2027 · Auto-renew on</p>
            </div>
            <Sparkles className="size-6 text-warning" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Usage icon={<HardDrive className="size-4" />} label="Storage" used={12.4} total={50} unit="GB" />
            <Usage icon={<Server className="size-4" />} label="API calls (mo.)" used={82000} total={200000} unit="" />
            <Usage icon={<UsersRound className="size-4" />} label="Employees" used={75} total={150} unit="" />
            <Usage icon={<Users className="size-4" />} label="Customers" used={500} total={2000} unit="" />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-base font-semibold">Compare plans</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { n: "Starter", p: "₹1,499", d: "Up to 50 customers" },
              { n: "Growth", p: "₹4,999", d: "Up to 2,000 customers", curr: true },
              { n: "Scale", p: "₹9,999", d: "Unlimited + branches" },
              { n: "Enterprise", p: "Custom", d: "SLA + dedicated CSM" },
            ].map((p) => (
              <li key={p.n} className={"flex items-start justify-between rounded-xl border p-3 " + (p.curr ? "border-primary/40 bg-primary/5" : "border-border")}>
                <div><p className="font-semibold">{p.n}</p><p className="text-xs text-muted-foreground">{p.d}</p></div>
                <div className="text-right"><p className="text-sm font-semibold">{p.p}</p>{p.curr && <Badge variant="secondary" className="mt-1">Current</Badge>}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="This month" value={inr(4999)} />
        <KpiCard label="YTD" value={inrCompact(4999 * 8)} />
        <KpiCard label="Storage used" value="12.4 / 50 GB" tone="info" />
        <KpiCard label="API used" value="82k / 200k" tone="info" />
      </div>

      <ChartCard title="API usage" subtitle="Last 30 days">
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={usage}>
              <defs>
                <linearGradient id="apiG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Area type="monotone" dataKey="api" stroke="var(--color-primary)" fill="url(#apiG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-display text-base font-semibold">Billing history</h3>
          <Button variant="outline" size="sm"><Download className="size-4" /> All invoices</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>{inr(i.amount)}</TableCell>
                  <TableCell><Badge variant={i.status === "Paid" ? "secondary" : "default"}>{i.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost"><Download className="size-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function Usage({ icon, label, used, total, unit }: { icon: any; label: string; used: number; total: number; unit: string }) {
  const pct = Math.round((used / total) * 100);
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</p>
      <div className="mt-1.5 flex items-baseline justify-between">
        <p className="font-display text-base font-bold">{used.toLocaleString("en-IN")}{unit && ` ${unit}`}</p>
        <p className="text-xs text-muted-foreground">of {total.toLocaleString("en-IN")}{unit && ` ${unit}`}</p>
      </div>
      <Progress value={pct} className="mt-2 h-1.5" />
    </div>
  );
}
