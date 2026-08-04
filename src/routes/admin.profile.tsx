import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Monitor, Smartphone, Tablet, Laptop, MapPin, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { activeSessions, auditLogs } from "@/lib/admin-data";
import { authService, UserProfile, AuditLogItem, UserSessionItem } from "@/lib/services/auth-service";
import { ActivityLogSection } from "@/components/activity-log-section";
import { DevicesSection } from "@/components/devices-section";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin" }] }),
  component: ProfilePage,
});

const deviceIcon = (d: string) =>
  /iphone|android|pixel/i.test(d) ? Smartphone : /ipad|tablet/i.test(d) ? Tablet : /mac|windows/i.test(d) ? Laptop : Monitor;

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<AuditLogItem[]>([]);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passUpdating, setPassUpdating] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [data, logs, sessList] = await Promise.all([
        authService.getMe(),
        authService.getActivityLogs(),
        authService.getSessions(),
      ]);
      setProfile(data);
      setActivities(logs.items || []);
      setSessions(sessList.items || []);
      setFullName(data.full_name || "");
      setEmail(data.email || "");
      setCity(data.city || "");
      setState(data.state || "");
      setEmployeeId(data.employee_id || "");
    } catch (err) {
      console.error("Failed to load admin profile:", err);
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
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    try {
      const updated = await authService.updateProfile({
        full_name: fullName,
        email: email || undefined,
        city: city || undefined,
        state: state || undefined,
        employee_id: employeeId || undefined,
      });
      setProfile(updated);
      setMessage({ type: "success", text: "Admin profile updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }
    setPassUpdating(true);
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
      setPassUpdating(false);
    }
  };

  const initials = (fullName || profile?.full_name || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const roleTitle = (profile?.account_type || "admin").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <Avatar className="size-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold">{fullName || profile?.full_name || "User Profile"}</h2>
              <Badge variant="secondary">{roleTitle}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {email || "No email set"} · {profile?.mobile_number || "-"}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {city || state ? `${city}${city && state ? ", " : ""}${state}` : "Location not set"}
            </div>
          </div>
        </CardContent>
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

      <Tabs defaultValue="info" className="space-y-4">
        <div className="w-full overflow-x-auto pb-1 max-w-full">
          <TabsList className="inline-flex h-10 w-max items-center justify-start gap-1 rounded-xl bg-muted/80 p-1 text-muted-foreground">
            <TabsTrigger value="info" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Information</TabsTrigger>
            <TabsTrigger value="password" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Change Password</TabsTrigger>
            <TabsTrigger value="2fa" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Two-Factor</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Activity</TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Sessions</TabsTrigger>
            <TabsTrigger value="devices" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Devices</TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Preferences</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info">
          <Card>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <PhoneInput value={profile?.mobile_number?.replace(/^\+91/, "") || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={roleTitle} disabled className="bg-muted font-semibold" />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Enter employee ID" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter state" />
                </div>
                <div className="space-y-2">
                  <Label>Joined Date</Label>
                  <Input value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN") : "-"} disabled className="bg-muted" />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <Button type="submit" disabled={updating} className="font-bold">
                    {updating ? "Saving..." : "Save Profile Changes"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label>Confirm new password</Label>
                  <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button type="submit" disabled={passUpdating} className="font-bold">
                    {passUpdating ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="2fa">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Authenticator App" enabled />
              <Row label="SMS OTP" />
              <Row label="Email OTP" enabled />
              <Row label="Recovery codes" enabled subtitle="8 unused codes" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogSection />
        </TabsContent>

        <TabsContent value="sessions">
          <DevicesSection mode="sessions" />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesSection mode="devices" />
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardContent className="space-y-3 p-4">
              <Row label="Digest emails" enabled subtitle="Weekly product & security digest" />
              <Row label="Beta features" subtitle="Try experimental modules before release" />
              <Row label="Sound effects" enabled />
              <Row label="Show tooltips on hover" enabled />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, enabled, subtitle }: { label: string; enabled?: boolean; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
      <div>
        <div className="font-medium">{label}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      <Switch defaultChecked={enabled} />
    </div>
  );
}
