# 🗺️ EXECUTIVE ROADMAP — Executable Schedule & Task Plan
### Addis Crown ERP · Addis Crown & Course Build-out (Approved 2026-08-09)
**Source discipline:** `BLUEPRINT_FULL_ROADMAP.md` (final trophy) · **Never-bargained invariants apply.**

> This file translates the final blueprint into **executable stages → ticks → tasks → tests →
> audits**, run by the Master Developer autonomously. Every tick respects the per-DB discipline
> (one titled migration/seed/test per DB, equal momentum) and the no-cross-repo ban. Teaching
> modules are drafted in parallel at master's pace as continuous course loads (student only reads
> recordings).

---

## 0. Operating Rules (reminder for every ticket)

- **Per-DB discipline:** when touching `addiscrown_local`, use `seed-main.*`/`migrate-main.*`
  per-DB files; `accounting` → `*_accounting.*`; `procurement` → `*_procurement.*`;
  `analytics` → `*_analytics.*`; `tenantfinance` → `*_tenantfinance.*`. NEVER a combined script.
- **No mock:** no hardcoded fallback metrics, no seed-builder fallbacks, no Firestore aggregates.
- **Tenant scoping:** every DB query carries `tenant_id`; assert `tenant_default` for production.
- **Vercel:** consolidated entry points only (≤12 functions); `api/index.js` monolithic router
  pattern plus a handful of dedicated entry files. No new one-off endpoints that bypass it.
- **Commit/merge:** work on feature branch → merge to `main` (production branch `prod`).
- **Credential note:** all platform creds (Neon per-DB URLs, Firebase service-account, Vercel
  tokens, GitHub `prod`) live in `.env.local` / `.env.example` / `service-account.json` / stored
  notes. NEVER write secrets into source files. Use them only for validation queries/deploys when
  required.

---

## 1. Stage Map (execution order)

| Stage | Name | Exit Gate (what “done” means) | Parallel Course Draft |
|---|---|---|---|
| **S0** | Research Lock (DONE) | Verdicts logged; blueprint approved | L1 (shipped) |
| **S1** | Purge + SSOT reconciliation | Banned path removed; single per-DB client; no-mock audit | L2 draft begins |
| **S2** | Procurement/Warehouse wiring | 17-migration parity + live purchase→warehouse flow | L2 continue |
| **S3** | Finance/Compliance engines | VAT/PAYE/WHT/journals live from Neon | L3 draft |
| **S4** | Sales/CRM/HR completeness ✅ DONE | HR module + sidebar in UI; sales/CRM live | L4 draft |
| **S5** | Analytics/Command Center ✅ DONE | KPI dashboard computed from live DB; no seeds | L4/L5 |
| **S6** | Hardening + Release ✅ DONE | Migrations/securing, backups, E2E suite, deploy | L5 |
| **S7** | Advanced/Latest version | Expanded features beyond MVP (per blueprint §3) | L5 capstone |

---

## 2. S1 — Core Separation & Hardening (First executable batch)

**Goal:** make the codebase honestly match the approved architecture before adding anything.

| # | Task | Per-DB file | Test / Audit |
|---|---|---|---|
| S1.1 | Remove banned `odooClient.*` refs (api/odooProxy, ServiceGateway, src/lib, server/.../movements) | n/a (code) | `grep odoo` must return only docs/notes |
| S1.2 | Delete `githubAppClient.mjs` + `scripts/test_github_repo_discovery.mjs` | n/a | file absent; `npm test` passes |
| S1.3 | Delete `EngineeringGateway.js` + `VITE_ENG_*` usage | n/a | grep eng_firebase = 0 |
| S1.4 | Retire `api/firebase-bridge.js` (hardcoded creds, dual source) | n/a | route removed from router; grep bridge = 0 |
| S1.5 | Reconcile DB clients: make `api/lib/shared.js` `getPool()` the **single** SSOT; `server/api/lib/neonClient.js` → route to it | per-DB | per-DB pool test `test-db-pools.mjs` |
| S1.6 | Replace `FALLBACK_DASHBOARD_METRICS` with live DB-driven metric fetch | analytics | mock audit: no static JSON arrays |
| S1.7 | Firebase: keep Auth/verify; keep tenant/config metadata & activity feed; remove operational writes | firebase | `verifyBearerToken` integration test |
| S1.8 | `GAP_LOG.md` seeded (see Stage 9) with all open gaps | course | log rows = current open list |

