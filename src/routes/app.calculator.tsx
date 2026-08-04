import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inr } from "@/lib/utils";
import { Calculator, Copy, Printer } from "lucide-react";
import { guestWorkspaceService, CalculatorResult } from "@/lib/services/guest-workspace-service";

export const Route = createFileRoute("/app/calculator")({
  head: () => ({ meta: [{ title: "Loan Calculator — FinRoute" }, { name: "description", content: "Smart loan calculator for daily, weekly and monthly plans." }] }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const [principalStr, setPrincipalStr] = useState("50000");
  const [interestStr, setInterestStr] = useState("24");
  const [durationStr, setDurationStr] = useState("30");
  const [frequency, setFrequency] = useState<string>("daily");
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const principalNum = parseFloat(principalStr) || 0;
  const interestNum = parseFloat(interestStr) || 0;
  const durationNum = parseInt(durationStr, 10) || 0;

  useEffect(() => {
    async function calculate() {
      if (principalNum <= 0 || durationNum <= 0) {
        setResult(null);
        return;
      }
      try {
        const data = await guestWorkspaceService.calculateLoan({
          amount: principalNum,
          interest_rate: interestNum,
          interest_type: "flat_percentage",
          frequency,
          duration: durationNum,
        });
        setResult(data);
      } catch (err) {
        console.error("Calculator error:", err);
      }
    }
    calculate();
  }, [principalNum, interestNum, durationNum, frequency]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Calculator className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Smart Loan Calculator</h3>
            <p className="text-xs text-muted-foreground">Backend-calculated schedule for any frequency</p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <Label>Loan amount</Label>
              <span className="text-sm font-semibold">{inr(principalNum)}</span>
            </div>
            <div className="mt-2 flex gap-3">
              <Slider
                value={[principalNum]}
                min={1000}
                max={500000}
                step={500}
                onValueChange={([v]) => setPrincipalStr(v.toString())}
                className="flex-1"
              />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={principalStr}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  setPrincipalStr(cleaned);
                }}
                className="w-28 font-mono font-semibold text-right"
                placeholder="50000"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Interest (%)</Label>
              <span className="text-sm font-semibold">{interestNum}%</span>
            </div>
            <div className="mt-2 flex gap-3">
              <Slider
                value={[interestNum]}
                min={0}
                max={60}
                step={0.5}
                onValueChange={([v]) => setInterestStr(v.toString())}
                className="flex-1"
              />
              <Input
                type="text"
                inputMode="decimal"
                value={interestStr}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                  setInterestStr(cleaned);
                }}
                className="w-28 font-mono font-semibold text-right"
                placeholder="24"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Duration (installments)</Label>
              <span className="text-sm font-semibold">{durationNum} count</span>
            </div>
            <div className="mt-2 flex gap-3">
              <Slider
                value={[durationNum]}
                min={1}
                max={180}
                step={1}
                onValueChange={([v]) => setDurationStr(v.toString())}
                className="flex-1"
              />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={durationStr}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  setDurationStr(cleaned);
                }}
                className="w-28 font-mono font-semibold text-right"
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <Label>Collection frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground">
          <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground capitalize">
            {frequency} plan
          </Badge>
          <p className="mt-4 text-sm opacity-80">Per {frequency} installment</p>
          <p className="mt-1 font-display text-4xl font-bold">
            {inr(result?.installment_amount || 0)}
          </p>
          <p className="mt-1 text-sm opacity-80">
            × {result?.duration || 0} installments
          </p>
        </div>

        <div className="grid gap-0 divide-y divide-border">
          {[
            { l: "Principal", v: inr(result?.principal_amount || 0) },
            { l: "Total interest", v: inr(result?.total_interest || 0) },
            { l: "Total payable", v: inr(result?.total_payable || 0) },
            { l: "Installment amount", v: inr(result?.installment_amount || 0) },
            { l: "Frequency", v: result?.frequency || "daily" },
            { l: "Total Installments", v: (result?.duration || 0).toString() },
          ].map((r) => (
            <div key={r.l} className="flex items-center justify-between px-6 py-3.5">
              <span className="text-sm text-muted-foreground">{r.l}</span>
              <span className="text-sm font-semibold capitalize">{r.v}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="outline" size="sm">
            <Copy className="size-4" /> Copy summary
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="size-4" /> Print schedule
          </Button>
        </div>
      </Card>
    </div>
  );
}
