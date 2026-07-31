import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Mail, Phone, MapPin, Calendar, CreditCard, HardDrive, Zap,
  Users, IndianRupee, ArrowLeft, LogIn, Pause, RotateCcw, ArrowUpCircle,
  Receipt,
} from "lucide-react";
import { lenders, inr, invoices, activities } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/lenders/$id")({
  head: () => ({ meta: [{ title: "Lender Profile — Admin" }] }),
  component: LenderProfile,
  notFoundComponent: () => <div className="p-8 text-center text-muted-foreground">Lender not found.</div>,
});

function LenderProfile() {
  const { id } = Route.useParams();
  const lender = lenders.find((l) => l.id === id);
  if (!lender) throw notFound();
  const lenderInvoices = invoices.filter((i) => i.lenderId === lender.id).slice(0, 6);
  const timeline = activities.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/lenders"><ArrowLeft className="size-4" /> Back</Link></Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm"><LogIn className="size-4" /> Login as</Button>
          <Button variant="outline" size="sm"><ArrowUpCircle className="size-4" /> Upgrade</Button>
          <Button variant="outline" size="sm"><RotateCcw className="size-4" /> Reset password</Button>
          <Button variant="destructive" size="sm"><Pause className="size-4" /> Suspend</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{lender.logo}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold">{lender.name}</h2>
                <Badge variant="outline">{lender.plan}</Badge>
                <Badge variant="secondary">{lender.status}</Badge>
                <Badge variant="outline">{lender.businessType}</Badge>
              </div>
              <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2"><Users className="size-3.5" /> {lender.owner}</div>
                <div className="flex items-center gap-2"><Mail className="size-3.5" /> {lender.email}</div>
                <div className="flex items-center gap-2"><Phone className="size-3.5" /> {lender.phone}</div>
                <div className="flex items-center gap-2"><MapPin className="size-3.5" /> {lender.city}, {lender.state}</div>
                <div className="flex items-center gap-2"><Calendar className="size-3.5" /> Since {lender.registeredAt}</div>
                <div className="flex items-center gap-2"><CreditCard className="size-3.5" /> Renews {lender.renewalDate}</div>
                <div className="flex items-center gap-2"><Building2 className="size-3.5" /> GSTIN {lender.gst}</div>
                <div className="flex items-center gap-2"><IndianRupee className="size-3.5" /> {inr(lender.monthlyRevenue)} / mo</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Employees", value: lender.employees },
          { label: "Customers", value: lender.customers.toLocaleString("en-IN") },
          { label: "Loans", value: lender.loans.toLocaleString("en-IN") },
          { label: "Collections", value: lender.collections.toLocaleString("en-IN") },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-display text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
        </TabsList>
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive className="size-4" /> Storage</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{lender.storageUsedGB} GB used</span>
                  <span className="text-muted-foreground">of {lender.storageLimitGB} GB</span>
                </div>
                <Progress value={(lender.storageUsedGB / lender.storageLimitGB) * 100} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="size-4" /> API Requests</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{lender.apiUsage.toLocaleString("en-IN")} requests</span>
                  <span className="text-muted-foreground">of {lender.apiLimit.toLocaleString("en-IN")}</span>
                </div>
                <Progress value={(lender.apiUsage / lender.apiLimit) * 100} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="billing">
          <Card>
            <CardHeader><CardTitle>Recent Invoices</CardTitle><CardDescription>Last 6 payments</CardDescription></CardHeader>
            <CardContent className="divide-y divide-border">
              {lenderInvoices.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No invoices on this account yet.</div>
              ) : lenderInvoices.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Receipt className="size-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{i.id}</div>
                      <div className="text-xs text-muted-foreground">{i.issuedOn} · {i.method}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{inr(i.total)}</div>
                    <Badge variant="outline" className="text-[10px]">{i.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card>
            <CardContent className="space-y-3 p-4">
              {timeline.map((a) => (
                <div key={a.id} className="flex gap-3 border-l-2 border-border pl-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.type}</div>
                    <div className="text-xs text-muted-foreground">{a.subject} · {a.date}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="address">
          <Card>
            <CardContent className="p-6 text-sm">
              <div className="font-medium">{lender.name}</div>
              <div className="text-muted-foreground">{lender.address}</div>
              <Separator className="my-3" />
              <div>GSTIN: <span className="font-mono">{lender.gst}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
