# TICKET-051 Analytics & Decision-Support Sprint

**Date**: 2026-07-09  
**Status**: Planning

## Overview
TICKET-051 breaks down the analytics and decision-support module for Phase 6 deployment under strict Vercel Hobby function limit (max 12 functions).

## Breakdown

### TICKET-051a: Analytics Module Scaffolding
- Expose revenue/cost/margin dashboards
- Build time-series aggregation helpers
- Scaffold financial KPI computations
- Test helper functions
- Report artifact

### TICKET-051b: Decision-Support Builder APIs
- Add predictive reorder suggestions
- Build variance analysis endpoints
- Scaffold budget vs actual comparison
- Test decision logic
- Report artifact

### TICKET-051c: Analytics Reporting Integration
- Wire analytics module endpoints to UI layer
- Add caching strategy for aggregations
- Scaffold batch reporting exports
- Test reporting endpoints
- Report artifact

### TICKET-051d: Analytics/Decision-Support Tests & Reports
- Combined integrated test suite
- Cross-module validation
- Full Phase 6 completion report
- Report artifact

## Vercel Deployment Architecture Rule (PERMANENT)

**RULE**: All serverless functions must be grouped within a **hard limit of 12 entry points** on Vercel Hobby. This is non-negotiable per plan constraints.

**Grouping Strategy**:
1. **Native repo modules** (production-submodule): All Phase 6 APIs consolidated into 6-7 grouped entry points
2. **External/Odoo integrations**: Treated as independent functions (not grouped)
3. **Future additions**: Must follow the same grouping discipline
4. **Audit process**: Before adding any new endpoint, verify it fits within the 12-function ceiling

**Current allocation** (post-refactor):
- 1x Odoo Proxy (single entry point, routes all Odoo traffic)
- 1x Grouped Finance endpoint (aging + reconciliation)
- 1x Grouped CRM endpoint (pipeline + activity)
- 1x Grouped Warehouse endpoint (movements + reorder + warehouse)
- 1x Keep-Alive cron
- Remaining slots: reserved for upcoming additions and external integrations

---

## Implementation Order
1. Plan TICKET-051a scaffolding
2. Build analytics helpers and tests
3. Commit, validate local build
4. Plan TICKET-051b
5. Build decision-support logic and tests
6. Commit, validate local build
7. Combine into TICKET-051c/d with integrated test suite
8. Final commit to remote, verify Vercel deployment
