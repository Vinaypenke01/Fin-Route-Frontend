import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, KpiCard, StatusChip } from "@/components/erp/erp-ui";
import { employees, inr } from "@/lib/erp-data";
import { UsersRound, Search, Plus, MapPin } from "lucide-react";

export const Route = createFileRoute("/erp/employees/")({
  head: () => ({ meta: [{ title: "Employees — FinRoute ERP" }, { name: "description", content: "Directory, attendance, performance and route allocation." }] }),
  component: EmployeesPage,
});

function initials(n: string) { return n.split(" ").map((p) => p[0]).slice(0, 2).join(""); }

function EmployeesPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const filtered = useMemo(() => employees.filter((e) =>
    (role === "all" || e.role === role) &&
    (!q || e.name.toLowerCase().includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase()))
  ), [q, role]);

  const collectors = employees.filter((e) => e.role === "Collector");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Employees"
        description={`${employees.length} people · ${collectors.length} collectors`}
        action={<Button size="sm"><Plus className="size-4" /> Add employee</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total" value={employees.length} icon={<UsersRound className="size-4" />} />
        <KpiCard label="Active" value={employees.filter((e) => e.status === "Active").length} tone="positive" />
        <KpiCard label="On leave" value={employees.filter((e) => e.status === "On Leave").length} tone="warning" />
        <KpiCard label="On field" value={employees.filter((e) => e.gps === "Online").length} tone="info" icon={<MapPin className="size-4" />} />
      </div>

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-4">
          <Card>
            <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or ID…" className="pl-9" />
              </div>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {["Collector","Manager","Accountant","Field Officer","Support"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, 30).map((e) => (
                <Card key={e.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-11"><AvatarFallback>{initials(e.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.role} · {e.area}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <StatusChip status={e.status} />
                        {e.role === "Collector" && <StatusChip status={e.gps} />}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded bg-muted/60 p-2"><p className="text-muted-foreground">Attend</p><p className="font-bold">{e.attendance}%</p></div>
                    <div className="rounded bg-muted/60 p-2"><p className="text-muted-foreground">Perf</p><p className="font-bold">{e.performance}%</p></div>
                    <div className="rounded bg-muted/60 p-2"><p className="text-muted-foreground">Salary</p><p className="font-bold">{inr(e.salary)}</p></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/erp/employees/$id" params={{ id: e.id }}>Profile</Link></Button>
                    <Button size="sm" variant="ghost">Assign</Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card className="p-5">
            <ul className="divide-y divide-border">
              {employees.slice(0, 20).map((e) => (
                <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.role} · {e.area}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.attendance > 90 ? "default" : "secondary"}>{e.attendance}%</Badge>
                    <StatusChip status={e.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
