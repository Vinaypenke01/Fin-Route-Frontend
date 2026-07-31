import { createFileRoute } from "@tanstack/react-router";
import { Bell, Search, MessageSquare, Wallet, Clock, ClipboardCheck, Receipt, Megaphone } from "lucide-react";
import { useMemo, useState } from "react";
import { FieldShell } from "@/components/field/field-shell";
import { MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { fieldNotifications, announcements } from "@/lib/field-data";

export const Route = createFileRoute("/field/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · FinRoute Field" },
      { name: "description", content: "Alerts, messages, reminders and announcements for the collector." },
      { property: "og:title", content: "Notifications — FinRoute Field" },
      { property: "og:description", content: "Everything the office wants you to know today." },
    ],
  }),
  component: Notifications,
});

const iconMap: Record<string, React.ReactNode> = {
  due: <Bell className="size-4" />, message: <MessageSquare className="size-4" />,
  loan: <Wallet className="size-4" />, reminder: <Clock className="size-4" />,
  attendance: <ClipboardCheck className="size-4" />, expense: <Receipt className="size-4" />,
  announcement: <Megaphone className="size-4" />,
};

function Notifications() {
  const [q, setQ] = useState("");
  const list = useMemo(() => fieldNotifications.filter((n) => !q || n.title.toLowerCase().includes(q.toLowerCase()) || n.desc.toLowerCase().includes(q.toLowerCase())), [q]);
  const unread = list.filter((n) => n.unread);
  const earlier = list.filter((n) => !n.unread);

  return (
    <FieldShell title="Notifications" subtitle={`${unread.length} unread`}>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search notifications"
          className="h-11 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary" />
      </div>

      {unread.length > 0 && <MSection title="Unread" action={<button className="text-xs font-medium text-primary">Mark all read</button>} />}
      <Card className="mb-4 divide-y">
        {unread.map((n) => (
          <div key={n.id} className="flex items-start gap-3 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">{iconMap[n.type]}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{n.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.desc}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</p>
            </div>
            <span className="mt-1.5 size-2 rounded-full bg-primary" />
          </div>
        ))}
      </Card>

      <MSection title="Earlier" />
      <Card className="mb-4 divide-y">
        {earlier.slice(0, 20).map((n) => (
          <div key={n.id} className="flex items-start gap-3 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">{iconMap[n.type]}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{n.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.desc}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</p>
            </div>
          </div>
        ))}
      </Card>

      <MSection title="Announcements" />
      <Card className="divide-y">
        {announcements.slice(0, 6).map((a) => (
          <div key={a.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{a.title}</p>
              {!a.read && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">New</span>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{a.by} · {a.date}</p>
            <p className="mt-1 text-xs">{a.body}</p>
          </div>
        ))}
      </Card>
    </FieldShell>
  );
}
