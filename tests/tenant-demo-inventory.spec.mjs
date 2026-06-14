import { test, expect } from '@playwright/test';

test('demo manufacturing shows demo inventory and requires login for full inventory', async ({ page }) => {
  await page.goto('/demo/manufacturing');

  // Demo inventory items seeded by `seed.js` should be visible
  await expect(page.locator('text=Widget A — SKU-1001')).toBeVisible();
  await expect(page.locator('text=Widget B — SKU-1002')).toBeVisible();

  // Full inventory link should point to /inventory and require login
  const fullInv = page.locator('a:has-text("Open full Inventory (login required)")');
  await expect(fullInv).toHaveAttribute('href', '/inventory');
  await fullInv.click();
  await expect(page).toHaveURL(/\/login/);
});
