import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Smartphone, Download, Share, PlusSquare, Monitor, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton({
  variant = "outline",
  size = "default",
  className = "",
  label = "Install App",
  showSubtext = false,
}: {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  showSubtext?: boolean;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (PWA installed)
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // Show guide modal if native prompt is unavailable (iOS Safari / Already prompted)
      setIsGuideOpen(true);
    }
  };

  if (installed) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="size-3.5" /> App Installed
      </div>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleInstallClick}
        className={className}
        title="Install FinRoute App on your phone or desktop"
      >
        <Smartphone className="size-4 mr-1.5 text-emerald-600 shrink-0" />
        <span>{label}</span>
        {showSubtext && <span className="text-[10px] text-muted-foreground ml-1">(PWA)</span>}
      </Button>

      {/* PWA Install Instructions Modal for iOS / Desktop / Android */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="size-5 text-emerald-600" /> Install FinRoute PWA App
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Install FinRoute on your phone or computer for offline access and native app experience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Android / Chrome */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-foreground">
                <Download className="size-4 text-emerald-600" /> Android / Chrome
              </div>
              <p className="text-muted-foreground">
                Tap the <strong>3 dots menu (⋮)</strong> in Chrome top-right corner, then tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
              </p>
            </div>

            {/* iOS Safari */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-foreground">
                <Share className="size-4 text-blue-600" /> iPhone / iPad (Safari)
              </div>
              <p className="text-muted-foreground">
                Tap the <strong>Share button</strong> at the bottom of Safari, scroll down and tap <strong>"Add to Home Screen" <PlusSquare className="inline size-3.5" /></strong>.
              </p>
            </div>

            {/* Desktop */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-foreground">
                <Monitor className="size-4 text-purple-600" /> Desktop Chrome / Edge
              </div>
              <p className="text-muted-foreground">
                Click the <strong>Install Icon <Download className="inline size-3.5" /></strong> on the right side of your browser's address bar.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setIsGuideOpen(false)} className="w-full font-bold">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
