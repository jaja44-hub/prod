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

**Total Vercel Functions: 12**
- Finance: 2 functions (aging, reconciliation)
- CRM: 2 functions (pipeline, activity)
- Warehouse: 1 function (warehouse)
- Analytics: 2 functions (metrics, decisions)
- Connectors: 2 functions (contracts, retries)
- Utility: 3 functions (auth, health, admin)

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
# Environment Variables (set in Vercel)
NODE_ENV=production
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_API_KEY=<api-key>
VITE_FIREBASE_AUTH_DOMAIN=<auth-domain>
VITE_FIREBASE_STORAGE_BUCKET=<storage-bucket>
FIREBASE_SERVICE_ACCOUNT=<service-account-json>
```

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

### Deployment Steps
1. **Prepare Release**
   ```bash
   npm run build
   npm test
   git tag -a v1.0.0 -m "Production release"
   ```

2. **Deploy to Vercel**
   ```bash
   git push origin main --tags
   # Vercel automatically deploys on push
   ```

3. **Verify Deployment**
   - Monitor at: https://vercel.com/dashboard
   - Check logs: https://vercel.com/dashboard/logs
   - Validate production: https://addis-crown.vercel.app

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
