import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, Check, Star, Users, Banknote, Wallet, UserCog, Map, Route as RouteIcon,
  Coins, Receipt, FileBarChart, LineChart, MapPin, Smartphone, Sparkles, ShieldCheck,
  Zap, Mail, Phone, MapPinned, TrendingUp, Lock, ScanFace, Server, Clock, Calculator,
  FileCheck, HandCoins, MapPinned as MapPin2, Building2, Percent, CalendarClock, Repeat, CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  features, testimonials, faqs, pricingPlans as staticPricingPlans, addOns as staticAddOns,
  kpis,
} from "@/lib/mock-data";
import { inr } from "@/lib/utils";
import { mastersService, PublicLandingData } from "@/lib/services/masters-service";
import { getPlatformConfig, PlatformConfig } from "@/lib/platform-config";

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <section className="border-b border-border bg-muted/30 py-14 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Badge variant="outline" className="mb-4">{eyebrow}</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
    </section>
  );
}

export function Hero() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium shadow-sm">
              <Sparkles className="size-3.5 text-secondary" /> New — Free Digital Collection Book
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Run your finance business <span className="text-gradient-brand">without paper</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              FinRoute is the modern ERP for daily, weekly and monthly lending — customers,
              collections, routes, expenses and reports in one beautiful workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="shadow-md">
                <Link to="/register">
                  Start Free Collection Book
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Book a demo</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Check className="size-4 text-secondary" /> No credit card</span>
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-secondary" /> Bank-grade security</span>
              <span className="flex items-center gap-2"><Zap className="size-4 text-secondary" /> Setup in 2 minutes</span>
            </div>
          </div>
          <div className="lg:col-span-6">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 blur-3xl" />
      <div className="card-elevated overflow-hidden p-4 shadow-[var(--shadow-elevated)]">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted-foreground">app.finroute.in/dashboard</span>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Today's Collection", value: inr(kpis.todayCollection), trend: "+12%" },
              { label: "Outstanding", value: inr(kpis.outstandingAmount), trend: "-3%" },
              { label: "Collection %", value: kpis.collectionPct + "%", trend: "+5%" },
            ].map((k) => (
              <div key={k.label} className="rounded-md border border-border bg-card p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
                <p className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">{k.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrustedBar() {
  const companies = ["Sharma Finance", "Balaji Capital", "Lakshmi Money", "Surya Fincorp", "Venkateswara Microfinance"];
  return (
    <section className="border-y border-border bg-muted/40 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Trusted by 1,200+ daily finance & money lending businesses across India
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75">
          {companies.map((c) => (
            <span key={c} className="font-display text-sm font-bold tracking-tight text-foreground/80">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything you need to digitize collections</h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-6 transition-all hover:shadow-[var(--shadow-elevated)]">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Zap className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing({ withHeader = true }: { withHeader?: boolean }) {
  const [landingData, setLandingData] = useState<PublicLandingData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await mastersService.getPublicLandingData();
        setLandingData(res);
      } catch (err) {
        console.warn("Using fallback static pricing plans");
      }
    }
    loadPricing();
  }, []);

  const plans = landingData?.pricing_plans || staticPricingPlans;

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setIsModalOpen(true);
  };

  return (
    <section className={"py-20 lg:py-28 " + (withHeader ? "border-t border-border" : "")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {withHeader && (
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Simple, transparent plans</h2>
            <p className="mt-4 text-muted-foreground">Start free. Scale when you're ready. Cancel anytime.</p>
          </div>
        )}
        <div className={"grid gap-6 md:grid-cols-2 xl:grid-cols-4 " + (withHeader ? "mt-14" : "")}>
          {plans.map((p) => {
            const isHigh = p.highlight || p.popular;
            const taglineText = p.tagline || p.desc;
            const ctaText = p.cta || p.buttonText || "Get Started";
            return (
              <Card key={p.name} className={"relative flex flex-col p-6 " + (isHigh ? "border-primary shadow-[var(--shadow-glow)]" : "")}>
                {isHigh && (
                  <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground">Most popular</Badge>
                )}
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  {taglineText && <p className="mt-1 text-xs text-muted-foreground">{taglineText}</p>}
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">₹{Number(p.price).toLocaleString("en-IN")}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-secondary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isHigh ? "default" : "outline"}
                  onClick={() => handleSelectPlan(p.name)}
                >
                  {ctaText}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md text-center p-6 space-y-4">
          <DialogHeader className="space-y-3 flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto">
              <Sparkles className="size-6" />
            </div>
            <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/10 text-primary border-primary/20">
              Coming Soon
            </Badge>
            <DialogTitle className="font-display font-bold text-lg text-foreground">
              {selectedPlan ? `${selectedPlan} Tier ERP` : "Business Account Multi-Branch ERP"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              This feature will be released in the upcoming days! We are finalizing multi-agent hierarchy, automated WhatsApp collection receipts, and advanced agency analytics.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2 border-t border-border/40 w-full space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Want to start managing collections right away? Use a <span className="font-bold text-foreground">Guest Account</span> to start free today.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground font-semibold">
                <Link to="/register">Create Free Guest Account</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function GuestWorkspace({ withHeader = true }: { withHeader?: boolean }) {
  const highlights = [
    { title: "Zero Setup & Immediate Access", desc: "No credit card or documentation required. Get a digital collection book in 2 minutes." },
    { title: "Day-Wise Collection Management", desc: "Organize route customers by day, mark payments as Paid or Skipped, and track collected revenue." },
    { title: "Operational Expense Tracking", desc: "Log fuel, food, and staff expenses to automatically see your daily Net Cash Collected." },
    { title: "Instant PDF Passbook & Receipts", desc: "Generate professional borrower passbooks and daily collection receipts to share on WhatsApp." },
  ];

  return (
    <section className={"py-20 lg:py-28 " + (withHeader ? "border-t border-border" : "")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {withHeader && (
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">Guest Workspace</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Free digital collection book for small lenders</h2>
            <p className="mt-4 text-muted-foreground">Replaces paper notebook registers with an easy-to-use digital collection system.</p>
          </div>
        )}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <Card key={h.title} className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Check className="size-5" />
                </div>
                <h3 className="font-display text-base font-bold text-foreground">{h.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-primary text-primary-foreground font-semibold">
            <Link to="/register">Create Free Guest Workspace</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function AddOns({ withHeader = true }: { withHeader?: boolean }) {
  const [landingData, setLandingData] = useState<PublicLandingData | null>(null);

  useEffect(() => {
    async function loadAddOns() {
      try {
        const res = await mastersService.getPublicLandingData();
        setLandingData(res);
      } catch (err) {
        console.warn("Using fallback add-ons");
      }
    }
    loadAddOns();
  }, []);

  const addonsList = landingData?.add_ons || staticAddOns;

  return (
    <section className={"py-20 lg:py-28 " + (withHeader ? "border-y border-border bg-muted/30" : "")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {withHeader && (
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">Premium Add-ons</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Extend FinRoute with premium modules</h2>
            <p className="mt-4 text-muted-foreground">Pay only for what you need. Toggle add-ons on and off anytime.</p>
          </div>
        )}
        <div className={"grid gap-5 sm:grid-cols-2 lg:grid-cols-3 " + (withHeader ? "mt-12" : "")}>
          {addonsList.map((a) => {
            const addonName = a.name || a.title || "Add-on";
            return (
              <Card key={addonName} className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold">{addonName}</h3>
                  <Badge variant="secondary" className="shrink-0">{a.price}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
                <Button variant="outline" size="sm" className="mt-5 w-fit">Learn more</Button>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const [landingData, setLandingData] = useState<PublicLandingData | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [authorName, setAuthorName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [roleTitle, setRoleTitle] = useState("Lender");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const loadTestimonials = async () => {
    try {
      const res = await mastersService.getPublicLandingData();
      setLandingData(res);
    } catch (err) {
      console.warn("Using fallback static testimonials");
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await mastersService.submitReview({
        author_name: authorName,
        business_name: businessName,
        role_title: roleTitle,
        rating,
        review_text: reviewText,
      });
      setSuccessMsg("Thank you! Your review has been submitted for admin approval and will appear on the landing page once reviewed.");
      setAuthorName("");
      setBusinessName("");
      setReviewText("");
      setRating(5);
      setTimeout(() => {
        setIsSubmitOpen(false);
        setSuccessMsg(null);
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Build items list from DB approved reviews or fallback static list
  const dynamicReviews = landingData?.testimonials || [];
  const displayList = dynamicReviews.length > 0
    ? dynamicReviews.map((r) => ({
        name: r.author_name,
        role: r.business_name ? `${r.role_title} — ${r.business_name}` : r.role_title || "Verified Lender",
        quote: r.review_text,
        rating: r.rating,
        initials: r.author_name.slice(0, 2).toUpperCase(),
      }))
    : testimonials.map((t) => ({
        name: t.name,
        role: t.role,
        quote: t.quote,
        rating: 5,
        initials: t.initials || t.name.slice(0, 2).toUpperCase(),
      }));

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <Badge variant="outline" className="mb-2">Loved by lenders</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Real results from real finance businesses</h2>
          <p className="text-sm text-muted-foreground">Read verified reviews from money lenders and microfinance teams across India.</p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-primary/5 hover:bg-primary/15 text-primary border-primary/20 font-semibold"
              onClick={() => setIsSubmitOpen(true)}
            >
              <Star className="size-4 mr-1.5 fill-primary text-primary" /> Write a Review
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayList.map((t, idx) => (
            <Card key={t.name + idx} className="p-6 flex flex-col justify-between">
              <div>
                <div className="mb-3 flex gap-0.5 text-amber-500">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
              </div>
              <div className="mt-5 flex items-center gap-3 pt-3 border-t border-border/40">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Write a Review Modal */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="size-5 text-amber-500 fill-amber-500" /> Share Your Experience with FinRoute
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Your feedback helps other finance businesses across India. Submitted reviews are reviewed by administrators before appearing live.
            </DialogDescription>
          </DialogHeader>

          {successMsg ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle className="size-4 text-emerald-600" /> Review Submitted Successfully!
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
              {errorMsg && (
                <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Your Full Name *</label>
                  <Input
                    className="mt-1 h-9 text-xs"
                    placeholder="Rajesh Sharma"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Business / Firm Name</label>
                  <Input
                    className="mt-1 h-9 text-xs"
                    placeholder="Sharma Finance"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Role / Designation</label>
                  <Input
                    className="mt-1 h-9 text-xs"
                    placeholder="Owner / Proprietor"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Rating</label>
                  <div className="mt-1 flex items-center gap-1 h-9 px-2 border rounded-md bg-background">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star className={`size-4 ${star <= rating ? "fill-amber-500" : "text-muted border-muted"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Your Review / Feedback *</label>
                <Textarea
                  className="mt-1 text-xs min-h-[90px]"
                  placeholder="Tell us how FinRoute helped your daily collection business..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSubmitOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-primary-foreground">
                  {submitting ? "Submitting..." : "Submit Review for Approval"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function ImpactStats() {
  const [landingData, setLandingData] = useState<PublicLandingData | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await mastersService.getPublicLandingData();
        setLandingData(res);
      } catch (err) {
        console.warn("Using fallback impact stats");
      }
    }
    loadStats();
  }, []);

  const stats = [
    { label: "Collection entries tracked", value: landingData ? `${landingData.impact_stats.collections_tracked.toLocaleString("en-IN")}+` : "50,000+" },
    { label: "Finance businesses registered", value: landingData ? `${landingData.impact_stats.lenders_count.toLocaleString("en-IN")}+` : "1,200+" },
    { label: "Cities across India", value: "85+" },
    { label: "Collection efficiency lift", value: landingData ? landingData.impact_stats.efficiency_lift : "32%" },
  ];

  return (
    <section className="border-y border-border bg-primary py-16 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl font-bold sm:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-primary-foreground/80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: Users,
      title: "Import customers",
      desc: "Add your borrowers in bulk or one-by-one. FinRoute auto-detects duplicates and keeps phone numbers, addresses, and EMIs organized.",
    },
    {
      icon: CalendarClock,
      title: "Set loan schedules",
      desc: "Choose daily, weekly, or monthly interest cycles. Our simple-interest calculator generates repayment plans and due reminders instantly.",
    },
    {
      icon: HandCoins,
      title: "Record collections",
      desc: "Mark each customer as paid, not paid, or partially paid. Accept cash, UPI, bank transfers, or split payments across modes.",
    },
    {
      icon: FileBarChart,
      title: "Get reports",
      desc: "Reconcile daily cash, track field agent performance, and export GST-ready reports without touching a spreadsheet.",
    },
  ];
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Paper to digital in four steps</h2>
          <p className="mt-4 text-muted-foreground">No installation, no training. Start tracking collections the same day.</p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-[var(--shadow-elevated)]">
                <div className="flex items-center justify-between">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <span className="font-display text-4xl font-bold text-muted/60">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function IndustryUseCases() {
  const cases = [
    {
      icon: Building2,
      title: "Daily finance companies",
      desc: "Collect small EMIs every day, track field agents, and reconcile handovers at the branch.",
    },
    {
      icon: Percent,
      title: "Monthly money lenders",
      desc: "Manage larger loans with monthly schedules, automatic reminders, and overdue reports.",
    },
    {
      icon: Repeat,
      title: "Chit funds & committees",
      desc: "Track member contributions, payouts, and group balances in one shared workspace.",
    },
    {
      icon: MapPin2,
      title: "Microfinance agents",
      desc: "Plan field routes, record offline collections, and sync when network is back.",
    },
  ];
  return (
    <section className="border-y border-border bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Built for every lender</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Works for every type of finance business</h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c) => (
            <Card key={c.title} className="p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary/15 text-secondary">
                <c.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <section className={"py-20 lg:py-28 " + (withHeader ? "border-y border-border bg-muted/30" : "")}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {withHeader && (
          <div className="text-center">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Questions, answered</h2>
          </div>
        )}
        <Accordion type="single" collapsible className={withHeader ? "mt-10" : ""}>
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={"i" + i}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function Contact({ withHeader = true }: { withHeader?: boolean }) {
  const [config, setConfig] = useState<PlatformConfig>(getPlatformConfig());
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getPlatformConfig());
    const onConfigChange = () => setConfig(getPlatformConfig());
    window.addEventListener("platform-config-change", onConfigChange);
    return () => window.removeEventListener("platform-config-change", onConfigChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await mastersService.submitContactInquiry({
        first_name: firstName,
        last_name: lastName,
        email,
        mobile_number: phone,
        business_type: businessType,
        message,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            {withHeader && <Badge variant="outline" className="mb-4">Contact</Badge>}
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Talk to our team</h2>
            <p className="mt-4 text-muted-foreground">Book a personalized demo or ask us anything about {config.platformName}.</p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Support & Sales Email</p>
                  <p className="text-sm text-muted-foreground">{config.supportEmail} {config.salesEmail ? `· ${config.salesEmail}` : ""}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Phone & WhatsApp Helpline</p>
                  <p className="text-sm text-muted-foreground">{config.supportMobile} {config.supportWhatsapp ? `(WhatsApp: ${config.supportWhatsapp})` : ""}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPinned className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Registered Office & Hours</p>
                  <p className="text-sm text-muted-foreground">{config.officeAddress}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">{config.businessHours}</p>
                </div>
              </div>
            </div>
          </div>
          <Card className="p-6">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle className="size-12 text-emerald-600 mx-auto" />
                <h3 className="font-display text-xl font-bold">Thank you for reaching out!</h3>
                <p className="text-sm text-muted-foreground">Our team will get back to you within 2 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                {error && (
                  <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><label className="text-xs font-medium">First name</label><Input required placeholder="Rajesh" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" /></div>
                  <div><label className="text-xs font-medium">Last name</label><Input placeholder="Sharma" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" /></div>
                </div>
                <div><label className="text-xs font-medium">Email</label><Input type="email" required placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
                <div><label className="text-xs font-medium">Phone</label><Input required placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" /></div>
                <div><label className="text-xs font-medium">Business type</label><Input placeholder="Daily finance / Chit fund / Micro-lender" value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="mt-1.5" /></div>
                <div><label className="text-xs font-medium">Message</label><Textarea rows={4} placeholder="Tell us a little about your business..." value={message} onChange={(e) => setMessage(e.target.value)} required className="mt-1.5" /></div>
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? "Sending..." : "Send message"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

export function SecurityTrust() {
  const items = [
    {
      icon: Lock,
      title: "Bank-grade Security",
      desc: "All financial data is encrypted in transit and at rest using AES-256 and SSL/TLS.",
    },
    {
      icon: ShieldCheck,
      title: "Role-based Access",
      desc: "Restrict sensitive financial records and customer contact details based on user roles.",
    },
    {
      icon: Server,
      title: "99.9% Uptime SLA",
      desc: "Hosted on resilient cloud infrastructure with daily automated backups.",
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Security & Reliability</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Your data is safe with FinRoute</h2>
          <p className="mt-4 text-muted-foreground">Built with enterprise-grade data protection standards for finance professionals.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title} className="p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-tr from-primary via-primary to-primary-glow p-10 text-primary-foreground shadow-[var(--shadow-glow)] sm:p-14">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h3 className="font-display text-2xl font-bold sm:text-3xl">Start with the free collection book today</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">No credit card. Upgrade only when you're ready.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                <Link to="/register">Start Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">Book a demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
