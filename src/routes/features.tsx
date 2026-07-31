import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Features, PageHeader, CTA } from "@/components/marketing-sections";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — FinRoute" },
      { name: "description", content: "Customers, loans, collections, routes, expenses and reports — every module FinRoute offers to run modern finance." },
      { property: "og:title", content: "FinRoute Features" },
      { property: "og:description", content: "The complete ERP toolkit for daily, weekly and monthly lending." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
