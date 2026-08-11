# Addis Crown v3 - Production ERP System Documentation

## Architecture Overview

### System Components

**Frontend (SPA)**
- React 18+ application built with Vite
- Deployed to Vercel CDN
- Client-side routing with React Router
- State management with Context API + custom hooks
- Authentication via Firebase JWT tokens

**Backend APIs (Serverless)**
- Node.js serverless functions on Vercel
- 12-function limit (Vercel Hobby plan)
- Modular endpoint groups: Finance, CRM, Warehouse, Analytics, Connectors
- Each module handles ~2-3 related operations
- Stateless request processing with correlation IDs

**Database (NoSQL)**
- Firestore for transactional data
- Real-time synchronization support
- Document-based schema
- Firebase Security Rules for access control

**Authentication & Authorization**
- Firebase Authentication (JWT tokens)
- Bearer token validation on all API calls
- Role-based access control (RBAC)
- Policy enforcement at module level

## API Architecture

### Module Organization

```
Finance Module (api/finance/)
├── aging.js         - AP/AR aging reports
├── reconciliation.js - Invoice/payment matching

CRM Module (api/crm/)
├── pipeline.js      - Lead/opportunity pipeline
├── activity.js      - Activity timeline management

Warehouse Module (api/inventory/)
├── warehouse.js     - Pick/pack/ship workflow

Analytics Module (api/analytics/)
├── metrics.js       - KPI calculations
├── decisions.js     - Business intelligence

Connectors Module (api/connectors/)
├── contracts.js     - Integration contracts
├── retries.js       - Resilience patterns
├── audit.js         - Event logging
```

### Function Limits

**Total Vercel Functions: 8** (verified for S6 — consolidated, under the 12-function Hobby limit)
- `api/analytics.js`   - Analytics / Command Center (metrics, decisions, engine, snapshot, health, activity)
- `api/crm.js`         - CRM (pipeline, activity, opportunities)
- `api/dashboard.js`   - Dashboard metrics
- `api/finance.js`     - Finance (accounts, journal, aging, reconciliation, budget-variance, vat-returns, paye, tax-liability)
- `api/hr.js`          - HR (employees)
- `api/inventory.js`   - Inventory / Warehouse (products, transactions, locations)
- `api/purchase.js`    - Purchase (orders, suppliers, requisitions, receipts, budget, quotes)
- `api/sales.js`       - Sales (orders, customers)

`vercel.json` declares exactly 8 rewrites (`/api/:module/:path*` → `/api/:module?path=:path*`) and 8
function entries. Each handler enforces per-handler Firebase auth (`requireAuth`, S6.2) and routes
to the correct per-module Neon pool (S6.3).

### API Response Format

All endpoints return:
```json
{
  "success": true|false,
  "data": { ... },
  "error": "error message if failed",
  "correlationId": "trace-uuid",
  "timestamp": "2026-07-09T10:00:00Z"
}
```

## Security Implementation

### CORS Configuration
- Whitelist: https://addis-crown.vercel.app, http://localhost:3000, http://localhost:5173
- Blocks: malicious domains

### Rate Limiting
- 60 requests per minute per IP
- Exponential backoff retry strategy
- Throttle response headers included

### CSRF Protection
- Token generation on each session
- Single-use token consumption
- 24-hour expiration
- Automatic token rotation

### Input Validation
- HTML entity encoding (XSS prevention)
- SQL injection pattern detection
- JWT format and expiration validation
- Request correlation ID injection

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: restricts inline scripts
- Referrer-Policy: strict-origin-when-cross-origin

## Monitoring & Observability

### Error Tracking
- Centralized error log (1000 entries)
- Error grouping by status code and service
- Correlation ID tracking for distributed tracing
- Error rate calculation (errors/hour)

### Performance Metrics
- Per-endpoint call counts and duration statistics
- Response time tracking (min/max/avg)
- Error rate calculation per endpoint
- System health status (healthy/degraded/unhealthy)

### Alerting
- Error rate threshold: 10% (configurable)
- Response time threshold: 5s average
- CPU/Memory thresholds: 80%/85%
- Alert severity levels: warning, critical

### Health Dashboard
- Total API calls (24h aggregation)
- Peak and slowest endpoints
- Error rates by endpoint
- Response time trends

## Deployment

