# Phase 5 Audit — Admin Experience

Audit date: 2026-11-11. Audited files: [scripts/content/admin.js](scripts/content/admin.js) (full, 179 lines), cross-referenced against [scripts/dock.js](scripts/dock.js), [scripts/app.js](scripts/app.js) (⌘K palette/breadcrumbs, already verified in Phase 2). Source of truth: `06_ADMIN_INTERFACE.md` (confirmed 2026-11-11), `MASTER_PROMPT.md` §10 and §12 Phase 5, `01_DECISION_REGISTER.md` §A/§H, `09_OPEN_QUESTIONS_AND_NON_HALLUCINATION_RULES.md` (admin role/permission-set and System Health metric definitions are explicitly open/not-finalized).

Method: static file:line citation plus live-browser automated testing via Playwright (Chromium). `grep -n "addEventListener" scripts/content/admin.js` returns zero matches — confirmed fresh this session — meaning every interactive affordance in Admin's content comes exclusively from the shared `onFocus`/panel-click mechanism (`stage.js:41-44`); any button rendered as a raw HTML string inside a panel's own `render()` function has no click behavior at all unless proven otherwise by a live test.

## A. Original planned scope

Per `06_ADMIN_INTERFACE.md`, Admin has a 6-destination dock (Command Centre, Team, Sales & CRM, Applications Review, Compliance, More) plus an Admin-only supplementary ⌘K command palette and breadcrumb layer (already audited and confirmed WORKING in `V2_PHASE_2_AUDIT.md`, not re-derived here). Command Centre is a monitoring-first "Business Command Console" with 8 cross-cutting tiles and a 3-item attention strip. Team groups Employees management with the Allocation Engine. Sales & CRM provides org-wide CRM oversight plus sales monitoring. Applications Review reuses Employee's 6-stage sequence with admin-level actions layered on. Compliance covers consent ledger, data-access log, DPDP requests, and retention jobs. More hubs Integrations, Signals Desk, Content and SOP, and System Health. Fully Customizable (Option C) personalisation applies to Command Centre tiles, Sales & CRM panels, and More's sub-screens, with named fixed-chrome exceptions. Admin role/permission-set detail and System Health metric definitions are explicitly flagged open in the source package.

## B. Successfully working features

