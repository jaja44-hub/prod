# Architectural Audit Report
**Date:** 2026-07-12  
**Scope:** Production Submodule - Data Flow & Compute Engine Integration  
**Status:** CRITICAL - Major Architectural Disconnects Identified

---

## Executive Summary

The current implementation has **severe architectural fallacies** where intended compute engines (Odoo, Neon DB, GitHub App-Rendered Backends) are **completely disconnected** from the application. Instead, Firestore is being misused as both storage AND compute engine, which it cannot support for SQL algorithms and complex business logic.

**Root Cause:** Zero data in UI is NOT a Firestore permissions issue - it's a **compute engine wiring issue**. The actual compute platforms that should be orchestrating warehouse logic, finance algorithms, and SQL operations are not connected to the data flow.

---

## Intended vs Actual Architecture

### Intended Architecture (Per Design Documents)

| Platform | Intended Role | Connection Status |
|----------|---------------|------------------|
| **Firestore** | Tenant governance, identity scoping, metadata storage | ✅ Connected |
| **Odoo (Hugging Face)** | Core compute engine for ERP logic (warehouse, finance, inventory) | ❌ **DISCONNECTED** |
|Neon DB (PostgreSQL)** | SQL algorithm provider, complex data computations | ❌ **DISCONNECTED** |
| **GitHub App-Rendered Backends** | External orchestration for warehouse & finance modules | ❌ **DISCONNECTED** |
| **Vercel Serverless APIs** | API gateway, auth verification, data routing | ✅ Connected |

### Actual Architecture (Current Implementation)

| Platform | Actual Role | Usage Pattern |
|----------|-------------|---------------|
| **Firestore** | Storage + Compute (INCORRECT) | Storing raw data AND attempting in-memory JS computations |
| **Odoo Proxy** | Exists but NOT called | `api/odooProxy.js` exists but analytics engine never calls it |
| **Neon DB** | Not referenced | No connection string, no queries, no usage anywhere |
| **GitHub App** | Authenticated but unused | `githubAppClient.mjs` exists but never invoked by APIs |
| **Seed Builders** | Primary data source | Currently the ONLY source of data (not fallback) |

---

## Detailed Findings

### 1. GitHub App-Rendered Backends - COMPLETELY UNUSED

**File:** `server/api/lib/githubAppClient.mjs`
- **Status:** ✅ Authenticated with Vercel env vars (`GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`)
- **Functions Available:** `getInstallationOctokit()`, `getRepositoryInfo()`, `getRepoTree()`
- **Actual Usage:** ❌ **ZERO invocations** across entire codebase

**Search Results:**
```bash
# Searched entire codebase for githubAppClient usage
# Found: Only the library file itself
# Found: NO API endpoints calling it
# Found: NO analytics engine calling it
```

**Intended Purpose:** Orchestrate warehouse logic and finance functions from external GitHub repos
**Actual Reality:** Completely disconnected - warehouse and finance APIs use Firestore seed data instead

---

### 2. Neon DB (PostgreSQL) - NOT REFERENCED ANYWHERE

**Search Results:**
```bash
# Searched for: NEON, postgres, postgresql, DATABASE_URL
# Found: 0 references in application code
# Found: 0 connection strings in environment variables
# Found: 0 SQL queries in any API files
```

**Package Dependencies:** No PostgreSQL client libraries in `package.json`
- No `pg`, `postgres`, `neon`, or similar packages
- Only `xmlrpc` for Odoo communication (but not used by analytics)

**Intended Purpose:** SQL algorithm provider for complex data computations
**Actual Reality:** Does not exist in the implementation

---

### 3. Odoo Proxy - EXISTS BUT NOT CALLED BY ANALYTICS ENGINE

**File:** `api/odooProxy.js`
- **Status:** ✅ Configured with env vars (`ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_APIKEY`)
- **Capabilities:** XML-RPC communication with Odoo, tenant domain filtering, model access control
- **Actual Usage by Analytics Engine:** ❌ **ZERO calls**

**Analytics Engine Data Flow (ACTUAL):**
```javascript
// server/api/analytics/engine.js (lines 61-76)
async function resolveWarehouseWorkflow(tenantId, data = {}) {
  // 1. Try Firestore
  const dataset = await getTenantDataset(tenantId, 'warehouse_workflow', buildWarehouseWorkflowSeed);
  return dataset;
  // 2. Fallback to seed builder (NOT Odoo)
  return buildPickPackShipWorkflow(tenantId);
}
```

**Analytics Engine Data Flow (INTENDED):**
```javascript
// SHOULD BE:
async function resolveWarehouseWorkflow(tenantId, data = {}) {
  // 1. Call Odoo via proxy for real warehouse state
  const odooData = await odooProxy({ model: 'stock.picking', method: 'search_read', ... });
  return transformOdooToAnalytics(odooData);
}
```

**Warehouse API Data Flow (ACTUAL):**
```javascript
// server/api/inventory/warehouse.js (line 11)
const dataset = await getTenantDataset(tenantId, 'warehouse_workflow', buildWarehouseWorkflowSeed);
```

**Finance API Data Flow (ACTUAL):**
```javascript
// server/api/finance/aging.js (line 44)
const dataset = await getTenantDataset(tenantId, 'finance_aging', buildFinanceAgingSeed);
```

**Conclusion:** Odoo proxy exists but is completely bypassed by all module APIs

---

### 4. Firestore Misuse - Storage Treated as Compute Engine

**Current Pattern:**
```javascript
// All APIs follow this pattern:
const dataset = await getTenantDataset(tenantId, 'datasetKey', seedBuilder);
// Then compute in-memory:
const summary = buildWarehouseSummary(dataset);
const report = computeAgingReport(dataset);
```

