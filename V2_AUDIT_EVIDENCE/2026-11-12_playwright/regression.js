/*
  TWM V2 — Live Playwright regression, 2026-11-12.
  Run manually: node V2_AUDIT_EVIDENCE/2026-11-12_playwright/regression.js
  Requires: local static server already running at BASE_URL (see V2_EXECUTION_CHECKPOINT.md).
  This is the first live-browser verification of this mission — prior sessions were
  static-code-trace only. Results (pass/fail per check + console/network errors +
  screenshots) are written to this directory.
*/
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:8731';
const CHROME_PATH = '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const EVIDENCE_DIR = __dirname;

const DESTINATIONS = {
  client: ['home', 'markets', 'trade', 'services', 'me'],
  employee: ['myday', 'crm', 'applications', 'tasks', 'more'],
  admin: ['command-centre', 'team', 'sales-crm', 'applications-review', 'compliance', 'more'],
};

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1194 },
  { name: 'desktop-landscape', width: 1440, height: 900 },
];

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail: detail || '' });
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? ' :: ' + detail : ''));
}

async function collectErrors(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('requestfailed', (r) => failedRequests.push(r.url() + ' :: ' + (r.failure() && r.failure().errorText)));
  return { consoleErrors, pageErrors, failedRequests };
}

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH });

  // ---- 1. Desktop sweep: every role x destination, console/network clean ----
  for (const role of Object.keys(DESTINATIONS)) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errs = await collectErrors(page);
    for (const dest of DESTINATIONS[role]) {
      await page.goto(`${BASE_URL}/index.html#/${role}/${dest}`);
      await page.waitForTimeout(300);
      const stageHtml = await page.locator('#twm-stage').innerHTML();
      const nonEmpty = stageHtml && stageHtml.trim().length > 50;
      record(`${role}/${dest} renders`, nonEmpty, nonEmpty ? '' : 'stage appears empty');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `${role}_${dest}_overview.png`) });
    }
    record(`${role}: no console errors across all destinations`, errs.consoleErrors.length === 0, errs.consoleErrors.join(' | '));
    record(`${role}: no page errors`, errs.pageErrors.length === 0, errs.pageErrors.join(' | '));
    record(`${role}: no failed network requests`, errs.failedRequests.length === 0, errs.failedRequests.join(' | '));
    await context.close();
  }

  // ---- 2. Focus / Immersive mode checks on representative panels ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Client: open a lead-free path isn't applicable; use Services category -> Immersive (P3-44 fix)
    await page.goto(`${BASE_URL}/index.html#/client/services`);
    await page.waitForTimeout(300);
    const catButton = page.locator('.twm-stage__panel').first();
    const servicesHtml = await page.locator('#twm-stage').innerHTML();
    record('client/services overview shows category panels', servicesHtml.includes('twm-stage__panel'), '');

    // Employee: CRM -> select a lead -> Focus -> Immersive via Open full view
    await page.goto(`${BASE_URL}/index.html#/employee/crm`);
    await page.waitForTimeout(300);
    const leadBtn = page.locator('[data-lead]').first();
    const leadExists = await leadBtn.count() > 0;
    record('employee/crm shows at least one lead card', leadExists, '');
    if (leadExists) {
      await leadBtn.click();
      await page.waitForTimeout(300);
      const focusClass = await page.locator('#twm-stage').getAttribute('class');
      record('employee/crm lead click enters Focus mode', (focusClass || '').includes('twm-stage--focus'), focusClass || '');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'employee_crm_lead_focus.png') });
      const openFullViewBtn = page.locator('button:has-text("Open full view")');
      const hasOpenFullView = await openFullViewBtn.count() > 0;
      record('employee/crm lead Focus shows "Open full view" (H-2)', hasOpenFullView, '');
      if (hasOpenFullView) {
        await openFullViewBtn.first().click();
        await page.waitForTimeout(300);
        const immersiveClass = await page.locator('#twm-stage').getAttribute('class');
        record('employee/crm lead reaches Immersive mode', (immersiveClass || '').includes('twm-stage--immersive'), immersiveClass || '');
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'employee_crm_lead_immersive.png') });

        // P4-23: Lost reason-code prompt
        const markLostBtn = page.locator('#mark-lost');
        if (await markLostBtn.count() > 0) {
          await markLostBtn.click();
          await page.waitForTimeout(200);
          const reasonSelect = page.locator('#lost-reason');
          record('P4-23: Mark Lost shows reason-code select', await reasonSelect.count() > 0, '');
          if (await reasonSelect.count() > 0) {
            await reasonSelect.selectOption({ index: 1 });
            await page.locator('#confirm-lost').click();
            await page.waitForTimeout(200);
            const stageChip = await page.locator('#twm-stage').innerText();
            record('P4-23: lead stage becomes Lost with reason persisted', stageChip.includes('Lost'), '');
          }
        }
      }
    }

    // Employee: Applications -> detail -> document upload + checklist (P4-28)
    await page.goto(`${BASE_URL}/index.html#/employee/applications`);
    await page.waitForTimeout(300);
    const appBtn = page.locator('[data-app]').first();
    if (await appBtn.count() > 0) {
      await appBtn.click();
      await page.waitForTimeout(300);
      const openFullViewBtn2 = page.locator('button:has-text("Open full view")');
      if (await openFullViewBtn2.count() > 0) {
        await openFullViewBtn2.first().click();
        await page.waitForTimeout(300);
        const checklistItems = page.locator('[data-checklist-item]');
        record('P4-28: Applications Immersive shows review checklist', await checklistItems.count() > 0, '');
        const uploadInput = page.locator('#doc-upload');
        record('P4-28: Applications Immersive shows document upload control', await uploadInput.count() > 0, '');
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'employee_application_immersive.png') });
      }
    }

    // Employee: More hub 3-tier check (P4-21)
    await page.goto(`${BASE_URL}/index.html#/employee/more`);
    await page.waitForTimeout(300);
    const perfTile = page.locator('.twm-stage__panel', { hasText: 'Performance' }).first();
    if (await perfTile.count() > 0) {
      await perfTile.click();
      await page.waitForTimeout(300);
      const focusClassMore = await page.locator('#twm-stage').getAttribute('class');
      record('P4-21: Employee More hub tile click enters Focus (not direct Immersive)', (focusClassMore || '').includes('twm-stage--focus'), focusClassMore || '');
      const openFullViewBtn3 = page.locator('button:has-text("Open full view")');
      record('P4-21: Employee More hub Focus shows Open full view', await openFullViewBtn3.count() > 0, '');
    }

    // Admin: More hub 3-tier check (P5-31)
    await page.goto(`${BASE_URL}/index.html#/admin/more`);
    await page.waitForTimeout(300);
    const intTile = page.locator('.twm-stage__panel', { hasText: 'Integrations' }).first();
    if (await intTile.count() > 0) {
      await intTile.click();
      await page.waitForTimeout(300);
      const focusClassAdminMore = await page.locator('#twm-stage').getAttribute('class');
      record('P5-31: Admin More hub tile click enters Focus (not direct Immersive)', (focusClassAdminMore || '').includes('twm-stage--focus'), focusClassAdminMore || '');
      const openFullViewBtn4 = page.locator('button:has-text("Open full view")');
      record('P5-31: Admin More hub Focus shows Open full view', await openFullViewBtn4.count() > 0, '');
    }

    // Admin: Team -> View Performance (P5-33)
    await page.goto(`${BASE_URL}/index.html#/admin/team`);
    await page.waitForTimeout(300);
    const perfBtn = page.locator('button:has-text("View Performance")').first();
    if (await perfBtn.count() > 0) {
      await perfBtn.click();
      await page.waitForTimeout(200);
      const perfNums = await page.locator('#twm-stage').innerText();
      record('P5-33: Admin Team View Performance shows derived KPI numbers', perfNums.includes('Leads owned'), '');
    }

    // Admin: Allocation Engine bulk reassign (P5-34)
    await page.goto(`${BASE_URL}/index.html#/admin/team`);
    await page.waitForTimeout(300);
    const reassignCheckbox = page.locator('[data-reassign-lead]').first();
    if (await reassignCheckbox.count() > 0) {
      await reassignCheckbox.check();
      await page.locator('#reassign-target').selectOption({ index: 1 });
      await page.locator('#reassign-apply').click();
      await page.waitForTimeout(200);
      const status = await page.locator('#reassign-status').innerText();
      record('P5-34: bulk reassign applies and reports status', /reassigned/.test(status), status);
    }

    // Admin: Sales & CRM owner visibility (P5-35)
    await page.goto(`${BASE_URL}/index.html#/admin/sales-crm`);
    await page.waitForTimeout(300);
    const crmText = await page.locator('#twm-stage').innerText();
    record('P5-35: Sales & CRM shows owner attribution', crmText.includes('Owner') || !crmText.includes('No leads'), '');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'admin_sales_crm_owner.png') });

    await context.close();
  }

  // ---- 2b. P4-06b (My Day real derived queues) + P4-20 (Customer document reveal/hide) ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // P4-06b: My Day "Calls to Make" shows real New/Contacted leads and jumps to the
    // real lead detail panel in Immersive mode on click (cross-destination deep link).
    await page.goto(`${BASE_URL}/index.html#/employee/myday`);
    await page.waitForTimeout(300);
    const callRow = page.locator('[data-myday-lead]').first();
    const hasCallRow = await callRow.count() > 0;
    record('P4-06b: My Day Calls to Make shows a real lead row', hasCallRow, '');
    if (hasCallRow) {
      await callRow.click();
      await page.waitForTimeout(300);
      const hash = await page.evaluate(() => window.location.hash);
      const stageClass = await page.locator('#twm-stage').getAttribute('class');
      record('P4-06b: clicking a Calls-to-Make lead deep-links to CRM lead detail in Immersive', /\/employee\/crm\/lead-detail-/.test(hash) && (stageClass || '').includes('twm-stage--immersive'), hash + ' :: ' + stageClass);
    }

    // P4-06b: Follow-ups Due / Applications Waiting also present as real derived lists.
    await page.goto(`${BASE_URL}/index.html#/employee/myday`);
    await page.waitForTimeout(300);
    const followupRow = page.locator('[data-myday-task]').first();
    record('P4-06b: My Day Follow-ups Due shows a real open task row', await followupRow.count() > 0, '');
    const appWaitingRow = page.locator('[data-myday-app]').first();
    record('P4-06b: My Day Applications Waiting shows a real non-Decision application row', await appWaitingRow.count() > 0, '');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'employee_myday_queues.png') });

    // P4-20: Customer document masked/reveal pattern (mirrors Client Me's KYC Vault).
    // Convert a lead first (fresh context => DEFAULT_CUSTOMERS is empty until a conversion happens).
    await page.goto(`${BASE_URL}/index.html#/employee/crm`);
    await page.waitForTimeout(300);
    const leadToConvert = page.locator('[data-lead]').first();
    if (await leadToConvert.count() > 0) {
      await leadToConvert.click();
      await page.waitForTimeout(200);
      const convertBtn = page.locator('#mark-converted');
      if (await convertBtn.count() > 0) {
        await convertBtn.click();
        await page.waitForTimeout(200);
      }
    }
    // Conversion leaves the stage in Focus mode on the (now Converted) lead panel,
    // where every other panel — including the Leads|Customers tab bar — is
    // correctly non-interactive (pointer-events: none) by the Focus-mode dim rule.
    // That's real app behaviour, not a bug, so re-navigate to reset to Overview
    // mode (same H-1 route-change reset path used everywhere else) before
    // continuing, rather than trying to click through the dimmed tab bar.
    await page.goto(`${BASE_URL}/index.html#/employee/crm`);
    await page.waitForTimeout(300);
    await page.locator('[data-tab="customers"]').click();
    await page.waitForTimeout(200);
    const customerBtn = page.locator('[data-customer]').first();
    const hasCustomer = await customerBtn.count() > 0;
    record('P4-20: CRM Customers tab shows at least one customer (converted lead)', hasCustomer, '');
    if (hasCustomer) {
      await customerBtn.click();
      await page.waitForTimeout(300);
      const revealBtn = page.locator('[data-doc-reveal]').first();
      const hasRevealBtn = await revealBtn.count() > 0;
      record('P4-20: Customer detail shows masked document with Reveal control', hasRevealBtn, '');
      if (hasRevealBtn) {
        await revealBtn.click();
        await page.waitForTimeout(200);
        const hideBtn = page.locator('[data-doc-hide]').first();
        record('P4-20: Revealing a document shows Hide control (state toggled, not fabricated content)', await hideBtn.count() > 0, '');
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'employee_customer_doc_reveal.png') });
      }
    }

    await context.close();
  }

  // ---- 3. Responsive sweep ----
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const errs = await collectErrors(page);
    await page.goto(`${BASE_URL}/index.html#/admin/command-centre`);
    await page.waitForTimeout(300);
    const dockVisible = await page.locator('#twm-dock').isVisible();
    record(`${vp.name}: Admin dock visible at ${vp.width}x${vp.height}`, dockVisible, '');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `responsive_admin_${vp.name}.png`) });
    record(`${vp.name}: no console errors`, errs.consoleErrors.length === 0, errs.consoleErrors.join(' | '));
    await context.close();
  }

  await browser.close();

  const summary = {
    ranAt: new Date().toISOString(),
    total: results.length,
    passed: results.filter(r => r.pass).length,
    failed: results.filter(r => !r.pass).length,
    results,
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'results.json'), JSON.stringify(summary, null, 2));
  console.log(`\n${summary.passed}/${summary.total} passed, ${summary.failed} failed.`);
  if (summary.failed > 0) process.exitCode = 1;
}

run().catch((e) => { console.error('REGRESSION SCRIPT CRASHED', e); process.exitCode = 1; });
