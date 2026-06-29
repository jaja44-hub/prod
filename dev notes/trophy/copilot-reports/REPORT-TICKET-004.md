TICKET-004 — REPORT

Summary
- Added `api/lib/firebaseAdmin.js` to initialize Firebase Admin from `FIREBASE_SERVICE_ACCOUNT`.
- Secured `api/odooProxy.js` to require Firebase ID tokens for POST requests unless `ODOO_PROXY_SKIP_AUTH=true`.
- Added a model allowlist to the Odoo proxy for v1 request whitelisting.
- Updated `src/lib/odooClient.js` to send the Firebase `Authorization: Bearer` header on proxy calls.
- Documented proxy environment variables in `dev notes/trophy/architecture/ODOO-PROXY-ENV.md`.
- Build verification completed successfully with `npm run build`.

Details
- Proxy auth flow now rejects requests without a valid bearer token with `401 Unauthorized`.
- If `kwargs.tenantId` is provided, it must match the token's `tenantId` or the request returns `403`.
- `ODOO_PROXY_SKIP_AUTH=true` is supported for local dev only and emits a one-time warning.
- A `TODO B8 phase 2` comment was added to prepare for tenant domain filtering in future work.

Verification
- `npm run build` passed successfully.
- `api/odooProxy.js` now imports `verifyBearerToken` and `logSkipAuthWarning`.
- `src/lib/odooClient.js` now forwards auth headers when the user is logged in.

Commit
- `TICKET-004: secure Odoo proxy with Firebase token verification`
