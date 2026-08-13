import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Plus, Pencil, Trash2, Users } from "lucide-react";
import { guestWorkspaceService, WorkspaceData, CollectionLine } from "@/lib/services/guest-workspace-service";
import { LineSetupDialog } from "@/components/line-setup-dialog";

export function CollectionDaysSetup({
  onSetupComplete,
}: {
  onSetupComplete?: (updated: WorkspaceData) => void;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [lines, setLines] = useState<CollectionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [lineToEdit, setLineToEdit] = useState<CollectionLine | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ws, linesData] = await Promise.all([
        guestWorkspaceService.getWorkspace(),
        guestWorkspaceService.getLines(),
      ]);
      setWorkspace(ws);
      setLines(linesData || []);
    } catch (err) {
      console.error("Failed to load workspace or lines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return null;

  return (
    <>
      <Card className="p-4 bg-card border-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Current Week Activity & Configured Route Lines</h3>
                <Badge variant={workspace?.subscription_plan === "premium" ? "default" : "secondary"} className="capitalize text-[10px]">
                  {lines.length} Line{lines.length !== 1 ? "s" : ""} Configured
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your collection route name, area/location details, and assigned day time slot sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLineToEdit(null);
                setIsLineModalOpen(true);
              }}
              className="h-8 px-2.5 text-xs font-semibold gap-1 bg-background border-primary/30 text-primary hover:bg-primary/10"
            >
              <Plus className="size-3.5" /> Manage / Add Collection Line
            </Button>
          </div>
        </div>

        {/* Route Lines Grid */}
        {lines.length === 0 ? (
          <div className="p-4 text-center border border-dashed rounded-xl bg-muted/20 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">No collection route lines configured yet.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLineToEdit(null);
                setIsLineModalOpen(true);
              }}
              className="text-xs font-semibold gap-1 text-primary border-primary/40"
            >
              <Plus className="size-3.5" /> Create Your First Route Line
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lines.map((ln) => (
              <div key={ln.public_id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" /> {ln.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30 font-bold">
                      <Users className="size-3" /> {ln.customers_count ?? 0} Borrower{(ln.customers_count ?? 0) !== 1 ? "s" : ""}
                    </Badge>
                    {ln.area && <Badge variant="outline" className="text-[10px] font-normal">{ln.area}</Badge>}

                    <div className="flex items-center gap-0.5 ml-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                        title="Edit Line"
                        onClick={() => {
                          setLineToEdit(ln);
                          setIsLineModalOpen(true);
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md"
                        title="Delete Line"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete line "${ln.name}"?`)) {
                            try {
                              await guestWorkspaceService.deleteLine(ln.public_id);
                              await loadData();
                            } catch (err: any) {
                              alert(err?.message || "Failed to delete line");
                            }
                          }
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                  {ln.day_schedules?.map((sched) => (
                    <Badge
                      key={sched.day_of_week}
                      variant="secondary"
                      className="text-[10px] capitalize px-1.5 py-0.5 font-medium border"
                    >
                      {sched.day_of_week.slice(0, 3)}: {sched.portion === "morning" ? "🌅 Morn" : sched.portion === "afternoon" ? "🌆 Aft" : "☀️ Full"}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <LineSetupDialog
        open={isLineModalOpen}
        onOpenChange={setIsLineModalOpen}
        lineToEdit={lineToEdit}
        onSuccess={() => {
          loadData();
          if (onSetupComplete && workspace) onSetupComplete(workspace);
        }}
      />
    </>
  );
}
