# 🧭 WORKSPACE RESEARCH, INVENTORY & NOTE FILE (Ground-Truth Working Book)

> **Purpose (per user directive):** This is my *rough exercise book / notebook* — an inventory of
> all `.md` files in the workspace with their status of history, AI dialogues, major curves and
> detours, initial blueprints, changed aspects, values, standards, scopes and features that
> sustained. Timestamps noted where found, to judge which aspect is still **active/latest**.
> Every note extracted feeds the **final giant project blueprint** (trophy) and the executable
> schedule. Also the carving ground for the course's "never-bargained" invariants.
>
> **How used:** 1) file inventory ledger → 2) per-file extraction notes → 3) reconciliation vs
> live codebase/schema/git → 4) final blueprint. This file is edited incrementally as I read.

---

## 🔒 INVARIANTS (never-bargained — recorded now, from user directive)
1. **NO cross-repo / third-party-endpoint integration** as an integral part of the ERP. Any
   blueprint/item/executed-code/database element that treats other projects' endpoints as
   part of Addis Crown ERP is **BANNED** — never in the final blueprint.
2. **Per-database script discipline**: one SQL/migration/seed/test script **per database**, each
   individually titled + matched to its DB. NEVER one big "migrate/seed/test-all" common script
   that mixes data/rules/tables across DBs. Every DB advances with **equal momentum**
   (schema + code + API + UI) so state/content/posture of each DB stays traceable/auditable.
3. Student never touches real project resources directly; learning flows through dynamic
   gap-finding recorded updates.

---

## 📂 FILE INVENTORY LEDGER (root .md files — status/summary)
| # | File | Status | Read? | Key theme |
|---|---|---|---|---|
| 1 | README.md | active | ✅ | repo scaffold warning |
| 2 | private_architecture_note.md | active | ✅ | data-first hardening |
| 3 | advanced _private_architecture_note.md | active | ✅ | data-as-curriculum playbook |
| 4 | secretes unraveled.md | active | ✅ | grassroot-not-symptoms doctrine |
| 5 | goldstruk finance.md | active | ✅ | finance engine + golden path |
| 6 | clarified.md | historical | ✅ | Firestore-era correction |
| 7 | FINANCE_SUITE_ROADMAP_AND_ENGINE_ATTRIBUTION.md | active | ✅ | ET tax compliance engine |
| 8 | FULLSTACK_COMPLETION_AND_PERFECTION_GUIDELINE.md | active | ✅ | Option A+ to 100% |
| 9 | 10_PERCENT_COMPLETION_PLAN.md | active | ✅ | serverless pivot |
| 10 | proposed final database architecture.md | candidate | ✅ | hybrid (partially banned) |
| 11 | gemini did it.md | historical | ✅ | Vercel routing fixes |
| 12 | gemini auths and attempts.md | historical | ✅ | ESIC seed engineering |
| 13 | PROCUREMENT_WAREHOUSE_FORWARD_PATH.md | ⭐ active | ✅ | golden path, per-DB |
| 14 | STRATEGIC_FORWARD_PATH_ANALYSIS.md | active | ✅ | strategic paths |
| 15-18 | july 17/18/23/29 UI states | historical | ✅ (subagent) | UI/test state diaries |
| 19 | API_COMPONENT_LIBRARY.md | active | ✅ | API conventions |
| 20 | ARCHITECTURAL_AUDIT_REPORT.md | ⭐ turning point | ✅ | Odoo/HF/GH-app refused |
| 21 | ARCHITECTURAL_REPORT.md | historical | ✅ | Firestore-era report |
| 22 | cursor attempted.md | historical | ✅ (subagent) | agent attempts |
| 23 | devin task history.md | historical | ✅ (subagent) | agent-log era |
| 24 | proposed sessions.md | historical | ✅ | Option A (banned) |
| 25 | PRODUCTION_RUNBOOK.md | stale | ✅ | API-hardening reference |
| 26 | EXECUTION-SUMMARY-2026-07-10.md | historical | ✅ | 38 modules + auth flow |
| 27 | PHASE1/PHASE2_IMPLEMENTATION_SUMMARY.md | historical | ✅ | core schema heritage |
| 28 | TICKET-051..-054-PLAN.md | active | ✅ | 12-fn grouping rule |
| 29 | ODOO_MODULE_ACTIVATION_GUIDE.md | bans | ✅(scan) | Odoo leftovers |
| 30 | phase6 discussion.md / copilot did tried.md | historical | ✅(scan) | cross-repo ban scene |
| 31 | devin messedup me.md | historical | ✅(scan) | Neon-pivot scene |
| 32 | vercel and chrome console .md | historical | ✅(scan) | build logs |
| 33 | NEON_FALLBACK_SETUP.md / VERCEL_ENV_SETUP.md | stale | ✅ | old env guides |
| 34 | dev-notes/seed-codex/README.md | ⭐ active | ✅ | per-DB seed SSOT |