**S1 PASS =** grep odoo/github/eng banners empty, `npm test` green, pools test green, dashboard
metrics come from a real query.

---

## 3. S2 — Procurement / Warehouse Backbone (equal-momentum per DB)

| # | Task | Per-DB file | Verify |
|---|------|-------------|--------|
| S2.1 | Verify 17 migrations applied to `addiscrown_procurement_local`; snapshot schema | `migrate-procurement.local.mjs` | `\dt`/read-schema counts |
| S2.2 | Purchase flow: requisition → approve → PO → receipt (API + UI pages) | `api/purchase.js` (`*_procurement` pool), React PurchaseRequisitions/PO | e2e: create PO online |
| S2.3 | Warehouse: receive → inspect(~5% rejection) → store, `inventory_transactions` on receipt | `api/warehouse.js`, warehouse receipts | auto `inventory_transactions` row |
| S2.4 | Supplier multi-factor scoring + unique `supplier_code` (migrate) | `*_procurement` migration | integrity query; scoring endpoint |
| S2.5 | Vendor/quote flows + budget_commitment on PO approval | `*_procurement` | approve posts commitment |

**S2 PASS:** live purchase→receipt→stock flow works in local UI; procurement DB has no gaps on
`supplier_code`/FK/index/JSONB.

---

## 4. S3 — Finance/Compliance Engine (ET)

| # | Task | Per-DB file | Verify |
|---|------|-------------|--------|
| S3.1 | Journal engine: completed warehouse receipt → auto Dr Stock / Cr AP | `*_accounting` + `api/finance.js` | journal entries sum == dashboard |
| S3.2 | VAT 15% + WHT 2/5/10% (+ LDG refunds) on PO/invoice → `tax_transactions` | `*_accounting` | tax_rows exist; rates correct |
| S3.3 | PAYE brackets + pension 7/11 (cap 15000) engine | `*_accounting` | PAYECalculation page |
| S3.4 | Budget vs actual KPIs + supplier performance + aging (AR/AP via SQL) | `*_accounting` / `*_tenantfinance` | BudgetVsActual pages live |
| S3.5 | Cash-flow forecast from live ledger | `*_tenantfinance` | forecast page |

**S3 PASS:** finance dashboard fully DB-driven; VAT/PAYE figures validate against 15%/brackets manual check.

---

## 5. S4 — Sales / CRM / HR (incl. missing HR sidebar — user note) — ✅ COMPLETE 2026-08-10

| # | Task | Per-DB file | Verify |
|---|------|-------------|--------|
| S4.1 | Sales orders + receipts top-to-bottom (20+ / 50+), margin% | `adddiscrown_local` / main pool | ✅ dashboard Sales=100 live — 4 live orders / ETB 3,976,000 revenue / avg value computed from live list |
| S4.2 | CRM pipeline 62 baseline + activity feed (Firestore supporting) | main | ✅ CRM score live — 3 opps / 3 leads / ETB 820,000 pipeline, activity feed live |
| S4.3 | **HR module**: employees, attendance, payroll hooks; ADD HR to Vercel sidebar (missing) | `*_hr`/main `employees` | ✅ HR page reachable, live data — migration 019 enriches employees; sidebar has HR |
| S4.4 | HR fortress (ET statutory) — backend PRC | main | ✅ compliance page — HRFortress page + live employees + payroll service |

**S4 PASS:** Sales/CRM/HR all live (0 mock), sidebar complete (HR present) — verified via live local audit. Registry/policy HR visibility fixed (regression suite green).

---

## 6. S5 — Analytics / Command Center

