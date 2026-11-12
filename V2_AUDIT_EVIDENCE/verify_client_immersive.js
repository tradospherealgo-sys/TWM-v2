const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const BASE = 'http://localhost:8743';

  // 1. Confirm no in-app affordance on Markets ever navigates with a 3rd hash segment:
  //    check that clicking the watchlist panel (its only interaction) only ever sets focus, not panel route.
  await page.goto(`${BASE}/index.html#/client/markets`, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const panel = await page.$('[data-panel-id="watchlist"]');
  await panel.click();
  await page.waitForTimeout(150);
  console.log('1. After clicking watchlist panel (only in-app interaction on Markets), hash:', await page.evaluate(() => window.location.hash));
  const stageClassFocus = await page.getAttribute('.twm-stage', 'class');
  console.log('2. Stage class after click (expect twm-stage--focus, NOT immersive):', stageClassFocus);

  // 2. Now manually force a 3-segment hash to see if the Immersive *mechanism* itself works for Client,
  //    even though nothing in Client's own UI ever triggers it.
  await page.evaluate(() => { window.location.hash = '/client/markets/watchlist'; });
  await page.waitForTimeout(150);
  const stageClassImmersive = await page.getAttribute('.twm-stage', 'class');
  console.log('3. Stage class after manually forcing #/client/markets/watchlist:', stageClassImmersive);
  const dockClass = await page.getAttribute('.twm-dock', 'class');
  console.log('4. Dock class (expect minimized if immersive mechanism works):', dockClass);
  const panelImmersive = await page.$('[data-panel-id="watchlist"].twm-stage__panel--immersive');
  console.log('5. Watchlist panel has --immersive class:', !!panelImmersive);

  await page.screenshot({ path: path.join(EVID, 'screenshots', 'client_immersive_mechanism_check.png') });

  await browser.close();
})();
