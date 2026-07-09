# API Component Library Reference

## Request/Response Patterns

### All APIs Follow Standard Format

**Request Headers**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Correlation-ID: <uuid>  (auto-injected by client)
```

**Success Response (200)**
```json
{
  "success": true,
  "data": { ... },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-07-09T10:00:00Z"
}
```

**Error Response (4xx/5xx)**
```json
{
  "success": false,
  "error": "Insufficient permissions to view this resource",
  "statusCode": 403,
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-07-09T10:00:00Z"
}
```

## Finance Module

### GET /api/finance/aging
- **Purpose**: Retrieve AP/AR aging analysis
- **Auth**: Bearer token (tenant context required)
- **Response**: Aging buckets (current, 30, 60, 90, over90)
- **Example**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "payable": { "current": 50000, "over30": 20000 },
      "receivable": { "current": 75000, "over60": 15000 }
    }
  }
}
```

### POST /api/finance/reconciliation
- **Purpose**: Match invoices and payments
- **Auth**: Bearer token
- **Payload**: Invoice/payment data
- **Response**: Matched and unmatched records
- **Example**:
```json
{
  "invoices": [
    { "id": "INV-001", "amount": 1000, "status": "matched" }
  ],
  "unmatched": { "payments": 2, "invoices": 1 }
}
```

## CRM Module

### GET /api/crm/pipeline
- **Purpose**: Get lead/opportunity pipeline
- **Auth**: Bearer token
- **Response**: Stages with opportunities
- **Example**:
```json
{
  "stages": [
    {
      "name": "Prospecting",
      "opportunities": [
        { "id": "OPP-001", "title": "Enterprise Deal", "value": 50000 }
      ]
    }
  ]
}
```

### GET /api/crm/activity
- **Purpose**: Retrieve activity timeline
- **Auth**: Bearer token
- **Response**: Chronological activity feed
- **Example**:
```json
{
  "activities": [
    {
      "id": "ACT-001",
      "type": "call",
      "subject": "Initial discovery call",
      "timestamp": "2026-07-09T09:00:00Z"
    }
  ]
}
```

## Warehouse Module

### POST /api/inventory/warehouse
- **Purpose**: Manage pick/pack/ship workflow
- **Auth**: Bearer token
- **Payload**: Workflow action (pick, pack, ship)
- **Response**: Updated shipment status
- **Example**:
```json
{
  "success": true,
  "data": {
    "shipmentId": "SHIP-001",
    "status": "shipped",
    "tracking": "FDX123456789"
  }
}
```

## Analytics Module

### GET /api/analytics/metrics
- **Purpose**: Calculate KPIs (revenue, cost, margin)
- **Auth**: Bearer token
- **Response**: System health metrics
- **Example**:
```json
{
  "kpis": {
    "revenue": 250000,
    "cost": 150000,
    "margin": 0.40
  },
  "health": "healthy"
}
```

### GET /api/analytics/decisions
- **Purpose**: Get reorder suggestions and budget variance
- **Auth**: Bearer token
- **Response**: Actionable recommendations
- **Example**:
```json
{
  "reorderSuggestions": [
    { "item": "SKU-001", "suggestedQty": 500 }
  ],
  "budgetVariance": 5.2
}
```

## Frontend Components

### FinanceDashboard
- **Location**: `src/pages/FinanceDashboard.jsx`
- **Props**: None (uses global context)
- **Data Source**: `GET /api/finance/aging`, `POST /api/finance/reconciliation`
- **Features**: AP/AR tables, reconciliation summary, trend charts

### CRMDashboard
- **Location**: `src/pages/CRMDashboard.jsx`
- **Data Source**: `GET /api/crm/pipeline`, `GET /api/crm/activity`
- **Features**: Kanban board, activity feed, opportunity tracking

### WarehouseDashboard
- **Location**: `src/pages/WarehouseDashboard.jsx`
- **Data Source**: `POST /api/inventory/warehouse`
- **Features**: Workflow columns (pick/pack/ship), shipment tracking

### AnalyticsDashboard
- **Location**: `src/pages/AnalyticsDashboard.jsx`
- **Data Source**: `GET /api/analytics/metrics`, `GET /api/analytics/decisions`
- **Features**: KPI cards, reorder suggestions, budget variance analysis

## Client Integration

### Initialize API Client
```javascript
import { initApiClient } from './api/client.js';

await initApiClient({
  baseURL: 'https://addis-crown.vercel.app/api',
  token: jwtToken,
  timeout: 30000
});
```

### Make API Calls
```javascript
import { getApiClient } from './api/client.js';

const client = getApiClient();

// Finance API
const aging = await client.finance.aging.get();
const reconciliation = await client.finance.reconciliation.post(data);

// CRM API
const pipeline = await client.crm.pipeline.get();
const activities = await client.crm.activity.get();

// Warehouse API
const shipment = await client.warehouse.workflow.post({ action: 'ship' });

// Analytics API
const metrics = await client.analytics.metrics.get();
const decisions = await client.analytics.decisions.get();
```

### Error Handling
```javascript
try {
  const result = await client.finance.aging.get();
} catch (error) {
  console.error('Error:', error.message);
  // Automatic retry with exponential backoff
  // Circuit breaker prevents cascading failures
}
```

## Testing Utilities

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
node ./scripts/test_ticket_054a_e2e_workflows.mjs
node ./scripts/test_ticket_054b_performance.mjs
node ./scripts/test_ticket_054c_security.mjs
node ./scripts/test_ticket_054d_monitoring.mjs
```

### Debug Mode
```bash
DEBUG=* npm test
NODE_DEBUG=* node scripts/test_ticket_054a_e2e_workflows.mjs
```

## Performance Benchmarks

### API Response Times
- Finance/Aging: 380ms avg
- Finance/Reconciliation: 520ms avg
- CRM/Pipeline: 340ms avg
- Warehouse/Workflow: 410ms avg
- Analytics/Metrics: 450ms avg

### Bundle Metrics
- Main JS: ~408MB (1.4MB gzipped)
- CSS: ~68KB (11.6KB gzipped)
- Total: ~731KB gzipped

### Lighthouse Scores
- Performance: 76+
- Accessibility: 92+
- Best Practices: 88+
- SEO: 95+

## Architecture Decision Records

### 1. Serverless vs Traditional Server
**Decision**: Use Vercel serverless functions
**Rationale**: Cost-effective for variable load, auto-scaling, built-in CDN
**Trade-off**: Limited to 12 functions on Hobby plan

### 2. Firestore vs PostgreSQL
**Decision**: Use Firestore (NoSQL)
**Rationale**: Real-time synchronization, flexible schema, Firebase integration
**Trade-off**: Less suited for complex joins; eventual consistency

### 3. Client-side Authentication
**Decision**: Store JWT token in memory + refresh token in secure cookie
**Rationale**: Balance security and UX; prevents XSS token theft
**Trade-off**: Token lost on page refresh (mitigated with refresh token)

### 4. Circuit Breaker Pattern
**Decision**: Implement per-service circuit breaker
**Rationale**: Prevent cascading failures; fast failure feedback
**Trade-off**: Additional complexity in client logic

### 5. Monorepo Structure
**Decision**: Keep API and frontend in same repository
**Rationale**: Easier to coordinate deployments; simpler CI/CD
**Trade-off**: Larger repository; tightly coupled release cycles
