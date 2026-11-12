const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const BASE = 'http://localhost:8743';

  // Fresh load on Admin Team (a screen whose panels use window.TwmSetFocus, per team.js)
  await page.goto(`${BASE}/index.html#/admin/team`, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  let stageClass = await page.getAttribute('.twm-stage', 'class');
  console.log('1. Fresh load /admin/team stage class:', stageClass);

  // Click a panel to enter Focus mode (Employees panel -> window.TwmSetFocus('focus','employees'))
  const panel = await page.$('.twm-stage__panel');
  await panel.click();
  await page.waitForTimeout(150);
  stageClass = await page.getAttribute('.twm-stage', 'class');
  console.log('2. After clicking Team\'s Employees panel, stage class:', stageClass);
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'bug_repro_3_cmdk_stuck_focus.png') });

  // Now jump to a DIFFERENT admin destination via the Admin-only cmdk palette (Cmd+K), not the Dock
  await page.keyboard.down('Meta'); await page.keyboard.press('k'); await page.keyboard.up('Meta');
  await page.waitForTimeout(150);
  const cmdkVisible = await page.$('.twm-cmdk-backdrop') !== null;
  console.log('3. cmdk palette opened:', cmdkVisible);
  const complianceBtn = await page.$('[data-dest="compliance"]');
  await complianceBtn.click();
  await page.waitForTimeout(150);
  const hashAfterCmdk = await page.evaluate(() => window.location.hash);
  stageClass = await page.getAttribute('.twm-stage', 'class');
  console.log('4. After cmdk-navigating to Compliance, hash:', hashAfterCmdk, 'stage class:', stageClass);

  const computed = await page.evaluate(() => {
    const el = document.querySelector('.twm-stage__panel');
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, pointerEvents: cs.pointerEvents, panelId: el.dataset.panelId };
  });
  console.log('5. Compliance screen first panel computed style:', JSON.stringify(computed));

  const panelsOnCompliance = await page.$$('.twm-stage__panel');
  let clickOk = true, errMsg = '';
  try { await panelsOnCompliance[0].click({ timeout: 4000 }); } catch (e) { clickOk = false; errMsg = String(e).split('\n')[0]; }
  console.log('6. Click on Compliance panel after cmdk nav succeeded:', clickOk, errMsg);

  await browser.close();
})();
