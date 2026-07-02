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

## Known limitation
- The audit script requires live Odoo credentials via environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_APIKEY`.
- No Odoo audit run was executed in this environment because those variables were not present.

## Next step
Run the audit locally with:

```bash
cd production-submodule
ODOO_URL=... ODOO_DB=... ODOO_USER=... ODOO_APIKEY=... npm run audit:odoo
```

Update `dev notes/trophy/cursor-research/ODOO-SCHEMA-MATRIX.md` and `ODOO-MODULE-CHECKLIST.md` with live results after the run.
