import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authService } from "@/lib/services/auth-service";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({
    meta: [
      { title: "Verify Email OTP — FinRoute" },
      { name: "description", content: "Enter the 6-digit email verification code we sent to your email inbox." },
    ],
  }),
  component: OtpPage,
});

function OtpPage() {
  const navigate = useNavigate();
  const search: any = useSearch({ from: "/verify-otp" });
  const mobileNumber = search?.mobile || "";
  const emailAddress = search?.email || "";

  const emailDisplay = emailAddress ? emailAddress : "your registered email address";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.verifyOtp(mobileNumber, otp, "registration");
      setMessage("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        navigate({ to: "/login" as any });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid Email OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    setResending(true);
    setError(null);
    try {
      await authService.resendOtp(mobileNumber, "registration");
      setMessage(`A new verification code has been sent to ${emailDisplay}.`);
    } catch (err: any) {
      setError(err.message || "Failed to resend Email OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your Email"
      subtitle={`We've sent a 6-digit code to ${emailDisplay}`}
      footer={
        <>
          Didn't receive the email?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            {resending ? "Sending..." : "Resend Email OTP"}
          </button>
        </>
      }
    >
      <form onSubmit={handleVerify} className="grid gap-5">
        {/* Email Hint Banner */}
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-2.5">
          <Mail className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">Email OTP Sent</p>
            <p className="text-muted-foreground text-[11px]">
              Check your inbox and spam/junk folder for your 6-digit verification code.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs text-destructive bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="p-3 rounded-xl text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="flex justify-center py-2">
          <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="size-11 text-base font-bold font-mono" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full font-bold">
          {loading ? "Verifying..." : "Verify Email & Continue"}
        </Button>
      </form>
    </AuthShell>
  );
}
