import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AddOns, PageHeader, CTA } from "@/components/marketing-sections";

export const Route = createFileRoute("/addons")({
  head: () => ({
    meta: [
      { title: "Premium Add-ons — FinRoute" },
      { name: "description", content: "Extend FinRoute with premium modules. Pay only for what you need — toggle add-ons on and off anytime." },
      { property: "og:title", content: "FinRoute Premium Add-ons" },
      { property: "og:description", content: "Optional modules that extend FinRoute for growing finance businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddOnsPage,
});

function AddOnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHeader eyebrow="Premium Add-ons" title="Extend FinRoute with premium modules" description="Pay only for what you need. Toggle add-ons on and off anytime." />
        <AddOns withHeader={false} />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
