import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, TrendingUp, Trophy, Users } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MKpi, MSection, ProgressCircle, Avatar } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { performanceDaily, performanceWeekly, performanceMonthly, inrCompact, fieldKpis } from "@/lib/field-data";

export const Route = createFileRoute("/field/performance")({
  head: () => ({
    meta: [
      { title: "Performance · FinRoute Field" },
      { name: "description", content: "Daily, weekly and monthly performance analytics with leaderboard." },
      { property: "og:title", content: "Performance — FinRoute Field" },
      { property: "og:description", content: "Track collection success, visits and rankings." },
    ],
  }),
  component: Performance,
});

const leaderboard = [
  { name: "Vikram Reddy", score: 96, area: "Whitefield" },
  { name: "Kiran Nair", score: 92, area: "Anna Nagar" },
  { name: "Rajesh Sharma", score: 87, area: "HSR Layout" },
  { name: "Priya Iyer", score: 84, area: "Koramangala" },
  { name: "Amit Verma", score: 81, area: "Indiranagar" },
];

function Performance() {
  return (
    <FieldShell title="Performance" subtitle="Sep 2026" back="/field/profile">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <MKpi label="Score" value={fieldKpis.performanceScore} tone="positive" icon={<TrendingUp />} />
        <MKpi label="Visits" value={432} tone="info" icon={<Users />} />
        <MKpi label="Success" value="82%" tone="warning" icon={<Award />} />
      </div>

      <MSection title="Daily collections (14d)" />
      <Card className="mb-4 p-3">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={performanceDaily}>
            <defs><linearGradient id="pd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="hsl(var(--primary))" stopOpacity={0.5} /><stop offset="1" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickFormatter={(v)=>inrCompact(v)} tickLine={false} axisLine={false} width={40} />
            <Tooltip formatter={(v: number)=>inrCompact(v)} />
            <Area dataKey="collected" stroke="hsl(var(--primary))" fill="url(#pd)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <MSection title="Weekly" />
      <Card className="mb-4 p-3">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={performanceWeekly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="week" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickFormatter={(v)=>inrCompact(v)} width={40} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: number)=>inrCompact(v)} />
            <Bar dataKey="collected" fill="hsl(var(--success))" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <MSection title="Monthly trend" />
      <Card className="mb-4 p-3">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={performanceMonthly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickFormatter={(v)=>inrCompact(v)} width={40} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: number)=>inrCompact(v)} />
            <Line dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
            <Line dataKey="collected" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <MSection title="Success rate" />
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-around">
          <ProgressCircle value={82} sub="Success" tone="success" />
          <ProgressCircle value={91} sub="Attend" tone="primary" />
          <ProgressCircle value={64} sub="Route" tone="warning" />
        </div>
      </Card>

      <MSection title="Leaderboard" action={<span className="text-xs font-medium text-primary">You: #3</span>} />
      <Card className="divide-y">
        {leaderboard.map((l, i) => (
          <div key={l.name} className={`flex items-center gap-3 p-3 ${i === 2 ? "bg-primary/5" : ""}`}>
            <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-bold">#{i+1}</span>
            <Avatar name={l.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{l.name}</p>
              <p className="text-[11px] text-muted-foreground">{l.area}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{l.score}</p>
              {i === 0 && <Trophy className="ml-auto size-3 text-warning" />}
            </div>
          </div>
        ))}
      </Card>
    </FieldShell>
  );
}
