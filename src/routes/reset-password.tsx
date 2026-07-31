import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — FinRoute" }, { name: "description", content: "Choose a new password for your workspace." }] }),
  component: ResetPage,
});

function ResetPage() {
  return (
    <AuthShell title="Set a new password" subtitle="At least 8 characters with a number and a symbol">
      <form className="grid gap-4">
        <div>
          <label className="text-xs font-medium">New password</label>
          <PasswordInput className="mt-1.5" placeholder="••••••••" />
        </div>
        <div>
          <label className="text-xs font-medium">Confirm password</label>
          <PasswordInput className="mt-1.5" placeholder="••••••••" />
        </div>
        <Button asChild size="lg"><Link to="/login">Update password</Link></Button>
      </form>
    </AuthShell>
  );
}
