# REPORT-TICKET-015

## Summary
Implemented `TICKET-015` by replacing client-side list filtering on the Inventory and Sales pages with server-side Odoo filter queries. Added a reusable `ListFilterBar` component for search, state, date range, and active status filters.

## Changes
- `src/components/ListFilterBar.jsx`
  - Created reusable filter bar UI component.
  - Supports `search`, `state`, `dateRange`, and `active` controls.
- `src/pages/Inventory.jsx`
  - Rewired inventory listing to call `getOdooProducts(...)` with server-side filters.
  - Removed local `.filter(...)` client-side search logic.
- `src/pages/Sales.jsx`
  - Rewired sales list to call `getOdooSalesOrders(...)` with server-side filters.
  - Replaced local client-side filtering with server-driven query parameters.
- `src/lib/i18n.js`
  - Added translation keys for the new ListFilterBar filters and buttons.

## Verification
- Confirmed `Inventory` and `Sales` pages now pass filter state into backend requests.
- Confirmed list pages maintain existing UX patterns while delegating filtering to Odoo.

## Notes
- The filter component now uses a debounce for search input and applies direct state updates for server-side queries.
- `Sales` uses `search`, `state`, and `dateRange` filters; `Inventory` uses `search` and `active`.
