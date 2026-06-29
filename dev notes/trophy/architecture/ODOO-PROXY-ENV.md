# Odoo Proxy Environment Variables

This file documents the environment variables required for the secured Odoo proxy.

| Variable | Required | Purpose |
|----------|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Yes (prod) | Firebase Admin service account JSON or base64-encoded JSON used by `api/lib/firebaseAdmin.js` to verify ID tokens. |
| `ODOO_PROXY_SKIP_AUTH` | Dev only | Set to `true` to skip Firebase token verification locally. Never set this in production. |
| `ODOO_URL` | Yes | Base URL of the Odoo server, e.g. `https://odoo.example.com`. |
| `ODOO_DB` | Yes | Odoo database name used by the proxy. |
| `ODOO_USER` | Yes | Odoo user login used for API key authentication. |
| `ODOO_APIKEY` | Yes | Odoo API key used by the server-side proxy; must never be exposed to the browser. |

## Notes

- The proxy now requires a valid `Authorization: Bearer <firebase-id-token>` header on every request unless `ODOO_PROXY_SKIP_AUTH=true`.
- `FIREBASE_SERVICE_ACCOUNT` should be provided as raw JSON or base64-encoded JSON. The build script already supports writing the service account from this variable.
- `ODOO_PROXY_SKIP_AUTH` is only intended for local developer testing and may be used when the Firebase service account is unavailable.
