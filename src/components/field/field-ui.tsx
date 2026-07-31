import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ============= Progress ring =============
export function ProgressCircle({
  value, size = 96, stroke = 9, label, sub, tone = "primary",
}: {
  value: number; size?: number; stroke?: number; label?: ReactNode; sub?: ReactNode;
  tone?: "primary" | "success" | "warning";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-primary";
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
          className="fill-none stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          className={cn("fill-none transition-all duration-500", color)} stroke="currentColor" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold leading-none">{label ?? `${value}%`}</span>
        {sub && <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

// ============= Mobile KPI Card =============
export function MKpi({
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
    <Card className="p-3">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground [&_svg]:size-3.5">{icon}</span>}
      </div>
      <p className={cn("mt-1 font-display text-lg font-bold leading-tight sm:text-xl", toneCls)}>{value}</p>
      {delta && <p className="mt-0.5 text-[10px] text-muted-foreground">{delta}</p>}
    </Card>
  );
}

// ============= Status Chip =============
const statusMap: Record<string, string> = {
  paid: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  partial: "bg-warning/15 text-warning border-warning/30",
  skipped: "bg-destructive/15 text-destructive border-destructive/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  done: "bg-success/15 text-success border-success/30",
  current: "bg-primary/15 text-primary border-primary/30",
  upcoming: "bg-muted text-muted-foreground border-border",
  visited: "bg-success/15 text-success border-success/30",
  present: "bg-success/15 text-success border-success/30",
  late: "bg-warning/15 text-warning border-warning/30",
  absent: "bg-destructive/15 text-destructive border-destructive/30",
  off: "bg-muted text-muted-foreground border-border",
  matched: "bg-success/15 text-success border-success/30",
  excess: "bg-primary/15 text-primary border-primary/30",
  short: "bg-destructive/15 text-destructive border-destructive/30",
  conflict: "bg-destructive/15 text-destructive border-destructive/30",
  "due today": "bg-warning/15 text-warning border-warning/30",
};
export function MChip({ status, className }: { status: string; className?: string }) {
  const k = status.toLowerCase();
  const cls = statusMap[k] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("border font-medium capitalize", cls, className)}>{status}</Badge>
  );
}

// ============= Section header (mobile) =============
export function MSection({ title, action, description }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ============= Avatar =============
export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 13) % 360;
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hue} 65% 50%), hsl(${(hue + 40) % 360} 70% 40%))`, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ============= Empty state =============
export function MEmpty({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed p-8 text-center">
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============= Skeleton =============
export function MSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

// ============= Bottom sheet =============
export function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" role="dialog">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
        {title && <h3 className="mb-3 font-display text-lg font-semibold">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
