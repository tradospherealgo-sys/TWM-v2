const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:8743/index.html#/client/me', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const cursors = await page.evaluate(() => Array.from(document.querySelectorAll('.twm-stage__panel')).map(p => getComputedStyle(p).cursor));
  console.log('ME (fresh/clean load): cursor styles:', cursors);
  const panels = await page.$$('.twm-stage__panel');
  await panels[0].click();
  await page.waitForTimeout(150);
  console.log('ME: stage class after clicking first panel (Profile):', await page.getAttribute('.twm-stage', 'class'));
  await browser.close();
})();
