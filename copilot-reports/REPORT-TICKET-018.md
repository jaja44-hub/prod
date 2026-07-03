# REPORT - TICKET-018: Firestore tenant schema with packages and Odoo domain wire

Summary

- Implemented Firestore-backed tenant SaaS schema documentation (`TENANT-SAAS-SCHEMA.md`).
- Added seed script `scripts/seed_tenant_schema.mjs` to populate `packages`, `tenants/production`, and `tenant_modules` (idempotent).
- Extended `api/lib/tenantOdooDomain.js` to prefer Firestore `tenants/{id}.odooDomain` with a short in-memory cache and graceful fallback to `TENANT_ODOO_DOMAIN_MAP` env var.
- Added `api/lib/tenantFirestore.js` helper and updated `firestore.rules` to include `packages` and `tenant_modules` security.
- Added `seed:tenants` npm script.

Files added/modified

- Added: `dev notes/trophy/architecture/TENANT-SAAS-SCHEMA.md`
- Added: `scripts/seed_tenant_schema.mjs`
- Added: `api/lib/tenantFirestore.js`
- Modified: `api/lib/tenantOdooDomain.js` (Firestore lookup + cache)
- Modified: `api/odooProxy.js` (already using async lookup)
- Modified: `firestore.rules` (packages + tenant_modules rules)
- Modified: `package.json` (add `seed:tenants`)
- Added: `copilot-reports/REPORT-TICKET-018.md` (this file)

Verification performed

- `npm run test:tenant-domain` — passes (env fallback tests)
- `npm run test:odoo-query` — passes
- `npm run build` — passes
- `scripts/seed_tenant_schema.mjs` ran successfully using local `service-account.json` and upserted the following documents:
  - packages: `enterprise`, `pro`, `starter`
  - tenant: `production` (status: `active`, planTier: 1, packageId: `enterprise`, odooDomain: `{}`)
  - tenant_modules (ids): `production_dashboard`, `production_inventory`, `production_sales`, `production_purchase`, `production_finance`

Post-seed checks

- Re-ran `npm run test:tenant-domain` after seeding — all tests passed.
- Verified proxy falls back to env map if Firestore is unavailable (covered by tests and code path).

Notes

- Firestore reads are cached in-memory for 60s to limit reads on hot paths; this can be tuned later.
- The allowlist remains restricted to `company_id` per ticket constraints.
- If Firestore is unavailable or misconfigured, the proxy falls back to `TENANT_ODOO_DOMAIN_MAP` env mapping.

Next steps

- (TICKET-019) Implement `moduleRegistry` to reconcile package modules and `tenant_modules`.
- Optionally expose a read-only client helper `src/lib/tenantSchema.js` for UI usage.

Commit

- `TICKET-018: Firestore tenant schema with packages and Odoo domain wire`
