# REPORT-TICKET-021

## Summary
Implemented inventory read enhancements for TICKET-021, including Odoo category and stock location support for the inventory view and product detail flow.

## Files changed
- `src/pages/Inventory.jsx`
- `src/pages/ItemDetail.jsx`
- `src/components/ListFilterBar.jsx`
- `src/lib/i18n.js`

## What changed
- Added category and stock location filters to the inventory list.
- Loaded Odoo product categories and stock locations for filter dropdowns.
- Extended inventory product queries to support `categoryId` and `locationId`.
- Added category display to product list rows.
- Added category selection on the product detail/edit page.
- Added new i18n keys for category and location filtering UI.

## Notes
- The inventory list uses `getOdooProductsByLocation` when a location filter is selected, producing location-backed product results.
- Product search remains supported with SKU/text search, active status, category, and location filters.
- Product detail now fetches category options and maps `categ_id` for edit/create flows.
- No backend proxy or schema contract files were modified in this patch, as the service layer changes were added earlier.
 
## Tests executed
- Added `tests/tenant-inventory-filter.spec.mjs` to validate the inventory filter UI flow.
- Verified that an authenticated production user can access `/inventory`, see category/location filter controls, and apply filter selections without crashing.
- This smoke test confirms the new filter fields are rendered and participate in the inventory flow.
