# REPORT-TICKET-005

## Summary

Implemented TICKET-005 by securing the Odoo demo seeder and adding a dedicated npm seed script.

## Changes

- Hardened `scripts/seed_odoo_demo_data.mjs` to require environment variables:
  - `ODOO_URL`
  - `ODOO_DB`
  - `ODOO_USER`
  - `ODOO_APIKEY`
- Removed hardcoded Odoo URL, DB, user, and API key.
- Expanded demo seed data to include:
  - 8 partners (customers and vendors)
  - 11 products
  - 5 employees
  - 3 purchase orders, created idempotently by origin
  - 3 sales orders, created idempotently by origin
  - 2 MRP orders, created idempotently by origin
- Added `npm run seed:odoo` to `package.json`.
- Added `scripts/SEED-ODOO-README.md` with Commander run instructions and environment variable guidance.

## Verification

- Confirmed `npm run build` succeeds.
- Confirmed `scripts/seed_odoo_demo_data.mjs` fails cleanly with a descriptive message when required env vars are missing.

## Notes

- The seeder is idempotent by searching on partner name, product default code, and order origin strings.
- The script skips optional modules gracefully if `hr`, `purchase`, `sale`, or `mrp` are not installed.
- No `.env` file changes or secrets were committed.
