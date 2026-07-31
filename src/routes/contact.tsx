import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Contact, PageHeader } from "@/components/marketing-sections";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — FinRoute" },
      { name: "description", content: "Book a personalized demo or ask us anything about FinRoute. We reply within one business day." },
      { property: "og:title", content: "Talk to the FinRoute team" },
      { property: "og:description", content: "Book a demo or send us a message." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHeader eyebrow="Contact" title="Talk to our team" description="Book a personalized demo or ask us anything about FinRoute." />
        <Contact withHeader={false} />
      </main>
      <SiteFooter />
    </div>
  );
}
