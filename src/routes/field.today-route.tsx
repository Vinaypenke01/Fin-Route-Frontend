import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Navigation, Clock, CheckCircle2, SkipForward, PlayCircle, StopCircle } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { ProgressCircle, MChip, Avatar, MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { todaysRoute, inr } from "@/lib/field-data";

export const Route = createFileRoute("/field/today-route")({
  head: () => ({
    meta: [
      { title: "Today's Route · FinRoute Field" },
      { name: "description", content: "Optimised route sequence with map placeholder, ETAs and visit actions." },
      { property: "og:title", content: "Today's Route — FinRoute Field" },
      { property: "og:description", content: "Follow the sequence, mark visits, navigate to next customer." },
    ],
  }),
  component: RoutePage,
});

function RoutePage() {
  const [stops, setStops] = useState(todaysRoute.stops);
  const done = stops.filter((s) => s.status === "done").length;
  const pct = Math.round((done / stops.length) * 100);
  const totalDistance = todaysRoute.distanceKm;
  const totalExpected = stops.reduce((a, s) => a + s.customer.installment, 0);

  const mark = (seq: number, status: "done" | "skipped") =>
    setStops((prev) => prev.map((s) => (s.seq === seq ? { ...s, status } : s)));

  return (
    <FieldShell title="Today's Route" subtitle={todaysRoute.name} back="/field">
      {/* Map placeholder */}
      <Card className="mb-4 overflow-hidden">
        <div
          className="relative h-40 w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            backgroundColor: "hsl(var(--muted))",
          }}
        >
          <svg viewBox="0 0 320 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <path d="M20 130 Q80 40 160 90 T310 30" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeDasharray="6 4" />
            {[[20,130],[100,60],[160,90],[220,60],[310,30]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r={6} fill="hsl(var(--primary))" />
            ))}
          </svg>
          <div className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium">
            <MapPin className="mr-1 inline size-3" /> {totalDistance} km · ETA {todaysRoute.eta}
          </div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ProgressCircle value={pct} size={64} stroke={7} tone="success" />
            <div>
              <p className="font-display text-lg font-bold">{done}/{stops.length}</p>
              <p className="text-xs text-muted-foreground">Stops completed</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold">{inr(totalExpected)}</p>
            <p className="text-xs text-muted-foreground">Expected today</p>
          </div>
        </div>
        <div className="flex gap-2 border-t p-3">
          <Button size="sm" className="flex-1"><PlayCircle className="mr-1 size-4" /> Start</Button>
          <Button size="sm" variant="outline" className="flex-1"><Navigation className="mr-1 size-4" /> Navigate</Button>
          <Button size="sm" variant="outline" className="flex-1"><StopCircle className="mr-1 size-4" /> Complete</Button>
        </div>
      </Card>

      <MSection title="Customer Sequence" description={`${stops.length} stops · ${totalDistance} km`} />
      <Card className="divide-y">
        {stops.map((s) => (
          <div key={s.seq} className="flex items-start gap-3 p-3">
            <div className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
              s.status === "done" ? "bg-success text-success-foreground" :
              s.status === "current" ? "bg-primary text-primary-foreground" :
              s.status === "skipped" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
            }`}>{s.seq}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{s.customer.name}</p>
                <MChip status={s.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <Clock className="mr-0.5 inline size-3" /> {s.eta} · {s.customer.distanceKm} km · {inr(s.customer.installment)}
              </p>
              <div className="mt-2 flex gap-1.5">
                <Link to="/field/collections/new" className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">Collect</Link>
                <button onClick={() => mark(s.seq, "done")} className="rounded-full bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
                  <CheckCircle2 className="mr-0.5 inline size-3" /> Visited
                </button>
                <button onClick={() => mark(s.seq, "skipped")} className="rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive">
                  <SkipForward className="mr-0.5 inline size-3" /> Skip
                </button>
              </div>
            </div>
            <Avatar name={s.customer.name} size={36} />
          </div>
        ))}
      </Card>
    </FieldShell>
  );
}
