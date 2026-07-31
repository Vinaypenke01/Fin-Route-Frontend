export type Frequency = "Daily" | "Weekly" | "Monthly";

export function calcLoan(principal: number, interestPct: number, months: number, frequency: Frequency) {
  const totalInterest = (principal * interestPct * months) / 1200; // simple interest, monthly rate
  const totalPayable = principal + totalInterest;
  const days = months * 30;
  const weeks = Math.max(1, Math.round(months * 4.33));
  const installments = frequency === "Daily" ? days : frequency === "Weekly" ? weeks : months;
  const perInstallment = totalPayable / installments;
  const closing = new Date(Date.now() + days * 86400000);
  return {
    totalInterest,
    totalPayable,
    daily: totalPayable / days,
    weekly: totalPayable / weeks,
    monthly: totalPayable / months,
    perInstallment,
    installments,
    closing: closing.toISOString().slice(0, 10),
  };
}
