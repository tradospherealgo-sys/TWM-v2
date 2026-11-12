/*
  TWM V2 — Admin workspace content (Phase 5)
  Source of truth: 06_ADMIN_INTERFACE.md (confirmed 2026-11-11).
  Non-hallucination: no fabricated approval powers, role-permission matrices,
  regulatory status, business rules, allocation logic outcomes, signal
  outcomes, connected-service status or system-health metric values. Counts
  shown on Command Centre / Sales & CRM are real counts derived live from the
  same shared, explicitly-illustrative fixture stores Employee writes to
  (twm-leads/twm-customers/twm-employee-applications/twm-tasks) — never
  separately invented numbers. Integration Connect/Test/Health/Rotate are
  mock/local-only actions (clearly a prototype, no real network call) so they
  are WORKING-as-a-mock, not falsely presented as a live connected service.
*/
window.TwmAdminContent = (function () {
  const APPLICATION_STAGES = ['Checklist', 'Documents Requested', 'Submitted for Review', 'Admin Approved / Sent Back', 'Forwarded to Lender/Insurer', 'Decision'];
  const DPDP_STAGES = ['Requested', 'Under Review', 'Action Taken'];
  const SIGNAL_STAGES = ['Capture', 'Parse', 'Validate', 'AI Review', 'Human Review', 'Publish', 'Track'];
  const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Converted / Lost'];
  const INTEGRATION_SERVICES = ['SMC', 'Market Data', 'Google', 'AI Models', 'Telephony', 'WhatsApp Cloud API', 'Telegram', 'Email', 'Storage'];
  const ALLOCATION_METHODS = ['Manual', 'Round-Robin', 'Product Skill', 'Pincode'];

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  // ---------------- shared data read from the same stores Employee writes to ----------------
  function leads() { return load('twm-leads', []); }
  function customers() { return load('twm-customers', []); }
  function applications() { return load('twm-employee-applications', []); }
  function tasks() { return load('twm-tasks', []); }
  function tickets() { return load('twm-support-tickets', []); }
  function activityLog() { return load('twm-record-activity', {}); }
  function notesLog() { return load('twm-record-notes', {}); }

  function dpdpRequests() {
    const reqs = load('twm-dpdp-requests', []);
    // Entries filed before the `stage` field existed default to 'Requested'.
    return reqs.map((r, i) => Object.assign({ id: r.id || 'dpdp-legacy-' + i, stage: 'Requested' }, r));
  }
  function saveDpdpRequests(reqs) { save('twm-dpdp-requests', reqs); }

  // ---------------- Integration connection state (mock, local-only) ----------------
  function getIntegrations() {
    const stored = load('twm-admin-integrations', {});
    const map = {};
    INTEGRATION_SERVICES.forEach((s) => {
      map[s] = Object.assign({ connected: false, lastTested: null, health: 'Unknown', rotatedAt: null }, stored[s]);
    });
    return map;
  }
  function saveIntegrations(map) { save('twm-admin-integrations', map); }

  // ---------------- Allocation Engine rules (mock CRUD, no live reassignment) ----------------
  function getAllocationRules() { return load('twm-allocation-rules', []); }
  function saveAllocationRules(rules) { save('twm-allocation-rules', rules); }

  // ---------------- Employees (illustrative fixture roster) ----------------
  const DEFAULT_EMPLOYEES = [
    { id: 'emp-1', name: 'Illustrative Employee — V. Kapoor', role: 'Relationship Manager', active: true },
    { id: 'emp-2', name: 'Illustrative Employee — A. Bose', role: 'Relationship Manager', active: true },
    { id: 'emp-3', name: 'Illustrative Employee — M. Reddy', role: 'Senior RM', active: false },
  ];
  function getEmployees() { return load('twm-admin-employees', DEFAULT_EMPLOYEES); }
  function saveEmployees(emps) { save('twm-admin-employees', emps); }

  function kanban(stages, emptyNote) {
    return `<div class="twm-kanban">
      ${stages.map(s => `<div class="twm-kanban__column">
        <div class="twm-chip" style="align-self:flex-start">${s}</div>
        <div class="twm-state-empty" style="padding:16px">${emptyNote}</div>
      </div>`).join('')}
    </div>`;
  }

  // ---------------- Command Centre ----------------
  function todaysCallCount() {
    const log = activityLog();
    const today = new Date().toDateString();
    let count = 0;
    Object.keys(log).forEach((key) => {
      log[key].forEach((entry) => {
        if (entry.text === 'One-tap call placed' && new Date(entry.ts).toDateString() === today) count++;
      });
    });
    return count;
  }

  function commandCentreScreen() {
    const apps = applications();
    const submitted = apps.filter(a => a.stage === 'Submitted for Review').length;
    const openTickets = tickets().filter(t => t.status === 'Open').length;
    const pendingDpdp = dpdpRequests().filter(r => r.stage === 'Requested').length;

    const tiles = [
      { id: 'tile-users', title: 'Users', dest: 'team', value: getEmployees().filter(e => e.active).length, note: 'active employees (illustrative roster)' },
      { id: 'tile-clients', title: 'Clients', dest: 'sales-crm', value: customers().length, note: 'converted customers' },
      { id: 'tile-leads', title: 'Leads', dest: 'sales-crm', value: leads().length, note: 'open leads' },
      { id: 'tile-applications', title: 'Applications by Stage', dest: 'applications-review', value: apps.length, note: submitted + ' awaiting review' },
      { id: 'tile-calls', title: 'Calls Today', dest: 'sales-crm', value: todaysCallCount(), note: 'one-tap calls logged today' },
      { id: 'tile-signals', title: 'Signals Pending Review', dest: 'more', panel: 'signals-desk', value: '—', note: 'No signal pipeline wired yet.' },
      { id: 'tile-tickets', title: 'Open Tickets', dest: 'compliance', value: openTickets, note: 'open support tickets' },
      { id: 'tile-health', title: 'System Health', dest: 'more', panel: 'system-health', value: '—', note: 'Module presence only — see More ▸ System Health.' },
    ];
    const tilePanels = tiles.map(t => ({
      id: t.id,
      title: t.title,
      render: (el) => { el.innerHTML = `<div class="twm-num" style="font-size:22px">${t.value}</div><div class="twm-state-empty" style="padding:8px 0 0">${t.note}</div>`; },
      onFocus: () => { TwmRouter.navigate('admin', t.dest, t.panel); },
    }));
    const attentionItems = [];
    if (submitted) attentionItems.push(`${submitted} application${submitted > 1 ? 's' : ''} awaiting review`);
    if (pendingDpdp) attentionItems.push(`${pendingDpdp} DPDP request${pendingDpdp > 1 ? 's' : ''} pending action`);
    if (openTickets) attentionItems.push(`${openTickets} open support ticket${openTickets > 1 ? 's' : ''}`);
    const actionStrip = {
      id: 'attention-strip',
      title: 'Needs Your Attention',
      render: (el) => {
        el.innerHTML = attentionItems.length
          ? `<ul style="margin:0;padding-left:18px">${attentionItems.map(a => `<li>${a}</li>`).join('')}</ul>`
          : `<div class="twm-state-empty">No applications awaiting review, signals pending approval, or compliance requests pending action.</div>`;
      },
    };
    return { title: 'Command Centre', breadcrumb: ['Admin', 'Command Centre'], panels: [...tilePanels, actionStrip] };
  }

  // ---------------- Team ----------------
  // Performance is derived live from the shared record-ownership field (employeeId) on
  // leads/customers, and from the shared activity log — never a fabricated score or target.
  function employeePerformance(employeeId) {
    const ls = leads().filter(l => l.employeeId === employeeId);
    const cs = customers().filter(c => c.employeeId === employeeId);
    const convertedCount = ls.filter(l => l.stage === 'Converted').length;
    const lostCount = ls.filter(l => l.stage === 'Lost').length;
    const openCount = ls.length - convertedCount - lostCount;
    const log = activityLog();
    let callsLogged = 0;
    Object.keys(log).forEach((key) => {
      const [type, id] = key.split(':');
      const owned = (type === 'lead' && ls.some(l => l.id === id)) || (type === 'customer' && cs.some(c => c.id === id));
      if (owned) log[key].forEach(entry => { if (entry.text === 'One-tap call placed') callsLogged++; });
    });
    return { leadCount: ls.length, openCount, convertedCount, lostCount, customerCount: cs.length, callsLogged };
  }

  let performanceOpenFor = null; // employee id currently showing the performance detail panel
  let reassignStatusMessage = ''; // must survive the window.TwmForceRender() re-render below, so it's module state, not a one-off textContent write

  function employeesBody(el) {
    const emps = getEmployees();
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">
      ${emps.map(e => {
        const perf = performanceOpenFor === e.id ? employeePerformance(e.id) : null;
        return `<div class="twm-glass" style="padding:10px;border-radius:var(--twm-radius-sm);display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <div><div>${e.name}</div><div style="font-size:12px;color:var(--twm-text-muted)">${e.role} · ${e.active ? 'Active' : 'Offboarded'}</div></div>
          <div style="display:flex;gap:6px">
            <button class="twm-btn twm-btn--secondary" data-emp="${e.id}" data-act="perf" style="padding:4px 10px;font-size:12px">${performanceOpenFor === e.id ? 'Hide Performance' : 'View Performance'}</button>
            <button class="twm-btn twm-btn--secondary" data-emp="${e.id}" data-act="toggle" style="padding:4px 10px;font-size:12px">${e.active ? 'Offboard' : 'Re-onboard'}</button>
            <button class="twm-btn twm-btn--secondary" data-emp="${e.id}" data-act="revoke" style="padding:4px 10px;font-size:12px" ${e.active ? '' : 'disabled'}>Revoke Sessions</button>
          </div>
        </div>
        ${perf ? `<div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:6px;border-top:1px solid var(--twm-border-glass)">
          <div><div class="twm-num" style="font-size:16px">${perf.leadCount}</div><div style="font-size:11px;color:var(--twm-text-muted)">Leads owned</div></div>
          <div><div class="twm-num" style="font-size:16px">${perf.openCount}</div><div style="font-size:11px;color:var(--twm-text-muted)">Open</div></div>
          <div><div class="twm-num" style="font-size:16px">${perf.convertedCount}</div><div style="font-size:11px;color:var(--twm-text-muted)">Converted</div></div>
          <div><div class="twm-num" style="font-size:16px">${perf.lostCount}</div><div style="font-size:11px;color:var(--twm-text-muted)">Lost</div></div>
          <div><div class="twm-num" style="font-size:16px">${perf.customerCount}</div><div style="font-size:11px;color:var(--twm-text-muted)">Customers</div></div>
          <div><div class="twm-num" style="font-size:16px">${perf.callsLogged}</div><div style="font-size:11px;color:var(--twm-text-muted)">One-tap calls logged</div></div>
        </div>
        <p style="font-size:11px;color:var(--twm-text-muted)">Derived live from the shared CRM/activity data via record-ownership (employeeId) — not a fabricated score. Exact KPI target definitions remain an open decision. Call-recording review is not shown: no real audio/telephony data exists in this prototype.</p>` : ''}
      </div>`;
      }).join('')}
      <div id="emp-status" style="font-size:12px;color:var(--twm-text-muted)"></div>
    </div>`;
    const status = el.querySelector('#emp-status');
    el.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const list = getEmployees();
        const rec = list.find(x => x.id === btn.dataset.emp);
        if (!rec) return;
        if (btn.dataset.act === 'toggle') {
          rec.active = !rec.active;
          saveEmployees(list);
          window.TwmForceRender();
        } else if (btn.dataset.act === 'revoke') {
          status.textContent = `All active sessions revoked for ${rec.name} (prototype — no real session store).`;
        } else if (btn.dataset.act === 'perf') {
          performanceOpenFor = performanceOpenFor === btn.dataset.emp ? null : btn.dataset.emp;
          window.TwmForceRender();
        }
      });
    });
  }

  function allocationEngineBody(el) {
    const rules = getAllocationRules();
    const ls = leads();
    const emps = getEmployees().filter(e => e.active);
    el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">${ALLOCATION_METHODS.map(x => `<span class="twm-chip">${x}</span>`).join('')}</div>
      ${rules.length === 0 ? `<div class="twm-state-empty">No assignment rules configured yet.</div>` : `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
        ${rules.map(r => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);display:flex;justify-content:space-between;align-items:center">
          <span>${r.method} → ${r.product}</span>
          <button class="twm-btn twm-btn--secondary" data-rule="${r.id}" style="padding:2px 8px;font-size:11px">Remove</button>
        </div>`).join('')}
      </div>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <select class="twm-input" id="rule-method">${ALLOCATION_METHODS.map(m => `<option>${m}</option>`).join('')}</select>
        <input class="twm-input" id="rule-product" placeholder="Product (e.g. Demat)">
        <button class="twm-btn twm-btn--primary" id="rule-add">Add Rule</button>
      </div>

      <div class="twm-panel__title" style="font-size:13px;margin-top:16px">Bulk Re-assign Leads</div>
      ${ls.length === 0 ? `<div class="twm-state-empty">No leads to reassign.</div>` : `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;max-height:220px;overflow:auto">
        ${ls.map(l => `<label style="display:flex;align-items:center;gap:8px;font-size:13px">
          <input type="checkbox" data-reassign-lead="${l.id}">
          ${l.name} <span class="twm-chip" style="margin-left:auto">${l.employeeId ? (emps.find(e => e.id === l.employeeId) || {}).name || 'Unassigned' : 'Unassigned'}</span>
        </label>`).join('')}
      </div>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <select class="twm-input" id="reassign-target">
          <option value="">Assign to…</option>
          ${emps.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
        <button class="twm-btn twm-btn--primary" id="reassign-apply" ${emps.length === 0 || ls.length === 0 ? 'disabled' : ''}>Reassign Selected</button>
      </div>
      <div id="reassign-status" style="font-size:12px;color:var(--twm-text-muted);margin-top:6px">${reassignStatusMessage}</div>`;
    el.querySelector('#rule-add').addEventListener('click', () => {
      const method = el.querySelector('#rule-method').value;
      const product = el.querySelector('#rule-product').value.trim();
      if (!product) return;
      const next = getAllocationRules();
      next.push({ id: 'rule' + Date.now(), method, product });
      saveAllocationRules(next);
      window.TwmForceRender();
    });
    el.querySelectorAll('[data-rule]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveAllocationRules(getAllocationRules().filter(r => r.id !== btn.dataset.rule));
        window.TwmForceRender();
      });
    });
    const reassignBtn = el.querySelector('#reassign-apply');
    if (reassignBtn) reassignBtn.addEventListener('click', () => {
      const targetId = el.querySelector('#reassign-target').value;
      const selectedIds = Array.from(el.querySelectorAll('[data-reassign-lead]:checked')).map(cb => cb.dataset.reassignLead);
      if (!targetId || selectedIds.length === 0) {
        reassignStatusMessage = 'Select at least one lead and a target employee.';
        window.TwmForceRender();
        return;
      }
      const allLeads = leads();
      selectedIds.forEach(id => {
        const lead = allLeads.find(l => l.id === id);
        if (lead) lead.employeeId = targetId;
      });
      save('twm-leads', allLeads);
      reassignStatusMessage = `${selectedIds.length} lead${selectedIds.length > 1 ? 's' : ''} reassigned.`;
      window.TwmForceRender();
    });
  }

  function teamScreen() {
    const panels = [
      { id: 'employees', title: 'Employees', render: employeesBody },
      { id: 'allocation-engine', title: 'Allocation Engine', render: allocationEngineBody },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Team', breadcrumb: ['Admin', 'Team'], panels };
  }

  // ---------------- Sales & CRM ----------------
  function orgCrmBody(el) {
    const ls = leads(), cs = customers();
    const emps = getEmployees();
    const ownerName = (employeeId) => employeeId ? ((emps.find(e => e.id === employeeId) || {}).name || 'Unassigned') : 'Unassigned';
    el.innerHTML = `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px">
        <div><div class="twm-num" style="font-size:20px">${ls.length}</div><div style="font-size:12px;color:var(--twm-text-muted)">Open leads</div></div>
        <div><div class="twm-num" style="font-size:20px">${cs.length}</div><div style="font-size:12px;color:var(--twm-text-muted)">Customers</div></div>
      </div>
      ${ls.length === 0 && cs.length === 0 ? `<div class="twm-state-empty">No leads or customers across employees yet.</div>` : `<div style="display:flex;flex-direction:column;gap:6px">
        ${ls.map(l => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:13px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>${l.name}</span><span style="display:flex;gap:6px"><span class="twm-chip">${l.stage}</span><span class="twm-chip" title="Owner">${ownerName(l.employeeId)}</span></span></div>`).join('')}
        ${cs.map(c => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:13px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>${c.name}</span><span style="display:flex;gap:6px"><span class="twm-chip">Customer</span><span class="twm-chip" title="Owner">${ownerName(c.employeeId)}</span></span></div>`).join('')}
      </div>`}
      <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Read-only oversight — record detail and notes live in the Employee workspace. Owner reflects the employee record-ownership field, reassignable in Team ▸ Allocation Engine.</p>`;
  }

  function salesMonitoringBody(el) {
    const ls = leads();
    const apps = applications();
    const leadFunnel = LEAD_STAGES.map(s => ({ label: s, count: ls.filter(l => l.stage === s).length }));
    const appCols = APPLICATION_STAGES.map(s => ({ label: s.split(' ')[0], value: apps.filter(a => a.stage === s).length }));
    el.innerHTML = `<div class="twm-panel__title" style="font-size:13px">Lead Pipeline</div>
      ${TwmChart.funnel(leadFunnel, { ariaLabel: 'lead pipeline funnel' })}
      <div class="twm-panel__title" style="font-size:13px;margin-top:14px">Applications by Stage</div>
      ${TwmChart.columns(appCols, { ariaLabel: 'applications by stage' })}`;
  }

  function salesCrmScreen() {
    const panels = [
      { id: 'org-crm', title: 'Org-wide CRM', render: orgCrmBody },
      { id: 'sales-monitoring', title: 'Sales Monitoring', render: salesMonitoringBody },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Sales & CRM', breadcrumb: ['Admin', 'Sales & CRM'], panels };
  }

  // ---------------- Applications Review ----------------
  function reviewActionsBody(el) {
    const apps = applications().filter(a => a.stage === 'Submitted for Review' || a.stage === 'Admin Approved / Sent Back');
    const notes = notesLog();
    el.innerHTML = apps.length === 0
      ? `<div class="twm-state-empty">No applications currently submitted for review.</div>`
      : `<div style="display:flex;flex-direction:column;gap:8px">
        ${apps.map(a => `<div class="twm-glass" style="padding:10px;border-radius:var(--twm-radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <div><div>${a.applicant}</div><div style="font-size:12px;color:var(--twm-text-muted)">${a.product} · ${a.stage}</div></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="twm-btn twm-btn--secondary" data-app="${a.id}" data-act="check" style="padding:4px 10px;font-size:12px">Document Checker</button>
              <button class="twm-btn twm-btn--secondary" data-app="${a.id}" data-act="approve" style="padding:4px 10px;font-size:12px">Approve</button>
              <button class="twm-btn twm-btn--secondary" data-app="${a.id}" data-act="sendback" style="padding:4px 10px;font-size:12px">Send Back</button>
              <button class="twm-btn twm-btn--secondary" data-app="${a.id}" data-act="forward" style="padding:4px 10px;font-size:12px" ${a.stage !== 'Admin Approved / Sent Back' ? 'disabled' : ''}>Forward to Lender/Insurer</button>
            </div>
          </div>
          ${(notes['application:' + a.id] || []).slice(0, 2).map(n => `<div style="font-size:12px;color:var(--twm-text-muted);margin-top:6px">• ${n.text}</div>`).join('')}
        </div>`).join('')}
      </div>
      <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Which admin role/permission-set can take which action <span class="twm-badge twm-badge--pending-decision">open decision</span></p>`;

    function addNote(id, text) {
      const key = 'application:' + id;
      notes[key] = notes[key] || [];
      notes[key].unshift({ text, ts: new Date().toISOString() });
      save('twm-record-notes', notes);
    }
    el.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const list = applications();
        const app = list.find(x => x.id === btn.dataset.app);
        if (!app) return;
        if (btn.dataset.act === 'check') {
          addNote(app.id, 'Document Checker run (AI pre-check mock — human verification still required).');
        } else if (btn.dataset.act === 'approve') {
          app.stage = 'Admin Approved / Sent Back';
          addNote(app.id, 'Approved by admin.');
          save('twm-employee-applications', list);
        } else if (btn.dataset.act === 'sendback') {
          app.stage = 'Documents Requested';
          addNote(app.id, 'Sent back to applicant for more documents.');
          save('twm-employee-applications', list);
        } else if (btn.dataset.act === 'forward') {
          app.stage = 'Forwarded to Lender/Insurer';
          addNote(app.id, 'Forwarded to lender/insurer — tracked hand-off.');
          save('twm-employee-applications', list);
        }
        window.TwmForceRender();
      });
    });
  }

  function reviewStagesBody(el) {
    const apps = applications();
    el.innerHTML = `<div class="twm-kanban">
      ${APPLICATION_STAGES.map(s => {
        const inStage = apps.filter(a => a.stage === s);
        return `<div class="twm-kanban__column">
          <div class="twm-chip" style="align-self:flex-start">${s}</div>
          ${inStage.length === 0 ? `<div class="twm-state-empty" style="padding:16px">No applications at this stage.</div>` : inStage.map(a => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:12px">${a.applicant}</div>`).join('')}
        </div>`;
      }).join('')}
    </div>
    <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Shared backbone with Employee Applications — Decision stays empty/pending until a genuine lender/insurer response exists.</p>`;
  }

  function applicationsReviewScreen() {
    const panels = [
      { id: 'review-actions', title: 'Admin Actions', render: reviewActionsBody },
      { id: 'review-stages', title: 'Stage Sequence', render: reviewStagesBody },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Applications Review', breadcrumb: ['Admin', 'Applications Review'], panels };
  }

  // ---------------- Compliance ----------------
  function dpdpRequestsBody(el) {
    const reqs = dpdpRequests();
    el.innerHTML = `<div class="twm-kanban">
      ${DPDP_STAGES.map(stage => {
        const inStage = reqs.filter(r => r.stage === stage);
        return `<div class="twm-kanban__column">
          <div class="twm-chip" style="align-self:flex-start">${stage}</div>
          ${inStage.length === 0 ? `<div class="twm-state-empty" style="padding:16px">No requests at this stage.</div>` : inStage.map(r => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:12px">
            <div>${r.kind}</div>
            <div style="color:var(--twm-text-muted)">${new Date(r.ts).toLocaleDateString()}</div>
            ${stage !== 'Action Taken' ? `<button class="twm-btn twm-btn--secondary" data-req="${r.id}" data-next="${stage === 'Requested' ? 'Under Review' : 'Action Taken'}" style="padding:2px 8px;font-size:11px;margin-top:6px">Advance</button>` : ''}
          </div>`).join('')}
        </div>`;
      }).join('')}
    </div>
    <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Export / erase requests filed from the Client workspace — non-instant, subject to legal review. <span class="twm-badge twm-badge--pending-decision">Exact workflow states — open decision</span></p>`;
    el.querySelectorAll('[data-req]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const all = dpdpRequests();
        const rec = all.find(r => r.id === btn.dataset.req);
        if (rec) rec.stage = btn.dataset.next;
        saveDpdpRequests(all);
        window.TwmForceRender();
      });
    });
  }

  function complianceScreen() {
    const panels = [
      { id: 'consent-ledger', title: 'Consent Ledger', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No consent records yet.</div>`; } },
      { id: 'data-access-log', title: 'Data-Access Log', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No document-access events yet — who opened which document.</div>`; } },
      { id: 'dpdp-requests', title: 'DPDP Requests', render: dpdpRequestsBody },
      { id: 'retention-jobs', title: 'Retention Jobs', render: (el) => { el.innerHTML = `<div class="twm-state-empty">No retention jobs scheduled.</div>`; } },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Compliance', breadcrumb: ['Admin', 'Compliance'], panels };
  }

  // ---------------- More hub ----------------
  function integrationsPanel(el) {
    const map = getIntegrations();
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">
      ${INTEGRATION_SERVICES.map(s => {
        const st = map[s];
        return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="twm-chip">${s}</span>
          <span style="font-size:12px;color:var(--twm-text-muted)">${st.connected ? 'Connected · key ••••' + (st.rotatedAt ? ' (rotated)' : '') : 'Not connected · key ••••'} — health: ${st.health}</span>
          <div style="display:flex;gap:6px">
            <button class="twm-btn twm-btn--secondary" data-svc="${s}" data-act="connect" style="padding:4px 10px;font-size:12px">${st.connected ? 'Disconnect' : 'Connect'}</button>
            <button class="twm-btn twm-btn--secondary" data-svc="${s}" data-act="test" style="padding:4px 10px;font-size:12px">Test</button>
            <button class="twm-btn twm-btn--secondary" data-svc="${s}" data-act="health" style="padding:4px 10px;font-size:12px">Health</button>
            <button class="twm-btn twm-btn--secondary" data-svc="${s}" data-act="rotate" style="padding:4px 10px;font-size:12px" ${st.connected ? '' : 'disabled'}>Rotate</button>
          </div>
        </div>`;
      }).join('')}
      <p style="font-size:12px;color:var(--twm-text-muted);margin-top:4px">Prototype controls — no real network call is made; connection/health/rotation state is local-only until a real backend integration exists.</p>
    </div>`;
    el.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = getIntegrations();
        const st = m[btn.dataset.svc];
        if (btn.dataset.act === 'connect') {
          st.connected = !st.connected;
          st.health = st.connected ? 'Healthy (mock)' : 'Unknown';
        } else if (btn.dataset.act === 'test') {
          st.lastTested = new Date().toISOString();
          st.health = st.connected ? 'Healthy (mock)' : 'Test failed — not connected';
        } else if (btn.dataset.act === 'health') {
          st.health = st.connected ? 'Healthy (mock)' : 'Unknown';
        } else if (btn.dataset.act === 'rotate') {
          st.rotatedAt = new Date().toISOString();
        }
        saveIntegrations(m);
        window.TwmForceRender();
      });
    });
  }

  function signalsDeskPanel(el) {
    const raGated = load('twm-signals-ra-gated', { on: true }).on;
    el.innerHTML = `<div class="twm-chip twm-chip--warm" style="margin-bottom:10px">Shadow Mode — default pre-RA registration</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <label style="font-size:13px">Publish gating (RA switch)</label>
      <button class="twm-btn twm-btn--secondary" id="ra-toggle" style="padding:4px 10px;font-size:12px">${raGated ? 'Shadow Mode ON (publish blocked)' : 'Publish ENABLED'}</button>
    </div>
    ${kanban(SIGNAL_STAGES, 'No signals at this stage.')}
    <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">
      Stages 1–4 run fully; Human Review (5) is admin-only; Publish/Track (6–7) write only to an internal scorecard while in Shadow Mode.
      <span class="twm-badge twm-badge--pending-decision">Role-level control over this switch — open decision</span>
    </p>`;
    el.querySelector('#ra-toggle').addEventListener('click', () => {
      const cur = load('twm-signals-ra-gated', { on: true });
      save('twm-signals-ra-gated', { on: !cur.on });
      window.TwmForceRender();
    });
  }

  function contentSopPanel(el) {
    el.innerHTML = `<div class="twm-state-empty">Knowledge articles, product catalogue and disclaimers — re-indexed into the AI knowledge base on save. No content yet.</div>`;
  }
  function systemHealthPanel(el) {
    el.innerHTML = `<div class="twm-state-empty">Module presence only. <span class="twm-badge twm-badge--pending-decision">Exact states/metric definitions — open decision</span></div>`;
  }

  // ---------------- More hub: condensed previews for Overview/Focus tiers ----------------
  // Full panels above render only once opened to Immersive (H-2 "Open full view"
  // mechanism in stage.js) — Overview/Focus stay condensed, same pattern as Employee's hub.
  function integrationsPreview(el) {
    const map = getIntegrations();
    const connectedCount = INTEGRATION_SERVICES.filter(s => map[s].connected).length;
    el.innerHTML = `<div class="twm-num" style="font-size:20px">${connectedCount}/${INTEGRATION_SERVICES.length}</div><div class="twm-state-empty" style="padding:8px 0 0">services connected (prototype/mock) — open to manage.</div>`;
  }
  function signalsDeskPreview(el) {
    const raGated = load('twm-signals-ra-gated', { on: true }).on;
    el.innerHTML = `<span class="twm-chip twm-chip--warm">${raGated ? 'Shadow Mode ON' : 'Publish ENABLED'}</span><div class="twm-state-empty" style="padding:8px 0 0">open for the full 7-stage pipeline.</div>`;
  }
  function contentSopPreview(el) {
    el.innerHTML = `<div class="twm-state-empty">No content yet — open to manage knowledge base and disclaimers.</div>`;
  }
  function systemHealthPreview(el) {
    el.innerHTML = `<div class="twm-state-empty">Module presence only. <span class="twm-badge twm-badge--pending-decision">Metric definitions — open decision</span></div>`;
  }

  function moreScreen(panelId) {
    const hubItems = [
      { id: 'integrations', title: 'Integrations', render: integrationsPanel, renderPreview: integrationsPreview },
      { id: 'signals-desk', title: 'Signals Desk', render: signalsDeskPanel, renderPreview: signalsDeskPreview },
      { id: 'content-sop', title: 'Content and SOP', render: contentSopPanel, renderPreview: contentSopPreview },
      { id: 'system-health', title: 'System Health', render: systemHealthPanel, renderPreview: systemHealthPreview },
    ];
    if (panelId) {
      // Immersive tier — full panel, reached only via the H-2 "Open full view" mechanism
      // from a focused Overview/Focus tile, never rendered directly in Overview.
      const item = hubItems.find(h => h.id === panelId) || hubItems[0];
      return {
        title: item.title, breadcrumb: ['Admin', 'More', item.title],
        panels: [{ id: item.id, title: item.title, render: item.render }],
      };
    }
    // Overview/Focus tier — condensed preview per tile; entering Focus (not a direct
    // route jump) is what makes the H-2 "Open full view" button appear for the focused tile.
    return {
      title: 'More', breadcrumb: ['Admin', 'More'],
      panels: hubItems.map(h => ({
        id: h.id, title: h.title, immersive: true,
        render: h.renderPreview,
        onFocus: () => window.TwmSetFocus('focus', h.id),
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