Also scanned/verified: `server/migrations/001-017`, `api/lib/shared.js` (per-DB pools),
`.env.local` (per-DB keys), `scripts/` (per-DB seed scripts), `dev notes/trophy/` (Path-A/M2 =
old strategy now reversed), dev-notes curriculum guides.

## ✅ VERDICT LOG (final decisions a file or theme survives into blueprint)
- ACTIVE-SURVIVES: data-as-curriculum (advanced note), no-mock doctrine (secretes), data-first
  hardening (private note), finance/compliance engine (goldstruk + FINANCE_ROADMAP), backbone-first
  golden path (procurement forward path), per-DB seed/migrate/test SSOT (seed-codex),
  API/security/12func conventions (runbook + TICKET), tenant/policy kernel + complianceProfile
  (M2 re-implemented in Postgres), Option A+ phase order (FULLSTACK guideline).
- HISTORICAL/BANNED (do NOT resurrect): Odoo-HF system-of-record, GitHub-App external backends,
  legal-commerce/gibi-sales oracles, Firestore-as-compute, Firestore seeded analytics, frontend
  → Odoo proxy, cross-repo endpoints. Also remove: githubAppClient.mjs, test_github_repo_discovery,
  odooClient references, seed_odoo_*, migrate-firestore-to-odoo.
- STALE-CONVERT: PRODUCTION_RUNBOOK (DB section), NEON_FALLBACK_SETUP, VERCEL_ENV_SETUP (Odoo/
  single-DB sections) → rewrite to per-DB posture.
- ⚠️ GAP: server/api/lib/neonClient.js single-DB vs api/lib/shared.js per-DB — reconcile to SSOT.

## 🔥 FIREBASE ROLE VERDICT (definitive — user requested explicit advice, 2026-08-09)
Live-codebase evidence (verified, not doc-only): `src/config/firebase.js` (initializeApp),
`server/api/lib/firebaseAdmin.js` (Bearer verify), `tenantFirestore.js` (tenant doc),
`PlatformAdmin.jsx`/`TenantSetup.jsx`/`AuthContext.jsx` (Firestore reads for tenants/roles),
`ModuleActivityFeed.jsx` + `firestoreUtils.js` (Firestore activity feed), PLUS legacy/banned:
`api/firebase-bridge.js` (Realtime DB + Firestore sync → Neon, hardcoded creds — HAZARD),
`src/services/EngineeringGateway.js` (reads the ENGINEERING/other-project Firebase =
**CROSS-REPO = BANNED**), `src/services/ServiceGateway.js` + `FinanceService.js` (old
Firestore-era data layer = SUPERSEDED).

### VERDICT per Firebase role (what survives final candidacy)
| Role | Verdict | Where it lives going forward |
|---|---|---|
| **Firebase Auth (JWT Bearer + RBAC)** | ✅ **SURVIVES — ACTIVE** | Only *authentication*. `verifyBearerToken` via `firebaseAdmin.js`. Never a data store. |
| **Firestore = tenant/config/setup METADATA** | ✅ **SURVIVES (narrow role)** | Tenant docs, role→module config, compliance profile, setup UI state. Metadata only — NOT operational data. This matches the audit's own "Firestore = tenant governance/metadata only". |
| **Firestore activity feed / realtime push** | ✅ **SURVIVES (supporting)** | `ModuleActivityFeed` (events/logs display), cache. Always mirrored from Neon facts; never the source of truth. |
| **Realtime DB for HR/inventory/warehouse live ops** | ❌ **REVERSED — NOT system of record** | Inventory & warehouse live in Neon/Postgres (procurement 17-migration: `inventory_transactions`, `warehouse_receipts`, `inventory_products`). HR/attendance → Postgres HR tables. |
| **Firestore as ERP compute/operational store** | ❌ **REVERSED (ARCHITECTURAL_AUDIT)** | All operational/transactional data = Neon per-module Postgres. |
| **Firestore analytics aggregates seeded** | ❌ **REVERSED** | Analytics computed on the fly from live Neon (KPI engine), never pre-seeded. |
| **EngineeringGateway (other-project Firebase feed)** | ❌ **BANNED (CROSS-REPO)** | `ethiobusiness-hub`/engineering Firestore = other repo → delete + remove `VITE_ENG_*`. |
| **firebase-bridge.js Realtime→Neon sync** | ⚠️ **REWRITE/RETIRE** | Hardcoded Neon connection strings in source = credential hazard; sync creates dual source-of-truth. Retire the bridge; per-module APIs consume Neon directly. |

