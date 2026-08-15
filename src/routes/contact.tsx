import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Contact, PageHeader } from "@/components/marketing-sections";

const OG_IMAGE = "https://fin-route.site/logo-removebg-preview%20(1).png";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — FinRoute" },
      { name: "description", content: "Book a personalized demo or ask us anything about FinRoute. We reply within one business day." },
      { property: "og:title", content: "Talk to the FinRoute team" },
      { property: "og:description", content: "Book a demo or send us a message." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/contact" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Contact the FinRoute team" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Contact FinRoute — Book a Demo" },
      { name: "twitter:description", content: "Get a personalized walkthrough of FinRoute for your finance business." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact FinRoute",
          url: "https://fin-route.site/contact",
          description: "Book a personalized demo or ask us anything about FinRoute.",
          mainEntity: {
            "@type": "Organization",
            name: "FinRoute",
            url: "https://fin-route.site",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              availableLanguage: ["English", "Telugu", "Hindi"],
            },
          },
        }),
      },
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
