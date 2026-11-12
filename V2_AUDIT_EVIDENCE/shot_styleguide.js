const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 2200 } });
  await page.goto('http://localhost:8743/style-guide.html', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'phase1_style_guide.png'), fullPage: true });
  await page.goto('http://localhost:8743/login.html', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'phase1_login_entry.png') });
  console.log('done');
  await browser.close();
})();
