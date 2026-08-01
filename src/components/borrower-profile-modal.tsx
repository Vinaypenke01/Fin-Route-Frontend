import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Check, Download, Image as ImageIcon } from "lucide-react";
import { inr } from "@/lib/utils";
import { Customer, Collection, guestWorkspaceService } from "@/lib/services/guest-workspace-service";
import { downloadCustomerCardImage } from "@/lib/download-customer-image";

function InstallmentPassbookGrid({ total = 20, paid = 0 }: { total?: number; paid?: number }) {
  const safeTotal = Math.min(Math.max(total || 1, 1), 100);
  const safePaid = Math.min(paid || 0, safeTotal);
  const remaining = safeTotal - safePaid;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>Installments Progress</span>
        <span className="font-mono text-foreground font-bold">
          {safePaid} / {safeTotal} Paid ({remaining} left)
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1 p-2 bg-muted/30 border border-border/60 rounded-lg max-h-24 overflow-y-auto">
        {Array.from({ length: safeTotal }).map((_, i) => {
          const isStruck = i < safePaid;
          return (
            <div
              key={i}
              className={`h-5 text-[9px] font-extrabold font-mono rounded flex items-center justify-center transition-all ${
                isStruck
                  ? "bg-emerald-600 text-white line-through opacity-90 shadow-xs"
                  : "bg-background text-muted-foreground border border-border/80"
              }`}
              title={`Installment #${i + 1}: ${isStruck ? "Paid & Struck" : "Pending"}`}
            >
              {isStruck ? <Check className="size-3 stroke-[3]" /> : i + 1}
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

  useEffect(() => {
    if (!open || !customer) return;
    const customerPublicId = customer.public_id;
    async function loadData() {
      setLoading(true);
      try {
        const [freshCust, collectionsRes] = await Promise.all([
          guestWorkspaceService.getCustomerDetail(customerPublicId).catch(() => null),
          guestWorkspaceService.getCollections({ customer: customerPublicId }).catch(() => ({ data: [] })),
        ]);
        if (freshCust) setDetail(freshCust);
        setHistory(collectionsRes.data || []);
      } catch (err) {
        console.error("Failed to load customer profile details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [open, customer]);

  if (!customer) return null;

  const activeCustomer = detail || customer;
  const totalCollected = history.reduce((s, h) => s + Number(h.collected_amount || 0), 0);

  return (
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
            />
          </div>

          {/* Collection Receipts History */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">Recorded Payments ({history.length})</h4>
              <span className="text-xs font-bold text-emerald-700 font-mono">Total Paid: {inr(totalCollected)}</span>
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
                      <TableHead className="py-2">Date</TableHead>
                      <TableHead className="py-2">Amount</TableHead>
                      <TableHead className="py-2">Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => {
                      const isSkipped = h.status_code === "skipped" || h.status_name?.toLowerCase().includes("skipped");
                      return (
                        <TableRow key={h.public_id} className="text-xs">
                          <TableCell className="font-mono text-[11px] py-1.5 font-semibold">{h.receipt_number}</TableCell>
                          <TableCell className="py-1.5 text-[11px]">{h.collection_date}</TableCell>
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
  );
}
