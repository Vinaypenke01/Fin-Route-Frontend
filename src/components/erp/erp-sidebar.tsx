import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building, MapPin, Route as RouteIcon, Users, Landmark,
  Wallet, UsersRound, Coins, Receipt, BadgeIndianRupee, FileBarChart,
  LineChart, Bell, Sparkles, Settings, User, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const operations = [
  { title: "Dashboard", url: "/erp", icon: LayoutDashboard, exact: true },
  { title: "Business Profile", url: "/erp/business", icon: Building },
  { title: "Areas", url: "/erp/areas", icon: MapPin },
  { title: "Routes", url: "/erp/routes", icon: RouteIcon },
  { title: "Customers", url: "/erp/customers", icon: Users },
  { title: "Loans", url: "/erp/loans", icon: Landmark },
  { title: "Collections", url: "/erp/collections", icon: Wallet },
];
const finance = [
  { title: "Cash Reconciliation", url: "/erp/reconciliation", icon: Coins },
  { title: "Expenses", url: "/erp/expenses", icon: Receipt },
  { title: "Salary / Payroll", url: "/erp/salary", icon: BadgeIndianRupee },
];
const people = [
  { title: "Employees", url: "/erp/employees", icon: UsersRound },
];
const insights = [
  { title: "Reports", url: "/erp/reports", icon: FileBarChart },
  { title: "Analytics", url: "/erp/analytics", icon: LineChart },
  { title: "Notifications", url: "/erp/notifications", icon: Bell },
];
const account = [
  { title: "Subscription", url: "/erp/subscription", icon: Sparkles },
  { title: "Settings", url: "/erp/settings", icon: Settings },
  { title: "Profile", url: "/erp/profile", icon: User },
];

export function ErpSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const group = (label: string, items: typeof operations) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url, (item as { exact?: boolean }).exact)} tooltip={item.title}>
                <Link to={item.url}>
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
        <Link to="/erp" className="flex items-center gap-2 px-2 py-1.5">
          <img src="/logo-removebg-preview (1).png" alt="FinRoute" className="size-8 object-contain" />
          <span className="truncate font-display text-base font-bold">FinRoute <span className="text-xs font-medium text-muted-foreground">ERP</span></span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {group("Operations", operations)}
        {group("Finance", finance)}
        {group("People", people)}
        {group("Insights", insights)}
        {group("Account", account)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Log out">
              <Link to="/login">
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
