import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/marketing-sections";

export const Route = createFileRoute("/platform-policies")({
  head: () => ({
    meta: [
      { title: "Platform Policies & Disclaimers — FinRoute" },
      { name: "description", content: "Subscription, Refund Policy, Acceptable Use, and Disclaimers for FinRoute." },
    ],
  }),
  component: PlatformPoliciesPage,
});

function PlatformPoliciesPage() {
  return (
    <div className="bg-background min-h-screen">
      <SiteHeader />
      <main>
        <PageHeader
          eyebrow="Platform Guidelines"
          title="Platform Policies & Disclaimers"
          description="Subscription, Cancellation, Refund Policy, Acceptable Use, and Operational Disclaimers."
        />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 text-sm leading-relaxed text-foreground">
        {/* Section 1: Subscription, Cancellation & Refund Policy */}
        <section className="space-y-4 p-6 bg-card border border-border rounded-xl">
          <h2 className="text-xl font-bold font-display text-primary">Subscription, Cancellation & Refund Policy</h2>
          
          <div className="space-y-3 text-muted-foreground">
            <h3 className="font-semibold text-foreground">Subscription Payments</h3>
            <p>
              Payments made to FinRoute are solely for access to Platform software and related subscription features. Subscription payments are NOT borrower repayments, loan installments, collection amounts, deposits, or funds managed on behalf of lenders.
            </p>

            <h3 className="font-semibold text-foreground pt-1">Billing & Renewal</h3>
            <p>
              Paid plans may be offered monthly or annually. Where automatic renewal is enabled, subscriptions renew according to billing terms displayed during purchase. Users may cancel future renewal anytime through account settings.
            </p>

            <h3 className="font-semibold text-foreground pt-1">Cancellation</h3>
            <p>
              Cancellation prevents future subscription renewal. Unless otherwise stated during purchase, cancellation does not automatically erase business records stored in the account.
            </p>

            <h3 className="font-semibold text-foreground pt-1">Refunds</h3>
            <p>Refund eligibility depends on circumstances. Refunds may be considered for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Duplicate charges</li>
              <li>Incorrect Platform charges</li>
              <li>Payment completed but subscription not activated</li>
            </ul>
            <p className="text-xs italic pt-1">
              Refunds will generally not be provided solely because a user did not use the subscription or no longer requires the service after using the subscription period.
            </p>
          </div>
        </section>

        {/* Section 2: Acceptable Use Policy */}
        <section className="space-y-4 p-6 bg-card border border-border rounded-xl">
          <h2 className="text-xl font-bold font-display text-primary">Acceptable Use Policy</h2>
          <p className="text-muted-foreground">Users must use FinRoute lawfully and responsibly. Users must NOT use the Platform for:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Illegal lending activities or fraud</li>
            <li>Falsifying payment records or threatening/harassing borrowers</li>
            <li>Unauthorized surveillance or unlawfully tracking individuals</li>
            <li>Storing stolen personal information or accessing another lender's records</li>
            <li>Uploading malware, attacking Platform infrastructure, or abusing APIs</li>
          </ul>
        </section>

        {/* Section 3: Platform & Route Disclaimers */}
        <section className="space-y-4 p-6 bg-card border border-border rounded-xl">
          <h2 className="text-xl font-bold font-display text-primary">Platform & Route Disclaimers</h2>
          
          <div className="space-y-3 text-muted-foreground">
            <h3 className="font-semibold text-foreground">Software Disclaimer</h3>
            <p>
              FinRoute is a software record-management and analytics platform. It is not a lender, bank, NBFC, payment intermediary, collection agency, or financial adviser. FinRoute does not guarantee repayment by any customer or borrower.
            </p>

            <h3 className="font-semibold text-foreground pt-1">Route & Location Disclaimer</h3>
            <p>
              Maps, customer locations, distances, travel times, and routes depend on information supplied by users and third-party mapping providers. Route suggestions are provided for operational convenience only. Users and collectors remain responsible for following traffic laws and evaluating road safety.
            </p>

            <h3 className="font-semibold text-foreground pt-1">Data Responsibility Notice</h3>
            <p>
              Businesses using FinRoute are responsible for ensuring they have appropriate authority or lawful grounds to collect, use, and submit customer information into the Platform.
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-4 text-xs text-muted-foreground text-center">
          <p>For questions or assistance regarding platform policies, contact <strong>support@finroute.in</strong></p>
        </section>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
