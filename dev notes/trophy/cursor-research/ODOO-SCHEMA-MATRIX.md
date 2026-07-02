# ODOO Schema Matrix — HF Compatibility

**Author:** Copilot (TICKET-013) + Cursor PM  
**Status:** � **AUDITED** — live HF Odoo results included  
**Purpose:** Single source of truth for safe Odoo fields/domains in `ServiceGateway` (feeds TICKET-014)

---

## Connection (no secrets)

| Item | Value |
|------|--------|
| Odoo host | `jafiface-addis-crown-erp.hf.space` |
| Database | `POSTGRES_DATABASE=neondb` |
| Odoo version | `19.0` |
| Audit date | `2026-07-02` |
| Audit script | `scripts/audit_odoo_schema.mjs` |

> Agent reference: rerun this audit with `npm run audit:odoo` from `production-submodule`. For Hugging Face, use `ODOO_DB='POSTGRES_DATABASE=neondb'` and the same `ODOO_URL`, `ODOO_USER`, `ODOO_APIKEY` values used by the proxy.

---

## Core 4 models (M1 — must pass)

### product.product

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | OK | |
| name | ✅ | — | OK | |
| default_code | ✅ | — | OK | |
| list_price | ✅ | — | OK | |
| qty_available | ✅ | — | OK | |
| active | ✅ | `[('active','=',true)]` | OK | |
| uom_id | ✅ | — | OK | |

**Recommended domain (014):** `[['active', '=', true]]`

---

### sale.order

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | OK | |
| name | ✅ | — | OK | |
| partner_id | ✅ | — | OK | |
| amount_total | ✅ | — | OK | |
| state | ✅ | — | OK | |
| date_order | ✅ | — | OK | |
| origin | ✅ | — | OK | |

**Recommended domain (014):** `[]` + optional state/date facets in UI

---

### sale.order.line

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | `order_id != False` | OK | |
| product_id | ✅ | `order_id != False` | OK | |
| product_uom_qty | ✅ | `order_id != False` | OK | |
| price_unit | ✅ | `order_id != False` | OK | |

**Recommended domain (014):** `[['order_id', '!=', False]]`

---

### purchase.order

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | OK | |
| name | ✅ | — | OK | |
| partner_id | ✅ | — | OK | |
| date_order | ✅ | — | OK | |
| amount_total | ✅ | — | OK | |
| state | ✅ | — | OK | |
| origin | ✅ | — | OK | |

**Recommended domain (014):** `[]` + optional purchase-state filters

---

### purchase.order.line

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | `order_id != False` | OK | |
| product_id | ✅ | `order_id != False` | OK | |
| product_qty | ✅ | `order_id != False` | OK | |
| price_unit | ✅ | `order_id != False` | OK | |

**Recommended domain (014):** `[['order_id', '!=', False]]`

---

### res.partner

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | `customer_rank > 0 or supplier_rank > 0` | OK | |
| name | ✅ | `customer_rank > 0 or supplier_rank > 0` | OK | |
| email | ✅ | `customer_rank > 0 or supplier_rank > 0` | OK | |
| phone | ✅ | `customer_rank > 0 or supplier_rank > 0` | OK | |
| city | ✅ | `customer_rank > 0 or supplier_rank > 0` | OK | |
| customer_rank | ✅ | `customer_rank > 0 or supplier_rank > 0` | OK | |
| supplier_rank | ✅ | `customer_rank > 0 or supplier_rank > 0` | OK | |

**Recommended domain (014):** `['|', ['customer_rank','>',0], ['supplier_rank','>',0]]`

---

### account.account

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | OK | |
| name | ✅ | — | OK | |
| code | ✅ | — | OK | |
| account_type | ✅ | — | OK | |
| active | ✅ | — | OK | |
| ~~deprecated~~ | ❌ **DO NOT USE** | ❌ breaks HF | REMOVED | Use `active` instead (hotfix 0749987b) |

**Recommended domain (014):** `[['active', '=', true]]` if the field exists; otherwise `[]`

---

## Supporting models

