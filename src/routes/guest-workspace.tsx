import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GuestWorkspace, PageHeader, CTA } from "@/components/marketing-sections";

export const Route = createFileRoute("/guest-workspace")({
  head: () => ({
    meta: [
      { title: "Guest Workspace — Free Digital Collection Book | FinRoute" },
      { name: "description", content: "A free digital collection book for lenders coming from paper. Track customers, record daily collections and log expenses — no card required." },
      { property: "og:title", content: "FinRoute Guest Workspace" },
      { property: "og:description", content: "The free digital collection book that pays for itself." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuestWorkspacePage,
});

function GuestWorkspacePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHeader eyebrow="Guest Workspace" title="Free forever digital collection book" description="Meant for lenders coming from paper. No setup, no time limit." />
        <GuestWorkspace withHeader={false} />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
