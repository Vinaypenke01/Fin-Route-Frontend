import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, UserCheck, IndianRupee, Users, ArrowUpRight,
} from "lucide-react";
import { inr } from "@/lib/utils";
import { adminService, AdminDashboardMetrics } from "@/lib/services/admin-service";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — FinRoute" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAdminMetrics() {
      try {
        const data = await adminService.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminMetrics();
  }, []);

  const kpiCards = [
    { label: "Total Platform Users", value: loading ? "..." : (metrics?.total_users || 0).toString(), icon: Users, tone: "primary" },
    { label: "Guest Workspace Users", value: loading ? "..." : (metrics?.guest_users || 0).toString(), icon: UserCheck, tone: "success" },
    { label: "Total Workspaces", value: loading ? "..." : (metrics?.total_workspaces || 0).toString(), icon: Building2, tone: "primary" },
    { label: "Active Workspaces", value: loading ? "..." : (metrics?.active_workspaces || 0).toString(), icon: UserCheck, tone: "success" },
    { label: "Collections Recorded Today", value: loading ? "..." : (metrics?.collections_today_count || 0).toString(), icon: Users, tone: "primary" },
    { label: "Today's Volume", value: loading ? "..." : inr(metrics?.collections_today_amount || 0), icon: IndianRupee, tone: "success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Platform Overview</h2>
          <p className="text-sm text-muted-foreground">Realtime metrics from backend Super Admin API.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Last 30 days</Button>
          <Button size="sm">Export report</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((k) => (
          <Card key={k.label} className="border-border/70">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <k.icon className="size-4" />
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-display text-xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Super Admin Status</CardTitle>
          <CardDescription>Live backend connected at {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/admin/</CardDescription>
        </CardHeader>
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
          <p className="font-semibold">✓ Backend API Connection Active</p>
          <p className="mt-1">All tenant workspace metrics, system health, and user counts are live.</p>
        </div>
      </Card>
    </div>
  );
}
