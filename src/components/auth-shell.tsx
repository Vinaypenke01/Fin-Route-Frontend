import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="hero-gradient absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/">
            <img src="/footer_logo.png" alt="FinRoute" className="h-9 w-auto object-contain" />
          </Link>
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">Replace paper notebooks with a beautiful digital collection book.</h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">Trusted by 1,200+ finance businesses across India for daily, weekly and monthly lending.</p>
            <div className="mt-8 grid gap-2 text-sm">
              {["Free forever Guest Workspace", "Smart loan calculator built-in", "GPS-tracked field collections"].map((t) => (
                <div key={t} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-secondary" />{t}</div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FinRoute Technologies</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/footer_logo.png" alt="FinRoute" className="h-9 w-auto object-contain" />
          </Link>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
