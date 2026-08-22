import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Plus,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  ChevronRight,
  Edit3,
} from "lucide-react";
import { CollectionLine } from "@/lib/services/guest-workspace-service";

export function Level1LinesView({
  lines,
  loading,
  onSelectLine,
  onAddLineClick,
  onEditLineClick,
}: {
  lines: CollectionLine[];
  loading: boolean;
  onSelectLine: (line: CollectionLine) => void;
  onAddLineClick: () => void;
  onEditLineClick: (line: CollectionLine, e: React.MouseEvent) => void;
}) {
  const totalCustomersCount = lines.reduce(
    (acc, line) => acc + (line.customers_count || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Level 1 Header Banner */}
      <div className="bg-card p-6 rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Layers className="size-6 text-primary" /> Collection Route Lines
            </h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-extrabold px-3 py-1 gap-1.5 rounded-xl">
              <Users className="size-3.5" /> Total Borrowers: {totalCustomersCount}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Select a route line to view weekly route cycles, manage collection days, and log daily sheets.
          </p>
        </div>

        <Button
          onClick={onAddLineClick}
          size="sm"
          className="bg-primary text-primary-foreground font-bold gap-1.5 shadow-xs rounded-xl self-start sm:self-auto"
        >
          <Plus className="size-4" /> Create Route Line
        </Button>
      </div>

      {/* Lines Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading collection route lines...</div>
      ) : lines.length === 0 ? (
        <Card className="p-12 text-center space-y-3 rounded-3xl border-dashed border-2 border-border">
          <Layers className="size-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold">No Collection Lines Configured</h3>
          <p className="text-xs text-muted-foreground">Get started by setting up your first route collection line.</p>
          <Button onClick={onAddLineClick} size="sm" className="bg-primary text-primary-foreground font-bold gap-1.5">
            <Plus className="size-4" /> Add Collection Line
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lines.map((line) => {
            const uniqueDays = Array.from(
              new Set((line.day_schedules || []).map((s) => s.day_of_week.toLowerCase()))
            );

            return (
              <Card
                key={line.public_id}
                onClick={() => onSelectLine(line)}
                className="group relative rounded-3xl border border-border bg-card p-5 space-y-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {line.name}
                      </h3>
                      {line.is_active && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                          Active Route
                        </Badge>
                      )}
                    </div>
                    {line.area && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3.5 text-muted-foreground shrink-0" /> {line.area}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl opacity-80 hover:opacity-100 hover:bg-muted"
                    onClick={(e) => onEditLineClick(line, e)}
                    title="Configure Route Schedules"
                  >
                    <Edit3 className="size-4 text-muted-foreground" />
                  </Button>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="size-3.5 text-primary" /> Active Borrowers
                    </span>
                    <Badge variant="secondary" className="font-mono font-bold">
                      {line.customers_count || 0}
                    </Badge>
                  </div>

                  {/* Weekday & Session Schedule Badges */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Configured Days & Sessions:
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => onEditLineClick(line, e)}
                        className="h-6 text-[10px] font-bold gap-1 rounded-lg px-2 text-primary border-primary/30 hover:bg-primary/10"
                        title="Change days or sessions"
                      >
                        <Edit3 className="size-3" /> Edit Days & Sessions
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {line.day_schedules && line.day_schedules.length > 0 ? (
                        line.day_schedules.map((s) => {
                          const icon = s.portion === "morning" ? "☀️" : s.portion === "afternoon" ? "🌙" : "🌕";
                          return (
                            <Badge
                              key={`${s.day_of_week}_${s.portion}`}
                              className="bg-primary/10 text-primary border-primary/20 capitalize text-[10px] font-semibold gap-1"
                            >
                              <span>{icon}</span> {s.day_of_week}
                            </Badge>
                          );
                        })
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">No Days Configured</Badge>
                      )}
                    </div>
                  </div>

                  {/* Bottom Transition Prompt */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-primary font-bold">
                    <span>View Collection Schedules</span>
                    <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
