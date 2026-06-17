import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = process.env.URL || 'http://localhost:5173/';
  console.log('Visiting', url);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for header hamburger and click it
    await page.waitForSelector('button[aria-controls="sidebar"]', { timeout: 7000 });
    await page.click('button[aria-controls="sidebar"]');
    console.log('Clicked hamburger');

    // Confirm sidebar shows open class
    const sidebarVisible = await page.$eval('.sidebar', (el) => el.classList.contains('open'));
    console.log('sidebarVisible=', sidebarVisible);

    // Click Inventory link from sidebar
    await page.waitForSelector('a[href="/inventory"]', { timeout: 5000 });
    await page.click('a[href="/inventory"]');
    await page.waitForLoadState('networkidle');
    console.log('Navigated to /inventory');

    // Check for Inventory page title text
    const foundInventory = await page.$$eval('h1,h2,h3', (nodes) => nodes.map(n => n.textContent || '').join('|||')).then(s => s.includes('Inventory'));
    console.log('foundInventory=', foundInventory);

    await browser.close();
    if (sidebarVisible && foundInventory) {
      console.log('SMOKE TEST PASSED');
      process.exit(0);
    } else {
      console.error('SMOKE TEST FAILED: sidebarVisible=', sidebarVisible, 'foundInventory=', foundInventory);
      process.exit(2);
    }
  } catch (err) {
    console.error('SMOKE TEST ERROR', err);
    try { await browser.close(); } catch (e) {}
    process.exit(3);
  }
})();
