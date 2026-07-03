# REPORT-TICKET-013

## Summary
Implemented TICKET-013 by adding a live Odoo schema audit script, an Odoo schema compatibility matrix, and a module install checklist. The audit tooling is wired to use the same environment variables as the production Odoo proxy.

## Background and purpose
This ticket was about verifying the deployed Hugging Face Odoo instance before changing the app's Odoo proxy behavior. Its purpose is to confirm which models, fields, and domain filters are safe to use in the app and to document the live compatibility status. That reduces risk for the next ticket, TICKET-014, which will implement the actual Odoo field/domain filtering logic.

## Blocks and issues resolved
- Verified the HF Odoo instance is reachable and authenticates with `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_APIKEY`.
- Confirmed core Sale, Purchase, Inventory, Partner, and Account models are accessible and compatible.
- Discovered that `mrp.production.date_planned_start` is missing on this HF instance, so MRP must be handled as optional or guarded.
- Confirmed `account.account.deprecated` is not safe to use and should be replaced by `active` in query filters.
- Documented the HF-specific `ODOO_DB` quirk: the literal string `POSTGRES_DATABASE=neondb` may be required.
- Created a repeatable audit script for future remote Odoo validation.

## Why it matters
This work turns uncertainty into a documented baseline. Instead of guessing which Odoo fields and domains are available, agents and developers now have a live-validated compatibility matrix for the Odoo proxy. That prevents future tickets from wasting effort on unsupported fields and keeps the roadmap aligned with the actual deployed Odoo schema.

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
- If future agents need to rerun the audit, they should use `scripts/audit_odoo_schema.mjs` and `npm run audit:odoo` from `production-submodule`.
- If credentials are missing, the first reference is `dev notes/history/DB_CREDENTIALS.md`. Another reference is `scripts/SEED-ODOO-README.md`.

## How to use this report
1. Open `dev notes/trophy/cursor-research/ODOO-SCHEMA-MATRIX.md` for the live model field compatibility matrix.
2. Open `dev notes/trophy/cursor-research/ODOO-MODULE-CHECKLIST.md` for installed module status.
3. To rerun the audit, use the command in the next section with valid HF or remote Odoo credentials.

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