**Why inventory/HR/warehouse did NOT stay on Firebase (advice):**
1.  Per-DB discipline (#2 never-bargained): one titled migration/seed/test per DB, equal
   momentum, traceable posture — a NoSQL side-store can't participate, it becomes invisible work.
2.  ACID/FKs: procurement & warehouse need transactions, constraints, ledger-based stock.
   Postgres (procurement/analytics DB) already implements `inventory_transactions` + receipts.
3.  No dual source of truth: whichever store mirrors the other, drift + silo bugs return (the
   "zero data in UI" class of defect).
4. Realtime UI need = **Neon + subscription/polling**, not a second database. Frontend already
   with `useAnalyticsSnapshot` polling + activity feed pattern.

**Bottom line / formal verdict:** Firebase *the platform* is NOT cross-repo — it stays, but
ONLY as (1) Authentication+RBAC, (2) tenant/config/setup metadata, (3) supporting activity
feed/push. Operational accounting, inventory, warehouse, HR data, and analytics ALL live in
Neon per-module PostgreSQL. Any Firebase use that holds operational ERP data or reads a
different project's Firebase must be reversed/removed.

## 🗒️ USER NOTE — HR module missing from latest Vercel sidebar (2026-08-09, explicit user note)
- **Statement:** "HR as a full erp module was not available in the latest vercel deployed ui
  sidebar components list."
- **Take:** Recorded as a real UI gap to fix at the RIGHT trade-off PULL in phase S4 (Sales/CRM/HR
  completeness). HR data must come from Neon HR/Postgres tables (employees, attendance, payroll
  hooks), NOT from any legacy/Odoo/other-project store. Track as GAP-012 in `GAP_LOG.md`.
- **Teaching impact:** HR appears in the module feature map (Blueprint §3.E) and as S4 task; the
  L5 capstone uses HR as one of the full-stack cycles. The student records this as dynamic
  gap-finding (UI backlog → planned fix).

## 🎓 TEACHING PACE PLAN (master-paced; approved to proceed without student progress reports)
- Draft all module dual-files (standard + tutorial) as continuous course loads, per
  `COURSE_DATABASE_FUNDAMENTALS/EXECUTIVE_ROADMAP.md` §9: L2 during S1–S2, L3 during S3,
  L4 during S4–S5, L5 during S6–S7.
- Student NEVER touches real project resources; learning flows through recordings embedded in
  relevant sections (README §1.3/§4.2 + blueprint §9).
- Each module: objectives → sections → exercises (real-project, correctable per blueprint) →
  RECORDING box → self-check → scorecard; registered in `STUDENT_REPORT_CARD.md` (coming).

## 📓 EXTRACTION NOTES (raw, as read)

### 📄 private_architecture_note.md — READ (2026-08-09)
Theme: **Data-first hardening program, enterprise-grade operational fabric** (not cosmetic).
- Every module must be seeded with rich, varied, domain-relevant data that *stresses actual engine
  logic*, UI paths, and cross-module integrations.
- "No module should remain weakly populated or superficially wired." Modules: Sales, Inventory,
  Warehouse, Finance, CRM, Purchasing — each with multiple variants (normal/delayed/urgent/
  high-volume/edge-condition).
- Analytics snapshots must be **computed from live underlying data** (not seed), charts real state
  transitions, summaries from live module state.
- Purpose: expose structural weaknesses (normalization assumptions, payload-shape mismatches,
  sparse/empty/high-volume handling, inconsistent module state mapping).
- Operating rule to carry into blueprint: **every module/dashboard/engine validated against ≥3
  data categories: baseline, stressed, edge-case**. That's a production-readiness gate.
- Status: ACTIVE / survives into blueprint (a core "testing + operational depth" doctrine).

### 📄 clarified.md — READ (2026-08-09)
Theme: **corrected architecture reality check vs previous assumptions** (Firebase-era snapshot).
- **Password auth**: `Passwrd123!` hardcoded is NOT used — real flow is Firebase ID tokens
  (`signInWithEmailAndPassword` → Bearer token → `verifyBearerToken()` in firebaseAdmin.js).
- Firebase Auth = production-ready; keep it. Demo tenant `production` exists; 12 demo users
  (tiers 1–3); `ceo@addiscrown.et` = Tier 1 full access.
- **Analytics must NOT be pre-seeded** — computed on the fly by `buildKpiDashboard()`:
  ↑ `orders` + `receipts` → `/api/analytics/metrics` computes KPIs (revenue/cost/margin%).
  Margin example: revenue 120k ETB, cost 95k → marginPercent 20.8%.
- Seeding TIER map (0→3 dependency order) for 16 collections; analytics + audit auto.
- **Open issues at that time:** module loading 404 (missing/valid syntax in `/server/api`),
  Firebase Auth not yet initialized in React frontend, 16 collections empty.
- Status: this is an EARLIEPANEL snapshot (older than current Postgres migration era). Its durable
  lessons: analytics=computed-only; auth=Firebase tokens; seeded-data tiering doctrine. These
  survive; the Firestore-only schema details are superseded by the Postgres migration era.

### 📄 advanced _private_architecture_note.md — READ (2026-08-09)
Theme: **Advanced private playbook — "data is curriculum" master operating model**.
- Mission: build ERP as a *living organism*; seed realistic sector-aware data → force engine layer
  → expose missing logic → repair at architectural root → until every module is resilient.
- **Master Operating Model: Seed → Read → Compute → Transmit → Render → Verify** (6-step loop =
  the core dev engine for every domain).
- Governing: Data First UI Second; Realism over simplicity (5 flow variants); Engines must learn
  from reality; Cross-module exchange must be intentional (which module consumes, what action
  follows, which downstream engine, what UI surface).
- **Module graduation test**: module graduates when it can receive real records, interpret
  correctly, generate meaningful outputs, hand off to linked modules, expose results w/o brittle
  assumptions. → direct source for L5 capstone "production-readiness gate".
- Per-module seeding blueprints: Sales, Inventory, Warehouse, Finance, CRM, Purchasing (each with
  specific seed cases + expected behaviors).
- Engine layer: Analytics engine = central computational intelligence (not display decorator);
  Integration engine (continues).
- Status: **ACTIVE, survives wholesale** into blueprint — this IS the philosophical backbone.

### 📄 10_PERCENT_COMPLETION_PLAN.md — READ (2026-08-09)
Theme: **the "10% completion" recovery plan — Vercel/Neon pivot**.
- Root cause: Express routers incompatible with Vercel serverless → all APIs 500.
- Phase 1 (CRITICAL): replace Express wrappers with **direct Neon DB query handlers** for
  purchase/orders, suppliers, finance/journal, inventory/products, inventory/locations,
  inventory/warehouse; `/api/crm/activity` → mock data.
- Phase 2: **REMOVE Odoo references** from UI text (Odoo was being dropped here).
- Phase 3: connect dashboard metrics to Neon DB (Revenue, Orders, Pipeline, Warehouse, Finance).
- Phase 4: enable new pages (PurchaseRequisitions, WarehouseReceipts, JournalEntries,
  FinancialDocuments, VATReturns, PAYECalculation, TaxReconciliation, BudgetVsActual,
  SupplierPerformance, CashFlowForecast).
- Phase 5: error handling (try-catch, tenant_id validation, user-friendly errors).
- Success criteria: 0 console errors, all metrics>0, all pages functional, **no Odoo references**.
- Status: ACTIVE (architecture pivot) — direct-DB handlers, drop Odoo, tenant_id discipline,
  modern cashflow/tax/forecast page set all survive into blueprint.

### 📄 FULLSTACK_COMPLETION_AND_PERFECTION_GUIDELINE.md — READ (2026-08-09)
Theme: **the "Option A+" backbone-first roadmap to market readiness — self-scored**.
- Self-rating legacy: DB/seed 100% (15 migrations, ESIC/VAT/PAYE/WHT/Pension config, 200+ records),
  backend 70%, frontend 45%, overall market readiness 45% → target 100%.
- **"No-Mock" Data-Driven Perfection Doctrine**: eradicate all mock data; UI renders what DB holds;
  Seed→Read→Compute→Transmit→Render→Verify loop. **Research-First** (domain research informs seed).
- 3 gaps at time: missing sales/HR tables → migration 016_seed_sales_hr_crm.sql; Phase 4/5 finance
  & tax computation (VAT/PAYE/Pension engines per Proclamation 979/2016 + 715/2011); missing
  purchase mutations (POST/approve → 405s).
- Phase 1 backbone: wire Purchase/Warehouse POSTs; warehouse receipt → auto `inventory_transactions`.
  Phase 2 finance engine: completed warehouse receipt → auto Journal Entry (Dr Stock / Cr AP);
  auto 15% VAT + WHT on POs → `tax_transactions`. Phase 3 executive UI/analytics strictly dynamic.
- Vercel consolidation checkpoints: Network audit (404/500/405), Data-integrity audit (Finance
  dashboard vs journal_entries sum), Mock-eradication audit (no static JSON arrays).
- Status: **ACTIVE core doctrine** — "no mock", research-first, backbone-first, auto-journal,
  verification audits. Direct blueprint source.

### 📄 proposed final database architecture.md — READ (2026-08-09)
- A conversational brainstorm re: obliterating Firebase Realtime DB/Firestore vs Postgres, then a
  HYBRID blueprint: **Realtime DB/Firestore for live modules + per-module Neon DBs each with own
  env var, Vercel bridging**.
- Key decisions therein: Inventory/warehouse/fleet + HR/attendance can be autonomous on Firebase
  (live sync); Tenant governance in Firestore; **Analytics aggregates could be on Firebase**;
  Accounting/Procurement/Compliance must be **SQL/Postgres ACID**.
- **Named Neon DBs from this doc**: `neon_accounting_db`, `neon_procurement_db`,
  `neon_analytics_db`, `neon_tenantfinance_db` — one DB per module to dodge Vercel/Neon free-tier
  CPU limits. Vercel gateways consolidate serverless functions (12-function free cap); batch
  writes; minimal cron (Firestore triggers).
- ⚠️ IMPORTANT LATERAL: this doc ALSO proposed **"ERP Gateway" single-function serverless routing**
  = same as PROCUREMENT_WAREHOUSE_FORWARD_PATH "consolidated entry points to minimize Vercel
  function count" — this is INTERNAL (one project) consolidation → must reconcile with the
  NEVER-bargained rule (no CROSS-REPO external endpoints). Internal gateway = fine; external
  repo endpoints = BANNED. Recorded so blueprint doesn't misread.
- Status: HYBRID concept = candidate architecture strand. Verify whether Firebase autonomy for
  inventory/HR survived into latest scope (see later files + live schema).

### 📄 PROCUREMENT_WAREHOUSE_FORWARD_PATH.md — READ (2026-08-09) ⭐ NEWER
- Transaction-aware procurement-forward doc. State: procurement DB had suppliers (32),
  purchase_requisitions (8), purchase_orders (8), purchase_receipts, budget_variance.
- **Recommended Golden Path: build Procurement → Warehouse operational foundation FIRST, then
  Finance** (finance needs real operational inputs). Paths 1-4; Path 4 external/Odoo sync DEFERRED.
- Missing tables to build: purchase_requisition_lines, purchase_order_lines, warehouse_receipts,
  inventory_transactions, inventory_products, employees, journal_entries.
- Proposes migration `016_procurement_schema.sql` + `017_seed_procurement.sql`, per-DB scripts
  (neon-read-schema.mjs), gateway consolidation, per-DB client (`neonProcurementClient.js`),
  procurement API contract (`/api/purchase`), frontend wiring, e2e test.
- ⭐ **This doc's per-DB (single-script-per-DB) + migration-naming convention directly prefigures
  the user's NEVER-bargained point #2.** Strong candidate for the current/most-alive path.
- Status: ACTIVE — this is the procurement-module backbone whose 17-migration result we already
  merged in the previous session.

### 📄 ARCHITECTURAL_REPORT.md — READ (2026-08-09) [DATED 2025-01]
Theme: **the Firestore-era "data-driven" success report (BEFORE the pivot)** — historical baseline.
- Built Firestore seeding infra (`seed-production-data.mjs`, `productionSeedCatalog.js`), all
  modules seeded under `tenantId:'production'`; API endpoints consume via `moduleDataStore.js`
  `getTenantDataset()` with fallback chain: Firestore → API → seed builder → empty default.
- Tenant-aware policy layer (`tenantPolicy.js`, `policyOrchestrator.js`), `firebaseAdmin.js`
  Bearer verification. UI via `apiClient.js`; `useAnalyticsSnapshot.js` 30s polling.
- Data flow: Firestore → moduleDataStore → Vercel APIs → apiClient → React UIs.
- This was the **pre-architectural-audit** state. It shows the era when Firestore was accepted
  as primary store + JS compute. Now SUPERSEDED by Postgres/Neon era. Key surviving concepts:
  tenant scoping, data flow layering, seed catalogs, fallback chains (redefined with Postgres).

### 📄 ARCHITECTURAL_AUDIT_REPORT.md — READ (2026-08-09) [DATED 2026-07-12] ⭐ TURNING POINT
Theme: **CRITICAL audit — compute engines disconnected; Firestore misused as compute engine.**
- Intended (old) architecture: Firestore = tenant governance/metadata only; **Odoo (Hugging Face)=
  core compute**, **Neon (Postgres)= SQL algorithms**, **GitHub App-Rendered Backends = external
  orchestration**, Vercel APIs = gateway + auth.
- Actual: Firestore used as storage AND in-memory JS compute (WRONG); Odoo proxy exists but ZERO
  calls; Neon not referenced anywhere (no `pg`, no connection string); githubAppClient.mjs exists
  but ZERO invocations; Seed builders = PRIMARY source (not fallback).
- Root cause of "zero data in UI": not permissions, not seeds — **compute engines not wired**.
- ⭐ This is the diagnosis that eventually pushed the project onto the **Postgres/Neon-only
  path (no more Odoo/HuggingFace, no more GitHub-app external backends)**. The user's
  NEVER-ETERNAL rule (no cross-repo/other-project endpoint integration) is a DIRECT reaction to
  this old design. Conclusion: blueprint must NOT resurrect GitHub-App-backend / Odoo/HF /
  cross-repo orchestration. They are now BANNED. Firestore role re-scoped to metadata/cache.
- Status: HISTORICAL-CRITICAL — the rationale for the current architecture. DO NOT reintroduce
  Odoo/HF external orchestration or GitHub App backends in the blueprint.

### 📄 proposed sessions.md — READ (2026-08-09) ⭐ historical "Option A" plan — now mostly BANNED
- This is the OLD 8-session plan (Option A: Odoo-on-HuggingFace + Neon for Analytics + GitHub App
  external orchestration + Firestore→Odoo migration). Sessions 1-8: verify Odoo → audit Firestore →
  migrate to Odoo → clean Firestore → Neon tables + Odoo sync → Neon SQL APIs → **GitHub App
  backends for external logic + webhooks** → E2E test.
- ⭐ **NEVER-BARGAINED CONFIRMATION:** Session 7 (GitHub App external repos/webhooks) and the whole
  Odoo/HuggingFace compute-central + "external orchestration" design is EXACTLY what the user has
  now BANNED. So this document is a dated historical plan that we must NOT resurrect. It proves
  the cross-repo ban is a deliberate reversal of this old path.
- What SURVIVES from this doc (re-baselined to Postgres/Neon-only, no Odoo/HF):
  - Firestore cleanup to metadata-only (roles/auth/config), no raw operational data.
  - Neon per-module DB tables + Odoo→Neon turns into **self-seeded Postgres** (no Odoo).
  - `neonAgingQueries.computeAgingBuckets()` SQL-aging (exists in live code) — aging via SQL.
  - E2E test + failure scenarios + security/tenant-isolation verification.
- Status: HISTORICAL (option A) — treat as evidence of banned patterns; do not revive.

## ⏳ OPEN EXTRACTION QUEUE → COMPLETED (all directive-2 files + dev notes corpus read)
- [x] ALL files from user directive #2 were read & recorded (see 💠 RESEARCH COMPLETION below).
- [x] `dev notes/` corpus (with space): 00-AI-PROJECT-MANAGER-CONSTITUTION.md,
  00-AI-TICKET-EXECUTOR-CONSTITUTION.md, 00-AI-UI-UX-POLISH-CONSTITUTION.md,
  NEON_DB_MIGRATION_ROADMAP.md, NEON_DB_SCHEMA_REQUIREMENTS.md, INTERIOR_MARCH_*,
  GITHUB_REPO_VS_ODOO_COMPARISON.md, LOCAL-RUN-OUTPUT.md, contracts/ research/ history/ trophy/.
- [x] `trophy/` roadmap corpus: 02-ROADMAP-M2-FINAL-RECONCILIATION.md, 01-PATH-A-MASTER-STRATEGY.md
  (indirectly via M2), CURSOR-MASTER-PLANNER-SUMMARY.md, architecture/, milestones/.
- [x] `history/` files (AGENT_REPORT_BATCH_*, CROSS_PROJECT_INSIGHTS, MULTI_SECTOR_REPO_EVALUATION,
  PLATFORM_SUPER_ADMIN_PLAN, PRODUCTION_ERP_EXECUTION_PLAN) — read via subagent for the banned
  cross-repo/GitHub-App patterns (all confidently surface the same banned particles).
- [x] `research/` files (04-PHASE6-ERP-MODULE-ADVANCEMENT-PLAN, 05-...CROSS-REPO-INTEGRATION
  SECURED, 01-03) — phase6 shows cross-repo as "NOT enterprise-grade" → evidence for the ban.

## 💠 RESEARCH & GROUNDING PHASE — COMPLETE (2026-08-09)
The rough note book (this file) is now a complete ground-truth ledger:
- ✅ **All directive-2 files** read & recorded (root + dev-notes corpus + history/trophy).
- ✅ **Never-bargained invariants** captured & honored (no cross-repo endpoints; per-DB single
  migration/seed/test scripts with equal momentum; student never touches real project).
- ✅ **Verdicts** assigned per file/theme (see VERDICT LOG above).
- ✅ **Live-codebase reconciliation** done (5 per-DB envs, getPool(), 17-migration procurement
  schema, per-DB seeds, banned leftovers catalogued).
- ✅ **Gaps** corporated for GAP_LOG (duplicate DB-client worlds; Odoo leftover refs; mock
  FALLBACK_DASHBOARD_METRICS; dead githubApp/test script).
- ⏸️ **NEXT (awaiting user approval):** rebuild the FINAL giant blueprint
  (`BLUEPRINT_FULL_ROADMAP.md`) from this ledger + executable schedule file + GAP_LOG seeding.

### 📄 [Diary batch] july17/18/23/29 + cursor attempted + devin task history — SUBAGENT EXTRACTION (2026-08-09)
These six large files (~4400 lines) were fully read. Distilled:

**SURVIVING CORE SCOPE & STANDARDS (consistent across all six → blueprint-safe):**
1. Data-driven model: complete, realistic production-grade seed for EVERY module FIRST; analytics
   engine must have enough data/scenarios to avoid short-circuit math. Metrics to preserve:
   20+ requisitions, 15+ POs, 50+ warehouse receipts, ~5% quality rejection, ≥6 vendors, ≥15
   sales orders, ≥100K–8M ETB revenue, real AR/AP buckets, cycle counts all states.
2. Purchase (requisition→approval→PO→receipt) + Warehouse (receive→inspect→store→pick→pack→ship)
   = "the two operational backbones of any ERP". Integration roadmap must start there.
3. Ethiopian compliance non-negotiable: VAT 15%, WHT 2/5/10%, PAYE brackets, pension 7%+11%,
   ERCA filings (EVAT statements, quarterly VAT), ESIC categories (21 divisions L2/L3) with
   category→tax mapping, Ethiopian COA standard.
4. Finance stack: VAT returns, PAYE reporting, WHT reconciliation, budget vs actual, supplier
   multi-factor scoring, aging (AR/AP), margin, cash-flow forecast, auto journal-entry.
5. Command-center dashboard with module health scores (Sales 100/CRM 62/Purchase 58-64/Warehouse
   65/Finance 70-72); CEO-ready real-time scores; "Tenant-aware intelligence for production".
6. Multi-tenant + roles: CEO super-admin; tenant_id scoping; role-gated access; tier support.
7. Stack standard: React/Vite + Recharts, Vercel serverless (api/ + server/api), Node; Postgres/
   Neon as stored+computation; per-module DBs; regression tests as the proof.
8. Anti-mock/anti-fallback STANDARD: user's hard line — LIVE data visible in UI; remove seed-
   builder fallbacks to prove end-to-end wiring ("brutally verify backend/ui are really live").
   Zero-data UI = core defect. Market readiness target 85-90%.

### DROPPED/DETOUR PATHS (do NOT resurrect in blueprint):
- GitHub-App external backends (gibi-sales / legal-commerce): explicitly rejected by user
  ("never do any github app integration at all").
- Odoo-on-HuggingFace as system of record → flipped to Neon-principal; Odoo dropped as
  dependency path.
- Frontend→Odoo proxy (/api/odooProxy / ServiceGateway XML-RPC): 500s, JSON parse failures,
  infinite retry loops → dropped for Neon-native APIs.
- Firestore/Firebase-native modules & analytics (moduleDataStore, productionSeedCatalog, Firestore
  tenant_operational_data): got "Missing or insufficient permissions" on audit_log → superseded by
  per-DB Neon migration/seed/test approach + user ban on cross-repo/3rd-party integrations.
- Firestore→Odoo migration script (migrate-firestore-to-odoo.mjs): 59/59 records migrated but
  detour because final data home = Neon.
- "Remove auth from everything" router-level one-liner: failed; real fix = per-handler auth audit.
- ⭐ CONFIRMS the user's NEVER-BARGAINED rule: cross-repo/external endpoints (GitHub Apps, gibi-
  sales, legal-commerce, Odoo HF) are precisely the paths that were tried and REJECTED. Blueprint
  must not include them.

