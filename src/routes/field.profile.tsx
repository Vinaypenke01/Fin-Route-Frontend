import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Calendar, ChevronRight, FileText, HandCoins, HelpCircle, LogOut, Mail, MapPin, Phone, Settings, ShieldCheck, TrendingUp, Trophy, WifiOff } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { Avatar, MSection, ProgressCircle } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { me, attendance, fieldKpis } from "@/lib/field-data";

export const Route = createFileRoute("/field/profile")({
  head: () => ({
    meta: [
      { title: "Profile · FinRoute Field" },
      { name: "description", content: "Employee profile with performance, attendance, and quick links." },
      { property: "og:title", content: "Collector Profile — FinRoute Field" },
      { property: "og:description", content: "Your ID, area, route and performance summary." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const present = attendance.filter((a) => a.status === "present").length;
  const pctAtt = Math.round((present / attendance.length) * 100);

  return (
    <FieldShell title="Profile" subtitle="Account & performance">
      <Card className="mb-4 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <Avatar name={me.name} size={64} className="ring-2 ring-white/40" />
            <div className="min-w-0">
              <p className="font-display text-lg font-bold">{me.name}</p>
              <p className="text-xs opacity-90">{me.designation} · {me.code}</p>
              <p className="text-[11px] opacity-80">Joined {me.joined} · {me.joinedYears}y</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x">
          <Stat label="Score" value={fieldKpis.performanceScore} tone="text-success" />
          <Stat label="Route" value={`${fieldKpis.routeCompletionPct}%`} tone="text-primary" />
          <Stat label="Attend" value={`${pctAtt}%`} tone="text-warning" />
        </div>
      </Card>

      <MSection title="Contact" />
      <Card className="mb-4 divide-y">
        <Row icon={<Phone className="size-4" />} label={me.phone} sub="Mobile" />
        <Row icon={<Mail className="size-4" />} label={me.email} sub="Work email" />
        <Row icon={<MapPin className="size-4" />} label={me.area} sub="Assigned area" />
      </Card>

      <MSection title="Assignments" />
      <Card className="mb-4 grid grid-cols-2 divide-x">
        <Stat label="Routes" value={me.routesAssigned || 1} />
        <Stat label="Customers" value={200} />
      </Card>

      <MSection title="Performance snapshot" action={<Link to="/field/performance" className="text-xs font-medium text-primary">View analytics</Link>} />
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-around">
          <div className="text-center"><ProgressCircle value={fieldKpis.performanceScore} sub="Score" tone="success" /></div>
          <div className="text-center"><ProgressCircle value={pctAtt} sub="Attend" tone="primary" /></div>
          <div className="text-center"><ProgressCircle value={fieldKpis.routeCompletionPct} sub="Route" tone="warning" /></div>
        </div>
      </Card>

      <MSection title="Quick links" />
      <Card className="mb-4 divide-y">
        <LinkRow to="/field/attendance" icon={<Calendar className="size-4" />} label="Attendance" />
        <LinkRow to="/field/handover" icon={<HandCoins className="size-4" />} label="Cash Handover" />
        <LinkRow to="/field/expenses" icon={<FileText className="size-4" />} label="Expenses" />
        <LinkRow to="/field/performance" icon={<TrendingUp className="size-4" />} label="Performance" />
        <LinkRow to="/field/settings" icon={<Settings className="size-4" />} label="Settings" />
        <LinkRow to="/field/help" icon={<HelpCircle className="size-4" />} label="Help & Support" />
        <LinkRow to="/field/offline" icon={<WifiOff className="size-4" />} label="Offline & Sync" />
      </Card>

      <Card className="mb-4 p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-warning/15 text-warning"><Trophy className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Rank #3 this month</p>
            <p className="text-xs text-muted-foreground">Bengaluru zone · 42 collectors</p>
          </div>
          <Award className="size-6 text-warning" />
        </div>
      </Card>

      <Button variant="outline" className="w-full" asChild>
        <Link to="/login"><LogOut className="mr-1 size-4" /> Log out</Link>
      </Button>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        <ShieldCheck className="mr-0.5 inline size-3" /> v4.0 · FinRoute Field
      </p>
    </FieldShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="p-3 text-center">
      <p className={`font-display text-lg font-bold ${tone ?? ""}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
function Row({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0"><p className="truncate text-sm">{label}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
    </div>
  );
}
function LinkRow({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-3 hover:bg-muted/50">
      <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
