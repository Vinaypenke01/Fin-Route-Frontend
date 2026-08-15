import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/marketing-sections";

const OG_IMAGE = "https://fin-route.site/logo-removebg-preview%20(1).png";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FinRoute (DPDP Act 2023 Compliant)" },
      { name: "description", content: "Privacy Policy for FinRoute software platform and services in compliance with the Digital Personal Data Protection Act, 2023." },
      { property: "og:title", content: "Privacy Policy — FinRoute" },
      { property: "og:description", content: "How FinRoute collects, uses, stores and protects your digital personal data under the DPDP Act 2023." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/privacy" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen">
      <SiteHeader />
      <main>
        <PageHeader
          eyebrow="Legal & Data Protection"
          title="Privacy Policy & DPDP Compliance"
          description="Learn how FinRoute collects, uses, stores, and protects digital personal data under the Digital Personal Data Protection Act, 2023 (DPDP Act)."
        />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 text-sm leading-relaxed text-foreground">
        <div className="p-4 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
          <p><strong>Effective Date:</strong> July 31, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 15, 2026</p>
          <p className="mt-1">
            This Privacy Policy explains how FinRoute Technologies Pvt. Ltd. ("FinRoute", "Platform", "we", "us", or "our") processes digital personal data in compliance with the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)** and applicable laws of India.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">1. Role of FinRoute (Data Fiduciary & Data Processor)</h2>
          <p>
            FinRoute operates a software-as-a-service platform for daily, weekly, and monthly finance businesses.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong>For User Account Data:</strong> FinRoute acts as a <em>Data Fiduciary</em> for the personal data provided by lenders/account owners when signing up.</li>
            <li><strong>For Borrower/Customer Records:</strong> Lenders entering borrower information act as <em>Data Fiduciaries</em>, and FinRoute acts as a <em>Data Processor</em> carrying out processing under a valid service agreement.</li>
          </ul>
          <p className="text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
            <strong>Important Disclaimer:</strong> FinRoute is strictly a software record-management tool. FinRoute does not offer loans, collect borrower funds, process money transfers, or operate as a collection agency or NBFC.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">2. Information We Collect</h2>
          <h3 className="font-semibold text-foreground">A. Account Information (User Data)</h3>
          <p>When you register, we collect: Full Name, Mobile Number, Email Address, Hashed Password, Business Name, Subscription plan details, and Account Preferences.</p>

          <h3 className="font-semibold text-foreground pt-2">B. Borrower Records Entered by Users</h3>
          <p>Lenders may enter borrower records including: Name, Phone Numbers, Address/Area, Loan Principal, Interest Rate, Start Date, Repayment Frequency, Collection Receipts, Outstanding Balance, and Promise-to-Pay dates.</p>

          <h3 className="font-semibold text-foreground pt-2">C. Location & Device Data</h3>
          <p>Latitude/Longitude coordinates for customer locations, collection check-in timestamps, and device technical metadata required for audit logging and route optimization.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">3. Purpose of Processing & Consent (Section 5 & 6)</h2>
          <p>Personal data is processed solely for lawful purposes to which you have given clear, affirmative consent, specifically:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Providing digital ledger, collection sheet, and route management services.</li>
            <li>Calculating outstanding balances, schedules, and generating automated Excel backups.</li>
            <li>Protecting accounts against fraud, security risks, and unauthorized access.</li>
          </ul>
          <p>You have the right to access notice and consent forms in English and any language specified in the Eighth Schedule to the Constitution of India.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">4. Data Principal Rights under DPDP Act 2023 (Chapter III)</h2>
          <p>As a Data Principal under Indian law, you possess the following statutory rights:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 border border-border rounded-lg bg-card">
              <h4 className="font-bold text-sm text-foreground">Right to Access (Section 11)</h4>
              <p className="text-xs text-muted-foreground mt-1">Obtain a summary of your personal data being processed and identities of Data Processors with whom data is shared.</p>
            </div>
            <div className="p-3 border border-border rounded-lg bg-card">
              <h4 className="font-bold text-sm text-foreground">Right to Correction & Erasure (Section 12)</h4>
              <p className="text-xs text-muted-foreground mt-1">Request correction of inaccurate data or complete erasure of personal data when specified purpose is completed.</p>
            </div>
            <div className="p-3 border border-border rounded-lg bg-card">
              <h4 className="font-bold text-sm text-foreground">Right of Grievance Redressal (Section 13)</h4>
              <p className="text-xs text-muted-foreground mt-1">Access readily available grievance redressal mechanisms provided by FinRoute.</p>
            </div>
            <div className="p-3 border border-border rounded-lg bg-card">
              <h4 className="font-bold text-sm text-foreground">Right to Nominate (Section 14)</h4>
              <p className="text-xs text-muted-foreground mt-1">Nominate an individual to exercise your rights in the event of death or incapacity.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">5. Protection of Children & Age Limits (Section 9)</h2>
          <p>
            FinRoute is strictly intended for individuals who are at least 18 years of age and legally competent to contract under the Indian Contract Act, 1872. FinRoute does not knowingly collect or track personal data or engage in targeted advertising/behavioral monitoring of children under 18 years.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">6. Security Safeguards & Breach Notification (Section 8(5) & 8(6))</h2>
          <p>
            FinRoute implements reasonable security safeguards including HTTPS SSL/TLS encryption, argon2/PBKDF2 password hashing, database workspace isolation, audit logging, and automated nightly backups.
          </p>
          <p>
            In the event of a personal data breach, FinRoute will intimate the <strong>Data Protection Board of India</strong> and all affected Data Principals in accordance with prescribed legal procedures.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-bold font-display text-primary">7. Grievance Officer & Contact Details (Section 8(10) & 13)</h2>
          <p>For exercising your statutory data rights, privacy inquiries, or redressing grievances, please contact our Grievance Officer:</p>
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1 text-xs">
            <p><strong>Entity:</strong> FinRoute Technologies Pvt. Ltd.</p>
            <p><strong>Grievance Officer:</strong> Data Protection & Grievance Cell</p>
            <p><strong>Email:</strong> privacy@finroute.in | support@finroute.in</p>
            <p><strong>Response SLA:</strong> Acknowledged within 24 hours; resolved within 7 business days.</p>
          </div>
        </section>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
