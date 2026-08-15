import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/marketing-sections";

const OG_IMAGE = "https://fin-route.site/logo-removebg-preview%20(1).png";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — FinRoute" },
      { name: "description", content: "Terms of Service for FinRoute record management software." },
      { property: "og:title", content: "Terms of Service — FinRoute" },
      { property: "og:description", content: "Terms governing access to and use of the FinRoute digital record management platform." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fin-route.site/terms" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://fin-route.site/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="bg-background min-h-screen">
      <SiteHeader />
      <main>
        <PageHeader
          eyebrow="Legal & Terms"
          title="Terms of Service"
          description="These Terms govern access to and use of the FinRoute digital record management platform."
        />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 text-sm leading-relaxed text-foreground">
        <div className="p-4 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
          <p><strong>Effective Date:</strong> July 31, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 15, 2026</p>
          <p className="mt-1">
            These Terms of Service govern access to and use of FinRoute ("Platform"), operated by FinRoute Technologies Pvt. Ltd. By creating an account or using the Platform, you agree to these Terms.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">1. Platform Purpose</h2>
          <p>
            FinRoute is a software platform designed to help lenders and finance businesses maintain digital records relating to customers, finance accounts, collection schedules, collection entries, outstanding balances, expenses, areas, routes, reports, and analytics.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">2. We Are a Software Provider</h2>
          <p>
            FinRoute provides technology and record-management services only. FinRoute:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Does not provide loans or lend money to borrowers</li>
            <li>Does not collect borrower repayments or receive borrower money</li>
            <li>Does not hold lender or borrower funds</li>
            <li>Does not act as a bank, NBFC, payment intermediary, or collection agent</li>
            <li>Does not guarantee borrower repayment or provide financial or legal advice</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            Collection amounts entered into the Platform are records supplied by users. An entry showing "₹500 collected" means that a user recorded a transaction, not that FinRoute received or processed ₹500.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">3. Eligibility & Age Restriction (18+)</h2>
          <p>
            By using FinRoute, you represent and warrant that you are at least 18 years of age and legally competent to enter into binding contracts under the Indian Contract Act, 1872. Registration by minors or on behalf of individuals under 18 years is strictly prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">4. Data Fiduciary Responsibility & Borrower Consent Warranty</h2>
          <p>
            Under the **Digital Personal Data Protection Act, 2023 (DPDP Act)**, lenders uploading borrower personal data act as **Data Fiduciaries**. By entering any borrower information (name, phone number, address, financial details, photos, or location coordinates) into FinRoute, you explicitly warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>You have obtained lawful, specific, and informed consent from the borrower to process their personal data on FinRoute.</li>
            <li>You will promptly process borrower requests for data correction, updates, or erasure in accordance with the law.</li>
            <li>You will indemnify and hold harmless FinRoute Technologies Pvt. Ltd. from any claims, penalties, or liabilities arising from your failure to obtain valid borrower consent or your violation of applicable privacy laws.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">5. User Responsibility & Acceptable Use</h2>
          <p>
            Users are independently responsible for their lending activities, legal compliance, interest rates charged, customer agreements, collection practices, taxes, and obtaining appropriate authority to process customer information.
          </p>
          <p>Users must not use the Platform for:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Illegal lending activities or fraud</li>
            <li>Entering fraudulent collection records</li>
            <li>Harassing borrowers through the Platform</li>
            <li>Unauthorized access, abusing APIs, or circumventing security controls</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">6. Guest Workspace & Paid Features</h2>
          <p>
            The Platform provides a free Guest Workspace allowing lenders to record finance information, collections, non-payments, and operational expenses.
          </p>
          <p>
            Paid business subscriptions provide additional features such as employee collector accounts, area management, GPS route planning, WhatsApp messaging, and advanced analytics.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-bold font-display text-primary">7. Governing Law & Dispute Resolution</h2>
          <p>These Terms are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of competent courts in India.</p>
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1 text-xs">
            <p><strong>Company:</strong> FinRoute Technologies Pvt. Ltd.</p>
            <p><strong>Support Email:</strong> support@finroute.in</p>
          </div>
        </section>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
