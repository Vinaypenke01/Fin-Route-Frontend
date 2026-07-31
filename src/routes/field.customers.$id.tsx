import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Phone, MapPin, Navigation, Wallet, MessageSquare, SkipForward, FileText, User2, Calendar } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { Avatar, MChip, MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fieldCustomers, fieldCollections, inr } from "@/lib/field-data";

export const Route = createFileRoute("/field/customers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Customer ${params.id} · FinRoute Field` },
      { name: "description", content: "Customer profile with loan details, collection history and quick actions." },
      { property: "og:title", content: "Customer profile — FinRoute Field" },
      { property: "og:description", content: "Loan summary, guarantor, documents and history." },
    ],
  }),
  loader: ({ params }) => {
    const c = fieldCustomers.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { c };
  },
  component: CustomerProfile,
  notFoundComponent: () => <FieldShell title="Not found" back="/field/customers"><p className="text-sm text-muted-foreground">Customer not in your assigned list.</p></FieldShell>,
});

function CustomerProfile() {
  const { c } = Route.useLoaderData();
  const history = fieldCollections.filter((h) => h.customerId === c.id).slice(0, 8);

  return (
    <FieldShell title={c.name} subtitle={`${c.id} · ${c.area}`} back="/field/customers">
      {/* Profile card */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <Avatar name={c.name} size={64} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.occupation} · {c.city}</p>
            <div className="mt-1 flex gap-1"><MChip status={c.dueBadge} /><MChip status={c.status} /></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 border-t p-2 text-center">
          <a href={`tel:${c.phone}`} className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-muted"><Phone className="size-5 text-success" /><span className="text-[10px] font-medium">Call</span></a>
          <button className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-muted"><Navigation className="size-5 text-primary" /><span className="text-[10px] font-medium">Navigate</span></button>
          <Link to="/field/collections/new" className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-muted"><Wallet className="size-5 text-warning" /><span className="text-[10px] font-medium">Collect</span></Link>
          <button className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-muted"><SkipForward className="size-5 text-destructive" /><span className="text-[10px] font-medium">Skip</span></button>
        </div>
      </Card>

      {/* Loan summary */}
      <MSection title="Loan Summary" />
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="Loan ID" value={c.loanId} />
          <Detail label="Frequency" value={c.frequency} />
          <Detail label="Installment" value={inr(c.installment)} tone="text-primary" />
          <Detail label="Outstanding" value={inr(c.outstanding)} tone="text-warning" />
          <Detail label="Total Paid" value={inr(c.paid)} tone="text-success" />
          <Detail label="Due Date" value={c.dueDate} />
        </div>
      </Card>

      {/* Contact & address */}
      <MSection title="Contact & Address" />
      <Card className="mb-4 divide-y">
        <Row icon={<Phone className="size-4" />} label={c.phone} sub="Primary" />
        <Row icon={<MapPin className="size-4" />} label={c.address} sub={`Area: ${c.area}`} />
        <Row icon={<User2 className="size-4" />} label={c.guarantor} sub={`Guarantor · ${c.guarantorPhone}`} />
        <Row icon={<FileText className="size-4" />} label="Aadhaar" sub={c.aadhaar} />
      </Card>

      {/* Map placeholder */}
      <Card className="mb-4 h-32"
        style={{
          backgroundImage: "linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}>
        <div className="flex h-full items-center justify-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-4 text-primary" /> Location · {c.distanceKm} km away
        </div>
      </Card>

      {/* History */}
      <MSection title="Collection History" action={<Link to="/field/collections" className="text-xs font-medium text-primary">See all</Link>} />
      {history.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No collections yet.</Card>
      ) : (
        <Card className="divide-y">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3">
              <span className="grid size-9 place-items-center rounded-full bg-muted"><Calendar className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{inr(h.collected)} <span className="text-xs text-muted-foreground">via {h.mode}</span></p>
                <p className="text-xs text-muted-foreground">{h.date} · {h.receipt}</p>
              </div>
              <MChip status={h.status} />
            </div>
          ))}
        </Card>
      )}

      {/* Remarks */}
      <MSection title="Last Remark" />
      <Card className="mb-4 p-3">
        <div className="flex gap-2">
          <MessageSquare className="mt-0.5 size-4 text-muted-foreground" />
          <p className="text-sm">{c.lastRemark}</p>
        </div>
      </Card>

      <Button className="w-full" asChild><Link to="/field/collections/new">Record Collection</Link></Button>
    </FieldShell>
  );
}

function Detail({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-medium ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
function Row({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
