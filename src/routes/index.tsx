import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Hero, TrustedBar, Features, HowItWorks, IndustryUseCases,
  ImpactStats, Testimonials, SecurityTrust, CTA,
} from "@/components/marketing-sections";
import { getRequestOrigin } from "@/lib/seo.functions";
import { getPlatformConfig, PlatformConfig } from "@/lib/platform-config";
import { AlertTriangle, Sparkles, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import ogImage from "@/assets/finroute-og.png.asset.json";

export const Route = createFileRoute("/")({
  loader: async () => {
    const origin = await getRequestOrigin();
    return { origin, imageUrl: `${origin}${ogImage.url}` };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "FinRoute — Simple Mobile App for Daily Finance & Route Collection" },
      { name: "description", content: "Replace paper khata books with FinRoute. Run daily & weekly micro-lending on your phone with 1-tap collections, WhatsApp receipts, live cash tally & automated nightly Excel backups." },
      { name: "keywords", content: "finroute, daily finance app, route collection software, khata book mobile app, micro lending ERP, field collection tally, WhatsApp payment receipts, daily loan calculator, finance business software India" },
      { property: "og:title", content: "FinRoute — Simple Mobile App for Daily Finance & Route Collection" },
      { property: "og:description", content: "Replace paper notebooks with a digital collection book. 1-tap field collections, WhatsApp digital passbooks & automatic nightly Excel backups." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/" },
      { property: "og:image", content: loaderData?.imageUrl ?? "https://fin-route.site/logo-removebg-preview%20(1).png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "FinRoute dashboard preview for Indian finance businesses" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FinRoute — Daily Finance Collection & ERP App" },
      { name: "twitter:description", content: "Manage daily & weekly micro-finance collections on your mobile phone with zero evening calculator math." },
      { name: "twitter:image", content: loaderData?.imageUrl ?? "https://fin-route.site/logo-removebg-preview%20(1).png" },
      { name: "twitter:image:alt", content: "FinRoute dashboard preview for Indian finance businesses" },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            name: "FinRoute",
            url: loaderData?.origin ? `${loaderData.origin}/` : "/",
            description: "Modern ERP for daily, weekly and monthly finance businesses in India.",
            potentialAction: {
              "@type": "SearchAction",
              target: `${loaderData?.origin ?? ""}/app/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@type": "Organization",
            name: "FinRoute",
            url: loaderData?.origin ? `${loaderData.origin}/` : "/",
            logo: loaderData?.imageUrl ?? ogImage.url,
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+91-80-4700-1200",
              contactType: "sales",
              areaServed: "IN",
              availableLanguage: ["English", "Hindi"],
            },
            sameAs: [
              "https://twitter.com/finroute",
              "https://linkedin.com/company/finroute",
            ],
          },
        ],
      }),
    }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [config, setConfig] = useState<PlatformConfig>(getPlatformConfig());

  useEffect(() => {
    setConfig(getPlatformConfig());
    const onConfigChange = () => setConfig(getPlatformConfig());
    window.addEventListener("platform-config-change", onConfigChange);
    return () => window.removeEventListener("platform-config-change", onConfigChange);
  }, []);

  // Maintenance Mode View
  if (config.maintenanceMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Platform Scheduled Maintenance
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          FinRoute services are currently undergoing scheduled upgrades and optimization. System operations will resume shortly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/auth/login">Super Admin Login</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Live Announcement Banner */}
      {config.announcementEnabled && config.bannerMessage && (
        <div className="bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground flex items-center justify-center gap-2 shadow-sm">
          <Sparkles className="size-3.5 animate-pulse" />
          <span>{config.bannerMessage}</span>
        </div>
      )}

      <SiteHeader />
      <main>
        <Hero />
        <TrustedBar />
        <Features />
        <HowItWorks />
        <ImpactStats />
        <IndustryUseCases />
        <Testimonials />
        <SecurityTrust />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
