import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calendar, CheckCircle2, Lock } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Customer, WorkspaceData } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";

export const Route = createFileRoute("/app/collections/batch")({
  head: () => ({
    meta: [
      { title: "Batch Collection Entry — FinRoute" },
      { name: "description", content: "Mark collections for multiple borrowers for today." },
    ],
  }),
  component: BatchPage,
});

const ALL_DAYS_LIST = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function BatchPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [configuredDays, setConfiguredDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("all");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statuses, setStatuses] = useState<MasterItem[]>([]);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [collectionDate, setCollectionDate] = useState<string>(today);
  const [batchData, setBatchData] = useState<Record<string, { collected: number | string; status: number; mode: number }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = async () => {
    try {
      const ws = await guestWorkspaceService.getWorkspace();
      setWorkspace(ws);
      const savedDays = ws.allowed_collection_days || [];
      setConfiguredDays(savedDays);
      if (savedDays.length === 1) {
        setSelectedDay(savedDays[0]);
      } else if (savedDays.length > 1) {
        setSelectedDay(savedDays[0]);
      }
    } catch (err) {
      console.error("Workspace load error:", err);
    }
  };

  const loadCustomersAndMasters = async () => {
    setLoading(true);
    try {
      const [custRes, modesRes, statusRes] = await Promise.all([
        guestWorkspaceService.getCustomers({
          status: "active",
          collection_day: selectedDay === "all" ? undefined : selectedDay,
        }),
        mastersService.getPaymentModes(),
        mastersService.getCollectionStatuses(),
      ]);
      const custs = custRes.data || [];
      setCustomers(custs);
      setPaymentModes(modesRes);
      setStatuses(statusRes);

      const initialMap: Record<string, { collected: number | string; status: number; mode: number }> = {};
      custs.forEach((c) => {
        initialMap[c.public_id] = {
          collected: c.installment_amount || c.loan_amount || 0,
          status: statusRes[0]?.id || 1,
          mode: modesRes[0]?.id || 1,
        };
      });
      setBatchData(initialMap);
    } catch (err) {
      console.error("Batch load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    loadCustomersAndMasters();
  }, [selectedDay]);

  const updateCollected = (public_id: string, val: string) => {
    setBatchData((prev) => ({
      ...prev,
      [public_id]: { ...prev[public_id], collected: val },
    }));
  };

  const handleSaveBatch = async () => {
    if (customers.length === 0) return;
    setSubmitting(true);
    setError(null);

    const entries = customers.map((c) => ({
      customer: c.public_id,
      expected_amount: c.installment_amount || c.loan_amount || 0,
      collected_amount: Number(batchData[c.public_id]?.collected) || 0,
      status: batchData[c.public_id]?.status || 1,
      payment_mode: batchData[c.public_id]?.mode || 1,
    }));

    try {
      await guestWorkspaceService.recordBatchCollections({
        collection_date: collectionDate,
        entries,
      });
      navigate({ to: "/app/collections" as any });
    } catch (err: any) {
      if (err.upgradePrompt) {
        setError(`${err.message} (${err.upgradePrompt.message})`);
      } else {
        setError(err.message || "Failed to record batch collections.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isSingleDayPlan = configuredDays.length === 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="size-9">
            <Link to="/app/collections">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Batch Collection Entry</h1>
            <p className="text-xs text-muted-foreground">Record daily/weekly collections for multiple borrowers at once.</p>
          </div>
        </div>

        <Button onClick={handleSaveBatch} disabled={submitting || customers.length === 0}>
          <Save className="size-4 mr-1.5" />
          {submitting ? "Saving..." : `Save All Collections (${customers.length})`}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      {/* Collection Route Day Selection Header Card */}
      <Card className="p-4 space-y-3 bg-card border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Select Collection Day Route</h3>
              <p className="text-xs text-muted-foreground">Load active borrowers assigned to this collection day.</p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs capitalize">
            {selectedDay === "all" ? "All Route Days" : `Route Day: ${selectedDay}`}
          </Badge>
        </div>

        {configuredDays.length === 0 ? (
          <div className="p-3 text-xs text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
            <Lock className="size-4 shrink-0 text-amber-600" />
            <span>No collection days configured yet. Please configure your workspace collection day(s) under Customers first.</span>
          </div>
        ) : isSingleDayPlan ? (
          <div className="flex items-center gap-2 pt-1">
            <div className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Active Route Day: <span className="capitalize">{configuredDays[0]}</span>
            </div>
            <span className="text-xs text-muted-foreground">(Assigned day based on your plan)</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedDay("all")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                selectedDay === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              All Configured Days ({configuredDays.length})
            </button>

            {configuredDays.map((dKey) => {
              const dayObj = ALL_DAYS_LIST.find((d) => d.key === dKey);
              const isSelected = selectedDay === dKey;
              return (
                <button
                  key={dKey}
                  type="button"
                  onClick={() => setSelectedDay(dKey)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 capitalize ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  <CheckCircle2 className={`size-3.5 ${isSelected ? "text-primary-foreground" : "text-emerald-500"}`} />
                  {dayObj?.label || dKey}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <label className="text-xs font-medium">Collection Date *</label>
            <Input
              type="date"
              className="mt-1"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Code & Name</TableHead>
                <TableHead>Collection Day</TableHead>
                <TableHead>Per Installment (₹)</TableHead>
                <TableHead>Collected Amount (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    Loading route borrowers...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No active borrowers found for {selectedDay === "all" ? "any day" : selectedDay}.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.public_id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{c.full_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{c.customer_code} • {c.mobile_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px] capitalize bg-primary/5 text-primary border-primary/20">
                        {c.collection_day || "monday"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-xs">{inr(c.installment_amount || c.loan_amount || 0)}</TableCell>
                    <TableCell>
                      {(() => {
                        const currentStatusId = batchData[c.public_id]?.status;
                        const st = statuses.find((s) => s.id === currentStatusId);
                        const isSkip = st?.code === "skipped" || st?.name?.toLowerCase().includes("skipped");

                        return (
                          <Input
                            type="text"
                            inputMode="decimal"
                            className={`w-32 font-mono font-semibold h-8 text-xs ${isSkip ? "text-amber-600 bg-muted/40" : "text-emerald-700"}`}
                            value={isSkip ? "0" : (batchData[c.public_id]?.collected ?? "")}
                            disabled={isSkip}
                            onChange={(e) => updateCollected(c.public_id, e.target.value)}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={batchData[c.public_id]?.status.toString() || "1"}
                        onValueChange={(v) => {
                          const statusId = Number(v);
                          const st = statuses.find((s) => s.id === statusId);
                          const isSkip = st?.code === "skipped" || st?.name?.toLowerCase().includes("skipped");
                          setBatchData((prev) => ({
                            ...prev,
                            [c.public_id]: {
                              ...prev[c.public_id],
                              status: statusId,
                              collected: isSkip ? 0 : (c.installment_amount || c.loan_amount || 0),
                            },
                          }));
                        }}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const currentStatusId = batchData[c.public_id]?.status;
                        const st = statuses.find((s) => s.id === currentStatusId);
                        const isSkip = st?.code === "skipped" || st?.name?.toLowerCase().includes("skipped");

                        if (isSkip) {
                          return <span className="text-xs text-muted-foreground font-mono font-medium px-2 py-1 bg-muted/30 rounded border border-border">N/A (Skipped)</span>;
                        }

                        return (
                          <Select
                            value={batchData[c.public_id]?.mode.toString() || "1"}
                            onValueChange={(v) =>
                              setBatchData((prev) => ({
                                ...prev,
                                [c.public_id]: { ...prev[c.public_id], mode: Number(v) },
                              }))
                            }
                          >
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {paymentModes.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
