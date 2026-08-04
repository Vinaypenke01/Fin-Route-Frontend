import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth-service";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — FinRoute" }, { name: "description", content: "Reset your FinRoute password using OTP." }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedMobile = mobileNumber.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(cleanedMobile);
      navigate({ to: "/reset-password", search: { mobile: cleanedMobile } });
    } catch (err: any) {
      setError(err.message || "Failed to send password reset OTP. Please verify your mobile number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your registered mobile number to receive a 6-digit reset OTP"
      footer={
        <>
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
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

        <div>
          <label className="text-xs font-medium">Registered Mobile Number *</label>
          <PhoneInput
            className="mt-1.5"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
            required
            placeholder="9876543210"
          />
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full font-semibold">
          {loading ? "Sending OTP..." : "Send Reset OTP"}
        </Button>
      </form>
    </AuthShell>
  );
}
