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
| date_planned_start | ✅ | — | MISSING | Field missing in this HF Odoo instance |

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
