import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  MoreHorizontal,
  Calculator,
  FileBarChart,
  Bell,
  User,
  Settings,
  Sparkles,
  LogOut,
  Sun,
  Moon,
  Compass,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Layers,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { useOnboarding } from "@/components/onboarding-tour";
import { PwaInstallButton } from "@/components/pwa-install-button";

export function GuestMobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const tour = useOnboarding();

  const isTabActive = (url: string, exact?: boolean) => {
    if (exact) return pathname === url;
    return pathname === url || pathname.startsWith(url + "/");
  };

  const mainTabs = [
    { title: "Sheet", url: "/app/daily-sheet", icon: Layers },
    { title: "Dashboard", url: "/app", icon: LayoutDashboard, exact: true },
    { title: "Customers", url: "/app/customers", icon: Users },
    { title: "Collections", url: "/app/collections", icon: Wallet },
  ];

  const moreMenuItems = [
    { title: "Loan Calculator", url: "/app/calculator", icon: Calculator, description: "Calculate principal & interest" },
    { title: "Reports & Analytics", url: "/app/reports", icon: FileBarChart, description: "Export CSVs & view ledger summaries" },
    { title: "Notifications", url: "/app/notifications", icon: Bell, description: "Alerts & workspace activity" },
    { title: "Plan Upgrade", url: "/app/upgrade", icon: Sparkles, badge: "Premium", description: "Increase weekly collection days" },
    { title: "Profile", url: "/app/profile", icon: User, description: "Personal & business details" },
    { title: "Workspace Settings", url: "/app/settings", icon: Settings, description: "Collection days & preferences" },
    { title: "FAQs & Support", url: "/faq", icon: HelpCircle, description: "Platform help & answers" },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar - Visible on Mobile (< sm) */}
      <nav aria-label="Mobile Navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/80 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        {mainTabs.map((tab) => {
          const active = isTabActive(tab.url, tab.exact);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.url}
              to={tab.url}
              className={`relative flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200 ${
                active
                  ? "text-primary font-bold scale-[1.05]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute -top-1 size-1 rounded-full bg-primary animate-pulse" />
              )}
              <div className={`p-1 rounded-lg ${active ? "bg-primary/10 text-primary" : ""}`}>
                <Icon className="size-5" />
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-[60px]">
                {tab.title}
              </span>
            </Link>
          );
        })}

        {/* 5th Tab: More Drawer Trigger */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={`relative flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200 ${
                isMoreOpen || ["/app/calculator", "/app/reports", "/app/notifications", "/app/upgrade", "/app/profile", "/app/settings"].some((path) => pathname.startsWith(path))
                  ? "text-primary font-bold scale-[1.05]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1 rounded-lg ${isMoreOpen ? "bg-primary/10 text-primary" : ""}`}>
                <MoreHorizontal className="size-5" />
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-0.5">
                More
              </span>
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-4 pb-8 pt-6">
            <SheetHeader className="pb-4 border-b border-border/60 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-base font-bold font-display flex items-center gap-2">
                    <img src="/logo-removebg-preview (1).png" alt="FinRoute" className="size-6 object-contain" />
                    FinRoute Guest App
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Digital Collection Book & Financial Management
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  Guest Workspace
                </Badge>
              </div>
            </SheetHeader>

            {/* Menu List */}
            <div className="py-4 space-y-1.5">
              {moreMenuItems.map((item) => {
                const ItemIcon = item.icon;
                const active = isTabActive(item.url);

                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      active
                        ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                        : "bg-card border-border/60 hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                        <ItemIcon className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0 font-bold uppercase">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-normal leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </div>

            {/* Quick Action Options */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <PwaInstallButton
                variant="outline"
                className="w-full h-11 bg-emerald-50 text-emerald-700 border-emerald-300 font-bold dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 justify-start px-3"
                label="Install FinRoute PWA App"
                showSubtext
              />

              <button
                type="button"
                onClick={() => { toggle(); setIsMoreOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/40 text-xs font-semibold text-foreground hover:bg-muted/80 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-600" />}
                  <span>Appearance Theme</span>
                </span>
                <span className="text-[11px] font-normal text-muted-foreground capitalize">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { tour.start(); setIsMoreOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/40 text-xs font-semibold text-foreground hover:bg-muted/80 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Compass className="size-4 text-primary" />
                  <span>Replay Feature Tour</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>

              <Link
                to="/login"
                onClick={() => setIsMoreOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="size-4" />
                  <span>Log Out</span>
                </span>
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
