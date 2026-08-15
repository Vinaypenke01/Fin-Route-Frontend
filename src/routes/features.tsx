import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Features, PageHeader, CTA } from "@/components/marketing-sections";

const OG_IMAGE = "https://fin-route.site/logo-removebg-preview%20(1).png";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — FinRoute" },
      { name: "description", content: "Customers, loans, collections, routes, expenses and reports — every module FinRoute offers to run modern finance." },
      { property: "og:title", content: "FinRoute Features" },
      { property: "og:description", content: "The complete ERP toolkit for daily, weekly and monthly lending." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/features" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "FinRoute app features overview" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FinRoute Features — Complete Finance ERP" },
      { name: "twitter:description", content: "1-tap collections, WhatsApp receipts, routes, expenses, reports and payroll — all in one mobile app." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/features" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "FinRoute",
          applicationCategory: "BusinessApplication, FinanceApplication",
          operatingSystem: "Android, iOS, Web",
          description:
            "FinRoute is a complete mobile ERP for daily, weekly and monthly finance businesses. Features include 1-tap collections, WhatsApp digital passbooks, route management, expense tracking, loan management, payroll, and automated nightly Excel backups.",
          featureList: [
            "1-tap daily collection recording",
            "WhatsApp digital passbook receipts",
            "Route & line management with walking-sequence ordering",
            "Daily cash tally (float, collections, loans, expenses)",
            "Multi-employee ERP with role-based access",
            "Loan lifecycle management",
            "Automated nightly Excel email backups",
            "Daily finance calculator",
            "Payroll & salary management",
            "Real-time analytics dashboard",
          ],
          url: "https://fin-route.site",
        }),
      },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHeader eyebrow="Features" title="Everything you need to run finance" description="One workspace for customers, loans, collections, routes, expenses and reports." />
        <Features withHeader={false} />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
