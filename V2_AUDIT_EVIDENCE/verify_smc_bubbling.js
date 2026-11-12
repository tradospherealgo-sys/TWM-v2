const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const BASE = 'http://localhost:8743';

  await page.goto(`${BASE}/index.html#/client/markets`, { waitUntil: 'load' });
  await page.waitForTimeout(150);

  const classBefore = await page.getAttribute('.twm-stage', 'class');
  console.log('1. Before clicking Connect SMC, stage class:', classBefore);

  // Instrument TwmSetFocus to see if it gets called as a side effect of the button click
  await page.evaluate(() => {
    window.__focusCalls = [];
    const orig = window.TwmSetFocus;
    window.TwmSetFocus = function(...args) {
      window.__focusCalls.push(JSON.stringify(args));
      return orig.apply(this, args);
    };
  });

  const btn = await page.$('#twm-connect-smc');
  console.log('2. Connect button found:', !!btn);
  await btn.click();
  await page.waitForTimeout(150);

  const classAfter = await page.getAttribute('.twm-stage', 'class');
  console.log('3. After clicking Connect SMC, stage class:', classAfter);

  const focusCalls = await page.evaluate(() => window.__focusCalls);
  console.log('4. TwmSetFocus call log (should be empty if no bubbling triggered it):', focusCalls);

  const bodyText = await page.evaluate(() => document.body.innerText.includes('Connect SMC Account'));
  console.log('5. Still shows "Connect SMC Account" text (expect false after connecting):', bodyText);

  await page.screenshot({ path: path.join(EVID, 'screenshots', 'smc_bubbling_check_1_markets_after_connect.png') });

  // Now hash-navigate to trade and try clicking live tab
  await page.evaluate(() => { window.location.hash = '/client/trade'; });
  await page.waitForTimeout(150);
  const classOnTrade = await page.getAttribute('.twm-stage', 'class');
  console.log('6. On Trade screen (after hash nav from poisoned Markets state), stage class:', classOnTrade);

  const liveTab = await page.$('[data-mode="live"]');
  console.log('7. Live tab element found:', !!liveTab);

  // Check pointer-events / computed style on stage to see if it's blocking
  const stagePointerEvents = await page.evaluate(() => {
    const stage = document.querySelector('.twm-stage');
    return stage ? getComputedStyle(stage).pointerEvents : 'NO STAGE FOUND';
  });
  console.log('8. .twm-stage computed pointer-events on Trade screen:', stagePointerEvents);

  const liveTabPointerEvents = await page.evaluate(() => {
    const el = document.querySelector('[data-mode="live"]');
    return el ? getComputedStyle(el).pointerEvents : 'NOT FOUND';
  });
  console.log('9. [data-mode="live"] computed pointer-events:', liveTabPointerEvents);

  await page.screenshot({ path: path.join(EVID, 'screenshots', 'smc_bubbling_check_2_trade_screen_state.png') });

  try {
    await liveTab.click({ timeout: 3000 });
    console.log('10. Live tab click SUCCEEDED (no bug)');
  } catch (e) {
    console.log('10. Live tab click FAILED (confirms stuck focus bug):', String(e).split('\n')[0]);
  }

  await browser.close();
})();
