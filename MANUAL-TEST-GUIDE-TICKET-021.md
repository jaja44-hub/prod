# TICKET-021: Manual Test Guide for Inventory Filters

## Overview
This guide provides step-by-step instructions for manually testing the inventory filter functionality on the Vercel preview build.

## Prerequisites
- Access to the Vercel production build at: `https://addis-crown-v3.vercel.app`
- Valid production tenant credentials (CEO role recommended)
- Browser DevTools available for console inspection

## Test Environment
- **Application**: Addis Crown v3 Production Build (Vercel)
- **Feature**: Inventory view with category and location filters
- **Module**: production-submodule

---

## Test Case 1: Verify Filter UI Renders Correctly

### Steps:
1. Navigate to the Vercel production build
2. Log in with a CEO or Warehouse Head account
3. Go to **Operations → Inventory** (or navigate to `/inventory`)
4. Observe the filter bar section below the page title

### Expected Result:
- Filter bar displays 4 filter controls in a grid layout:
  1. **Search** input field (text)
  2. **Category** select dropdown (with "All categories" default)
  3. **Location** select dropdown (with "All locations" default)
  4. **Active only** checkbox (checked by default)
- Two action buttons visible:
  - **Apply filters** button (blue/violet)
  - **Clear filters** button (outline/secondary)
- The filter bar has a light background with subtle border

### Failure Indicators:
- Filter fields are missing or not visible
- Dropdowns show no options
- Buttons are disabled or non-functional

---

## Test Case 2: Verify Category Filter Works

### Prerequisites:
- Your Odoo backend has at least 2 product categories with products

### Steps:
1. From the inventory list, observe the category dropdown
2. Click the **Category** dropdown
3. Select a specific category (e.g., "Electronics", "Office Supplies", etc.)
4. Click the **Apply filters** button
5. Observe the product list below

### Expected Result:
- Product list filters to show only items in the selected category
- The inventory count may decrease
- Category name remains selected in the dropdown
- Browser console shows no red errors
- Products display with their category information in rows

### Failure Indicators:
- Product list doesn't change after applying filter
- Error message appears in the filter bar
- Console shows JavaScript errors (e.g., 404, undefined references)
- Dropdown closes without applying the filter

---

## Test Case 3: Verify Location Filter Works

### Prerequisites:
- Your Odoo backend has multiple stock locations with products

### Steps:
1. From the inventory list, click the **Location** dropdown
2. Select a specific location (e.g., "Stock", "Warehouse A", etc.)
3. Click the **Apply filters** button
4. Observe the product list and quantities

### Expected Result:
- Product list updates to show inventory at the selected location
- Stock quantities reflect the selected location
- Location name remains selected in the dropdown
- Products may differ based on location availability
- No errors in browser console

### Failure Indicators:
- Location filter has no effect on product list
- Quantities don't change for the selected location
- Console errors mentioning location API calls
- Page becomes unresponsive

---

## Test Case 4: Verify Combined Filters

### Steps:
1. Select a **Category** (e.g., "Electronics")
2. Select a **Location** (e.g., "Warehouse B")
3. Click **Apply filters**
4. Observe the filtered product list

### Expected Result:
- Product list shows only items that match BOTH category AND location
- Results are a subset of either individual filter
- Both filter selections remain visible
- Product count reduces based on combined constraints

### Failure Indicators:
- Filters don't combine (only one filter applies)
- More products shown than expected
- Conflicting results (location filter overrides category or vice versa)

---

## Test Case 5: Verify Search Filter Works

### Steps:
1. Click the **Search** input field
2. Type a product name or SKU (e.g., "ELECT001" or "Laptop")
3. Wait ~400ms for the search to auto-apply
4. Observe the product list filters in real-time

### Expected Result:
- Product list filters as you type (debounced search)
- Only products matching the search term appear
- Search works with both product names and SKU codes
- List updates without clicking a button

### Failure Indicators:
- Search has no effect
- Results show unrelated products
- Console errors about search API
- Search field is disabled or read-only

---

## Test Case 6: Verify Active Status Filter

### Steps:
1. Ensure the **Active only** checkbox is checked
2. Note the products displayed
3. Uncheck the **Active only** checkbox
4. Click **Apply filters**
5. Compare the product lists

### Expected Result:
- With "Active only" checked: Shows only active products
- With "Active only" unchecked: Shows both active and inactive products
- Product count increases when unchecked (if inactive products exist)
- Checkbox state persists when filters are applied

### Failure Indicators:
- Checkbox has no effect on product list
- Inactive products always hidden or always shown
- Clicking the checkbox breaks the filter bar