### Prerequisites
```bash
# Environment Variables (set in Vercel) — see VERCEL_ENV_SETUP.md for the full list
NODE_ENV=production
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_API_KEY=<api-key>
VITE_FIREBASE_AUTH_DOMAIN=<auth-domain>
VITE_FIREBASE_STORAGE_BUCKET=<storage-bucket>
FIREBASE_SERVICE_ACCOUNT=<service-account-json>   # REQUIRED for API writes (S6.2 per-handler auth)

# Multi-database Neon pools (all five — S6.3)
DATABASE_URL=<main-db-url>
NEON_DATABASE_URL=<main-db-fallback>
NEON_ACCOUNTING_DB_URL=<accounting-db-url>
NEON_PROCUREMENT_DB_URL=<procurement-db-url>
NEON_ANALYTICS_DB_URL=<analytics-db-url>
NEON_TENANTFINANCE_DB_URL=<tenantfinance-db-url>
```

> **S6 (hardening) notes:** Vercel functions are consolidated to **8** entries
> (`api/{analytics,crm,dashboard,finance,hr,inventory,purchase,sales}.js`), well under the
> 12-function Hobby limit. Every handler enforces per-handler Firebase auth (`requireAuth`):
> mutations without a valid ID token → HTTP 401; anonymous GET reads fall back to the legacy
> tenant id. `FIREBASE_SERVICE_ACCOUNT` must be set in Vercel or all writes fail closed.

### Build Process
```bash
# Local development build
npm run build

# Vercel production build (runs automatically)
npm run vercel-build

# This executes:
# 1. node ./scripts/write-service-account.mjs (optional)
# 2. vite build
```

### Deployment Steps (release runbook)
1. **Pipeline gates must be green** before tag:
   ```bash
   npm run ci-check      # no banned-layer markers in production source
   npm test              # regression suite (module registry, API client, analytics engine, snapshot, auth guard)
   node --env-file=.env.local test-api.mjs   # live smoke: inventory products 200 + real rows
   npm run build         # production bundle
   ```
2. **Prepare Release**
   ```bash
   git tag -a v1.0.0 -m "Production release"
   ```
3. **Deploy to Vercel**
   ```bash
   git push origin main --tags
   # Vercel automatically deploys on push
   ```
4. **Verify Deployment**
   - Monitor at: https://vercel.com/dashboard
   - Check logs: https://vercel.com/dashboard/logs
   - Validate production: https://addis-crown.vercel.app
   - Run the post-deploy smoke (S6.5): create a real PO online and confirm finance ties out.

### Database Backup & Recovery (S6.1)
```bash
# Per-DB backup for all 5 local databases (titled, timestamped, pg_dump)
node scripts/backup-local.mjs            # all 5 DBs
node scripts/backup-local.mjs accounting  # single DB

# Restore drill — proves a backup restores (snapshot → temp DB → verify → cleanup)
node scripts/restore-drill.mjs           # default accounting
node scripts/restore-drill.mjs procurement
```
Backups are written to `backups/` (gitignored, never committed). A rollback on Vercel is a
re-deploy from the previous commit; a DB restore uses `pg_restore` from the matching `.dump`.

### Rollback Procedure

**Emergency Rollback to Previous Version**
```bash
# Automatic rollback
node scripts/rollback.mjs --auto

# Or rollback to specific tag
node scripts/rollback.mjs v0.9.0
```

**Manual Rollback**
```bash
git checkout v0.9.0
git push -f origin main
# Vercel re-deploys from previous commit
```

## Performance Optimization

### Bundle Splitting
- Main bundle: ~500KB gzipped
- Vendor chunks: ~173KB gzipped (axios, html2canvas, ajv)
- Code splitting enabled for large modules

### Lighthouse Targets
- Performance Score: >75
- First Contentful Paint: <3.0s
- Largest Contentful Paint: <4.5s
- Cumulative Layout Shift: <0.1

### API Performance
- Average response time: <500ms
- P95 response time: <2s
- Error rate: <5%
- Success rate: >95%

## Troubleshooting Guide

### Common Issues

**Issue: "CORS policy" error**
- Check: Frontend URL is in CORS whitelist
- Check: Request uses correct headers (Content-Type, Authorization)
- Solution: Add domain to `api/middleware/cors.js`

**Issue: 429 Too Many Requests**
- Cause: Rate limit exceeded (60 req/min)
- Solution: Implement exponential backoff in client
- Check: circuit breaker retry logic is active

**Issue: "Invalid JWT token"**
- Cause: Token expired or malformed
- Solution: Refresh token from Firebase Auth
- Check: Token includes "Bearer" prefix

**Issue: Slow API response**
- Cause: Large result set or slow Firestore query
- Solution: Implement pagination or caching
- Check: Query indexes are configured in Firestore

**Issue: Build fails with "ajv not found"**
- Solution: `npm install ajv`
- Cause: Missing dependency in package.json

