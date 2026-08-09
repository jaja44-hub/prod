# Vercel Environment Variables Setup

## Required Environment Variables for Odoo Integration

The following environment variables must be configured in Vercel for the Odoo proxy integration to work:

### Odoo Proxy Configuration
- `ODOO_PROXY_URL` - URL of the Odoo proxy endpoint (e.g., `https://your-domain.com/api/odooProxy` or `/api/odooProxy` for same-deployment)
- `ODOO_URL` - Base URL of the Odoo instance (e.g., `https://odoo.example.com`)
- `ODOO_DB` - Odoo database name (e.g., `production`)
- `ODOO_USER` - Odoo API user (e.g., `api_user`)
- `ODOO_APIKEY` - Odoo API key for authentication
- `ODOO_PROXY_SKIP_AUTH` - Set to `true` for local development, `false` for production

### Neon DB Configuration
Multi-database architecture — **all five** pools must be configured in Vercel for production
(see `api/lib/shared.js` → `getPool()`). Missing any one causes that module to return
`degraded`/empty on Vercel:

- `DATABASE_URL` - Main DB connection string (e.g., `postgres://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require`)
- `NEON_DATABASE_URL` - Alternate fallback for the Main DB (used by `getPool()` default)
- `NEON_ACCOUNTING_DB_URL` - Accounting DB (accounts, journal_entries, employees, customer_invoices, vendor_bills, tax_transactions)
- `NEON_PROCUREMENT_DB_URL` - Procurement DB (purchase_orders, suppliers, warehouse_receipts, budgets, vat_returns)
- `NEON_ANALYTICS_DB_URL` - Analytics DB (sales_analytics, warehouse_metrics, inventory_products, inventory_transactions)
- `NEON_TENANTFINANCE_DB_URL` - Tenant Finance DB (subscriptions / cash-flow forecast)

Legacy aliases (`NEONACCOUNTINGDBURL`, `NEONPROCUREMENTDBURL`, `NEONANALYTICSDBURL`, `NEONTENANTFINANCEDBURL`)
are also accepted as fallbacks.

### Firebase Configuration
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin service account JSON (base64-encoded or raw JSON).
  **Required for production API writes (S6.2):** every `/api/:module` handler now verifies the caller's
  Firebase ID token via `requireAuth` — mutations (POST/PUT/PATCH/DELETE) without a valid token are
  rejected with HTTP 401. Anonymous GET reads resolve the legacy tenant id for backward compatibility.
- `VITE_FIREBASE_API_KEY` - Firebase client API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

### GitHub App Configuration
- `GITHUB_APP_ID` - GitHub App ID
- `GITHUB_INSTALLATION_ID` - GitHub App Installation ID
- `GITHUB_APP_PRIVATE_KEY` - GitHub App private key (PEM format)

### Internal Configuration
- `INTERNAL_API_TOKEN` - Internal API token for service-to-service communication (optional, for Odoo proxy auth)

## Setup Instructions

1. Go to Vercel project settings → Environment Variables
2. Add each variable with its corresponding value
3. Redeploy the application after adding variables

## Verification

After deployment, verify the integration by checking:
- Warehouse API returns real Odoo data (not seed data)
- Finance API returns real Odoo invoices (not seed data)
- Analytics engine computes from real data
- Console logs show successful Odoo proxy calls
