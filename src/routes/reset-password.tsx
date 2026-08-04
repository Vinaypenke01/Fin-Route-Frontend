import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth-service";
import { Check, X, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    mobile: (search.mobile as string) || "",
  }),
  head: () => ({ meta: [{ title: "Set New Password — FinRoute" }, { name: "description", content: "Set a new password for your workspace." }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/reset-password" });

  const [mobileNumber, setMobileNumber] = useState(search.mobile || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password Requirements Check
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleResendOtp = async () => {
    const cleaned = mobileNumber.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) {
      setError("Please enter a valid 10-digit mobile number to resend OTP.");
      return;
    }
    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      await authService.forgotPassword(cleaned);
      setSuccess("A new reset OTP has been sent to your mobile number.");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanedMobile = mobileNumber.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!otp.trim() || otp.length < 6) {
      setError("Please enter the 6-digit OTP sent to your mobile.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your new password meets all security criteria below.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify your new password.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        mobile_number: cleanedMobile,
        otp: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter the OTP received on your mobile and set your new password"
      footer={
        <>
          <Link to="/login" className="font-medium text-primary hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && (
          <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            {success}
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Mobile Number *</label>
          <PhoneInput
            className="mt-1.5"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
            required
            placeholder="9876543210"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">6-Digit Reset OTP *</label>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend OTP"}
            </button>
          </div>
          <Input
            className="mt-1.5 font-mono text-center text-base tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            placeholder="123456"
          />
        </div>

        <div>
          <label className="text-xs font-medium">New Password *</label>
          <PasswordInput
            className="mt-1.5"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        {/* Password Strength Checklist */}
        <div className="p-3 bg-muted/40 border border-border/70 rounded-lg space-y-1 text-[11px]">
          <p className="font-semibold text-muted-foreground mb-1.5">Password Security Criteria:</p>
          <div className="grid grid-cols-2 gap-1">
            <div className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
              {passwordChecks.length ? <Check className="size-3" /> : <X className="size-3" />} 8+ Characters
            </div>
            <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
              {passwordChecks.uppercase ? <Check className="size-3" /> : <X className="size-3" />} 1 Uppercase (A-Z)
            </div>
            <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
              {passwordChecks.lowercase ? <Check className="size-3" /> : <X className="size-3" />} 1 Lowercase (a-z)
            </div>
            <div className={`flex items-center gap-1.5 ${passwordChecks.number ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
              {passwordChecks.number ? <Check className="size-3" /> : <X className="size-3" />} 1 Number (0-9)
            </div>
            <div className={`flex items-center gap-1.5 ${passwordChecks.special ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
              {passwordChecks.special ? <Check className="size-3" /> : <X className="size-3" />} 1 Special Symbol (!@#$)
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Confirm New Password *</label>
          <PasswordInput
            className="mt-1.5"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full font-semibold">
          {loading ? "Updating Password..." : "Update Password"}
        </Button>
      </form>
    </AuthShell>
  );
}
