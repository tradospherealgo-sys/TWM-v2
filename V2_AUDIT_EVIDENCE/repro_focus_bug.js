const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const BASE = 'http://localhost:8743';

  // Fresh load, Overview mode by default
  await page.goto(`${BASE}/index.html#/employee/myday`, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  let stageClass = await page.getAttribute('.twm-stage', 'class');
  console.log('1. Fresh load /employee/myday stage class:', stageClass);

  // Click a panel to enter Focus mode (as a real user would)
  const panel = await page.$('.twm-stage__panel');
  await panel.click();
  await page.waitForTimeout(150);
  stageClass = await page.getAttribute('.twm-stage', 'class');
  console.log('2. After clicking a panel, stage class:', stageClass);
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'bug_repro_1_focus_mode.png') });

  // Now navigate directly via hash (simulating: typing a URL, using browser back/forward,
  // a deep link, the admin Command Centre tile deep-link, or the admin cmdk palette —
  // none of which go through the Dock's onSelect callback)
  await page.evaluate(() => { window.location.hash = '/employee/applications'; });
  await page.waitForTimeout(150);
  stageClass = await page.getAttribute('.twm-stage', 'class');
  console.log('3. After hash-navigating (non-dock) to /employee/applications, stage class:', stageClass);
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'bug_repro_2_stuck_focus_on_new_screen.png') });

  // Is the new screen's panel now clickable (does it have the onFocus click wired)?
  const panelsOnNewScreen = await page.$$('.twm-stage__panel');
  let clickRegistered = false;
  await page.evaluate(() => { window.__navigatedAfterClick = false; });
  // Wire a one-time observer: clicking a panel that has onFocus calls TwmSetFocus -> re-renders -> changes stage class to include focused panel id match or not
  const classBeforeClick = await page.getAttribute('.twm-stage', 'class');
  if (panelsOnNewScreen.length > 0) {
    await panelsOnNewScreen[0].click({ timeout: 3000 }).catch((e) => { console.log('   click threw:', String(e).split('\n')[0]); });
  }
  await page.waitForTimeout(150);
  const classAfterClick = await page.getAttribute('.twm-stage', 'class');
  console.log('4. Stage class before click-attempt on new screen panel:', classBeforeClick);
  console.log('5. Stage class after click-attempt on new screen panel:', classAfterClick);
  console.log('6. Did the click change anything? ', classBeforeClick !== classAfterClick);

  // Now show the fix path: clicking the Dock DOES reset focusState
  await page.click('.twm-dock__item >> nth=0');
  await page.waitForTimeout(150);
  const classAfterDockClick = await page.getAttribute('.twm-stage', 'class');
  console.log('7. Stage class after clicking a Dock item (resets focusState):', classAfterDockClick);

  await browser.close();
})();
