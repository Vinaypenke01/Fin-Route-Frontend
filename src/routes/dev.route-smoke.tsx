import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Loader2, PlayCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/dev/route-smoke")({
  head: () => ({
    meta: [
      { title: "Route Smoke Test — FinRoute Dev" },
      { name: "description", content: "In-app smoke test that navigates every registered route and surfaces mismatches." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteSmokePage,
});

type Status = "pending" | "running" | "pass" | "fail" | "skip";
type Row = { id: string; path: string; hasParams: boolean; status: Status; note?: string; ms?: number };

// Realistic sample params so dynamic routes can be exercised too.
const SAMPLE_PARAMS: Record<string, string> = {
  id: "1",
  customerId: "1",
  loanId: "1",
  slug: "sample",
};

function fillParams(path: string): { filled: string; hasParams: boolean; missing: string[] } {
  const missing: string[] = [];
  let hasParams = false;
  const filled = path.replace(/\$([a-zA-Z0-9_]+)/g, (_, name) => {
    hasParams = true;
    const v = SAMPLE_PARAMS[name];
    if (!v) missing.push(name);
    return v ?? `$${name}`;
  });
  return { filled, hasParams, missing };
}

function RouteSmokePage() {
  const router = useRouter();
  const initialRows = useMemo<Row[]>(() => {
    const routesById = router.routesById as Record<string, { fullPath?: string; id: string }>;
    const seen = new Set<string>();
    const rows: Row[] = [];
    for (const id of Object.keys(routesById)) {
      const r = routesById[id];
      const full = r.fullPath;
      if (!full) continue;
      if (full === "" || full === "/") {
        if (seen.has("/")) continue;
        seen.add("/");
        rows.push({ id, path: "/", hasParams: false, status: "pending" });
        continue;
      }
      // Skip pathless layout wrappers (they have no fullPath segment of their own).
      if (full.endsWith("/") && full !== "/") continue;
      if (seen.has(full)) continue;
      seen.add(full);
      const { hasParams } = fillParams(full);
      rows.push({ id, path: full, hasParams, status: "pending" });
    }
    rows.sort((a, b) => a.path.localeCompare(b.path));
    return rows;
  }, [router]);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<"all" | "fail" | "params">("all");

  const summary = useMemo(() => {
    const total = rows.length;
    const pass = rows.filter((r) => r.status === "pass").length;
    const fail = rows.filter((r) => r.status === "fail").length;
    const skip = rows.filter((r) => r.status === "skip").length;
    return { total, pass, fail, skip };
  }, [rows]);

  const runAll = async () => {
    setRunning(true);
    const startedAt = performance.now();
    // Reset
    setRows((prev) => prev.map((r) => ({ ...r, status: "pending", note: undefined, ms: undefined })));
    const startingPath = router.state.location.pathname;

    for (let i = 0; i < initialRows.length; i++) {
      const row = initialRows[i];
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)));
      const { filled, missing } = fillParams(row.path);

      if (missing.length) {
        setRows((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "skip", note: `Missing sample for :${missing.join(", :")}` } : r,
          ),
        );
        continue;
      }

      const t0 = performance.now();
      try {
        const match = router.matchRoutes(filled, {});
        const leaf = match?.[match.length - 1];
        if (!leaf || (leaf as { routeId?: string }).routeId === "__root__") {
          throw new Error("No route matched (fell through to root)");
        }
        // Preload = resolves the route module & runs beforeLoad; catches import/mismatch errors.
        await router.preloadRoute({ to: filled });
        const ms = Math.round(performance.now() - t0);
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "pass", ms } : r)));
      } catch (err) {
        const ms = Math.round(performance.now() - t0);
        const message = err instanceof Error ? err.message : String(err);
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "fail", note: message, ms } : r)),
        );
      }
    }

    // Return to starting location if we drifted.
    if (router.state.location.pathname !== startingPath) {
      await router.navigate({ to: startingPath });
    }
    // eslint-disable-next-line no-console
    console.log(`[route-smoke] finished in ${Math.round(performance.now() - startedAt)}ms`);
    setRunning(false);
  };

  const visible = rows.filter((r) => {
    if (filter === "fail") return r.status === "fail";
    if (filter === "params") return r.hasParams;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">/dev/route-smoke</p>
          <h1 className="text-3xl font-display font-bold">Route Smoke Test</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Enumerates every route registered with TanStack Router, verifies the URL resolves to a real
            leaf, and preloads its module. Failures surface import errors, path/ID mismatches, or
            unreachable routes immediately.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={runAll}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            {running ? "Running…" : `Run ${rows.length} checks`}
          </button>

          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(["all", "fail", "params"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 ${filter === f ? "bg-muted font-medium" : "bg-background"}`}
              >
                {f === "all" ? "All" : f === "fail" ? "Failures" : "Dynamic"}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Total: {summary.total}</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> {summary.pass}
            </span>
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" /> {summary.fail}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> {summary.skip}
            </span>
          </div>
        </div>

        {summary.fail > 0 && (
          <div className="rounded-md border border-red-500/40 bg-red-500/5 p-3 text-sm">
            <strong className="text-red-600 dark:text-red-400">{summary.fail} route mismatch(es).</strong>{" "}
            Filter by <em>Failures</em> to inspect.
          </div>
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-24">Status</th>
                <th className="text-left px-3 py-2">Path</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Route ID</th>
                <th className="text-right px-3 py-2 w-20">ms</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-border/60 align-top">
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <div className="flex flex-col gap-1">
                      {r.hasParams || r.status === "fail" ? (
                        <span>{r.path}</span>
                      ) : (
                        <Link
                          to={r.path}
                          className="text-primary hover:underline"
                        >
                          {r.path}
                        </Link>
                      )}
                      {r.note && (
                        <span className="text-red-600 dark:text-red-400 font-sans text-xs">
                          {r.note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground hidden md:table-cell">
                    {r.id}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {r.ms != null ? r.ms : "—"}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground text-sm">
                    Nothing to show for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: dynamic routes are exercised with sample params (<code>$id → 1</code>,{" "}
          <code>$slug → sample</code>). Add more in <code>SAMPLE_PARAMS</code> to cover new segments.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground", icon: null },
    running: {
      label: "Running",
      cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    pass: {
      label: "Pass",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    fail: {
      label: "Fail",
      cls: "bg-red-500/10 text-red-600 dark:text-red-400",
      icon: <XCircle className="h-3 w-3" />,
    },
    skip: {
      label: "Skip",
      cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };
  const v = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${v.cls}`}>
      {v.icon}
      {v.label}
    </span>
  );
}
