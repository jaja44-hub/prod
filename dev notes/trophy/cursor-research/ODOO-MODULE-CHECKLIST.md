# ODOO Module Install Checklist — Core 4 + MRP

**Author:** Copilot (TICKET-013)
**Status:** 🟡 Pending audit run

| App | Required for | Verify method | Status | Notes |
|-----|--------------|---------------|--------|-------|
| stock | product.qty_available, inventory | `product.product.fields_get` / `search_read` | INSTALLED | Verified via audit |
| sale | sale.order, sale.order.line | `sale.order.fields_get` / `search_read` | INSTALLED | Verified via audit |
| purchase | purchase.order, purchase.order.line | `purchase.order.fields_get` / `search_read` | INSTALLED | Verified via audit |
| account | account.account | `account.account.fields_get` / `search_read` | INSTALLED | Verified via audit |
| mrp | mrp.production | `mrp.production.fields_get` / `search_read` | INSTALLED | Verified via audit; `date_planned_start` is missing |

## Notes
- This checklist is intended to validate whether the deployed HF Odoo instance has the correct server modules installed for core 4 and optional MRP.
- Use `scripts/audit_odoo_schema.mjs` with a valid HF Odoo connection.
- If any model is missing, document the HF installation gap and do not change the proxy allowlist in this ticket.
