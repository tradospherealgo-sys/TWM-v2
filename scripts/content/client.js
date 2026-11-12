/*
  TWM V2 — Client workspace content (Phase 3)
  Source of truth: 04_CLIENT_INTERFACE.md (confirmed 2026-11-10).
  Honesty rules applied throughout: no fabricated holdings/balances/returns/lender
  names/interest rates/insurer names; gated data shows a Connect-SMC banner, not
  fake numbers; Practice-mode panels carry the PRACTICE ribbon + delay disclosure.
  Any chart call with no real series renders the standard honest empty-state
  (TwmChart never invents numbers) — chart data feeds are a backend concern
  (04_CLIENT_INTERFACE.md), the frontend surface is what this phase builds.
*/
window.TwmClientContent = (function () {
  let smcConnected = false; // prototype-only toggle, simulates the Connect/Disconnect gating pattern
  let tradeMode = 'practice'; // Practice | Live — fixed chrome, not user-movable
  let homeBranch = null; // selected Journey-map branch, Home-only UI state

  // ---------------- shared helpers ----------------
  function connectBanner(label) {
    return `<div class="twm-state-empty" style="padding:24px">
      <div>${label}</div>
      <button class="twm-btn twm-btn--primary" id="twm-connect-smc">Connect SMC Account</button>
    </div>`;
  }

  function wireConnectButtons(el) {
    const connectBtn = el.querySelector('#twm-connect-smc');
    if (connectBtn) connectBtn.addEventListener('click', () => { smcConnected = true; window.TwmForceRender(); });
    const disconnectBtn = el.querySelector('#twm-disconnect-smc');
    if (disconnectBtn) disconnectBtn.addEventListener('click', () => { smcConnected = false; window.TwmForceRender(); });
  }

  function goTo(role, destination, panelId) {
    TwmRouter.navigate(role, destination, panelId);
  }

  // Shared DPDP confirmation flow — used by both "Me > Consents & Data Rights"
  // and "Me > Delete Account" (same underlying request flow, per spec).
  const dpdpRequests = JSON.parse(localStorage.getItem('twm-dpdp-requests') || '[]');
  function fileDpdpRequest(kind) {
    dpdpRequests.push({ id: 'dpdp' + Date.now(), kind, status: 'Submitted — under review', stage: 'Requested', ts: new Date().toISOString() });
    localStorage.setItem('twm-dpdp-requests', JSON.stringify(dpdpRequests));
    window.TwmForceRender();
  }

  // Notification preferences — persisted locally, never fabricated as "synced".
  function getNotifPrefs() {
    return Object.assign(
      { priceAlerts: true, applicationUpdates: true, promotional: false, security: true },
      JSON.parse(localStorage.getItem('twm-notif-prefs') || '{}')
    );
  }
  function setNotifPref(key, value) {
    const prefs = getNotifPrefs();
    prefs[key] = value;
    localStorage.setItem('twm-notif-prefs', JSON.stringify(prefs));
    window.TwmForceRender();
  }

  // Support tickets — persisted locally; a real backend ticketing system is out
  // of frontend-only scope, but the list/create-new UI itself is not.
  function getTickets() {
    return JSON.parse(localStorage.getItem('twm-support-tickets') || '[]');
  }
  function addTicket(subject, description) {
    const tickets = getTickets();
    tickets.unshift({ id: 't' + Date.now(), subject, description, status: 'Open', ts: new Date().toISOString() });
    localStorage.setItem('twm-support-tickets', JSON.stringify(tickets));
    window.TwmForceRender();
  }

  // AI-memory store — intentionally starts empty; no fabricated remembered facts.
  function getAiMemoryFacts() {
    return JSON.parse(localStorage.getItem('twm-ai-memory-facts') || '[]');
  }
  function deleteAiMemoryFact(id) {
    const facts = getAiMemoryFacts().filter((f) => f.id !== id);
    localStorage.setItem('twm-ai-memory-facts', JSON.stringify(facts));
    window.TwmForceRender();
  }
  function deleteAllAiMemory() {
    localStorage.setItem('twm-ai-memory-facts', '[]');
    window.TwmForceRender();
  }

  // KYC Vault reveal state — per-document, resets each session (not persisted,
  // since "revealed" is a sensitive transient UI state, not something to cache).
  const kycRevealed = {};

  // ---------------- Home ----------------
  const JOURNEY_BRANCHES = [
    { id: 'demat', label: 'Demat & Account Services', desc: 'Open a demat & trading account to start investing.', go: () => goTo('client', 'services', 'cat-invest') },
    { id: 'insurance', label: 'Insurance', desc: 'Explore protection products for you and your family.', go: () => goTo('client', 'services', 'cat-protect') },
    { id: 'ipo', label: 'IPO Discovery', desc: 'Browse upcoming and open IPOs.', go: () => goTo('client', 'markets', 'news-ipo') },
    { id: 'learning', label: 'Financial Learning', desc: 'Short lessons on investing basics.', go: () => window.TwmSetFocus('focus', 'learning') },
    { id: 'practice', label: 'Practice Trading', desc: 'Try the markets with simulated funds — zero risk.', go: () => goTo('client', 'trade') },
    { id: 'additional', label: 'Additional Financial Services', desc: 'Loans and financing options.', go: () => goTo('client', 'services', 'cat-borrow') },
  ];

  function homeScreen() {
    return {
      title: 'Home',
      breadcrumb: ['Client', 'Home'],
      panels: [
        {
          id: 'journey-hero',
          title: 'Your Financial Journey',
          render: (el) => {
            const selected = JOURNEY_BRANCHES.find((b) => b.id === homeBranch);
            el.innerHTML = `<p style="color:var(--twm-text-secondary);font-size:14px;margin-bottom:12px">Interactive Financial Journey — pick a branch to explore.</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${JOURNEY_BRANCHES.map((b) => `<button class="twm-chip twm-btn" data-branch="${b.id}" style="border:1px solid ${b.id === homeBranch ? 'var(--twm-accent-cyan)' : 'transparent'};min-height:auto;padding:6px 12px">${b.label}</button>`).join('')}
            </div>
            ${selected ? `<div class="twm-glass" style="margin-top:14px;padding:14px;border-radius:var(--twm-radius-md)">
              <p style="font-size:13px;color:var(--twm-text-secondary);margin-bottom:10px">${selected.desc}</p>
              <button class="twm-btn twm-btn--primary" id="journey-continue">Continue →</button>
            </div>` : ''}`;
            el.querySelectorAll('[data-branch]').forEach((btn) => btn.addEventListener('click', () => { homeBranch = btn.dataset.branch; window.TwmForceRender(); }));
            const continueBtn = el.querySelector('#journey-continue');
            if (continueBtn && selected) continueBtn.addEventListener('click', selected.go);
          },
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          render: (el) => {
            el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
              <button class="twm-btn twm-btn--secondary" data-action="demat">Open Demat Account</button>
              <button class="twm-btn twm-btn--secondary" data-action="practice">Practice Trading</button>
              <button class="twm-btn twm-btn--secondary" data-action="insurance">Insurance</button>
              <button class="twm-btn twm-btn--secondary" data-action="ipo">Explore IPOs</button>
            </div>`;
            const actions = {
              demat: () => goTo('client', 'services', 'cat-invest'),
              practice: () => goTo('client', 'trade'),
              insurance: () => goTo('client', 'services', 'cat-protect'),
              ipo: () => goTo('client', 'markets', 'news-ipo'),
            };
            el.querySelectorAll('[data-action]').forEach((btn) => btn.addEventListener('click', () => actions[btn.dataset.action]()));
          },
        },
        {
          id: 'market-panel',
          title: 'Market Intelligence',
          disclosure: 'NSE · delayed data',
          immersive: true,
          render: (el) => {
            el.innerHTML = `<div class="twm-chip">NIFTY 50</div>
              ${TwmChart.sparkline(null, { emptyLabel: 'Live index chart renders once the Market Data integration is connected (Admin → More → Integrations).' })}
              <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Expandable panel — click to expand, "Open full view" for the full-stage view. See Markets for the full hub.</p>`;
          },
          onFocus: () => window.TwmSetFocus('focus', 'market-panel'),
        },
        {
          id: 'portfolio-preview',
          title: 'Educational Portfolio Preview',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">Illustrative preview only — not a connected real portfolio. No holdings, balances or returns are shown unless an actual account is linked.</div>`; },
        },
        {
          id: 'next-step',
          title: 'Your Next Step',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">${homeBranch ? 'Continue your selected journey above, or pick a different branch.' : 'Pick a branch above to see your next step.'}</div>`; },
        },
        {
          id: 'ipb-discovery',
          title: 'Invest / Protect / Borrow',
          render: (el) => {
            el.innerHTML = `<div style="display:flex;gap:8px">
              <button class="twm-chip twm-btn" data-cat="cat-invest" style="min-height:auto;padding:6px 12px">Invest</button>
              <button class="twm-chip twm-btn" data-cat="cat-protect" style="min-height:auto;padding:6px 12px">Protect</button>
              <button class="twm-chip twm-btn" data-cat="cat-borrow" style="min-height:auto;padding:6px 12px">Borrow</button>
            </div><p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Deep-links into Services — not a duplicate build.</p>`;
            el.querySelectorAll('[data-cat]').forEach((btn) => btn.addEventListener('click', () => goTo('client', 'services', btn.dataset.cat)));
          },
        },
        {
          id: 'applications-tracking',
          title: 'Applications & Status',
          render: (el) => { el.innerHTML = `<div class="twm-state-empty">No applications submitted yet.</div>`; },
          onFocus: () => goTo('client', 'services', 'my-applications'),
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
          onFocus: () => goTo('client', 'me', 'me-notifications'),
        },
      ],
    };
  }

  // ---------------- Markets ----------------
  function marketsScreen() {
    const panels = [
      {
        id: 'index-strip', title: 'Index Strip', disclosure: 'NSE · delayed', immersive: true,
        render: (el) => {
          el.innerHTML = `<div style="display:flex;gap:16px;margin-bottom:10px"><span class="twm-num">NIFTY 50</span><span class="twm-num">SENSEX</span></div>
            ${TwmChart.sparkline(null, { emptyLabel: 'Index chart + key stats render once the Market Data integration is connected.' })}`;
        },
      },
      {
        id: 'sector-performance', title: 'Sector Performance', immersive: true,
        render: (el) => { el.innerHTML = TwmChart.columns(null, { emptyLabel: 'Sector performance panel — public data, no connection required. Renders once the feed is live.' }); },
      },
      {
        id: 'watchlist', title: 'Personal Watchlist',
        render: (el) => {
          if (!smcConnected) { el.innerHTML = connectBanner('Connect your SMC account to build a personal watchlist.'); wireConnectButtons(el); }
          else { el.innerHTML = `<div class="twm-state-empty">Your watchlist is empty. Add symbols freely.</div>`; }
        },
      },
      { id: 'movers', title: 'Market Movers', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Top gainers/losers — public data.</div>`; } },
      { id: 'news-ipo', title: 'News & IPO Highlights', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Compact feed + IPO teaser cards.</div><p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Apply flow lives in Home → Explore IPOs / Services, not duplicated here.</p>`; } },
      {
        id: 'signals', title: 'Signals',
        render: (el) => { el.innerHTML = `<div class="twm-state-empty">No signals published yet — Admin's Signals Desk is in Shadow Mode (internal scorecard only). Once a signal publishes, it appears here with a "Trade this" deep-link into Trade's Live mode.</div>`; },
      },
    ];
    panels.forEach((p) => { if (!p.onFocus) p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Markets', breadcrumb: ['Client', 'Markets'], panels };
  }

  // ---------------- Trade ----------------
  function fnoPayoffPanel() {
    return {
      id: 'practice-fno', title: 'F&O Payoff Simulator',
      disclosure: 'PRACTICE / SIMULATED · payoff is computed locally, not a real quote',
      immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'practice-fno'),
      render: (el) => {
        const state = { type: 'call', strike: 100, premium: 5, qty: 1 };
        const renderSim = () => {
          const spots = [];
          for (let s = state.strike - 40; s <= state.strike + 40; s += 10) spots.push(s);
          const payoff = spots.map((s) => {
            const intrinsic = state.type === 'call' ? Math.max(s - state.strike, 0) : Math.max(state.strike - s, 0);
            return (intrinsic - state.premium) * state.qty;
          });
          el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px">
            <select class="twm-input" id="fno-type" style="width:auto;min-width:100px">
              <option value="call" ${state.type === 'call' ? 'selected' : ''}>Call</option>
              <option value="put" ${state.type === 'put' ? 'selected' : ''}>Put</option>
            </select>
            <input class="twm-input" id="fno-strike" type="number" value="${state.strike}" style="width:auto;min-width:100px" placeholder="Strike">
            <input class="twm-input" id="fno-premium" type="number" value="${state.premium}" style="width:auto;min-width:100px" placeholder="Premium">
            <input class="twm-input" id="fno-qty" type="number" value="${state.qty}" style="width:auto;min-width:80px" placeholder="Qty">
          </div>
          ${TwmChart.sparkline(payoff, { ariaLabel: 'payoff curve', color: 'var(--twm-emerald)' })}
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--twm-text-muted);margin-top:4px">
            <span>Spot ${spots[0]}</span><span>Strike ${state.strike}</span><span>Spot ${spots[spots.length - 1]}</span>
          </div>
          <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Simulated payoff only — strike/premium are user-entered inputs, not live option-chain data.</p>`;
          ['fno-type', 'fno-strike', 'fno-premium', 'fno-qty'].forEach((id) => {
            el.querySelector('#' + id).addEventListener('input', (e) => {
              if (id === 'fno-type') state.type = e.target.value;
              if (id === 'fno-strike') state.strike = Number(e.target.value) || 0;
              if (id === 'fno-premium') state.premium = Number(e.target.value) || 0;
              if (id === 'fno-qty') state.qty = Number(e.target.value) || 1;
              renderSim();
            });
          });
        };
        renderSim();
      },
    };
  }

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
        onFocus: () => window.TwmSetFocus('focus', 'practice-' + i),
        render: (el) => {
          el.innerHTML = i === 0
            ? `<div class="twm-num" style="font-size:22px"><span class="twm-chip twm-chip--practice">Practice</span> ₹10,00,000.00</div>`
            : `<div class="twm-state-empty">${t} — practice/simulated data.</div>`;
        },
      }));
      modePanels.push(fnoPayoffPanel());
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
  function myApplicationsPanel() {
    let state = 'loading'; // loading -> error (demo) -> loading -> empty
    return {
      id: 'my-applications', title: 'My Applications',
      render: (el) => {
        const show = () => {
          if (state === 'loading') {
            el.innerHTML = `<div class="twm-state-loading"><div class="twm-skeleton" style="width:100%;height:14px;margin-bottom:8px"></div><div class="twm-skeleton" style="width:70%;height:14px"></div><p style="margin-top:12px">Checking for your applications…</p></div>`;
            setTimeout(() => { state = state === 'loading' && !el.dataset.retried ? 'error' : 'empty'; show(); }, 700);
          } else if (state === 'error') {
            el.innerHTML = `<div class="twm-state-error">Couldn't reach the applications service. <button class="twm-btn twm-btn--secondary" id="apps-retry" style="margin-top:10px">Retry</button></div>`;
            el.querySelector('#apps-retry').addEventListener('click', () => { el.dataset.retried = '1'; state = 'loading'; show(); });
          } else {
            el.innerHTML = `<div class="twm-state-empty">No applications submitted yet. Independent destination — not nested inside a category.</div>`;
          }
        };
        show();
      },
    };
  }

  function servicesScreen() {
    const categories = [
      { group: 'Invest', items: ['Demat & Trading Account', 'Mutual Funds & SIP', 'IPO'] },
      { group: 'Protect', items: ['Insurance', 'Wealth & Protection'] },
      { group: 'Borrow', items: ['Loans & Financing'] },
    ];
    const hero = {
      id: 'services-hero', title: 'What are you trying to do today?',
      render: (el) => {
        el.innerHTML = `<p style="font-size:14px;color:var(--twm-text-secondary);margin-bottom:12px">Pick a goal — we'll take you to the right category below.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="twm-btn twm-btn--secondary" data-goal="cat-invest">Grow my money</button>
          <button class="twm-btn twm-btn--secondary" data-goal="cat-protect">Protect my family</button>
          <button class="twm-btn twm-btn--secondary" data-goal="cat-borrow">Get financing</button>
        </div>`;
        el.querySelectorAll('[data-goal]').forEach((btn) => btn.addEventListener('click', () => window.TwmSetFocus('focus', btn.dataset.goal)));
      },
    };
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
    panels.unshift(hero);
    panels.push(myApplicationsPanel());
    return { title: 'Services', breadcrumb: ['Client', 'Services'], panels };
  }

  // ---------------- Me ----------------
  const KYC_DOCS = [
    { id: 'pan', label: 'PAN Card' },
    { id: 'aadhaar', label: 'Aadhaar' },
    { id: 'bank-proof', label: 'Bank Proof' },
  ];

  function kycVaultPanel() {
    return {
      id: 'me-kyc-vault', title: 'KYC Vault', immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'me-kyc-vault'),
      render: (el) => {
        el.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">
          ${KYC_DOCS.map((d) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
            <span class="twm-chip">${d.label}</span>
            ${kycRevealed[d.id]
              ? `<span style="font-size:12px;color:var(--twm-text-secondary)">Document preview would load from secure storage once KYC is verified.</span> <button class="twm-btn twm-btn--secondary" data-hide="${d.id}" style="padding:4px 10px;font-size:12px">Hide</button>`
              : `<span style="font-size:12px;color:var(--twm-text-muted)">•••• masked</span> <button class="twm-btn twm-btn--secondary" data-reveal="${d.id}" style="padding:4px 10px;font-size:12px">Reveal</button>`}
          </div>`).join('')}
        </div>`;
        el.querySelectorAll('[data-reveal]').forEach((btn) => btn.addEventListener('click', () => { kycRevealed[btn.dataset.reveal] = true; window.TwmForceRender(); }));
        el.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => { kycRevealed[btn.dataset.hide] = false; window.TwmForceRender(); }));
      },
    };
  }

  function consentsPanel() {
    return {
      id: 'me-consents-data-rights', title: 'Consents & Data Rights', immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'me-consents-data-rights'),
      render: (el) => {
        const facts = getAiMemoryFacts();
        el.innerHTML = `<div class="twm-state-empty" style="padding:16px">No consent records yet.</div>
        <div style="display:flex;gap:10px;margin:12px 0;flex-wrap:wrap">
          <button class="twm-btn twm-btn--secondary" id="req-data">Request my data</button>
          <button class="twm-btn twm-btn--secondary" id="req-delete">Request account deletion</button>
        </div>
        ${dpdpRequests.length ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
          ${dpdpRequests.slice(-3).map((r) => `<div class="twm-chip twm-chip--warm">${r.kind} — ${r.status}</div>`).join('')}
        </div>` : ''}
        <p style="font-size:12px;color:var(--twm-text-muted);margin-bottom:8px">Requests are reviewed, never instant.</p>
        <div class="twm-panel__title" style="font-size:14px;margin-top:14px">AI Memory</div>
        <p style="font-size:12px;color:var(--twm-text-muted);margin-bottom:8px">Rolling conversation summary and remembered facts, with per-item delete and delete-all.</p>
        ${facts.length === 0
          ? `<div class="twm-state-empty" style="padding:16px">No AI memory recorded yet.</div>`
          : `<div style="display:flex;flex-direction:column;gap:6px">${facts.map((f) => `<div style="display:flex;justify-content:space-between;gap:8px"><span>${f.text}</span><button class="twm-btn twm-btn--secondary" data-del-fact="${f.id}" style="padding:2px 8px;font-size:11px">Delete</button></div>`).join('')}</div>`}
        <button class="twm-btn twm-btn--secondary" id="delete-all-memory" style="margin-top:10px" ${facts.length === 0 ? 'disabled' : ''}>Delete all</button>`;
        el.querySelector('#req-data').addEventListener('click', () => fileDpdpRequest('Request my data'));
        el.querySelector('#req-delete').addEventListener('click', () => fileDpdpRequest('Request account deletion'));
        el.querySelector('#delete-all-memory').addEventListener('click', deleteAllAiMemory);
        el.querySelectorAll('[data-del-fact]').forEach((btn) => btn.addEventListener('click', () => deleteAiMemoryFact(btn.dataset.delFact)));
      },
    };
  }

  function notificationsPanel() {
    const LABELS = { priceAlerts: 'Price alerts', applicationUpdates: 'Application updates', promotional: 'Promotional offers', security: 'Security alerts' };
    return {
      id: 'me-notifications', title: 'Notifications',
      onFocus: () => window.TwmSetFocus('focus', 'me-notifications'),
      render: (el) => {
        const prefs = getNotifPrefs();
        el.innerHTML = Object.keys(LABELS).map((key) => `<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--twm-border-glass)">
          <span>${LABELS[key]}</span>
          <input type="checkbox" data-pref="${key}" ${prefs[key] ? 'checked' : ''} style="width:20px;height:20px">
        </label>`).join('');
        el.querySelectorAll('[data-pref]').forEach((cb) => cb.addEventListener('change', (e) => setNotifPref(cb.dataset.pref, e.target.checked)));
      },
    };
  }

  function supportTicketsPanel() {
    return {
      id: 'me-support-tickets', title: 'Support Tickets',
      onFocus: () => window.TwmSetFocus('focus', 'me-support-tickets'),
      render: (el) => {
        const tickets = getTickets();
        el.innerHTML = `<button class="twm-btn twm-btn--primary" id="new-ticket" style="margin-bottom:12px">Create ticket</button>
        <div id="ticket-form" style="display:none;flex-direction:column;gap:8px;margin-bottom:12px">
          <input class="twm-input" id="ticket-subject" placeholder="Subject">
          <input class="twm-input" id="ticket-desc" placeholder="Describe the issue">
          <button class="twm-btn twm-btn--secondary" id="ticket-submit" style="align-self:flex-start">Submit</button>
        </div>
        ${tickets.length === 0 ? `<div class="twm-state-empty">No tickets yet.</div>` : `<div style="display:flex;flex-direction:column;gap:8px">${tickets.map((t) => `<div class="twm-glass" style="padding:10px;border-radius:var(--twm-radius-md)"><div style="display:flex;justify-content:space-between"><strong style="font-size:13px">${t.subject}</strong><span class="twm-chip">${t.status}</span></div><p style="font-size:12px;color:var(--twm-text-secondary);margin-top:4px">${t.description}</p></div>`).join('')}</div>`}`;
        const form = el.querySelector('#ticket-form');
        el.querySelector('#new-ticket').addEventListener('click', () => { form.style.display = form.style.display === 'none' ? 'flex' : 'none'; });
        el.querySelector('#ticket-submit').addEventListener('click', () => {
          const subject = el.querySelector('#ticket-subject').value.trim();
          const description = el.querySelector('#ticket-desc').value.trim();
          if (!subject) return;
          addTicket(subject, description);
        });
      },
    };
  }

  function deleteAccountPanel() {
    return {
      id: 'me-delete-account', title: 'Delete Account', immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'me-delete-account'),
      render: (el) => {
        el.innerHTML = `<div class="twm-state-empty" style="padding:16px">Triggers the same request-deletion flow as Consents & Data Rights.</div>
        <button class="twm-btn twm-btn--secondary" id="delete-account-btn" style="margin-top:10px">Request account deletion</button>`;
        el.querySelector('#delete-account-btn').addEventListener('click', () => fileDpdpRequest('Request account deletion'));
      },
    };
  }

  function meScreen() {
    const panels = [
      { id: 'me-profile', title: 'Profile', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Profile — fixed, non-draggable panel.</div>`; }, onFocus: () => window.TwmSetFocus('focus', 'me-profile') },
      kycVaultPanel(),
      {
        id: 'me-linked-accounts', title: 'Linked Accounts',
        onFocus: () => window.TwmSetFocus('focus', 'me-linked-accounts'),
        render: (el) => {
          el.innerHTML = smcConnected
            ? `<span class="twm-chip twm-chip--success">SMC — Connected</span> <button class="twm-btn twm-btn--secondary" id="twm-disconnect-smc" style="margin-left:10px">Disconnect</button>`
            : connectBanner('No linked broker account.');
          wireConnectButtons(el);
        },
      },
      consentsPanel(),
      notificationsPanel(),
      supportTicketsPanel(),
    ];
    panels.push({ id: 'me-applications-shortcut', title: 'My Applications', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Shortcut only — deep-links to Services → My Applications. No second tracker here.</div>`; }, onFocus: () => goTo('client', 'services', 'my-applications') });
    panels.push(deleteAccountPanel());
    return { title: 'Me', breadcrumb: ['Client', 'Me'], panels };
  }

  function getScreen(destinationId, panelId) {
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
