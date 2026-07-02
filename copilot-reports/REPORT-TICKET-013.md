# REPORT-TICKET-013

## Summary
Implemented TICKET-013 by adding a live Odoo schema audit script, an Odoo schema compatibility matrix, and a module install checklist. The audit tooling is wired to use the same environment variables as the production Odoo proxy.

## Files changed
- `scripts/audit_odoo_schema.mjs`
- `package.json`
- `dev notes/trophy/cursor-research/ODOO-SCHEMA-MATRIX.md`
- `dev notes/trophy/cursor-research/ODOO-MODULE-CHECKLIST.md`
- `copilot-reports/REPORT-TICKET-013.md`

## What was done
- Added `scripts/audit_odoo_schema.mjs` to inspect Odoo models, fields, and domains via XML-RPC.
- Added `audit:odoo` npm script to `package.json`.
- Populated the schema matrix template with the core 4 field sets, account deprecation guidance, domain recommendations, and Wave B proxy model proposals.
- Created the Odoo module install checklist for core 4 + MRP.

## Verification
- Verified `audit:odoo` is registered in `package.json`.
- Verified the audit script imports the same Odoo auth flow (`authenticateOdooDb`) used by `api/odooProxy.js`.
- Verified `npm run build` passes after adding the script.
- Executed the audit against the HF-hosted Odoo instance.
- Confirmed all core 4 model fields are present and safe, except `mrp.production.date_planned_start` is missing.

## Live audit results
- `product.product`, `sale.order`, `sale.order.line`, `purchase.order`, `purchase.order.line`, `res.partner`, `account.account`, and `hr.employee` are all INSTALLED and field-compatible.
- `mrp.production` is installed, but `date_planned_start` is missing in this HF instance.

## Notes
- The audit uses the same HF Odoo credentials pattern as the production proxy: `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_APIKEY`.
- `dev notes/trophy/cursor-research/ODOO-SCHEMA-MATRIX.md` and `ODOO-MODULE-CHECKLIST.md` now contain the audited statuses.

## Next step
If you want a second validation run with updated HF credentials, use:

```bash
cd /home/ja/Documents/addis-crown-v3/production-submodule
ODOO_URL='https://jafiface-addis-crown-erp.hf.space' \
ODOO_DB='POSTGRES_DATABASE=neondb' \
ODOO_USER='admin' \
ODOO_APIKEY='YOUR_API_KEY' \
npm run audit:odoo
```
