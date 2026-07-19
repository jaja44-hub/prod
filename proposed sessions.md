

## Proposed Session Schedule & Execution Scope

Based on your chosen path (Option A: Odoo on Hugging Face + Neon for Analytics), here is the detailed session-by-session plan:

---

### **Session 1: Verify Odoo Instance Status & Test Proxy Connectivity**

**Objective:** Confirm Odoo on Hugging Face is active, accessible, and responding to proxy calls

**Actions:**
1. Test Odoo proxy endpoint directly with XML-RPC calls
2. Query Odoo models: `stock.picking`, `account.move`, `res.partner`
3. Verify tenant domain filtering is working
4. Check if Odoo has existing seeded data
5. Test authentication with current env vars
6. Document current Odoo data state

**Deliverables:**
- Odoo connectivity verification report
- Current data inventory in Odoo
- Proxy call success/failure logs

**Success Criteria:**
- Odoo proxy returns valid data
- Authentication succeeds
- Tenant filtering works

---

### **Session 2: Audit Firestore Raw Data & Create Migration Script**

**Objective:** Identify all raw operational data in Firestore and create Odoo migration script

**Actions:**
1. Audit Firestore collections for raw operational data:
   - `tenant_operational_data` (sales_orders, warehouse_workflow, finance_aging, etc.)
   - Identify auth/user data to preserve (users, tenants, modules)
2. Create migration script structure:
   - Map Firestore data structures to Odoo models
   - `sales_orders` → Odoo `sale.order`
   - `warehouse_workflow` → Odoo `stock.picking`
   - `finance_aging` → Odoo `account.move`
   - `crm_pipeline` → Odoo `crm.lead`
   - `purchase_data` → Odoo `purchase.order`
3. Create dry-run mode to preview migrations
4. Add error handling and rollback capability

**Deliverables:**
- Firestore data audit report
- Migration script with dry-run capability
- Data mapping documentation

**Success Criteria:**
- All raw data identified and mapped
- Migration script passes dry-run validation

---

### **Session 3: Execute Data Migration from Firestore to Odoo**

**Objective:** Transfer all raw operational data from Firestore to Odoo

**Actions:**
1. Execute migration script in dry-run mode first
2. Review and approve migration plan
3. Execute actual migration to Odoo:
   - Create partners (customers/vendors)
   - Create sales orders
   - Create warehouse pickings
   - Create account moves (invoices)
   - Create CRM leads
   - Create purchase orders
4. Verify data integrity in Odoo
5. Compare record counts between Firestore and Odoo

**Deliverables:**
- Migration execution logs
- Data verification report
- Odoo data inventory post-migration

**Success Criteria:**
- All data migrated successfully
- Odoo has matching record counts
- No data corruption

---

### **Session 4: Remove Firestore Raw Data & Seed Builder Fallbacks**

**Objective:** Clean Firestore to metadata-only and remove mock data fallbacks

**Actions:**
1. Remove raw operational data from Firestore:
   - Delete from `tenant_operational_data` collection
   - Preserve: tenants, users, modules, roles