### hr.employee

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | OK | |
| name | ✅ | — | OK | |
| job_title | ✅ | — | OK | |
| department_id | ✅ | — | OK | |
| work_email | ✅ | — | OK | |

**Recommended domain (014):** `[]` if model is optional

---

### mrp.production

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | OK | |
| name | ✅ | — | OK | |
| product_id | ✅ | — | OK | |
| product_qty | ✅ | — | OK | |
| state | ✅ | — | OK | |
| date_planned_start | ❌ | — | MISSING | Omit from fields list on HF Odoo 19 until upgraded |

**Recommended domain (014):** `[]` if MRP is optional for Wave A

---

## Domain anti-patterns (learned)

| Pattern | Model | Result on HF | Replacement |
|---------|-------|--------------|-------------|
| `('deprecated', '=', False)` | account.account | 500 Invalid field | `('active', '=', True)` or `[]` |

---

## TICKET-014 Implementation

Per TICKET-014 commit (ODOO query contract), the following are coded in `src/lib/odooQuery.js`:

### FIELD_ALLOWLIST (coded)
- `product.product`: ['id', 'name', 'default_code', 'list_price', 'qty_available', 'active', 'uom_id']
- `sale.order`: ['id', 'name', 'partner_id', 'amount_total', 'state', 'date_order', 'origin']
- `purchase.order`: ['id', 'name', 'partner_id', 'date_order', 'amount_total', 'state', 'origin']
- `account.account`: ['id', 'name', 'code', 'account_type', 'active'] (no deprecated)
- `res.partner`: ['id', 'name', 'email', 'phone', 'city', 'customer_rank', 'supplier_rank']
- `hr.employee`: ['id', 'name', 'job_title', 'department_id', 'work_email']
- `mrp.production`: ['id', 'name', 'product_id', 'product_qty', 'state'] (no date_planned_start)

### DEFAULT_DOMAINS (coded)
- `product.product`: `[['active', '=', true]]`
- `account.account`: `[['active', '=', true]]`
- `sale.order`, `purchase.order`, `res.partner`, `hr.employee`, `mrp.production`: `[]`

### buildOdooDomain filter keys (implemented)

| Model | Filter keys | Notes |
|-------|-------------|-------|
| `product.product` | `active`, `search` | Search on name + default_code (ilike) |
| `sale.order` | `state`, `dateFrom`, `dateTo`, `search` | Search on name + partner (ilike) |
| `purchase.order` | `state`, `dateFrom`, `dateTo`, `search` | Search on name + partner (ilike) |
| `account.account` | `active`, `account_type`, `search` | Search on code + name (ilike) |
| `res.partner` | `customer`, `supplier`, `search` | customer/supplier set rank > 0; search on name |
| `mrp.production` | `state` | No date filter (field missing) |
| `hr.employee` | `search` | Search on name |

### ServiceGateway.js refactored functions
- `getOdooProducts` — uses buildOdooDomain + FIELD_ALLOWLIST
- `getOdooSalesOrders` — uses buildOdooDomain + FIELD_ALLOWLIST
- `getOdooPurchaseOrders` — uses buildOdooDomain + FIELD_ALLOWLIST
- `getOdooCustomers` / `getOdooVendors` — uses buildOdooDomain with rank filters
- `getOdooEmployees` — uses buildOdooDomain + FIELD_ALLOWLIST
- `getOdooAccounts` — uses buildOdooDomain (never deprecated)
- `getOdooManufacturingOrders` — uses buildOdooDomain (never date_planned_start)

### Test coverage
- `npm run test:odoo-query` — 16/16 checks pass
- No deprecated field in any domain
- MRP date_planned_start excluded from allowlist and sanitization

---

## Future proxy models (Wave B — propose only in 013)

| Model | Wave | Ticket | In ALLOWED_MODELS today? |
|-------|------|--------|--------------------------|
| product.category | B | 021 | No |
| stock.quant | B | 021 | No |
| stock.location | B | 021 | No |
| account.move | B | 025 | No |
| account.payment | B | 026 | No |

---

## Sign-off

| Role | Date | Status |
|------|------|--------|
| Copilot audit | 2026-07-02 | [x] |
| Cursor PM verify | 2026-07-02 | [x] |
