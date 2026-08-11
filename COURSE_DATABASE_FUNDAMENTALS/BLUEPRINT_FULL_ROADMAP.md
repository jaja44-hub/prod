# 🌐 FINAL GIANT BLUEPRINT — Addis Crown ERP
### Development Blueprint & Course Master Map · Apprenticeship Grounded Edition
**Status:** ✅ **FINAL — APPROVED** (2026-08-09, user approval) · Rebuilt from `WORKSPACE_RESEARCH_INVENTORY.md`
**Owner:** Master Developer / Lecturer (GitHub Copilot) · **Apprentice:** vibe-coder → medium-technical developer

> **This is the trophy.** It was rebuilt ONLY after the mandated research-&-grounding phase was
> completed and the user approved the collective verdicts. Every feature, scope, and architecture
> candidate listed here is a **sustained aspiration** extracted from history files, diaries, and
> the live codebase — and every banned path is a **verified reversal** the user explicitly forbade.
> Nothing in this document resurrects a cross-repo endpoint, and nothing violates the per-DB
> migration discipline.

---

## 0. The Two Never-Bargained Invariants (governing law of this blueprint)
> These are absolute. Every plan, feature, migration, seed, test, and release gate below is
> subordinate to them. If any proposed work would violate them, that proposal is deleted.

1. **NO cross-repo / third-party-endpoint integration** as an integral part of the ERP. No code,
   DB element, or blueprint suggestion may treat any other project's endpoints/repos (GitHub App
   backends, `gibi-sales`, `legal-commerce`, Odoo-on-HF, engineering-sector Firestore) as part of
   Addis Crown ERP — **BANNED forever**.
2. **Per-database discipline with equal momentum.** One migrations/seed/test script **per
   database**, each titled and matched to its own DB. NO common "migrate/seed/test-all"
   mega-script. Every DB (schema + seed + test + API + UI) advances together so the state,
   content, and posture of every database stays **traceable and auditable**.

**Supporting invariant (student boundary):** The student NEVER touches real project resources
(local or remote). The student learns exclusively from my dynamic gap-finding recordings embedded
in each teaching module.

---

## 1. Executive Decision — What We Are Building (the sustained scope)

**An Ethiopia-ready, zero-mock, full-stack ERP** ("Addis Crown ERP") where:

- **PostgreSQL = the system of record & compute**, organized as **one database module**
  (`addiscrown_local`) + **4 per-module Neon databases** (accounting, procurement, analytics,
  tenantfinance) — all **operational + analytic** data lives here.
- **Firebase stays in a narrow, approved role**: **Auth + RBAC**, tenant/config/setup
  **metadata**, and **supporting activity feed / realtime push** — NEVER operational ERP data.
- **Purchase + Warehouse are the two operational backbones** (requisition → approval → PO →
  receipt → invoice; and receive → inspect → store → pick → pack → ship), **wired before
  Finance**, because finance consumes real operational inputs the shelf.
- **Ethiopian compliance is non-negotiable**: VAT 15% (with 2/5/10% WHT with LD matrix),
  PAYE brackets (0–2000 exempt … 35% over 14000), pension 7%+11% (cap 15,000 ETB), ERCA
  filings, ESIC taxonomy (200+ categories), Ethiopian COA (101000–999999), IFRS/GAAP baseline.
- **Analytics is computed, never seeded**: every metric/KPI is derived from live Postgres data
  via the analytics/KPI engine (no mock seeds, no Firestore aggregates at rest).
- **Command-center dashboard** reports real module health scores (Sales 100, CRM 62, Purchase
  58–64, Warehouse 65, Finance 70–72 → target 85–90% market readiness). Zero-data in the UI is
  **a defect**, not a mode.
- **Multi-tenant + roles (RBAC)**: CEO super-admin, tiered users, `tenant_id` scoping on every
  query; platform-super-admin can administer tenants/modules/packages via admin UI.
- **No mock / no fallback-silence**: the hard line from the diaries — UI renders what the DB
  holds; seed-builder fallbacks and hardcoded metric fallbacks are removed.

---

