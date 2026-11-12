/*
  TWM V2 — Admin workspace content (Phase 5)
  Source of truth: 06_ADMIN_INTERFACE.md (confirmed 2026-11-11).
  Non-hallucination: no fabricated approval powers, role-permission matrices,
  regulatory status, business rules, allocation logic outcomes, signal
  outcomes, connected-service status or system-health metric values — every
  number below is illustrative-zero/empty, not invented data.
*/
window.TwmAdminContent = (function () {
  const APPLICATION_STAGES = ['Checklist', 'Documents Requested', 'Submitted for Review', 'Admin Approved / Sent Back', 'Forwarded to Lender/Insurer', 'Decision'];
  const DPDP_STAGES = ['Requested', 'Under Review', 'Action Taken'];
  const SIGNAL_STAGES = ['Capture', 'Parse', 'Validate', 'AI Review', 'Human Review', 'Publish', 'Track'];

  function kanban(stages, emptyNote) {
    return `<div class="twm-kanban">
      ${stages.map(s => `<div class="twm-kanban__column">
        <div class="twm-chip" style="align-self:flex-start">${s}</div>
        <div class="twm-state-empty" style="padding:16px">${emptyNote}</div>
      </div>`).join('')}
    </div>`;
  }

  // ---------------- Command Centre ----------------
  function commandCentreScreen() {
    const tiles = [
      { id: 'tile-users', title: 'Users', dest: 'team' },
      { id: 'tile-clients', title: 'Clients', dest: 'sales-crm' },
      { id: 'tile-leads', title: 'Leads', dest: 'sales-crm' },
      { id: 'tile-applications', title: 'Applications by Stage', dest: 'applications-review' },
      { id: 'tile-calls', title: 'Calls Today', dest: 'sales-crm' },
      { id: 'tile-signals', title: 'Signals Pending Review', dest: 'more', panel: 'signals-desk' },
      { id: 'tile-tickets', title: 'Open Tickets', dest: 'compliance' },
      { id: 'tile-health', title: 'System Health', dest: 'more', panel: 'system-health' },
    ];
    const tilePanels = tiles.map(t => ({
      id: t.id,
      title: t.title,
      render: (el) => { el.innerHTML = `<div class="twm-num" style="font-size:22px">—</div><div class="twm-state-empty" style="padding:8px 0 0">No data yet.</div>`; },
      onFocus: () => { TwmRouter.navigate('admin', t.dest, t.panel); },
    }));
    const actionStrip = {
      id: 'attention-strip',
      title: 'Needs Your Attention',
      render: (el) => {
        el.innerHTML = `<div class="twm-state-empty">No applications awaiting review, signals pending approval, or compliance requests pending action.</div>`;
      },
    };
    return { title: 'Command Centre', breadcrumb: ['Admin', 'Command Centre'], panels: [...tilePanels, actionStrip] };
  }

  // ---------------- Team ----------------
  function teamScreen() {
    const panels = [
      {
        id: 'employees', title: 'Employees',
        render: (el) => { el.innerHTML = `<div class="twm-state-empty">No employee records yet. Onboard/offboard with instant session revoke, targets and performance, and call-recording review live here.</div>`; },
      },
      {
        id: 'allocation-engine', title: 'Allocation Engine',
        render: (el) => {
          el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px">${['Manual', 'Round-Robin', 'Product Skill', 'Pincode'].map(x => `<span class="twm-chip">${x}</span>`).join('')}</div>
          <div class="twm-state-empty" style="margin-top:12px">No assignment rules configured. Bulk re-assign and rule editing live here once rules exist.</div>`;
        },
      },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Team', breadcrumb: ['Admin', 'Team'], panels };
  }

  // ---------------- Sales & CRM ----------------
  function salesCrmScreen() {
    const panels = [
      {
        id: 'org-crm', title: 'Org-wide CRM',
        render: (el) => { el.innerHTML = `<div class="twm-state-empty">No leads or customers across employees yet. Reassignment visibility lives here.</div>`; },
      },
      {
        id: 'sales-monitoring', title: 'Sales Monitoring',
        render: (el) => { el.innerHTML = `<div class="twm-state-empty">Business performance view across the pipeline — no data yet.</div>`; },
      },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Sales & CRM', breadcrumb: ['Admin', 'Sales & CRM'], panels };
  }

  // ---------------- Applications Review ----------------
  function applicationsReviewScreen() {
    const panels = [
      {
        id: 'review-actions', title: 'Admin Actions',
        render: (el) => {
          el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px">${['Document Checker (AI pre-check + human verify)', 'Approve / Send Back', 'Forward to Lender/Insurer — tracked hand-off'].map(x => `<span class="twm-chip">${x}</span>`).join('')}</div>
          <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Which admin role/permission-set can take which action <span class="twm-badge twm-badge--pending-decision">open decision</span></p>`;
        },
      },
      {
        id: 'review-stages', title: 'Stage Sequence',
        render: (el) => { el.innerHTML = kanban(APPLICATION_STAGES, 'No applications at this stage.') + `<p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Shared backbone with Employee Applications — Decision stays empty/pending until a genuine lender/insurer response exists.</p>`; },
      },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Applications Review', breadcrumb: ['Admin', 'Applications Review'], panels };
  }

  // ---------------- Compliance ----------------
  function complianceScreen() {
    const panels = [
      { id: 'consent-ledger', title: 'Consent Ledger', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No consent records yet.</div>`; } },
      { id: 'data-access-log', title: 'Data-Access Log', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No document-access events yet — who opened which document.</div>`; } },
      {
        id: 'dpdp-requests', title: 'DPDP Requests',
        render: (el) => { el.innerHTML = kanban(DPDP_STAGES, 'No requests at this stage.') + `<p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Export / erase requests — non-instant, subject to legal review. <span class="twm-badge twm-badge--pending-decision">Exact workflow states — open decision</span></p>`; },
      },
      { id: 'retention-jobs', title: 'Retention Jobs', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No retention jobs scheduled.</div>`; } },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Compliance', breadcrumb: ['Admin', 'Compliance'], panels };
  }

  // ---------------- More hub ----------------
  function integrationsPanel() {
    const services = ['SMC', 'Market Data', 'Google', 'AI Models', 'Telephony', 'WhatsApp Cloud API', 'Telegram', 'Email', 'Storage'];
    return `<div style="display:flex;flex-direction:column;gap:8px">
      ${services.map(s => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="twm-chip">${s}</span>
        <span style="font-size:12px;color:var(--twm-text-muted)">Not connected · key ••••</span>
        <div style="display:flex;gap:6px">${['Connect', 'Test', 'Health', 'Rotate'].map(a => `<button class="twm-btn twm-btn--secondary" style="padding:4px 10px;font-size:12px">${a}</button>`).join('')}</div>
      </div>`).join('')}
    </div>`;
  }

  function signalsDeskPanel() {
    return `<div class="twm-chip twm-chip--warm" style="margin-bottom:10px">Shadow Mode — default pre-RA registration</div>
    ${kanban(SIGNAL_STAGES, 'No signals at this stage.')}
    <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">
      Stages 1–4 run fully; Human Review (5) is admin-only; Publish/Track (6–7) write only to an internal scorecard while in Shadow Mode.
      The RA switch (publish gating) lives here. <span class="twm-badge twm-badge--pending-decision">Role-level control — open decision</span>
    </p>`;
  }

  function moreScreen(panelId) {
    const hubItems = [
      { id: 'integrations', title: 'Integrations', render: integrationsPanel },
      { id: 'signals-desk', title: 'Signals Desk', render: signalsDeskPanel },
      { id: 'content-sop', title: 'Content and SOP', render: () => `<div class="twm-state-empty">Knowledge articles, product catalogue and disclaimers — re-indexed into the AI knowledge base on save. No content yet.</div>` },
      { id: 'system-health', title: 'System Health', render: () => `<div class="twm-state-empty">Module presence only. <span class="twm-badge twm-badge--pending-decision">Exact states/metric definitions — open decision</span></div>` },
    ];
    if (panelId) {
      const item = hubItems.find(h => h.id === panelId) || hubItems[0];
      return {
        title: item.title, breadcrumb: ['Admin', 'More', item.title],
        panels: [{ id: item.id, title: item.title, render: (el) => { el.innerHTML = item.render(); } }],
      };
    }
    return {
      title: 'More', breadcrumb: ['Admin', 'More'],
      panels: hubItems.map(h => ({
        id: h.id, title: h.title,
        render: (el) => { el.innerHTML = h.render(); },
        onFocus: () => { TwmRouter.navigate('admin', 'more', h.id); },
      })),
    };
  }

  function getScreen(destinationId, panelId) {
    switch (destinationId) {
      case 'command-centre': return commandCentreScreen();
      case 'team': return teamScreen();
      case 'sales-crm': return salesCrmScreen();
      case 'applications-review': return applicationsReviewScreen();
      case 'compliance': return complianceScreen();
      case 'more': return moreScreen(panelId);
      default: return { title: destinationId, panels: [] };
    }
  }

  return { getScreen };
})();