### 📄 LIVE-CODEBASE RECONCILIATION (2026-08-09) — verified, not just documents
Read package.json, .env.local (KEYS only), api/lib/shared.js, server/api/lib/neonClient.js,
migrations list, directory structure.

**CURRENT PER-DB POSTURE (CONFIRMS NEVER-BARGAINED rule is ALIVE):**
- `.env.local` keys present: DATABASE_URL, LOCAL_PG_* (host/port/user/password/database),
  NEON_DATABASE_URL, NEON_ACCOUNTING_DB_URL, NEON_ANALYTICS_DB_URL, NEON_PROCUREMENT_DB_URL,
  NEON_TENANTFINANCE_DB_URL → 5-DB (main + 4 module) mapping.
- `api/lib/shared.js` `getPool(dbType)` ROUTES to per-DB pools: accounting, procurement, analytics,
  tenantfinance, default. Accepts NEONACCOUNTINGDBURL|NEON_ACCOUNTING_DB_URL etc (both naming eras).
  + `isDbUnavailable()` (quota/connect/timeout detection → graceful), `resolveTenantId()`,
  `applyCors()`, `tableExists()`.
- Migrations `server/migrations/` show lineage 001→017 (20 files incl run-migrations.js):
  001 core, 002 ESIC seed, 003 purchase, 004 operational seed, 005 heal, 006 warehouse,
  007/008/009/010 detailed+scale, 011/012/013/013b/014/014b finance+tax, 015 advanced,
  016 align_procurement_schema, 017 budget_ref. ⭐ This matches the merged worktree 17-migration
  result applied to addiscrown_procurement_local.

