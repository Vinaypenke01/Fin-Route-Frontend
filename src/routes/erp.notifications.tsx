import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/erp/erp-ui";
import { notifications } from "@/lib/erp-data";
import { Bell, AlertTriangle, FileCheck2, Info, BadgeIndianRupee, Search, Archive, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/erp/notifications")({
  head: () => ({ meta: [{ title: "Notifications — FinRoute ERP" }, { name: "description", content: "Reminders, approvals, alerts and announcements." }] }),
  component: NotificationsPage,
});

const icon: Record<string, any> = { reminder: Bell, approval: FileCheck2, alert: AlertTriangle, info: Info, salary: BadgeIndianRupee };
const tone: Record<string, string> = {
  reminder: "text-primary bg-primary/10",
  approval: "text-warning bg-warning/10",
  alert: "text-destructive bg-destructive/10",
  info: "text-info bg-muted",
  salary: "text-success bg-success/10",
};

function NotificationsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const filtered = notifications.filter((n) =>
    (tab === "all" || (tab === "unread" && n.unread) || n.type === tab) &&
    (!q || n.title.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        description={`${notifications.filter((n) => n.unread).length} unread of ${notifications.length}`}
        action={
          <>
            <Button variant="outline" size="sm"><CheckCheck className="size-4" /> Mark all read</Button>
            <Button variant="outline" size="sm"><Archive className="size-4" /> Archive read</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <Card>
          <div className="flex items-center gap-2 border-b border-border p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications…" className="pl-9" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((n) => {
              const Icon = icon[n.type] ?? Bell;
              return (
                <div key={n.id} className={"flex items-start gap-3 p-4 " + (n.unread ? "bg-primary/5" : "")}>
                  <div className={"grid size-10 shrink-0 place-items-center rounded-xl " + (tone[n.type] ?? "bg-muted")}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      {n.unread && <span className="size-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.desc}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{n.type}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h4 className="font-display text-sm font-semibold">Filter</h4>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              ["all", "All"], ["unread", "Unread"], ["reminder", "Reminders"], ["approval", "Approvals"],
              ["alert", "Alerts"], ["salary", "Salary"], ["info", "Info"],
            ].map(([k, label]) => (
              <li key={k}>
                <button onClick={() => setTab(k)} className={"w-full rounded-md px-3 py-2 text-left " + (tab === k ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted")}>{label}</button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
