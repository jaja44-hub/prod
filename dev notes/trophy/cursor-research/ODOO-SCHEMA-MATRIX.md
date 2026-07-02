# ODOO Schema Matrix — HF Compatibility

**Author:** Copilot (TICKET-013) + Cursor PM  
**Status:** 🟡 **TEMPLATE** — Copilot fills after `npm run audit:odoo`  
**Purpose:** Single source of truth for safe Odoo fields/domains in `ServiceGateway` (feeds TICKET-014)

---

## Connection (no secrets)

| Item | Value |
|------|--------|
| Odoo host | _fill from ODOO_URL hostname_ |
| Database | _fill from ODOO_DB_ |
| Odoo version | _from /xmlrpc/2/common version or fields metadata_ |
| Audit date | _YYYY-MM-DD_ |
| Audit script | `scripts/audit_odoo_schema.mjs` |

---

## Core 4 models (M1 — must pass)

### product.product

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | PENDING | |
| name | ✅ | — | PENDING | |
| default_code | ✅ | — | PENDING | |
| list_price | ✅ | — | PENDING | |
| qty_available | ✅ | — | PENDING | |
| active | ✅ | `[('active','=',true)]` | PENDING | |
| uom_id | ✅ | — | PENDING | |

**Recommended domain (014):** `[['active', '=', true]]`

---

### sale.order

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | PENDING | |
| name | ✅ | — | PENDING | |
| partner_id | ✅ | — | PENDING | |
| amount_total | ✅ | — | PENDING | |
| state | ✅ | — | PENDING | |
| date_order | ✅ | — | PENDING | |
| origin | ✅ | — | PENDING | |

**Recommended domain (014):** `[]` + optional state/date facets in UI

---

### sale.order.line

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | `order_id != False` | PENDING | |
| product_id | ✅ | `order_id != False` | PENDING | |
| product_uom_qty | ✅ | `order_id != False` | PENDING | |
| price_unit | ✅ | `order_id != False` | PENDING | |

**Recommended domain (014):** `[['order_id', '!=', False]]`

---

### purchase.order

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | PENDING | |
| name | ✅ | — | PENDING | |
| partner_id | ✅ | — | PENDING | |
| date_order | ✅ | — | PENDING | |
| amount_total | ✅ | — | PENDING | |
| state | ✅ | — | PENDING | |
| origin | ✅ | — | PENDING | |

**Recommended domain (014):** `[]` + optional purchase-state filters

---

### purchase.order.line

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | `order_id != False` | PENDING | |
| product_id | ✅ | `order_id != False` | PENDING | |
| product_qty | ✅ | `order_id != False` | PENDING | |
| price_unit | ✅ | `order_id != False` | PENDING | |

**Recommended domain (014):** `[['order_id', '!=', False]]`

---

### res.partner

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | `customer_rank > 0 or supplier_rank > 0` | PENDING | |
| name | ✅ | `customer_rank > 0 or supplier_rank > 0` | PENDING | |
| email | ✅ | `customer_rank > 0 or supplier_rank > 0` | PENDING | |
| phone | ✅ | `customer_rank > 0 or supplier_rank > 0` | PENDING | |
| city | ✅ | `customer_rank > 0 or supplier_rank > 0` | PENDING | |
| customer_rank | ✅ | `customer_rank > 0 or supplier_rank > 0` | PENDING | |
| supplier_rank | ✅ | `customer_rank > 0 or supplier_rank > 0` | PENDING | |

**Recommended domain (014):** `['|', ['customer_rank','>',0], ['supplier_rank','>',0]]`

---

### account.account

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | PENDING | |
| name | ✅ | — | PENDING | |
| code | ✅ | — | PENDING | |
| account_type | ✅ | — | PENDING | |
| active | ✅ | — | PENDING | |
| ~~deprecated~~ | ❌ **DO NOT USE** | ❌ breaks HF | REMOVED | Use `active` instead (hotfix 0749987b) |

**Recommended domain (014):** `[['active', '=', true]]` if the field exists; otherwise `[]`

---

## Supporting models

### hr.employee

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | PENDING | |
| name | ✅ | — | PENDING | |
| job_title | ✅ | — | PENDING | |
| department_id | ✅ | — | PENDING | |
| work_email | ✅ | — | PENDING | |

**Recommended domain (014):** `[]` if model is optional

---

### mrp.production

| Field | search_read | domain filter | Status | Notes |
|-------|-------------|---------------|--------|-------|
| id | ✅ | — | PENDING | |
| name | ✅ | — | PENDING | |
| product_id | ✅ | — | PENDING | |
| product_qty | ✅ | — | PENDING | |
| state | ✅ | — | PENDING | |
| date_planned_start | ✅ | — | PENDING | |

**Recommended domain (014):** `[]` if MRP is optional for Wave A

---

## Domain anti-patterns (learned)

| Pattern | Model | Result on HF | Replacement |
|---------|-------|--------------|-------------|
| `('deprecated', '=', False)` | account.account | 500 Invalid field | `('active', '=', True)` or `[]` |

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
| Copilot audit | | [ ] |
| Cursor PM verify | | [ ] |

---

## Supporting models

### sale.order.line / purchase.order.line / res.partner / hr.employee / mrp.production

_Copilot: duplicate table format per model from audit script output_

---

## Domain anti-patterns (learned)

| Pattern | Model | Result on HF | Replacement |
|---------|-------|--------------|-------------|
| `('deprecated', '=', False)` | account.account | 500 Invalid field | `('active', '=', True)` or `[]` |

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
| Copilot audit | | [ ] |
| Cursor PM verify | | [ ] |
