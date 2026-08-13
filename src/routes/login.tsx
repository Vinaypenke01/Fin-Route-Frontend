import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Input, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/lib/services/auth-service";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { Loader2, Mail, Lock } from "lucide-react";
import { validatePassword, validateMobileNumber } from "@/lib/auth-validation";
import { PasswordStrengthChecker } from "@/components/password-strength-checker";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — FinRoute" }, { name: "description", content: "Sign in to your FinRoute workspace." }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [rememberError, setRememberError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIdentifierError(null);
    setPasswordError(null);
    setRememberError(null);

    const rawId = identifier.trim();
    if (!rawId) {
      setIdentifierError("Please enter your registered email address or mobile number.");
      setLoading(false);
      return;
    }

    // 1. Check if user entered an Email vs Mobile Number
    let loginValue = rawId;
    if (rawId.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawId)) {
        setIdentifierError("Please enter a valid email address (e.g. user@example.com).");
        setLoading(false);
        return;
      }
    } else {
      const mobileVal = validateMobileNumber(rawId);
      if (!mobileVal.isValid) {
        setIdentifierError(mobileVal.error || "Please enter a valid 10-digit mobile number or email address.");
        setLoading(false);
        return;
      }
      loginValue = `+91${mobileVal.cleaned}`;
    }

    // 2. Validate Password Requirements
    const passVal = validatePassword(password);
    if (!passVal.isValid) {
      setPasswordError(`Password must include: ${passVal.errors.join(", ")}.`);
      setLoading(false);
      return;
    }

    // 3. Validate Remember Me Checkbox
    if (!rememberMe) {
      setRememberError("Please check 'Keep me signed in on this device' to proceed.");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.login(loginValue, password);
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
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
            <Mail className="size-3.5 text-primary" /> Email Address or Mobile Number *
          </label>
          <Input
            type="text"
            className="h-10 text-sm"
            placeholder="e.g. user@example.com or 9876543210"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setIdentifierError(null);
            }}
            required
          />
          {identifierError && (
            <p className="text-[11px] text-destructive font-medium mt-1">{identifierError}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <Lock className="size-3.5 text-primary" /> Password *
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">Forgot?</Link>
          </div>
          <PasswordInput
            className="h-10"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
            required
          />
          {passwordError && (
            <p className="text-[11px] text-destructive font-medium mt-1">{passwordError}</p>
          )}

          {/* Real-time Password Security Criteria Checklist */}
          <PasswordStrengthChecker password={password} />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => {
                setRememberMe(Boolean(checked));
                setRememberError(null);
              }}
            />
            <span>Keep me signed in on this device</span>
          </label>
          {rememberError && (
            <p className="text-[11px] text-destructive font-medium mt-1">{rememberError}</p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={loading} className="font-bold flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Verifying & Signing in...</span>
            </>
          ) : (
            "Sign in"
          )}
        </Button>

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
