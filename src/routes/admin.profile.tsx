import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Monitor, Smartphone, Tablet, Laptop, MapPin, Trash2 } from "lucide-react";
import { activeSessions, auditLogs } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin" }] }),
  component: ProfilePage,
});

const deviceIcon = (d: string) =>
  /iphone|android|pixel/i.test(d) ? Smartphone : /ipad|tablet/i.test(d) ? Tablet : /mac|windows/i.test(d) ? Laptop : Monitor;

function ProfilePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <Avatar className="size-20"><AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">RM</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold">Rahul Menon</h2>
              <Badge variant="secondary">Super Admin</Badge>
            </div>
            <div className="text-sm text-muted-foreground">admin@finroute.in · +91 98765 43210</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> Bengaluru, Karnataka</div>
          </div>
          <Button variant="outline">Edit profile</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList className="flex-wrap">
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
          <TabsTrigger value="2fa">Two-Factor</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card><CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <F label="Full name" defaultValue="Rahul Menon" />
            <F label="Email" defaultValue="admin@finroute.in" />
            <div className="space-y-2"><Label>Phone</Label><PhoneInput defaultValue="9876543210" /></div>
            <F label="Role" defaultValue="Super Admin" />
            <F label="Employee ID" defaultValue="FR-ADMIN-001" />
            <F label="Joined" defaultValue="12 Jan 2023" />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="password">
          <Card><CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="space-y-2"><Label>Current password</Label><PasswordInput placeholder="••••••••" /></div>
            <div className="space-y-2"><Label>New password</Label><PasswordInput placeholder="••••••••" /></div>
            <div className="space-y-2"><Label>Confirm new password</Label><PasswordInput placeholder="••••••••" /></div>
            <div className="md:col-span-3"><Button>Update password</Button></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="2fa">
          <Card><CardHeader><CardTitle>Two-Factor Authentication</CardTitle><CardDescription>Add an extra layer of security to your account.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Row label="Authenticator App" enabled />
              <Row label="SMS OTP" />
              <Row label="Email OTP" enabled />
              <Row label="Recovery codes" enabled subtitle="8 unused codes" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card><CardContent className="space-y-3 p-4">
            {auditLogs.filter((l) => l.user === "admin@finroute.in").slice(0, 12).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="font-mono text-sm">{l.action}</div>
                  <div className="text-xs text-muted-foreground">{l.module} · {l.ip} · {l.browser}</div>
                </div>
                <span className="text-xs text-muted-foreground">{l.when}</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card><CardContent className="space-y-3 p-4">
            {activeSessions.map((s) => {
              const Icon = deviceIcon(s.device);
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                  <span className="grid size-10 place-items-center rounded-md bg-muted"><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium">{s.device} {s.active && <Badge variant="secondary">This device</Badge>}</div>
                    <div className="text-xs text-muted-foreground">{s.browser} · {s.location} · {s.ip}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.lastSeen}</span>
                  {!s.active && <Button variant="ghost" size="icon" aria-label="Revoke"><Trash2 className="size-4 text-destructive" /></Button>}
                </div>
              );
            })}
            <Button variant="outline" size="sm">Sign out of all sessions</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card><CardContent className="space-y-3 p-4">
            {activeSessions.slice(0, 5).map((s) => {
              const Icon = deviceIcon(s.device);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <Icon className="size-5 text-muted-foreground" />
                  <div className="flex-1"><div className="font-medium">{s.device}</div><div className="text-xs text-muted-foreground">Last used {s.lastSeen}</div></div>
                  <Badge variant="outline">Trusted</Badge>
                </div>
              );
            })}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card><CardContent className="space-y-3 p-4">
            <Row label="Digest emails" enabled subtitle="Weekly product & security digest" />
            <Row label="Beta features" subtitle="Try experimental modules before release" />
            <Row label="Sound effects" enabled />
            <Row label="Show tooltips on hover" enabled />
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function F({ label, defaultValue, type = "text" }: { label: string; defaultValue?: string; type?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} defaultValue={defaultValue} /></div>;
}
function Row({ label, enabled, subtitle }: { label: string; enabled?: boolean; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
      <div><div className="font-medium">{label}</div>{subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}</div>
      <Switch defaultChecked={enabled} />
    </div>
  );
}
