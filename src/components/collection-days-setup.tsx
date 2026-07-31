import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, CheckCircle2, Sparkles, AlertCircle, RefreshCw, Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { guestWorkspaceService, WorkspaceData } from "@/lib/services/guest-workspace-service";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function CollectionDaysSetup({
  onSetupComplete,
}: {
  onSetupComplete?: (updated: WorkspaceData) => void;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const ws = await guestWorkspaceService.getWorkspace();
      setWorkspace(ws);
      const existing = ws.allowed_collection_days || [];
      setSelectedDays(existing);

      const allowedMax = ws.max_allowed_collection_days || 1;
      // Auto-open modal if user hasn't configured their collection days yet
      if (existing.length === 0 || existing.length < allowedMax) {
        setOpenModal(true);
      }
    } catch (err) {
      console.error("Failed to load workspace settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const maxAllowed = workspace?.max_allowed_collection_days || 1;
  const planName = workspace?.subscription_plan === "premium" ? "Paid Add-On Plan" : "Free Plan";

  const toggleDay = (dayKey: string) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayKey));
    } else {
      if (selectedDays.length >= maxAllowed) {
        toast.error(`Your ${planName} allows maximum ${maxAllowed} collection day${maxAllowed > 1 ? "s" : ""} per week.`);
        return;
      }
      setSelectedDays([...selectedDays, dayKey]);
    }
  };

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      toast.error("Please select at least 1 operating day for collections.");
      return;
    }
    setSaving(true);
    try {
      const updated = await guestWorkspaceService.updateWorkspace({
        allowed_collection_days: selectedDays,
      });
      setWorkspace(updated);
      toast.success("Collection operating days saved successfully!");
      setOpenModal(false);
      if (onSetupComplete) onSetupComplete(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to save collection days.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !workspace) return null;

  return (
    <>
      {/* Configure Days Banner Card on Dashboard */}
      <Card className="p-5 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                {planName} ({maxAllowed} Day{maxAllowed > 1 ? "s" : ""}/Wk)
              </Badge>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-500/20">
                Unlimited Borrowers
              </Badge>
            </div>
            <h3 className="font-display text-base font-bold text-foreground">
              Configured Collection Days:{" "}
              {selectedDays.length > 0 ? (
                <span className="text-primary font-mono capitalize">
                  {selectedDays.map((d) => DAYS_OF_WEEK.find((w) => w.key === d)?.label).join(", ")}
                </span>
              ) : (
                <span className="text-amber-600 font-semibold italic">Not Configured Yet</span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Select which day(s) your business operates on to filter collections and routes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setOpenModal(true)} size="sm" variant="outline" className="text-xs gap-1.5 border-primary/40 text-primary">
              <Settings2 className="size-3.5" /> Configure Days
            </Button>
            {workspace.subscription_plan === "free" && (
              <Button asChild size="sm" className="text-xs gap-1.5">
                <Link to="/app/upgrade">
                  <Sparkles className="size-3.5" /> Upgrade Plan
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* SETUP COLLECTION DAYS DIALOG MODAL */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Calendar className="size-5" /> Select Weekly Collection Days
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Your <b>{planName}</b> permits operating on <b>{maxAllowed} Collection Day{maxAllowed > 1 ? "s" : ""} per week</b> with <b>Unlimited Borrowers</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-lg bg-muted">
              <span>Selected Operating Days:</span>
              <span className="font-mono text-primary font-bold">
                {selectedDays.length} / {maxAllowed} Days
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span>{day.label}</span>
                    {isSelected && <CheckCircle2 className="size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedDays.length >= maxAllowed && workspace.subscription_plan === "free" && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="size-4 shrink-0" />
                  Need more collection operating days?
                </span>
                <Button asChild size="sm" variant="outline" className="h-7 text-[11px] border-amber-500/30">
                  <Link to="/app/upgrade">Upgrade</Link>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setOpenModal(false)} disabled={saving} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || selectedDays.length === 0} className="bg-primary text-primary-foreground text-xs font-bold">
              {saving ? "Saving..." : "Save Operating Days"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