### Logs & Debugging

**View Vercel Logs**
```bash
# Via web dashboard
https://vercel.com/dashboard/logs

# Via CLI (if installed)
vercel logs <app-name>
```

**Local Error Tracking**
```javascript
import { globalErrorTracker } from '../api/monitoring/errorHandler.js';
const summary = globalErrorTracker.getErrorSummary();
console.log(summary);
```

**Performance Metrics**
```javascript
import { globalMetricsCollector } from '../api/monitoring/metrics.js';
const health = globalMetricsCollector.getHealthMetrics();
console.log(health);
```

## Maintenance Tasks

### Weekly
- Review error logs and alerting dashboard
- Check API response times and error rates
- Verify backup procedures are working

### Monthly
- Review security logs and access patterns
- Audit database usage and index performance
- Test rollback procedures
- Update dependencies

### Quarterly
- Review and update security policies
- Assess performance against Lighthouse targets
- Evaluate bundle size trends
- Plan infrastructure upgrades

## Runbooks

### Scale Beyond 12 Functions

**Problem**: Reaching Vercel 12-function limit

**Option 1: Use Express/Next.js Server**
- Create single Next.js API route handler
- Handles all endpoints in one function
- Increased complexity, single point of failure

**Option 2: Upgrade Vercel Pro**
- Pro plan: unlimited functions
- Cost: $20/month per team member
- Recommended for production scaling

**Option 3: Multi-Region Deployment**
- Deploy to multiple Vercel projects
- Load balance with custom DNS
- Complex routing and monitoring

### Database Backup & Recovery

**Daily Backup**
```bash
# Export Firestore data
gcloud firestore export gs://backup-bucket/daily-backup

# Schedule via Cloud Scheduler
gcloud scheduler jobs create app-engine backup-firestore \
  --schedule="0 2 * * *" \
  --http-method=POST \
  --uri=https://us-central1-PROJECT_ID.cloudfunctions.net/backup
```

**Restore from Backup**
```bash
# Import Firestore data
gcloud firestore import gs://backup-bucket/daily-backup
```

### Zero-Downtime Deployment

1. **Blue-Green Deployment**
   ```bash
   # Keep current version (blue) running
   git tag -a blue-v1.0.0 -m "Current production"
   
   # Deploy new version (green) to staging
   git checkout new-feature-branch
   STAGING=true npm run vercel-build
   
   # Test staging thoroughly
   
   # Switch traffic to new version
   git push origin main
   ```

2. **Canary Deployment**
   - Deploy to 10% of users first
   - Monitor error rates and performance
   - Gradually increase to 100%
   - Uses feature flags or A/B testing

### Emergency Procedures

**Production Down - Immediate Actions**
1. Check Vercel dashboard status
2. Review recent logs for errors
3. Rollback to previous version: `node scripts/rollback.mjs --auto`
4. Notify stakeholders of status
5. Monitor recovery metrics

**Security Incident**
1. Isolate affected system
2. Revoke potentially compromised credentials
3. Review access logs (last 24h)
4. Update security policies if needed
5. Deploy security patch
6. Notify affected users

**Data Loss or Corruption**
1. Restore from latest backup
2. Verify data integrity
3. Identify root cause
4. Implement safeguards
5. Test restoration procedure

## SLA & Support

### Service Level Agreements
- Uptime Target: 99.5% (monthly)
- Response Time P95: <2s
- Error Rate: <5%
- Recovery Time Objective (RTO): <30 minutes
- Recovery Point Objective (RPO): <1 hour

### Support Escalation
1. Check documentation and FAQ
2. Review logs and error tracking
3. Contact development team
4. Escalate to platform engineering if needed

### Contact Information
- Development: dev-team@addis-crown.internal
- Operations: ops@addis-crown.internal
- Security: security@addis-crown.internal

## S7 — Production Release Operations (multi-database Neon + Firebase)

### Roles → Neon targets (canonical, resolved from `scripts/resolve-neon-urls.mjs`)
| Role | Local DB | Neon host | Env var used by `getPool()` |
|---|---|---|---|
| main | addiscrown_local | ep-patient-fog…neon.tech | `DATABASE_URL` / `NEON_DATABASE_URL` |
| accounting | addiscrown_accounting_local | ep-solitary-dew…neon.tech | `NEON_ACCOUNTING_DB_URL` / `NEONACCOUNTINGDBURL` |
| procurement | addiscrown_procurement_local | ep-red-dust…neon.tech | `NEON_PROCUREMENT_DB_URL` / `NEONPROCUREMENTDBURL` |
| analytics | addiscrown_analytics_local | ep-silent-breeze…neon.tech | `NEON_ANALYTICS_DB_URL` / `NEONANALYTICSDBURL` |
| tenantfinance | addiscrown_tenantfinance_local | ep-sparkling-voice…neon.tech | `NEON_TENANTFINANCE_DB_URL` / `NEONTENANTFINANCEDBURL` |