2. Remove seed builder fallbacks from code:
   - Update [moduleDataStore.js](cci:7://file:///home/ja/Documents/addis-crown-v3/production-submodule/server/api/lib/moduleDataStore.js:0:0-0:0) to remove lazy-seeding
   - Update warehouse API to remove Firestore fallback
   - Update finance API to remove Firestore fallback
   - Update analytics engine to remove seed builder fallbacks
3. Add explicit error handling when Odoo is unavailable
4. Update APIs to return clear errors instead of mock data

**Deliverables:**
- Cleaned Firestore (metadata only)
- Code with no seed builder fallbacks
- Error handling for Odoo failures

**Success Criteria:**
- Firestore contains only metadata
- APIs fail explicitly when Odoo unavailable
- No mock data returned

---

### **Session 5: Set Up Neon DB Tables & Sync from Odoo**

**Objective:** Initialize Neon DB for analytics and establish Odoo sync

**Actions:**
1. Create Neon DB tables:
   - `vendor_bills` (for accounts payable analytics)
   - `customer_invoices` (for accounts receivable analytics)
   - `warehouse_metrics` (for warehouse analytics)
   - `sales_analytics` (for sales analytics)
   - Indexes for performance
2. Create sync script:
   - Pull data from Odoo via proxy
   - Transform and insert into Neon DB
   - Schedule periodic syncs
3. Test sync with current Odoo data
4. Verify Neon DB has correct data

**Deliverables:**
- Neon DB schema
- Odoo-to-Neon sync script
- Initial sync execution

**Success Criteria:**
- Neon DB tables created
- Sync script runs successfully
- Neon DB has Odoo data

---

### **Session 6: Implement Neon DB Analytics Queries in APIs**

**Objective:** Replace in-memory JS computations with Neon DB SQL queries

**Actions:**
1. Update finance/aging API:
   - Use Neon DB [computeAgingBuckets()](cci:1://file:///home/ja/Documents/addis-crown-v3/production-submodule/server/api/lib/neonAgingQueries.js:49:0-188:1) instead of JS bucketing
   - Query Neon for aging calculations
2. Update warehouse API:
   - Use Neon DB for warehouse metrics
   - Query Neon for pick/pack/ship analytics
3. Update analytics engine:
   - Aggregate from Neon DB instead of Firestore
   - Use SQL for complex computations
4. Remove in-memory computation logic
5. Test all APIs with Neon DB

**Deliverables:**
- Updated APIs using Neon DB
- Removed in-memory computations
- Performance benchmarks

**Success Criteria:**
- All APIs use Neon DB queries
- Analytics computed via SQL
- Performance acceptable

---

### **Session 7: Connect GitHub App Backends for External Orchestration**

**Objective:** Integrate GitHub App for external warehouse/finance logic

**Actions:**
1. Identify external repos for warehouse and finance orchestration
2. Update analytics engine to call `githubAppClient`:
   - Fetch external logic from repos
   - Execute logic in isolated environment
   - Return results to analytics
3. Implement webhook handlers:
   - Listen for repo updates
   - Trigger cache invalidation
4. Test GitHub App integration
5. Document external logic architecture

**Deliverables:**
- GitHub App integration in analytics
- Webhook handlers
- External logic documentation

**Success Criteria:**
- GitHub App successfully called
- External logic executes
- Webhooks work correctly

---

### **Session 8: End-to-End Testing & Verification**

**Objective:** Validate entire data flow from Odoo → Neon → UI

**Actions:**
1. Test complete data flow:
   - Create test data in Odoo
   - Sync to Neon DB
   - Query via APIs
   - Display in UI
2. Test failure scenarios:
   - Odoo unavailable
   - Neon DB unavailable
   - GitHub App unavailable
3. Verify analytics accuracy:
   - Compare Odoo data to UI display
   - Verify calculations
   - Check real-time updates
4. Performance testing:
   - Load testing
   - Response time benchmarks
5. Security verification:
   - Tenant isolation
   - Auth enforcement
   - Data access controls

**Deliverables:**
- End-to-end test report
- Performance benchmarks
- Security audit
- Production readiness checklist

**Success Criteria:**
- Data flow works end-to-end
- Analytics accurate
- Performance acceptable
- Security validated

---

## Session Dependencies

```
Session 1 (Verify Odoo) → Session 2 (Audit) → Session 3 (Migrate) → Session 4 (Clean Firestore)
                                                              ↓
Session 5 (Neon Setup) → Session 6 (Neon APIs) → Session 7 (GitHub App) → Session 8 (E2E Test)
```

**Critical Path:** Sessions 1-4 must complete before Session 5 (Neon) can begin.

---

## Risk Mitigation

- **Session 3:** Migration will have dry-run and rollback capability
- **Session 4:** Firestore cleanup will preserve auth/user data only
- **Session 5:** Neon DB sync will be non-destructive to Odoo
- **Session 8:** Testing will include failure scenarios

---

**Do you approve this session schedule? If yes, I will begin Session 1.**