import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet, Laptop, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { authService, UserSessionItem } from "@/lib/services/auth-service";

const deviceIcon = (d: string) =>
  /iphone|android|pixel/i.test(d) ? Smartphone : /ipad|tablet/i.test(d) ? Tablet : /mac|windows/i.test(d) ? Laptop : Monitor;

interface DevicesSectionProps {
  mode?: "devices" | "sessions";
}

export function DevicesSection({ mode = "devices" }: DevicesSectionProps) {
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pageSize = 5;

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await authService.getSessions({
        search,
        page,
        page_size: pageSize,
      });
      setSessions(res.items);
      setTotalCount(res.count);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to fetch devices/sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [search, page]);

  const handleRevokeSession = async (sessionId: number) => {
    try {
      await authService.revokeSession(sessionId);
      setMessage({ type: "success", text: "Device session revoked successfully." });
      fetchDevices();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to revoke session." });
    }
  };

  const handleRevokeAll = async () => {
    try {
      await authService.revokeAllSessions();
      setMessage({ type: "success", text: "Signed out of all active sessions." });
      fetchDevices();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to sign out." });
    }
  };

  const title = mode === "sessions" ? "Active Login Sessions" : "Registered Devices & Hardware";
  const desc =
    mode === "sessions"
      ? "Manage active signed-in browsers and mobile sessions across all your hardware."
      : "Authorized hardware & devices linked to your account with device management permissions.";

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        {/* Header & Revoke All */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          {mode === "sessions" && sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAll}
              className="text-xs font-semibold text-destructive border-destructive/20 hover:bg-destructive/10 shrink-0"
            >
              Sign out of all sessions
            </Button>
          )}
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search device name, browser, or IP..."
            className="pl-8 h-9 text-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Items List */}
        <div className="space-y-2.5">
          {loading ? (
            <p className="text-center py-8 text-xs text-muted-foreground">Loading devices...</p>
          ) : sessions.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              No active {mode === "sessions" ? "sessions" : "devices"} found matching your search.
            </p>
          ) : (
            sessions.map((s, idx) => {
              const Icon = deviceIcon(s.device_name || s.user_agent);

              if (mode === "sessions") {
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                    <span className="grid size-10 place-items-center rounded-md bg-muted">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        {s.device_name || s.device_type || "Web Session"}
                        {idx === 0 && page === 1 && <Badge variant="secondary" className="text-[10px]">Current Session</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-md">
                        {s.ip_address || "Localhost"} · {s.user_agent ? s.user_agent.substring(0, 50) + "..." : "Web Browser"}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Last active: {new Date(s.last_activity_at).toLocaleDateString("en-IN")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeSession(s.id)}
                      aria-label="Revoke device"
                      title="Remove/Revoke device"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                );
              }

              return (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="size-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{s.device_name || s.device_type || "Authorized Device"}</div>
                      <div className="text-xs text-muted-foreground truncate">IP: {s.ip_address || "127.0.0.1"} · Last used {new Date(s.last_activity_at).toLocaleDateString("en-IN")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">Trusted</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(s.id)}
                      className="text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      Remove Device
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              Showing page <span className="font-bold text-foreground">{page}</span> of{" "}
              <span className="font-bold text-foreground">{totalPages}</span> ({totalCount} total devices)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 text-xs gap-1"
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
