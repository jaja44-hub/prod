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


Post-commit verification details

- Commit: `56cf4ef6` pushed to `origin/main` (contains registry, tenantSchema, auth and sidebar/guard wiring)
- `git status` before finalizing: working tree clean after staging changes
- Tests run during CI-local: module-registry, tenant-domain, odoo-query all returned green; local `vite build` completed successfully (warnings only about large chunks).

Notes
`TICKET-019: Module registry and tenant_modules policy integration` (commit `56cf4ef6`)

Additional notes:

- `enabledModules` is exposed on `useAuth()` for pages and guards to consume. If Firestore is unreachable the client falls back to `planTier` defaults.
- No changes were made to server-side data plane or Odoo proxy in this ticket.

Commit

- `TICKET-019: Module registry and tenant_modules policy integration`