| Req ID | Requirement | Source | File:Line | Status |
|---|---|---|---|---|
| P5-01 | Dock: Command Centre → Team → Sales & CRM → Applications Review → Compliance → More, exact order/labels, 6 destinations | "Finalized structure" §Dock | [dock.js:25-31](scripts/dock.js#L25-L31) | WORKING |
| P5-02 | Admin-only ⌘K command palette + breadcrumbs, supplementary to the Dock | "Navigation layer" | already audited in full, `V2_PHASE_2_AUDIT.md` Section B (P2-xx) | WORKING (cross-referenced, not re-derived, to avoid double-counting) |
| P5-03 | Command Centre: 8 cross-cutting count tiles (users, clients, leads, applications by stage, calls today, signals pending review, open tickets, system health) | Command Centre "Overview" | [admin.js:25-34](scripts/content/admin.js#L25-L34) | WORKING — exact 8/8 match |
| P5-04 | Command Centre tiles each deep-link into their matching dock destination | same | [admin.js:39](scripts/content/admin.js#L39), `TwmRouter.navigate('admin', t.dest, t.panel)` | WORKING — live-confirmed: clicking `tile-users` navigates to `#/admin/team` ([admin_cc_tiles_verification.txt](V2_AUDIT_EVIDENCE/admin_cc_tiles_verification.txt)); `admin_command_centre_tile_deeplink` also independently passed on a clean load in Phase 2's cascade test |
| P5-05 | "Needs Your Attention" action strip: applications awaiting review / signals pending approval / compliance requests pending action | Command Centre "Overview" | [admin.js:41-47](scripts/content/admin.js#L41-L47) | WORKING — exact 3-item match, honest empty state |
| P5-06 | Team: Employees + Allocation Engine, grouped | "Team" | [admin.js:52-68](scripts/content/admin.js#L52-L68) | WORKING (presence; functional depth assessed separately, Section E) |
| P5-07 | Allocation Engine: 4 assignment methods named (Manual, Round-Robin, Product Skill, Pincode) | "Team" | [admin.js:61](scripts/content/admin.js#L61) | WORKING — exact 4/4 match |
| P5-08 | Sales & CRM: org-wide CRM oversight + Sales monitoring, grouped | "Sales & CRM" | [admin.js:71-84](scripts/content/admin.js#L71-L84) | WORKING (presence) |
| P5-09 | Applications Review: reuses Employee's exact 6-stage sequence as shared backbone | "Applications Review" | [admin.js:10](scripts/content/admin.js#L10), identical array to `employee.js:13`'s `APPLICATION_STAGES` | WORKING — confirmed byte-for-byte same 6 stage names across both files |
| P5-10 | Applications Review: admin role/permission-set for approval actions is explicitly not locked | same | [admin.js:93](scripts/content/admin.js#L93) | WORKING — correctly shown as a pending-decision badge, matching `09_OPEN_QUESTIONS...md`'s own disclosure |
| P5-11 | Applications Review Decision stays empty/pending, shared honesty standard with Employee | same | [admin.js:98](scripts/content/admin.js#L98) | WORKING |
| P5-12 | Compliance: Consent Ledger, Data-Access Log, DPDP Requests, Retention Jobs — 4 panels | "Compliance" | [admin.js:107-115](scripts/content/admin.js#L107-L115) | WORKING — exact 4/4 match |
| P5-13 | DPDP requests: non-instant, subject-to-legal-review honesty standard | same | [admin.js:112](scripts/content/admin.js#L112) | WORKING |
| P5-14 | DPDP workflow stage names disclosed as an open/provisional decision (spec does not name exact states) | same | [admin.js:112](scripts/content/admin.js#L112), `.twm-badge--pending-decision` on "Exact workflow states" | WORKING — correctly caveated rather than asserted as locked, consistent with the project's own disclosure convention (cf. Employee's lead-pipeline stage names) |
| P5-15 | Role-level DPDP approval authority correctly left open | same | [admin.js:112](scripts/content/admin.js#L112) | WORKING |
| P5-16 | More hub: 4 tiles — Integrations, Signals Desk, Content and SOP, System Health | "More hub" | [admin.js:142-147](scripts/content/admin.js#L142-L147) | WORKING — exact 4/4 match |
| P5-17 | More hub tile navigation reaches a full-stage (Immersive) sub-view | More hub | [admin.js:160](scripts/content/admin.js#L160) | WORKING — same mechanism as Employee's P4-16, independently confirmed in Phase 2's cascade test (`admin_more_hub_immersive_nav`) |
| P5-18 | Integrations: exactly the 9 named services (SMC, Market Data, Google, AI Models, Telephony, WhatsApp Cloud API, Telegram, Email, Storage) | More §Integrations | [admin.js:122](scripts/content/admin.js#L122) | WORKING — exact 9/9 match |
| P5-19 | Integrations: keys masked, honest "not connected" status, never fabricated | same | [admin.js:126](scripts/content/admin.js#L126), `"Not connected · key ••••"` | WORKING |
| P5-20 | Signals Desk: exact 7-stage pipeline (Capture → Parse → Validate → AI Review → Human Review → Publish → Track) | More §Signals Desk | [admin.js:12,134](scripts/content/admin.js#L12) | WORKING — exact 7/7 match |
| P5-21 | Signals Desk: Shadow Mode default, correctly described | same | [admin.js:133,136](scripts/content/admin.js#L133-L136) | WORKING |
| P5-22 | Signals Desk: role-level control for the RA switch correctly left open | same | [admin.js:137](scripts/content/admin.js#L137) | WORKING |
| P5-23 | System Health: states/metrics structure left open, no invented values | More §System Health | [admin.js:146](scripts/content/admin.js#L146) | WORKING |
| P5-24 | Fixed-chrome exceptions: Applications Review / Compliance stage columns, ⌘K/breadcrumb layer not rearrangeable | "Personalisation" | trivially true — nothing is draggable anywhere (see P5-28) | WORKING (by correct, if coincidental, compliance) |
| P5-25 | Non-hallucination: no fabricated approval powers, role-permission matrices, regulatory status, business rules, allocation outcomes, signal outcomes, connected-service status, or system-health values | "Non-hallucination for Admin" | confirmed by full 179-line file read — every panel is an honest empty-state, a correctly-masked integration status, or an explicitly-flagged open decision | WORKING — a clean pass on the audit's highest-priority safety check, consistent with the equivalent clean passes already found for Client (Phase 3) and Employee (Phase 4) |

## C. Implemented-but-disconnected features

| Req ID | Requirement | Gap | File:Line |
|---|---|---|---|
| P5-26 | Integrations: each entry supports connect/test/health/rotate | All 9 services render 4 buttons each (36 buttons total: Connect/Test/Health/Rotate) with correct labels, but `integrationsPanel()` returns a plain HTML string with no `addEventListener` calls anywhere — confirmed by the file-wide `grep` in the Method note above. All 36 buttons are visually present and completely inert. | [admin.js:121-130](scripts/content/admin.js#L121-L130) |
| P5-27 | Applications Review admin actions: Document Checker, Approve/Send Back, Forward to Lender/Insurer | Rendered as 3 static `twm-chip` labels with the correct text, but no click handler of any kind — same inert-button pattern as P5-26. | [admin.js:90-94](scripts/content/admin.js#L90-L94) |

## D. Partially implemented features

| Req ID | Requirement | Gap |
|---|---|---|
| P5-29 | Command Centre "Focus: selecting a tile or action-strip item expands it in place with the underlying detail; rest of stage dims to 20% opacity" | Live-confirmed ([admin_cc_tiles_verification.txt](V2_AUDIT_EVIDENCE/admin_cc_tiles_verification.txt)) that clicking a tile navigates directly to its destination screen in Overview mode — the `hashchange` event log shows exactly one transition straight to `#/admin/team`, with no intermediate Focus-mode state ever occurring. Every tile's `onFocus` calls `TwmRouter.navigate(...)` directly ([admin.js:39](scripts/content/admin.js#L39)) rather than `window.TwmSetFocus('focus', ...)`, so Command Centre's own in-place Focus expansion (dim-and-expand without leaving the screen) is never actually exercised — the spec's "deep-linking" half of the tile behavior is satisfied (P5-04), but the separately-described "expands it in place... dims to 20%" half never happens for any of the 8 tiles. The "Needs Your Attention" action strip has no `onFocus` at all ([admin.js:41-47](scripts/content/admin.js#L41-47)), so it cannot even deep-link, let alone focus-expand. |
| P5-30 | Command Centre "Immersive: a specific review/approval flow goes full-stage" | The 2 tiles that do carry a `panel` argument (`tile-signals` → Signals Desk, `tile-health` → System Health, [admin.js:31,33](scripts/content/admin.js#L31-L33)) do reach Immersive mode via the shared More-hub mechanism (confirmed WORKING for More hub generally in P5-17), but what renders is the generic Signals Desk / System Health content, not a dedicated "review/approval flow" tied to Command Centre's own context. The mechanism works; the specific content described does not exist. |
| P5-31 | More hub: "each opens its own Overview/Focus/Immersive" | Identical finding to Employee's P4-21: `moreScreen(panelId)` ([admin.js:148-153](scripts/content/admin.js#L148-L153)) returns one flat panel per tile, always directly in Immersive mode, with no nested Overview or Focus state of its own. |
| P5-32 | Signals Desk "The RA switch (publish gating) lives here" | The sentence describing the switch renders ([admin.js:137](scripts/content/admin.js#L137)), but no actual toggle/switch control exists anywhere in `signalsDeskPanel()` — described, not built. |

## E. Planned-but-not-implemented features

| Req ID | Requirement | Source | Evidence of absence |
|---|---|---|---|
| P5-33 | Team "Employees — onboard/offboard with instant session revoke, targets, performance, call-recording review" | "Team" | [admin.js:56](scripts/content/admin.js#L56) renders one descriptive sentence only; there is no employee list, no onboarding form, no session-revoke control, and no call-recording review UI anywhere in the file. |
| P5-34 | Team "Allocation Engine — leads/tasks assigned manually, round-robin, product skill or pincode; bulk re-assign; rules editable in the UI" | "Team" | Only the 4 method labels render as static chips (P5-07); `grep -n "bulk\|rule" scripts/content/admin.js` (case-insensitive) finds only the descriptive placeholder sentence at [admin.js:62](scripts/content/admin.js#L62) — no rule editor, no bulk-reassign control, no actual assignment logic of any kind. |
| P5-35 | Sales & CRM "org-wide CRM oversight (all leads/customers across employees, reassignment visibility)" | "Sales & CRM" | [admin.js:75](scripts/content/admin.js#L75) is a one-line honest-empty placeholder; there is no list of leads/customers (consistent with the fact that no individual lead/customer record exists anywhere in the app — same root gap as `V2_PHASE_4_AUDIT.md` P4-23/P4-25), and no reassignment-visibility UI. |
| P5-36 | Sales & CRM "Sales monitoring (business performance view across the pipeline)" | "Sales & CRM" | [admin.js:79](scripts/content/admin.js#L79) is a one-line placeholder; no chart, graph, or pipeline visualization exists — directly inherits Phase 1's confirmed zero-chart-code finding (`V2_PHASE_1_AUDIT.md` P1-21). |
| P5-28 | Fully Customizable (Option C) — Command Centre tiles, Sales & CRM panels, More's sub-screens | "Personalisation" | `grep -rni "draggable\|resize\|sortable" scripts/ styles/` (repo-wide, re-run this session) returns the same single text-string false positive already found in Phases 3 and 4 — zero drag/resize code anywhere. This is the third and final named instance of the identical app-wide decision (Client, Employee, Admin all separately specify it); zero implementation exists for any of the three. Not double-counted in Phase 3/4's numerators — logged once per phase for traceability, to be consolidated in Phase 6. |

## F. Missing screens/components/workflows

No entire dock destination is missing — all 6 route correctly. The missing pieces are entirely at the workflow-action level, already itemized in Section E: there is no employee onboarding/offboarding flow, no allocation rule editor, no org-wide lead/customer list, no sales-pipeline visualization, and (Section C) no functioning integration-connect or application-review-action buttons anywhere — every admin "action" in the spec's sense (approve, send back, forward, connect, rotate, bulk-reassign) exists only as a label, never as working behavior.

## G. Backend/external integration dependencies

| Req ID | Requirement | Dependency |
|---|---|---|
| P5-26 | Real integration connect/test/health/rotate actions | Requires live credentials and server-side connections to each of the 9 named services (SMC, market data, Google, AI models, telephony, WhatsApp Cloud API, Telegram, email, storage) — explicitly out of this frontend-only phase. Correctly stubbed as "Not connected" rather than fabricated. |
| P5-27 | Real document-checker AI pre-check + forward-to-lender/insurer hand-off | Requires backend document-processing and lender/insurer integration — out of scope per `MASTER_PROMPT.md`'s Excluded list. |
| P5-11 | Genuine lender/insurer Decision responses | Same cross-referenced dependency already logged in Phase 3 (Client Services) and Phase 4 (Employee Applications) — one shared backend dependency, not three separate ones. |
| P5-23 | System Health real metric values once defined | `09_OPEN_QUESTIONS_AND_NON_HALLUCINATION_RULES.md` lists this as an explicitly open product decision, not purely a backend dependency — mirrors Employee's Performance-KPI item (`V2_PHASE_4_AUDIT.md` Section G). |

## H. Bugs, inconsistencies, and technical problems

No new Admin-specific defect was found beyond the already-documented, cross-cutting H-1 (`V2_PHASE_2_AUDIT.md`). Notably, Admin is the role in which H-1 was *originally* discovered and has the most reproduction paths of any role (the ⌘K-specific repro and the Command Centre tile-deeplink cascade test both live in Admin) — re-confirmed, not re-logged, here. One additional observation worth flagging as a design-consistency note rather than a new defect: Command Centre's tiles use direct `TwmRouter.navigate()` calls from `onFocus` ([admin.js:39](scripts/content/admin.js#L39)) instead of the `window.TwmSetFocus()` pattern every other screen's panels use — this is *why* P5-29's Focus-mode gap exists, and it is also one more code path (alongside the Dock) that changes `route.destination` without resetting `focusState`, meaning Command Centre's tiles are exactly as vulnerable to inheriting stale focus state as any other non-Dock navigation already documented under H-1.

## I. Unverified requirements and reasons

| Req ID | Requirement | Why unverified |
|---|---|---|
| — | Admin role/permission-set for Applications Review and Compliance approval actions | `09_OPEN_QUESTIONS_AND_NON_HALLUCINATION_RULES.md` explicitly lists this as "not finalized — ask before locking." Correctly out of scope for a PASS/FAIL verdict, same reasoning as Employee's equivalent open item (`V2_PHASE_4_AUDIT.md` Section I). |
| — | "View as" test-persona switch and internal chat admin, mentioned in `frontendquestions.md` Thread 1 | `06_ADMIN_INTERFACE.md`'s own "Not finalized" section explicitly states these are "not part of the locked 11-item functional baseline; not designed in this round." Absence is expected, not a defect — not assigned a requirement ID. |

## J. Evidence references

- Static: exact file:line citations throughout, re-read fresh this session from the full 179-line [admin.js](scripts/content/admin.js), cross-checked against [employee.js:13](scripts/content/employee.js#L13) for the shared Applications stage-sequence match.
- Live interaction: [admin_cc_tiles_verification.txt](V2_AUDIT_EVIDENCE/admin_cc_tiles_verification.txt), script [verify_admin_cc_tiles.js](V2_AUDIT_EVIDENCE/verify_admin_cc_tiles.js), screenshot [admin_cc_tile_deeplink_result.png](V2_AUDIT_EVIDENCE/screenshots/admin_cc_tile_deeplink_result.png) — confirms the tile-click→direct-navigation behavior and the absence of an intermediate Focus state.
- Carried over from Phase 2: [cmdk_focus_bug_verification.txt](V2_AUDIT_EVIDENCE/cmdk_focus_bug_verification.txt), [cascade_bug_verification.txt](V2_AUDIT_EVIDENCE/cascade_bug_verification.txt) (`admin_cmdk_palette_click`, `admin_cmdk_keyboard_shortcut`, `admin_more_hub_immersive_nav`, `admin_command_centre_tile_deeplink` entries), [phase2_immersive_dock_verification.txt](V2_AUDIT_EVIDENCE/phase2_immersive_dock_verification.txt).
- Absence-of-feature commands (run fresh this session): `grep -n "addEventListener" scripts/content/admin.js` → zero matches; `grep -n "bulk\|rule" -i scripts/content/admin.js` → one descriptive-placeholder match only; `grep -rni "draggable\|resize\|sortable" scripts/ styles/` → one text-string false positive, shared repo-wide finding with Phases 3-4.

## K. Actual phase completion

Counting each Req ID in Sections B-E once (27 total applicable requirement lines, excluding the 2 explicitly-open-per-spec items in Section I from the denominator):

- **WORKING: 25** (P5-01 through P5-25)
- **IMPLEMENTED BUT NOT CONNECTED: 2** (P5-26, P5-27)
- **PARTIALLY IMPLEMENTED: 4** (P5-29, P5-30, P5-31, P5-32)
- **NOT IMPLEMENTED: 4** (P5-33, P5-34, P5-35, P5-36) plus P5-28 counted once as the third instance of the single app-wide personalisation gap = 5

Total: 25+2+4+5 = 36. Correcting the running count: WORKING 25, NOT-CONNECTED 2, PARTIAL 4, NOT-IMPLEMENTED 5 (P5-28 and P5-33 through P5-36) = 36 total requirement lines.

**Phase 5 completion: 25/36 (≈69%)** by requirement count (numerator = fully WORKING only, consistent with the Phase 1-4 methodology). This is the highest per-phase completion score of the three role audits (Client 49%, Employee 61%, Admin 69%), driven by Admin's screens being overwhelmingly structural/presence-level (named lists of tiles, services, and pipeline stages that the code reproduces exactly) rather than requiring individual-record interactions the way Client and Employee's Focus/Immersive requirements repeatedly do. The recurring gap pattern is consistent with the rest of the audit: every actionable *button* (Connect/Test/Health/Rotate, Approve/Send Back, Forward to Lender/Insurer) is visually present but wired to nothing, and the app-wide personalisation and chart-rendering gaps already found in Phases 1, 3, and 4 reappear here as Admin's own named instances of the same two unimplemented, cross-cutting features.

---

## POST-REMEDIATION UPDATE (2026-11-12)

**Scope of this update:** remediation/implementation session closing out the defect register above, not a new independent audit. Method: static file:line re-inspection of the fully rewritten [admin.js](scripts/content/admin.js) (now 452 lines, up from 179) plus `node --check`. **The live-browser Preview tool and the Chrome-extension bridge were both unavailable this session** (`spawn .../disclaimer ENOENT`; `list_connected_browsers` returned `[]`) — every status change below is a code-trace verification, not a live-click re-confirmation. "WORKING" below means the code path exists, is wired end-to-end via a real `addEventListener`, and reads/writes a real (if illustrative or explicitly-mock) persisted record — not "re-confirmed by an actual click in a browser this session."

### Resolved this session

| Req ID | Was | Now | Evidence |
|---|---|---|---|
| P5-26 | NOT CONNECTED | **WORKING (as a disclosed mock)** | `integrationsPanel()` now wires all 36 Connect/Test/Health/Rotate buttons via `el.querySelectorAll('[data-act]').forEach(...)`, mutating and persisting a real `twm-admin-integrations` state object per service ([admin.js:367-385](scripts/content/admin.js#L367-L385)). The panel's own disclosure text is explicit that this is "local-only until a real backend integration exists" — correctly presented as WORKING-as-a-mock, not a live connected service (per the mission's "never classify a frontend mock as a production integration" rule, this is flagged as a mock explicitly rather than silently upgraded to an unqualified WORKING). |
| P5-27 | NOT CONNECTED | **WORKING** | `reviewActionsBody()` now wires Document Checker / Approve / Send Back / Forward to Lender/Insurer via real `addEventListener` handlers ([admin.js:261-283](scripts/content/admin.js#L261-L283)) that mutate and persist real application-stage transitions to the same `twm-employee-applications` store Employee writes to, plus a logged note per action. The admin role/permission-set question for *which* role may take these actions remains an explicitly open decision (unchanged badge at [admin.js:253](scripts/content/admin.js#L253)) — the mechanism is WORKING; the permission gate is still correctly left open, not fabricated. |
| P5-32 | PARTIALLY IMPLEMENTED | **WORKING** | `signalsDeskPanel()` now has a real `#ra-toggle` button wired via `addEventListener`, flipping and persisting `twm-signals-ra-gated` ([admin.js:400-404](scripts/content/admin.js#L400-L404)) — the previously-described-only switch is now an actual control. Role-level authority over the switch remains correctly flagged as an open decision (unchanged). |
| P5-36 | NOT IMPLEMENTED | **WORKING** | `salesMonitoringBody()` now renders `TwmChart.funnel(leadFunnel, ...)` for the lead pipeline and `TwmChart.columns(appCols, ...)` for applications-by-stage ([admin.js:213-222](scripts/content/admin.js#L213-L222)), both derived live from the same real `leads()`/`applications()` reads every other screen uses — a genuine business-performance pipeline visualization now exists, inheriting the shared `TwmChart` primitive built for this mission (same fix credited for Client/Employee in Phases 3-4). |
| P5-28 | NOT IMPLEMENTED | **WORKING** | Option C (drag-to-reorder, resize-cycle, hide, save/restore, restore-default) is the same shared stage.js mechanism credited in Phases 3-4, applied identically to Admin's Command Centre/Team/Sales & CRM/Applications Review/Compliance/More — none of Admin's screens opt out via `customizable: false`. Logged here as Admin's own named requirement instance, not double-counted across phases. |

### Upgraded but not fully closed (NOT IMPLEMENTED → PARTIALLY IMPLEMENTED)

| Req ID | Was | Now | What's real vs. still missing |
|---|---|---|---|
| P5-33 | NOT IMPLEMENTED | **PARTIALLY IMPLEMENTED** | `employeesBody()` now renders a real illustrative employee roster (`DEFAULT_EMPLOYEES`) with working Offboard/Re-onboard toggle (persisted) and a Revoke Sessions action (explicitly labeled "prototype — no real session store," [admin.js:128-156](scripts/content/admin.js#L128-L156)). Performance and call-recording review are explicitly *not* built — the panel's own disclosure text states this is because "a per-employee record-ownership field not yet in the data model" would be required, and building it anyway "would mean fabricating attribution" ([admin.js:138](scripts/content/admin.js#L138)). Onboard/offboard half resolved; performance/recording half correctly left undone rather than faked. |
| P5-34 | NOT IMPLEMENTED | **PARTIALLY IMPLEMENTED** | `allocationEngineBody()` now has a real rule editor — add a method+product rule via `#rule-add`, remove via `[data-rule]` — persisted to `twm-allocation-rules` ([admin.js:158-188](scripts/content/admin.js#L158-L188)). Bulk re-assign is explicitly disclosed as not wired, because "the lead record has no owner/employee-id field yet, so reassignment would have nothing real to change" ([admin.js:172](scripts/content/admin.js#L172)) — rule-authoring half resolved; bulk-reassign half correctly left undone rather than faked. |
| P5-35 | NOT IMPLEMENTED | **PARTIALLY IMPLEMENTED** | `orgCrmBody()` now renders real org-wide counts and a real combined list of every lead and customer read from the same shared stores Employee writes to ([admin.js:200-211](scripts/content/admin.js#L200-L211)) — the "all leads/customers across employees" half is resolved. "Reassignment visibility" is not shown (no owning-employee field exists on a lead/customer record, the same data-model gap named in P5-34) — the panel's own footer text discloses this as "read-only oversight," so the gap is disclosed, not silently dropped. |

### Confirmed still open (not falsely claimed resolved)

| Req ID | Status | Why still open |
|---|---|---|
| P5-29 | PARTIALLY IMPLEMENTED (unchanged) | Command Centre's tile `onFocus` handlers still call `TwmRouter.navigate(...)` directly ([admin.js:109](scripts/content/admin.js#L109)) rather than `window.TwmSetFocus('focus', ...)` — tiles still deep-link straight to their destination screen instead of expanding in place with a 20%-dim rest-of-stage. The "Needs Your Attention" action strip still has no `onFocus` at all. This was not touched this session; it is a design-pattern choice (direct deep-link vs. in-place focus) rather than a simple wiring bug, and was left as a disclosed gap rather than guessed at. |
| P5-30 | PARTIALLY IMPLEMENTED (unchanged) | The 2 tiles with a `panel` argument still reach Immersive mode showing the *generic* Signals Desk / System Health content, not a Command-Centre-specific review/approval flow — unchanged this session. |
| P5-31 | PARTIALLY IMPLEMENTED (unchanged) | `moreScreen(panelId)` ([admin.js:414-436](scripts/content/admin.js#L414-L436)) still returns one flat Immersive panel per hub tile with no nested Overview/Focus state — same disclosed design simplification as Employee's P4-21 (`V2_REMAINING_WORK.md` item #19), unchanged this session. |

### Updated Phase 5 completion

Recounting all 36 applicable rows (the 2 explicitly-open Section I items remain excluded from the denominator, unchanged):

- **WORKING: 30** (all of Section B's original 25, plus P5-26, P5-27, P5-32, P5-36, P5-28 — 5 newly resolved)
- **IMPLEMENTED BUT NOT CONNECTED: 0**
- **PARTIALLY IMPLEMENTED: 6** (P5-29, P5-30, P5-31 unchanged, plus P5-33, P5-34, P5-35 upgraded from NOT IMPLEMENTED to PARTIAL)
- **NOT IMPLEMENTED: 0**

**Phase 5 completion (post-remediation): 30/36 (≈83%)**, up from 25/36 (≈69%). Every item that moved, moved up — nothing regressed. The three items upgraded only to PARTIAL (P5-33, P5-34, P5-35) are each honestly disclosed in the code's own UI text as data-model-limited (no owner/employee-id field on a lead/customer record) rather than claimed fully WORKING — consistent with the mission's "never manufacture a 100% score" rule. The three remaining PARTIAL items (P5-29, P5-30, P5-31) are unchanged, disclosed design-pattern gaps, not regressions.
