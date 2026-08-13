import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth-service";
import { Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — FinRoute" }, { name: "description", content: "Reset your FinRoute password via Email OTP." }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = identifier.trim();
    if (!val) {
      setError("Please enter your registered email address or mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(val);
      const targetMobile = res?.data?.mobile_number || val;
      const targetEmail = res?.data?.email || "";

      // Navigate to /reset-password with query params
      navigate({
        to: "/reset-password",
        search: { mobile: targetMobile, email: targetEmail },
      });
    } catch (err: any) {
      setError(err.message || "Failed to send reset OTP. Please verify your registered email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your registered email address to receive a 6-digit reset OTP in your inbox"
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
          <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
            <Mail className="size-3.5 text-primary" /> Registered Email Address (or Mobile Number) *
          </label>
          <Input
            type="text"
            className="h-10 text-sm"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="e.g. user@example.com or 9876543210"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            We will send a 6-digit One-Time Password (OTP) to your registered email address.
          </p>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full font-semibold gap-2">
          {loading ? "Sending Email OTP..." : "Send Reset OTP to Email"}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </AuthShell>
  );
}
