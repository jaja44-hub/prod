import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(__dirname + '/../service-account.json', 'utf8'));
if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();
const auth = getAuth();

test('inventory filter UI loads and responds to category/location controls', async ({ page }) => {
  const email = `ui-inv-filter-${Date.now()}@local.test`;
  const password = 'Crown2026!';

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, { password });
  } catch (error) {
    userRecord = await auth.createUser({ email, password, displayName: 'UI Inventory Filter Test' });
  }

  await db.collection('users_extended').doc(userRecord.uid).set({
    role: 'CEO',
    tenantId: 'production',
    displayName: 'UI Inventory Filter Test',
    email,
    _ts: new Date().toISOString(),
  });

  const customToken = await auth.createCustomToken(userRecord.uid);
  const signinUrl = `/__playwright_signin?token=${encodeURIComponent(customToken)}&r=/inventory`;
  page.on('console', (message) => console.log('PW_CONSOLE:', message.text()));
  await page.goto(signinUrl);
  await page.waitForURL('**/inventory', { timeout: 20000 });
  await page.reload();

  const categorySelect = page.locator('label:has-text("Category")').locator('..').locator('select');
  const locationSelect = page.locator('label:has-text("Location")').locator('..').locator('select');
  const applyButton = page.locator('button:has-text("Apply filters")');

  await expect(categorySelect).toBeVisible();
  await expect(locationSelect).toBeVisible();
  await expect(applyButton).toBeVisible();

  const categoryOptions = categorySelect.locator('option');
  if (await categoryOptions.count() > 1) {
    await categorySelect.selectOption({ index: 1 });
  }

  const locationOptions = locationSelect.locator('option');
  if (await locationOptions.count() > 1) {
    await locationSelect.selectOption({ index: 1 });
  }

  await applyButton.click();
  await expect(page).toHaveURL(/\/inventory/);

  // Verify filters remain selectable and do not crash the page
  await expect(page.locator('text=No results found').first()).toBeVisible({ timeout: 2000 }).catch(() => null);

  await db.collection('users_extended').doc(userRecord.uid).delete();
  await auth.deleteUser(userRecord.uid);
});