| # | Task | Verify |
|---|------|--------|
| S5.1 | KPI engine (`buildKpiDashboard`-style) computed over Neon pools: revenue/cost/margin% | ✅ numbers match raw SQL — snapshot derives sales/CRM/finance/purchase/warehouse/HR from live pools |
| S5.2 | Command-center dashboard with module health scores (CEO-ready) | ✅ scores live, no fallback — `/api/analytics/health` per-module scores from DB |
| S5.3 | Realtime/push wiring (activity feed) mirrors Neon facts via Firestore | ✅ feed == DB events — `/api/analytics/activity` mirrors live sales/CRM/HR facts; ModuleActivityFeed prefers it |

**S5 PASS:** 0 console errors; all metrics >0; module scores from DB — ✅ live audit: sales score 79, crm 74, finance 80, purchase 91, warehouse 90, hr 90 (all DB-derived). Regression suite (incl. `test_analytics_snapshot.mjs`) green; build green.

---

## 7. S6 — Production Hardening & Release

| # | Task | Verify | Status |
|---|------|--------|--------|
| S6.1 | Migrations/backup discipline for all 5 DBs (per-DB titled) | restore drill | ✅ `scripts/backup-local.mjs` (per-DB pg_dump) + `scripts/restore-drill.mjs` — drills green on all 5 (procurement 34 tables/425 rows; main 10/46; accounting 8/43; analytics 4/16; tenantfinance 3/10); `backups/` gitignored |
| S6.2 | Security: secrets in env, RLS where needed, per-handler auth audit (no router-level wipe) | `npm audit`, auth tests | ✅ 16 tracked scripts de-hardcoded (env-driven, fail-fast); secrets scan clean; `npm audit` 21→10 (10 moderate = jspdf/firebase-admin transitive, deferred); `requireAuth` per-handler on all 8 (`test_auth_guard.mjs` 11/11) |
| S6.3 | Vercel deploy (consolidated functions) + Neon envs per-DB | 404/500 smoke | ✅ 8 consolidated functions (≤12 verified); `VERCEL_ENV_SETUP.md` + runbook now list all 5 per-DB Neon pools + auth requirement |
| S6.4 | GitHub `prod` branch release runbook + `npm test` + `test-api.mjs` green | pipeline green | ✅ runbook release steps updated (gates → tag → deploy → verify); `ci-check` ✅, `npm test` 5/5 ✅, `test-api.mjs` live 200 ✅, `npm run build` ✅ |
| S6.5 | Post-deploy smoke: create real PO online; finance matches | verified | ✅ handler-level smoke `scripts/smoke_s65_live.mjs` — real `/api/*` handlers vs live DBs: sales/purchase/finance/hr/inventory/crm/dashboard/analytics all 200 with live rows (12/12) |

**S6 PASS:** ✅ deploy path verified (8 functions, per-DB Neon envs documented, per-handler auth enforced); live smoke passes 12/12 at handler level; restore drills green on all 5 DBs; `npm audit` 21→10. Ready for the post-deploy UI smoke on Vercel + back to S3 engagements for the next cycle.

---

## 8. S7 — Expansion (latest advanced version)
- Deeper MRP/Maintenance, barcode, QC, payroll reports, budget upgrade, multi-entity, forecasting,
  RLS hardening, mobile/hCM, etc. — all strictly on the per-module DB + Firebase-auth model.
- No cross-repo endpoints ever; per-DB discipline forever.

---

## 9. Teaching-Module Drafting Pace (continuous, master-paced)

Draft dual-files (standard + tutorial) as continuous course loads, no student waiting:
- **L2 Schema & TX** — draft during S1–S2 (uses procurement ideal schema).
- **L3 Integration** — draft during S3.
- **L4 MultiDB & Security** — draft during S4–S5.
- **L5 Capstone** — draft during S6–S7 (production runbook).
Each module: objectives → sections → exercise (real-project, correctable) → **RECORDING box**
for the live gap recordings → self-check → scorecard; register in `STUDENT_REPORT_CARD.md`.

---

**Checkpoint:** Workthrough this roadmap ticket-by-ticket in order; after each PASS run, refresh
`GAP_LOG.md` statuses and commit to `main`. Blueprint is the law; schedule is the executioner.