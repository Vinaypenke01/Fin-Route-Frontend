import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Phone, MapPin, Filter } from "lucide-react";
import { FieldShell, MSearch } from "@/components/field/field-shell";
import { Avatar, MChip, BottomSheet } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fieldCustomers, inr } from "@/lib/field-data";

export const Route = createFileRoute("/field/customers/")({
  head: () => ({
    meta: [
      { title: "Customers · FinRoute Field" },
      { name: "description", content: "Search and filter 200 customers assigned to you with due badges and quick actions." },
      { property: "og:title", content: "Customers — FinRoute Field" },
      { property: "og:description", content: "Assigned customers with due badges, distance and collection status." },
    ],
  }),
  component: CustomersList,
});

const filters = ["All", "Due Today", "Overdue", "Paid", "Skipped"] as const;

function CustomersList() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof filters)[number]>("All");
  const [sheet, setSheet] = useState(false);

  const list = useMemo(() => {
    return fieldCustomers.filter((c) => {
      const matches = !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q) || c.area.toLowerCase().includes(q.toLowerCase());
      if (!matches) return false;
      if (f === "Due Today") return c.dueBadge === "Due Today";
      if (f === "Overdue") return c.dueBadge === "Overdue";
      if (f === "Paid") return c.visitStatus === "visited";
      if (f === "Skipped") return c.visitStatus === "skipped";
      return true;
    });
  }, [q, f]);

  return (
    <FieldShell title="Customers" subtitle={`${list.length} of ${fieldCustomers.length} assigned`}
      action={<Button variant="ghost" size="icon" className="size-9" onClick={() => setSheet(true)}><Filter className="size-4" /></Button>}>
      <div className="mb-3"><MSearch value={q} onChange={setQ} placeholder="Search name, phone, area" /></div>
      <div className="mb-3 -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {filters.map((x) => (
          <button key={x} onClick={() => setF(x)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${f === x ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{x}</button>
        ))}
      </div>
      <div className="space-y-2">
        {list.slice(0, 60).map((c) => (
          <Link key={c.id} to="/field/customers/$id" params={{ id: c.id }}>
            <Card className="flex items-center gap-3 p-3">
              <Avatar name={c.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <MChip status={c.dueBadge} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <MapPin className="mr-0.5 inline size-3" /> {c.area} · {c.distanceKm} km
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className="font-medium">{inr(c.installment)} <span className="text-muted-foreground">EMI</span></span>
                  <span className="text-muted-foreground">O/S {inr(c.outstanding)}</span>
                </div>
              </div>
              <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="grid size-9 place-items-center rounded-full bg-success/10 text-success">
                <Phone className="size-4" />
              </a>
            </Card>
          </Link>
        ))}
      </div>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Filter customers">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Status</p>
        <div className="grid grid-cols-2 gap-2">
          {filters.map((x) => (
            <button key={x} onClick={() => { setF(x); setSheet(false); }}
              className={`rounded-xl border p-3 text-sm font-medium ${f === x ? "border-primary bg-primary/10 text-primary" : ""}`}>{x}</button>
          ))}
        </div>
      </BottomSheet>
    </FieldShell>
  );
}
