const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8743';
const EVID = '/tmp/twm_audit_evidence';
if (!fs.existsSync(EVID)) fs.mkdirSync(EVID, { recursive: true });
if (!fs.existsSync(path.join(EVID, 'screenshots'))) fs.mkdirSync(path.join(EVID, 'screenshots'));

const results = { console_errors: [], page_errors: [], route_tests: [], interaction_tests: [], responsive_tests: [] };

const ROUTES = [
  ['client', 'home', null], ['client', 'markets', null], ['client', 'trade', null], ['client', 'services', null], ['client', 'me', null],
  ['employee', 'myday', null], ['employee', 'crm', null], ['employee', 'applications', null], ['employee', 'tasks', null], ['employee', 'more', null],
  ['employee', 'more', 'internal-chat'], ['employee', 'more', 'knowledge-sop'], ['employee', 'more', 'performance'], ['employee', 'more', 'daily-reports'],
  ['admin', 'command-centre', null], ['admin', 'team', null], ['admin', 'sales-crm', null], ['admin', 'applications-review', null], ['admin', 'compliance', null], ['admin', 'more', null],
  ['admin', 'more', 'integrations'], ['admin', 'more', 'signals-desk'], ['admin', 'more', 'content-sop'], ['admin', 'more', 'system-health'],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') results.console_errors.push({ text: msg.text(), location: msg.location() });
  });
  page.on('pageerror', (err) => { results.page_errors.push(String(err)); });

  async function cleanOverlays() {
    await page.evaluate(() => { document.querySelectorAll('.twm-cmdk-backdrop').forEach((n) => n.remove()); }).catch(() => {});
  }
  async function hardGoto(hashParts) {
    await cleanOverlays();
    const hash = Array.isArray(hashParts) ? hashParts.filter(Boolean).join('/') : hashParts;
    await page.goto(`${BASE}/index.html#/${hash}`, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    await cleanOverlays();
  }
  async function step(name, fn) {
    try {
      await fn();
    } catch (e) {
      results.interaction_tests.push({ test: name, error: String(e).split('\n')[0].slice(0, 300) });
      await cleanOverlays();
    }
  }

  // ---- Route sweep: every destination + sub-panel for all 3 roles ----
  for (const [role, dest, panel] of ROUTES) {
    await step(`route_${role}_${dest}${panel ? '_' + panel : ''}`, async () => {
      await hardGoto([role, dest, panel]);
      const title = await page.textContent('#twm-stage').catch(() => null);
      const breadcrumb = await page.textContent('#twm-breadcrumbs').catch(() => '');
      const headerBrand = await page.textContent('.twm-header__role-chip').catch(() => null);
      const panelCount = await page.$$eval('.twm-stage__panel', (els) => els.length).catch(() => -1);
      const hasNotFound = (title || '').includes('Not found') || (title || '').includes('Nothing here yet');
      const screenshotName = `route_${role}_${dest}${panel ? '_' + panel : ''}.png`;
      await page.screenshot({ path: path.join(EVID, 'screenshots', screenshotName) });
      results.route_tests.push({
        role, dest, panel, panelCount, headerBrand, breadcrumb: (breadcrumb || '').trim(),
        hasNotFound, screenshot: screenshotName,
        bodySample: (title || '').slice(0, 220).replace(/\s+/g, ' '),
      });
    });
  }

  // ---- Interaction tests ----
  await step('client_dock_click_navigation', async () => {
    await hardGoto(['client', 'home']);
    const count = await page.$$eval('.twm-dock__item', (els) => els.length);
    const clicks = [];
    for (let i = 0; i < count; i++) {
      const btns = await page.$$('.twm-dock__item');
      const label = (await btns[i].textContent()).trim();
      await btns[i].click();
      await page.waitForTimeout(150);
      clicks.push({ label, resultingHash: await page.evaluate(() => window.location.hash) });
    }
    results.interaction_tests.push({ test: 'client_dock_click_navigation', count, clicks });
  });

  await step('role_switch_select', async () => {
    await hardGoto(['client', 'home']);
    await page.selectOption('select.twm-input', 'employee');
    await page.waitForTimeout(150);
    const toEmployee = await page.evaluate(() => window.location.hash);
    await page.selectOption('select.twm-input', 'admin');
    await page.waitForTimeout(150);
    const toAdmin = await page.evaluate(() => window.location.hash);
    const breadcrumbVisibleAdmin = await page.isVisible('#twm-breadcrumbs');
    results.interaction_tests.push({ test: 'role_switch_select', toEmployee, toAdmin, breadcrumbVisibleAdmin });
  });

  await step('ai_fab_visibility', async () => {
    await hardGoto(['client', 'home']);
    const client = await page.isVisible('#twm-ai-fab');
    await hardGoto(['employee', 'myday']);
    const employee = await page.isVisible('#twm-ai-fab');
    await hardGoto(['admin', 'command-centre']);
    const admin = await page.isVisible('#twm-ai-fab');
    results.interaction_tests.push({ test: 'ai_fab_visibility', client, employee, admin });
  });

  await step('breadcrumb_visibility_role_gated', async () => {
    await hardGoto(['client', 'home']);
    const client = await page.isVisible('#twm-breadcrumbs');
    await hardGoto(['employee', 'myday']);
    const employee = await page.isVisible('#twm-breadcrumbs');
    await hardGoto(['admin', 'command-centre']);
    const admin = await page.isVisible('#twm-breadcrumbs');
    results.interaction_tests.push({ test: 'breadcrumb_visibility_role_gated', client, employee, admin });
  });

  await step('admin_cmdk_palette_click', async () => {
    await hardGoto(['admin', 'command-centre']);
    const cmdkBtn = await page.$('.twm-header__actions button');
    let cmdkOpened = false, cmdkDestCount = 0, afterCmdkHash = null;
    if (cmdkBtn) {
      await cmdkBtn.click();
      await page.waitForTimeout(150);
      cmdkOpened = await page.isVisible('.twm-cmdk');
      cmdkDestCount = await page.$$eval('.twm-cmdk [data-dest]', (els) => els.length).catch(() => 0);
      if (cmdkOpened) {
        const destBtn = await page.$('.twm-cmdk [data-dest="team"]');
        if (destBtn) { await destBtn.click({ timeout: 5000 }); await page.waitForTimeout(150); }
      }
      afterCmdkHash = await page.evaluate(() => window.location.hash);
    }
    results.interaction_tests.push({ test: 'admin_cmdk_palette_click', cmdkOpened, cmdkDestCount, afterCmdkHash });
  });

  await step('admin_cmdk_keyboard_shortcut', async () => {
    await hardGoto(['admin', 'command-centre']);
    await page.keyboard.down('Meta'); await page.keyboard.press('k'); await page.keyboard.up('Meta');
    await page.waitForTimeout(150);
    const opened = await page.isVisible('.twm-cmdk');
    results.interaction_tests.push({ test: 'admin_cmdk_keyboard_shortcut', opened });
  });

  await step('client_trade_practice_live_tab_and_connect_gate', async () => {
    await hardGoto(['client', 'trade']);
    const practiceSelectedBefore = await page.getAttribute('[data-mode="practice"]', 'aria-selected').catch(() => null);
    await page.click('[data-mode="live"]', { timeout: 5000 });
    await page.waitForTimeout(150);
    const liveSelectedAfter = await page.getAttribute('[data-mode="live"]', 'aria-selected').catch(() => null);
    const connectBannerVisible = await page.isVisible('#twm-connect-smc').catch(() => false);
    await page.screenshot({ path: path.join(EVID, 'screenshots', 'trade_live_gate.png') });
    let liveConnectedVisible = null;
    if (connectBannerVisible) {
      await page.click('#twm-connect-smc', { timeout: 5000 });
      await page.waitForTimeout(150);
      liveConnectedVisible = await page.isVisible('text=Live — Connected').catch(() => false);
      await page.screenshot({ path: path.join(EVID, 'screenshots', 'trade_live_connected.png') });
    }
    results.interaction_tests.push({ test: 'client_trade_practice_live_tab_and_connect_gate', practiceSelectedBefore, liveSelectedAfter, connectBannerVisible, liveConnectedVisible });
  });

  await step('employee_crm_leads_customers_tab', async () => {
    await hardGoto(['employee', 'crm']);
    const leadsSelectedBefore = await page.getAttribute('[data-tab="leads"]', 'aria-selected').catch(() => null);
    await page.click('[data-tab="customers"]', { timeout: 5000 });
    await page.waitForTimeout(150);
    const customersSelectedAfter = await page.getAttribute('[data-tab="customers"]', 'aria-selected').catch(() => null);
    const custView = await page.textContent('#twm-stage').catch(() => '');
    await page.screenshot({ path: path.join(EVID, 'screenshots', 'employee_crm_customers_tab.png') });
    results.interaction_tests.push({ test: 'employee_crm_leads_customers_tab', leadsSelectedBefore, customersSelectedAfter, customersContentHas360: custView.includes('360') });
  });

  await step('focus_mode_dim_behavior', async () => {
    await hardGoto(['employee', 'myday']);
    const panelsBefore = await page.$$('.twm-stage__panel');
    if (panelsBefore.length > 0) { await panelsBefore[0].click(); await page.waitForTimeout(150); }
    const stageClassAfterFocus = await page.getAttribute('.twm-stage', 'class').catch(() => null);
    const dimmedCount = await page.$$eval('.twm-stage__panel:not(.twm-stage__panel--focused)', (els) =>
      els.filter((e) => getComputedStyle(e).opacity !== '1').length
    ).catch(() => -1);
    await page.screenshot({ path: path.join(EVID, 'screenshots', 'employee_myday_focus_mode.png') });
    results.interaction_tests.push({ test: 'focus_mode_dim_behavior', stageClassAfterFocus, dimmedCount, totalPanels: panelsBefore.length });
  });

  await step('employee_more_hub_immersive_nav', async () => {
    await hardGoto(['employee', 'more']);
    const moreTiles = await page.$$('.twm-stage__panel');
    if (moreTiles.length > 0) { await moreTiles[0].click(); await page.waitForTimeout(150); }
    const hashAfterMoreClick = await page.evaluate(() => window.location.hash);
    const stageClassImmersive = await page.getAttribute('.twm-stage', 'class').catch(() => null);
    const dockClassImmersive = await page.getAttribute('#twm-dock', 'class').catch(() => null);
    await page.screenshot({ path: path.join(EVID, 'screenshots', 'employee_more_immersive.png') });
    results.interaction_tests.push({ test: 'employee_more_hub_immersive_nav', hashAfterMoreClick, stageClassImmersive, dockClassImmersive, tileCount: moreTiles.length });
  });

  await step('admin_more_hub_immersive_nav', async () => {
    await hardGoto(['admin', 'more']);
    const moreTiles = await page.$$('.twm-stage__panel');
    if (moreTiles.length > 0) { await moreTiles[0].click(); await page.waitForTimeout(150); }
    const hashAfterMoreClick = await page.evaluate(() => window.location.hash);
    const stageClassImmersive = await page.getAttribute('.twm-stage', 'class').catch(() => null);
    await page.screenshot({ path: path.join(EVID, 'screenshots', 'admin_more_immersive.png') });
    results.interaction_tests.push({ test: 'admin_more_hub_immersive_nav', hashAfterMoreClick, stageClassImmersive, tileCount: moreTiles.length });
  });

  await step('admin_command_centre_tile_deeplink', async () => {
    await hardGoto(['admin', 'command-centre']);
    const tiles = await page.$$('.twm-stage__panel');
    // 'Users' tile is panels[0], should deep-link to 'team'
    if (tiles.length > 0) { await tiles[0].click(); await page.waitForTimeout(150); }
    const hashAfterTileClick = await page.evaluate(() => window.location.hash);
    results.interaction_tests.push({ test: 'admin_command_centre_tile_deeplink', hashAfterTileClick });
  });

  // ---- Responsive sweep ----
  const viewports = [
    { name: 'phone_portrait', width: 390, height: 844 },
    { name: 'phone_landscape', width: 844, height: 390 },
    { name: 'tablet', width: 900, height: 1200 },
    { name: 'desktop', width: 1440, height: 900 },
  ];
  for (const vp of viewports) {
    await step(`responsive_${vp.name}`, async () => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await hardGoto(['admin', 'command-centre']);
      const gridCols = await page.evaluate(() => {
        const grid = document.querySelector('.twm-stage__grid');
        return grid ? getComputedStyle(grid).gridTemplateColumns : null;
      });
      await page.screenshot({ path: path.join(EVID, 'screenshots', `responsive_${vp.name}_admin_command_centre.png`) });

      await hardGoto(['employee', 'crm']);
      const kanbanOverflow = await page.evaluate(() => {
        const k = document.querySelector('.twm-kanban');
        return k ? getComputedStyle(k).overflowX : null;
      });
      await page.screenshot({ path: path.join(EVID, 'screenshots', `responsive_${vp.name}_employee_crm.png`) });

      const dockMinWidthOk = await page.evaluate(() => {
        const items = document.querySelectorAll('.twm-dock__item');
        return items.length > 0 ? Array.from(items).every((i) => i.getBoundingClientRect().height >= 40) : null;
      });

      results.responsive_tests.push({ viewport: vp.name, width: vp.width, height: vp.height, gridTemplateColumns_commandCentre: gridCols, kanbanOverflowX_employeeCrm: kanbanOverflow, dockTouchTargetOk: dockMinWidthOk });
    });
  }

  await browser.close();
  fs.writeFileSync(path.join(EVID, 'test_results.json'), JSON.stringify(results, null, 2));
  console.log('DONE. Routes tested:', results.route_tests.length, '/', ROUTES.length);
  console.log('Interactions tested:', results.interaction_tests.length);
  console.log('Responsive checks:', results.responsive_tests.length);
  console.log('Console errors:', results.console_errors.length, 'Page errors:', results.page_errors.length);
})().catch((e) => {
  console.error('FATAL:', e);
  fs.writeFileSync(path.join(EVID, 'test_results.json'), JSON.stringify(results, null, 2));
  process.exit(1);
});
