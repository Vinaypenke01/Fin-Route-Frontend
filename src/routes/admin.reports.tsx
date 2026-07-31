import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Download, Calendar, IndianRupee, TrendingUp } from "lucide-react";
import { revenueTrend, lenderGrowth, apiRequestSeries, storageSeries, lenders, inr } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Reports</h2>
          <p className="text-sm text-muted-foreground">Platform-wide analytics and exports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-40"><Calendar className="mr-1 size-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="size-4" /> Export</Button>
        </div>
      </div>

      <Tabs defaultValue="revenue">
        <div className="overflow-x-auto">
          <TabsList className="w-max flex-nowrap">
            <TabsTrigger value="revenue">Platform Revenue</TabsTrigger>
            <TabsTrigger value="subscription">Subscription Revenue</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="lenders">Lender Report</TabsTrigger>
            <TabsTrigger value="users">User Report</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total revenue (12 mo)" value={inr(revenueTrend.reduce((s, r) => s + r.revenue, 0))} icon={IndianRupee} />
            <Stat label="Avg. monthly" value={inr(Math.round(revenueTrend.reduce((s, r) => s + r.revenue, 0) / 12))} icon={TrendingUp} />
            <Stat label="Growth" value="+18.2%" icon={TrendingUp} tone="success" />
          </div>
          <Card>
            <CardHeader><CardTitle>Revenue by Month</CardTitle><CardDescription>Cash collected from all plans</CardDescription></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={revenueTrend}>
                    <defs><linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <ReportTable
            columns={["Month", "Revenue", "Subscriptions", "ARPU"]}
            rows={revenueTrend.map((r) => [r.month, inr(r.revenue), String(r.subscriptions), inr(Math.round(r.revenue / r.subscriptions))])}
          />
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Subscriptions Added</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-72 w-full">
                <ResponsiveContainer>
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="subscriptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Lender & User Growth</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-72 w-full">
                <ResponsiveContainer>
                  <LineChart data={lenderGrowth}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="lenders" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lenders" className="mt-4">
          <ReportTable
            columns={["Lender", "Plan", "Status", "Customers", "MRR"]}
            rows={lenders.slice(0, 15).map((l) => [l.name, l.plan, l.status, String(l.customers), inr(l.monthlyRevenue)])}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <ReportTable
            columns={["Lender", "Employees", "Registered", "Last login"]}
            rows={lenders.slice(0, 15).map((l) => [l.name, String(l.employees), l.registeredAt, l.lastLogin])}
          />
        </TabsContent>

        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Platform Usage</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={apiRequestSeries}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="mt-4">
          <ReportTable
            columns={["Lender", "Used (GB)", "Limit (GB)", "% Used"]}
            rows={lenders.slice(0, 15).map((l) => [l.name, String(l.storageUsedGB), String(l.storageLimitGB), Math.round((l.storageUsedGB / l.storageLimitGB) * 100) + "%"])}
          />
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <ReportTable
            columns={["Lender", "Usage", "Limit", "% Used"]}
            rows={lenders.slice(0, 15).map((l) => [l.name, l.apiUsage.toLocaleString("en-IN"), l.apiLimit.toLocaleString("en-IN"), Math.round((l.apiUsage / l.apiLimit) * 100) + "%"])}
          />
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Gross MRR" value={inr(lenders.reduce((s, l) => s + l.monthlyRevenue, 0))} />
            <Stat label="GST collected" value={inr(Math.round(lenders.reduce((s, l) => s + l.monthlyRevenue, 0) * 0.18))} />
            <Stat label="Refunds" value={inr(38400)} tone="warn" />
            <Stat label="Net revenue" value={inr(Math.round(lenders.reduce((s, l) => s + l.monthlyRevenue, 0) * 1.18 - 38400))} tone="success" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <Card>
      <div className="hidden md:block">
        <Table>
          <TableHeader><TableRow>{columns.map((c) => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{rows.map((r, i) => (
            <TableRow key={i}>{r.map((cell, j) => <TableCell key={j} className={j === 0 ? "font-medium" : "tabular-nums"}>{cell}</TableCell>)}</TableRow>
          ))}</TableBody>
        </Table>
      </div>
      <div className="grid gap-2 p-3 md:hidden">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="font-medium">{r[0]}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {r.slice(1).map((cell, j) => (
                <div key={j}><div className="text-muted-foreground">{columns[j + 1]}</div><div className="font-medium text-foreground">{cell}</div></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Stat({ label, value, icon: Icon, tone = "primary" }: { label: string; value: string; icon?: typeof IndianRupee; tone?: string }) {
  const tones: Record<string, string> = { primary: "text-primary bg-primary/10", success: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400", warn: "text-amber-600 bg-amber-500/10 dark:text-amber-400" };
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-start justify-between">
        {Icon && <span className={`grid size-8 place-items-center rounded-md ${tones[tone]}`}><Icon className="size-4" /></span>}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-bold">{value}</div>
    </CardContent></Card>
  );
}
