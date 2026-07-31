import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Twitter, Linkedin, Facebook, Youtube, Instagram, Phone, Mail, MapPin, Building2, Smartphone, ShieldCheck } from "lucide-react";
import { getPlatformConfig, PlatformConfig } from "@/lib/platform-config";

export function SiteFooter() {
  const [config, setConfig] = useState<PlatformConfig>(getPlatformConfig());

  useEffect(() => {
    setConfig(getPlatformConfig());
    const onConfigChange = () => setConfig(getPlatformConfig());
    window.addEventListener("platform-config-change", onConfigChange);
    return () => window.removeEventListener("platform-config-change", onConfigChange);
  }, []);

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-6 lg:px-8">
        <div className="lg:col-span-2 space-y-4">
          <img src="/footer_logo.png" alt="FinRoute" className="h-10 w-auto object-contain" />
          <p className="max-w-sm text-sm text-muted-foreground">
            The modern ERP for daily, weekly and monthly finance businesses. Replace
            paper notebooks with a digital collection book.
          </p>

          {/* Contact Details */}
          <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 text-primary" />
              <span>{config.supportMobile} (Support)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-primary" />
              <a href={`mailto:${config.supportEmail}`} className="hover:underline">{config.supportEmail}</a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate max-w-xs">{config.officeAddress}</span>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex flex-wrap gap-2 pt-2">
            {config.twitterUrl && (
              <a href={config.twitterUrl} target="_blank" rel="noreferrer" aria-label="Twitter" className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-background hover:text-foreground">
                <Twitter className="size-4" />
              </a>
            )}
            {config.linkedinUrl && (
              <a href={config.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-background hover:text-foreground">
                <Linkedin className="size-4" />
              </a>
            )}
            {config.facebookUrl && (
              <a href={config.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-background hover:text-foreground">
                <Facebook className="size-4" />
              </a>
            )}
            {config.youtubeUrl && (
              <a href={config.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube" className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-background hover:text-foreground">
                <Youtube className="size-4" />
              </a>
            )}
            {config.instagramUrl && (
              <a href={config.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-background hover:text-foreground">
                <Instagram className="size-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
            <li><Link to="/guest-workspace" className="hover:text-foreground">Guest Workspace</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/addons" className="hover:text-foreground">Add-ons</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Legal & Policies</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground font-medium">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground font-medium">Terms of Service</Link></li>
            <li><Link to="/platform-policies" className="hover:text-foreground font-medium">Refund & Platform Policies</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact & Grievances</Link></li>
          </ul>
        </div>

        {/* Platform Portal Links */}
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-3">
            <li>
              <Link to="/erp" className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Building2 className="size-3.5" />
                </span>
                <span>
                  <span className="block font-medium leading-none">ERP Portal</span>
                  <span className="text-xs opacity-70">Lender management</span>
                </span>
              </Link>
            </li>
            <li>
              <Link to="/field" className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Smartphone className="size-3.5" />
                </span>
                <span>
                  <span className="block font-medium leading-none">Field App</span>
                  <span className="text-xs opacity-70">Collector mobile app</span>
                </span>
              </Link>
            </li>
            <li>
              <Link to="/admin" className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <ShieldCheck className="size-3.5" />
                </span>
                <span>
                  <span className="block font-medium leading-none">Admin Console</span>
                  <span className="text-xs opacity-70">Super admin panel</span>
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {config.platformName} Technologies Pvt. Ltd. All rights reserved.</p>
          <p>Made with care for Indian finance businesses.</p>
        </div>
      </div>
    </footer>
  );
}
