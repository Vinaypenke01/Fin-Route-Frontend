import { validatePassword } from "@/lib/auth-validation";
import { Check, X } from "lucide-react";

export function PasswordStrengthChecker({ password }: { password: string }) {
  if (!password) return null;

  const v = validatePassword(password);

  const criteria = [
    { label: "8+ Chars", met: v.hasMinLength },
    { label: "Uppercase (A-Z)", met: v.hasUppercase },
    { label: "Lowercase (a-z)", met: v.hasLowercase },
    { label: "Number (0-9)", met: v.hasNumber },
    { label: "Symbol (!@#$)", met: v.hasSpecialChar },
  ];

  return (
    <div className="mt-2 p-2.5 bg-muted/40 rounded-lg border border-border text-[11px] space-y-1.5">
      <div className="font-semibold text-muted-foreground flex items-center justify-between">
        <span>Password Security Requirements:</span>
        <span className={v.isValid ? "text-emerald-600 font-bold" : "text-amber-600"}>
          {v.isValid ? "✓ Strong Password" : "Criteria Pending"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {criteria.map((c, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium transition-all ${
              c.met
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {c.met ? <Check className="size-3 text-emerald-600" /> : <X className="size-3 text-muted-foreground/60" />}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
