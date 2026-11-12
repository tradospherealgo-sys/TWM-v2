# V2 Remediation Changelog

Every code and documentation change made during the Tradosphere V2 six-phase completion mission, organized by finding ID. Covers both the implementation session (code changes) and this session (documentation verification/update). Dates are as tracked by the mission; "this session" below refers specifically to the 2026-11-12 documentation-verification session, which made no code changes — all code changes were made in the prior (now-compacted) implementation session and are being catalogued here for the first time as a single changelog.

Verification method for every entry: static code-trace (file:line reading) plus `node --check <file>.js` for syntax validity. No live-browser or Playwright re-run was performed for any entry — see `V2_TEST_RESULTS.md`'s POST-REMEDIATION METHODOLOGY NOTE. Entries below state that explicitly rather than implying live confirmation.

## Cross-cutting bugs

### H-1 — Stale `focusState` not reset on navigation
- **Was:** `focusState` persisted across route changes except via the Dock's own click handler, breaking ⌘K navigation, SMC-connect-then-navigate, Command Centre tile clicks, and back/forward.
- **Fix:** `app.js:101-118` — `renderRoute()` now tracks `lastRouteKey` (`role + '/' + activeDestination`) and resets `focusState` whenever it changes from the previously-rendered route. This covers every navigation path uniformly instead of patching each one individually.
- **Resolves:** P2-08's PARTIAL half (collapsing it into a single WORKING classification), the Admin ⌘K break, the Command Centre tile-click break, the generic back/forward break.
- **Files:** `scripts/app.js`

### H-1 (event-bubbling sub-case) — Nested control clicks bubble into panel focus
- **Was:** Clicking a button/link/input *inside* a panel (e.g., "Connect SMC account") also triggered the panel's own `onFocus()` handler via event bubbling, re-entering Focus mode unexpectedly on ordinary use.
- **Fix:** `stage.js:174-177` — the panel click listener now calls `e.target.closest('button, a, input, select, textarea, [role="button"], [role="tab"]')` and returns early if it matches, before invoking `panel.onFocus()`.
- **Resolves:** The most severe H-1 reproduction path (triggered by completely ordinary use, not a contrived sequence).
- **Files:** `scripts/stage.js`

### H-2 — Client screens have no path to Immersive mode
- **Was:** No Client code ever called `TwmRouter.navigate()` with a 3rd (panel) argument, unlike Employee's More hub and Admin's Command Centre/More hub.
- **Fix:** Shared mechanism added to `stage.js` — any panel with `immersive: true` that is the currently-focused panel in Focus mode now renders a generic "Open full view" button that calls `TwmRouter.navigate(role, destination, panel.id)`. Client panels (Markets, Services, Me) opted in via `immersive: true`.
- **Resolves:** P3-21, P3-32, and the Me-immersive-flows line. P3-44 (Services category panels) deliberately did **not** opt in — see P3-44 entry below; this was a scoping decision, not an oversight.
- **Files:** `scripts/stage.js`, `scripts/content/client.js`

### H-3 — No Disconnect control for `smcConnected`
- **Was:** Only a Connect action existed anywhere in the app; once connected, there was no way back to the not-connected state through the UI.
- **Fix:** A Disconnect control was added alongside the existing Connect control, toggling `smcConnected` back to false through the same state-persistence path Connect already used.
- **Files:** `scripts/content/client.js`

## Priority 1 — Shared architectural primitives

### "Fully Customizable (Option C)" personalization — P3-13/22/38/48, P4-24, P5-28
- **Was:** No implementation anywhere (`grep -rni "draggable|drag|resize|sortable"` returned one false positive, repo-wide).
- **Fix:** Built once as a shared mechanism in `stage.js` — drag-to-reorder, resize-cycle, hide, save/restore layout to `localStorage`, one-click restore-default. Available to every role's stage rather than duplicated per-role.
- **Files:** `scripts/stage.js`

### Chart/data-visualization primitive — P1-21, P3-20/21, P5-36
- **Was:** No canvas/SVG/chart code anywhere in the repo.
- **Fix:** New `scripts/chart.js` (63 lines), exposing `TwmChart.sparkline()`, `TwmChart.columns()`, `TwmChart.funnel()`, each falling back to an honest empty-state when given no/zero data (no fabricated placeholder values).
- **Consumers wired:** Client Home/Markets/Trade F&O simulator (sparkline), Employee Performance tile (columns), Admin Sales & CRM (funnel + columns, `admin.js:213-222`).
- **Files:** `scripts/chart.js`, `scripts/content/client.js`, `scripts/content/employee.js`, `scripts/content/admin.js`

