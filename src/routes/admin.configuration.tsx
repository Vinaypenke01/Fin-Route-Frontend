import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, ShieldCheck, Key, Bell, Webhook, Server, CheckCircle, AlertTriangle,
  Megaphone, PhoneCall, Share2, Mail, MapPin, Clock, Twitter, Linkedin, Facebook, Youtube, Instagram,
} from "lucide-react";
import { apiKeys } from "@/lib/admin-data";
import { adminService } from "@/lib/services/admin-service";
import { getPlatformConfig, setPlatformConfig, PlatformConfig } from "@/lib/platform-config";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuration")({
  head: () => ({ meta: [{ title: "Platform Configuration — Admin" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const [config, setConfigState] = useState<PlatformConfig>(getPlatformConfig());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setConfigState(getPlatformConfig());
    const onConfigChange = () => setConfigState(getPlatformConfig());
    window.addEventListener("platform-config-change", onConfigChange);
    return () => window.removeEventListener("platform-config-change", onConfigChange);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    try {
      setPlatformConfig(config);

      await adminService.updateConfiguration("MAINTENANCE_MODE", String(config.maintenanceMode));
      await adminService.updateConfiguration("BANNER_MESSAGE", config.bannerMessage);
      await adminService.updateConfiguration("ANNOUNCEMENT_ENABLED", String(config.announcementEnabled));
      await adminService.updateConfiguration("SUPPORT_MOBILE", config.supportMobile);
      await adminService.updateConfiguration("SUPPORT_EMAIL", config.supportEmail);
      await adminService.updateConfiguration("TWITTER_URL", config.twitterUrl);
      await adminService.updateConfiguration("LINKEDIN_URL", config.linkedinUrl);

      setSuccess("Platform & Social Media configuration saved live!");
      toast.success("Platform & Social Media Configuration updated successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.warn("Saved to local platform configuration");
      setSuccess("Configuration saved!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Platform Configuration</h2>
          <p className="text-sm text-muted-foreground">Manage social media links, support mobile numbers, emails, maintenance mode, and branding.</p>
        </div>
        {success && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md font-medium shadow-sm">
            <CheckCircle className="size-4 text-emerald-600" /> {success}
          </div>
        )}
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general"><Building2 className="mr-1.5 size-4" /> General & Banners</TabsTrigger>
          <TabsTrigger value="social"><PhoneCall className="mr-1.5 size-4" /> Social & Contact Info</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="mr-1.5 size-4" /> Security</TabsTrigger>
          <TabsTrigger value="api"><Key className="mr-1.5 size-4" /> API Keys</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1.5 size-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="mr-1.5 size-4" /> Webhooks</TabsTrigger>
          <TabsTrigger value="infra"><Server className="mr-1.5 size-4" /> Infrastructure</TabsTrigger>
        </TabsList>

        {/* Tab 1: General & Banners */}
        <TabsContent value="general" className="space-y-4">
          {/* Maintenance Mode Alert Card */}
          <Card className={config.maintenanceMode ? "border-amber-500 bg-amber-500/10" : ""}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.maintenanceMode ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-base flex items-center gap-2">
                    Super Admin Maintenance Mode
                    {config.maintenanceMode && <Badge variant="destructive">Active (Landing Page Under Maintenance)</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    When enabled, the public Landing Page & Login screens display a scheduled maintenance screen.
                  </div>
                </div>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(val) => setConfigState({ ...config, maintenanceMode: val })}
              />
            </CardContent>
          </Card>

          {/* Announcement Banner Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-5 text-primary" /> Landing Page Announcement Banner
              </CardTitle>
              <CardDescription>Configure the live announcement message displayed across the top of the landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium">Enable Announcement Banner</div>
                  <div className="text-xs text-muted-foreground">Show promotional banner on top of the home page.</div>
                </div>
                <Switch
                  checked={config.announcementEnabled}
                  onCheckedChange={(val) => setConfigState({ ...config, announcementEnabled: val })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Banner Message Text</Label>
                <Input
                  className="mt-1"
                  value={config.bannerMessage}
                  onChange={(e) => setConfigState({ ...config, bannerMessage: e.target.value })}
                  placeholder="e.g. 🎉 Special Offer: 50% discount on annual Lender subscriptions!"
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Company Branding & Language</CardTitle>
              <CardDescription>Customization settings applied to your application UI.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">Platform Name</Label>
                <Input
                  className="mt-1"
                  value={config.platformName}
                  onChange={(e) => setConfigState({ ...config, platformName: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Theme Mode</Label>
                <Select
                  value={config.theme}
                  onValueChange={(val) => setConfigState({ ...config, theme: val })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Social Media Links & Support Contacts */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="size-5 text-primary" /> Support Mobile Numbers & Email Addresses
              </CardTitle>
              <CardDescription>Configure primary support channels displayed across the website header and footer.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">Support Mobile / Phone Number</Label>
                <Input
                  className="mt-1 font-mono text-sm"
                  value={config.supportMobile}
                  onChange={(e) => setConfigState({ ...config, supportMobile: e.target.value })}
                  placeholder="+91 80 4700 1200"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Support WhatsApp Helpline Number</Label>
                <Input
                  className="mt-1 font-mono text-sm"
                  value={config.supportWhatsapp}
                  onChange={(e) => setConfigState({ ...config, supportWhatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Support Email Address</Label>
                <Input
                  className="mt-1 text-sm"
                  value={config.supportEmail}
                  onChange={(e) => setConfigState({ ...config, supportEmail: e.target.value })}
                  placeholder="support@digitalcore.co.in"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Sales Inquiry Email Address</Label>
                <Input
                  className="mt-1 text-sm"
                  value={config.salesEmail}
                  onChange={(e) => setConfigState({ ...config, salesEmail: e.target.value })}
                  placeholder="sales@finroute.in"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Registered Office Address</Label>
                <Input
                  className="mt-1 text-sm"
                  value={config.officeAddress}
                  onChange={(e) => setConfigState({ ...config, officeAddress: e.target.value })}
                  placeholder="H-24, FinTech Tower, MG Road, Jaipur, Rajasthan 302001"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Business Operating Hours</Label>
                <Input
                  className="mt-1 text-sm"
                  value={config.businessHours}
                  onChange={(e) => setConfigState({ ...config, businessHours: e.target.value })}
                  placeholder="Mon - Sat: 9:00 AM - 7:00 PM IST"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="size-5 text-primary" /> Social Media Handles & Profile Links
              </CardTitle>
              <CardDescription>Social media icons rendered in the website footer link directly to these URLs.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Twitter className="size-3.5 text-sky-500" /> Twitter / X Profile URL
                </Label>
                <Input
                  className="mt-1 text-sm font-mono"
                  value={config.twitterUrl}
                  onChange={(e) => setConfigState({ ...config, twitterUrl: e.target.value })}
                  placeholder="https://x.com/finroute"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Linkedin className="size-3.5 text-blue-600" /> LinkedIn Company Page URL
                </Label>
                <Input
                  className="mt-1 text-sm font-mono"
                  value={config.linkedinUrl}
                  onChange={(e) => setConfigState({ ...config, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/company/finroute"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Facebook className="size-3.5 text-blue-500" /> Facebook Page URL
                </Label>
                <Input
                  className="mt-1 text-sm font-mono"
                  value={config.facebookUrl}
                  onChange={(e) => setConfigState({ ...config, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/finroute"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Youtube className="size-3.5 text-rose-600" /> YouTube Channel URL
                </Label>
                <Input
                  className="mt-1 text-sm font-mono"
                  value={config.youtubeUrl}
                  onChange={(e) => setConfigState({ ...config, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/@finroute"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Instagram className="size-3.5 text-pink-600" /> Instagram Profile URL
                </Label>
                <Input
                  className="mt-1 text-sm font-mono"
                  value={config.instagramUrl}
                  onChange={(e) => setConfigState({ ...config, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/finroute.in"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Security & Authentication Policy</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ToggleRow label="Enforce 2FA for Super Admin accounts" defaultChecked />
              <ToggleRow label="Send SMS OTP on password resets" defaultChecked />
              <ToggleRow label="Lock account after 5 failed login attempts" defaultChecked />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: API Keys */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>API Access Keys & Credentials</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-semibold">{k.name}</TableCell>
                      <TableCell><Badge variant="outline">{k.role}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{k.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setConfigState(getPlatformConfig())}>Reset</Button>
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-md">
          {saving ? "Saving Changes..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
