## Version 3 — Lender ERP

Build a dedicated Lender ERP surface at `/erp/*`, separate from the Guest Workspace (`/app`) and Super Admin (`/admin`), reusing the Version 1 design system (Sora/Inter, tokens in `src/styles.css`, shadcn primitives, Recharts).

### Scope

UI only — static/seed data, no backend, no auth logic. Indian localization (₹, names, mobile, addresses, GST).

### Architecture

**Data layer** — `src/lib/erp-data.ts` (new)
- 25 areas, 40 routes, 75 employees, 500 customers, 1,000 loans, 5,000 collections, 500 expenses, 100 reconciliations, 50 notifications, 12-mo revenue/collection analytics, payroll rows, KPIs.
- Deterministic generators (seeded pseudo-random) so lists stay stable across renders.

**Shared ERP components** — `src/components/erp/`
- `erp-sidebar.tsx` — collapsible sidebar with nested groups (Operations, Finance, People, Insights, Account).
- `erp-topbar.tsx` — global search, breadcrumbs, business switcher, branch selector, notification bell, quick-add menu, theme toggle, profile.
- `kpi-card.tsx`, `chart-card.tsx`, `status-chip.tsx` (loan/collection/employee variants), `data-table.tsx` (search + filters + pagination + mobile-card fallback), `timeline.tsx`, `empty-state.tsx`, `skeleton-block.tsx`, `side-sheet.tsx` wrapper, `date-range.tsx`, `filter-panel.tsx`, `file-drop.tsx` (mock).

**Layout**
- `src/routes/erp.tsx` — sidebar + topbar shell, `<Outlet />`, breadcrumbs derived from pathname.

**Routes** (each with head() metadata, mobile-adaptive)

```text
erp.index                 Dashboard (16 KPIs, 12 charts, quick actions)
erp.business              Business Profile (logo, GST, branches, rules, docs)
erp.areas.index           Area list + cards + performance
erp.areas.$id             Area detail
erp.routes.index          Route dashboard + list + calendar/map placeholders
erp.routes.$id            Route detail with drag-visual sequence
erp.customers.index       CRM table/cards + filters + tags
erp.customers.$id         Profile: timeline, loans, collections, guarantors, docs
erp.loans.index           Loan list + approval queue tabs
erp.loans.$id             Loan detail: schedule, repayments, interest/penalty
erp.collections.index     Collection dashboard + records
erp.collections.today     Today's collector view
erp.employees.index       Directory + cards
erp.employees.$id         Employee profile: attendance, leaves, salary, routes
erp.reconciliation        End-of-day cash reconciliation
erp.expenses              Dashboard + list + approval
erp.salary                Payroll dashboard + payslips
erp.reports               Reports hub (14 report types, tabs)
erp.analytics             Executive analytics dashboards
erp.notifications         Notification center
erp.subscription          Plan/usage/billing
erp.settings              Settings (business, rules, roles, integrations)
erp.profile               Owner profile + security + devices
```

**Discoverability**
- Add "ERP" link to `src/components/site-header.tsx` next to Admin.

### Design details

- Reuse existing `--color-primary` (Deep Blue), `--color-accent` (Emerald), `--color-warning` (Amber) tokens; no new palette.
- Tables: desktop `Table`, mobile `divide-y` card list (pattern from `app.expenses`, `app.collections.index`).
- Charts: Recharts Area/Bar/Pie/Line with `var(--color-*)` fills.
- Status chips: reusable `StatusChip` with variants for loan (pending/approved/active/overdue/closed/rejected/defaulted) and collection (paid/partial/skipped/pending).
- Every route file sets unique title/description/og in `head()`.

### Out of scope

- Real map tiles (placeholders with a stylized SVG grid).
- Real drag-and-drop persistence (visual reordering only via local component state).
- Backend, auth, imports/exports (buttons show toast).

### Delivery

Ship in one pass: data → shared components → layout → dashboard → module routes in the order above. Typecheck after each cluster. Final verification with a build and a browser screenshot of `/erp` on desktop + mobile.
