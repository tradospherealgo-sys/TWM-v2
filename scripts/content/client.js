/*
  TWM V2 — Client workspace content (Phase 3)
  Source of truth: 04_CLIENT_INTERFACE.md (confirmed 2026-11-10).
  Honesty rules applied throughout: no fabricated holdings/balances/returns/lender
  names/interest rates/insurer names; gated data shows a Connect-SMC banner, not
  fake numbers; Practice-mode panels carry the PRACTICE ribbon + delay disclosure.
*/
window.TwmClientContent = (function () {
  let smcConnected = false; // prototype-only toggle, simulates the Connect/Disconnect gating pattern
  let tradeMode = 'practice'; // Practice | Live — fixed chrome, not user-movable

  function connectBanner(label) {
    return `<div class="twm-state-empty" style="padding:24px">
      <div>${label}</div>
      <button class="twm-btn twm-btn--primary" id="twm-connect-smc">Connect SMC Account</button>
    </div>`;
  }

  function wireConnectButtons(el) {
    const btn = el.querySelector('#twm-connect-smc');
    if (btn) btn.addEventListener('click', () => { smcConnected = true; window.TwmForceRender(); });
  }

  // ---------------- Home ----------------
  function homeScreen() {
    return {
      title: 'Home',
      breadcrumb: ['Client', 'Home'],
      panels: [
        {
          id: 'journey-hero',
          title: 'Your Financial Journey',
          render: (el) => {
            el.innerHTML = `<p style="color:var(--twm-text-secondary);font-size:14px;margin-bottom:12px">Interactive Financial Journey — pick a branch to explore.</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${['Demat & Account Services','Insurance','IPO Discovery','Financial Learning','Practice Trading','Additional Financial Services']
                .map(b => `<span class="twm-chip">${b}</span>`).join('')}
            </div>`;
          },
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          render: (el) => {
            el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
              ${['Open Demat Account','Practice Trading','Insurance','Explore IPOs']
                .map(a => `<button class="twm-btn twm-btn--secondary">${a}</button>`).join('')}
            </div>`;
          },
        },
        {
          id: 'market-panel',
          title: 'Market Intelligence',
          disclosure: 'NSE · delayed data',
          render: (el) => { el.innerHTML = `<div class="twm-chip">NIFTY 50</div> <span class="twm-num" style="margin-left:8px;color:var(--twm-text-muted)">Expandable floating panel — see Markets for full hub</span>`; },
        },
        {
          id: 'portfolio-preview',
          title: 'Educational Portfolio Preview',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">Illustrative preview only — not a connected real portfolio. No holdings, balances or returns are shown unless an actual account is linked.</div>`; },
        },
        {
          id: 'next-step',
          title: 'Your Next Step',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">Personalised next-step guidance — content depends on your actual journey progress.</div>`; },
        },
        {
          id: 'ipb-discovery',
          title: 'Invest / Protect / Borrow',
          render: (el) => { el.innerHTML = `<div style="display:flex;gap:8px">${['Invest','Protect','Borrow'].map(x=>`<span class="twm-chip">${x}</span>`).join('')}</div><p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Deep-links into Services — not a duplicate build.</p>`; },
        },
        {
          id: 'applications-tracking',
          title: 'Applications & Status',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">No applications submitted yet.</div>`; },
        },
        {
          id: 'learning',
          title: 'Learning',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">Financial-learning content module.</div>`; },
        },
        {
          id: 'notifications',
          title: 'Notifications',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">No new notifications.</div>`; },
        },
      ],
    };
  }

  // ---------------- Markets ----------------
  function marketsScreen() {
    const panels = [
      { id: 'index-strip', title: 'Index Strip', disclosure: 'NSE · delayed', render: (el) => { el.innerHTML = `<div style="display:flex;gap:16px"><span class="twm-num">NIFTY 50</span><span class="twm-num">SENSEX</span></div>`; } },
      { id: 'sector-performance', title: 'Sector Performance', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Sector performance panel — public data, no connection required.</div>`; } },
      {
        id: 'watchlist', title: 'Personal Watchlist',
        render: (el) => {
          if (!smcConnected) { el.innerHTML = connectBanner('Connect your SMC account to build a personal watchlist.'); wireConnectButtons(el); }
          else { el.innerHTML = `<div class="twm-state-empty">Your watchlist is empty. Add symbols freely.</div>`; }
        },
      },
      { id: 'movers', title: 'Market Movers', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Top gainers/losers — public data.</div>`; } },
      { id: 'news-ipo', title: 'News & IPO Highlights', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Compact feed + IPO teaser cards.</div><p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Apply flow lives in Home → Explore IPOs / Services, not duplicated here.</p>`; } },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Markets', breadcrumb: ['Client', 'Markets'], panels };
  }

  // ---------------- Trade ----------------
  function tradeScreen() {
    const tabPanel = {
      id: 'trade-tabs', title: '',
      render: (el) => {
        el.innerHTML = `<div class="twm-segmented" role="tablist">
          <button class="twm-segmented__item" data-mode="practice" role="tab" aria-selected="${tradeMode==='practice'}">Practice</button>
          <button class="twm-segmented__item" data-mode="live" role="tab" aria-selected="${tradeMode==='live'}">Live</button>
        </div>`;
        el.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => { tradeMode = btn.dataset.mode; window.TwmForceRender(); }));
      },
    };

    let modePanels;
    if (tradeMode === 'practice') {
      modePanels = ['Balance','Positions / Order Book','Session P&L','Journal / Analytics'].map((t, i) => ({
        id: 'practice-' + i,
        title: t,
        disclosure: 'PRACTICE / SIMULATED · 15-min / EOD delayed data',
        render: (el) => {
          el.innerHTML = i === 0
            ? `<div class="twm-num" style="font-size:22px"><span class="twm-chip twm-chip--practice">Practice</span> ₹10,00,000.00</div>`
            : `<div class="twm-state-empty">${t} — practice/simulated data.</div>`;
        },
      }));
    } else if (!smcConnected) {
      modePanels = [{ id: 'live-gate', title: 'Live Trading', render: (el) => { el.innerHTML = connectBanner('Connect your SMC account to view live positions, funds and order book.'); wireConnectButtons(el); } }];
    } else {
      modePanels = [{
        id: 'live-connected', title: 'Live — Connected',
        disclosure: 'In-app order booking is pending SMC\'s written approval — orders are placed in SMC Ace.',
        render: (el) => {
          el.innerHTML = `<div class="twm-state-empty">Real positions/funds/order book would appear here once pulled from the live SMC session.</div>
          <button class="twm-btn twm-btn--primary" style="margin-top:12px">Continue in SMC Ace</button>`;
        },
      }];
    }

    return { title: 'Trade', breadcrumb: ['Client', 'Trade', tradeMode === 'practice' ? 'Practice' : 'Live'], panels: [tabPanel, ...modePanels] };
  }

  // ---------------- Services ----------------
  function servicesScreen() {
    const categories = [
      { group: 'Invest', items: ['Demat & Trading Account', 'Mutual Funds & SIP', 'IPO'] },
      { group: 'Protect', items: ['Insurance', 'Wealth & Protection'] },
      { group: 'Borrow', items: ['Loans & Financing'] },
    ];
    const panels = categories.map(c => ({
      id: 'cat-' + c.group.toLowerCase(),
      title: c.group,
      render: (el) => {
        el.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px">${c.items.map(i => `<span class="twm-chip">${i}</span>`).join('')}</div>`;
        if (c.group === 'Borrow') {
          el.innerHTML += `<p style="font-size:12px;color:var(--twm-text-muted);margin-top:10px">
            PWA journey: full loan-origination flow. Google Play journey: "Talk to an Advisor" only — restriction enforced server-side (not implemented here).
            <span class="twm-badge twm-badge--pending-decision">RBI/Play restriction — provisional, pending compliance review</span></p>`;
        }
        if (c.group === 'Protect') {
          el.innerHTML += `<p style="font-size:12px;color:var(--twm-text-muted);margin-top:10px"><span class="twm-badge twm-badge--pending-decision">Insurer/broking arrangement not yet decided</span></p>`;
        }
      },
      onFocus: () => window.TwmSetFocus('focus', 'cat-' + c.group.toLowerCase()),
    }));
    panels.push({
      id: 'my-applications', title: 'My Applications',
      render: (el) => { el.innerHTML = `<div class="twm-state-empty">No applications submitted yet. Independent destination — not nested inside a category.</div>`; },
    });
    return { title: 'Services', breadcrumb: ['Client', 'Services'], panels };
  }

  // ---------------- Me ----------------
  function meScreen() {
    const categories = [
      'Profile', 'KYC Vault', 'Linked Accounts', 'Consents & Data Rights',
      'Notifications', 'Support Tickets',
    ];
    const panels = categories.map(c => ({
      id: 'me-' + c.toLowerCase().replace(/[^a-z]+/g, '-'),
      title: c,
      render: (el) => {
        if (c === 'KYC Vault') el.innerHTML = `<div class="twm-state-empty">Documents masked by default — explicit reveal required.</div>`;
        else if (c === 'Linked Accounts') {
          el.innerHTML = smcConnected ? `<span class="twm-chip twm-chip--success">SMC — Connected</span>` : connectBanner('No linked broker account.');
          wireConnectButtons(el);
        }
        else if (c === 'Consents & Data Rights') el.innerHTML = `<div class="twm-state-empty">Read-only consent ledger. "Request my data" / "Request account deletion" are reviewed, never instant.</div>`;
        else el.innerHTML = `<div class="twm-state-empty">${c} — fixed, non-draggable panel.</div>`;
      },
      onFocus: () => window.TwmSetFocus('focus', 'me-' + c.toLowerCase().replace(/[^a-z]+/g, '-')),
    }));
    panels.push({ id: 'me-applications-shortcut', title: 'My Applications', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Shortcut only — deep-links to Services → My Applications. No second tracker here.</div>`; } });
    panels.push({ id: 'me-delete-account', title: 'Delete Account', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Visually separated. Triggers the same request-deletion flow as Consents & Data Rights.</div>`; } });
    return { title: 'Me', breadcrumb: ['Client', 'Me'], panels };
  }

  function getScreen(destinationId) {
    switch (destinationId) {
      case 'home': return homeScreen();
      case 'markets': return marketsScreen();
      case 'trade': return tradeScreen();
      case 'services': return servicesScreen();
      case 'me': return meScreen();
      default: return { title: destinationId, panels: [] };
    }
  }

  return { getScreen };
})();
