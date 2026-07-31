import { useEffect, useState, useCallback } from "react";
import {
  getEffectiveLimits,
  getUsage,
  markTodayActive,
  incrementCustomers,
  resetUsage,
  canOperateToday,
  canAddCustomer,
  type EffectiveLimits,
  type Usage,
} from "@/lib/guest-plan";

export function useGuestPlan() {
  const [limits, setLimits] = useState<EffectiveLimits>(() => getEffectiveLimits());
  const [usage, setUsage] = useState<Usage>(() => getUsage());

  const refresh = useCallback(() => {
    setLimits(getEffectiveLimits());
    setUsage(getUsage());
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("guest-plan-change", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("guest-plan-change", on);
      window.removeEventListener("storage", on);
    };
  }, [refresh]);

  return {
    limits,
    usage,
    operate: canOperateToday(limits, usage),
    canAdd: canAddCustomer(limits, usage),
    markTodayActive: () => {
      markTodayActive();
      refresh();
    },
    incrementCustomers: (n?: number) => {
      incrementCustomers(n);
      refresh();
    },
    resetUsage: () => {
      resetUsage();
      refresh();
    },
  };
}
