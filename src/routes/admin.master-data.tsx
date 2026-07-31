import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { mastersService, MasterItem } from "@/lib/services/masters-service";
import { adminService } from "@/lib/services/admin-service";

export const Route = createFileRoute("/admin/master-data")({
  head: () => ({ meta: [{ title: "Master Data — Admin" }] }),
  component: MasterDataPage,
});

function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("frequencies");
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      let data: MasterItem[] = [];
      if (activeTab === "frequencies") data = await mastersService.getCollectionFrequencies();
      else if (activeTab === "payment-modes") data = await mastersService.getPaymentModes();
      else if (activeTab === "interest-types") data = await mastersService.getInterestTypes();
      else if (activeTab === "statuses") data = await mastersService.getCollectionStatuses();
      else if (activeTab === "expense-categories") data = await mastersService.getExpenseCategories();
      else if (activeTab === "business-categories") data = await mastersService.getBusinessCategories();
      setItems(data);
    } catch (err) {
      console.error("Master data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, [activeTab]);

  const handleDelete = async (id: number) => {
    try {
      await adminService.deleteMasterItem(activeTab, id);
      loadMasterData();
    } catch (err) {
      console.error("Failed to delete master item:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">System Master Data Management</h2>
          <p className="text-sm text-muted-foreground">Manage reference records used across all lender workspaces.</p>
        </div>
        <AddMasterItemModal
          category={activeTab}
          open={isAddOpen}
          setOpen={setIsAddOpen}
          onSuccess={loadMasterData}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="frequencies">Frequencies</TabsTrigger>
          <TabsTrigger value="payment-modes">Payment Modes</TabsTrigger>
          <TabsTrigger value="interest-types">Interest Types</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="expense-categories">Expense Categories</TabsTrigger>
          <TabsTrigger value="business-categories">Business Categories</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>System Code</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  Loading master data from backend...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  No records found for this category. Click "Add Master Item" to create one.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.code}</TableCell>
                  <TableCell className="font-bold">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingItem(item)}>
                        <Edit className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {editingItem && (
        <EditMasterItemModal
          category={activeTab}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={loadMasterData}
        />
      )}
    </div>
  );
}

function AddMasterItemModal({ category, open, setOpen, onSuccess }: { category: string; open: boolean; setOpen: (v: boolean) => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminService.createMasterItem(category, { name, code: code || undefined });
      setName("");
      setCode("");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create master item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4 mr-1" /> Add Master Item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Master Item ({category})</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-medium">Display Name</label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Office Rent" />
          </div>
          <div>
            <label className="text-xs font-medium">System Code (Optional)</label>
            <Input className="mt-1 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. office_rent" />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Create Master Record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMasterItemModal({ category, item, onClose, onSuccess }: { category: string; item: MasterItem; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(item.name);
  const [code, setCode] = useState(item.code);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminService.updateMasterItem(category, item.id, { name, code });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update master item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Master Item #{item.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-medium">Display Name</label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium">System Code</label>
            <Input className="mt-1 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
