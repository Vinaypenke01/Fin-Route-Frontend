import { createFileRoute } from "@tanstack/react-router";
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Download, Cloud } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MChip, MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncQueue } from "@/lib/field-data";

export const Route = createFileRoute("/field/offline")({
  head: () => ({
    meta: [
      { title: "Offline & Sync · FinRoute Field" },
      { name: "description", content: "Pending sync queue, offline banner and install prompts." },
      { property: "og:title", content: "Offline & Sync — FinRoute Field" },
      { property: "og:description", content: "Handle unsynced work, resolve conflicts and install the PWA." },
    ],
  }),
  component: Offline,
});

function Offline() {
  return (
    <FieldShell title="Offline & Sync" subtitle="Manage unsynced work" back="/field/profile">
      <Card className="mb-4 flex items-center gap-3 border-warning/40 bg-warning/10 p-3">
        <WifiOff className="size-5 text-warning" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-warning">You're offline</p>
          <p className="text-[11px] text-warning/80">Collections & visits will sync when back online.</p>
        </div>
      </Card>

      <MSection title="Pending sync" action={<Button variant="ghost" size="sm"><RefreshCw className="mr-1 size-4" /> Retry</Button>} />
      <Card className="mb-4 divide-y">
        {syncQueue.map((q) => (
          <div key={q.id} className="flex items-center gap-3 p-3">
            <span className={`grid size-9 place-items-center rounded-full ${q.state === "conflict" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
              {q.state === "conflict" ? <AlertTriangle className="size-4" /> : <Cloud className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{q.label}</p>
              <p className="text-[11px] text-muted-foreground">{q.type} · {q.time}</p>
            </div>
            <MChip status={q.state} />
          </div>
        ))}
      </Card>

      <MSection title="Recently synced" />
      <Card className="mb-4 divide-y">
        {[
          { label: "Ravi Kumar · ₹1,200 · Cash", time: "1h ago" },
          { label: "Priya Sharma · ₹850 · UPI", time: "2h ago" },
          { label: "Attendance · Check-in", time: "3h ago" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-success/15 text-success"><CheckCircle2 className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">Synced · {s.time}</p>
            </div>
          </div>
        ))}
      </Card>

      <MSection title="Install app" />
      <Card className="mb-4 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Download className="size-5" /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Add FinRoute Field to your home screen</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Faster launch and full-screen field experience.</p>
            <Button size="sm" className="mt-2">Install</Button>
          </div>
        </div>
      </Card>

      <p className="text-center text-[10px] text-muted-foreground">Update v4.0.1 available — restart to apply.</p>
    </FieldShell>
  );
}
