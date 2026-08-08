import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sun, Moon, Check, Plus, Loader2 } from "lucide-react";
import { guestWorkspaceService, CollectionLine } from "@/lib/services/guest-workspace-service";

interface LineSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineToEdit?: CollectionLine | null;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function LineSetupDialog({ open, onOpenChange, lineToEdit, onSuccess }: LineSetupDialogProps) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [selectedSchedules, setSelectedSchedules] = useState<Record<string, "morning" | "afternoon" | "both">>({});
  const [availablePortions, setAvailablePortions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (lineToEdit) {
        setName(lineToEdit.name || "");
        setArea(lineToEdit.area || "");
        const initSched: Record<string, "morning" | "afternoon" | "both"> = {};
        lineToEdit.day_schedules?.forEach((s) => {
          initSched[s.day_of_week.toLowerCase()] = s.portion as any;
        });
        setSelectedSchedules(initSched);
      } else {
        setName("");
        setArea("");
        setSelectedSchedules({});
      }
      loadAvailablePortions();
    }
  }, [open, lineToEdit]);

  const loadAvailablePortions = async () => {
    setLoading(true);
    try {
      const res = await guestWorkspaceService.getAvailablePortions(lineToEdit?.public_id);
      setAvailablePortions(res || {});
    } catch (err) {
      console.error("Failed to load available portions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDayPortion = (day: string, portion: "morning" | "afternoon" | "both") => {
    setSelectedSchedules((prev) => {
      const current = prev[day];
      if (current === portion) {
        // Deselect day
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: portion };
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a Line / Business Route Name.");
      return;
    }

    const schedulesList = Object.entries(selectedSchedules).map(([day, portion]) => ({
      day_of_week: day,
      portion: portion,
    }));

    if (schedulesList.length === 0) {
      setError("Please select at least one collection day for this line.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (lineToEdit) {
        await guestWorkspaceService.updateLine(lineToEdit.public_id, {
          name: name.trim(),
          area: area.trim(),
          schedules: schedulesList,
        });
      } else {
        await guestWorkspaceService.createLine({
          name: name.trim(),
          area: area.trim(),
          schedules: schedulesList,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save collection line.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="size-5 text-primary" />
            {lineToEdit ? "Edit Collection Line (Route)" : "Configure New Collection Line (Route)"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-1">
              <span>Set up your collection route name, area details, and assigned day time slots.</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* 1. Line Name & Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Line / Business Route Name *</Label>
              <Input
                placeholder="e.g. Line 1 — Market Area"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Area / Locality Details</Label>
              <Input
                placeholder="e.g. Kukatpally Sector 4, Main Road"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* 2. Collection Days & Portion Selection */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="size-4 text-primary" />
                Assign Days & Time Portions
              </Label>
              <span className="text-[11px] text-muted-foreground">Select Morning (1am-1pm), Afternoon (1pm-12am), or Both</span>
            </div>

            {loading ? (
              <div className="py-6 flex justify-center text-muted-foreground text-xs gap-2 items-center">
                <Loader2 className="size-4 animate-spin text-primary" /> Loading day availability...
              </div>
            ) : (
              <div className="space-y-2">
                {DAYS_OF_WEEK.map(({ key: dayKey, label: dayLabel }) => {
                  const currentPortion = selectedSchedules[dayKey];
                  const avail = availablePortions[dayKey] || ["morning", "afternoon", "both"];
                  const canMorning = avail.includes("morning") || currentPortion === "morning";
                  const canAfternoon = avail.includes("afternoon") || currentPortion === "afternoon";
                  const canBoth = avail.includes("both") || currentPortion === "both";

                  return (
                    <div key={dayKey} className="p-2.5 bg-muted/40 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-24">{dayLabel}</span>
                        {currentPortion && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            Selected
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Morning Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant={currentPortion === "morning" ? "default" : "outline"}
                          disabled={!canMorning}
                          onClick={() => handleToggleDayPortion(dayKey, "morning")}
                          className={`h-7 px-2 text-[11px] font-medium gap-1 ${
                            currentPortion === "morning" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                          }`}
                        >
                          <Sun className="size-3" /> Morning (1am–1pm)
                        </Button>

                        {/* Afternoon Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant={currentPortion === "afternoon" ? "default" : "outline"}
                          disabled={!canAfternoon}
                          onClick={() => handleToggleDayPortion(dayKey, "afternoon")}
                          className={`h-7 px-2 text-[11px] font-medium gap-1 ${
                            currentPortion === "afternoon" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                          }`}
                        >
                          <Moon className="size-3" /> Afternoon (1pm–12am)
                        </Button>

                        {/* Both / Full Day Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant={currentPortion === "both" ? "default" : "outline"}
                          disabled={!canBoth}
                          onClick={() => handleToggleDayPortion(dayKey, "both")}
                          className={`h-7 px-2 text-[11px] font-medium gap-1 ${
                            currentPortion === "both" ? "bg-primary text-primary-foreground" : ""
                          }`}
                        >
                          Full Day (Both)
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" /> Saving...
              </>
            ) : lineToEdit ? (
              "Save Line Updates"
            ) : (
              <>
                <Plus className="size-4 mr-1.5" /> Create Line
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
