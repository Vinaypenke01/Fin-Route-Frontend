import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function KpiCard({
  label, value, delta, tone = "default", icon,
}: {
  label: string; value: ReactNode; delta?: string;
  tone?: "default" | "positive" | "warning" | "danger" | "info"; icon?: ReactNode;
}) {
  const toneCls = {
    default: "text-foreground",
    positive: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-primary",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn("mt-1.5 font-display text-2xl font-bold leading-tight", toneCls)}>{value}</p>
      {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
    </Card>
  );
}

export function ChartCard({
  title, subtitle, action, children, className,
}: {
  title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

const statusMap: Record<string, string> = {
  // loans
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  active: "bg-success/15 text-success border-success/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  closed: "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  defaulted: "bg-destructive/20 text-destructive border-destructive/40",
  // collections
  paid: "bg-success/15 text-success border-success/30",
  partial: "bg-warning/15 text-warning border-warning/30",
  skipped: "bg-destructive/15 text-destructive border-destructive/30",
  // routes / recon
  planned: "bg-muted text-muted-foreground border-border",
  "in progress": "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  delayed: "bg-warning/15 text-warning border-warning/30",
  reconciled: "bg-success/15 text-success border-success/30",
  discrepancy: "bg-destructive/15 text-destructive border-destructive/30",
  // employees
  "on leave": "bg-warning/15 text-warning border-warning/30",
  inactive: "bg-muted text-muted-foreground border-border",
  online: "bg-success/15 text-success border-success/30",
  offline: "bg-muted text-muted-foreground border-border",
  idle: "bg-warning/15 text-warning border-warning/30",
  prospect: "bg-primary/15 text-primary border-primary/30",
};

export function StatusChip({ status }: { status: string }) {
  const key = status.toLowerCase();
  const cls = statusMap[key] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("border font-medium capitalize", cls)}>
      {status}
    </Badge>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">{icon}</div>}
      <p className="font-display text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
