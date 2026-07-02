# REPORT-TICKET-014

## Summary

Implemented TICKET-014 by creating a centralized Odoo query contract (`src/lib/odooQuery.js`) and refactoring `ServiceGateway.js` to use schema-safe domains, field allowlists, and pagination helpers. All Odoo functions now validate fields and domains against TICKET-013 audit results, preventing schema drift on HF Odoo 19.

## Background and purpose

This ticket turns TICKET-013's audit results into enforced code rules. Before, each ServiceGateway function had its own ad hoc domain logic; now all follow a single contract. The contract ensures:
- No unsupported fields are requested (e.g. `date_planned_start` on mrp.production)
- No deprecated fields are used in domains (e.g. `account.account.deprecated`)
- Domains are built safely from validated filter keys only
- Pagination and field trimming are consistent

This prepares the infrastructure for TICKET-015 (UI filter UI) and TICKET-017 (tenant domain injection).

## Files changed

- `src/lib/odooQuery.js` (new)
- `scripts/test_odoo_query.mjs` (new)
- `src/services/ServiceGateway.js` (refactored)
- `src/pages/WorkOrders.jsx` (removed unsupported column)
- `package.json` (added `test:odoo-query` script)
- `dev notes/trophy/cursor-research/ODOO-SCHEMA-MATRIX.md` (added implementation note)

## What was done

### Task 1 — Created `src/lib/odooQuery.js`

Exports:
- `FIELD_ALLOWLIST` — Model → safe fields from TICKET-013 audit
- `DEFAULT_DOMAINS` — Model → default safe domain
- `buildOdooDomain(model, filters)` — Filter builder; validates all filter keys and generates safe Odoo domains
- `sanitizeFields(model, fields)` — Strips unsupported fields
- `buildSearchReadKwargs()` — Handles pagination and field sanitization

Key features:
- `buildOdooDomain` supports per-model filters: `active`, `search`, `state`, `dateFrom`, `dateTo`, `account_type`, `customer`, `supplier`
- Never uses `account.account.deprecated`
- Never requests `mrp.production.date_planned_start`
- Rejects unknown filter keys to prevent schema drift

### Task 2 — Refactored ServiceGateway.js

Updated all core Odoo list functions to use the contract:
- `getOdooProducts` — Now accepts `filters`, `offset`, `order`
- `getOdooSalesOrders` — Now accepts `filters` with `state`, `dateFrom`, `dateTo`, `search`
- `getOdooPurchaseOrders` — Same pattern as sales
- `getOdooCustomers` / `getOdooVendors` — Use `buildOdooDomain` for rank filters
- `getOdooEmployees` — Accepts optional filters
- `getOdooAccounts` — Never uses `deprecated`; uses `active` field only
- `getOdooManufacturingOrders` — Never requests `date_planned_start`

Backward compatibility: All existing call sites (no filters) behave as before.

### Task 3 — Removed unsupported MRP column

**File:** `src/pages/WorkOrders.jsx`

Removed the `date_planned_start` column since the field is missing on HF Odoo 19. WorkOrders now display: name, product, quantity, state.

### Task 4 — Test script

**File:** `scripts/test_odoo_query.mjs` + `npm run test:odoo-query`

Asserts:
- No `deprecated` in account.account domains
- `date_planned_start` stripped from MRP allowlist and sanitization
- All core 4 models have FIELD_ALLOWLIST and DEFAULT_DOMAINS
- Unknown filters rejected
- Search and rank filters generate correct Odoo domain syntax

**Result:** ✅ All 16 checks pass

### Task 5 — Update schema matrix

Added § **TICKET-014 implementation** note documenting which DEFAULT_DOMAINS and FIELD_ALLOWLIST keys are coded.

## Verification

- ✅ `npm run build` passes (1m 36s, 3546 modules)
- ✅ `npm run test:odoo-query` passes (16/16 checks)
- ✅ No use of `deprecated` in codebase
- ✅ `mrp.production.date_planned_start` stripped from requests
- ✅ Backward compatibility preserved (no breaking changes to call sites)
- ✅ `ALLOWED_MODELS` in proxy untouched (no Wave B additions)

## Contract reference

### Supported filters per model

| Model | Filters |
|-------|---------|
| `product.product` | `active`, `search` |
| `sale.order` | `state`, `dateFrom`, `dateTo`, `search` |
| `purchase.order` | `state`, `dateFrom`, `dateTo`, `search` |
| `account.account` | `active`, `account_type`, `search` |
| `res.partner` | `customer`, `supplier`, `search` |
| `mrp.production` | `state` |
| `hr.employee` | `search` |

### DEFAULT_DOMAINS applied

| Model | Domain |
|-------|--------|
| `product.product` | `[['active', '=', true]]` |
| `account.account` | `[['active', '=', true]]` |
| `sale.order` | `[]` |
| `purchase.order` | `[]` |
| `res.partner` | `[]` (caller sets via customer/supplier filter) |
| `hr.employee` | `[]` |
| `mrp.production` | `[]` |

### Example usage

```javascript
import { buildOdooDomain, FIELD_ALLOWLIST } from '../lib/odooQuery';

// List active products matching "ABC"
const domain = buildOdooDomain('product.product', { search: 'ABC' });
// Result: [['active','=',true],['|',['name','ilike','ABC'],['default_code','ilike','ABC']]]

// List vendors
const vendorDomain = buildOdooDomain('res.partner', { supplier: true });
// Result: [['supplier_rank','>',0]]

// Safe field set for manufacturing
const mrpFields = FIELD_ALLOWLIST['mrp.production'];
// Result: ['id','name','product_id','product_qty','state'] (no date_planned_start)
```

## Blocks and issues resolved

- **Schema drift prevention:** All Odoo functions now validate against audit results
- **HF Odoo compatibility:** Deprecated and missing fields are handled safely
- **Filter consistency:** Domains built via contract, not ad hoc in each function
- **MRP safety:** WorkOrders page no longer assumes `date_planned_start` exists

## Next step

TICKET-015 (ListFilterBar UI component) can now consume `buildOdooDomain` and safe filter keys without worrying about schema compatibility.

## Notes for agents

The `buildOdooDomain` function is the central entry point for all Odoo query building. To add a new filter key or model:
1. Update `FIELD_ALLOWLIST` with safe fields from the audit script
2. Add a row to the `supportedFilters` object in `buildOdooDomain`
3. Implement the filter case logic
4. Add a test case in `scripts/test_odoo_query.mjs`
5. Run `npm run test:odoo-query` to verify
6. Update this report and the schema matrix
