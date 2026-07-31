import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sun, Palette, Shield, Bell, CreditCard, Key, Database, ScrollText, Puzzle, Copy } from "lucide-react";
import { apiKeys } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Your personal admin preferences.</p>
      </div>

      <Tabs defaultValue="general">
        <div className="overflow-x-auto">
          <TabsList className="w-max flex-nowrap">
            <TabsTrigger value="general"><Sun className="mr-1.5 size-4" /> General</TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="mr-1.5 size-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="security"><Shield className="mr-1.5 size-4" /> Security</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-1.5 size-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="mr-1.5 size-4" /> Billing</TabsTrigger>
            <TabsTrigger value="api"><Key className="mr-1.5 size-4" /> API Keys</TabsTrigger>
            <TabsTrigger value="backup"><Database className="mr-1.5 size-4" /> Backup</TabsTrigger>
            <TabsTrigger value="logs"><ScrollText className="mr-1.5 size-4" /> Logs</TabsTrigger>
            <TabsTrigger value="integrations"><Puzzle className="mr-1.5 size-4" /> Integrations</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4">
          <Card><CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <F label="Display name" defaultValue="Rahul Menon" />
            <F label="Email" defaultValue="admin@finroute.in" />
            <F label="Timezone" defaultValue="Asia/Kolkata" />
            <F label="Language" defaultValue="English (India)" />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card><CardContent className="space-y-4 p-6">
            <div className="space-y-2"><Label>Theme</Label>
              <Select defaultValue="system"><SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent>
              </Select>
            </div>
            <Toggle label="Reduced motion" />
            <Toggle label="Compact table density" defaultChecked />
            <Toggle label="Show onboarding hints" defaultChecked />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <Card><CardContent className="space-y-3 p-6">
            <Toggle label="Two-factor authentication (Authenticator app)" defaultChecked />
            <Toggle label="Login alerts to email" defaultChecked />
            <Toggle label="Require re-auth for sensitive actions" defaultChecked />
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="mb-3 font-medium">Change password</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div><Label className="text-xs">Current</Label><Input type="password" /></div>
              <div><Label className="text-xs">New</Label><Input type="password" /></div>
              <div><Label className="text-xs">Confirm</Label><Input type="password" /></div>
            </div>
            <Button className="mt-3">Update password</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card><CardContent className="space-y-3 p-6">
            {["New lender registration","Failed payments","Security alerts","System incidents","Weekly summary","Product updates"].map((n) => (
              <div key={n} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="font-medium">{n}</div>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2"><Switch defaultChecked /> Email</label>
                  <label className="flex items-center gap-2"><Switch /> SMS</label>
                  <label className="flex items-center gap-2"><Switch defaultChecked /> Push</label>
                </div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <Card><CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-sm text-muted-foreground">Platform plan</div><div className="font-display text-xl font-bold">Enterprise — Annual</div></div>
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Active</Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3"><div className="text-xs text-muted-foreground">Next invoice</div><div className="font-medium">₹2,99,988 · 12 Mar 2027</div></div>
              <div className="rounded-md border border-border p-3"><div className="text-xs text-muted-foreground">Payment method</div><div className="font-medium">HDFC •••• 4482</div></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card>
            <CardHeader><CardTitle>API Keys</CardTitle><CardDescription>Personal keys for automation</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Scope</TableHead><TableHead>Last used</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{apiKeys.slice(0, 6).map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell><div className="flex items-center gap-1 font-mono text-xs">{k.key.slice(0, 14)}••••<Button variant="ghost" size="icon" aria-label="Copy"><Copy className="size-3" /></Button></div></TableCell>
                    <TableCell><Badge variant="outline">{k.scope}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{k.lastUsed}</TableCell>
                    <TableCell><Badge variant={k.status === "Active" ? "secondary" : "outline"}>{k.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <Card><CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div><div className="font-medium">Daily automatic backups</div><div className="text-xs text-muted-foreground">Last backup 3h ago · 4.2 GB</div></div>
              <Switch defaultChecked />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Download last backup</Button>
              <Button variant="outline">Trigger backup now</Button>
              <Button variant="ghost">Restore from backup</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card><CardContent className="p-6 text-sm text-muted-foreground">
            View recent admin actions in <span className="text-foreground font-medium">Audit Logs</span>.
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Slack","Microsoft Teams","Zapier","PagerDuty","Sentry","Datadog"].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div><div className="font-medium">{i}</div><div className="text-xs text-muted-foreground">Not connected</div></div>
                  <Button variant="outline" size="sm">Connect</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function F({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input defaultValue={defaultValue} /></div>;
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return <div className="flex items-center justify-between rounded-md border border-border px-3 py-2"><span className="text-sm">{label}</span><Switch defaultChecked={defaultChecked} /></div>;
}