### Standard operations
1. **View Neon state / connectivity**
   `node scripts/resolve-neon-urls.mjs`  — probes all 5 hosts (passwords hidden)
   `node scripts/neon-state-snapshot.mjs` — table + row counts per Neon DB
2. **Pre-change backup (PG18-safe pg_dump via `/usr/lib/postgresql/18/bin/pg_dump`)**
   `node scripts/neon-backup-pre-push.mjs` → `backups/neon-pre-push/` (gitignored)
3. **Gap-fill push (local → Neon, NON-destructive)**
   `node scripts/push-local-to-neon.mjs --dry-run`  # preview
   `node scripts/push-local-to-neon.mjs`            # apply
   Strategy: Neon schemas are authoritative (richer + Odoo main). Local only fills
   missing tables/data: sales_orders, crm_opportunities, customers (when empty),
   vendor_bills, customer_invoices. Idempotent (create-if-absent + seed-if-empty).
4. **Verify app-query readiness**: confirmed all app `getPool()` queries resolve
   (tables + columns + row counts) on Neon for main/accounting/procurement/analytics.

### Firebase standardization (service-account.json, repo root)
`node scripts/audit_firebase.mjs`    # read-only audit vs expected RBAC/tenant model
`node scripts/audit_firebase.mjs --fix`  # remove orphan demo users, tenant_demo,
# align tenant_default plan. Expected state: 8 RBAC users (ceo/sales/warehouse/hr @
# .com/.et, tenant=production), users/users_extended parity, tenants {production,
# tenant_default}, packages {enterprise,pro,starter}, 5 production tenant_modules.

### Smoke after deploy (needs auth token for writes; GET reads are open)
Hit the deployed Vercel functions: `/api/dashboard/metrics`, `/api/sales/orders`,
`/api/crm/pipeline`, `/api/finance/accounts`, `/api/hr/employees`,
`/api/inventory/products`, `/api/purchase/orders`, `/api/analytics/metrics`.

### Vercel env (must be set — see VERCEL_ENV_SETUP.md)
All 5 per-DB URLs + `FIREBASE_SERVICE_ACCOUNT` (required for API writes per S6.2).
Missing any pool → that module returns `degraded`/empty on Vercel.

### S7 live-fix log (2026-07/08) — issues found by live smoke + fixes shipped
1. **`inventory/products` → `operator does not exist: integer = text`**
   Cause: Neon analytics `inventory_products.id`/`inventory_transactions.product_id`
   are INTEGER; the `LEFT JOIN` compared `stock.product_id = p.id::text` (text vs
   int). Local analytics had varchar ids so it passed there.
   Fix (commit `6087e3a5`): type-agnostic join `stock.product_id::text = p.id::text`.
2. **`inventory/locations` duplicates (30 rows = 6 × 5)**
   Cause: seed used `ON CONFLICT DO NOTHING` but no UNIQUE constraint existed on
   `inventory_locations`, so re-runs re-inserted. Fixed data (kept min id per
   `(tenant_id,name)`, deleted 24) + added `UNIQUE (tenant_id, name)`.
3. **`inventory/cycle-counts` duplicates (12 = 4 × 3)** — same seed pattern.
   Fixed data (kept 4) + `UNIQUE (tenant_id, location_id, count_date, counted_by)`.
4. **`inventory/movements` empty** — handler read `getPool('procurement')` but the
   ledger actually lives in **analytics**. Rewrote `handleMovements` to read
   analytics with **schema-adaptive** column selection (analytics transactions lack
   `unit_cost`/`reference_type`) so it works on any schema (commit `ab004e42`).

### Live verification status (prod-puce-three.vercel.app, 2026-07/08)
- **15/15 GET endpoints PASS** with real seeded data (dashboard, sales, crm,
  finance/accounts+journal, hr, inventory/products+locations+cycle-counts+movements,
  purchase/orders+requisitions, analytics/metrics+snapshot).
- **Writes protected**: POST without/invalid Firebase token → HTTP 401.
- Deploy flow: `git push origin main` → Vercel auto-deploy → Ready (~2-3 min);
  project URL `prod-puce-three.vercel.app` tracks latest Ready automatically.
