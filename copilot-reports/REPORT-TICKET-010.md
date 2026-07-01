# REPORT-TICKET-010

## Summary
Implemented TICKET-010 by replacing the dashboard placeholder with two Odoo-powered widgets:
- Recent sales orders widget using `getOdooSalesOrders(5)`
- Low stock alert widget using `getOdooProducts` and client-side qty filtering under 10

## Files changed
- `src/pages/Dashboard.jsx`
- `src/components/RecentSalesOrdersWidget.jsx`
- `src/components/LowStockAlertWidget.jsx`
- `src/lib/i18n.js`

## Verification
- Verified new dashboard widgets render below `ErpSummaryPanel`
- Verified both widgets auth-gate Odoo fetches via `useAuth()`
- Added English and Amharic `useLang` keys for new widget copy
- Verified build readiness for production

## Notes
- The previous dashboard placeholder was removed and replaced with a responsive 2-column widget grid.
- Error and retry handling mirror patterns from existing Odoo page fetches.
