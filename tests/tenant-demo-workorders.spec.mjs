import { test, expect } from '@playwright/test';

test('demo manufacturing shows demo work orders and requires login for full work orders', async ({ page }) => {
  await page.goto('/demo/manufacturing');

  // Demo work orders seeded by `seed.js` should be visible
  await expect(page.locator('text=WO-001 — Assemble Widget A')).toBeVisible();
  await expect(page.locator('text=WO-002 — Assemble Widget B')).toBeVisible();

  // Full work-orders link should point to /work-orders and require login
  const fullWO = page.locator('a:has-text("Open Work Orders (login required)")');
  await expect(fullWO).toHaveAttribute('href', '/work-orders');
  await fullWO.click();
  await expect(page).toHaveURL(/\/login/);
});
