import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/services/auth-service";
import { PwaInstallButton } from "@/components/pwa-install-button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — FinRoute" }, { name: "description", content: "Sign in to your FinRoute workspace." }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fullMobile = identifier.startsWith("+91") ? identifier : `+91${identifier}`;
    try {
      const data = await authService.login(fullMobile, password);
      const portalMap: Record<string, string> = {
        admin: "/admin",
        lender: "/erp",
        employee: "/field",
        guest: "/app",
      };
      const dest = portalMap[data.user.account_type] || "/app";
      navigate({ to: dest as any });
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace"
      footer={<>New to FinRoute? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Mobile Number</label>
          <PhoneInput
            className="mt-1.5"
            placeholder="9876543210"
            value={identifier.replace(/^\+91/, "")}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
          </div>
          <PasswordInput
            className="mt-1.5"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox defaultChecked /> Keep me signed in on this device
        </label>

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        {/* <div className="relative py-2">
          <Separator />
          <span className="absolute inset-x-0 -top-0.5 mx-auto w-fit bg-background px-2 text-[10px] uppercase text-muted-foreground">
            Or continue with
          </span>
        </div> */}

        {/* <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline">Google</Button>
          <Button type="button" variant="outline">Microsoft</Button>
        </div> */}

        <PwaInstallButton
          variant="outline"
          className="w-full h-10 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-bold dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
          label="Install FinRoute App on Mobile / PC"
          showSubtext
        />

        <p className="text-center text-xs text-muted-foreground pt-1">
          Want to try without an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Create Guest Workspace</Link>
        </p>
      </form>
    </AuthShell>
  );
}
