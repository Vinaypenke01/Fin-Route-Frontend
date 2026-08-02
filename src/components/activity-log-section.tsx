import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Filter, Calendar, RotateCcw } from "lucide-react";
import { authService, AuditLogItem } from "@/lib/services/auth-service";

export function ActivityLogSection() {
  const [activities, setActivities] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [action, setAction] = useState("all");
  const [day, setDay] = useState("all");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await authService.getActivityLogs({
        action,
        day,
        date,
        search,
        page,
        page_size: 7,
      });
      setActivities(res.items);
      setTotalCount(res.count);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [action, day, date, search, page]);

  const handleResetFilters = () => {
    setAction("all");
    setDay("all");
    setDate("");
    setSearch("");
    setPage(1);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-base">User Actions & Audit Logs</h3>
          <p className="text-xs text-muted-foreground">
            Complete timeline of logins, updates, customer creation, collections, and administrative actions.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 bg-muted/40 p-3 rounded-lg border border-border">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search description..."
              className="pl-8 h-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Action Filter */}
          <div className="w-[140px]">
            <Select
              value={action}
              onValueChange={(val) => {
                setAction(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day of Week Filter */}
          <div className="w-[130px]">
            <Select
              value={day}
              onValueChange={(val) => {
                setDay(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Day of Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="w-[140px] relative">
            <Input
              type="date"
              className="h-9 text-xs"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Reset Filters */}
          {(action !== "all" || day !== "all" || date || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>

        {/* Activity Items List */}
        <div className="space-y-2.5">
          {loading ? (
            <p className="text-center py-8 text-xs text-muted-foreground">Loading activity logs...</p>
          ) : activities.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              No matching activity logs found for the selected filters.
            </p>
          ) : (
            activities.map((l) => {
              const actUpper = (l.action || "INFO").toUpperCase();
              let badgeColor = "bg-primary/10 text-primary border-primary/20";
              if (actUpper === "LOGIN") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
              if (actUpper === "CREATE") badgeColor = "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
              if (actUpper === "UPDATE") badgeColor = "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
              if (actUpper === "DELETE") badgeColor = "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300";

              return (
                <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border p-3.5 hover:bg-muted/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${badgeColor}`}>
                        {actUpper}
                      </span>
                      <span className="font-semibold text-sm">{l.description || l.target_model}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      IP: {l.ip_address || "Localhost"} · {l.user_agent ? l.user_agent.substring(0, 45) + "..." : "Web Browser"}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {new Date(l.created_at).toLocaleString("en-IN", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              Showing page <span className="font-bold text-foreground">{page}</span> of{" "}
              <span className="font-bold text-foreground">{totalPages}</span> ({totalCount} total actions)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 text-xs gap-1"
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
