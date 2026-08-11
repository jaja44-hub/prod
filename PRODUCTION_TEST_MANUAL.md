# S7 — Production Test & Navigation Manual
**App**: Addiscrown ERP — Production (Vercel + Neon Postgres + Firebase)
**Live URL**: `https://prod-puce-three.vercel.app`
**Prepared**: 2026-07-XX · **Status**: All 15 automated API smoke checks PASS; manual web checks below
**Sections**: [1. Access](#1-access) · [2. Login](#2-login--authentication) · [3. CEO Navigation Map](#3-ceo-navigation-map) · [4. Functional Test Matrix](#4-functional-test-matrix-web--api--db--ui) · [5. Role / Tenant Behavior](#5-role--tenant-behavior) · [6. Data Persistency Tests](#6-data-persistency-tests) · [7. NON-Automatable Checks (must be done by hand)](#7-non-automatable-checks-must-be-done-by-hand) · [8. Known Behaviour & Limitations](#8-known-behaviour--limitations) · [9. Rollback / Recovery](#9-rollback--recovery)

---

## 1. Access

| Item | Value |
|---|---|
| Production URL | `https://prod-puce-three.vercel.app` |
| Domain | `addiscrown.et` — ⚠️ currently points to a **different** Next.js app, NOT this project. See §7 item 1. |
| Per-deploy URLs | `https://prod-<hash>-jafers-projects-761b2f62.vercel.app` (⚠️ behind Vercel SSO/Deployment Protection — you must be logged into the `jafers-projects-761b2f62` team to open them) |
| Firestore rules | Tier-based (tier 1 = CEO, ≤2 manager, ≤3 staff), tenant-scoped, audit-logged |

**Recommended browser**: Chrome/Edge (Firefox works). Keep DevTools → Network open while testing.

---

## 2. Login & Authentication

### 2.1 CEO credentials (production tenant)
Firebase Auth users were audited and standardized (orphan demo users + `tenant_demo` removed). Expected login accounts:

| Email | Role | Tier | Password |
|---|---|---|---|
| `ceo@addiscrown.com` | CEO (ceo) | 1 | `Password123!` |
| `ceo@addiscrown.et` | CEO (ceo) | 1 | `Password123!` |
| `sales@addiscrown.com` | Sales Head | 3 | `Password123!` |
| `sales@addiscrown.et` | Sales Head | 3 | `Password123!` |
| `warehouse@addiscrown.com` | Warehouse Head | 2 | `Password123!` |
| `warehouse@addiscrown.et` | Warehouse Head | 2 | `Password123!` |
| `hr@addiscrown.com` | HR Head | 2 | `Password123!` |
| `hr@addiscrown.et` | HR Head | 2 | `Password123!` |

> Password is a shared demo/test secret **only** for these seeded users. Rotate before real production use (see §7 security items).

### 2.2 Login test steps (CEO)
1. Open `https://prod-puce-three.vercel.app`
2. You will be redirected to `/login`
3. Enter `ceo@addiscrown.com` / `Password123!`
4. Click **Sign in**
5. Expected: land on **Dashboard** (`/dashboard`). Sidebar shows all module groups.
6. **Persistence check**: refresh the page — you must stay logged in (Firebase session persisted). Press F5 and confirm you are NOT kicked back to `/login`.
7. **Wrong password check**: try `wrongpassword` — must show an error and stay on `/login`.
8. **Logout**: click profile → **Sign out** → returns to `/login`. Re-login to continue.

### 2.3 Auth enforcement (backend)
Confirmed live: `POST /api/*` without a Firebase bearer token → **HTTP 401** `{"success":false,"error":"Unauthorized — a valid Firebase bearer token is required for this operation."}`. GET reads are open (anonymous fallback to `tenant_default`).

---

## 3. CEO Navigation Map

Sidebar groups visible to CEO (from `src/partials/Sidebar.jsx` + `getNavSections`):

| Group | Menu item | Route | Page | Module API |
|---|---|---|---|---|
| Operations | Dashboard | `/dashboard` | Dashboard | dashboard/metrics |
| Operations | Analytics | `/analytics` | Analytics | analytics/metrics, analytics/snapshot, analytics/engine |
| Operations | Warehouse | `/warehouse` | Warehouse Dashboard | inventory/warehouse |
| Operations | Inventory | `/inventory` | Inventory | inventory/products, inventory/locations |
| Operations | Barcode | `/barcode` | Barcode MVP | (stub) |
| Operations | Work Orders | `/work-orders` | Work Orders | (stub/gateway) |
| Operations | Orders | `/orders` | Sales Orders | sales/… |
| Procurement | Purchase Orders | `/purchases` | Purchase Orders | purchase/orders |
| Procurement | Suppliers | `/suppliers` | Vendors | purchase/vendors |
| Quality & Logistics | QC | `/qc` | QC Module | (stub) |
| Quality & Logistics | Logistics | `/logistics` | Logistics | logistics (stub) |
| Finance | Finance | `/finance` | Chart of Accounts | finance/accounts |
| Finance | Reports | `/reports` | Finance Reports | finance/reports |
| Finance | Invoices | `/invoices` | Invoices | finance/invoices |
| People | Employees | `/employees` | Employees | hr/employees |
| People | HR | `/hr` | HR | hr/… |
| People | Payroll | `/payroll` | Payroll | hr/payroll |
| Sales & CRM | Sales | `/sales` | Sales Orders | sales/orders |
| Sales & CRM | Customers | `/crm` | Customers/CRM | crm/pipeline, crm/opportunities, crm/activity |

> Sub-routes also include `/inventory/new`, `/sales/new`, `/purchases/new`, `/finance/vat`, `/finance/paye`, `/finance/tax`, `/finance/budget`, `/finance/cashflow`, `/approvals`, `/analytics`, `/reports`, `/platform-admin`, `/admin/setup`. Some are behind extra guards (Platform Admin, RoleGuard, ComingSoon stub).

---

## 4. Functional Test Matrix (Web → API → DB → UI)

For each row: navigate, interact, confirm data appears, then **verify in Neon at the DB level** (SQL snippet) and check persistency by refreshing. All reads use `tenant_id = tenant_default` (the frontend hardcodes it).

### 4.1 Dashboard
- **Web**: Open `/dashboard`. Expect KPI cards: **4 sales orders**, **pipeline value ≈ 820,000**, sales score, CRM score, recent activity feed, low-stock alert widget.
- **API**: `GET /api/dashboard/metrics?tenant_id=tenant_default` → `success:true`, `orders:4`, `pipelineValue:820000`, live scores.
- **DB (main/neondb)**: `SELECT count(*) FROM sales_orders;` → 4 · `SELECT count(*) FROM crm_opportunities;` → 3.
- **Persistency**: refresh → same numbers.

### 4.2 Sales
- **Web**: Open `/sales`. Expect the 4 seeded sales orders (e.g. `SO-JKL012`) with customer names, date, totals, status badges.
- **API**: `GET /api/sales/orders?tenant_id=tenant_default` → `success:true` with rows.
- **DB (main)**: `SELECT order_number, total FROM sales_orders;`
- **Persistency**: reload → rows remain.
- **Create test (writes need token)**: sign in via UI, click **New Order**, fill customer + line item, save → appears in list; refresh → still there.

### 4.3 CRM
- **Web**: Open `/crm`. Expect pipeline stages with **CUST-001 Bole Construction** and other customers; opportunities list (3 rows) with stages/values.
- **API**: `GET /api/crm/pipeline` and `GET /api/crm/opportunities` → `success:true`.
- **DB (main)**: `SELECT name, customer_code FROM customers;` (3) · `SELECT title, stage, value FROM crm_opportunities;` (3).
- **Persistency**: reload → same.

### 4.4 Finance
- **Web**: Open `/finance`. Expect the full chart of accounts — accounts `1000` (Assets), `1100`, `1200`, etc. with balances; journal entries list.
- **API**: `GET /api/finance/accounts` and `GET /api/finance/journal` → `success:true` with rows.
- **DB (accounting = ep-solitary-dew)**: `SELECT code, name, balance FROM chart_of_accounts;` · `SELECT * FROM journal_entries;`
- **Persistency**: reload → same.

### 4.5 HR
- **Web**: Open `/employees` (or `/hr`). Expect employee list including **EMP001 Dawit Abebe** and others with department/salary/status.
- **API**: `GET /api/hr/employees?tenant_id=tenant_default` → `success:true`.
- **DB (main)**: `SELECT employee_code, full_name FROM employees;`
- **Persistency**: reload → same.

### 4.6 Inventory
- **Web**: Open `/inventory`. Expect **8 products** (ETH-001 … ETH-008: Steel Sheets, Chemicals, Cement, Transformers, Brewing Parts, Drill Bits, Aircraft Parts, Banking Security) with stock quantities.
- **API**: `GET /api/inventory/products` → `success:true`, 8 rows with `stock_quantity` computed from transactions.
- **DB (analytics = ep-silent-breeze)**: `SELECT sku, name, quantity FROM inventory_products;` (8) · `SELECT count(*) FROM inventory_transactions;` (40: 32 IN + 8 OUT).
- **Details**: click a product → detail page; edit qty/price → save → persist on refresh.
- **Persistency**: reload → same.

### 4.7 Inventory — Locations & Movements
- **Web**: `/inventory` locations tab → **exactly 6 unique warehouses** (Bole Central, Kazanchis, Mekelle, Gondar, Hawassa, Dire Dawa) — NOT 30 duplicates.
- **API**: `GET /api/inventory/locations` → 6 rows · `GET /api/inventory/movements` → 40 ledger rows with `transaction_date`, type IN/OUT, qty, location, reference.
- **DB (analytics)**: `SELECT DISTINCT name FROM inventory_locations;` (6) · `SELECT * FROM inventory_transactions ORDER BY transaction_date DESC;` (40).
- **Persistency**: reload → same.

### 4.8 Inventory — Cycle Counts
- **Web**: cycle-counts list → **exactly 4 counts** (Abebe Kebede completed, Tigist Haile completed, Dawit Abebe in_progress, Sara Mengistu pending).
- **API**: `GET /api/inventory/cycle-counts` → 4 rows.
- **DB (analytics)**: `SELECT counted_by, status FROM inventory_cycle_counts;` (4).
- **Persistency**: reload → same.

### 4.9 Purchase
- **Web**: Open `/purchases`. Expect purchase orders including **PO-2026-008** and requisitions (15 PO + 50 warehouse receipts reported by analytics).
- **API**: `GET /api/purchase/orders` and `GET /api/purchase/requisitions` → `success:true`.
- **DB (procurement = ep-red-dust)**: `SELECT po_number FROM purchase_orders;` · `SELECT count(*) FROM warehouse_receipts;` (50 per analytics KPI).
- **Persistency**: reload → same.

### 4.10 Analytics
- **Web**: Open `/analytics`. Expect KPI cards and charts: **purchaseOrders 15, warehouseReceipts 50, journalEntries 10**, decision/snapshot panels.
- **API**: `GET /api/analytics/metrics` and `GET /api/analytics/snapshot` → `success:true`.
- **DB (analytics)**: `SELECT * FROM kpi_snapshots;` etc.
- **Persistency**: reload → same.

> All 15 of these API endpoints were verified live returning `success:true` with real data (2026-07-XX). This manual's web walk-through confirms the **UI layer** renders them.

---

## 5. Role / Tenant Behavior

### 5.1 Role-based access (verify with each seeded user)
| Role | Should see | Should NOT see |
|---|---|---|
| CEO (`ceo@…`) | All sections | (nothing hidden by tier) |
| Sales Head (`sales@…`) | Sales, CRM, Customers, Dashboard | Platform Admin, Finance (tier 3 > 2 restriction if any), deep admin |
| Warehouse Head (`warehouse@…`) | Inventory, Warehouse, Purchases | Finance, Sales, HR |
| HR Head (`hr@…`) | Employees, HR, Payroll | Finance, Inventory |

1. Log in as `sales@addiscrown.com` → confirm sidebar only shows allowed modules; try navigating to `/finance` directly → should be blocked (RoleGuard → 403 / redirect / locked overlay).
2. Repeat with `warehouse@…`, `hr@…`.
3. Confirm `sales@…` gets the sales-tier view and cannot read finance data even via direct URL (UI guard + backend `requireAuth`/role check if enforced).

> Note: backend RBAC enforcement scope — `requireAuth` validates the Firebase token on writes; confirm whether reads enforce role scoping at API level, and flag if any tier-1 API is reachable by lower tiers (log in §8).

### 5.2 Tenant isolation
- All seeded rows use `tenant_id = 'tenant_default'` (frontend normalizes `production` → `tenant_default`).
- Backend `resolveTenantId` maps `production` → `tenant_default`.
- Test: log in with a tenant-scoped user (if any other tenant exists) and confirm you only see that tenant's rows. With only `tenant_default` active, verify no cross-tenant leakage appears in console queries.

---

## 6. Data Persistency Tests
For each module: 
1. Load page → note record count + first record.
2. **Create** a record via UI (if writes allowed for your role).
3. **Full page refresh (F5)** → confirm the new record is still present (proves DB write, not just in-memory state).
4. **Relogin** (logout → login) → confirm data persists across sessions.
5. **Cross-check in Neon** via the SQL in §4 — confirms web→API→DB write path.

Key persistency checks to run:
- Create a sales order → refresh → present → `SELECT` in main DB.
- Create an inventory product → refresh → present → `SELECT` in analytics DB.
- Post a journal entry (finance) → refresh → present → `SELECT` in accounting DB.
- Add a purchase order → refresh → present → `SELECT` in procurement DB.

> ⚠️ Writes require a valid Firebase token. If a "New" action returns a 401 in the UI, log in first and ensure `FIREBASE_SERVICE_ACCOUNT` is set in Vercel (see §7.3).

---

## 7. NON-Automatable Checks (must be done by hand)

These cannot be validated from the terminal/API — do them in the browser + consoles.

### 7.1 Domain / DNS (BLOCKER-level)
- `https://addiscrown.et` currently serves a **different Next.js app** (404/other), NOT this Vercel project.
- Open Vercel dashboard → **prod** project → **Settings → Domains** → add `addiscrown.et` (and `www.addiscrown.et`) & confirm DNS A/CNAME records in your registrar point to Vercel (or the deployment alias).
- After aliasing, confirm `https://addiscrown.et` loads the Addiscrown login page (HTTPS + redirect to `/login`).
- **If you keep using `prod-puce-three.vercel.app`**, that's fine for testing but customers should use the branded domain.

### 7.2 Vercel Deployment Protection / SSO
- Open one of the per-deploy URLs (`prod-…-jafers-projects-761b2f62.vercel.app`) → you will be asked to authenticate (Vercel SSO/Deployment Protection).
- Decide if you want this to remain for production, or disable protection so the domain + production alias are publicly reachable without SSO.
- Verify `prod-puce-three.vercel.app` is the **Production** alias (Settings → Domains/Deployments) so auto-deploys map there.

### 7.3 Vercel environment variables (REQUIRED)
- Dashboard → **prod** → Settings → Environment Variables:
  - `DATABASE_URL` (main/Odoo Neon)
  - `NEON_ACCOUNTING_DB_URL` / `NEONACCOUNTINGDBURL`
  - `NEON_PROCUREMENT_DB_URL` / `NEONPROCUREMENTDBURL`
  - `NEON_ANALYTICS_DB_URL` / `NEONANALYTICSDBURL`
  - `NEON_TENANTFINANCE_DB_URL` / `NEONTENANTFINANCEDBURL`
  - `FIREBASE_SERVICE_ACCOUNT` (JSON) — **required for authenticated writes** (S6.2)
- Confirm each pool by hitting the module endpoint; a missing var makes that module return `degraded`/empty. Source of truth: `VERCEL_ENV_SETUP.md`, `NEON_FALLBACK_SETUP.md`.

### 7.4 Firebase console checks
- **Authentication → Sign-in method**: Email/password **enabled**; any other provider (Google/etc.) that shouldn't be public disabled.
- **Authentication → Users**: should be the **8 standardized users** only (§2.1) — no `demo_*`, no `tenant_demo`, no stray test accounts.
- **Firestore Database → Rules**: confirm the deployed rules match `firestore.rules` (tier-based, tenant-scoped, audit-log immutability).
- **Authorized domains** (Authentication → Settings): `prod-puce-three.vercel.app` listed; add `addiscrown.et` when aliased.
- **Storage/Bucket rules**: if any storage used, confirm private-per-user rules.

### 7.5 Email / SMS / notifications (if configured)
- Verify outbound email from the app (e.g., order confirmations) — test against a real inbox.
- If SMS providers (Africa's Talking, Twilio, etc.) are used, confirm numbers + templates exist and are non-production placeholder.

### 7.6 Frontend runtime errors
- Open every page with DevTools console open. Confirm **zero red errors** (network 4xx/5xx, React errors, unhandled promises). Document any warnings.
- Confirm service worker/caching doesn't serve stale code after deploys (hard refresh Ctrl+Shift+R).

### 7.7 Performance / UX spot checks
- First page load time (network tab, "DOMContentLoaded"), bundle size warning noted (`index-*.js` ~1.5 MB — see §8).
- Mobile viewport (DevTools device emulation) — sidebar collapses, tables scroll.
- Dark/light theme toggle works.

---

## 8. Known Behaviour & Limitations (read before judging failures)
- **Bundle size**: `dist/assets/index-DIboesFN.js` ≈ 1.5 MB (gzip 434 KB) — Vite warns chunks > 500 KB. Not a bug; code-splitting is a recommended future optimization.
- **Movements** now reads the analytics ledger (schema-adaptive, handles missing `unit_cost`/`reference_type` columns). The S2.3 "procurement as SSOT" note is historical — actual ledger is in analytics.
- **Stub modules** (Barcode, QC, Logistics, Work Orders, platform pieces) may return demo/empty or be behind ComingSoon — those are placeholders, not regressions.
- **SMTP/notification stubs**: legal/SMS/notification service wrappers exist as stubs (`legalCommerceStub`, `gibiSalesStub`, `settlementOracle` in the build assets) — expect placeholder behavior until real integrations are wired.
- **Odoo main DB** mixes ~756 Odoo tables + app tables. App reads target explicit app tables; Odoo-specific screens (if any) rely on Odoo tables still present.
- **Dashboard financial KPIs show 0** (`revenue`, `receivables`, `payables`, `warehouseReadyToPick`, `warehouseScore` = 0 while `orders`/`pipeline`/scores are non-zero). Cause: those aggregate from warehouse-receipts / receivable-payable tables that are not fully seeded across the per-DB split (main vs procurement vs accounting). This is a **data-seeding gap, not a code failure** — the surrounding scores from seeded tables (sales 70, crm 100, purchase 64, finance 70) are real. If those zeros must be non-zero, extend the runbook gap-fill push for the relevant tables.
- **Anonymous GET fallback**: reads without a token fall back to `tenant_default` — by design for demo; revisit before hard production lockdown.

---

## 9. Rollback / Recovery
- **Data backups**: pre-change dumps in `backups/neon-pre-push/` (all 5 Neon DBs, PG18-safe).
- **Redeploy trigger**: any `git push origin main` → Vercel auto-deploys (production alias updates on Ready, ~2–3 min).
- **Rollback a deploy**: Vercel dashboard → Deployments → promote a previous Ready deployment to Production.
- **Re-verify after any change**: re-run the 15-endpoint smoke + the manual walk-through in §4.

---

### Appendix A — Live smoke evidence (2026-07-XX, `prod-puce-three.vercel.app`)
```
dashboard/metrics  ✅  orders:4, pipelineValue:820000, salesScore:70, crmScore:100
sales/orders       ✅  SO-JKL012 … (4 orders)
crm/pipeline       ✅  CUST-001 Bole Construction …
crm/opportunities  ✅  (3 opportunities)
finance/accounts   ✅  1000/1100/1200 … (full chart)
finance/journal    ✅  journal entries
hr/employees       ✅  EMP001 Dawit Abebe …
inventory/products ✅  ETH-001…ETH-008 (8 products, stock from 40 txns)
inventory/locations✅  6 unique warehouses
inventory/cycle-counts ✅ 4 counts (deduped)
inventory/movements ✅  40 ledger rows (schema-adaptive)
purchase/orders    ✅  PO-2026-008 …
purchase/requisitions ✅ requisitions
analytics/metrics  ✅  purchaseOrders:15, warehouseReceipts:50, journalEntries:10
analytics/snapshot ✅  snapshot data
POST writes w/o token  ✅ HTTP 401 enforced
```