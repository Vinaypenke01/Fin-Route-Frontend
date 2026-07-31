import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Pricing, PageHeader, FAQ, CTA } from "@/components/marketing-sections";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FinRoute" },
      { name: "description", content: "Simple, transparent pricing for FinRoute. Start free and scale when you're ready. Cancel anytime." },
      { property: "og:title", content: "FinRoute Pricing" },
      { property: "og:description", content: "Simple, transparent plans built for Indian finance businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHeader eyebrow="Pricing" title="Simple, transparent plans" description="Start free. Scale when you're ready. Cancel anytime." />
        <Pricing withHeader={false} />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
