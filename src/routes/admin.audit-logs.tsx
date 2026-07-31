import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BellRing, ShieldCheck } from "lucide-react";
import { adminService, AuditLogItem } from "@/lib/services/admin-service";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Admin" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await adminService.getAuditLogs();
        setLogs(res || []);
      } catch (err) {
        console.error("Audit log fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      !q ||
      l.user_name?.toLowerCase().includes(q.toLowerCase()) ||
      l.action?.toLowerCase().includes(q.toLowerCase()) ||
      l.target_model?.toLowerCase().includes(q.toLowerCase()) ||
      l.description?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">System Audit Trail & Security</h2>
          <p className="text-sm text-muted-foreground">Immutable security audit logs and system broadcast alerts.</p>
        </div>
        <BroadcastModal open={isBroadcastOpen} setOpen={setIsBroadcastOpen} />
      </div>

      <Card>
        <div className="p-4 border-b flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search user, action, target model, or description…"
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700">
            <ShieldCheck className="size-3.5 mr-1" /> Log Interceptor Active
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor / User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Model</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  Loading audit logs from backend...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No audit log records matching your query. All administrative actions will be logged here.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs font-mono">{l.created_at ? l.created_at.split("T")[0] : "-"}</TableCell>
                  <TableCell className="font-semibold">{l.user_name || "System"}</TableCell>
                  <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{l.target_model}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.ip_address || "127.0.0.1"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.description}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function BroadcastModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await adminService.broadcastNotification({
        title,
        message,
        notification_type: type,
      });
      setSuccess("Platform alert broadcast queued successfully.");
      setTitle("");
      setMessage("");
      setTimeout(() => setOpen(false), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to broadcast alert.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><BellRing className="size-4 mr-1" /> Broadcast Alert</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Broadcast System Alert</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md">
              {success}
            </div>
          )}
          <div>
            <label className="text-xs font-medium">Alert Title</label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Scheduled System Maintenance" />
          </div>
          <div>
            <label className="text-xs font-medium">Alert Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="warning">Warning Alert</SelectItem>
                <SelectItem value="upgrade">Feature Upgrade</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">Message Body</label>
            <Textarea className="mt-1" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Message displayed to all workspace owners..." />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Broadcasting..." : "Broadcast to All Tenants"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
