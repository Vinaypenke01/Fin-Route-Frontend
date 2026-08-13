import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Input, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth-service";
import { Check, X, ArrowLeft, ShieldCheck, KeyRound, Mail } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    mobile: (search.mobile as string) || "",
    email: (search.email as string) || "",
  }),
  head: () => ({ meta: [{ title: "Reset Password — FinRoute" }, { name: "description", content: "Verify Email OTP and set a new password." }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/reset-password" });

  // Step 1: Confirm OTP | Step 2: Set New Password
  const [step, setStep] = useState<1 | 2>(1);
  const [mobileNumber, setMobileNumber] = useState(search.mobile || "");
  const [emailAddress, setEmailAddress] = useState(search.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password Security Criteria Checks
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Resend OTP via Email
  const handleResendOtp = async () => {
    const target = emailAddress || mobileNumber;
    if (!target) {
      setError("Please enter your registered email address to resend OTP.");
      return;
    }
    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      await authService.forgotPassword(target);
      setSuccess("A new 6-digit reset OTP has been sent to your email inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend Email OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // STEP 1: Verify Email OTP Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const targetMobile = mobileNumber || emailAddress;
    if (!targetMobile) {
      setError("Please provide your registered email or mobile number.");
      return;
    }

    if (!otp.trim() || otp.length < 6) {
      setError("Please enter the 6-digit OTP sent to your email inbox.");
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOtp(targetMobile, otp.trim(), "password_reset");
      setSuccess("Email OTP verified successfully! Please set your new password below.");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP. Please check your email inbox and try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Update Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const targetMobile = mobileNumber || emailAddress;

    if (!isPasswordValid) {
      setError("Please ensure your new password meets all security criteria below.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter identical passwords.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        mobile_number: targetMobile,
        otp: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess("Password updated successfully! Redirecting to sign in...");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please verify your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? "Step 1: Confirm Email OTP" : "Step 2: Set New Password"}
      subtitle={
        step === 1
          ? "Check your email inbox for the 6-digit verification code"
          : "Create a strong new password for your workspace account"
      }
      footer={
        <>
          <Link to="/login" className="font-medium text-primary hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </>
      }
    >
      {/* STEP 1: CONFIRM OTP FORM */}
      {step === 1 && (
        <form onSubmit={handleVerifyOtp} className="grid gap-4">
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
            <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <Mail className="size-3.5 text-primary" /> Registered Email / Account *
            </label>
            <Input
              type="text"
              className="h-10 text-sm"
              value={emailAddress || mobileNumber}
              onChange={(e) => {
                setEmailAddress(e.target.value);
                setMobileNumber(e.target.value);
              }}
              required
              placeholder="e.g. user@example.com or 9876543210"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">6-Digit Email OTP Code *</label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend Email OTP"}
              </button>
            </div>
            <Input
              className="mt-1.5 font-mono text-center text-base tracking-widest h-11"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              placeholder="123456"
            />
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full font-semibold gap-2">
            <ShieldCheck className="size-4" />
            {loading ? "Verifying Email OTP..." : "Confirm & Verify Email OTP"}
          </Button>
        </form>
      )}

      {/* STEP 2: SET NEW PASSWORD FORM */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="grid gap-4">
          {/* Email OTP Verification Confirmed Badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              Email OTP Verified for {emailAddress || mobileNumber}
            </span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] underline text-emerald-800 dark:text-emerald-200 font-medium hover:text-emerald-900"
            >
              Change OTP
            </button>
          </div>

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
            <label className="text-xs font-medium">New Password *</label>
            <PasswordInput
              className="mt-1.5"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {/* Password Security Checklist */}
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
              <div className={`flex items-center gap-1.5 ${passwordChecks.number ? "text-emerald-600 font-semibold" : "text-muted-foreground text-opacity-80"}`}>
                {passwordChecks.number ? <Check className="size-3" /> : <X className="size-3" />} 1 Number (0-9)
              </div>
              <div className={`flex items-center gap-1.5 ${passwordChecks.special ? "text-emerald-600 font-semibold" : "text-muted-foreground text-opacity-80"}`}>
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

          <Button type="submit" size="lg" disabled={loading} className="w-full font-semibold gap-2">
            <KeyRound className="size-4" />
            {loading ? "Updating Password..." : "Update Password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