---

## Test Case 7: Verify Clear Filters Button

### Steps:
1. Apply multiple filters (category, location, search)
2. Click the **Clear filters** button
3. Observe the filter controls and product list

### Expected Result:
- All filter selections reset:
  - Search field becomes empty
  - Category dropdown returns to "All categories"
  - Location dropdown returns to "All locations"
  - Active only checkbox returns to checked state
- Product list displays all products (or default set)
- Button is responsive and fast

### Failure Indicators:
- Some filters don't clear
- Clear button doesn't work
- Product list doesn't update after clearing
- Partial reset occurs

---

## Test Case 8: Add Product Workflow with Filters Active

### Steps:
1. Apply a category filter
2. Click the **Add Item** button
3. On the product detail page, verify the category field is visible
4. Fill in the form to create a new product
5. Return to inventory and verify the new product appears in the filtered list

### Expected Result:
- Add Item button is accessible from filtered view
- Product detail page shows a category selection field
- New product can be created and assigned to a category
- New product appears in the inventory list
- Filter state is preserved or can be reapplied

### Failure Indicators:
- Add Item button is missing or disabled
- Category field missing on detail page
- Product creation fails
- New product doesn't appear in inventory

---

## Test Case 9: Edit Existing Product with Filters

### Steps:
1. From the filtered inventory list, click on an existing product row
2. On the detail page, verify the category field is populated
3. Optionally change the category
4. Save the product
5. Return to inventory and verify the product still appears (or in new category if changed)

### Expected Result:
- Product detail page loads with category pre-populated
- Category dropdown is functional and contains all categories
- Product can be edited and saved
- Changes persist in the inventory list
- Filter state is preserved

### Failure Indicators:
- Category field is empty or missing
- Product edit fails
- Changes don't persist
- Editing a product breaks the filter state

---

## Test Case 10: Performance and Responsiveness

### Steps:
1. Apply multiple filters in succession
2. Switch between different category/location combinations rapidly
3. Perform a search while filters are active
4. Clear and reapply filters multiple times
5. Monitor browser performance (F12 → Performance tab)

### Expected Result:
- Filters apply within 1-2 seconds
- No noticeable lag or freezing
- UI remains responsive during filter operations
- Network requests complete successfully
- Memory usage is stable (no significant growth)

### Failure Indicators:
- Slow response (>3 seconds) to filter changes
- Page becomes unresponsive or hangs
- High memory consumption
- Network errors (check Network tab in DevTools)

---

## Browser Console Checks
For each test, also verify:

1. **No Red Errors**: Browser console (F12 → Console) shows no error messages
2. **API Calls**: Network tab (F12 → Network) shows successful calls to:
   - `getOdooProducts` or `getOdooProductsByLocation`
   - `getOdooProductCategories`
   - `getOdooStockLocations`
3. **Response Status**: All API responses should be 200 (OK) or 304 (Not Modified)

---

## Debugging Tips

### If filters don't work:
- Check browser console for JavaScript errors
- Verify the backend service is responding (Network tab)
- Confirm you're logged in as a user with inventory permissions
- Refresh the page and try again

### If performance is poor:
- Check Network tab for slow API responses
- Verify backend service is not overwhelmed
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Clear browser cache and try again

### If specific filter is broken:
- Check if the category/location data loaded (Network tab)
- Verify the dropdown has options in it
- Try clearing filters and reapplying
- Test other filters to isolate the issue

---

## Sign-Off Checklist

- [ ] Test Case 1: Filter UI renders correctly
- [ ] Test Case 2: Category filter works
- [ ] Test Case 3: Location filter works
- [ ] Test Case 4: Combined filters work
- [ ] Test Case 5: Search filter works
- [ ] Test Case 6: Active status filter works
- [ ] Test Case 7: Clear filters button works
- [ ] Test Case 8: Add product with active filters
- [ ] Test Case 9: Edit product with active filters
- [ ] Test Case 10: Performance is acceptable
- [ ] No console errors observed
- [ ] All API calls successful (200/304 status)

---

## Notes
- All tests assume the production-submodule is deployed and running
- Tests should be performed on the Vercel production build URL
- If tests fail, compare with the local dev build (`npm run dev`)
- Report any failures with screenshots and browser console logs
- The smoke test in `tests/tenant-inventory-filter.spec.mjs` mirrors Test Cases 1-2

---

**Last Updated**: July 4, 2026  
**TICKET**: TICKET-021  
**Status**: Ready for Manual Testing on Vercel
