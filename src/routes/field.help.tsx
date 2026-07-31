import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, MessageCircle, Phone, PlayCircle, Search, Ticket, BookOpen } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/field/help")({
  head: () => ({
    meta: [
      { title: "Help & Support · FinRoute Field" },
      { name: "description", content: "FAQs, tickets, contact support and video guides." },
      { property: "og:title", content: "Help & Support — FinRoute Field" },
      { property: "og:description", content: "Raise a ticket, browse FAQs, watch tutorials." },
    ],
  }),
  component: Help,
});

const faqs = [
  { q: "How do I mark a customer as skipped?", a: "Open the customer, tap Skip and select a reason from the suggestions." },
  { q: "Can I edit a collection after saving?", a: "Yes, open Collections and tap the record. If it's already synced, request correction from your manager." },
  { q: "What if I forget to check-in?", a: "Go to Attendance and tap Check-In. The system captures the current GPS." },
  { q: "How does cash handover work?", a: "At end-of-day, open Handover, enter the amount you're submitting and hand cash to office." },
  { q: "What happens if I lose network?", a: "Everything works offline. Data syncs automatically when you're back online." },
];

function Help() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const list = faqs.filter((f) => !q || f.q.toLowerCase().includes(q.toLowerCase()));

  return (
    <FieldShell title="Help & Support" back="/field/profile">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Card className="flex flex-col items-center gap-1 p-3 text-center">
          <Phone className="size-5 text-success" />
          <p className="text-[11px] font-medium">Call office</p>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-3 text-center">
          <MessageCircle className="size-5 text-primary" />
          <p className="text-[11px] font-medium">Chat</p>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-3 text-center">
          <Ticket className="size-5 text-warning" />
          <p className="text-[11px] font-medium">Raise ticket</p>
        </Card>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search FAQs"
          className="h-11 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary" />
      </div>

      <MSection title="FAQs" />
      <Card className="mb-4 divide-y">
        {list.map((f, i) => (
          <div key={i}>
            <button onClick={()=>setOpen(open===i?null:i)} className="flex w-full items-center gap-2 p-3 text-left">
              <span className="flex-1 text-sm font-medium">{f.q}</span>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open===i?"rotate-180":""}`} />
            </button>
            {open === i && <p className="border-t bg-muted/40 p-3 text-xs text-muted-foreground">{f.a}</p>}
          </div>
        ))}
      </Card>

      <MSection title="Video tutorials" />
      <div className="mb-4 grid grid-cols-2 gap-2">
        {["Getting started","Recording a collection","End-of-day handover","Handling offline"].map((t)=>(
          <Card key={t} className="p-3">
            <div className="mb-2 grid h-20 place-items-center rounded-lg bg-muted"><PlayCircle className="size-8 text-primary" /></div>
            <p className="text-xs font-medium">{t}</p>
            <p className="text-[10px] text-muted-foreground">2–4 min</p>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full"><BookOpen className="mr-1 size-4" /> Open user guide</Button>
    </FieldShell>
  );
}
