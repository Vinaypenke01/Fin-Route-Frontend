import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/erp/erp-ui";
import { Save, Plus, Download, Database } from "lucide-react";

export const Route = createFileRoute("/erp/settings")({
  head: () => ({ meta: [{ title: "Settings — FinRoute ERP" }, { name: "description", content: "Business, collections, interest, penalty, roles and integrations." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" description="Business, collections, interest, penalty, permissions and integrations" action={<Button size="sm"><Save className="size-4" /> Save</Button>} />

      <Card className="p-5">
        <Tabs defaultValue="collections">
          <TabsList className="flex-wrap">
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="interest">Interest</TabsTrigger>
            <TabsTrigger value="penalty">Penalty</TabsTrigger>
            <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="collections" className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Default frequency" v="Daily" />
            <Field label="Grace days" v="3" />
            <Field label="Late fee (₹)" v="50" />
            <Field label="Working hours" v="09:00 – 19:00" />
            <Toggle label="Require GPS check-in" on />
            <Toggle label="Require photo receipt" />
            <Toggle label="Auto-lock past days" on />
            <Toggle label="Allow partial payments" on />
          </TabsContent>

          <TabsContent value="interest" className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Interest model" v="Simple Interest" />
            <Field label="Default interest %" v="24" />
            <Field label="Min loan (₹)" v="5,000" />
            <Field label="Max loan (₹)" v="500,000" />
          </TabsContent>

          <TabsContent value="penalty" className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Penalty %" v="2" />
            <Field label="Compounding" v="Weekly" />
            <Toggle label="Waive on first offence" on />
            <Toggle label="Cap penalty at 25% of EMI" on />
          </TabsContent>

          <TabsContent value="roles" className="mt-4 space-y-3">
            {[
              { r: "Owner", p: "All permissions" },
              { r: "Manager", p: "Approve loans, view reports, manage employees" },
              { r: "Accountant", p: "Manage cash, expenses, invoices" },
              { r: "Collector", p: "Record collections, view assigned routes" },
              { r: "Support", p: "Read-only + notifications" },
            ].map((x) => (
              <div key={x.r} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                <div><p className="font-semibold">{x.r}</p><p className="text-xs text-muted-foreground">{x.p}</p></div>
                <Button size="sm" variant="ghost">Edit</Button>
              </div>
            ))}
            <Button variant="outline" size="sm"><Plus className="size-4" /> New role</Button>
          </TabsContent>

          <TabsContent value="preferences" className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Language" v="English (India)" />
            <Field label="Currency" v="INR (₹)" />
            <Field label="Timezone" v="Asia/Kolkata" />
            <Field label="Date format" v="DD/MM/YYYY" />
            <Toggle label="Dark mode by default" />
            <Toggle label="Enable weekly digest" on />
          </TabsContent>

          <TabsContent value="data" className="mt-4 grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><p className="font-semibold">Export data</p><p className="mt-1 text-xs text-muted-foreground">Download CSV / Excel</p><Button variant="outline" size="sm" className="mt-3"><Download className="size-4" /> Export</Button></Card>
            <Card className="p-4"><p className="font-semibold">Backup</p><p className="mt-1 text-xs text-muted-foreground">Scheduled daily · last 24h ago</p><Button variant="outline" size="sm" className="mt-3"><Database className="size-4" /> Backup now</Button></Card>
            <Card className="p-4"><p className="font-semibold">Import</p><p className="mt-1 text-xs text-muted-foreground">CSV / Excel with mapping</p><Button variant="outline" size="sm" className="mt-3">Import</Button></Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { n: "WhatsApp", d: "Send receipts and reminders", on: true },
              { n: "SMS Gateway", d: "MSG91 / Twilio", on: true },
              { n: "Razorpay", d: "UPI collections", on: false },
              { n: "Tally", d: "Book-keeping sync", on: false },
              { n: "Google Maps", d: "Route optimisation", on: true },
              { n: "Zoho Books", d: "Accounting", on: false },
            ].map((x) => (
              <div key={x.n} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                <div><p className="font-semibold">{x.n}</p><p className="text-xs text-muted-foreground">{x.d}</p></div>
                <Badge variant={x.on ? "default" : "secondary"}>{x.on ? "Connected" : "Off"}</Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function Field({ label, v }: { label: string; v: string }) {
  return <div><Label className="text-xs">{label}</Label><Input className="mt-1.5" defaultValue={v} /></div>;
}
function Toggle({ label, on }: { label: string; on?: boolean }) {
  return <div className="flex items-center justify-between rounded-xl border border-border p-3"><Label className="text-sm">{label}</Label><Switch defaultChecked={on} /></div>;
}