**Problem:**
- Firestore is a document store, NOT a compute engine
- It cannot execute SQL algorithms
- It cannot run complex business logic
- It cannot maintain data consistency across related entities
- Spark plan has limited compute capabilities

**What Firestore SHOULD Do:**
- Store tenant configuration
- Store user profiles and auth metadata
- Cache computed results from actual compute engines
- Store operational metadata

**What Firestore IS Doing:**
- Storing raw operational data (should be in Odoo)
- Attempting to compute business logic in application code (should be in Odoo/Neon)
- Serving as primary data source instead of caching layer

---

### 5. Seed Builders - PRIMARY DATA SOURCE (Not Fallback)

**Current Implementation:**
```javascript
// server/api/lib/moduleDataStore.js (lines 38-45)
const seeded = seedBuilder(tenantId);
memoryFallback.set(key, seeded);
try {
  await saveTenantDataset(tenantId, datasetKey, seeded); // Save to Firestore
} catch (err) {
  console.warn(`[moduleDataStore] Firestore lazy-seed failed for ${datasetKey}:`, err?.message || err);
}
return seeded;
```

**Problem:**
- Seed builders are the PRIMARY data source when Firestore is empty
- They generate static mock data, not real computed data
- They are NOT a fallback - they are the default behavior
- No real-time connection to actual compute engines

**What This Means:**
- The dashboard shows "seed activity data" because that's ALL it has
- Zero data in warehouse/finance is because seed builders don't have real logic
- Analytics not available because there's no real data to compute

---

## Data Flow Comparison

### Intended Data Flow (CORRECT)
```
User Request → Vercel API → Auth Verification → 
  ├─→ Odoo (Hugging Face) for ERP logic (warehouse, finance, inventory)
  ├─→ Neon DB for SQL algorithms and complex computations
  ├─→ GitHub App Backends for external orchestration
  └─→ Firestore for tenant metadata and caching
    ↓
Compute Results → Transform → UI Display
```

### Actual Data Flow (INCORRECT)
```
User Request → Vercel API → Auth Verification → 
  └─→ Firestore (empty or seed data)
      ↓
In-Memory JS Computation (not SQL algorithms)
      ↓
UI Display (mock data or zero)
```

---

## Specific Module Analysis

### Warehouse Module
**Intended:** Odoo `stock.picking`, `stock.quant`, `stock.location` models via proxy  
**Actual:** Firestore seed data with in-memory filtering  
**Gap:** No connection to actual Odoo warehouse logic

### Finance Module  
**Intended:** Odoo `account.move`, `account.payment` models + Neon DB for aging algorithms  
**Actual:** Firestore seed data with simple JS bucketing  
**Gap:** No SQL-based aging calculations, no real Odoo financial data

### Analytics Engine
**Intended:** Aggregate from Odoo + Neon DB + GitHub App backends  
**Actual:** Aggregate from Firestore seed data only  
**Gap:** No real-time data, no complex computations

---

## Root Cause of "Zero Data" Issue

**NOT:** Firestore permissions (that was a symptom)  
**NOT:** Missing seed data (we seeded it)  
**ACTUAL ROOT CAUSE:** The compute engines that should generate real data are not connected

**Why Dashboard Shows Zero:**
1. Warehouse API reads Firestore → finds seed data → computes in-memory → returns static counts
2. Finance API reads Firestore → finds seed data → computes simple aging → returns static buckets
3. Analytics engine aggregates static data → shows static KPIs
4. No real-time updates because no real compute engines are connected

---

## Immediate Corrections Required

### Priority 1: Wire Odoo Proxy to Module APIs
1. Update `server/api/inventory/warehouse.js` to call Odoo proxy for `stock.picking` data
2. Update `server/api/finance/aging.js` to call Odoo proxy for `account.move` data
3. Update analytics engine to use Odoo data instead of Firestore seed data

### Priority 2: Integrate Neon DB for SQL Algorithms
1. Add PostgreSQL client to dependencies
2. Configure Neon DB connection string in Vercel env
3. Migrate complex computations (aging, forecasting) to SQL queries
4. Update APIs to query Neon DB instead of in-memory JS

### Priority 3: Connect GitHub App Backends
1. Identify external repos for warehouse and finance orchestration
2. Update analytics engine to call `githubAppClient` for external logic
3. Implement webhook handlers for real-time updates from GitHub repos

### Priority 4: Re-architect Firestore Role
1. Remove raw operational data from Firestore
2. Use Firestore only for tenant config, user profiles, metadata
3. Implement proper caching layer for computed results
4. Stop treating Firestore as compute engine

---

## Verification Steps

### To Confirm Current State:
1. Check Vercel env vars - are Odoo credentials set?
2. Check if Odoo instance is running on Hugging Face
3. Check if Neon DB instance exists and is accessible
4. Check GitHub App installation status
5. Verify no PostgreSQL client in dependencies

### To Verify Fixes:
1. Odoo proxy should return real stock.picking data
2. Neon DB should execute SQL aging queries
3. GitHub App should return orchestrated warehouse logic
4. Firestore should only contain metadata, not raw data
5. Dashboard should show real-time computed data

---

## Conclusion

The current implementation is **fundamentally misarchitected**. We have built a Firestore-centric application when the intended architecture was Odoo + Neon DB + GitHub App backends with Firestore as a supporting metadata store.

**The "zero data" issue cannot be fixed by seeding more data to Firestore.** It requires reconnecting the actual compute engines that should be generating and computing the data in the first place.

**Severity:** CRITICAL - Production deployment is using mock data instead of real ERP logic  
**Risk:** HIGH - Business decisions based on static seed data instead of real operational data  
**Action Required:** Complete architectural re-wiring of compute engine integration
