# Procurement & Warehouse Forward Path

## Neon Procurement DB Audit Summary

- Target DB: `neon_procurement_db`.
- Connection string verified and accessible via read-only query.
- Existing public tables found:
  - `suppliers` (32 rows)
  - `purchase_requisitions` (8 rows)
  - `purchase_orders` (8 rows)
  - `purchase_receipts`
  - `budget_variance`
- Missing tables required for full end-to-end operational flows:
  - `purchase_requisition_lines`
  - `purchase_order_lines`
  - `warehouse_receipts`
  - `inventory_transactions`
  - `inventory_products`
  - `employees`
  - `journal_entries`

## Current State Interpretation

The procurement database already contains the core procurement entities needed to start operational work. This is a strong foundation:

- Purchase requisitions and purchase orders exist, so the basic procurement lifecycle is partially modeled.
- Suppliers exist and are seeded, enabling vendor workflows.
- Purchase receipt tracking exists, which can be extended into a warehouse receiving flow.

However, the data model is incomplete for full warehouse and finance integration because:

- There are no explicit line items for requisitions or orders.
- There is no inventory transaction history or inventory product catalog.
- There is no employee table for approvals, responsibilities, or audit trails.
- There is no journal entry table to capture finance-backed ledger events.

## Recommended Core Pillar

### Golden Super Recommended Choice

**Build the Procurement-Warehouse Operational Foundation first, using the existing procurement tables and adding the missing line item/inventory/warehouse/journal tables as the next priority.**

This path delivers the best return because:

- It creates real operational data that Finance can consume later.
- It avoids wasting effort on finance or analytics features that still lack input data.
- It preserves the current progress in procurement tables and extends it incrementally.
- It aligns with the previously documented strategic recommendation to prioritize operational cycles first.

## Possible Forward Paths

### Path 1: Operational Foundation First (Recommended)

- Continue from the current procurement DB state.
- Add missing tables to support line items, inventory transactions, warehouse receipts, employees, and journal entries.
- Implement APIs and frontend workflows around purchase requisitions, purchase orders, receiving, and inventory updates.
- Later, wire Finance engine tasks (VAT, journal posting, tax compliance) to these operational flows.

### Path 2: Finance Engine First

- Build the finance computation engine before completing procurement/warehouse flows.
- Risk: the finance module will have little real data and will remain largely theoretical.
- Not recommended until the operational foundation is in place.

### Path 3: Parallel Operational + Finance

- Develop procurement, warehouse, and limited finance features simultaneously.
- Requires more coordination and increases the risk of partial implementations.
- Can work if the team is disciplined, but it is not the optimal first move given the current DB state.

### Path 4: External Integration / Odoo Sync

- Pull in external data sources or try to sync Odoo before fully stabilizing Neon DB.
- This is deferred by the current strategy and would add unnecessary complexity now.

## File-by-File Action Plan

### 1. Audit & Validation

- `scripts/neon-read-schema.mjs` (new)
  - Connects to `NEONPROCUREMENTDBURL`.
  - Lists public tables and key column metadata.
  - Reports existence of expected tables.
  - Non-destructive.

### 2. Migrations & Seed Data

- `migrations/016_procurement_schema.sql` (new)
  - Create missing procurement/warehouse tables:
    - `purchase_requisition_lines`
    - `purchase_order_lines`
    - `warehouse_receipts`
    - `inventory_products`
    - `inventory_transactions`
    - `employees`
    - `journal_entries`
  - Include tenant and audit columns.
  - Add indexes for `tenant_id`, `status`, `created_at`.

- `migrations/017_seed_procurement.sql` (new)
  - Populate line items, inventory products, warehouse receipts, sample employees, and journal entries.
  - Use idempotent SQL (`INSERT ... ON CONFLICT DO NOTHING`) to avoid duplicate runs.

- `scripts/seed-procurement.mjs` (new)
  - Optionally seed data via JS if the project uses a node-based migrations/seed workflow.
  - Accepts `DATABASE_URL` / `NEONPROCUREMENTDBURL` from env.

### 3. API & Gateway

- `api/purchase/index.js` (new or updated)
  - Expose procurement endpoints under `/api/purchase`.
  - Support:
    - `GET /api/purchase/requisitions`
    - `GET /api/purchase/requisitions/:id`
    - `POST /api/purchase/requisitions`
    - `POST /api/purchase/requisitions/:id/approve`
    - `POST /api/purchase/orders`
    - `GET /api/purchase/orders`
    - `POST /api/purchase/orders/:id/receive`

- `server/lib/neonProcurementClient.js` (new)
  - Central Neon query helper for procurement DB.
  - Exposes reusable query functions and handles connection logic.

- `api/gateway.js` (existing or new)
  - Consolidates serverless entry points to minimize Vercel function count.
  - Routes to procurement, analytics, accounting, and tenant finance DBs via env vars.

### 4. Frontend Wiring

- `src/lib/neonPurchaseAPI.js` (update)
  - Map frontend requests to `/api/purchase` endpoints.
  - Include purchase requisition, purchase order, receipt, and supplier flows.

- `src/pages/PurchaseRequisitions.jsx` (update)
  - Load real requisitions from API.
  - Submit new requisitions.
  - Approve requisitions.

- `src/pages/PurchaseOrders.jsx` (update)
  - List real purchase orders.
  - Create POs from approved requisitions.

- `src/pages/WarehouseReceipts.jsx` (update)
  - Record receipt of goods and create inventory transactions.

- `src/pages/Vendors.jsx` / `src/pages/FinancialDocuments.jsx` (review)
  - Ensure vendor and financial document pages consume the procurement API rather than mocks.

### 5. QA and Validation

- `tests/e2e/purchase-workflow.test.mjs` (new)
  - Validate create -> approve -> PO -> receipt workflow.
  - Ensure APIs return persisted data.

- `tests/reports/purchase-workflow-log.txt` (new)
  - Save network and console logs from manual validation.

## Immediate Next Action

**Draft the migration and seed SQL for the missing tables, plus the procurement API contract, before any code is changed.**

This will preserve current progress, avoid accidental duplicate seeding, and let us review the structural changes before implementation.

## Recommended Execution Sequence

1. Implement and review `scripts/neon-read-schema.mjs`.
2. Draft `migrations/016_procurement_schema.sql` and `migrations/017_seed_procurement.sql`.
3. Review the API contract in `api/purchase/index.js` and `server/lib/neonProcurementClient.js`.
4. Wire the frontend in `src/lib/neonPurchaseAPI.js` and page components.
5. Run QA on the granular procurement workflow.
6. Only then move to finance engine wiring, using the operational data from procurement + warehouse.

## Golden Recommendation

**Build the Procurement + Warehouse operational cycle first, centered on Neon procurement DB, then connect Finance once the operational data flows exist.**

That is the single pillar that will generate the inputs the Finance Suite and analytics modules need to become reliable and meaningful. Once Procurement + Warehouse is solid, every other ERP module becomes easier and less fragile.
