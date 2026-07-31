import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HandCoins, CheckCircle2 } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MChip, MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { handovers, fieldKpis, inr } from "@/lib/field-data";

export const Route = createFileRoute("/field/handover")({
  head: () => ({
    meta: [
      { title: "Cash Handover · FinRoute Field" },
      { name: "description", content: "End-of-day cash submission with variance calculation." },
      { property: "og:title", content: "Cash Handover — FinRoute Field" },
      { property: "og:description", content: "Reconcile the day's cash and submit to office." },
    ],
  }),
  component: Handover,
});

function Handover() {
  const expected = fieldKpis.collected;
  const expenses = fieldKpis.expensesToday;
  const [submit, setSubmit] = useState(expected - expenses);
  const [remarks, setRemarks] = useState("");
  const [done, setDone] = useState(false);
  const cashToSubmit = expected - expenses;
  const diff = submit - cashToSubmit;

  if (done) {
    return (
      <FieldShell title="Handover Complete" back="/field/profile" hideFab>
        <div className="grid place-items-center py-14 text-center">
          <div className="mb-4 grid size-20 place-items-center rounded-full bg-success/15"><CheckCircle2 className="size-10 text-success" /></div>
          <p className="font-display text-xl font-bold">Cash handed over</p>
          <p className="mt-1 text-sm text-muted-foreground">{inr(submit)} submitted to office · ref HND-{Math.floor(Math.random()*1e6)}</p>
          <Button className="mt-6" onClick={()=>setDone(false)}>View history</Button>
        </div>
      </FieldShell>
    );
  }

  return (
    <FieldShell title="Cash Handover" subtitle="End-of-day submission" back="/field/profile">
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Expected" value={inr(expected)} />
          <Stat label="Collected" value={inr(fieldKpis.collected)} tone="text-success" />
          <Stat label="Expenses" value={inr(expenses)} tone="text-destructive" />
          <Stat label="Cash to submit" value={inr(cashToSubmit)} tone="text-primary" />
        </div>
        <div className="mt-4">
          <label className="text-[10px] uppercase text-muted-foreground">Actual amount to submit</label>
          <input type="number" value={submit} onChange={(e)=>setSubmit(Number(e.target.value))}
            className="mt-1 h-14 w-full rounded-2xl border bg-background px-4 text-center font-display text-2xl font-bold outline-none focus:border-primary" />
          <p className={`mt-2 text-center text-xs font-medium ${diff===0?"text-success":diff>0?"text-primary":"text-destructive"}`}>
            {diff === 0 ? "Matches expected" : diff > 0 ? `Excess ${inr(diff)}` : `Short by ${inr(-diff)}`}
          </p>
        </div>
        <textarea value={remarks} onChange={(e)=>setRemarks(e.target.value)} placeholder="Remarks (optional)" rows={2}
          className="mt-3 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary" />
        <Button className="mt-3 w-full" onClick={()=>setDone(true)}><HandCoins className="mr-1 size-4" /> Submit cash</Button>
      </Card>

      <MSection title="Recent handovers" />
      <Card className="divide-y">
        {handovers.map((h) => (
          <div key={h.id} className="flex items-center gap-3 p-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-muted"><HandCoins className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{inr(h.submitted)}</p>
                <MChip status={h.status} />
              </div>
              <p className="text-[11px] text-muted-foreground">{h.date} · {h.approver}</p>
            </div>
            <div className="text-right text-[11px]">
              <p className="text-muted-foreground">Collected {inr(h.collected)}</p>
              <p className="text-muted-foreground">Exp {inr(h.expenses)}</p>
            </div>
          </div>
        ))}
      </Card>
    </FieldShell>
  );
}
function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-display text-lg font-bold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
