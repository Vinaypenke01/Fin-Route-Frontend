import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, EmptyState, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { employees, payroll, erpRoutes, inr } from "@/lib/erp-data";
import { ArrowLeft, Phone, Mail, MapPin, FileText, KeyRound, ArrowUpCircle, UserX } from "lucide-react";

export const Route = createFileRoute("/erp/employees/$id")({
  head: () => ({ meta: [{ title: "Employee Profile — FinRoute ERP" }, { name: "description", content: "Attendance, performance, salary and assignments." }] }),
  component: EmployeeDetail,
});

function initials(n: string) { return n.split(" ").map((p) => p[0]).slice(0, 2).join(""); }

function EmployeeDetail() {
  const { id } = Route.useParams();
  const emp = employees.find((e) => e.id === id);
  if (!emp) return <EmptyState title="Employee not found" action={<Button asChild><Link to="/erp/employees">Back</Link></Button>} />;
  const pay = payroll.find((p) => p.employeeId === emp.id);
  const routes = erpRoutes.filter((r) => r.collectorId === emp.id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/erp/employees"><ArrowLeft className="size-4" /> Back</Link></Button>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-14"><AvatarFallback>{initials(emp.name)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{emp.name}</p>
              <p className="truncate text-xs text-muted-foreground">{emp.id} · {emp.role}</p>
              <div className="mt-1 flex gap-1"><StatusChip status={emp.status} />{emp.role === "Collector" && <StatusChip status={emp.gps} />}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> {emp.phone}</p>
            <p className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {emp.email}</p>
            <p className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /> {emp.area}</p>
            <p className="flex items-center gap-2"><FileText className="size-3.5 text-muted-foreground" /> Joined {emp.joined}</p>
            <p className="text-xs text-muted-foreground">Emergency: {emp.emergencyContact}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline"><KeyRound className="size-3.5" /> Reset pw</Button>
            <Button size="sm" variant="outline"><ArrowUpCircle className="size-3.5" /> Promote</Button>
            <Button size="sm" variant="outline">Transfer</Button>
            <Button size="sm" variant="destructive"><UserX className="size-3.5" /> Deactivate</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <KpiCard label="Attendance" value={`${emp.attendance}%`} tone="positive" />
            <KpiCard label="Performance" value={`${emp.performance}%`} tone="info" />
            <KpiCard label="Base salary" value={inr(emp.salary)} />
            <KpiCard label="Net pay" value={inr(pay?.net ?? emp.salary)} tone="positive" />
          </div>

          <Card className="p-5">
            <Tabs defaultValue="attendance">
              <TabsList className="flex-wrap">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="leaves">Leaves</TabsTrigger>
                <TabsTrigger value="salary">Salary</TabsTrigger>
                <TabsTrigger value="routes">Routes</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="attendance" className="mt-4">
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const on = (i * 7) % 11 !== 0;
                    return (
                      <div key={i} className={`grid h-10 place-items-center rounded ${on ? "bg-success/20 text-success" : "bg-destructive/15 text-destructive"}`}>
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Green = present · Red = absent · Last 28 days</p>
              </TabsContent>

              <TabsContent value="leaves" className="mt-4 space-y-2">
                {[
                  { d: "12–14 Sep", t: "Casual leave", s: "Approved" },
                  { d: "02 Aug", t: "Sick leave", s: "Approved" },
                  { d: "22 Jul", t: "Casual leave", s: "Rejected" },
                ].map((l, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                    <div><p className="text-sm font-semibold">{l.t}</p><p className="text-xs text-muted-foreground">{l.d}</p></div>
                    <StatusChip status={l.s} />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="salary" className="mt-4">
                {pay ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ["Base", pay.base], ["Overtime", pay.overtime], ["Bonus", pay.bonus],
                      ["Incentive", pay.incentive], ["Deductions", -pay.deductions], ["Net", pay.net],
                    ].map(([k, v]) => (
                      <div key={k as string} className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">{k}</p>
                        <p className="font-display text-base font-bold">{inr(v as number)}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No payroll record.</p>}
              </TabsContent>

              <TabsContent value="routes" className="mt-4 space-y-2">
                {routes.length === 0 && <p className="text-sm text-muted-foreground">No routes assigned.</p>}
                {routes.map((r) => (
                  <Link key={r.id} to="/erp/routes/$id" params={{ id: r.id }} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                    <div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.customers} cust · {r.distanceKm} km</p></div>
                    <StatusChip status={r.status} />
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="documents" className="mt-4 grid gap-2 sm:grid-cols-2">
                {["Aadhaar","PAN","Address Proof","Offer Letter","Bank Details"].map((d) => (
                  <div key={d} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <FileText className="size-4 text-primary" />
                    <p className="flex-1 text-sm font-medium">{d}</p>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
