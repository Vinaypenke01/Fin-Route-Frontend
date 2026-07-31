import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — FinRoute" }, { name: "description", content: "Reminders, alerts and updates." }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <Card className="divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <h3 className="font-display text-base font-semibold">All notifications</h3>
            <p className="text-xs text-muted-foreground">0 unread</p>
          </div>
          <Button variant="outline" size="sm">Mark all as read</Button>
        </div>
        <div className="p-8 text-center text-xs text-muted-foreground">
          <Bell className="size-8 mx-auto mb-2 opacity-50" />
          No new notifications. You're all caught up!
        </div>
      </Card>
      <Card className="h-fit p-5">
        <h4 className="font-display text-sm font-semibold">Preferences</h4>
        <p className="mt-1 text-xs text-muted-foreground">Choose what you want to hear about.</p>
        <ul className="mt-4 space-y-3 text-sm">
          {["Collection reminders", "Overdue alerts", "Expense alerts", "Weekly digest", "Product updates"].map((p) => (
            <li key={p} className="flex items-center justify-between">
              <span>{p}</span>
              <Badge variant="secondary">On</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
