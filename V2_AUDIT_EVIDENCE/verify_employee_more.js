const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:8743/index.html#/employee/more', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const tile = await page.$('[data-panel-id="performance"]');
  console.log('1. Performance tile found:', !!tile);
  await tile.click();
  await page.waitForTimeout(150);
  console.log('2. Hash after click:', await page.evaluate(() => window.location.hash));
  console.log('3. Stage class:', await page.getAttribute('.twm-stage', 'class'));
  const panelCount = await page.evaluate(() => document.querySelectorAll('.twm-stage__panel').length);
  console.log('4. Panel count on Performance sub-screen (expect 1, flat, no own Overview/Focus substructure):', panelCount);
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'employee_more_performance_immersive.png') });
  await browser.close();
})();
