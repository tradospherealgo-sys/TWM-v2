const { chromium } = require('playwright');

const EXE = '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const out = [];

  // 1. cmdk input filtering test
  {
    const page = await browser.newPage();
    await page.goto('http://localhost:8743/index.html#/admin/command-centre');
    await page.waitForTimeout(300);
    await page.keyboard.down('Meta'); await page.keyboard.press('k'); await page.keyboard.up('Meta');
    await page.waitForTimeout(200);
    const input = await page.$('.twm-cmdk input');
    await input.type('complia');
    await page.waitForTimeout(200);
    const visibleButtons = await page.$$eval('.twm-cmdk [data-dest]', els => els.map(e => ({text: e.textContent, visible: e.offsetParent !== null})));
    out.push('1. cmdk input typed "complia" -> visible dest buttons: ' + JSON.stringify(visibleButtons));
    await page.close();
  }

  // 2. Responsive check across all 3 roles at phone/tablet/desktop
  const viewports = [
    { name: 'phone', width: 375, height: 812 },
    { name: 'tablet', width: 900, height: 1200 },
    { name: 'desktop', width: 1440, height: 900 },
  ];
  const roles = [
    { role: 'client', dest: 'home' },
    { role: 'employee', dest: 'myday' },
    { role: 'admin', dest: 'command-centre' },
  ];
  for (const r of roles) {
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:8743/index.html#/${r.role}/${r.dest}`);
      await page.waitForTimeout(250);
      const dockBox = await page.$eval('#twm-dock', el => { const b = el.getBoundingClientRect(); return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,visible: b.width>0 && b.height>0}; }).catch(e => 'ERR:' + e.message);
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      const touchTargets = await page.$$eval('.twm-dock__item', els => els.map(e => { const b = e.getBoundingClientRect(); return Math.min(b.width, b.height); }));
      const minTouch = touchTargets.length ? Math.min(...touchTargets) : null;
      out.push(`2. role=${r.role} vp=${vp.name} dockBox=${JSON.stringify(dockBox)} horizOverflow=${overflowX} minDockTouchTarget=${minTouch}`);
      if (vp.name === 'phone') {
        await page.screenshot({ path: `/Users/anshhdodia/Downloads/TWM_V2_Prototype/V2_AUDIT_EVIDENCE/screenshots/phase6_${r.role}_phone.png` });
      }
      await page.close();
    }
  }

  // 3. pending-decision badge cross-role presence check
  {
    const page = await browser.newPage();
    for (const r of [['client','services'],['employee','more'],['admin','more']]) {
      await page.goto(`http://localhost:8743/index.html#/${r[0]}/${r[1]}`);
      await page.waitForTimeout(250);
      const badgeCount = await page.$$eval('.twm-badge--pending-decision', els => els.length);
      out.push(`3. role=${r[0]} dest=${r[1]} pending-decision badges found=${badgeCount}`);
    }
    await page.close();
  }

  // 4. role-switch dropdown resets focusState correctly (cross-role H-1 check)
  {
    const page = await browser.newPage();
    await page.goto('http://localhost:8743/index.html#/employee/myday');
    await page.waitForTimeout(250);
    // Focus a panel first
    const panel = await page.$('.twm-panel[data-panel-id], .twm-stage .twm-panel');
    const clickable = await page.$$('.twm-stage .twm-panel');
    if (clickable.length) { await clickable[0].click().catch(()=>{}); }
    await page.waitForTimeout(200);
    const stageClassBefore = await page.$eval('#twm-stage', el => el.className);
    // Switch role via dropdown
    await page.selectOption('select.twm-input', 'admin');
    await page.waitForTimeout(250);
    const hashAfter = await page.evaluate(() => location.hash);
    const stageClassAfter = await page.$eval('#twm-stage', el => el.className);
    out.push(`4. stageClassBefore=${stageClassBefore} hashAfterRoleSwitch=${hashAfter} stageClassAfter=${stageClassAfter}`);
    await page.close();
  }

  console.log(out.join('\n'));
  await browser.close();
})();