## 1a. The 100-Point Graduation Ledger (course degrees — unchanged & approved)

| Level | Module (dual-file: standard + tutorial) | Weight | Status |
|---|---|---|---|
| **L1** | Database Foundations & Core SQL | 25 | ✅ SHIPPED (2026-08-08) |
| **L2** | Schema Design, Normalization & Transactions (ACID) | 20 | ⏳ next |
| **L3** | API ↔ DB Connectivity & Query Execution | 15 | ⏳ |
| **L4** | Multi-DB Architecture, Migrations & Security | 15 | ⏳ |
| **L5** | Full-Stack Operational Cycles & Production Release (Capstone) | 25 | ⏳ |
| **Total** | | **100** | |

**Agreed strategy (locked):** draft ALL module dual-files early as wayshower / build-guides; the
student progresses only through recordings; `GAP_LOG.md` & `STUDENT_REPORT_CARD.md` run alongside
from L2 forward.

---

## 2. Final Architecture Decision (the Data Plane + Auth Plane)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT  (React / Vite / React Router / Recharts / Chart.js)                │
│  src/config/firebase.js (auth) · src/services/* consume api/*               │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │ JWT Bearer (Firebase Auth)  ·  tenant_id header
┌──────────────▼──────────────────────────────────────────────────────────────┐
│  SERVER (Vercel serverless, consolidated ≤12 functions)                    │
│  api/  →  api/lib/shared.js getPool(type)  → per-DB pools                   │
│  Firebase Admin: verifyBearerToken, tenant/config metadata, activity feed   │
└───────┬──────────────┬───────────────┬──────────────┬──────────────┬────────┘
        ▼              ▼               ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ addiscrown  │ │ accounting  │ │ procurement │ │ analytics   │ │tenantfinance│
│ _local      │ │ _local      │ │ _local      │ │ _local      │ │_local       │
│  (main)     │ │ Neon+local  │ │ Neon+local  │ │ Neon+local  │ │Neon+local   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
   Sales/CRM/        finance/WHT      purchase req→PO→   KPI engine       budgets,
   inventory         Journal/account  warehouse          computed-only    VAT/PAYE
      + FKs                             17 migrations      (never stored)   profiles
```

- **Per-DB pools** live in `api/lib/shared.js` (`accounting`, `procurement`, `analytics`,
  `tenantfinance`, `default`) — the verified modern client. Legacy single-pool
  `server/api/lib/neonClient.js` (one `NEON_DATABASE_URL`) is **reconciled** to the per-DB SSOT.
- **Firebase** (approved roles only): address auth, tenant metadata/config (roles→module map,
  compliance profile), activity feed/event push via Firestore. **It never holds operational ERP
  data, and its employment never reintroduces silent mock fallbacks.**

---

## 3. Scope — Sustained Feature Map (what survives the research, per module)

### A. Core & Cross-Cutting
- Multi-tenant + RBAC (CEO superadmin, tier1-3), platform-admin UI, tenant-CEO admin.
- Central **policy kernel** re-implemented in Postgres: module registry, tenant-config,
  compliance-profile (ET primary, global-lite overrides), event/audit bus.
- **Live data ONLY** — no mock, no seed-builder fallback, no empty default.
- **Verification audits**: Network audit (no 404/500/405 for shipped endpoints), Data-integrity
  (finance dashboard == journal entries sum), Mock-eradication audit.

### B. Purchase (backbone #1)
- Requisition → approval workflow (multi-level, ESIC-aware) → budgets & budget commitments →
  supplier management + multi-factor scoring → supplier quotations → PO → receipt → invoice.
- Per /api/purchase: POST/approve/receive; supplier_code unique; indexed FKs; normalized line
  tables (`purchase_order_items`) not JSONB.

### C. Warehouse & Inventory (backbone #2)
- Receive → inspect (quality rejection ~5%) → store → pick → pack → ship.
- Location-based inventory, `inventory_transactions` ledger (no `stock` column — ledger-based),
  cycle counts with all states, real AR/AR-AP, integration with purchase (receipt auto-posts).

### D. Finance & Tax (ET compliance engine)
- Journals (auto entry: Dr Stock / Cr AP on completed receipt), VAT 15% engines, WHT 2/5/10%
  with LDG refunds, PAYE brackets, pension 7+11, ERCA filings (EVAT statements, quarterly VAT),
  budget-vs-actual, supplier performance, aging (AR/AP via SQL), margin, cash-flow
  forecast, Ethiopian COA template.

### E. Sales, CRM, HR, Analytics
- Sales: orders (15+), receipts (50+), ~100K–1M ETB revenue targets; margin% via analytics.
- CRM: pipeline 62% health baseline; activity feed.
- HR: employees, attendance, payroll hooks (PAYE/pension), HR fortress (ET statutory).
- Analytics: KPI engine `buildKpiDashboard` (revenue, cost, margin), computed on the fly over
  Neon; command-center dashboard; module health scoring; never pre-seeded.

### F. Tenant / Platform Admin
- Package/module purchasable list, tenant provisioning, admin UI for tenants & modules,
  compliance profile editor (ET/global), module entitlements served from Postgres
  (tenant_config + modules), NOT from per-page `if (role)` chains alone.

---

## 4. The Per-Module DBs & Equal Momentum Registry (never-bargained #2)

| DB (local ↔ Neon) | Home of | Migrations/scripts (the pattern: one titled file per DB) |
|---|---|---|
| `addiscrown_local` | Sales, CRM, inventory main, HR | `server/migrations/001_core…` + `seed-main.*` |
| `addiscrown_accounting_local` ↔ `NEON_ACCOUNTING_DB_URL` | journals (finance 011–015), tax, COA | `*_accounting.*` per-DB seed/migrate/test |
| `addiscrown_procurement_local` ↔ `NEON_PROCUREMENT_DB_URL` | **17-migration living ideal** (purchase + warehouse + budget) | `016_procurement_schema`, `017_budget_ref`, `seed_procurement.mjs` |
| `addiscrown_analytics_local` ↔ `NEON_ANALYTICS_DB_URL` | KPI engine input tables | `seed-analytics-data.mjs` |
| `addiscrown_tenantfinance_local` ↔ `NEON_TENANTFINANCE_DB_URL` | budgets, VAT/forecast profiles, tenant finance | `seed-tenantfinance-data.mjs` |

**Equal momentum rule:** no DB sleeps. Whenever a DB gets a schema/seed/test change, its matched
API + UI changes advance in the same wave, with its own titled test script. **Never one common
script.**

---

## 5. Firebase — final approved role table (from Firebase Role Verdict)

| Role | Verdict |
|---|---|
| Firebase Auth (JWT Bearer + RBAC) | ✅ ACTIVE — keep (auth only) |
| Firestore: tenant/config/setup metadata | ✅ ACTIVE (narrow) |
| Firestore activity feed / realtime push | ✅ ACTIVE (supporting, from Neon facts) |
| Realtime DB for HR/inventory/warehouse live ops | ❌ REVERSED (system of record = Postgres) |
| Firestore as compute / operational store | ❌ REVERSED (audit) |
| Firestore analytics pre-seeded | ❌ REVERSED (analytics computed from Neon) |
| EngineeringGateway / other-project Firebase | ❌ BANNED (cross-repo) |
| firebase-bridge.js Realtime→Neon sync | ⚠️ RETIRE (credential hazard, dual source) |

---

## 6. Banned-Path Registry (do NEVER reintroduce)

- Odoo / HuggingFace compute as core; Odoo as system of record; frontend→Odoo proxy
  (`api/odooProxy.js`, `ServiceGateway`, `src/services/ServiceGateway.js`).
- Python/GitHub App external backends (run `gibi-sales`, `legal-commerce`) as integral ERP.
- `githubAppClient.mjs` + `scripts/test_github_repo_discovery.mjs` (dead, remove).
- `EngineeringGateway.js` + `VITE_ENG_*` (cross-project Firestore feed) — remove.
- Firestore-era layers `moduleDataStore.js`, `productionSeedCatalog.js`, `ServiceGateway`/
  `FinanceService` Firestore-first data layer — migrate to Neon.
- "Router-level remove-all-auth" — replace with per-handler auth audits.
- `seed_odoo_*`, `migrate-firestore-to-odoo.mjs`, `SEED-ODOO-README.md` — remove.

---

## 7. Gap-Finding Engine → `GAP_LOG.md`

Each gap = curriculum. The engine seeds `GAP_LOG.md` from:

```
GAP-### | Source module: Lx | Category | Where (DB/table/col/file) | What's wrong
| Why it's wrong | Evidence | Decided fix | Status(open/fixed/testing) | Fixed-by-module
```

**Current OPEN seeded gaps (see GAP_LOG.md for full log):**
1. Main DB has **no FK constraints** (`purchase_orders.supplier_id` plain string).
2. No index on `purchase_orders.supplier_id` → slow child lookups at scale.
3. `suppliers.supplier_code` not unique/nullable → unreliable reference.
4. `purchase_orders.items` is JSONB → should converge to normalized `purchase_order_items`.
5. **Products stock is ledger-based** — no `stock` column; derive from `inventory_transactions`.
6. Frontend/back `odooClient.*`, `api/odooProxy`, `ServiceGateway` still referenced → **remove**
   (enforced by banned-path registry).
7. `api/lib/shared.js` hardcoded `FALLBACK_DASHBOARD_METRICS` → **mock violates doctrine**; replace with DB-driven metrics.
8. `server/api/lib/neonClient.js` single-DB vs `api/lib/shared.js` per-DB → reconcile to per-DB SSOT.
9. `githubAppClient.mjs` dead → remove test+file.
10. **HR module absent from latest Vercel sidebar UI** (user note) → Schedule M1.5 HR UI; HR data
    must be live from Neon HR (Postgres HR tables, not Odoo/legacy stores).

---

## 8. Development Discipline (the release gates)

1. **Module L2** ships + GAP_LOG seeded → *gate: approve converting main DB toward procurement
   target schema* (add FKs, unique codes, indexes, normalize JSONB).
2. **Module L3** → all API↔DB verified with architecture tests.
3. **Module L4** → migrations + security (RLS/robots, secrets, per-DB) + backups.
4. **Module L5** → full cycle (purchase→warehouse→finance), deploy to Vercel + GitHub `prod`.
5. Every stage cross-checked against **FULLSTACK & PERFECTION guideline**, the per-DB test suite
   (`npm test`, `test-api.mjs`, per-DB `test_*.mjs`), **no-mock audio audit**, and a **Vercel
   page function audit (≤ 12 functions)**.

**Rollout / release stages (post-approval, executable from the schedule):**
- **M1 Core (0)**: per-DB SSOT reconciliation + banned-path purge + no-mock audit.
- **M2 Procurement/Warehouse** wiring (17-migration); **M3 Finance/Compliance** engines;
   **M4 Sales/CRM/HR** (incl. missing HR UI sidebar); **M5 Analytics/Command Center**.
- Each stage ships with titled per-DB migrations + seeds + tests + matched UI.

---

## 9. Teaching Architecture (course-facing summary — dual-file, continuous iteration)

- **README.md §1.3** records the **Continuous-iteration model**: modules are drafts, correctable
  against this blueprint; the **student never touches real resources**; engagement = recordings.
- **Dual-file method (standard + tutorial)** is permanent; each module carries objectives,
  sections, exercises (real-project examples, correctable), **RECORDING box** for live gap
  recordings, self-check, and scoring.
- **100-ledger + STUDENT_REPORT_CARD.** Master's notes/gaps are recorded per module.
- Modules are drafted at my own pace (per approval) as continuous course loads — the schedule in
  `EXECUTIVE_ROADMAP.md` sequences both **development work** and **module drafting**.

---

**Status: FINAL BLUEPRINT v2.0 — APPROVED 2026-08-09. Next: `EXECUTIVE_ROADMAP.md` (executable
schedule) → `GAP_LOG.md` → begin M1 tasks + module drafts per schedule.**