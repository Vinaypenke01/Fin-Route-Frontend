import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FAQ, PageHeader, CTA } from "@/components/marketing-sections";

const OG_IMAGE = "https://fin-route.site/logo-removebg-preview%20(1).png";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — FinRoute" },
      { name: "description", content: "Answers to common questions about FinRoute pricing, guest workspace, security and onboarding." },
      { property: "og:title", content: "FinRoute — Frequently Asked Questions" },
      { property: "og:description", content: "Everything you wanted to know about FinRoute." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/faq" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "FinRoute — FAQ" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FinRoute — Frequently Asked Questions" },
      { name: "twitter:description", content: "Common questions about pricing, guest workspace, security and onboarding." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Is FinRoute free to use?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes — the Guest Workspace is free forever. You can manage customers, record daily collections, log expenses and get nightly Excel backups at no cost. Paid ERP plans unlock multi-employee, advanced reports and full ERP features.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need a smartphone to use FinRoute?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Any Android or iOS smartphone with a browser works. FinRoute is a Progressive Web App (PWA) — no app store download required. Just open fin-route.site in your mobile browser and install it to your home screen.",
              },
            },
            {
              "@type": "Question",
              name: "Is my data safe on FinRoute?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "All data is encrypted in transit and at rest. Your business data is backed up every night and emailed to you as an Excel file. If you lose your phone, simply log back in on a new device and all your records are restored instantly.",
              },
            },
            {
              "@type": "Question",
              name: "Can I use FinRoute offline?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Basic collection recording works offline. Data is synced to the cloud the next time your device connects to the internet.",
              },
            },
            {
              "@type": "Question",
              name: "How does the daily cash tally work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "FinRoute tracks four boxes: Float Cash In, Collections, New Loans Given Out, and Expenses. The final pocket cash = Float + Collections − New Loans − Expenses. The app calculates this automatically so your evening count always matches to the rupee.",
              },
            },
          ],
        }),
      },
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
