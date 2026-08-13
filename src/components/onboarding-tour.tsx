import { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, X, Sparkles } from "lucide-react";

const STORAGE_KEY = "finroute-onboarded-v1";

type Step = {
  target?: string; // data-tour attribute value; omit for centered welcome
  title: string;
  body: string;
  placement?: "right" | "bottom" | "left" | "top";
};

const STEPS: Step[] = [
  {
    title: "Welcome to FinRoute",
    body: "A 60-second tour of your Guest Workspace — the free digital collection book. You can replay this any time from Settings.",
  },
  {
    target: "sidebar-dashboard",
    title: "Dashboard",
    body: "Your daily heartbeat — today's collections, overdue accounts, cash-in-hand and trends at a glance.",
    placement: "right",
  },
  {
    target: "sidebar-customers",
    title: "Customers",
    body: "Every borrower with their loan, EMI, area and outstanding balance. Add, filter, and open a profile in one click.",
    placement: "right",
  },
  {
    target: "sidebar-collections",
    title: "Collections",
    body: "Your digital register replaces the paper notebook. Every receipt is searchable, editable and exportable.",
    placement: "right",
  },
  {
    target: "header-search",
    title: "Global search",
    body: "Jump to any customer or receipt from anywhere. Try their name, ID or phone number.",
    placement: "bottom",
  },
  {
    target: "header-theme",
    title: "Dark mode",
    body: "Switch between light and dark themes. Your choice is remembered on this device.",
    placement: "bottom",
  },
  {
    target: "header-upgrade",
    title: "Ready for more?",
    body: "Unlock unlimited customers, WhatsApp reminders, field agents and priority support when you're ready.",
    placement: "bottom",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function useTargetRect(selector: string | undefined): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const id = window.setInterval(measure, 400); // reposition if sidebar collapses etc.
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.clearInterval(id);
    };
  }, [selector]);
  return rect;
}

export function OnboardingTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const rect = useTargetRect(step?.target);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  if (!open) return null;

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    onClose();
  };
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish());
  const prev = () => i > 0 && setI(i - 1);

  // Positioning
  const cardW = 340;
  const cardH = 200;
  const gap = 12;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let cardStyle: React.CSSProperties;
  const placement = step.placement ?? "right";
  if (!rect) {
    // Centered welcome/final
    cardStyle = {
      top: vh / 2 - cardH / 2,
      left: vw / 2 - cardW / 2,
    };
  } else if (placement === "right") {
    cardStyle = { top: Math.max(16, rect.top), left: Math.min(vw - cardW - 16, rect.left + rect.width + gap) };
  } else if (placement === "left") {
    cardStyle = { top: Math.max(16, rect.top), left: Math.max(16, rect.left - cardW - gap) };
  } else if (placement === "bottom") {
    cardStyle = {
      top: Math.min(vh - cardH - 16, rect.top + rect.height + gap),
      left: Math.max(16, Math.min(vw - cardW - 16, rect.left + rect.width / 2 - cardW / 2)),
    };
  } else {
    cardStyle = {
      top: Math.max(16, rect.top - cardH - gap),
      left: Math.max(16, Math.min(vw - cardW - 16, rect.left + rect.width / 2 - cardW / 2)),
    };
  }

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      {/* SVG Mask Backdrop Spotlight Cutout */}
      {rect ? (
        <svg
          className="absolute inset-0 size-full z-0 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            finish();
          }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              {/* Full screen white mask = dark backdrop visible */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cutout = transparent unblurred spotlight hole */}
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx="8"
                ry="8"
                fill="black"
              />
            </mask>
          </defs>
          {/* Dark backdrop with spotlight hole cut out */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div
          className="absolute inset-0 bg-black/65 transition-opacity z-0 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            finish();
          }}
        />
      )}

      {/* Glowing spotlight ring around the highlighted clear target element */}
      {rect && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg ring-2 ring-primary shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

      {/* Card */}
      <div
        className="absolute z-20 w-[340px] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl pointer-events-auto transition-all"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Step {i + 1} of {STEPS.length}
              </p>
              <h3 className="font-display text-sm font-bold leading-tight">{step.title}</h3>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close tour"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              finish();
            }}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{step.body}</p>
        </div>
        <div className="flex items-center justify-between border-t border-border p-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to step ${idx + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setI(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === i ? "w-4 bg-primary" : "w-1.5 bg-muted hover:bg-primary/50"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {i > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prev();
                }}
              >
                <ArrowLeft className="size-3.5" /> Back
              </Button>
            )}
            {i < STEPS.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  next();
                }}
              >
                Next <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  finish();
                }}
              >
                <Badge variant="secondary" className="mr-1">Done</Badge> Get started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);
  return { open, start: () => setOpen(true), close: () => setOpen(false) };
}
