import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-guards";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, User, Settings, LogOut, Sun, Moon, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/use-theme";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — FinRoute" },
      { name: "description", content: "Enterprise admin console for the FinRoute SaaS platform." },
      { property: "og:title", content: "FinRoute Super Admin Console" },
      { property: "og:description", content: "Manage lenders, subscriptions, billing, and platform health." },
    ],
  }),
  beforeLoad: () => requireRole("admin", "/login"),
  component: AdminLayout,
});

const crumbMap: Record<string, string> = {
  admin: "Admin",
  lenders: "Lender Management",
  subscriptions: "Subscriptions",
  invoices: "Invoices",
  coupons: "Coupons",
  configuration: "Platform Configuration",
  "master-data": "Master Data",
  reports: "Reports",
  "audit-logs": "Audit Logs",
  "system-health": "System Health",
  notifications: "Notifications",
  settings: "Settings",
  profile: "Profile",
};

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
            <SidebarTrigger />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
                <ShieldCheck className="size-3.5" />
              </span>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Super Admin</Badge>
            </div>
            <div className="relative ml-2 hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search lenders, invoices, users…" className="w-full pl-9" />
            </div>
            <div className="flex-1 md:hidden" />
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Notifications">
              <Link to="/admin/notifications"><Bell className="size-4" /></Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account" className="rounded-full outline-none focus:ring-2 focus:ring-ring">
                  <Avatar className="size-9"><AvatarFallback className="bg-primary text-primary-foreground text-sm">SA</AvatarFallback></Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">Super Admin</div>
                  <div className="text-xs text-muted-foreground">admin@finroute.in</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/admin/profile"><User className="mr-2 size-4" /> Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/admin/settings"><Settings className="mr-2 size-4" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/login"><LogOut className="mr-2 size-4" /> Log out</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <div className="border-b border-border bg-background/60 px-4 py-2 sm:px-6">
            <Breadcrumb>
              <BreadcrumbList>
                {segments.map((seg, idx) => {
                  const href = "/" + segments.slice(0, idx + 1).join("/");
                  const isLast = idx === segments.length - 1;
                  const label = crumbMap[seg] ?? seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
                  return (
                    <Fragment key={href}>
                      {idx > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild><Link to={href}>{label}</Link></BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <main className="min-w-0 p-4 sm:p-6"><Outlet /></main>
          <Toaster />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
