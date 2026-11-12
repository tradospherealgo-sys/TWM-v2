const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:8743/index.html#/admin/command-centre', { waitUntil: 'load' });
  await page.waitForTimeout(150);

  await page.evaluate(() => { window.__hashLog = []; window.addEventListener('hashchange', () => window.__hashLog.push(location.hash)); });

  const tile = await page.$('[data-panel-id="tile-users"]');
  console.log('1. tile-users found:', !!tile);
  await tile.click();
  await page.waitForTimeout(150);
  console.log('2. hash after clicking tile-users (no panel arg):', await page.evaluate(() => window.location.hash));
  console.log('3. stage class on destination screen:', await page.getAttribute('.twm-stage', 'class'));
  console.log('4. hashchange log (did it ever pass through a Focus-mode intermediate state?):', await page.evaluate(() => window.__hashLog));

  await page.screenshot({ path: path.join(EVID, 'screenshots', 'admin_cc_tile_deeplink_result.png') });
  await browser.close();
})();
