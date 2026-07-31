import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home, Users, Wallet, Bell, User, Plus, ArrowLeft, Search, Sun, Moon, Wifi, WifiOff,
  MapPin, Receipt, ClipboardCheck, PhoneCall, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/install-prompt";

const tabs = [
  { to: "/field", label: "Home", icon: Home, exact: true },
  { to: "/field/customers", label: "Customers", icon: Users, exact: false },
  { to: "/field/collections", label: "Collect", icon: Wallet, exact: false },
  { to: "/field/notifications", label: "Alerts", icon: Bell, exact: true },
  { to: "/field/profile", label: "Profile", icon: User, exact: true },
] as const;

export function FieldShell({
  title, subtitle, back, action, children, hideFab, hideNav,
}: {
  title?: string; subtitle?: string; back?: string; action?: ReactNode;
  children: ReactNode; hideFab?: boolean; hideNav?: boolean;
}) {
  const { theme, toggle } = useTheme();
  const [fab, setFab] = useState(false);
  const [online, setOnline] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        {!online && (
          <div className="flex items-center justify-center gap-1.5 bg-warning/15 py-1 text-[11px] font-medium text-warning">
            <WifiOff className="size-3" /> You're offline — changes will sync when back online
          </div>
        )}
        <div className="flex h-14 items-center gap-2 px-3">
          {back ? (
            <Link to={back} className="grid size-9 place-items-center rounded-full hover:bg-muted">
              <ArrowLeft className="size-5" />
            </Link>
          ) : (
            <Link to="/field" className="flex items-center gap-1.5 font-display font-bold">
              <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Wallet className="size-4" />
              </span>
            </Link>
          )}
          <div className="min-w-0 flex-1">
            {title && <h1 className="truncate font-display text-base font-semibold leading-tight">{title}</h1>}
            {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="size-9">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className={cn("flex-1 px-3 pb-28 pt-3", hideNav && "pb-6")}>{children}</main>

      {/* FAB */}
      {!hideFab && (
        <>
          {fab && (
            <div className="fixed inset-0 z-40" onClick={() => setFab(false)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="absolute bottom-24 right-4 flex flex-col items-end gap-2">
                <FabAction to="/field/collections/new" icon={<Wallet className="size-4" />} label="Record Collection" />
                <FabAction to="/field/expenses" icon={<Receipt className="size-4" />} label="Add Expense" />
                <FabAction to="/field/today-route" icon={<MapPin className="size-4" />} label="Start Route" />
                <FabAction to="/field/attendance" icon={<ClipboardCheck className="size-4" />} label="Attendance" />
                <FabAction to="/field/customers" icon={<PhoneCall className="size-4" />} label="Call Customer" />
              </div>
            </div>
          )}
          {!hideNav && (
            <button
              onClick={() => setFab(!fab)}
              aria-label="Quick actions"
              className={cn(
                "fixed bottom-20 right-4 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform",
                fab && "rotate-45",
              )}
            >
              {fab ? <X className="size-6" /> : <Plus className="size-6" />}
            </button>
          )}
        </>
      )}

      {/* Bottom nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t bg-background/95 backdrop-blur">
          <ul className="grid grid-cols-5">
            {tabs.map((t) => {
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span className={cn("grid size-9 place-items-center rounded-2xl transition-colors", active && "bg-primary/10")}>
                      <Icon className="size-5" />
                    </span>
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <InstallPrompt appName="FinRoute Field" variant="floating" />
    </div>
  );
}

function FabAction({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium shadow-lg">
      <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">{icon}</span>
      {label}
    </Link>
  );
}

// Simple search bar used across list screens
export function MSearch({ value, onChange, placeholder = "Search" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </div>
  );
}

export function OnlineBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
      <Wifi className="size-3" /> Online
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
      <WifiOff className="size-3" /> Offline
    </span>
  );
}
