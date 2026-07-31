import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "@/components/erp/erp-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { business } from "@/lib/erp-data";
import { Building, FileText, MapPin, Clock, Globe, Upload, Save } from "lucide-react";

export const Route = createFileRoute("/erp/business")({
  head: () => ({ meta: [{ title: "Business Profile — FinRoute ERP" }, { name: "description", content: "Legal identity, branches, rules, and brand." }] }),
  component: BusinessPage,
});

function BusinessPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Business Profile"
        description="Legal identity, branches, working rules and brand."
        action={<Button size="sm"><Save className="size-4" /> Save changes</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-5">
          <div className="grid size-24 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
            <Building className="size-10" />
          </div>
          <p className="mt-3 font-display text-lg font-bold">{business.name}</p>
          <p className="text-xs text-muted-foreground">{business.legal}</p>
          <Badge variant="secondary" className="mt-2">Verified NBFC · Active</Badge>
          <Separator className="my-4" />
          <Button variant="outline" size="sm" className="w-full"><Upload className="size-4" /> Change logo</Button>
        </Card>

        <Card className="p-5">
          <Tabs defaultValue="identity">
            <TabsList className="w-full flex-wrap">
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="brand">Brand</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Business name" value={business.name} />
              <Field label="Legal entity" value={business.legal} />
              <Field label="GSTIN" value={business.gst} />
              <Field label="CIN" value={business.cin} />
              <Field label="PAN" value={business.pan} />
              <Field label="Phone" value={business.phone} />
              <Field label="Email" value={business.email} />
              <Field label="Website" value={business.website} />
              <div className="sm:col-span-2">
                <Label className="text-xs">Registered address</Label>
                <Textarea className="mt-1.5" defaultValue={business.address} rows={2} />
              </div>
              <Field label="Currency" value={business.currency} />
              <Field label="Timezone" value={business.timezone} />
              <Field label="Working hours" value={business.workingHours} />
            </TabsContent>

            <TabsContent value="branches" className="mt-4 space-y-3">
              {business.branches.map((b) => (
                <div key={b.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{b.name} <span className="ml-1 text-xs text-muted-foreground">{b.id}</span></p>
                    <p className="text-xs text-muted-foreground"><MapPin className="mr-1 inline size-3" /> {b.city} · {b.staff} staff</p>
                  </div>
                  <Badge variant={b.active ? "default" : "secondary"}>{b.active ? "Active" : "Inactive"}</Badge>
                </div>
              ))}
              <Button variant="outline" size="sm">+ Add branch</Button>
            </TabsContent>

            <TabsContent value="rules" className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Interest model" value={business.rules.interestModel} />
              <Field label="Penalty %" value={String(business.rules.penaltyPct) + "%"} />
              <Field label="Grace days" value={String(business.rules.graceDays)} />
              <Field label="Min loan" value={"₹" + business.rules.minLoan.toLocaleString("en-IN")} />
              <Field label="Max loan" value={"₹" + business.rules.maxLoan.toLocaleString("en-IN")} />
              <Field label="Collection frequency" value="Daily · Weekly · Monthly" />
            </TabsContent>

            <TabsContent value="documents" className="mt-4 grid gap-3 sm:grid-cols-2">
              {["GST Certificate","PAN Card","NBFC License","Incorporation Certificate","MSME Registration","Bank NOC"].map((d) => (
                <div key={d} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <FileText className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d}</p>
                    <p className="text-xs text-muted-foreground">Uploaded · verified</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="sm:col-span-2"><Upload className="size-4" /> Upload document</Button>
            </TabsContent>

            <TabsContent value="brand" className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Brand primary color</Label>
                <div className="mt-1.5 flex gap-2">
                  {["#1e40af","#0d9488","#b45309","#7c3aed","#be123c"].map((c) => (
                    <button key={c} style={{ background: c }} className="size-8 rounded-full border-2 border-border" />
                  ))}
                </div>
              </div>
              <Field label="Tagline" value="Reliable finance, delivered daily." />
              <div className="sm:col-span-2">
                <Label className="text-xs">Invoice footer</Label>
                <Textarea className="mt-1.5" rows={2} defaultValue="Thank you for your business. Payments are non-refundable." />
              </div>
              <Field label="Timezone" value={business.timezone} />
              <Field label="Locale" value="English (India)" />
              <p className="sm:col-span-2 text-xs text-muted-foreground"><Clock className="mr-1 inline size-3" /><Globe className="mr-1 inline size-3" /> Regional preferences apply to all reports and receipts.</p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1.5" defaultValue={value} />
    </div>
  );
}
