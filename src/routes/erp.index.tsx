import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard, ChartCard, SectionHeader, StatusChip } from "@/components/erp/erp-ui";
import {
  Wallet, TrendingDown, TrendingUp, Users, Landmark, UsersRound, MapPin,
  Receipt, Coins, PiggyBank, Percent, Activity, UserPlus, AlertTriangle,
  FileCheck2, ArrowRight, Plus, Route as RouteIcon,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import {
  kpis, inr, inrCompact, revenueTrend, collectionsTrend, dailyCollections,
  weeklyCollections, loanDistribution, outstandingTrend, customerGrowth,
  areaPerformance, employeePerformance, collections, notifications, loans,
} from "@/lib/erp-data";

export const Route = createFileRoute("/erp/")({
  head: () => ({ meta: [{ title: "Dashboard — FinRoute ERP" }, { name: "description", content: "Real-time overview of every collection, loan, employee, and rupee across your business." }] }),
  component: DashboardPage,
});

const PIE_COLORS = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)"];

const quickActions = [
  { label: "Add Customer", to: "/erp/customers", icon: UserPlus },
  { label: "Create Loan", to: "/erp/loans", icon: Landmark },
  { label: "Record Collection", to: "/erp/collections", icon: Wallet },
  { label: "Assign Collector", to: "/erp/routes", icon: RouteIcon },
  { label: "Add Expense", to: "/erp/expenses", icon: Receipt },
  { label: "Create Route", to: "/erp/routes", icon: MapPin },
  { label: "Generate Report", to: "/erp/reports", icon: FileCheck2 },
  { label: "Cash Summary", to: "/erp/reconciliation", icon: Coins },
] as const;

function DashboardPage() {
  const recent = collections.slice(0, 6);
  const alerts = notifications.slice(0, 5);
  const approvals = loans.filter((l) => l.status === "Pending").slice(0, 5);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Good morning, Rajesh 👋"
        description="Here's what's happening across your business today."
        action={
          <>
            <Button asChild variant="outline" size="sm"><Link to="/erp/reports">View reports</Link></Button>
            <Button asChild size="sm"><Link to="/erp/collections"><Plus className="size-4" /> Record collection</Link></Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard label="Today's Collections" value={inr(kpis.todayCollections)} delta="+12% vs yesterday" tone="positive" icon={<Wallet className="size-4" />} />
        <KpiCard label="Expected Collections" value={inr(kpis.expectedCollections)} delta={`${Math.round((kpis.todayCollections / kpis.expectedCollections) * 100)}% achieved`} icon={<TrendingUp className="size-4" />} />
        <KpiCard label="Outstanding" value={inrCompact(kpis.outstanding)} delta="Across 328 loans" tone="warning" icon={<TrendingDown className="size-4" />} />
        <KpiCard label="Cash Balance" value={inr(kpis.cashBalance)} delta="After today's expenses" tone="info" icon={<PiggyBank className="size-4" />} />
        <KpiCard label="Active Customers" value={kpis.activeCustomers} delta={`+${kpis.newCustomersThisMonth} this month`} icon={<Users className="size-4" />} />
        <KpiCard label="Active Loans" value={kpis.activeLoans} icon={<Landmark className="size-4" />} />
        <KpiCard label="Employees" value={kpis.employees} delta={`${kpis.collectorsOnField} on field`} icon={<UsersRound className="size-4" />} />
        <KpiCard label="Today's Expenses" value={inr(kpis.todayExpenses)} tone="warning" icon={<Receipt className="size-4" />} />
        <KpiCard label="Profit" value={inr(kpis.profit)} tone="positive" delta="Today" icon={<TrendingUp className="size-4" />} />
        <KpiCard label="Collection %" value={`${kpis.collectionPct}%`} tone="positive" icon={<Percent className="size-4" />} />
        <KpiCard label="Loan Recovery %" value={`${kpis.loanRecoveryPct}%`} tone="info" icon={<Percent className="size-4" />} />
        <KpiCard label="Route Completion %" value={`${kpis.routeCompletionPct}%`} icon={<Activity className="size-4" />} />
        <KpiCard label="New Customers (mo.)" value={kpis.newCustomersThisMonth} tone="positive" icon={<UserPlus className="size-4" />} />
        <KpiCard label="Overdue Loans" value={kpis.overdueLoans} tone="danger" icon={<AlertTriangle className="size-4" />} />
        <KpiCard label="Pending Approvals" value={kpis.pendingApprovals} tone="warning" icon={<FileCheck2 className="size-4" />} />
        <KpiCard label="Collectors on Field" value={kpis.collectorsOnField} tone="positive" icon={<MapPin className="size-4" />} />
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Quick actions</h3>
            <p className="text-xs text-muted-foreground">Jump straight into the most common tasks.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map((q) => (
            <Button key={q.label} asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link to={q.to}>
                <q.icon className="size-5 text-primary" />
                <span className="text-xs font-medium leading-tight">{q.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </Card>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue trend" subtitle="Last 12 months" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={revenueTrend} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="url(#revG)" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="var(--color-warning)" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Loan distribution" subtitle="By frequency">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={loanDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {loanDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily collections" subtitle="Last 14 days">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={dailyCollections}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Weekly collections" subtitle="Last 12 weeks">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={weeklyCollections}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Line type="monotone" dataKey="amount" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Collections vs Expected" subtitle="Monthly" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={collectionsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="expected" fill="var(--color-muted-foreground)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Outstanding trend">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={outstandingTrend}>
                <defs>
                  <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="outstanding" stroke="var(--color-warning)" fill="url(#outG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 4 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Customer growth" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="new" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="active" stroke="var(--color-success)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Employee performance" subtitle="Top collectors">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={employeePerformance} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Bar dataKey="perf" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Area performance" subtitle="Collected (₹ '000s) & rate %">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={areaPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="collected" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Collected (₹k)" />
              <Bar dataKey="pct" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Recent collections</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/erp/collections">All <ArrowRight className="size-3.5" /></Link></Button>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.area} · by {c.collectorName} · {c.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={c.status} />
                  <span className="font-display text-sm font-bold">{inr(c.collected)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Alerts</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/erp/notifications">All</Link></Button>
          </div>
          <ul className="space-y-3">
            {alerts.map((n) => (
              <li key={n.id} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Pending loan approvals</h3>
            <p className="text-xs text-muted-foreground">{approvals.length} awaiting your review</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/erp/loans">Approval queue</Link></Button>
        </div>
        <ul className="divide-y divide-border">
          {approvals.map((l) => (
            <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{l.customerName} <span className="text-muted-foreground">· {l.id}</span></p>
                <p className="truncate text-xs text-muted-foreground">{l.purpose} · {l.frequency} · {l.term} installments · {l.interestPct}% p.a.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold">{inr(l.principal)}</span>
                <Button size="sm" variant="outline">Review</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
