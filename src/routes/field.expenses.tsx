import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Receipt, Fuel, Utensils, Car, ParkingCircle, Package, MoreHorizontal, Camera } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MSection, BottomSheet, MChip } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fieldExpenses, inr } from "@/lib/field-data";

export const Route = createFileRoute("/field/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · FinRoute Field" },
      { name: "description", content: "Log field expenses with categories, receipts and approval status." },
      { property: "og:title", content: "Expenses — FinRoute Field" },
      { property: "og:description", content: "Fuel, food, travel, parking and other field spends." },
    ],
  }),
  component: Expenses,
});

const catIcon: Record<string, React.ReactNode> = {
  Fuel: <Fuel className="size-4" />, Food: <Utensils className="size-4" />,
  Travel: <Car className="size-4" />, Parking: <ParkingCircle className="size-4" />,
  Office: <Package className="size-4" />, Other: <MoreHorizontal className="size-4" />,
};

function Expenses() {
  const [sheet, setSheet] = useState(false);
  const [cat, setCat] = useState("Fuel");
  const [amt, setAmt] = useState<number>(0);
  const [note, setNote] = useState("");

  const todayTotal = 780;
  const monthTotal = useMemo(() => fieldExpenses.reduce((a, e) => a + e.amount, 0), []);

  return (
    <FieldShell title="Expenses" subtitle={`${fieldExpenses.length} entries`} back="/field/profile"
      action={<button onClick={()=>setSheet(true)} className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="size-4" /></button>}>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Today</p>
          <p className="mt-1 font-display text-xl font-bold text-destructive">{inr(todayTotal)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">This month</p>
          <p className="mt-1 font-display text-xl font-bold">{inr(monthTotal)}</p>
        </Card>
      </div>

      <MSection title="Categories" />
      <div className="mb-4 grid grid-cols-6 gap-2 text-center">
        {Object.entries(catIcon).map(([k, v]) => (
          <div key={k} className="flex flex-col items-center gap-1">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">{v}</span>
            <span className="text-[10px]">{k}</span>
          </div>
        ))}
      </div>

      <MSection title="Recent" />
      <Card className="divide-y">
        {fieldExpenses.slice(0, 30).map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-muted">{catIcon[e.category] ?? <Receipt className="size-4" />}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.note}</p>
              <p className="text-[11px] text-muted-foreground">{e.date} · {e.mode}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{inr(e.amount)}</p>
              <MChip status={e.status.toLowerCase()} />
            </div>
          </div>
        ))}
      </Card>

      <BottomSheet open={sheet} onClose={()=>setSheet(false)} title="Add expense">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Category</p>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {Object.keys(catIcon).map((k) => (
            <button key={k} onClick={()=>setCat(k)} className={`rounded-xl border p-2 text-xs font-medium ${cat===k?"border-primary bg-primary/10 text-primary":""}`}>{k}</button>
          ))}
        </div>
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Amount</p>
        <input type="number" value={amt||""} onChange={(e)=>setAmt(Number(e.target.value))} placeholder="0"
          className="mb-3 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Note</p>
        <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="What was it for"
          className="mb-3 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
        <Button variant="outline" className="mb-3 w-full"><Camera className="mr-1 size-4" /> Attach receipt</Button>
        <Button className="w-full" onClick={()=>setSheet(false)}>Save expense</Button>
      </BottomSheet>
    </FieldShell>
  );
}
