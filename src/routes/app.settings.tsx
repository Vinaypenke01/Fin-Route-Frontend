import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — FinRoute" }, { name: "description", content: "Configure your workspace." }] }),
  component: SettingsPage,
});

function Row({ title, desc, control }: { title: string; desc?: string; control: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="font-display text-base font-semibold">General</h3>
        <div className="mt-2 divide-y divide-border">
          <Row title="Language" desc="Change the app language" control={
            <Select defaultValue="en"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">हिन्दी</SelectItem></SelectContent></Select>
          } />
          <Row title="Theme" desc="Light, dark or system" control={
            <Select defaultValue="system"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent></Select>
          } />
          <Row title="Compact mode" desc="Denser tables and lists" control={<Switch />} />
          <Row title="Weekly digest" desc="Receive a Monday morning summary" control={<Switch defaultChecked />} />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-base font-semibold">Notifications</h3>
        <div className="mt-2 divide-y divide-border">
          <Row title="Collection reminders" control={<Switch defaultChecked />} />
          <Row title="Overdue alerts" control={<Switch defaultChecked />} />
          <Row title="Expense limit warnings" control={<Switch defaultChecked />} />
          <Row title="Product news & tips" control={<Switch />} />
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <h3 className="font-display text-base font-semibold">Backup & Data</h3>
        <div className="mt-2 divide-y divide-border">
          <Row title="Automatic backup" desc="Local backup every 24 hours" control={<Switch defaultChecked />} />
          <Row title="Export data" desc="Download all customers, collections and expenses" control={<Button variant="outline" size="sm"><Download className="size-4" /> Export</Button>} />
          <Row title="Delete workspace" desc="Permanently remove all data — this cannot be undone" control={<Button variant="destructive" size="sm">Delete</Button>} />
        </div>
      </Card>
    </div>
  );
}
