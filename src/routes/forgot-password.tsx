import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — FinRoute" }, { name: "description", content: "Reset your FinRoute password." }] }),
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link"
      footer={<><Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></>}
    >
      <form className="grid gap-4">
        <div><label className="text-xs font-medium">Email</label><Input className="mt-1.5" placeholder="you@business.com" /></div>
        <Button asChild size="lg"><Link to="/reset-password">Send reset link</Link></Button>
      </form>
    </AuthShell>
  );
}