### Inert controls wired — Admin Integrations/Review (P5-26/27), Employee filter chips
- **Was:** Admin's 36 Integration buttons and 3 Applications Review action chips, plus Employee's 4 Applications filter chips, rendered but had no click handlers.
- **Fix:** All wired via real `addEventListener` calls. Admin Integrations state (`getIntegrations()`/`saveIntegrations()`, `admin.js`) is explicitly disclosed in its own UI text as "Prototype controls — no real network call is made," so it is classified WORKING-as-a-disclosed-mock, not a production integration. Employee filter chips now actually filter the static kanban.
- **Files:** `scripts/content/admin.js`, `scripts/content/employee.js`

### Admin phone-width dock overflow — P6-12
- **Was:** `.twm-dock` had no `overflow-x`, `flex-wrap`, or item-shrink rule; a 6-item dock (Admin) overflowed a 375px viewport on both edges.
- **Fix:** `layout.css:94` adds `overflow-x: auto`; `layout.css:165-182` adds a phone-width media query reducing item padding/labels.
- **Files:** `styles/layout.css`

### Admin ⌘K palette filtering — P6-11
- **Was:** The palette's text input was decorative; only clicking a listed button worked.
- **Fix:** `app.js:165-182` wires the input to filter the rendered destination list on every keystroke.
- **Files:** `scripts/app.js`

## Priority 2 — Individual record model

### Individual Lead/Customer/Application/Task record concept — P2-08, P4-22/23/25/27/29
- **Was:** No list of individual, selectable records anywhere in the data model — only panel-level categories — blocking every "selecting a record expands its detail" requirement.
- **Fix:** Shared cross-role `localStorage` data model introduced: `twm-leads`, `twm-customers`, `twm-employee-applications`, `twm-tasks`, `twm-support-tickets`, `twm-record-activity`, `twm-record-notes`, `twm-dpdp-requests` (plus Admin-specific `twm-admin-integrations`, `twm-allocation-rules`, `twm-admin-employees`, `twm-signals-ra-gated`). Admin reads the same real records Employee/Client write — not a separate fixture set.
- **Resolves:** P4-25 (CRM Focus-mode detail), P4-27 (Tasks Focus-mode detail), P4-29 (Applications Focus-mode detail, `reviewActionsBody()` wiring real stage transitions), P4-22 (Calling launched from inside a record). P4-23 (Converted/Lost) upgraded to PARTIAL, not fully WORKING — see below.
- **Files:** `scripts/content/employee.js`, `scripts/content/admin.js`, `scripts/content/client.js`

## Priority 3 — Per-screen gaps

### Client Home — Hero/Journey Map/branching interaction (P3-01/02/03), quick-action tiles (P3-04), Services discovery deep-link (P3-08)
- **Fix:** Real interactive hero/journey-map built; the 4 quick-action tiles and Invest/Protect/Borrow discovery links wired with real click handlers/navigation, replacing static inert chips.
- **Files:** `scripts/content/client.js`

### Client Trade — F&O payoff simulator panel (P3-27)
- **Fix:** Built as one of the five named Practice-mode panel types, previously entirely absent.
- **Files:** `scripts/content/client.js`

### Client Me — Consents/DPDP/Notifications/Support/KYC/Delete-account (P3-51/53/54/55/56)
- **Fix:** Consents & Data Rights ledger, DPDP export/erase/delete-account action buttons, AI-memory controls, Notification preference toggles, Support Ticket list + create-new, KYC Vault reveal-on-demand control, and Delete Account trigger all built — replacing single-sentence placeholders.
- **Files:** `scripts/content/client.js`

### Client Markets/Home — Signals feature with "Trade this" deep-link (P3-62)
- **Fix:** Built; previously the spec only documented where Signals must *not* live (Trade), never where it should.
- **Files:** `scripts/content/client.js`

### Client Services — hero element (P3-39), loading/error states (P3-47)
- **Fix:** Distinct hero element added separate from category panels, matching the spec's "hero *followed by* categories" architecture. Loading and error states added to at least one category/My-Applications panel, using CSS that already existed but was previously unexercised.
- **Files:** `scripts/content/client.js`

### Employee — Calling in-context action (P4-22)
- **Fix:** One-tap call, WhatsApp template, and note-taking built with auto-attach to the record, previously entirely absent.
- **Files:** `scripts/content/employee.js`

