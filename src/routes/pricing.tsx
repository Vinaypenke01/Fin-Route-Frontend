import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Pricing, PageHeader, FAQ, CTA } from "@/components/marketing-sections";

const OG_IMAGE = "https://fin-route.site/logo-removebg-preview%20(1).png";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FinRoute" },
      { name: "description", content: "Simple, transparent pricing for FinRoute. Start free and scale when you're ready. Cancel anytime." },
      { property: "og:title", content: "FinRoute Pricing" },
      { property: "og:description", content: "Simple, transparent plans built for Indian finance businesses." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/pricing" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "FinRoute pricing plans" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FinRoute Pricing — Simple, Transparent Plans" },
      { name: "twitter:description", content: "Start free forever. Upgrade when your business grows. Cancel anytime." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "FinRoute",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Android, iOS, Web",
          offers: [
            {
              "@type": "Offer",
              name: "Guest Workspace",
              price: "0",
              priceCurrency: "INR",
              description: "Free forever digital collection book — manage customers, collections, expenses and nightly Excel backups.",
            },
            {
              "@type": "Offer",
              name: "ERP Pro",
              price: "499",
              priceCurrency: "INR",
              billingIncrement: "P1M",
              description: "Full ERP — multi-employee, routes, advanced reports, payroll, loan management and reconciliation.",
            },
          ],
        }),
      },
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
