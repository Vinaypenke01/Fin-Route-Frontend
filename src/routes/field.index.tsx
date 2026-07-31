import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet, Users, Receipt, ClipboardCheck, MapPin, PhoneCall, Bell, HandCoins,
  TrendingUp, ArrowUpRight, CheckCircle2, Clock, PlayCircle,
} from "lucide-react";
import { FieldShell, OnlineBadge } from "@/components/field/field-shell";
import { MKpi, ProgressCircle, MSection, Avatar, MChip } from "@/components/field/field-ui";
import { fieldKpis, me, todaysRoute, inr, inrCompact, fieldNotifications } from "@/lib/field-data";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/field/")({
  head: () => ({
    meta: [
      { title: "Dashboard · FinRoute Field" },
      { name: "description", content: "Today's route, collections and quick actions for the field collector." },
      { property: "og:title", content: "Field Collector Dashboard" },
      { property: "og:description", content: "KPIs, quick actions and today's timeline for FinRoute field collectors." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const k = fieldKpis;
  const collectPct = Math.round((k.collected / k.expected) * 100);
  const visitPct = Math.round((k.completedVisits / (k.completedVisits + k.pendingVisits)) * 100);
  const unreadCount = fieldNotifications.filter((n) => n.unread).length;

  return (
    <FieldShell
      title={`Hi, ${me.name.split(" ")[0]} 👋`}
      subtitle={`${me.designation} · ${me.area}`}
      action={<OnlineBadge />}
    >
      {/* Greeting card */}
      <Card className="mb-4 overflow-hidden bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs opacity-80">Today, {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
            <p className="mt-0.5 font-display text-xl font-bold">{inr(k.collected)} <span className="text-sm opacity-80">/ {inr(k.expected)}</span></p>
            <p className="mt-0.5 text-xs opacity-80">Collected so far</p>
          </div>
          <ProgressCircle value={collectPct} size={82} stroke={8} tone="success" label={<span className="text-primary-foreground">{collectPct}%</span>} sub={<span className="text-primary-foreground/80">Target</span>} />
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/field/today-route" className="flex-1 rounded-full bg-white/15 py-2 text-center text-sm font-medium backdrop-blur hover:bg-white/25">
            <PlayCircle className="mr-1 inline size-4" /> Continue Route
          </Link>
          <Link to="/field/handover" className="flex-1 rounded-full bg-background py-2 text-center text-sm font-semibold text-primary hover:bg-white">
            <HandCoins className="mr-1 inline size-4" /> Handover
          </Link>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <MKpi label="Assigned" value={k.assigned} icon={<Users />} />
        <MKpi label="Collected" value={inrCompact(k.collected)} tone="positive" icon={<Wallet />} />
        <MKpi label="Expected" value={inrCompact(k.expected)} tone="info" icon={<TrendingUp />} />
        <MKpi label="Pending" value={k.pendingVisits} tone="warning" icon={<Clock />} />
        <MKpi label="Done" value={k.completedVisits} tone="positive" icon={<CheckCircle2 />} />
        <MKpi label="Expenses" value={inr(k.expensesToday)} tone="danger" icon={<Receipt />} />
        <MKpi label="Cash in Hand" value={inr(k.cashInHand)} icon={<HandCoins />} />
        <MKpi label="Route" value={`${k.routeCompletionPct}%`} tone="info" icon={<MapPin />} />
        <MKpi label="Score" value={k.performanceScore} tone="positive" icon={<TrendingUp />} />
      </div>

      {/* Progress rings */}
      <Card className="mb-4 p-4">
        <MSection title="Daily Progress" description="Route completion at a glance" />
        <div className="flex justify-around">
          <div className="text-center">
            <ProgressCircle value={collectPct} tone="primary" sub="Collect" />
          </div>
          <div className="text-center">
            <ProgressCircle value={visitPct} tone="success" sub="Visits" />
          </div>
          <div className="text-center">
            <ProgressCircle value={k.routeCompletionPct} tone="warning" sub="Route" />
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <MSection title="Quick Actions" />
      <div className="mb-5 grid grid-cols-4 gap-2">
        <QuickAction to="/field/today-route" icon={<MapPin />} label="Route" tone="bg-primary/10 text-primary" />
        <QuickAction to="/field/customers" icon={<Users />} label="Customers" tone="bg-success/10 text-success" />
        <QuickAction to="/field/collections/new" icon={<Wallet />} label="Collect" tone="bg-warning/10 text-warning" />
        <QuickAction to="/field/expenses" icon={<Receipt />} label="Expense" tone="bg-destructive/10 text-destructive" />
        <QuickAction to="/field/attendance" icon={<ClipboardCheck />} label="Attend" tone="bg-primary/10 text-primary" />
        <QuickAction to="/field/handover" icon={<HandCoins />} label="Handover" tone="bg-success/10 text-success" />
        <QuickAction to="/field/customers" icon={<PhoneCall />} label="Call" tone="bg-warning/10 text-warning" />
        <QuickAction to="/field/notifications" icon={<Bell />} label={`Alerts${unreadCount ? " " + unreadCount : ""}`} tone="bg-destructive/10 text-destructive" />
      </div>

      {/* Today's timeline */}
      <MSection title="Today's Timeline" action={<Link to="/field/today-route" className="text-xs font-medium text-primary">View route <ArrowUpRight className="inline size-3" /></Link>} />
      <Card className="divide-y overflow-hidden">
        {todaysRoute.stops.slice(0, 6).map((s) => (
          <Link key={s.seq} to="/field/customers/$id" params={{ id: s.customer.id }} className="flex items-center gap-3 p-3 hover:bg-muted/50">
            <Avatar name={s.customer.name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.customer.name}</p>
              <p className="truncate text-xs text-muted-foreground">{s.eta} · {s.customer.area} · {inr(s.customer.installment)}</p>
            </div>
            <MChip status={s.status} />
          </Link>
        ))}
      </Card>
    </FieldShell>
  );
}

function QuickAction({ to, icon, label, tone }: { to: string; icon: React.ReactNode; label: string; tone: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 rounded-2xl bg-background p-2.5 shadow-sm">
      <span className={`grid size-10 place-items-center rounded-2xl ${tone} [&_svg]:size-5`}>{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
