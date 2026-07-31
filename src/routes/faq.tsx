import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FAQ, PageHeader, CTA } from "@/components/marketing-sections";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — FinRoute" },
      { name: "description", content: "Answers to common questions about FinRoute pricing, guest workspace, security and onboarding." },
      { property: "og:title", content: "FinRoute — Frequently Asked Questions" },
      { property: "og:description", content: "Everything you wanted to know about FinRoute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHeader eyebrow="FAQ" title="Questions, answered" />
        <FAQ withHeader={false} />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
