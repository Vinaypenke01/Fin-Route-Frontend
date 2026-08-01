import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, CreditCard, FileText, Ticket, Sliders,
  Database, BarChart3, ScrollText, Activity, Bell, Settings, User,
  LogOut, ShieldCheck, Gauge, MessageSquare,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar
} from "@/components/ui/sidebar";

const platform = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Lender Management", url: "/admin/lenders", icon: Building2 },
  { title: "Upgrade Requests", url: "/admin/upgrade-requests", icon: ShieldCheck },
  { title: "Customer Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Guest Plan", url: "/admin/guest-plan", icon: Gauge },
  { title: "Invoices", url: "/admin/invoices", icon: FileText },
  { title: "Coupons", url: "/admin/coupons", icon: Ticket },
];
const system = [
  { title: "Platform Config", url: "/admin/configuration", icon: Sliders },
  { title: "Master Data", url: "/admin/master-data", icon: Database },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: ScrollText },
  { title: "System Health", url: "/admin/system-health", icon: Activity },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
];
const account = [
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Profile", url: "/admin/profile", icon: User },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const renderGroup = (label: string, items: typeof platform) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url, (item as { exact?: boolean }).exact)} tooltip={item.title}>
                <Link to={item.url} onClick={handleNavClick}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/admin" onClick={handleNavClick} className="flex items-center gap-2 px-2 py-1.5">
          <img src="/logo-removebg-preview (1).png" alt="FinRoute" className="size-8 object-contain" />
          <span className="truncate font-display text-base font-bold">FinRoute <span className="text-xs font-medium text-muted-foreground">Admin</span></span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Platform", platform)}
        {renderGroup("System", system)}
        {renderGroup("Account", account)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Log out">
              <Link to="/login" onClick={handleNavClick}>
                <LogOut />
                <span>Log out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
