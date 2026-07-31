import { useEffect, useState, useCallback } from "react";
import { Download, X, Share, Plus, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Status = "installed" | "installable" | "ios" | "unsupported";

const DISMISS_KEY = "finroute-install-dismissed-v1";

function detectIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const iPadOS =
    navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function useInstallPromptState() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [status, setStatus] = useState<Status>("unsupported");

  useEffect(() => {
    if (isStandalone()) {
      setStatus("installed");
      return;
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setStatus("installable");
    };
    const onInstalled = () => {
      setStatus("installed");
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    if (detectIOS()) setStatus((s) => (s === "unsupported" ? "ios" : s));
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return null;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setStatus("installed");
    return choice.outcome;
  }, [deferred]);

  return { status, promptInstall, canPrompt: !!deferred };
}

export function InstallStatusBadge({ className }: { className?: string }) {
  const { status } = useInstallPromptState();
  if (status === "installed")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success", className)}>
        <CheckCircle2 className="size-3" /> Installed
      </span>
    );
  if (status === "installable" || status === "ios")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary", className)}>
        <Smartphone className="size-3" /> Installable
      </span>
    );
  return null;
}

export function InstallPrompt({
  appName = "FinRoute",
  variant = "banner",
}: {
  appName?: string;
  variant?: "banner" | "floating";
}) {
  const { status, promptInstall } = useInstallPromptState();
  const [dismissed, setDismissed] = useState(true);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const close = () => {
    setDismissed(true);
    setShowIOS(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  if (status === "installed" || status === "unsupported" || dismissed) return null;

  const onClick = async () => {
    if (status === "ios") {
      setShowIOS(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "dismissed") close();
  };

  const wrap = cn(
    "fixed left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur",
    variant === "floating" ? "bottom-24 sm:bottom-6" : "bottom-4",
  );

  return (
    <>
      <div className={wrap} role="dialog" aria-label={`Install ${appName}`}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Download className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install {appName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {status === "ios"
                ? "Add to Home Screen from Safari for a full-screen app experience."
                : "Get instant launch and full-screen app experience on your phone."}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" onClick={onClick}>
                {status === "ios" ? "How to install" : "Install app"}
              </Button>
              <Button size="sm" variant="ghost" onClick={close}>Not now</Button>
            </div>
          </div>
          <button
            aria-label="Dismiss install prompt"
            onClick={close}
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {showIOS && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setShowIOS(false)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="size-4" />
              </span>
              <h3 className="font-display text-base font-semibold">Install on iPhone / iPad</h3>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">1</span>
                <span>Tap the <Share className="mx-1 inline size-4 text-primary" /> Share icon at the bottom of Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">2</span>
                <span>Scroll and choose <b className="text-foreground">Add to Home Screen</b> <Plus className="mx-1 inline size-4" />.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">3</span>
                <span>Tap <b className="text-foreground">Add</b> — {appName} appears on your home screen.</span>
              </li>
            </ol>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => setShowIOS(false)}>Got it</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
