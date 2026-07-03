# REPORT-TICKET-020

## Summary
Implemented TICKET-020 by introducing a centralized event bus for Odoo write operations and removing duplicate page-level audit writes.

## What changed
- Added `src/lib/eventBus.js`:
  - `buildOdooWriteEvent()` standardizes Odoo write event payloads.
  - `emitModuleEvent()` writes canonical events to `module_events` and duplicate audit records to `audit_log`.
  - `onModuleEvent()` provides a subscriber stub with unsubscribe support.
- Extended `src/lib/moduleRegistry.js` with `getModuleIdForOdooModel()` for Odoo model → module ID resolution.
- Updated `src/services/ServiceGateway.js`:
  - Odoo write operations now optionally accept `{ actorUid }`.
  - `createOdooProduct()`, `updateOdooProduct()`, `createOdooSalesOrder()`, and `createOdooPurchaseOrder()` emit module events after successful Odoo writes.
  - Event bus failures are now non-blocking for user-facing flows.
- Removed page-level `logAuditEvent()` calls from:
  - `src/pages/ItemDetail.jsx`
  - `src/pages/SalesOrderDetail.jsx`
  - `src/pages/PurchaseOrderDetail.jsx`
- Hotfixed `src/components/RoleGuard.jsx` to use `getModuleIdForPath()` from `moduleRegistry` instead of a local path helper.
- Added Firestore security rules for `audit_log` and `module_events` in `firestore.rules`.
- Added `scripts/test_event_bus.mjs` and `package.json` script `test:event-bus` for event bus validations.
- Made `src/config/firebase.js` Node-compatible for direct test execution.

## Verification
- `npm run test:event-bus` — passed
- `npm run test:module-registry` — passed
- `npm run build` — passed

## Notes
- `module_events` is now protected by Firestore rules and can be safely written by authenticated tenant users.
- `audit_log` is also explicitly covered by rules, matching existing event bus write behavior.
- Event emission is centralized in the service layer, removing duplicate responsibility from UI pages.
