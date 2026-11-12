const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const BASE = 'http://localhost:8743';

  // --- Control: clean state, employee/more tile click works fine ---
  await page.goto(`${BASE}/index.html#/employee/more`, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  let tiles = await page.$$('.twm-stage__panel');
  let clickOk = true;
  try { await tiles[0].click({ timeout: 3000 }); } catch (e) { clickOk = false; }
  await page.waitForTimeout(150);
  console.log('CONTROL (clean state) employee/more tile[0] click succeeded:', clickOk, 'hash now:', await page.evaluate(() => window.location.hash));

  // reset to a clean destination via direct goto (full reload) before poisoning
  await page.goto(`${BASE}/index.html#/employee/myday`, { waitUntil: 'load' });
  await page.waitForTimeout(150);

  // --- Poison: click a My Day panel (sets focusState via window.TwmSetFocus, NOT via Dock) ---
  const mydayPanels = await page.$$('.twm-stage__panel');
  await mydayPanels[0].click();
  await page.waitForTimeout(150);
  const classAfterPoison = await page.getAttribute('.twm-stage', 'class');
  console.log('After clicking My Day panel, stage class:', classAfterPoison);

  // --- Navigate to a DIFFERENT destination via direct hash edit (not Dock) ---
  await page.evaluate(() => { window.location.hash = '/employee/more'; });
  await page.waitForTimeout(150);
  const classOnMoreAfterPoison = await page.getAttribute('.twm-stage', 'class');
  const computedOnFirstTile = await page.evaluate(() => {
    const el = document.querySelector('.twm-stage__panel');
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, pointerEvents: cs.pointerEvents };
  });
  console.log('On employee/more AFTER poison, stage class:', classOnMoreAfterPoison, 'first tile computed style:', JSON.stringify(computedOnFirstTile));
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'bug_repro_4_cascade_poisoned_more_hub.png') });

  tiles = await page.$$('.twm-stage__panel');
  let clickOkAfterPoison = true;
  let errMsg = '';
  try { await tiles[0].click({ timeout: 4000 }); } catch (e) { clickOkAfterPoison = false; errMsg = String(e).split('\n')[0]; }
  console.log('AFTER POISON employee/more tile[0] click succeeded:', clickOkAfterPoison, errMsg);

  // --- Show recovery: clicking a Dock item resets focusState, tile click works again ---
  await page.click('.twm-dock__item >> nth=0');
  await page.waitForTimeout(150);
  await page.evaluate(() => { window.location.hash = '/employee/more'; });
  await page.waitForTimeout(150);
  tiles = await page.$$('.twm-stage__panel');
  let clickOkAfterDockReset = true;
  try { await tiles[0].click({ timeout: 3000 }); } catch (e) { clickOkAfterDockReset = false; }
  console.log('AFTER Dock-click reset, employee/more tile[0] click succeeded again:', clickOkAfterDockReset);

  await browser.close();
})();
