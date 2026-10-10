import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sun, Moon, Plus, Loader2, Trash2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { guestWorkspaceService, CollectionLine, WorkspaceData } from "@/lib/services/guest-workspace-service";

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
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [existingLines, setExistingLines] = useState<CollectionLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      loadData();
    }
  }, [open, lineToEdit]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ws, linesData, portions] = await Promise.all([
        guestWorkspaceService.getWorkspace(),
        guestWorkspaceService.getLines(),
        guestWorkspaceService.getAvailablePortions(lineToEdit?.public_id),
      ]);
      setWorkspace(ws);
      setExistingLines(linesData || []);
      setAvailablePortions(portions || {});
    } catch (err) {
      console.error("Failed to load line setup data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateLineSlots = (schedules: Record<string, "morning" | "afternoon" | "both">) => {
    return Object.values(schedules).reduce((sum, portion) => sum + (portion === "both" ? 2 : 1), 0);
  };

  const otherLinesSlots = existingLines
    .filter((l) => !lineToEdit || l.public_id !== lineToEdit.public_id)
    .reduce((sum, l) => {
      const lineSum = (l.day_schedules || []).reduce((s, sched) => s + (sched.portion === "both" ? 2 : 1), 0);
      return sum + lineSum;
    }, 0);

  const currentLineSlots = calculateLineSlots(selectedSchedules);
  const totalSlotsUsed = otherLinesSlots + currentLineSlots;
  const isSlotsExhausted = totalSlotsUsed > 14;

  const handleToggleDayPortion = (day: string, portion: "morning" | "afternoon" | "both") => {
    setSelectedSchedules((prev) => {
      const current = prev[day];
      if (current === portion) {
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: portion };
    });
  };

  const handleDelete = async () => {
    if (!lineToEdit) return;
    if (!confirm(`Are you sure you want to delete collection line "${lineToEdit.name}"?`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await guestWorkspaceService.deleteLine(lineToEdit.public_id);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to delete collection line.");
    } finally {
      setDeleting(false);
    }
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
      setError("Please select at least one collection day session for this line.");
      return;
    }

    if (totalSlotsUsed > 14) {
      setError(`Maximum weekly operating capacity reached (${totalSlotsUsed}/14 slots). Please unassign a session on another line.`);
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
      <DialogContent className="max-w-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
            <MapPin className="size-5 text-primary shrink-0" />
            {lineToEdit ? "Edit Collection Line (Route)" : "Configure New Collection Line (Route)"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-xs text-muted-foreground space-y-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Line / Business Route Name *</Label>
              <Input
                placeholder="e.g. Line 1 — Market Area"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Area / Locality Details</Label>
              <Input
                placeholder="e.g. Kukatpally Sector 4, Main Road"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* 2. Collection Days & Portion Selection */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="size-4 text-primary" />
                Assign Days & Time Portions
              </Label>
              <Badge variant="outline" className={`text-[10px] sm:text-xs font-mono font-bold ${totalSlotsUsed > 14 ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"}`}>
                {totalSlotsUsed} / 14 Weekly Slots Used
              </Badge>
            </div>

            {loading ? (
              <div className="py-6 flex justify-center text-muted-foreground text-xs gap-2 items-center">
                <Loader2 className="size-4 animate-spin text-primary" /> Loading day availability...
              </div>
            ) : (
              <div className="space-y-2">
                {isSlotsExhausted && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-1 text-left my-2">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs">
                      <Sparkles className="size-3.5 text-rose-600" /> Weekly Time-Slot Capacity Reached ({totalSlotsUsed}/14 Slots Occupied)
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      A week has 7 days with 2 operating shifts per day (14 slots total). Deselect a shift on another line to assign this session.
                    </p>
                  </div>
                )}
                {DAYS_OF_WEEK.map(({ key: dayKey, label: dayLabel }) => {
                  const currentPortion = selectedSchedules[dayKey];
                  const avail = availablePortions[dayKey] || ["morning", "afternoon", "both"];
                  const canMorning = avail.includes("morning") || currentPortion === "morning";
                  const canAfternoon = avail.includes("afternoon") || currentPortion === "afternoon";
                  const canBoth = avail.includes("both") || currentPortion === "both";

                  return (
                    <div key={dayKey} className="p-2.5 bg-muted/40 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="text-xs font-bold sm:w-24">{dayLabel}</span>
                        {currentPortion && (
                          <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold px-1.5 py-0">
                            Selected
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
                        <Button
                          type="button"
                          size="sm"
                          variant={currentPortion === "morning" ? "default" : "outline"}
                          disabled={!canMorning}
                          onClick={() => handleToggleDayPortion(dayKey, "morning")}
                          className={`h-8 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-medium gap-1 justify-center ${
                            currentPortion === "morning" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                          }`}
                        >
                          <Sun className="size-3 shrink-0" />
                          <span className="hidden sm:inline">Morning (1am–1pm)</span>
                          <span className="sm:hidden">Morning</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={currentPortion === "afternoon" ? "default" : "outline"}
                          disabled={!canAfternoon}
                          onClick={() => handleToggleDayPortion(dayKey, "afternoon")}
                          className={`h-8 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-medium gap-1 justify-center ${
                            currentPortion === "afternoon" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                          }`}
                        >
                          <Moon className="size-3 shrink-0" />
                          <span className="hidden sm:inline">Afternoon (1pm–12am)</span>
                          <span className="sm:hidden">Afternoon</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={currentPortion === "both" ? "default" : "outline"}
                          disabled={!canBoth}
                          onClick={() => handleToggleDayPortion(dayKey, "both")}
                          className={`h-8 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-medium gap-1 justify-center ${
                            currentPortion === "both" ? "bg-primary text-primary-foreground" : ""
                          }`}
                        >
                          <span className="hidden sm:inline">Full Day (Both)</span>
                          <span className="sm:hidden">Full Day</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full gap-2 pt-2 border-t">
          {lineToEdit ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="gap-1 font-semibold text-xs h-8"
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete Line
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving || deleting} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || deleting || isSlotsExhausted} className="h-8 text-xs font-bold">
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...
                </>
              ) : lineToEdit ? (
                "Save Line Updates"
              ) : (
                <>
                  <Plus className="size-3.5 mr-1.5" /> Create Line
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
