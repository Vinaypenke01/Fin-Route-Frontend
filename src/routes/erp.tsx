import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-guards";
import { Fragment, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ErpSidebar } from "@/components/erp/erp-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell, Search, User, Settings, LogOut, Sun, Moon, Plus,
  Building, GitBranch, ChevronsUpDown,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt, InstallStatusBadge } from "@/components/install-prompt";
import { useTheme } from "@/hooks/use-theme";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { business } from "@/lib/erp-data";

export const Route = createFileRoute("/erp")({
  head: () => ({
    meta: [
      { title: "Lender ERP — FinRoute" },
      { name: "description", content: "Run every part of your finance business — customers, loans, collections, cash, and people — from one enterprise console." },
      { property: "og:title", content: "FinRoute Lender ERP" },
      { property: "og:description", content: "Enterprise ERP for finance businesses — customers, loans, collections, cash, and people." },
    ],
  }),
  beforeLoad: () => requireRole("lender", "/login"),
  component: ErpLayout,
});

const crumbMap: Record<string, string> = {
  erp: "ERP",
  business: "Business Profile",
  areas: "Areas",
  routes: "Routes",
  customers: "Customers",
  loans: "Loans",
  collections: "Collections",
  reconciliation: "Cash Reconciliation",
  expenses: "Expenses",
  salary: "Payroll",
  employees: "Employees",
  reports: "Reports",
  analytics: "Analytics",
  notifications: "Notifications",
  subscription: "Subscription",
  settings: "Settings",
  profile: "Profile",
};

const quickAdds = [
  { label: "Add Customer", to: "/erp/customers" },
  { label: "Create Loan", to: "/erp/loans" },
  { label: "Record Collection", to: "/erp/collections" },
  { label: "Add Expense", to: "/erp/expenses" },
  { label: "Create Route", to: "/erp/routes" },
] as const;

function ErpLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const [branch, setBranch] = useState(business.branches[0]);
  const segments = pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <ErpSidebar />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-xl sm:gap-3 sm:px-6">
            <SidebarTrigger />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden max-w-[220px] gap-2 md:inline-flex">
                  <Building className="size-3.5" />
                  <span className="truncate">{business.name}</span>
                  <ChevronsUpDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Businesses</DropdownMenuLabel>
                <DropdownMenuItem>{business.name}</DropdownMenuItem>
                <DropdownMenuItem className="text-muted-foreground">Verma Traders (demo)</DropdownMenuItem>
                <DropdownMenuItem className="text-muted-foreground">Iyer Capital (demo)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden gap-2 md:inline-flex">
                  <GitBranch className="size-3.5" />
                  <span className="truncate">{branch.name}</span>
                  <ChevronsUpDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Branches</DropdownMenuLabel>
                {business.branches.map((b) => (
                  <DropdownMenuItem key={b.id} onClick={() => setBranch(b)}>
                    {b.name} <span className="ml-auto text-xs text-muted-foreground">{b.city}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative ml-1 hidden max-w-md flex-1 lg:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search customers, loans, receipts…" className="w-full pl-9" />
            </div>
            <div className="flex-1 lg:hidden" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" /> <span className="hidden sm:inline">Quick add</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick add</DropdownMenuLabel>
                {quickAdds.map((q) => (
                  <DropdownMenuItem key={q.label} asChild>
                    <Link to={q.to}>{q.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Notifications">
              <Link to="/erp/notifications"><Bell className="size-4" /></Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account" className="rounded-full outline-none focus:ring-2 focus:ring-ring">
                  <Avatar className="size-9"><AvatarFallback className="bg-primary text-primary-foreground text-sm">RS</AvatarFallback></Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">Rajesh Sharma</div>
                  <div className="text-xs text-muted-foreground">Owner · {business.name}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/erp/profile"><User className="mr-2 size-4" /> Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/erp/settings"><Settings className="mr-2 size-4" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/login"><LogOut className="mr-2 size-4" /> Log out</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <div className="flex items-center gap-2 border-b border-border bg-background/60 px-4 py-2 sm:px-6">
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
            <Badge variant="secondary" className="ml-auto hidden text-[10px] uppercase tracking-wide sm:inline-flex">
              Lender ERP
            </Badge>
            <InstallStatusBadge className="hidden sm:inline-flex" />
          </div>

          <main className="min-w-0 p-4 sm:p-6"><Outlet /></main>
          <Toaster />
          <InstallPrompt appName="FinRoute ERP" />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