### Admin Team — Employees workflow (P5-33), Allocation Engine (P5-34)
- **Fix (partial):** Offboard/Re-onboard toggle and Revoke Sessions (disclosed mock) built and wired (`admin.js:128-156`); Allocation rule add/remove built and wired, persisted to `twm-allocation-rules` (`admin.js:158-188`).
- **Explicitly not built, with in-UI disclosure:** Performance review and call-recording review (no per-employee record-ownership field in the data model yet — `admin.js:138`); Allocation Engine bulk-reassign (lead record has no owner/employee-id field yet — `admin.js:172`). These remain PARTIAL, not WORKING, and the decision not to fabricate the missing field was deliberate.
- **Files:** `scripts/content/admin.js`

### Admin Sales & CRM — org-wide oversight (P5-35), pipeline visualization (P5-36)
- **Fix:** `orgCrmBody()` (`admin.js:200-211`) renders real org-wide lead/customer counts and combined list read from shared stores, explicitly disclosed as "Read-only oversight — record detail and notes live in the Employee workspace." `salesMonitoringBody()` (`admin.js:213-222`) renders real `TwmChart.funnel()`/`columns()` derived live from `leads()`/`applications()`.
- **Still open:** No reassignment-visibility UI exists (blocked on the same owner/employee-id field gap as P5-33/34). P5-35 remains PARTIAL.
- **Files:** `scripts/content/admin.js`

### Admin Signals Desk — RA publish-gating toggle (P5-32)
- **Fix:** Real `#ra-toggle` button built and wired via `addEventListener`, persisting to `twm-signals-ra-gated` (`admin.js:388-405`).
- **Files:** `scripts/content/admin.js`

## Items deliberately left unresolved (not defects — documented decisions or out-of-scope)

- **P3-44** (Services category panels never opted into Immersive) — H-2's shared mechanism was built app-wide, but Services category panels were not given `immersive: true`. Left as a scoping decision pending product input on whether Services needs Immersive at the category level.
- **P3-61** — unchanged NOT CONNECTED, re-confirmed via grep this documentation session; no code change made.
- **P4-06b, P4-20, P4-21** — unchanged PARTIAL. P4-21 specifically: Employee's More hub still renders one flat always-Immersive panel per tile rather than its own Overview/Focus/Immersive structure.
- **P5-29, P5-30, P5-31** — unchanged PARTIAL. P5-29 specifically: Admin's Command Centre tiles call `TwmRouter.navigate()` directly rather than `TwmSetFocus()`, so the spec's separately-described in-place Focus-mode dim behavior was never added alongside the working deep-link behavior — this is an open product decision (see `V2_REMAINING_WORK.md` item #18), not an oversight.
- **Explicitly open product decisions** (employee role-permission detail, Employee Performance KPI definitions, Admin role/permission-set for Review/Compliance actions, Admin System Health metric definitions, Admin "View as" persona switch, light-theme palette) — correctly left unbuilt per the spec package's own disclosure that these are not part of the locked baseline.

## Documentation updates (this session, 2026-11-12)

All of the following were updated to reflect the code changes catalogued above, with explicit per-item file:line evidence and explicit disclosure that live-browser re-testing was not performed this session:
- `V2_PHASE_1_AUDIT.md` — P1-21 resolved; new completion 20/21 (≈95%), up from 19/21.
- `V2_PHASE_2_AUDIT.md` — H-1 resolved; P2-08 double-count collapsed; new completion 15/15 (100%), up from 14/16.
- `V2_PHASE_4_AUDIT.md` — 7 items resolved, 2 upgraded to PARTIAL; new completion 26/31 (≈84%), up from 19/31.
- `V2_PHASE_5_AUDIT.md` — 5 items resolved, 3 upgraded to PARTIAL; new completion 30/36 (≈83%), up from 25/36.
- `V2_PHASE_6_AUDIT.md` — H-1, P6-11, P6-12, P6-13 resolved; new completion 8/8 (100%, code-verified only), up from 6/8.
- `V2_MASTER_AUDIT_REPORT.md` — headline tables split into pre/post-remediation; findings section rewritten; bottom line rewritten to state the 13 remaining open items explicitly.
- `V2_REQUIREMENT_TRACEABILITY.md` — ~30 individual rows updated with resolution status and evidence; top-of-file disclosure note added.
- `V2_TEST_RESULTS.md` — methodology note added disclosing which prior negative-evidence greps and live-test results are now stale.
- `V2_REMAINING_WORK.md` — all 23 punch-list items tagged RESOLVED/PARTIALLY RESOLVED/STILL OPEN inline.
