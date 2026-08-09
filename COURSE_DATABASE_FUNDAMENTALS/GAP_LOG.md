# 📋 GAP_LOG — Gap-Finding & Fix History (Learning History, not just a bug tracker)
> Every gap = curriculum. Each row becomes a teaching recording. Gaps are generated ONLY by
> comparing the real project against the final blueprint/module "should-be" state. Editing
> happens incrementally; statuses update as tickets in `EXECUTIVE_ROADMAP.md` close.
>
> **Format once per gap:** `GAP-### | Source module | Category | Where (DB/table/col/file) |
> What's wrong | Why it's wrong | Evidence | Decided fix | Status | Fixed-by`

---

## Open Gaps (active)

| ID | Mod | Cat | Where | What's wrong | Why it's wrong | Evidence | Decided fix | Status | Fixed-by |
|----|-----|-----|-------|--------------|----------------|----------|-------------|--------|----------|
| GAP-001 | L1 | Schema | `addiscrown_local` `purchase_orders.supplier_id` | No FK constraint to `suppliers` | Referential integrity can break; orphan suppliers | `\d purchase_orders` shows no FK | Add FK to `suppliers` in main-DB migration | 🟡 open | L2/L4 |
| GAP-002 | L1 | Index | `addiscrown_local` `purchase_orders.supplier_id` | No index on child FK | Slow child lookups at scale | `\di` on table; EXPLAIN | `CREATE INDEX idx_purchase_orders_supplier_id` | 🟡 open | L2/L4 |
| GAP-003 | L1 | Schema | `addiscrown_local` `suppliers.supplier_code` | Not unique / nullable | Unreliable reference code | SELECT duplicates | `CREATE UNIQUE INDEX uq_suppliers_supplier_code` + backfill | 🟡 open | S2 |
| GAP-004 | L1 | Normalize | `addiscrown_local` `purchase_orders.items` | JSONB instead of line table | Cannot query/filter/constrain line detail | `\d purchase_orders.items` | Converge to `purchase_order_items` (like procurement DB) | 🟡 open | S2 |
| GAP-005 | L1 | Model | `addiscrown_local` products | `stock` is ledger-based; no `stock` column | Stock must derive from `inventory_transactions` | ledger rows exist | Keep ledger; compute stock via SQL view | 🟡 open | S2 |
| GAP-006 | L2 | Banned leftover | `odooClient.*`, `api/odooProxy.js`, `ServiceGateway.js` | Old Odoo path still referenced in runtime | Banned path; can 500 | grep odoo non-empty | Remove end-to-end | 🟡 open | S1 |
| GAP-007 | L2 | Mock | `api/lib/shared.js` `FALLBACK_DASHBOARD_METRICS` | Hardcoded mock metrics fallback | Violates no-mock doctrine; UI shows fake data | source | Replace with live DB-driven fetch | 🟡 open | S1 |
| GAP-008 | L4 | Client | `server/api/lib/neonClient.js` vs `api/lib/shared.js` | Two DB-client worlds | Duplicate/divergent DB access violates SSOT | both exist | Reconcile to per-DB `getPool()` SSOT | 🟡 open | S1 |
| GAP-009 | L4 | Banned | `githubAppClient.mjs`, `scripts/test_github_repo_discovery.mjs` | Dead GitHub-App MVP-only code | Banned cross-repo dependency; unnecessary | only user is a test | Delete together | 🟡 open | S1 |
| GAP-010 | L4 | Banned | `EngineeringGateway.js` + `VITE_ENG_*` | Reads another project's Firebase (engineering) | Cross-repo — banned | env vars present | Remove gateway + env entries | 🟡 open | S1 |
| GAP-011 | L4 | Hazard | `api/firebase-bridge.js` | Hardcoded Neon connection strings in source; Realtime→Neon sync | Credential leak + dual source of truth | read file | Retire; per-module apis consume Neon directly | 🟡 open | S1 |
| GAP-012 | S4 | UI | Vercel sidebar | **HR module absent from latest deployed sidebar** (user note) | HR is a core module; missing navigation | sidebar components list | Add HR route/pages in S4 | � closed | S4 |

---

## Fix History (closed / verified / noting changes)

| — | Gap | What was done | When | Result |
|----|-----|---------------|------|--------|
| (pending) | GAP-012 | HR module added to sidebar routes; `canViewModule`/registry now expose HR; regression updated | S4 (2026-08-10) | regression green |
| (pending) | — | Accounting `employees` enrichment (019): added `email`/`department`/`position`/`hire_date` + backfill → `/api/hr/employees` live (was querying missing columns → Firestore fallback) | S4 (2026-08-10) | live audit 3 employees |
| (pending) | — | Sales page KPI cards now derive revenue/orders/avg from live orders list (removed hardcoded snapshot zeros) + Neon-field column mapping | S4 (2026-08-10) | build green |
| (pending) | — | S5 live KPI engine: `/api/analytics/snapshot` now computes all 6 module KPIs+scores from live pools (was finance-only with hardcoded score 75); removed client-side hardcoded snapshot zeros/scores | S5 (2026-08-10) | live audit + regression |
| (pending) | — | Command center module health: `/api/analytics/health` CEO-ready scores from DB | S5 (2026-08-10) | test_analytics_snapshot passes |
| (pending) | — | Realtime activity feed mirrors DB facts: `/api/analytics/activity` (sales/CRM/HR), ModuleActivityFeed prefers it | S5 (2026-08-10) | live audit |

---

## The engine note (for student recordings)
Each gap above becomes a 📓 **RECORDING** in the corresponding teaching module (Lx): the student
reads *what was wrong, where, why, and how the master fixed it* — never touching the project
itself (student boundary, README §1.3).