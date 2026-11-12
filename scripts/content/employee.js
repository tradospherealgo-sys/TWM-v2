/*
  TWM V2 — Employee workspace content (Phase 4)
  Source of truth: 05_EMPLOYEE_INTERFACE.md (confirmed 2026-11-11).
  Non-hallucination: no fabricated employee names, lead records, call outcomes,
  lead scores, consent records, application/lender decisions, commissions,
  targets or performance values — every number below is illustrative-zero/empty,
  not invented data.
*/
window.TwmEmployeeContent = (function () {
  let crmTab = 'leads'; // Leads | Customers — fixed chrome, same pattern as Client Trade

  const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Converted / Lost'];
  const APPLICATION_STAGES = ['Checklist', 'Documents Requested', 'Submitted for Review', 'Admin Approved / Sent Back', 'Forwarded to Lender/Insurer', 'Decision'];

  function kanban(stages, emptyNote) {
    return `<div class="twm-kanban">
      ${stages.map(s => `<div class="twm-kanban__column">
        <div class="twm-chip" style="align-self:flex-start">${s}</div>
        <div class="twm-state-empty" style="padding:16px">${emptyNote}</div>
      </div>`).join('')}
    </div>`;
  }

  // ---------------- My Day ----------------
  function myDayScreen() {
    const panels = [
      { id: 'calls-to-make', title: 'Calls to Make', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No calls queued.</div>`; } },
      { id: 'followups-due', title: 'Follow-ups Due', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No follow-ups due.</div>`; } },
      { id: 'applications-waiting', title: 'Applications Waiting', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No applications waiting on you.</div>`; } },
      { id: 'ai-briefing', title: 'AI Briefing', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Illustrative framing only — summary content depends on real queue state, never a fabricated count.</div>`; } },
      { id: 'targets-actuals', title: 'Targets vs Actuals', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Module presence only. <span class="twm-badge twm-badge--pending-decision">Exact KPI definitions — open decision</span></div>`; } },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'My Day', breadcrumb: ['Employee', 'My Day'], panels };
  }

  // ---------------- CRM ----------------
  function crmScreen() {
    const tabPanel = {
      id: 'crm-tabs', title: '',
      render: (el) => {
        el.innerHTML = `<div class="twm-segmented" role="tablist">
          <button class="twm-segmented__item" data-tab="leads" role="tab" aria-selected="${crmTab==='leads'}">Leads</button>
          <button class="twm-segmented__item" data-tab="customers" role="tab" aria-selected="${crmTab==='customers'}">Customers</button>
        </div>`;
        el.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { crmTab = btn.dataset.tab; window.TwmForceRender(); }));
      },
    };

    let body;
    if (crmTab === 'leads') {
      body = [
        { id: 'lead-scoring', title: 'Scoring', render: (el) => { el.innerHTML = `<span class="twm-chip twm-chip--hot">HOT</span> <span class="twm-chip twm-chip--warm">WARM</span> <span class="twm-chip twm-chip--cold">COLD</span>`; } },
        { id: 'lead-pipeline', title: 'Stage Pipeline', render: (el) => { el.innerHTML = kanban(LEAD_STAGES, 'No leads at this stage.'); } },
      ];
    } else {
      body = [
        { id: 'customer-360', title: '360° View', render: (el) => { el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px">${['Products Held','Applications','Documents','Tickets','Call History','Consents'].map(x=>`<span class="twm-chip">${x}</span>`).join('')}</div><p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Documents masked until explicit reveal — same pattern as Client Me's KYC Vault.</p>`; } },
      ];
    }
    body.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'CRM', breadcrumb: ['Employee', 'CRM', crmTab === 'leads' ? 'Leads' : 'Customers'], panels: [tabPanel, ...body] };
  }

  // ---------------- Applications ----------------
  function applicationsScreen() {
    const panels = [
      { id: 'applications-filter', title: 'Filter by Product Type', render: (el) => { el.innerHTML = `<div style="display:flex;gap:8px">${['Demat','MF','Insurance','Loan'].map(x=>`<span class="twm-chip">${x}</span>`).join('')}</div>`; } },
      { id: 'applications-stages', title: 'Stage Sequence', render: (el) => { el.innerHTML = kanban(APPLICATION_STAGES, 'No applications at this stage.') + `<p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Decision stays empty/pending until a genuine lender/insurer response exists.</p>`; } },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Applications', breadcrumb: ['Employee', 'Applications'], panels };
  }

  // ---------------- Tasks ----------------
  function tasksScreen() {
    return {
      title: 'Tasks', breadcrumb: ['Employee', 'Tasks'],
      panels: [{ id: 'task-list', title: 'Assigned Tasks', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No tasks assigned. Distinct from My Day's AI-curated queue — this is the literal to-do list.</div>`; }, onFocus: () => window.TwmSetFocus('focus', 'task-list') }],
    };
  }

  // ---------------- More hub ----------------
  function moreScreen(panelId) {
    const hubItems = [
      { id: 'internal-chat', title: 'Internal Chat', note: 'Interaction details beyond placement — open decision.' },
      { id: 'knowledge-sop', title: 'Knowledge and SOP', note: 'Knowledge base / SOP library.' },
      { id: 'performance', title: 'Performance', note: 'Destination locked. <span class="twm-badge twm-badge--pending-decision">Exact KPI definitions — open decision</span>' },
      { id: 'daily-reports', title: 'Daily Reports', note: 'Daily reporting module.' },
    ];
    if (panelId) {
      const item = hubItems.find(h => h.id === panelId) || hubItems[0];
      return {
        title: item.title, breadcrumb: ['Employee', 'More', item.title],
        panels: [{ id: item.id, title: item.title, render: (el) => { el.innerHTML = `<div class="twm-state-empty">${item.note}</div>`; } }],
      };
    }
    return {
      title: 'More', breadcrumb: ['Employee', 'More'],
      panels: hubItems.map(h => ({
        id: h.id, title: h.title,
        render: (el) => { el.innerHTML = `<div class="twm-state-empty">${h.note}</div>`; },
        onFocus: () => { TwmRouter.navigate('employee', 'more', h.id); },
      })),
    };
  }

  function getScreen(destinationId, panelId) {
    switch (destinationId) {
      case 'myday': return myDayScreen();
      case 'crm': return crmScreen();
      case 'applications': return applicationsScreen();
      case 'tasks': return tasksScreen();
      case 'more': return moreScreen(panelId);
      default: return { title: destinationId, panels: [] };
    }
  }

  return { getScreen };
})();
