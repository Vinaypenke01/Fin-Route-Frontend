import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Receipt, Search } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MChip, Avatar, MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { fieldCollections, inr } from "@/lib/field-data";

export const Route = createFileRoute("/field/collections/")({
  head: () => ({
    meta: [
      { title: "Collections · FinRoute Field" },
      { name: "description", content: "Timeline of collections with amount, payment mode and receipt numbers." },
      { property: "og:title", content: "Collections timeline — FinRoute Field" },
      { property: "og:description", content: "Recent collections with filters and receipts." },
    ],
  }),
  component: CollectionsList,
});

const tabs = ["All", "Paid", "Partial", "Skipped", "Pending"] as const;

function CollectionsList() {
  const [q, setQ] = useState("");
  const [t, setT] = useState<(typeof tabs)[number]>("All");
  const list = useMemo(() => fieldCollections.filter((c) => {
    if (t !== "All" && c.status !== t) return false;
    if (q && !c.customerName.toLowerCase().includes(q.toLowerCase()) && !c.receipt.includes(q)) return false;
    return true;
  }).slice(0, 100), [q, t]);

  return (
    <FieldShell title="Collections" subtitle={`${fieldCollections.length} records this cycle`}
      action={<Link to="/field/collections/new" className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="size-4" /></Link>}>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or receipt"
          className="h-11 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary" />
      </div>
      <div className="mb-3 -mx-3 flex gap-2 overflow-x-auto px-3">
        {tabs.map((x) => (
          <button key={x} onClick={() => setT(x)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${t === x ? "border-primary bg-primary text-primary-foreground" : ""}`}>{x}</button>
        ))}
      </div>

      <MSection title="Recent" />
      <Card className="divide-y">
        {list.map((c) => (
          <Link key={c.id} to="/field/customers/$id" params={{ id: c.customerId }} className="flex items-center gap-3 p-3 hover:bg-muted/50">
            <Avatar name={c.customerName} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{c.customerName}</p>
                <MChip status={c.status} />
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                <Receipt className="mr-0.5 inline size-3" /> {c.receipt} · {c.mode} · {c.date}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{inr(c.collected)}</p>
              <p className="text-[10px] text-muted-foreground">of {inr(c.expected)}</p>
            </div>
          </Link>
        ))}
      </Card>
    </FieldShell>
  );
}
