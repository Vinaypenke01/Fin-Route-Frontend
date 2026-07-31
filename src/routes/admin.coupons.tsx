import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { inr } from "@/lib/utils";
import { adminService, CouponItem } from "@/lib/services/admin-service";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Admin" }] }),
  component: CouponsPage,
});

function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCoupons();
      setCoupons(res || []);
    } catch (err) {
      console.error("Coupon fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Promo Coupons & Discounts</h2>
          <p className="text-sm text-muted-foreground">Manage subscription promo codes for discount offers.</p>
        </div>
        <AddCouponModal open={isOpen} setOpen={setIsOpen} onSuccess={loadCoupons} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total Active Coupons</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-600">
            {loading ? "..." : coupons.filter((c) => c.is_active).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total Redemptions</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {loading ? "..." : coupons.reduce((s, c) => s + (c.used_count || 0), 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Flat / Percentage Deals</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">
            {loading ? "..." : coupons.length}
          </p>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coupon Code</TableHead>
              <TableHead>Discount Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Redemptions</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  Loading coupons from backend...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No promo coupons created yet. Click "Add Coupon" to create a new promotional code.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-sm">{c.code}</TableCell>
                  <TableCell className="capitalize">{c.discount_type}</TableCell>
                  <TableCell className="font-semibold">
                    {c.discount_type === "flat" ? inr(c.discount_value) : `${c.discount_value}%`}
                  </TableCell>
                  <TableCell>{c.used_count || 0} / {c.max_uses || "∞"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.valid_until || "No Expiry"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddCouponModal({ open, setOpen, onSuccess }: { open: boolean; setOpen: (v: boolean) => void; onSuccess: () => void }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultExpiryStr = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [maxUses, setMaxUses] = useState<number | "">(100);
  const [validFrom, setValidFrom] = useState(todayStr);
  const [validUntil, setValidUntil] = useState(defaultExpiryStr);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminService.createCoupon({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        max_uses: maxUses === "" ? null : Number(maxUses),
        valid_from: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
      });
      setCode("");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4 mr-1" /> Add Coupon</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Promotional Coupon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium">Coupon Code</label>
            <Input className="mt-1 font-mono uppercase font-bold" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="SUMMER50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Discount Type</label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium">Discount Value</label>
              <Input type="number" className="mt-1" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium">Max Uses Limit</label>
              <Input type="number" className="mt-1" value={maxUses} onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : "")} placeholder="Unlimited" />
            </div>

            <div>
              <label className="text-xs font-medium">Valid From</label>
              <Input type="date" className="mt-1" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
            </div>

            <div>
              <label className="text-xs font-medium">Valid Until</label>
              <Input type="date" className="mt-1" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Create Promo Coupon"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
