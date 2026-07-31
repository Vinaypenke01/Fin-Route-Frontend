import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import { inr } from "@/lib/utils";
import { guestWorkspaceService, Customer, WorkspaceData } from "@/lib/services/guest-workspace-service";
import { mastersService, MasterItem } from "@/lib/services/masters-service";

export const Route = createFileRoute("/app/collections/new")({
  head: () => ({
    meta: [
      { title: "Record Collection — FinRoute" },
      { name: "description", content: "Log a new collection entry against a customer's loan." },
    ],
  }),
  component: NewCollectionPage,
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

function NewCollectionPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [configuredDays, setConfiguredDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("all");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentModes, setPaymentModes] = useState<MasterItem[]>([]);
  const [statuses, setStatuses] = useState<MasterItem[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [expectedAmount, setExpectedAmount] = useState<number>(0);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<number>(1);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);
  const [collectionDate, setCollectionDate] = useState<string>(today);
  const [remarks, setRemarks] = useState<string>("");
  const [isCollectedToday, setIsCollectedToday] = useState<boolean>(true);
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
        setSelectedDay("all");
      }
    } catch (err) {
      console.error("Workspace load error:", err);
    }
  };

  const loadCustomersAndMasters = async () => {
    setLoading(true);
    try {
      const [custRes, modesRes, statusesRes] = await Promise.all([
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
      setStatuses(statusesRes);
      if (modesRes[0]) setSelectedPaymentMode(modesRes[0].id);
      if (statusesRes[0]) setSelectedStatus(statusesRes[0].id);
      if (custs[0]) {
        setSelectedCustomerId(custs[0].public_id);
        const exp = custs[0].installment_amount || custs[0].loan_amount || 0;
        setExpectedAmount(exp);
        setCollectedAmount(exp);
      } else {
        setSelectedCustomerId("");
        setExpectedAmount(0);
        setCollectedAmount(0);
      }
    } catch (err) {
      console.error("Collection data load error:", err);
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

  const handleCustomerChange = (public_id: string) => {
    setSelectedCustomerId(public_id);
    const found = customers.find((c) => c.public_id === public_id);
    if (found) {
      const exp = found.installment_amount || found.loan_amount || 0;
      setExpectedAmount(exp);
      setCollectedAmount(exp);
    }
  };

  const currentStatusObj = statuses.find((s) => s.id === selectedStatus);
  const isSkippedSelected = currentStatusObj?.code === "skipped" || currentStatusObj?.name?.toLowerCase().includes("skipped");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError("Please select a borrower.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await guestWorkspaceService.recordCollection({
        customer: selectedCustomerId,
        collection_date: collectionDate,
        expected_amount: expectedAmount,
        collected_amount: isSkippedSelected ? 0 : collectedAmount,
        status: selectedStatus,
        payment_mode: isSkippedSelected ? undefined : selectedPaymentMode,
        remarks,
        is_collected_today: isCollectedToday,
      });

      navigate({ to: "/app/collections" as any });
    } catch (err: any) {
      if (err.upgradePrompt) {
        setError(`${err.message} (${err.upgradePrompt.message})`);
      } else {
        setError(err.message || "Failed to record collection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isSingleDayPlan = configuredDays.length === 1;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-9">
          <Link to="/app/collections">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Record Single Collection Entry</h1>
          <p className="text-xs text-muted-foreground">Log a collection payment against a borrower's active loan.</p>
        </div>
      </div>

      {/* Collection Route Day Selection Header Card */}
      <Card className="p-4 space-y-3 bg-card border-border shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Calendar className="size-4 text-primary" /> Filter Borrower List by Collection Day Route
          </div>
          {isSingleDayPlan && (
            <Badge variant="outline" className="font-mono text-[10px] capitalize bg-primary/10 text-primary">
              Single Day Plan ({configuredDays[0]})
            </Badge>
          )}
        </div>

        {isSingleDayPlan ? (
          <div className="flex items-center gap-2 pt-1">
            <div className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground flex items-center gap-2">
              <CheckCircle2 className="size-3.5" />
              Assigned Day Route: <span className="capitalize">{configuredDays[0]}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedDay("all")}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                selectedDay === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              All Route Days
            </button>

            {configuredDays.map((dKey) => {
              const dayObj = ALL_DAYS_LIST.find((d) => d.key === dKey);
              const isSelected = selectedDay === dKey;
              return (
                <button
                  key={dKey}
                  type="button"
                  onClick={() => setSelectedDay(dKey)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 capitalize ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  <CheckCircle2 className={`size-3 ${isSelected ? "text-primary-foreground" : "text-emerald-500"}`} />
                  {dayObj?.label || dKey}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold">Select Borrower *</Label>
            {loading ? (
              <p className="text-xs text-muted-foreground mt-1">Loading route borrowers...</p>
            ) : customers.length === 0 ? (
              <p className="text-xs text-destructive mt-1 font-medium">No active borrowers found for {selectedDay === "all" ? "any day" : selectedDay}.</p>
            ) : (
              <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a borrower…" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.public_id} value={c.public_id}>
                      {c.full_name} ({c.customer_code}) — Day: {c.collection_day || "monday"} • Due: {inr(c.installment_amount || c.loan_amount || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold">Collection Timing *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                variant={isCollectedToday ? "default" : "outline"}
                className={isCollectedToday ? "bg-emerald-600 text-white hover:bg-emerald-700 h-8 text-xs font-bold" : "h-8 text-xs"}
                onClick={() => setIsCollectedToday(true)}
              >
                Collected Today
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!isCollectedToday ? "secondary" : "outline"}
                className={!isCollectedToday ? "bg-muted-foreground/20 font-bold h-8 text-xs" : "h-8 text-xs"}
                onClick={() => setIsCollectedToday(false)}
              >
                Past Collection
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isCollectedToday
                ? "Included in Reports calculations & daily net revenue figures."
                : "Stored for passbook history, but excluded from Reports revenue calculations."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Collection Date *</Label>
              <Input
                type="date"
                className="mt-1"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Expected Installment (₹) *</Label>
              <Input
                type="number"
                className="mt-1 font-mono font-semibold"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Collected Amount (₹) *</Label>
              <Input
                type="number"
                className={`mt-1 font-mono font-bold ${isSkippedSelected ? "text-amber-600 bg-muted/40" : "text-emerald-700"}`}
                value={collectedAmount}
                onChange={(e) => setCollectedAmount(Number(e.target.value))}
                disabled={isSkippedSelected}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Payment Status *</Label>
              <Select
                value={selectedStatus.toString()}
                onValueChange={(v) => {
                  const statusId = Number(v);
                  setSelectedStatus(statusId);
                  const st = statuses.find((s) => s.id === statusId);
                  const isSkip = st?.code === "skipped" || st?.name?.toLowerCase().includes("skipped");
                  if (isSkip) {
                    setCollectedAmount(0);
                  } else {
                    setCollectedAmount(expectedAmount);
                  }
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isSkippedSelected && (
            <div>
              <Label className="text-xs font-semibold">Payment Mode *</Label>
              <Select value={selectedPaymentMode.toString()} onValueChange={(v) => setSelectedPaymentMode(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentModes.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold">Remarks / Notes</Label>
            <Textarea
              className="mt-1 text-xs"
              placeholder="e.g. Received via GPay / Collected at shop"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !selectedCustomerId}>
            {submitting ? "Logging Collection..." : "Record Collection Entry"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
