import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/erp/erp-ui";
import { Save, Smartphone, Laptop, Tablet, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/erp/profile")({
  head: () => ({ meta: [{ title: "Profile — FinRoute ERP" }, { name: "description", content: "Owner profile, security and activity." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Personal information, security and devices" action={<Button size="sm"><Save className="size-4" /> Save</Button>} />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-16"><AvatarFallback className="bg-primary text-primary-foreground">RS</AvatarFallback></Avatar>
            <div>
              <p className="font-display text-lg font-bold">Rajesh Sharma</p>
              <p className="text-xs text-muted-foreground">Owner · Sharma Finance</p>
              <Badge variant="secondary" className="mt-1"><ShieldCheck className="mr-1 size-3" /> 2FA on</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">Change photo</Button>
        </Card>

        <Card className="p-5">
          <Tabs defaultValue="personal">
            <TabsList className="flex-wrap">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" v="Rajesh Sharma" />
              <Field label="Email" v="rajesh@sharmafinance.in" />
              <Field label="Phone" v="+91 98450 12345" />
              <Field label="Role" v="Owner" />
              <Field label="Date of birth" v="1980-04-12" />
              <Field label="Address" v="42 MG Road, Bengaluru" />
            </TabsContent>

            <TabsContent value="security" className="mt-4 space-y-3">
              <Card className="p-4">
                <p className="font-semibold">Password</p>
                <p className="text-xs text-muted-foreground">Last changed 42 days ago</p>
                <Button variant="outline" size="sm" className="mt-3">Change password</Button>
              </Card>
              <Card className="p-4">
                <p className="font-semibold">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Enabled via Authenticator app</p>
                <Button variant="outline" size="sm" className="mt-3">Manage 2FA</Button>
              </Card>
              <Card className="p-4">
                <p className="font-semibold">Active sessions</p>
                <p className="text-xs text-muted-foreground">3 devices signed in</p>
                <Button variant="destructive" size="sm" className="mt-3">Sign out everywhere</Button>
              </Card>
            </TabsContent>

            <TabsContent value="devices" className="mt-4 space-y-2">
              {[
                { i: Laptop, n: "MacBook Pro · Bengaluru", d: "Chrome · active now" },
                { i: Smartphone, n: "iPhone 15 · Bengaluru", d: "FinRoute App · 2h ago" },
                { i: Tablet, n: "iPad · Chennai branch", d: "Safari · 3d ago" },
              ].map((d, i) => (
                <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-muted"><d.i className="size-4" /></div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{d.n}</p><p className="truncate text-xs text-muted-foreground">{d.d}</p></div>
                  <Button size="sm" variant="ghost">Revoke</Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ol className="relative ml-3 space-y-4 border-l border-border pl-6">
                {[
                  { d: "Today · 10:20", t: "Signed in from MacBook Pro", desc: "Chrome · Bengaluru" },
                  { d: "Yesterday", t: "Approved loan LN-50241", desc: "₹75,000 · Priya Verma" },
                  { d: "3 days ago", t: "Changed password", desc: "From Settings › Security" },
                  { d: "1 week ago", t: "Ran payroll", desc: "75 employees · ₹18.2L" },
                ].map((e, i) => (
                  <li key={i}>
                    <span className="absolute -left-[7px] mt-1.5 size-3 rounded-full bg-primary" />
                    <p className="text-xs text-muted-foreground">{e.d}</p>
                    <p className="text-sm font-semibold">{e.t}</p>
                    <p className="text-xs text-muted-foreground">{e.desc}</p>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="preferences" className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Language" v="English (India)" />
              <Field label="Timezone" v="Asia/Kolkata" />
              <Field label="Date format" v="DD/MM/YYYY" />
              <Field label="Currency" v="INR (₹)" />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, v }: { label: string; v: string }) {
  return <div><Label className="text-xs">{label}</Label><Input className="mt-1.5" defaultValue={v} /></div>;
}