**GAPS FOUND (log to GAP_LOG later):**
- `server/api/lib/neonClient.js` still single `NEON_DATABASE_URL` (older internal server layer)
  vs `api/lib/shared.js` per-DB pools — two DB-client worlds must be reconciled (decide SSOT per
  NEVER-bargained per-DB rule).
- `odooClient.js` (server/api/lib + src/lib + api/odooProxy.js) is STILL referenced in
  server/api/inventory/movements.js + src/services/ServiceGateway.js → leftover Odoo path not yet
  removed end-to-end (BANNED path must be fully removed from runtime, not just docs).
- `githubAppClient.mjs` used only by `scripts/test_github_repo_discovery.mjs` → effectively dead;
  remove test + file (BANNED).
- `api/lib/shared.js` hardcodes `FALLBACK_DASHBOARD_METRICS` (revenue 2840000, scores 82-87…) →
  this is a MOCK FALLBACK → violates the user's no-mock doctrine; must be flagged in blueprint.
- `package.json` deps include `@octokit/*`, `xmlrpc` (Odoo), `firebase`/`firebase-admin`
  (Firebase auth stays OK), `pg` (Postgres), `recharts`, `chart.js` (chart libs present → the
  "pychart/pycharm" concern is satisfied by recharts + chart.js presence). `chart.js`+`recharts`
  both installed; `verify` which is actually wired for dashboards.
- Frontend (src/lib/odooClient.js) still present → Odoo client in UI layer = banned-path leftover.

**TENANT/POLICY:** shared.js `resolveTenantId()`: 'production' → 'tenant_default'; tenant_id
header/query. (Reconciles with tenantPolicy.js/tenantOdooDomain.js era.)

**NEON_FALLBACK_SETUP + VERCEL_ENV_SETUP.md:** historical single-DB + Odoo env guides. Their
GiTHub/Odoo env vars are now banned leftovers; the per-DB env vars are the live ones. Vercel envs
should be: NEON_ACCOUNTING/ANALYTICS/PROCUREMENT/TENANTFINANCE_DB_URL (+ DATABASE_URL), Firebase
VITE_* (auth only), no ODOO_*/GITHUB_*.