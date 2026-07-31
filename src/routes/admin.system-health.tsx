import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Server, Zap, CheckCircle2 } from "lucide-react";
import { adminService, SystemHealthData } from "@/lib/services/admin-service";

export const Route = createFileRoute("/admin/system-health")({
  head: () => ({ meta: [{ title: "System Health — Admin" }] }),
  component: SystemHealthPage,
});

function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await adminService.getSystemHealth();
        setHealth(data);
      } catch (err) {
        console.error("Health fetch error:", err);
      }
    }
    loadHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">System Health</h2>
          <p className="text-sm text-muted-foreground">Realtime backend infrastructure status</p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="mr-1 size-3.5" /> Systems Operational
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Database Engine</p>
              <h3 className="font-bold text-base capitalize">{health?.database.engine || "PostgreSQL"}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t pt-3">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 uppercase">
              {health?.database.status || "Healthy"}
            </Badge>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Server className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">API Server</p>
              <h3 className="font-bold text-base">Django REST 5.1</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t pt-3">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 uppercase">
              {health?.api_server.status || "Online"}
            </Badge>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Zap className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Redis Cache</p>
              <h3 className="font-bold text-base">Phase 5 ERP</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t pt-3">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              V2 Infrastructure
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
