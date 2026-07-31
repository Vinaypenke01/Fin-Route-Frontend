import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Bell, Mail, MessageSquare, Send, Plus, Calendar, FileText } from "lucide-react";
import { notifications, notificationTemplates } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Admin" }] }),
  component: NotificationsPage,
});

const statusTone: Record<string, string> = {
  Sent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Scheduled: "bg-primary/10 text-primary border-primary/30",
  Draft: "bg-muted text-muted-foreground border-border",
  Failed: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
};
const channelIcon: Record<string, typeof Mail> = { Email: Mail, SMS: MessageSquare, Push: Bell, "In-app": Bell };

function NotificationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Notification Center</h2>
          <p className="text-sm text-muted-foreground">Announcements, campaigns, and delivery reports</p>
        </div>
        <ComposeSheet />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Sent (30d)", value: notifications.filter((n) => n.status === "Sent").length },
          { label: "Scheduled", value: notifications.filter((n) => n.status === "Scheduled").length },
          { label: "Drafts", value: notifications.filter((n) => n.status === "Draft").length },
          { label: "Avg. delivery", value: Math.round(notifications.reduce((s, n) => s + n.deliveryRate, 0) / notifications.length) + "%" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">{s.value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="scheduled"><Calendar className="mr-1 size-4" /> Scheduled</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="mr-1 size-4" /> Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <NotificationTable rows={notifications.slice(0, 30)} />
        </TabsContent>
        <TabsContent value="announcements"><NotificationTable rows={notifications.filter((n) => n.channel === "In-app").slice(0, 20)} /></TabsContent>
        <TabsContent value="push"><NotificationTable rows={notifications.filter((n) => n.channel === "Push").slice(0, 20)} /></TabsContent>
        <TabsContent value="email"><NotificationTable rows={notifications.filter((n) => n.channel === "Email").slice(0, 20)} /></TabsContent>
        <TabsContent value="sms"><NotificationTable rows={notifications.filter((n) => n.channel === "SMS").slice(0, 20)} /></TabsContent>
        <TabsContent value="scheduled"><NotificationTable rows={notifications.filter((n) => n.status === "Scheduled").slice(0, 20)} /></TabsContent>
        <TabsContent value="templates">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notificationTemplates.map((t) => (
              <Card key={t}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{t}</CardTitle><CardDescription>Editable email + SMS variants</CardDescription></CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="outline">v1.2</Badge>
                  <Button variant="ghost" size="sm">Edit</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationTable({ rows }: { rows: typeof notifications }) {
  return (
    <Card>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-right">Delivery</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((n) => {
              const Icon = channelIcon[n.channel] ?? Bell;
              return (
                <TableRow key={n.id}>
                  <TableCell className="max-w-sm"><div className="truncate font-medium">{n.title}</div></TableCell>
                  <TableCell><span className="inline-flex items-center gap-1.5 text-sm"><Icon className="size-4 text-muted-foreground" /> {n.channel}</span></TableCell>
                  <TableCell className="text-sm">{n.audience}</TableCell>
                  <TableCell><Badge variant="outline" className={statusTone[n.status]}>{n.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{n.sentAt}</TableCell>
                  <TableCell className="text-right tabular-nums">{n.deliveryRate}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-2 p-3 md:hidden">
        {rows.map((n) => (
          <div key={n.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium">{n.title}</div>
              <Badge variant="outline" className={statusTone[n.status]}>{n.status}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{n.channel} · {n.audience} · {n.sentAt}</div>
            <div className="mt-1 text-xs">Delivery <span className="font-medium text-foreground">{n.deliveryRate}%</span></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ComposeSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button size="sm"><Plus className="size-4" /> New Notification</Button></SheetTrigger>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>Compose Notification</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2"><Label>Channel</Label>
            <Select defaultValue="Email"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="Push">Push</SelectItem>
                <SelectItem value="In-app">In-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Audience</Label>
            <Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All lenders</SelectItem>
                <SelectItem value="enterprise">Enterprise plan</SelectItem>
                <SelectItem value="trial">Trial accounts</SelectItem>
                <SelectItem value="admin">Admin only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Subject</Label><Input placeholder="Platform maintenance scheduled" /></div>
          <div className="space-y-2"><Label>Message</Label><Textarea rows={6} placeholder="Write your message…" /></div>
          <div className="space-y-2"><Label>Schedule</Label><Input type="datetime-local" /></div>
        </div>
        <SheetFooter className="mt-4 flex-row gap-2">
          <Button variant="outline" className="flex-1">Save draft</Button>
          <Button className="flex-1"><Send className="size-4" /> Send</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
