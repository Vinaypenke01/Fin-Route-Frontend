// ─── Google Analytics 4 — FinRoute Analytics Module ───────────────────────
// Measurement ID: G-LXFLVLJ5TK (fin-route.site)
// gtag is loaded via the <script> tag in index.html.
// All functions are safe no-ops if gtag hasn't loaded yet.

const GA_ID = "G-LXFLVLJ5TK";

/** Send a page_view event on every SPA route change. */
export function trackPageView(pathname: string, title: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: pathname,
    page_title: title,
    page_location: window.location.href,
    send_to: GA_ID,
  });
}

// ── Auth Events ──────────────────────────────────────────────────────────────

/** User completed registration. */
export function trackSignUp(method: "mobile_otp" | "email" = "mobile_otp") {
  window.gtag?.("event", "sign_up", { method });
}

/** User logged in successfully. */
export function trackLogin(method: "mobile_otp" | "password" = "mobile_otp") {
  window.gtag?.("event", "login", { method });
}

// ── Core Product Events ──────────────────────────────────────────────────────

/** User recorded a collection payment. */
export function trackCollectionRecorded(amount: number, paymentMode: string) {
  window.gtag?.("event", "collection_recorded", {
    event_category: "core_action",
    currency: "INR",
    value: amount,
    payment_mode: paymentMode,
  });
}

/** User added a new customer. */
export function trackCustomerAdded() {
  window.gtag?.("event", "customer_added", {
    event_category: "engagement",
  });
}

/** User saved / configured a route line. */
export function trackLineConfigured(lineDay: string) {
  window.gtag?.("event", "line_configured", {
    event_category: "engagement",
    event_label: lineDay,
  });
}

/** User logged an expense. */
export function trackExpenseLogged(category: string, amount: number) {
  window.gtag?.("event", "expense_logged", {
    event_category: "engagement",
    expense_category: category,
    value: amount,
    currency: "INR",
  });
}

// ── Conversion & Monetisation Events ─────────────────────────────────────────

/** User clicked a Contact / Book a Demo CTA. */
export function trackDemoRequested(source: string) {
  window.gtag?.("event", "generate_lead", {
    event_category: "conversion",
    source,
  });
}

/** User visited the upgrade / pricing page. */
export function trackUpgradeViewed() {
  window.gtag?.("event", "upgrade_page_viewed", {
    event_category: "monetisation",
  });
}

/** User downloaded or emailed a report / Excel backup. */
export function trackReportDownloaded(reportType: string) {
  window.gtag?.("event", "report_downloaded", {
    event_category: "engagement",
    report_type: reportType,
  });
}
