# GAP_LOG — Production Rollout & S7 Backlog Tracking

> Refresh statuses after every PASS run and commit to `main`. Source of truth for
> what is DONE vs OPEN vs KNOWN-GAP across the production release and S7 scope.

## Legend
- ✅ DONE (verified live) · 🟡 PARTIAL (works but incomplete) · 🔴 OPEN (not started / blocked) · ⚠️ KNOWN-GAP (documented limitation)

---

## 1. Production release baseline (S7.0 — current live state)

| # | Item | Status | Notes / evidence |
|---|------|--------|------------------|
| G1 | All 5 Neon DBs reachable | ✅ | `scripts/resolve-neon-urls.mjs` → 5/5 REACHABLE (main, accounting, procurement, analytics, tenantfinance) |
| G2 | Pre-push backups of all 5 Neon DBs | ✅ | `backups/neon-pre-push/` (PG18-safe pg_dump) |
| G3 | Gap-fill push local→Neon (main + accounting) | ✅ | created+seeded sales_orders(4), crm_opportunities(3), customers(3), vendor_bills(3), customer_invoices(3) |
| G4 | Firebase standardization | ✅ | `audit_firebase.mjs --fix`: removed 4 orphan demo users + tenant_demo; aligned tenant_default; re-audit ERR=0 WARN=0 |
| G5 | Vercel auto-deploy on git push main | ✅ | deploy Ready; prod alias `prod-puce-three.vercel.app` |
| G6 | Live API smoke | ✅ | **15/15 endpoints** return real data |
| G7 | Inventory products integer/text JOIN bug | ✅ | `stock.product_id::text = p.id::text` (commit `6087e3a5`) |
| G8 | Inventory movements empty | ✅ | reads analytics, schema-adaptive columns (commit `ab004e42`) |
| G9 | Duplicate locations (30→6) + cycle counts (12→4) | ✅ | deduped in Neon + UNIQUE constraints added (seeds now idempotent) |
| G10 | Writes auth-enforced | ✅ | POST w/o/invalid token → HTTP 401 |
| G11 | HR module visible in production sidebar (hr@ login) | ✅ | Root cause: `production_hr` was MISSING from Firestore `tenant_modules` (only dashboard/finance/inventory/purchase/sales present) → `canViewModule(hr)` returned false → People section filtered out → hr@ saw only dashboard. NOT a stale deploy: deployed commit == latest main (`25a9a7e1`). Fixed via `seed_tenant_schema.mjs` → `production_hr enabled=true` + enterprise package moduleIds now include `hr`. Backend (`/api/hr/employees` live, 10 rows in accounting DB) + role/tier (`hr_head`, tier 2) were already correct. |

---

## 2. KNOWN-GAPS / limitations (documented, non-blocking)

| # | Gap | Severity | Detail |
|---|-----|----------|--------|
| K1 | Dashboard financial KPIs show 0 | ⚠️ | `revenue`/`receivables`/`payables`/`warehouseReadyToPick`/`warehouseScore` = 0 — data-seeding gap across per-DB split, not a code bug. Scores from seeded tables (sales 70, crm 100, purchase 64, finance 70) are real. |
| K2 | `addiscrown.et` domain serves a DIFFERENT app | ⚠️ | Domain is aliased to another Vercel project (Next.js 404). Must re-alias to this `prod` project or accept `prod-puce-three.vercel.app`. |
| K3 | Per-deploy Vercel URLs behind SSO | ⚠️ | `prod-<hash>-jafers-projects-761b2f62.vercel.app` require Vercel team auth. Only prod alias is public. |
| K4 | Bundle size ~1.5 MB (gzip 434 KB) | ⚠️ | Vite chunk warning; code-split later (P3). |
| K5 | Stub modules (Barcode, QC, Logistics, Work Orders, notif stubs) | ⚠️ | Placeholders, not regressions — in S7 P1 backlog. |
| K6 | Shared demo password `Password123!` | ⚠️ | For 8 seeded test users only; rotate before real use. |
| K7 | GitHub PAT embedded in origin remote URL | ⚠️ | `https://ghp_…@github.com/jaja44-hub/prod.git` — rotate token & switch to SSH/credential helper. |
| K8 | `npm audit` 10 moderate (jspdf/firebase-admin transitive) | ⚠️ | Deferred, tracked from S6.2. |

---

## 3. S7 scope backlog (priority-ordered)

| Priority | Scope | Status | Backlog ref |
|----------|-------|--------|-------------|
| P0 | Finance tax-compliance completion (VAT/WHT/PAYE/pension/ERCA filings, auto-posts, aging) | 🔴 OPEN | TICKET-053a, TICKET-054a |
| P0 | Procurement↔budget parity (17-migration ideal; requisition→approval→budget→quotation→PO→receipt→invoice) | 🟡 PARTIAL | TICKET-054a |
| P1 | Barcode / QR picking (scan→locate→pick→auto-ledger) | 🔴 OPEN | TICKET-053c; `/barcode` stub |
| P1 | QC / inspection (incoming ~5% reject, quarantine, traceability) | 🔴 OPEN | `/qc` stub |
| P1 | Payroll reports (payslip PDF, register, YTD, ET statutory) | 🟡 PARTIAL | `PayrollService.js` engine exists |
| P1 | Budget upgrade + forecasting (variance, reorder suggestion, decision builder) | 🟡 PARTIAL | TICKET-051b/c |
| P2 | MRP / Maintenance foundation (BOM, work orders, MRO) | 🔴 OPEN | blueprint §3 Advanced |
| P2 | Multi-entity / tenant scale-out (per-entity ledger, package/module from Postgres) | 🔴 OPEN | TICKET-054 platform-admin |
| P2 | RLS hardening (Postgres row-level security per tenant, all 5 DBs) | 🔴 OPEN | S6.2 extension |
| P2 | Mobile / hCM responsive (PWA, attendance, leave self-service) | 🟡 PARTIAL | Header mobile-aware |
| P3 | Analytics command-center polish + E2E workflow tests + monitoring | 🟡 PARTIAL | TICKET-051a, TICKET-054a |

---

## 4. How to refresh
- After any PASS: move rows to DONE ✅ with commit refs, update K-notes, commit to `main`.
- After any P0/P1 ship: add the per-DB migration/seed/test refs to the row, verify live smoke, update manual.
- Never store secrets here (URLs with `npg_*`, service-account JSON, PATs).