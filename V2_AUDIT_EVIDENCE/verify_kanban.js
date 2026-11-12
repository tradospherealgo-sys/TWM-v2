const { chromium } = require('playwright');
const EVID = '/tmp/twm_audit_evidence';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const BASE = 'http://localhost:8743';
  const viewports = [
    { name: 'phone_portrait', width: 390, height: 844 },
    { name: 'phone_landscape', width: 844, height: 390 },
    { name: 'tablet', width: 900, height: 1200 },
    { name: 'desktop', width: 1440, height: 900 },
  ];
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/index.html#/employee/crm`, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const leadsSelected = await page.evaluate(() => document.querySelector('[data-tab="leads"]')?.getAttribute('aria-selected'));
    const kanbanOverflow = await page.evaluate(() => {
      const k = document.querySelector('.twm-kanban');
      return k ? getComputedStyle(k).overflowX : 'NO_KANBAN_FOUND';
    });
    const colFlexBasis = await page.evaluate(() => {
      const c = document.querySelector('.twm-kanban__column');
      return c ? getComputedStyle(c).flexBasis : null;
    });
    console.log(vp.name, 'leadsSelected=', leadsSelected, 'kanbanOverflowX=', kanbanOverflow, 'columnFlexBasis=', colFlexBasis);
    await page.close();
  }
  await browser.close();
})();
