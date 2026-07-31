import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/marketing-sections";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FinRoute" },
      { name: "description", content: "Privacy Policy for FinRoute software platform and services." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen">
      <SiteHeader />
      <main>
        <PageHeader
          eyebrow="Legal & Security"
          title="Privacy Policy"
          description="Learn how FinRoute collects, uses, stores, and protects user and operational information."
        />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 text-sm leading-relaxed text-foreground">
        <div className="p-4 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
          <p><strong>Effective Date:</strong> July 31, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> July 31, 2026</p>
          <p className="mt-1">
            This Privacy Policy explains how FinRoute Technologies operating FinRoute ("Platform", "we", "us", or "our"), collects, uses, stores, and protects personal information when users access our website, web application, mobile application, APIs, or related services.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">1. About the Platform</h2>
          <p>
            FinRoute is a software-as-a-service platform designed to help lenders and finance businesses digitally maintain customer records, finance records, collection entries, expenses, outstanding amounts, schedules, routes, and business analytics.
          </p>
          <p>
            The Platform does not collect loan repayments from borrowers, hold customer money, transfer borrower funds, provide loans, or act as a collection agency.
          </p>
          <p>
            Users independently conduct their lending and collection activities and use the Platform primarily as a record-management and business-management tool.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">2. Information We Collect</h2>
          <h3 className="font-semibold text-foreground">Account Information</h3>
          <p>When a user creates an account, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Name</li>
            <li>Mobile number</li>
            <li>Email address</li>
            <li>Password in securely hashed form</li>
            <li>Business or finance name</li>
            <li>Account preferences</li>
            <li>Subscription information</li>
          </ul>

          <h3 className="font-semibold text-foreground pt-2">Customer Information Entered by Users</h3>
          <p>Users may enter information relating to their customers or borrowers, including:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Customer name & contact numbers (Mobile, Alternate mobile)</li>
            <li>Address, State, District, City, Village, Area, Postal code</li>
            <li>Finance/loan amount, Interest information, Start date, Tenure, Frequency</li>
            <li>Amount already paid, Outstanding balance, Collection history, Payment mode</li>
            <li>Non-payment information, Promise-to-pay dates</li>
            <li>Other information necessary for maintaining finance records</li>
          </ul>

          <h3 className="font-semibold text-foreground pt-2">Location Information</h3>
          <p>Certain features may use location information, including:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Customer latitude & longitude coordinates</li>
            <li>Collection location & Collector location (where enabled)</li>
            <li>Route and Area information</li>
          </ul>

          <h3 className="font-semibold text-foreground pt-2">Collection & Expense Information</h3>
          <p>The Platform records transaction metadata (amount recorded, date, mode, collector, category) supplied directly by users. FinRoute does not receive or settle actual borrower funds.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">3. How We Use Information</h2>
          <p>We use information to:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Provide Platform functionality and maintain user accounts</li>
            <li>Calculate outstanding balances, collection schedules, and daily summaries</li>
            <li>Generate reports, route suggestions, and operational analytics</li>
            <li>Protect accounts against unauthorized access and security risks</li>
            <li>Diagnose technical problems, improve performance, and provide customer support</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display text-primary">4. Data Security & Retention</h2>
          <p>
            We use technical and organizational safeguards including HTTPS encryption, password hashing, role-based access controls, workspace-level data isolation, database access restrictions, and audit logging to protect user information.
          </p>
          <p>
            We retain information for as long as reasonably necessary to provide Platform functionality, maintain legitimate business records, and comply with applicable laws.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-bold font-display text-primary">5. Contact & Grievances</h2>
          <p>For privacy questions, data requests, complaints, or grievances, contact us at:</p>
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1 text-xs">
            <p><strong>Company:</strong> FinRoute Technologies Pvt. Ltd.</p>
            <p><strong>Support & Privacy Email:</strong> privacy@finroute.in</p>
            <p><strong>Grievance Officer:</strong> Grievance Cell (support@finroute.in)</p>
          </div>
        </section>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
