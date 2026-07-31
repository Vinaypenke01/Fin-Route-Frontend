import { createFileRoute } from "@tanstack/react-router";
import { Bell, Globe, Lock, Moon, ShieldCheck, Info, ChevronRight } from "lucide-react";
import { FieldShell } from "@/components/field/field-shell";
import { MSection } from "@/components/field/field-ui";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/field/settings")({
  head: () => ({
    meta: [
      { title: "Settings · FinRoute Field" },
      { name: "description", content: "Language, theme, notifications, security and app info." },
      { property: "og:title", content: "Settings — FinRoute Field" },
      { property: "og:description", content: "Manage the field collector app preferences." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { theme, toggle } = useTheme();
  return (
    <FieldShell title="Settings" back="/field/profile">
      <MSection title="Appearance" />
      <Card className="mb-4 divide-y">
        <Row icon={<Moon className="size-4" />} label="Dark mode" trailing={<Switch checked={theme==="dark"} onCheckedChange={toggle} />} />
        <Row icon={<Globe className="size-4" />} label="Language" value="English" />
      </Card>

      <MSection title="Notifications" />
      <Card className="mb-4 divide-y">
        <Row icon={<Bell className="size-4" />} label="Push notifications" trailing={<Switch defaultChecked />} />
        <Row icon={<Bell className="size-4" />} label="Collection reminders" trailing={<Switch defaultChecked />} />
        <Row icon={<Bell className="size-4" />} label="Attendance nudge" trailing={<Switch />} />
      </Card>

      <MSection title="Security" />
      <Card className="mb-4 divide-y">
        <Row icon={<Lock className="size-4" />} label="Change password" chevron />
        <Row icon={<ShieldCheck className="size-4" />} label="Biometric login" trailing={<Switch defaultChecked />} />
      </Card>

      <MSection title="Privacy" />
      <Card className="mb-4 divide-y">
        <Row icon={<ShieldCheck className="size-4" />} label="Privacy policy" chevron />
        <Row icon={<Info className="size-4" />} label="Terms of service" chevron />
      </Card>

      <MSection title="About" />
      <Card className="mb-8 divide-y">
        <Row icon={<Info className="size-4" />} label="Version" value="v4.0.0" />
        <Row icon={<Info className="size-4" />} label="Build" value="2026.09.30" />
      </Card>
    </FieldShell>
  );
}

function Row({ icon, label, value, trailing, chevron }: { icon: React.ReactNode; label: string; value?: string; trailing?: React.ReactNode; chevron?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      {trailing}
      {chevron && <ChevronRight className="size-4 text-muted-foreground" />}
    </div>
  );
}
