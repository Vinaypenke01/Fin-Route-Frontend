import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Search, Share2 } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { Avatar, MChip, MSection, BottomSheet } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fieldCustomers, paymentModes, skipReasons, inr } from "@/lib/field-data";

export const Route = createFileRoute("/field/collections/new")({
  head: () => ({
    meta: [
      { title: "Record Collection · FinRoute Field" },
      { name: "description", content: "Fast, touch-friendly interface to record a customer collection with any payment mode." },
      { property: "og:title", content: "Record Collection — FinRoute Field" },
      { property: "og:description", content: "Search a customer, pick a payment mode, print receipt." },
    ],
  }),
  component: NewCollection,
});

type Step = "customer" | "amount" | "confirm" | "success";

function NewCollection() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("customer");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<typeof fieldCustomers[number] | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [mode, setMode] = useState<typeof paymentModes[number]["id"]>("cash");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState<"paid" | "partial" | "skipped">("paid");
  const [reason, setReason] = useState("");
  const [reasonSheet, setReasonSheet] = useState(false);

  const list = useMemo(() => fieldCustomers.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)).slice(0, 20), [q]);

  const pick = (c: typeof fieldCustomers[number]) => { setSelected(c); setAmount(c.installment); setStep("amount"); };

  return (
    <FieldShell title="Record Collection" subtitle={`Step ${["customer","amount","confirm","success"].indexOf(step)+1} of 4`} back="/field/collections" hideFab>
      {/* Stepper */}
      <div className="mb-4 flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= ["customer","amount","confirm","success"].indexOf(step) ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === "customer" && (
        <>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search customer" autoFocus
              className="h-12 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <Card className="divide-y">
            {list.map((c)=>(
              <button key={c.id} onClick={()=>pick(c)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50">
                <Avatar name={c.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <MChip status={c.dueBadge} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.area} · EMI {inr(c.installment)}</p>
                </div>
              </button>
            ))}
          </Card>
        </>
      )}

      {step === "amount" && selected && (
        <>
          <Card className="mb-4 flex items-center gap-3 p-3">
            <Avatar name={selected.name} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">Outstanding {inr(selected.outstanding)}</p>
            </div>
            <button type="button" onClick={()=>{ setSelected(null); setStep("customer"); }} className="text-xs font-medium text-primary">Change</button>
          </Card>

          {/* Status */}
          <MSection title="Visit Status" />
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(["paid","partial","skipped"] as const).map((s)=>(
              <button key={s} onClick={()=>setStatus(s)}
                className={`rounded-2xl border p-3 text-center text-xs font-medium capitalize ${status===s?"border-primary bg-primary/10 text-primary":""}`}>{s}</button>
            ))}
          </div>

          {status !== "skipped" ? (
            <>
              <MSection title="Amount" />
              <Card className="mb-4 p-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Collected Amount</p>
                  <p className="mt-1 font-display text-3xl font-bold text-primary">₹{amount.toLocaleString("en-IN")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Expected {inr(selected.installment)}</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={()=>setAmount(selected.installment)} className="rounded-full bg-primary/10 py-2 text-xs font-medium text-primary">Full</button>
                  <button onClick={()=>setAmount(Math.round(selected.installment/2))} className="rounded-full bg-muted py-2 text-xs font-medium">Half</button>
                  <button onClick={()=>setAmount(0)} className="rounded-full bg-muted py-2 text-xs font-medium">Clear</button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[100,500,1000,2000,5000,10000].map((n)=>(
                    <button key={n} onClick={()=>setAmount((a)=>a+n)} className="rounded-lg border py-2 text-sm font-medium hover:bg-muted">+₹{n}</button>
                  ))}
                </div>
              </Card>

              <MSection title="Payment Mode" />
              <div className="mb-4 grid grid-cols-2 gap-2">
                {paymentModes.map((m)=>(
                  <button key={m.id} onClick={()=>setMode(m.id)}
                    className={`rounded-2xl border p-3 text-left ${mode===m.id?"border-primary bg-primary/5":""}`}>
                    <p className="text-sm font-semibold">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <MSection title="Reason for skipping" action={<button onClick={()=>setReasonSheet(true)} className="text-xs font-medium text-primary">Suggestions</button>} />
              <input value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Type a reason"
                className="mb-4 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
              <div className="mb-4 flex flex-wrap gap-1.5">
                {skipReasons.slice(0,6).map((r)=>(
                  <button key={r} onClick={()=>setReason(r)} className="rounded-full border px-3 py-1 text-xs">{r}</button>
                ))}
              </div>
            </>
          )}

          <MSection title="Remarks" />
          <textarea value={remarks} onChange={(e)=>setRemarks(e.target.value)} placeholder="Optional note" rows={2}
            className="mb-4 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary" />

          <div className="sticky bottom-4 -mx-3 mt-4 flex gap-2 border-t bg-background/95 p-3 backdrop-blur">
            <Button variant="outline" className="flex-1" onClick={()=>setStep("customer")}>Back</Button>
            <Button className="flex-1" onClick={()=>setStep("confirm")}>Continue</Button>
          </div>

          <BottomSheet open={reasonSheet} onClose={()=>setReasonSheet(false)} title="Common reasons">
            <div className="grid gap-1.5">
              {skipReasons.map((r)=>(
                <button key={r} onClick={()=>{setReason(r); setReasonSheet(false);}} className="rounded-lg border p-3 text-left text-sm hover:bg-muted">{r}</button>
              ))}
            </div>
          </BottomSheet>
        </>
      )}

      {step === "confirm" && selected && (
        <>
          <MSection title="Receipt Preview" />
          <Card className="mb-4 p-4">
            <div className="border-b pb-3 text-center">
              <p className="font-display text-base font-bold">FinRoute Receipt</p>
              <p className="text-[10px] text-muted-foreground">RCPT-{Math.floor(Math.random()*1e6).toString().padStart(6,"0")}</p>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row2 label="Customer" value={selected.name} />
              <Row2 label="Loan ID" value={selected.loanId} />
              <Row2 label="Expected" value={inr(selected.installment)} />
              <Row2 label="Collected" value={<span className="font-bold text-primary">{inr(amount)}</span>} />
              <Row2 label="Mode" value={paymentModes.find(m=>m.id===mode)?.label ?? mode} />
              <Row2 label="Status" value={<MChip status={status} />} />
              <Row2 label="Date" value={new Date().toLocaleString("en-IN")} />
              {remarks && <Row2 label="Remarks" value={remarks} />}
              {status==="skipped" && reason && <Row2 label="Reason" value={reason} />}
            </dl>
          </Card>
          <div className="sticky bottom-4 -mx-3 flex gap-2 border-t bg-background/95 p-3">
            <Button variant="outline" className="flex-1" onClick={()=>setStep("amount")}>Edit</Button>
            <Button className="flex-1" onClick={()=>setStep("success")}>Confirm</Button>
          </div>
        </>
      )}

      {step === "success" && selected && (
        <div className="grid place-items-center py-10 text-center">
          <div className="mb-4 grid size-20 place-items-center rounded-full bg-success/15">
            <CheckCircle2 className="size-10 text-success" />
          </div>
          <p className="font-display text-xl font-bold">{status === "skipped" ? "Visit logged" : "Collection saved"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{status !== "skipped" ? `${inr(amount)} from ${selected.name}` : `${selected.name} · ${reason || "Skipped"}`}</p>
          <div className="mt-6 grid w-full max-w-xs grid-cols-2 gap-2">
            <Button variant="outline" size="sm"><Copy className="mr-1 size-4" /> Copy</Button>
            <Button variant="outline" size="sm"><Share2 className="mr-1 size-4" /> Share</Button>
          </div>
          <div className="mt-3 grid w-full max-w-xs gap-2">
            <Button onClick={()=>{ setStep("customer"); setSelected(null); setAmount(0); setRemarks(""); setReason(""); setStatus("paid"); }}>Record Another</Button>
            <Button variant="outline" onClick={()=>navigate({ to: "/field" })}>Back to Dashboard</Button>
          </div>
        </div>
      )}
    </FieldShell>
  );
}

function Row2({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
