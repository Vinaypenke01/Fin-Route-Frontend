import { createFileRoute } from "@tanstack/react-router";
import { Camera, Clock, MapPin, LogIn, LogOut } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MChip, MSection, ProgressCircle } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { attendance } from "@/lib/field-data";
import { useState } from "react";

export const Route = createFileRoute("/field/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance · FinRoute Field" },
      { name: "description", content: "Check in / out, view working hours and monthly attendance calendar." },
      { property: "og:title", content: "Attendance — FinRoute Field" },
      { property: "og:description", content: "GPS-based mock check-in with monthly calendar." },
    ],
  }),
  component: Attendance,
});

function Attendance() {
  const [checkedIn, setCheckedIn] = useState(true);
  const today = attendance[0];
  const workingDays = attendance.filter((a) => a.status !== "off");
  const present = workingDays.filter((a) => a.status === "present" || a.status === "late").length;
  const pct = Math.round((present / workingDays.length) * 100);

  return (
    <FieldShell title="Attendance" subtitle="September 2026" back="/field/profile">
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Today's Status</p>
            <p className="mt-1 font-display text-lg font-bold">{today.status === "present" ? "Checked In" : "Not marked"}</p>
            <p className="text-xs text-muted-foreground">
              <MapPin className="mr-0.5 inline size-3" /> {today.location}
            </p>
          </div>
          <ProgressCircle value={pct} sub="Present" tone="success" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Check-In</p>
            <p className="mt-0.5 text-sm font-semibold">{today.checkIn ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Check-Out</p>
            <p className="mt-0.5 text-sm font-semibold">{today.checkOut ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Hours</p>
            <p className="mt-0.5 text-sm font-semibold">{today.hours}h</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={() => setCheckedIn(!checkedIn)}>
            {checkedIn ? <><LogOut className="mr-1 size-4" /> Check Out</> : <><LogIn className="mr-1 size-4" /> Check In</>}
          </Button>
          <Button variant="outline" size="icon"><Camera className="size-4" /></Button>
        </div>
        <div className="mt-3 h-24 rounded-xl border border-dashed text-center"
          style={{ backgroundImage: "linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
          <div className="flex h-full items-center justify-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-4 text-primary" /> GPS placeholder · 12.9345°N, 77.6210°E
          </div>
        </div>
      </Card>

      <MSection title="This month" />
      <Card className="mb-4 p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
          {["S","M","T","W","T","F","S"].map((d,i)=><span key={i}>{d}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const rec = attendance[i];
            const cls = rec?.status === "present" ? "bg-success/20 text-success" :
              rec?.status === "late" ? "bg-warning/20 text-warning" :
              rec?.status === "absent" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground";
            return <div key={i} className={`grid aspect-square place-items-center rounded-lg text-xs font-medium ${cls}`}>{30 - i}</div>;
          })}
        </div>
      </Card>

      <MSection title="History" />
      <Card className="divide-y">
        {attendance.slice(0, 10).map((a) => (
          <div key={a.date} className="flex items-center gap-3 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-muted"><Clock className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{a.date}</p>
              <p className="text-xs text-muted-foreground">{a.checkIn ?? "—"} → {a.checkOut ?? "—"} · {a.hours}h</p>
            </div>
            <MChip status={a.status} />
          </div>
        ))}
      </Card>
    </FieldShell>
  );
}
