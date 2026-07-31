import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { authService } from "@/lib/services/auth-service";
import { isValidIndianMobile } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create your workspace — FinRoute" }, { name: "description", content: "Get your free digital collection book in 2 minutes." }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must agree to the Terms of Service to continue.");
      return;
    }
    const cleanMobile = mobileNumber.replace(/^\+91/, "").trim();
    if (!isValidIndianMobile(cleanMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const fullMobile = `+91${cleanMobile}`;
    try {
      await authService.register({
        full_name: fullName,
        mobile_number: fullMobile,
        email: email || undefined,
        password,
        confirm_password: confirmPassword,
      });

      navigate({ to: "/verify-otp" as any, search: { mobile: fullMobile, email: email || "" } as any });
    } catch (err: any) {
      if (err.errors) {
        const firstErrorKey = Object.keys(err.errors)[0];
        setError(err.errors[firstErrorKey]?.[0] || err.message);
      } else {
        setError(err.message || "Registration failed. Please check your inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Free forever. No credit card required."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <Tabs defaultValue="guest">
        <TabsList className="w-full">
          <TabsTrigger value="guest" className="flex-1">Guest (Free)</TabsTrigger>
          <TabsTrigger value="business" className="flex-1">Business Account</TabsTrigger>
        </TabsList>

        <TabsContent value="guest" className="pt-5">
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Full name</label>
                <Input
                  className="mt-1.5"
                  placeholder="Rajesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium">Mobile Number</label>
                <PhoneInput
                  className="mt-1.5"
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Email (optional)</label>
              <Input
                className="mt-1.5"
                placeholder="rajesh@sharmafinance.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Password</label>
                <PasswordInput
                  className="mt-1.5"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium">Confirm Password</label>
                <PasswordInput
                  className="mt-1.5"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox
                className="mt-0.5"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(!!checked)}
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="text-primary font-medium underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" className="text-primary font-medium underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Creating Account..." : "Get the Free Book"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="business" className="pt-5">
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-muted/30 border border-border/80 rounded-xl space-y-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <div className="space-y-2 max-w-sm">
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/10 text-primary border-primary/20">
                Coming Soon
              </Badge>
              <h3 className="font-display font-bold text-base text-foreground">
                Business Account Multi-Branch ERP
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This feature will be released in the upcoming days! We are finalizing multi-agent hierarchy, automated WhatsApp collection receipts, and advanced agency analytics.
              </p>
            </div>
            <div className="pt-2 border-t border-border/40 w-full max-w-xs">
              <p className="text-[11px] font-medium text-muted-foreground">
                Want to start managing collections right away? Use the <span className="font-bold text-foreground">Guest (Free)</span> tab to get started instantly.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AuthShell>
  );
}
