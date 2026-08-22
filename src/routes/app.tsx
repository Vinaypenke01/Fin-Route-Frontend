import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-guards";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Search, Sparkles, User, Settings, LogOut, Sun, Moon, Compass } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { BrandLoader } from "@/components/ui/brand-loader";
import { OnboardingTour, useOnboarding } from "@/components/onboarding-tour";
import { InstallPrompt, InstallStatusBadge } from "@/components/install-prompt";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { UpgradeUpsellModal } from "@/components/upgrade-upsell-modal";

import { GuestMobileBottomNav } from "@/components/guest-mobile-nav";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Guest Workspace — FinRoute" }, { name: "description", content: "Your free digital collection book." }] }),
  beforeLoad: () => requireRole("guest", "/login"),
  component: AppLayout,
});

const titles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/daily-sheet": "Daily Collection Sheet",
  "/app/customers": "Customers",
  "/app/collections": "Collections",
  "/app/collections/new": "Record Collection",
  "/app/collections/batch": "Route Collection Sheet",
  "/app/calculator": "Loan Calculator",
  "/app/expenses": "Expenses",
  "/app/reports": "Reports",
  "/app/notifications": "Notifications",
  "/app/profile": "Profile",
  "/app/settings": "Settings",
  "/app/upgrade": "Upgrade",
};
function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] ?? "Workspace";
  const { theme, toggle } = useTheme();
  const tour = useOnboarding();
  const { user, workspace, logout } = useAuth();

  const displayName = user?.full_name || "Guest Lender";
  const displayBusiness = workspace?.name || "Workspace";
  const displayPlan = workspace?.plan ? workspace.plan.toUpperCase() : "GUEST";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "GL";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30 pb-20 sm:pb-0">
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
            <SidebarTrigger className="hidden sm:inline-flex" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">Guest</Badge>
                <InstallStatusBadge className="hidden sm:inline-flex" />
              </div>
            </div>
            <div className="relative hidden md:block" data-tour="header-search">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search customers, receipts…" className="w-72 pl-9" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggle}
              data-tour="header-theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Replay tour" onClick={tour.start} className="hidden sm:inline-flex">
              <Compass className="size-4" />
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex" data-tour="header-upgrade">
              <Link to="/app/upgrade"><Sparkles className="size-4" /> Upgrade</Link>
            </Button>
            <PwaInstallButton
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-bold dark:bg-emerald-950 dark:text-emerald-300"
              label="Install App"
            />
            <Button asChild variant="ghost" size="icon" aria-label="Notifications">
              <Link to="/app/notifications"><Bell className="size-4" /></Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account" className="rounded-full outline-none focus:ring-2 focus:ring-ring">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold truncate">{displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">{displayBusiness} · {displayPlan}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/app/profile"><User className="size-4" /> Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/app/settings"><Settings className="size-4" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={toggle}>
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={tour.start}><Compass className="size-4" /> Replay tour</DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/app/upgrade"><Sparkles className="size-4" /> Upgrade</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <GuestMobileBottomNav />
      <Toaster />
      <OnboardingTour open={tour.open} onClose={tour.close} />
      <InstallPrompt appName="FinRoute Guest Workspace" />
      <UpgradeUpsellModal />
    </SidebarProvider>
  );
}
