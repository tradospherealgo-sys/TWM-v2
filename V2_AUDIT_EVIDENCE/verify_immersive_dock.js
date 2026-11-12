const { chromium } = require('playwright');
const path = require('path');
const EVID = '/tmp/twm_audit_evidence';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/anshhdodia/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // Direct panel-level route (immersive mode) on a clean load
  await page.goto('http://localhost:8743/index.html#/employee/more/internal-chat', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const stageClass = await page.getAttribute('.twm-stage', 'class');
  const dockClass = await page.getAttribute('#twm-dock', 'class');
  const dockComputed = await page.evaluate(() => {
    const d = document.getElementById('twm-dock');
    const cs = getComputedStyle(d);
    return { opacity: cs.opacity, display: cs.display, transform: cs.transform };
  });
  console.log('stage class (immersive):', stageClass);
  console.log('dock class:', dockClass);
  console.log('dock computed:', JSON.stringify(dockComputed));
  await page.screenshot({ path: path.join(EVID, 'screenshots', 'phase2_immersive_dock_minimized.png') });

  // AI FAB & breadcrumb role-gating re-check (fresh, independent of the batch script)
  await page.goto('http://localhost:8743/index.html#/client/home', { waitUntil: 'load' });
  await page.waitForTimeout(100);
  const fabClient = await page.evaluate(() => getComputedStyle(document.getElementById('twm-ai-fab')).display);
  await page.goto('http://localhost:8743/index.html#/admin/command-centre', { waitUntil: 'load' });
  await page.waitForTimeout(100);
  const fabAdmin = await page.evaluate(() => getComputedStyle(document.getElementById('twm-ai-fab')).display);
  const breadcrumbAdmin = await page.evaluate(() => getComputedStyle(document.getElementById('twm-breadcrumbs')).display);
  console.log('FAB display on client:', fabClient, '| FAB display on admin:', fabAdmin, '| breadcrumbs display on admin:', breadcrumbAdmin);

  await browser.close();
})();
