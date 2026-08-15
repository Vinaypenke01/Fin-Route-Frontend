import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Check, Download, Image as ImageIcon, Calendar, Pencil, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { inr } from "@/lib/utils";
import { Customer, Collection, guestWorkspaceService } from "@/lib/services/guest-workspace-service";
import { downloadCustomerCardImage } from "@/lib/download-customer-image";

export function buildHistoryStatuses(collections?: Collection[]): ("paid" | "skipped")[] {
  if (!collections || collections.length === 0) return [];
  const sorted = [...collections].sort((a, b) => {
    if (a.collection_date !== b.collection_date) {
      return a.collection_date.localeCompare(b.collection_date);
    }
    return String(a.receipt_number || a.public_id).localeCompare(String(b.receipt_number || b.public_id));
  });

  return sorted.map((c) => {
    const isSkipped =
      c.status_code === "skipped" ||
      (c.status_name && c.status_name.toLowerCase().includes("skipped")) ||
      Number(c.collected_amount || 0) === 0;
    return isSkipped ? "skipped" : "paid";
  });
}

function InstallmentPassbookGrid({
  total = 20,
  paid = 0,
  skipped = 0,
  historyStatuses,
}: {
  total?: number;
  paid?: number;
  skipped?: number;
  historyStatuses?: ("paid" | "skipped")[];
}) {
  const safeTotal = Math.min(Math.max(total || 1, 1), 300);
  const safePaid = Math.min(paid || 0, safeTotal);
  const remaining = Math.max(0, safeTotal - safePaid);
  const hasSkipped = skipped > 0;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span>Installments Progress</span>
        <span className="font-mono text-foreground font-bold flex items-center gap-1">
          <span className={hasSkipped ? "text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30" : "text-emerald-700 dark:text-emerald-400"}>
            {safePaid} / {safeTotal} Paid {hasSkipped ? `(${skipped} Skipped)` : ""}
          </span>
          <span className="text-muted-foreground text-[10px]">({remaining} left)</span>
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1 p-2 bg-muted/30 border border-border/60 rounded-lg max-h-24 overflow-y-auto">
        {Array.from({ length: safeTotal }).map((_, i) => {
          const num = i + 1;
          let isStruck = false;
          let isSkipped = false;

          if (historyStatuses && historyStatuses[i]) {
            isStruck = historyStatuses[i] === "paid";
            isSkipped = historyStatuses[i] === "skipped";
          } else {
            isStruck = num <= safePaid;
            const safeSkipped = Math.min(skipped || 0, Math.max(0, safeTotal - safePaid));
            isSkipped = !isStruck && num <= safePaid + safeSkipped;
          }

          return (
            <div
              key={i}
              className={`h-5 text-[9px] font-extrabold font-mono rounded flex items-center justify-center transition-all ${isStruck
                  ? "bg-emerald-600 text-white opacity-90 shadow-xs"
                  : isSkipped
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-background text-muted-foreground border border-border/80"
                }`}
              title={`Installment #${num}: ${isStruck ? "Paid & Struck" : isSkipped ? "Skipped (Struck Red)" : "Pending"}`}
            >
              {isStruck || isSkipped ? <s>{num}</s> : num}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BorrowerProfileDetailsModal({
  customer,
  open,
  setOpen,
}: {
  customer: Customer | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingDates, setSavingDates] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const [freshCust, collectionsRes] = await Promise.all([
        guestWorkspaceService.getCustomerDetail(customer.public_id).catch(() => null),
        guestWorkspaceService.getCollections({ customer: customer.public_id, page_size: 1000 }).catch(() => ({ data: [] })),
      ]);
      if (freshCust) setDetail(freshCust);

      let items: Collection[] = Array.isArray(collectionsRes.data)
        ? collectionsRes.data
        : (collectionsRes as any)?.results || (collectionsRes as any)?.data?.results || [];

      // Virtualize opening balance installment history if borrower has paid count > 0 but 0 database records exist
      const targetCust = freshCust || customer;
      const paidCount = Number(targetCust.installments_paid_count || 0);
      const instAmt = Number(targetCust.installment_amount || (Number(targetCust.total_due || 0) / (targetCust.total_installments || 1)));

      if (items.length === 0 && paidCount > 0 && instAmt > 0) {
        const openingDate = targetCust.start_date || new Date().toISOString().split("T")[0];
        items = Array.from({ length: paidCount }, (_, i) => ({
          public_id: `opening-${targetCust.public_id}-${i + 1}`,
          receipt_number: `INIT-OPEN-${i + 1}`,
          customer_code: targetCust.customer_code,
          customer_name: targetCust.full_name,
          customer_public_id: targetCust.public_id,
          collection_date: openingDate,
          expected_amount: instAmt,
          collected_amount: instAmt,
          status: 1,
          status_code: "paid",
          status_name: "Paid",
          payment_mode: 1,
          payment_mode_name: "Cash",
          remarks: `Opening balance installment #${i + 1} paid for existing borrower`,
          created_at: targetCust.created_at || openingDate,
        }));
      }

      setHistory(items);
    } catch (err) {
      console.error("Failed to load customer profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customer) {
      loadData();
      setIsEditMode(false);
      setDraftDates({});
      setSaveMsg(null);
    }
  }, [open, customer]);

  if (!customer) return null;

  const activeCustomer = detail || customer;
  const totalCollected = history.reduce((s, h) => s + Number(h.collected_amount || 0), 0);

  const modifiedRecords = history.filter((h) => {
    const isAlreadyEdited = h.is_edited || (h.edit_count && h.edit_count >= 1);
    if (isAlreadyEdited) return false;
    const draft = draftDates[h.public_id];
    return draft && draft !== h.collection_date;
  });

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setDraftDates({});
  };

  const handleConfirmSaveDates = async () => {
    if (modifiedRecords.length === 0) return;
    setSavingDates(true);
    setSaveMsg(null);
    try {
      await Promise.all(
        modifiedRecords.map((h) =>
          guestWorkspaceService.updateCollection(h.public_id, {
            collection_date: draftDates[h.public_id],
          })
        )
      );
      setSaveMsg(`Successfully updated ${modifiedRecords.length} record(s). Audit log generated!`);
      setShowConfirmModal(false);
      setIsEditMode(false);
      setDraftDates({});
      loadData();
    } catch (err: any) {
      setSaveMsg(err.message || "Failed to update collection dates.");
    } finally {
      setSavingDates(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5 text-primary" /> Borrower Profile & Payment Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete account summary and collection history for <span className="font-semibold text-foreground">{activeCustomer.full_name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {saveMsg && (
              <div className="p-2 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-md flex items-center gap-1.5">
                <Check className="size-4 shrink-0" />
                {saveMsg}
              </div>
            )}

            {/* Header Card */}
            <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1.5">
                  {activeCustomer.sequence_number && (
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold font-mono rounded bg-primary/10 text-primary border border-primary/20">
                      #{activeCustomer.sequence_number}
                    </span>
                  )}
                  <span className="text-sm font-bold">{activeCustomer.full_name}</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] capitalize bg-primary/5 text-primary">
                  Day: {activeCustomer.collection_day || "monday"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
                <div>Code: <span className="font-mono font-semibold text-foreground">{activeCustomer.customer_code}</span></div>
                <div>Mobile: <span className="font-mono font-semibold text-foreground">{activeCustomer.mobile_number}</span></div>
                <div>Disbursed: <span className="font-mono font-semibold text-foreground">{activeCustomer.start_date || "-"}</span></div>
                <div>Status: <span className="capitalize font-semibold text-emerald-700">{activeCustomer.status}</span></div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium">Principal</p>
                <p className="font-bold text-foreground mt-0.5 font-mono">{inr(Number(activeCustomer.loan_amount || 0))}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium">Total Due</p>
                <p className="font-bold text-foreground mt-0.5 font-mono">{inr(Number(activeCustomer.total_due || 0))}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-primary font-medium">Outstanding</p>
                <p className="font-bold text-primary mt-0.5 font-mono">{inr(Number(activeCustomer.outstanding_balance || 0))}</p>
              </div>
            </div>

            {/* Installment Passbook */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Installment Passbook</h4>
              <InstallmentPassbookGrid
                total={activeCustomer.total_installments || 20}
                paid={activeCustomer.installments_paid_count || 0}
                skipped={activeCustomer.skipped_installments_count || 0}
                historyStatuses={buildHistoryStatuses(history)}
              />
            </div>

            {/* Collection Receipts History */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground">Recorded Payments ({history.length})</h4>
                  {!isEditMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 font-medium text-muted-foreground hover:text-foreground"
                      onClick={handleCancelEdit}
                    >
                      Cancel Editing
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditMode && modifiedRecords.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-6 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs gap-1"
                      onClick={() => setShowConfirmModal(true)}
                    >
                      Save ({modifiedRecords.length}) Changes
                    </Button>
                  )}
                  <span className="text-xs font-bold text-emerald-700 font-mono">Total Paid: {inr(totalCollected)}</span>
                </div>
              </div>

              {loading && history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">No payment entries recorded yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-[11px]">
                        <TableHead className="py-2">Receipt #</TableHead>
                        <TableHead className="py-2">Collection Date</TableHead>
                        <TableHead className="py-2">Amount</TableHead>
                        <TableHead className="py-2">Mode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h) => {
                        const isAlreadyEdited = h.is_edited || (h.edit_count && h.edit_count >= 1);
                        const isSkipped = h.status_code === "skipped" || h.status_name?.toLowerCase().includes("skipped");

                        return (
                          <TableRow key={h.public_id} className="text-xs">
                            <TableCell className="font-mono text-[11px] py-1.5 font-semibold">{h.receipt_number}</TableCell>
                            <TableCell className="py-1.5 text-[11px]">
                              {isEditMode ? (
                                isAlreadyEdited ? (
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono">{h.collection_date}</span>
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 text-amber-700 bg-amber-500/10 font-bold">
                                      <Lock className="size-2.5 mr-0.5" /> Locked
                                    </Badge>
                                  </div>
                                ) : (
                                  <input
                                    type="date"
                                    value={draftDates[h.public_id] ?? h.collection_date}
                                    onChange={(e) =>
                                      setDraftDates((prev) => ({
                                        ...prev,
                                        [h.public_id]: e.target.value,
                                      }))
                                    }
                                    className="h-7 text-xs font-mono border border-primary/40 rounded px-1.5 bg-background text-foreground focus:ring-1 focus:ring-primary"
                                  />
                                )
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-mono">{h.collection_date}</span>
                                  {isAlreadyEdited && (
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 text-amber-700 bg-amber-500/10 font-bold">
                                      <Lock className="size-2.5 mr-0.5" /> Edited
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className={`font-bold font-mono py-1.5 ${isSkipped ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"}`}>
                              {isSkipped ? "Skipped (₹0)" : inr(h.collected_amount)}
                            </TableCell>
                            <TableCell className="py-1.5 text-[11px]">
                              {isSkipped ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-400/30 text-[10px] py-0 font-bold">
                                  Skipped
                                </Badge>
                              ) : (
                                h.payment_mode_name || "Cash"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold gap-1.5 shadow-xs"
              onClick={() => downloadCustomerCardImage(activeCustomer, undefined, history)}
            >
              <ImageIcon className="size-4" /> Download Passbook Image
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Lock className="size-5 text-amber-600" /> Confirm Date Modification
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-muted-foreground space-y-2 pt-1">
                <p>
                  You are modifying collection dates for <strong>{modifiedRecords.length} record(s)</strong>.
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                  <p className="font-bold">⚠️ One-Time Edit Rule & Mandatory Audit Trail:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>An installment record can be edited <strong>ONLY ONCE</strong>.</li>
                    <li>This action will log an <strong>audit entry</strong> with your username and date changes.</li>
                    <li>Modified record(s) will be permanently locked after saving.</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)} disabled={savingDates}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={handleConfirmSaveDates}
              disabled={savingDates}
            >
              {savingDates ? "Saving & Logging..." : "Confirm & Save (Log Audit)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
