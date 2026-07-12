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
- `NEON_DATABASE_URL` - PostgreSQL connection string for Neon DB (e.g., `postgres://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require`)

### Firebase Configuration
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin service account JSON (base64-encoded or raw JSON)
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
