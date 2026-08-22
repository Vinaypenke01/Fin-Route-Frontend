import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Wallet, Calculator, Receipt, FileBarChart,
  Bell, User, Settings, Sparkles, LogOut, Layers,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar
} from "@/components/ui/sidebar";

import { useAuth } from "@/hooks/use-auth";

const nav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, exact: true, tour: "sidebar-dashboard" },
  { title: "Daily Sheet", url: "/app/daily-sheet", icon: Layers, tour: "sidebar-daily-sheet" },
  { title: "Customers", url: "/app/customers", icon: Users, tour: "sidebar-customers" },
  { title: "Collections", url: "/app/collections", icon: Wallet, tour: "sidebar-collections" },
  { title: "Loan Calculator", url: "/app/calculator", icon: Calculator },
  { title: "Expenses", url: "/app/expenses", icon: Receipt },
  { title: "Reports", url: "/app/reports", icon: FileBarChart },
  { title: "Notifications", url: "/app/notifications", icon: Bell },
];
const more = [
  { title: "Profile", url: "/app/profile", icon: User },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile, isMobile } = useSidebar();
  const { logout } = useAuth();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/app" onClick={handleNavClick} className="flex items-center gap-2 px-2 py-1.5">
          <img src="/logo-removebg-preview (1).png" alt="FinRoute" className="size-8 object-contain" />
          <span className="truncate font-display text-base font-bold">FinRoute</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Guest Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title} data-tour={item.tour}>
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
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {more.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} onClick={handleNavClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/app/upgrade"} tooltip="Upgrade">
                  <Link to="/app/upgrade" onClick={handleNavClick}>
                    <Sparkles />
                    <span>Upgrade</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              onClick={() => {
                handleNavClick();
                logout();
              }}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
