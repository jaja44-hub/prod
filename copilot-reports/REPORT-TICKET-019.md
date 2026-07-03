# REPORT - TICKET-019: Module registry and tenant_modules policy integration

Summary

- Added a central `src/lib/moduleRegistry.js` to define module metadata, route mappings, and path-to-module resolution.
- Added `src/lib/tenantSchema.js` to fetch enabled tenant modules and package metadata from Firestore.
- Extended `src/lib/policy.js` so `canViewModule` honors Firestore tenant module entitlement when available and falls back to existing `planTier` defaults.
- Updated `src/context/AuthContext.jsx` to load `enabledModules` for the current tenant after profile initialization without blocking login.
- Updated `src/partials/Sidebar.jsx` and `src/components/RoleGuard.jsx` to use registry-driven module resolution plus tenant entitlement state.
- Added `scripts/test_module_registry.mjs` and `npm run test:module-registry` for self-checks.
- Documented tenant entitlement flow in `dev notes/trophy/architecture/DATA-PLANE-CONTRACT.md`.

Files added/modified

- Added: `src/lib/moduleRegistry.js`
- Added: `src/lib/tenantSchema.js`
- Added: `scripts/test_module_registry.mjs`
- Modified: `src/context/AuthContext.jsx`
- Modified: `src/lib/policy.js`
- Modified: `src/partials/Sidebar.jsx`
- Modified: `src/components/RoleGuard.jsx`
- Modified: `package.json`
- Modified: `dev notes/trophy/architecture/DATA-PLANE-CONTRACT.md`

Verification performed

- `npm run test:module-registry` — passed
- `npm run test:tenant-domain` — passed
- `npm run test:odoo-query` — passed
- `npm run build` — passed

Notes

- Tenant entitlement now flows from Firestore `tenant_modules` into the client auth context.
- The client supports fallback to `policy.js` plan-tier defaults when Firestore reads are unavailable or return empty.
- `moduleRegistry.js` centralizes module metadata and route prefix mapping, removing duplicate sidebar/guard path mapping.

Commit

- `TICKET-019: Module registry and tenant_modules policy integration`
