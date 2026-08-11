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
| GAP-007 | L2 | Mock | `api/lib/shared.js` `FALLBACK_DASHBOARD_METRICS` | Hardcoded mock metrics fallback | Violates no-mock doctrine; UI shows fake data | source | Replace with live DB-driven fetch | � closed S1→S5 (removed; live KPI engine = `test_analytics_snapshot.mjs`) | S1 |
| GAP-008 | L4 | Client | `server/api/lib/neonClient.js` vs `api/lib/shared.js` | Two DB-client worlds | Duplicate/divergent DB access violates SSOT | both exist | Reconcile to per-DB `getPool()` SSOT | 🟡 open | S1 |
| GAP-009 | L4 | Banned | `githubAppClient.mjs`, `scripts/test_github_repo_discovery.mjs` | Dead GitHub-App MVP-only code | Banned cross-repo dependency; unnecessary | only user is a test | Delete together | 🟡 open | S1 |
| GAP-010 | L4 | Banned | `EngineeringGateway.js` + `VITE_ENG_*` | Reads another project's Firebase (engineering) | Cross-repo — banned | env vars present | Remove gateway + env entries | 🟡 open | S1 |
| GAP-011 | L4 | Hazard | `api/firebase-bridge.js` | Hardcoded Neon connection strings in source; Realtime→Neon sync | Credential leak + dual source of truth | read file | Retire; per-module apis consume Neon directly | � closed S1/S6 (bridge deleted; 16 tracked seed/migrate scripts de-hardcoded to env, secrets scan clean) | S1 |
| GAP-012 | S4 | UI | Vercel sidebar | **HR module absent from latest deployed sidebar** (user note) | HR is a core module; missing navigation | sidebar components list | Add HR route/pages in S4 | � closed | S4 |

---

## Fix History (closed / verified / noting changes)

| — | Gap | What was done | When | Result |
|----|-----|---------------|------|--------|
| (pending) | GAP-012 | HR module added to sidebar routes; `canViewModule`/registry now expose HR; regression updated — CODE-side complete. **Production blocker (found 2026-08-11):** `hr` was MISSING from Firestore `tenant_modules` for tenant `production`, so `canViewModule(hr)` short-circuited false and the People section (hr_head's only nav group) was filtered out → hr@ login saw only the dashboard. Deployed commit was NOT stale (== latest main). **Fixed:** ran `scripts/seed_tenant_schema.mjs` → added `production_hr {enabled:true}` + enterprise package `moduleIds` now include `hr`. `/api/hr/employees` live (10 rows in accounting DB); hr_head role/tier correct. | S4 code / S7.1 prod (2026-08-11) | People section now renders for hr@ |
| (pending) | — | Accounting `employees` enrichment (019): added `email`/`department`/`position`/`hire_date` + backfill → `/api/hr/employees` live (was querying missing columns → Firestore fallback) | S4 (2026-08-10) | live audit 3 employees |
| (pending) | — | Sales page KPI cards now derive revenue/orders/avg from live orders list (removed hardcoded snapshot zeros) + Neon-field column mapping | S4 (2026-08-10) | build green |
| (pending) | — | S5 live KPI engine: `/api/analytics/snapshot` now computes all 6 module KPIs+scores from live pools (was finance-only with hardcoded score 75); removed client-side hardcoded snapshot zeros/scores | S5 (2026-08-10) | live audit + regression |
| (pending) | — | Command center module health: `/api/analytics/health` CEO-ready scores from DB | S5 (2026-08-10) | test_analytics_snapshot passes |
| (pending) | — | Realtime activity feed mirrors DB facts: `/api/analytics/activity` (sales/CRM/HR), ModuleActivityFeed prefers it | S5 (2026-08-10) | live audit |
| (pending) | GAP-011 | Hardcoded Neon credentials removed from **16 tracked scripts** (`migrate-accounting-data.mjs`, `seed-*.mjs`, `setup-multi-database-schemas.mjs`, `test-neon-connectivity.mjs`, …) → env-driven (`NEON_*` / `DATABASE_URL`) with fail-fast guards; zero `neon.tech` host matches remain in tracked source | S6 (2026-08-10) | secrets scan clean |
| (pending) | — | `npm audit` 21 → 10: removed redundant `npm` CLI project dep (killed brace-expansion/ip-address/tar/undici critical+high); `audit fix` bumped react-router→7.18.2, postcss→8.5.26. Remaining 10 are moderate (dompurify/jspdf, uuid/firebase-admin) requiring breaking majors (jspdf v4 / firebase-admin downgrade) → deferred, documented | S6 (2026-08-10) | npm audit 10 moderate |
| (pending) | — | Per-handler auth (S6.2): `api/lib/shared.js` `requireAuth` — verifies Firebase bearer token when present (authoritative tenant scoping), **rejects all mutations without a valid token (401)**, keeps anonymous GET read-fallback; wired into all 8 Vercel handlers | S6 (2026-08-10) | test_auth_guard 11/11 |
| (pending) | — | Live smoke fixes in `api/inventory.js`: JOIN `stock.product_id = p.id::text` (varchar↔int type mismatch) + dropped non-existent `description`/`category` columns → `/api/inventory/products` returns live rows | S6 (2026-08-10) | test-api.mjs live 200 |
| (pending) | — | S6.1 backup/restore discipline: `scripts/backup-local.mjs` (per-DB titled pg_dump for all 5) + `scripts/restore-drill.mjs` (snapshot→temp-DB restore→verify→cleanup). Drills green on all 5 local DBs (procurement 34 tables/425 rows, main 10/46, accounting 8/43, analytics 4/16, tenantfinance 3/10); `backups/` gitignored | S6 (2026-08-10) | 5/5 restore drills pass |
| (pending) | — | S6.3 env docs: `VERCEL_ENV_SETUP.md` + `PRODUCTION_RUNBOOK.md` now list all 5 per-DB Neon pools (`DATABASE_URL`/`NEON_DATABASE_URL` + `NEON_ACCOUNTING|PROCUREMENT|ANALYTICS|TENANTFINANCE_DB_URL`), consolidated 8-function Vercel architecture, and S6.2 auth requirement (`FIREBASE_SERVICE_ACCOUNT` needed for writes) | S6 (2026-08-10) | docs updated |
| (pending) | — | S6.5 post-deploy smoke (handler level): `scripts/smoke_s65_live.mjs` — drives real `api/*.js` handlers against live local DBs → 12/12 endpoints 200 with live rows (all 8 modules) | S6 (2026-08-10) | 12/12 live |
| (pending) | GAP-008/GAP-007 |  |  |  |

---

## The engine note (for student recordings)
Each gap above becomes a 📓 **RECORDING** in the corresponding teaching module (Lx): the student
reads *what was wrong, where, why, and how the master fixed it* — never touching the project
itself (student boundary, README §1.3).