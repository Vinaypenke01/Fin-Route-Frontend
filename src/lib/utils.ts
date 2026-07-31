import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inr(val: number | string): string {
  const num = typeof val === "number" ? val : parseFloat(val) || 0;
  return "₹" + Math.round(num).toLocaleString("en-IN");
}

export function isValidIndianMobile(mobile: string): boolean {
  if (!mobile) return false;
  const cleaned = mobile.replace(/[\s\-\(\)]/g, "");
  const num = cleaned.startsWith("+91")
    ? cleaned.slice(3)
    : cleaned.startsWith("91") && cleaned.length === 12
    ? cleaned.slice(2)
    : cleaned.startsWith("0") && cleaned.length === 11
    ? cleaned.slice(1)
    : cleaned;
  return /^[6-9]\d{9}$/.test(num);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
