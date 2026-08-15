import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GuestWorkspace, PageHeader, CTA } from "@/components/marketing-sections";

const OG_IMAGE = "https://fin-route.site/logo-removebg-preview%20(1).png";

export const Route = createFileRoute("/guest-workspace")({
  head: () => ({
    meta: [
      { title: "Guest Workspace — Free Digital Collection Book | FinRoute" },
      { name: "description", content: "A free digital collection book for lenders coming from paper. Track customers, record daily collections and log expenses — no card required." },
      { property: "og:title", content: "FinRoute Guest Workspace" },
      { property: "og:description", content: "The free digital collection book that pays for itself." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/guest-workspace" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "FinRoute Guest Workspace — free digital collection book" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Guest Workspace — Free Digital Collection Book" },
      { name: "twitter:description", content: "Replaces your paper notebook. Free forever. No card needed." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/guest-workspace" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Guest Workspace — Free Digital Collection Book",
          url: "https://fin-route.site/guest-workspace",
          description: "A free digital collection book for lenders coming from paper. Track customers, record daily collections and log expenses — no card required.",
          isPartOf: { "@type": "WebSite", url: "https://fin-route.site", name: "FinRoute" },
          offers: {
            "@type": "Offer",
            name: "Guest Workspace",
            price: "0",
            priceCurrency: "INR",
            description: "Free forever digital collection book — customers, collections, expenses and nightly Excel backups.",
          },
        }),
      },
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
