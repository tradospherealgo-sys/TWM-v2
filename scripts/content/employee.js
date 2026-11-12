/*
  TWM V2 — Employee workspace content (Phase 4)
  Source of truth: 05_EMPLOYEE_INTERFACE.md (confirmed 2026-11-11).
  Non-hallucination: fixture records below are explicitly and visibly labelled
  "Illustrative" and persisted only in this browser's localStorage — they are
  never presented as real customers, leads, or business performance. No
  fabricated call outcomes, consent records, lender/insurer decisions,
  commissions, targets, or performance values exist anywhere in this file.
*/
window.TwmEmployeeContent = (function () {
  let crmTab = 'leads'; // Leads | Customers — fixed chrome, same pattern as Client Trade
  let applicationsFilter = null; // selected product-type filter chip, null = all
  let selectedLeadId = null;
  let selectedCustomerId = null;
  let selectedApplicationId = null;
  let selectedTaskId = null;
  let lostPromptForId = null; // lead id currently showing the Mark Lost reason-code prompt

  const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Converted / Lost'];
  const APPLICATION_STAGES = ['Checklist', 'Documents Requested', 'Submitted for Review', 'Admin Approved / Sent Back', 'Forwarded to Lender/Insurer', 'Decision'];
  const LOST_REASONS = ['Not interested', 'Chose a competitor', 'Budget constraints', 'Unresponsive', 'Timing not right', 'Other'];
  const SOP_ARTICLES = ['Illustrative SOP — KYC document checklist', 'Illustrative SOP — Lead qualification criteria', 'Illustrative SOP — Application escalation path'];
  const REVIEW_CHECKLIST_ITEMS = ['Identity (KYC) verified', 'Income / eligibility proof reviewed', 'Signatures captured'];
  const CUSTOMER_DOC_TYPES = [{ id: 'pan', label: 'PAN' }, { id: 'aadhaar', label: 'Aadhaar' }, { id: 'address-proof', label: 'Address Proof' }];
  const customerDocsRevealed = {}; // key: `${customerId}:${docId}` -> bool — in-memory only, same pattern as Client Me's KYC Vault (client.js kycRevealed)

  // ---------------- illustrative fixture store (localStorage-persisted) ----------------
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  const DEFAULT_LEADS = [
    { id: 'lead-1', name: 'Illustrative Lead — A. Sharma', stage: 'New', score: 'HOT', phone: '+91 9XXXXXXXX1 (fixture)', product: 'Demat & Trading', employeeId: null },
    { id: 'lead-2', name: 'Illustrative Lead — R. Verma', stage: 'New', score: 'WARM', phone: '+91 9XXXXXXXX2 (fixture)', product: 'Mutual Funds', employeeId: null },
    { id: 'lead-3', name: 'Illustrative Lead — K. Nair', stage: 'Contacted', score: 'COLD', phone: '+91 9XXXXXXXX3 (fixture)', product: 'Insurance', employeeId: null },
    { id: 'lead-4', name: 'Illustrative Lead — S. Iyer', stage: 'Qualified', score: 'HOT', phone: '+91 9XXXXXXXX4 (fixture)', product: 'Loan', employeeId: null },
  ];
  const DEFAULT_CUSTOMERS = [];
  const DEFAULT_APPLICATIONS = [
    { id: 'app-1', applicant: 'Illustrative Applicant — N. Rao', product: 'Demat', stage: 'Checklist' },
    { id: 'app-2', applicant: 'Illustrative Applicant — P. Das', product: 'Loan', stage: 'Documents Requested' },
    { id: 'app-3', applicant: 'Illustrative Applicant — T. Menon', product: 'Insurance', stage: 'Submitted for Review' },
  ];
  const DEFAULT_TASKS = [
    { id: 'task-1', title: 'Illustrative Task — follow up on document checklist', done: false },
    { id: 'task-2', title: 'Illustrative Task — confirm KYC appointment', done: false },
  ];

  let leads = load('twm-leads', DEFAULT_LEADS);
  let customers = load('twm-customers', DEFAULT_CUSTOMERS);
  let applications = load('twm-employee-applications', DEFAULT_APPLICATIONS);
  let tasks = load('twm-tasks', DEFAULT_TASKS);
  const notes = load('twm-record-notes', {}); // key: `${type}:${id}` -> [{text, ts}]
  const activity = load('twm-record-activity', {}); // key: `${type}:${id}` -> [{text, ts}]

  // Persist fixture defaults immediately on first load (not just on first mutation).
  // Admin reads these same keys with an empty-array fallback (org-wide oversight must
  // never fabricate its own numbers), so until Employee content writes the key at least
  // once, Admin would see 0 leads/customers/applications/tasks even though Employee's
  // own in-memory default is non-empty. Writing through here keeps both readers
  // consistent from the very first page load, in either role, without duplicating data.
  if (localStorage.getItem('twm-leads') === null) save('twm-leads', leads);
  if (localStorage.getItem('twm-customers') === null) save('twm-customers', customers);
  if (localStorage.getItem('twm-employee-applications') === null) save('twm-employee-applications', applications);
  if (localStorage.getItem('twm-tasks') === null) save('twm-tasks', tasks);

  function addNote(type, id, text) {
    const key = type + ':' + id;
    notes[key] = notes[key] || [];
    notes[key].unshift({ text, ts: new Date().toISOString() });
    save('twm-record-notes', notes);
    window.TwmForceRender();
  }
  function logActivity(type, id, text) {
    const key = type + ':' + id;
    activity[key] = activity[key] || [];
    activity[key].unshift({ text, ts: new Date().toISOString() });
    save('twm-record-activity', activity);
  }

  function kanban(stages, emptyNote) {
    return `<div class="twm-kanban">
      ${stages.map(s => `<div class="twm-kanban__column">
        <div class="twm-chip" style="align-self:flex-start">${s}</div>
        <div class="twm-state-empty" style="padding:16px">${emptyNote}</div>
      </div>`).join('')}
    </div>`;
  }

  // Record card + notes/activity block shared by Lead/Customer/Application/Task detail views.
  function notesBlock(type, id) {
    const key = type + ':' + id;
    const recNotes = notes[key] || [];
    return `<div style="margin-top:14px">
      <div class="twm-panel__title" style="font-size:14px">Notes</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input class="twm-input" id="note-input" placeholder="Add a note…">
        <button class="twm-btn twm-btn--secondary" id="note-add">Add</button>
      </div>
      ${recNotes.length === 0 ? `<div class="twm-state-empty" style="padding:10px">No notes yet.</div>` : `<div style="display:flex;flex-direction:column;gap:6px">${recNotes.map(n => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:13px">${n.text}</div>`).join('')}</div>`}
    </div>`;
  }
  function wireNotes(el, type, id) {
    el.querySelector('#note-add').addEventListener('click', () => {
      const input = el.querySelector('#note-input');
      if (input.value.trim()) addNote(type, id, input.value.trim());
    });
  }

  function callingActions(type, record) {
    return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button class="twm-btn twm-btn--primary" id="call-now">One-tap Call</button>
      <button class="twm-btn twm-btn--secondary" id="whatsapp-template">WhatsApp Template</button>
    </div>
    <div id="calling-status" style="font-size:12px;color:var(--twm-text-muted);margin-top:8px"></div>`;
  }
  function wireCallingActions(el, type, record) {
    const status = el.querySelector('#calling-status');
    el.querySelector('#call-now').addEventListener('click', () => {
      status.textContent = `Call started to ${record.phone || record.name || record.applicant} (prototype — no real call placed).`;
      logActivity(type, record.id, 'One-tap call placed');
      addNote(type, record.id, 'Call placed via one-tap action (auto-logged).');
    });
    el.querySelector('#whatsapp-template').addEventListener('click', () => {
      status.textContent = 'WhatsApp template message queued (prototype — not sent to a real number).';
      logActivity(type, record.id, 'WhatsApp template sent');
      addNote(type, record.id, 'WhatsApp template sent (auto-logged).');
    });
  }

  // ---------------- My Day ----------------
  function myDayScreen() {
    // P4-06b: these queues are DERIVED from the same real records CRM/Tasks/Applications
    // use — never a separately fabricated list. Clicking an item jumps straight into that
    // record's existing real detail panel (same cross-destination deep-link-to-panel
    // mechanism as admin.js's Command Centre tiles and client.js's goTo()).
    const callsLeads = leads.filter(l => l.stage === 'New' || l.stage === 'Contacted');
    const followupTasks = tasks.filter(t => !t.done);
    const waitingApps = applications.filter(a => a.stage !== 'Decision');

    function queueRow(dataAttr, id, left, right) {
      return `<button class="twm-glass twm-btn" data-${dataAttr}="${id}" style="display:flex;justify-content:space-between;width:100%;text-align:left;min-height:auto;padding:10px;margin-bottom:8px">
        <span>${left}</span>${right ? `<span class="twm-chip">${right}</span>` : ''}
      </button>`;
    }

    const panels = [
      {
        id: 'calls-to-make', title: 'Calls to Make',
        render: (el) => {
          el.innerHTML = (callsLeads.length === 0
            ? `<div class="twm-state-empty">No calls queued.</div>`
            : callsLeads.map(l => queueRow('myday-lead', l.id, l.name, l.stage)).join('') +
              `<p style="font-size:11px;color:var(--twm-text-muted);margin-top:4px">Derived from New/Contacted leads in CRM.</p>`);
          el.querySelectorAll('[data-myday-lead]').forEach(btn => btn.addEventListener('click', () => {
            selectedLeadId = btn.dataset.mydayLead;
            TwmRouter.navigate('employee', 'crm', 'lead-detail-' + selectedLeadId);
          }));
        },
      },
      {
        id: 'followups-due', title: 'Follow-ups Due',
        render: (el) => {
          el.innerHTML = (followupTasks.length === 0
            ? `<div class="twm-state-empty">No follow-ups due.</div>`
            : followupTasks.map(t => queueRow('myday-task', t.id, t.title, null)).join('') +
              `<p style="font-size:11px;color:var(--twm-text-muted);margin-top:4px">Derived from open items in Tasks.</p>`);
          el.querySelectorAll('[data-myday-task]').forEach(btn => btn.addEventListener('click', () => {
            selectedTaskId = btn.dataset.mydayTask;
            TwmRouter.navigate('employee', 'tasks', 'task-detail-' + selectedTaskId);
          }));
        },
      },
      {
        id: 'applications-waiting', title: 'Applications Waiting',
        render: (el) => {
          el.innerHTML = (waitingApps.length === 0
            ? `<div class="twm-state-empty">No applications waiting on you.</div>`
            : waitingApps.map(a => queueRow('myday-app', a.id, a.applicant, a.stage)).join('') +
              `<p style="font-size:11px;color:var(--twm-text-muted);margin-top:4px">Derived from Applications not yet at Decision.</p>`);
          el.querySelectorAll('[data-myday-app]').forEach(btn => btn.addEventListener('click', () => {
            selectedApplicationId = btn.dataset.mydayApp;
            TwmRouter.navigate('employee', 'applications', 'application-detail-' + selectedApplicationId);
          }));
        },
      },
      { id: 'ai-briefing', title: 'AI Briefing', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Illustrative framing only — summary content depends on real queue state, never a fabricated count.</div>`; } },
      { id: 'targets-actuals', title: 'Targets vs Actuals', render: (el) => { el.innerHTML = `<div class="twm-state-empty">Module presence only. <span class="twm-badge twm-badge--pending-decision">Exact KPI definitions — open decision</span></div>`; } },
    ];
    panels.forEach(p => { p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'My Day', breadcrumb: ['Employee', 'My Day'], panels };
  }

  // ---------------- CRM ----------------
  function leadCard(lead) {
    return `<button class="twm-glass twm-btn" data-lead="${lead.id}" style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px;min-height:auto;width:100%;text-align:left;margin-bottom:8px">
      <span style="font-size:13px">${lead.name}</span>
      <span class="twm-chip twm-chip--${lead.score.toLowerCase()}">${lead.score}</span>
    </button>`;
  }

  function leadDetailPanel(lead) {
    return {
      id: 'lead-detail-' + lead.id, title: lead.name, immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'lead-detail-' + lead.id),
      render: (el) => {
        el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
          <span class="twm-chip twm-chip--${lead.score.toLowerCase()}">${lead.score}</span>
          <span class="twm-chip">${lead.product}</span>
          <span class="twm-chip">${lead.stage}</span>
        </div>
        <p style="font-size:13px;color:var(--twm-text-secondary)">Illustrative fixture record — not a real customer.</p>
        ${lead.stage !== 'Converted' && lead.stage !== 'Lost' ? (
          lostPromptForId === lead.id
            ? `<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;max-width:320px">
                <label for="lost-reason" style="font-size:12px;color:var(--twm-text-muted)">Reason for marking Lost (required)</label>
                <select id="lost-reason" class="twm-input">
                  <option value="">Select a reason…</option>
                  ${LOST_REASONS.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
                <div style="display:flex;gap:8px">
                  <button class="twm-btn twm-btn--primary" id="confirm-lost">Confirm Mark Lost</button>
                  <button class="twm-btn twm-btn--secondary" id="cancel-lost">Cancel</button>
                </div>
              </div>`
            : `<div style="display:flex;gap:8px;margin-top:10px">
          <button class="twm-btn twm-btn--primary" id="mark-converted">Mark Converted</button>
          <button class="twm-btn twm-btn--secondary" id="mark-lost">Mark Lost</button>
        </div>`
        ) : lead.stage === 'Lost' && lead.lostReason ? `<p style="font-size:12px;color:var(--twm-text-muted);margin-top:10px">Lost reason: ${lead.lostReason}</p>` : ''}
        ${callingActions('lead', lead)}
        ${notesBlock('lead', lead.id)}`;
        wireCallingActions(el, 'lead', lead);
        wireNotes(el, 'lead', lead.id);
        const convertedBtn = el.querySelector('#mark-converted');
        if (convertedBtn) convertedBtn.addEventListener('click', () => {
          lead.stage = 'Converted';
          customers.push({ id: 'cust-' + lead.id, name: lead.name.replace('Lead', 'Customer'), product: lead.product, employeeId: lead.employeeId || null });
          save('twm-leads', leads); save('twm-customers', customers);
          window.TwmForceRender();
        });
        const lostBtn = el.querySelector('#mark-lost');
        if (lostBtn) lostBtn.addEventListener('click', () => { lostPromptForId = lead.id; window.TwmForceRender(); });
        const cancelLostBtn = el.querySelector('#cancel-lost');
        if (cancelLostBtn) cancelLostBtn.addEventListener('click', () => { lostPromptForId = null; window.TwmForceRender(); });
        const confirmLostBtn = el.querySelector('#confirm-lost');
        if (confirmLostBtn) confirmLostBtn.addEventListener('click', () => {
          const sel = el.querySelector('#lost-reason');
          if (!sel || !sel.value) { sel && sel.focus(); return; }
          lead.stage = 'Lost'; lead.lostReason = sel.value; lostPromptForId = null;
          save('twm-leads', leads); window.TwmForceRender();
        });
      },
    };
  }

  function customerDetailPanel(customer) {
    return {
      id: 'customer-detail-' + customer.id, title: customer.name, immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'customer-detail-' + customer.id),
      render: (el) => {
        el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">${['Products Held', 'Applications', 'Tickets', 'Call History', 'Consents'].map(x => `<span class="twm-chip">${x}</span>`).join('')}</div>
        <p style="font-size:12px;color:var(--twm-text-muted)">Illustrative fixture record — not a real customer.</p>

        <div style="margin-top:10px">
          <div class="twm-panel__title" style="font-size:14px">Documents</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${CUSTOMER_DOC_TYPES.map((d) => {
              const key = customer.id + ':' + d.id;
              return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
                <span class="twm-chip">${d.label}</span>
                ${customerDocsRevealed[key]
                  ? `<span style="font-size:12px;color:var(--twm-text-secondary)">Document preview would load from secure storage once KYC is verified.</span> <button class="twm-btn twm-btn--secondary" data-doc-hide="${key}" style="padding:4px 10px;font-size:12px">Hide</button>`
                  : `<span style="font-size:12px;color:var(--twm-text-muted)">•••• masked</span> <button class="twm-btn twm-btn--secondary" data-doc-reveal="${key}" style="padding:4px 10px;font-size:12px">Reveal</button>`}
              </div>`;
            }).join('')}
          </div>
          <p style="font-size:11px;color:var(--twm-text-muted);margin-top:6px">Masked until explicit reveal — same pattern as Client Me's KYC Vault.</p>
        </div>
        ${callingActions('customer', customer)}
        ${notesBlock('customer', customer.id)}`;
        wireCallingActions(el, 'customer', customer);
        wireNotes(el, 'customer', customer.id);
        el.querySelectorAll('[data-doc-reveal]').forEach((btn) => btn.addEventListener('click', () => { customerDocsRevealed[btn.dataset.docReveal] = true; window.TwmForceRender(); }));
        el.querySelectorAll('[data-doc-hide]').forEach((btn) => btn.addEventListener('click', () => { customerDocsRevealed[btn.dataset.docHide] = false; window.TwmForceRender(); }));
      },
    };
  }

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

    let body = [];
    if (crmTab === 'leads') {
      body.push({ id: 'lead-scoring', title: 'Scoring', render: (el) => { el.innerHTML = `<span class="twm-chip twm-chip--hot">HOT</span> <span class="twm-chip twm-chip--warm">WARM</span> <span class="twm-chip twm-chip--cold">COLD</span>`; }, onFocus: () => window.TwmSetFocus('focus', 'lead-scoring') });
      body.push({
        id: 'lead-pipeline', title: 'Stage Pipeline',
        render: (el) => {
          el.innerHTML = `<div class="twm-kanban">
            ${LEAD_STAGES.map(stageLabel => {
              const stageKey = stageLabel === 'Converted / Lost' ? null : stageLabel;
              const inStage = stageKey ? leads.filter(l => l.stage === stageKey) : leads.filter(l => l.stage === 'Converted' || l.stage === 'Lost');
              return `<div class="twm-kanban__column">
                <div class="twm-chip" style="align-self:flex-start">${stageLabel}</div>
                ${inStage.length === 0 ? `<div class="twm-state-empty" style="padding:16px">No leads at this stage.</div>` : inStage.map(leadCard).join('')}
              </div>`;
            }).join('')}
          </div>
          <p style="font-size:11px;color:var(--twm-text-muted);margin-top:8px">Illustrative fixture leads — not real customers.</p>`;
          el.querySelectorAll('[data-lead]').forEach(btn => btn.addEventListener('click', () => { selectedLeadId = btn.dataset.lead; window.TwmSetFocus('focus', 'lead-detail-' + selectedLeadId); }));
        },
      });
      if (selectedLeadId) {
        const lead = leads.find(l => l.id === selectedLeadId);
        if (lead) body.push(leadDetailPanel(lead));
      }
    } else {
      body.push({
        id: 'customer-list', title: 'Customers',
        render: (el) => {
          el.innerHTML = customers.length === 0
            ? `<div class="twm-state-empty">No customers yet — convert a lead in the Leads tab to create one.</div>`
            : customers.map(c => `<button class="twm-glass twm-btn" data-customer="${c.id}" style="display:block;width:100%;text-align:left;min-height:auto;padding:10px;margin-bottom:8px">${c.name} <span class="twm-chip" style="margin-left:8px">${c.product}</span></button>`).join('');
          el.querySelectorAll('[data-customer]').forEach(btn => btn.addEventListener('click', () => { selectedCustomerId = btn.dataset.customer; window.TwmSetFocus('focus', 'customer-detail-' + selectedCustomerId); }));
        },
      });
      if (selectedCustomerId) {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) body.push(customerDetailPanel(customer));
      }
    }
    body.forEach(p => { if (!p.onFocus) p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'CRM', breadcrumb: ['Employee', 'CRM', crmTab === 'leads' ? 'Leads' : 'Customers'], panels: [tabPanel, ...body] };
  }

  // ---------------- Applications ----------------
  function applicationDetailPanel(app) {
    app.checklist = app.checklist || {};
    app.documents = app.documents || [];
    const checklistComplete = REVIEW_CHECKLIST_ITEMS.every(item => app.checklist[item]);
    const canSendToReview = (app.stage === 'Checklist' || app.stage === 'Documents Requested' || app.stage === 'Admin Approved / Sent Back') && checklistComplete && app.documents.length > 0;
    return {
      id: 'application-detail-' + app.id, title: app.applicant, immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'application-detail-' + app.id),
      render: (el) => {
        el.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:10px"><span class="twm-chip">${app.product}</span><span class="twm-chip">${app.stage}</span></div>
        <p style="font-size:12px;color:var(--twm-text-muted)">Illustrative fixture application — Decision stays empty/pending until a genuine lender/insurer response exists.</p>

        <div style="margin-top:14px">
          <div class="twm-panel__title" style="font-size:14px">Documents</div>
          <p style="font-size:11px;color:var(--twm-text-muted);margin-bottom:8px">Prototype upload — file is listed by name only; nothing is stored or transmitted anywhere.</p>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
            <input type="file" id="doc-upload" class="twm-input" style="padding:6px">
          </div>
          ${app.documents.length === 0 ? `<div class="twm-state-empty" style="padding:10px">No documents added yet.</div>` : `<div style="display:flex;flex-direction:column;gap:6px">${app.documents.map(d => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:13px">${d.name} <span style="color:var(--twm-text-muted);font-size:11px">(added ${new Date(d.ts).toLocaleDateString()})</span></div>`).join('')}</div>`}
        </div>

        <div style="margin-top:14px">
          <div class="twm-panel__title" style="font-size:14px">Review Checklist</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${REVIEW_CHECKLIST_ITEMS.map(item => `<label style="display:flex;align-items:center;gap:8px;font-size:13px">
              <input type="checkbox" data-checklist-item="${item}" ${app.checklist[item] ? 'checked' : ''}>
              ${item}
            </label>`).join('')}
          </div>
        </div>

        <div style="margin-top:14px">
          <button class="twm-btn twm-btn--primary" id="send-to-review" ${canSendToReview ? '' : 'disabled'}>Send to Review</button>
          ${!canSendToReview && app.stage !== 'Submitted for Review' && app.stage !== 'Forwarded to Lender/Insurer' && app.stage !== 'Decision' ? `<p style="font-size:11px;color:var(--twm-text-muted);margin-top:6px">Requires at least one document and every checklist item ticked.</p>` : ''}
        </div>
        ${notesBlock('application', app.id)}`;
        wireNotes(el, 'application', app.id);
        const upload = el.querySelector('#doc-upload');
        upload.addEventListener('change', () => {
          if (upload.files && upload.files[0]) {
            app.documents.push({ name: upload.files[0].name, ts: new Date().toISOString() });
            save('twm-employee-applications', applications);
            logActivity('application', app.id, 'Document added: ' + upload.files[0].name);
            window.TwmForceRender();
          }
        });
        el.querySelectorAll('[data-checklist-item]').forEach(cb => cb.addEventListener('change', () => {
          app.checklist[cb.dataset.checklistItem] = cb.checked;
          save('twm-employee-applications', applications);
          window.TwmForceRender();
        }));
        const sendBtn = el.querySelector('#send-to-review');
        if (sendBtn) sendBtn.addEventListener('click', () => {
          if (!canSendToReview) return;
          app.stage = 'Submitted for Review';
          save('twm-employee-applications', applications);
          logActivity('application', app.id, 'Sent to review');
          addNote('application', app.id, 'Application sent to review — checklist complete, documents attached.');
          window.TwmForceRender();
        });
      },
    };
  }

  function applicationsScreen() {
    const productTypes = ['Demat', 'MF', 'Insurance', 'Loan'];
    const filtered = applicationsFilter ? applications.filter(a => a.product === applicationsFilter || (applicationsFilter === 'MF' && a.product === 'Mutual Funds')) : applications;
    const panels = [
      {
        id: 'applications-filter', title: 'Filter by Product Type',
        render: (el) => {
          el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="twm-chip twm-btn" data-filter="" style="min-height:auto;padding:6px 12px;border:1px solid ${!applicationsFilter ? 'var(--twm-accent-cyan)' : 'transparent'}">All</button>
            ${productTypes.map(x => `<button class="twm-chip twm-btn" data-filter="${x}" style="min-height:auto;padding:6px 12px;border:1px solid ${applicationsFilter === x ? 'var(--twm-accent-cyan)' : 'transparent'}">${x}</button>`).join('')}
          </div>`;
          el.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => { applicationsFilter = btn.dataset.filter || null; window.TwmForceRender(); }));
        },
      },
      {
        id: 'applications-stages', title: 'Stage Sequence',
        render: (el) => {
          el.innerHTML = `<div class="twm-kanban">
            ${APPLICATION_STAGES.map(stage => {
              const inStage = filtered.filter(a => a.stage === stage);
              return `<div class="twm-kanban__column">
                <div class="twm-chip" style="align-self:flex-start">${stage}</div>
                ${inStage.length === 0 ? `<div class="twm-state-empty" style="padding:16px">No applications at this stage.</div>` : inStage.map(a => `<button class="twm-glass twm-btn" data-app="${a.id}" style="display:block;width:100%;text-align:left;min-height:auto;padding:10px;margin-bottom:8px">${a.applicant}<br><span class="twm-chip" style="margin-top:4px">${a.product}</span></button>`).join('')}
              </div>`;
            }).join('')}
          </div>
          <p style="font-size:12px;color:var(--twm-text-muted);margin-top:8px">Decision stays empty/pending until a genuine lender/insurer response exists. Illustrative fixture applications.</p>`;
          el.querySelectorAll('[data-app]').forEach(btn => btn.addEventListener('click', () => { selectedApplicationId = btn.dataset.app; window.TwmSetFocus('focus', 'application-detail-' + selectedApplicationId); }));
        },
      },
    ];
    if (selectedApplicationId) {
      const app = applications.find(a => a.id === selectedApplicationId);
      if (app) panels.push(applicationDetailPanel(app));
    }
    panels.forEach(p => { if (!p.onFocus) p.onFocus = () => window.TwmSetFocus('focus', p.id); });
    return { title: 'Applications', breadcrumb: ['Employee', 'Applications'], panels };
  }

  // ---------------- Tasks ----------------
  function taskDetailPanel(task) {
    return {
      id: 'task-detail-' + task.id, title: task.title, immersive: true,
      onFocus: () => window.TwmSetFocus('focus', 'task-detail-' + task.id),
      render: (el) => {
        el.innerHTML = `<span class="twm-chip ${task.done ? 'twm-chip--success' : ''}">${task.done ? 'Done' : 'Open'}</span>
        <button class="twm-btn twm-btn--secondary" id="toggle-done" style="margin-left:10px">${task.done ? 'Mark Open' : 'Mark Done'}</button>
        ${notesBlock('task', task.id)}`;
        el.querySelector('#toggle-done').addEventListener('click', () => { task.done = !task.done; save('twm-tasks', tasks); window.TwmForceRender(); });
        wireNotes(el, 'task', task.id);
      },
    };
  }

  function tasksScreen() {
    const panels = [{
      id: 'task-list', title: 'Assigned Tasks',
      render: (el) => {
        el.innerHTML = tasks.map(t => `<button class="twm-glass twm-btn" data-task="${t.id}" style="display:flex;justify-content:space-between;width:100%;text-align:left;min-height:auto;padding:10px;margin-bottom:8px">
          <span>${t.title}</span><span class="twm-chip ${t.done ? 'twm-chip--success' : ''}">${t.done ? 'Done' : 'Open'}</span>
        </button>`).join('') + `<p style="font-size:11px;color:var(--twm-text-muted);margin-top:4px">Distinct from My Day's AI-curated queue — this is the literal to-do list. Illustrative fixture tasks.</p>`;
        el.querySelectorAll('[data-task]').forEach(btn => btn.addEventListener('click', () => { selectedTaskId = btn.dataset.task; window.TwmSetFocus('focus', 'task-detail-' + selectedTaskId); }));
      },
      onFocus: () => window.TwmSetFocus('focus', 'task-list'),
    }];
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) panels.push(taskDetailPanel(task));
    }
    return { title: 'Tasks', breadcrumb: ['Employee', 'Tasks'], panels };
  }

  // ---------------- More hub ----------------
  function internalChatBody() {
    const channels = ['General', 'Team Leads'];
    const messages = load('twm-internal-chat', {});
    let activeChannel = 'General';
    return (el) => {
      const draw = () => {
        const msgs = messages[activeChannel] || [];
        el.innerHTML = `<div class="twm-segmented" style="margin-bottom:10px">
          ${channels.map(c => `<button class="twm-segmented__item" data-ch="${c}" aria-selected="${c === activeChannel}">${c}</button>`).join('')}
        </div>
        ${msgs.length === 0 ? `<div class="twm-state-empty" style="padding:12px">No messages yet in ${activeChannel}.</div>` : `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">${msgs.map(m => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:13px">${m}</div>`).join('')}</div>`}
        <div style="display:flex;gap:8px">
          <input class="twm-input" id="chat-input" placeholder="Message ${activeChannel}…">
          <button class="twm-btn twm-btn--secondary" id="chat-send">Send</button>
        </div>
        <p style="font-size:11px;color:var(--twm-text-muted);margin-top:8px">Interaction details beyond placement are an open decision; this is a minimal working mock, local to this browser.</p>`;
        el.querySelectorAll('[data-ch]').forEach(btn => btn.addEventListener('click', () => { activeChannel = btn.dataset.ch; draw(); }));
        el.querySelector('#chat-send').addEventListener('click', () => {
          const input = el.querySelector('#chat-input');
          if (!input.value.trim()) return;
          messages[activeChannel] = (messages[activeChannel] || []).concat(input.value.trim());
          save('twm-internal-chat', messages);
          draw();
        });
      };
      draw();
    };
  }

  function knowledgeSopBody() {
    return (el) => {
      el.innerHTML = `<input class="twm-input" id="sop-search" placeholder="Search knowledge base…" style="margin-bottom:10px">
      <div id="sop-results" style="display:flex;flex-direction:column;gap:6px"></div>`;
      const draw = (q) => {
        const results = SOP_ARTICLES.filter(a => a.toLowerCase().includes((q || '').toLowerCase()));
        el.querySelector('#sop-results').innerHTML = results.length === 0 ? `<div class="twm-state-empty">No articles match.</div>` : results.map(a => `<div class="twm-glass" style="padding:10px;border-radius:var(--twm-radius-sm);font-size:13px">${a}</div>`).join('');
      };
      draw('');
      el.querySelector('#sop-search').addEventListener('input', (e) => draw(e.target.value));
    };
  }

  function performanceBody() {
    return (el) => {
      const leadCounts = LEAD_STAGES.map(s => {
        const key = s === 'Converted / Lost' ? null : s;
        const count = key ? leads.filter(l => l.stage === key).length : leads.filter(l => l.stage === 'Converted' || l.stage === 'Lost').length;
        return { label: s, value: count };
      });
      el.innerHTML = `<div class="twm-panel__title" style="font-size:14px">Leads by stage (derived from your current CRM data)</div>
      ${TwmChart.columns(leadCounts)}
      <p style="font-size:11px;color:var(--twm-text-muted);margin-top:10px">Destination locked; counts above are derived live from CRM fixture data, not invented. <span class="twm-badge twm-badge--pending-decision">Exact KPI definitions — open decision</span></p>`;
    };
  }

  // ---------------- More hub: condensed previews for Overview/Focus tiers ----------------
  // Each pairs with the full body above, which only renders once a tile is opened to
  // Immersive (H-2 "Open full view" mechanism in stage.js) — Overview/Focus stay condensed.
  function internalChatPreview() {
    return (el) => {
      const messages = load('twm-internal-chat', {});
      const totalMsgs = Object.values(messages).reduce((sum, arr) => sum + arr.length, 0);
      el.innerHTML = `<div class="twm-num" style="font-size:20px">${totalMsgs}</div><div class="twm-state-empty" style="padding:8px 0 0">message${totalMsgs === 1 ? '' : 's'} across channels — open for full chat.</div>`;
    };
  }
  function knowledgeSopPreview() {
    return (el) => { el.innerHTML = `<div class="twm-num" style="font-size:20px">${SOP_ARTICLES.length}</div><div class="twm-state-empty" style="padding:8px 0 0">knowledge articles available — open to search.</div>`; };
  }
  function performancePreview() {
    return (el) => {
      el.innerHTML = `<div class="twm-num" style="font-size:20px">${leads.length}</div><div class="twm-state-empty" style="padding:8px 0 0">total pipeline leads — open for stage breakdown. <span class="twm-badge twm-badge--pending-decision">Exact KPI definitions — open decision</span></div>`;
    };
  }
  function dailyReportsPreview() {
    return (el) => {
      const reports = load('twm-daily-reports', []);
      el.innerHTML = `<div class="twm-num" style="font-size:20px">${reports.length}</div><div class="twm-state-empty" style="padding:8px 0 0">report${reports.length === 1 ? '' : 's'} generated — open to view or add one.</div>`;
    };
  }

  function dailyReportsBody() {
    const reports = load('twm-daily-reports', []);
    return (el) => {
      const draw = () => {
        el.innerHTML = `<button class="twm-btn twm-btn--secondary" id="gen-report" style="margin-bottom:10px">Generate today's draft report</button>
        ${reports.length === 0 ? `<div class="twm-state-empty">No reports generated yet.</div>` : `<div style="display:flex;flex-direction:column;gap:6px">${reports.map(r => `<div class="twm-glass" style="padding:8px;border-radius:var(--twm-radius-sm);font-size:13px">${r}</div>`).join('')}</div>`}`;
        el.querySelector('#gen-report').addEventListener('click', () => {
          reports.unshift(`Draft report — ${new Date().toLocaleDateString()} (employee-generated, not an official submission)`);
          save('twm-daily-reports', reports);
          draw();
        });
      };
      draw();
    };
  }

  function moreScreen(panelId) {
    const hubItems = [
      { id: 'internal-chat', title: 'Internal Chat', renderBody: internalChatBody(), renderPreview: internalChatPreview() },
      { id: 'knowledge-sop', title: 'Knowledge and SOP', renderBody: knowledgeSopBody(), renderPreview: knowledgeSopPreview() },
      { id: 'performance', title: 'Performance', renderBody: performanceBody(), renderPreview: performancePreview() },
      { id: 'daily-reports', title: 'Daily Reports', renderBody: dailyReportsBody(), renderPreview: dailyReportsPreview() },
    ];
    if (panelId) {
      // Immersive tier — full body, reached only via the H-2 "Open full view" mechanism
      // (stage.js) from a focused Overview/Focus tile, never rendered directly in Overview.
      const item = hubItems.find(h => h.id === panelId) || hubItems[0];
      return {
        title: item.title, breadcrumb: ['Employee', 'More', item.title],
        panels: [{ id: item.id, title: item.title, render: item.renderBody }],
      };
    }
    // Overview/Focus tier — condensed preview per tile; entering Focus (not a direct
    // route jump) is what makes the H-2 "Open full view" button appear for the focused tile.
    return {
      title: 'More', breadcrumb: ['Employee', 'More'],
      panels: hubItems.map(h => ({
        id: h.id, title: h.title, immersive: true,
        render: (el) => { h.renderPreview(el); },
        onFocus: () => window.TwmSetFocus('focus', h.id),
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
