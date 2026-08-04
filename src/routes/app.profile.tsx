import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, LogOut, CheckCircle2, AlertCircle, Monitor, Smartphone, Tablet, Laptop, Trash2 } from "lucide-react";
import { authService, UserProfile, AuditLogItem, UserSessionItem } from "@/lib/services/auth-service";
import { guestWorkspaceService, WorkspaceData } from "@/lib/services/guest-workspace-service";
import { ActivityLogSection } from "@/components/activity-log-section";
import { DevicesSection } from "@/components/devices-section";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — FinRoute" }, { name: "description", content: "Manage your personal and business information." }] }),
  component: ProfilePage,
});

const deviceIcon = (d: string) =>
  /iphone|android|pixel/i.test(d) ? Smartphone : /ipad|tablet/i.test(d) ? Tablet : /mac|windows/i.test(d) ? Laptop : Monitor;

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [activities, setActivities] = useState<AuditLogItem[]>([]);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Personal Tab Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [personalCity, setPersonalCity] = useState("");
  const [personalState, setPersonalState] = useState("");

  // Business Tab Fields
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [ownerPan, setOwnerPan] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, w, logs, sessList] = await Promise.all([
        authService.getMe(),
        guestWorkspaceService.getWorkspace(),
        authService.getActivityLogs(),
        authService.getSessions(),
      ]);
      setProfile(u);
      setWorkspace(w);
      setActivities(logs.items || []);
      setSessions(sessList.items || []);

      // Personal Data
      setFullName(u.full_name || "");
      setEmail(u.email || "");
      setPersonalCity(u.city || "");
      setPersonalState(u.state || "");

      // Business Data
      setBusinessName(w.name || "");
      setGstin(w.gstin || "");
      setBusinessType(w.business_type || "");
      setOwnerPan(w.owner_pan || "");
      setAddress(w.address || "");
      setCity(w.city || "");
      setState(w.state || "");
      setPinCode(w.pin_code || "");
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    try {
      await authService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessage({ type: "success", text: "Device session revoked successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to revoke session." });
    }
  };

  const handleRevokeAll = async () => {
    try {
      await authService.revokeAllSessions();
      setSessions([]);
      setMessage({ type: "success", text: "Signed out of all active sessions." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to sign out of all sessions." });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    setMessage(null);
    try {
      const updated = await authService.updateProfile({
        full_name: fullName,
        email: email || undefined,
        city: personalCity || undefined,
        state: personalState || undefined,
      });
      setProfile(updated);
      setMessage({ type: "success", text: "Personal details updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update personal details." });
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);
    setMessage(null);
    try {
      const updatedW = await guestWorkspaceService.updateWorkspace({
        name: businessName,
        gstin: gstin || undefined,
        business_type: businessType || undefined,
        owner_pan: ownerPan || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        pin_code: pinCode || undefined,
      });
      setWorkspace(updatedW);
      setMessage({ type: "success", text: "Business details updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update business details." });
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }
    setSavingPass(true);
    setMessage(null);
    try {
      await authService.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate({ to: "/login" });
  };

  const initials = (fullName || profile?.full_name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const userCityState = personalCity || personalState
    ? `${personalCity}${personalCity && personalState ? ", " : ""}${personalState}`
    : "Location not set";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Profile Banner Card */}
      <Card className="p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold">{fullName || profile?.full_name || "User Name"}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {workspace?.name || "Business Workspace"} · {userCityState}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="capitalize">{profile?.account_type || "Guest"}</Badge>
                {profile?.is_mobile_verified && <Badge variant="outline" className="text-emerald-600 border-emerald-300">Verified</Badge>}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4 mr-1.5" /> Log out
          </Button>
        </div>
      </Card>

      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <Tabs defaultValue="personal" className="space-y-4">
        <div className="w-full overflow-x-auto pb-1 max-w-full">
          <TabsList className="inline-flex h-10 w-max items-center justify-start gap-1 rounded-xl bg-muted/80 p-1 text-muted-foreground">
            <TabsTrigger value="personal" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Personal</TabsTrigger>
            <TabsTrigger value="business" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Business</TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Sessions</TabsTrigger>
            <TabsTrigger value="devices" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Devices</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Activity Log</TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Preferences</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Security</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal">
          <Card className="p-6">
            <form onSubmit={handleSavePersonal} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Full name</Label>
                  <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <PhoneInput className="mt-1.5" value={profile?.mobile_number?.replace(/^\+91/, "") || ""} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input className="mt-1.5" value={personalCity} onChange={(e) => setPersonalCity(e.target.value)} placeholder="Enter city" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input className="mt-1.5" value={personalState} onChange={(e) => setPersonalState(e.target.value)} placeholder="Enter state" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="submit" disabled={savingPersonal} className="font-bold">
                  {savingPersonal ? "Saving..." : "Save Personal Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card className="p-6">
            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Business name</Label>
                  <Input className="mt-1.5" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter business name" />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input className="mt-1.5" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="Enter GSTIN (e.g. 08AAACS1234A1Z5)" />
                </div>
                <div>
                  <Label>Business type</Label>
                  <Input className="mt-1.5" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Daily Finance" />
                </div>
                <div>
                  <Label>Owner PAN</Label>
                  <Input className="mt-1.5" value={ownerPan} onChange={(e) => setOwnerPan(e.target.value)} placeholder="Enter PAN (e.g. ABCDE1234F)" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <Input className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter street address" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input className="mt-1.5" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input className="mt-1.5" value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter state" />
                </div>
                <div>
                  <Label>Pin Code</Label>
                  <Input className="mt-1.5" value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="Enter pincode" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="submit" disabled={savingBusiness} className="font-bold">
                  {savingBusiness ? "Saving..." : "Save Business Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <DevicesSection mode="sessions" />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesSection mode="devices" />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogSection />
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                    <SelectItem value="ta">தமிழ்</SelectItem>
                    <SelectItem value="te">తెలుగు</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select defaultValue="inr">
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inr">₹ INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date format</Label>
                <Select defaultValue="dmy">
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Current password</Label>
                  <PasswordInput className="mt-1.5" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div>
                  <Label>New password</Label>
                  <PasswordInput className="mt-1.5" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="sm:col-span-2">
                  <Label>Confirm new password</Label>
                  <PasswordInput className="mt-1.5" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Two-factor authentication is <span className="text-emerald-600 font-semibold">enabled</span>.</p>
                <Button type="submit" disabled={savingPass} className="font-bold">
                  {savingPass ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
