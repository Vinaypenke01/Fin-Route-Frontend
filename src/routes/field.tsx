import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-guards";

export const Route = createFileRoute("/field")({
  head: () => ({
    meta: [
      { title: "FinRoute Field · Collector App" },
      { name: "description", content: "Mobile-first field collector app for daily route, collections, attendance and cash handover." },
      { property: "og:title", content: "FinRoute Field — Collector Mobile App" },
      { property: "og:description", content: "Everything a field collector needs on the go — routes, customers, collections, attendance, expenses." },
    ],
  }),
  beforeLoad: () => requireRole("employee", "/login"),
  component: () => <Outlet />,
});
