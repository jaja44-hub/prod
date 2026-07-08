# REPORT: TICKET-049 - Inventory Depth Scaffold

Date: 2026-07-09

Summary:
- Created tenant-scoped inventory endpoints:
  - `api/inventory/movements.js` — `GET` returns a stubbed movement history for a tenant.
  - `api/inventory/reorder-suggestion.js` — `POST` computes a simple reorder suggestion based on stock, reorder point, and MOQ.
- Added unit test script `scripts/test_ticket_049_inventory.mjs` which validates movement retrieval and reorder suggestion logic.

Validation:
- Ran `node ./scripts/test_ticket_049_inventory.mjs` — tests passed locally.

Next steps:
- Wire the endpoints into the front-end flows for Inventory detail pages.
- Replace stubs with Odoo-backed reads (using `api/odooProxy.js`) while applying tenant domain filters.
- Add E2E tests that hit the actual API routes via the dev server or test harness.

Files added:
- api/inventory/movements.js
- api/inventory/reorder-suggestion.js
- scripts/test_ticket_049_inventory.mjs
- copilot-reports/REPORT-TICKET-049.md
