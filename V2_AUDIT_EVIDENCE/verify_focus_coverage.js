const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const BASE = 'http://localhost:8743';

  async function checkScreen(hash, label) {
    await page.goto(`${BASE}/index.html#${hash}`, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const panels = await page.$$('.twm-stage__panel');
    const cursors = await page.evaluate(() => Array.from(document.querySelectorAll('.twm-stage__panel')).map(p => getComputedStyle(p).cursor));
    console.log(`${label}: ${panels.length} panels, cursor styles:`, cursors);
    if (panels.length > 0) {
      await panels[0].click();
      await page.waitForTimeout(150);
      const stageClass = await page.getAttribute('.twm-stage', 'class');
      console.log(`${label}: stage class after clicking first panel:`, stageClass);
    }
  }

  await checkScreen('/client/home', 'HOME');
  await checkScreen('/client/trade', 'TRADE');
  await checkScreen('/client/services', 'SERVICES');
  await checkScreen('/client/me', 'ME');

  await browser.close();
})();
