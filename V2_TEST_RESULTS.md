# V2 Test Results — Consolidated Index

Every test listed here was actually executed against the running prototype (`python3 -m http.server 8743`, serving `~/Downloads/TWM_V2_Prototype`) using Playwright with a real Chromium binary (`chrome-mac-arm64/Google Chrome for Testing`, headless). No result below is inferred from source-reading alone — this file indexes live-execution evidence only. Static file:line findings (the majority of WORKING classifications) are cited in each phase report directly and are not duplicated here.

## Static syntax checks

| Check | Command | Result |
|---|---|---|
| JS syntax validity, all 7 script files | `node --check scripts/*.js scripts/content/*.js` | PASS — all 7 files, zero syntax errors |
| CSS render validity | No CSS-specific syntax checker exists; verified instead by successful browser render (see screenshots below) | PASS |

## Route sweep (Phase 2)

**Script/output:** [test_results.json](V2_AUDIT_EVIDENCE/test_results.json) `route_tests` array.
**Test:** navigated all 24 valid role/destination/panel hash combinations (5 Client + 5 Employee + 6 Admin destinations, plus their reachable panel-level routes), captured panel count, header brand, breadcrumb visibility, and a `hasNotFound` flag per route.
**Result:** 24/24 routes resolved with `hasNotFound: false`. Screenshots: `route_client_home.png`, `route_client_markets.png`, `route_client_trade.png`, `route_client_services.png`, `route_client_me.png`, `route_employee_myday.png` and 18 more in [screenshots/](V2_AUDIT_EVIDENCE/screenshots/).

## Interaction tests (Phase 2)

**Source:** [test_results.json](V2_AUDIT_EVIDENCE/test_results.json) `interaction_tests`.

| Test name | What it did | Result |
|---|---|---|
| `client_dock_click_navigation` | Clicked all 5 Client dock items in sequence | PASS — 5/5 resolved to correct hash |
| `role_switch_select` | Selected Employee then Admin from dev-preview role dropdown | PASS — landed on each role's `destinations[0].id` |
| `ai_fab_visibility` | Read computed `display` on `#twm-ai-fab` for all 3 roles | PASS — client `true`, employee `true`, admin `false` |
| `breadcrumb_visibility_role_gated` | Read computed `display` on `#twm-breadcrumbs` for all 3 roles | PASS — client `false`, employee `false`, admin `true` |
| `admin_cmdk_palette_click` | Clicked the ⌘K button, read resulting destination list and a navigation click | PASS — opened, 6 destinations listed, navigated to `#/admin/team` |
| `admin_cmdk_keyboard_shortcut` | Pressed Cmd/Ctrl+K on an admin route | PASS — palette opened |
| `focus_mode_dim_behavior` | Clicked a My Day panel, measured sibling opacity | PASS (in isolation) — `dimmedCount: 4` of `totalPanels: 5` |
| `employee_more_hub_immersive_nav` | Clicked a More-hub tile on a clean load | FAIL on first run (timeout) → root-caused to H-1, see below |
| `admin_more_hub_immersive_nav` | Same, Admin role | FAIL on first run (timeout) → root-caused to H-1 |
| `admin_command_centre_tile_deeplink` | Clicked a Command Centre tile on a clean load | FAIL on first run (timeout) → root-caused to H-1 |
| Responsive grid reflow | Measured `grid-template-columns` at 390px/844px/900px/1440px | PASS — 1-col/2-col/2-col/3-col as specced |

## H-1 root-cause investigation (Phase 2, 4 reproduction scripts)

| Script | Output | Confirms |
|---|---|---|
| [repro_focus_bug.js](V2_AUDIT_EVIDENCE/repro_focus_bug.js) | screenshots `bug_repro_1_focus_mode.png`, `bug_repro_2_stuck_focus_on_new_screen.png` | Direct-hash-navigation after Focus leaves next screen dimmed/inert |
| [verify_cmdk_focus_bug.js](V2_AUDIT_EVIDENCE/verify_cmdk_focus_bug.js) | [cmdk_focus_bug_verification.txt](V2_AUDIT_EVIDENCE/cmdk_focus_bug_verification.txt), screenshot `bug_repro_3_cmdk_stuck_focus.png` | Admin ⌘K-navigation reproduces the same defect; a real click on the resulting panel times out (`TimeoutError: elementHandle.click: Timeout 4000ms exceeded`) |
| [verify_cascade.js](V2_AUDIT_EVIDENCE/verify_cascade.js) | [cascade_bug_verification.txt](V2_AUDIT_EVIDENCE/cascade_bug_verification.txt), screenshot `bug_repro_4_cascade_poisoned_more_hub.png` | Proves one root cause explains all 3 originally-failing interaction tests above: control (clean load) passes, poisoned (focus engaged first) fails identically every time |
| [verify_smc_bubbling.js](V2_AUDIT_EVIDENCE/verify_smc_bubbling.js) | [smc_bubbling_verification.txt](V2_AUDIT_EVIDENCE/smc_bubbling_verification.txt), screenshots `smc_bubbling_check_1_markets_after_connect.png`, `smc_bubbling_check_2_trade_screen_state.png` | Instrumented `window.TwmSetFocus`; one ordinary click on `#twm-connect-smc` fires an unintended `TwmSetFocus("focus","watchlist")` via event bubbling, then poisons the very next screen navigated to |

## Phase 3 — Client live interaction sweep

| Script | Output | What it found |
|---|---|---|
| [verify_focus_coverage.js](V2_AUDIT_EVIDENCE/verify_focus_coverage.js) | [focus_coverage_verification.txt](V2_AUDIT_EVIDENCE/focus_coverage_verification.txt) | Home: 9 panels, 0 with pointer cursor / 0 interactive. Trade: 5 panels, 0 interactive. Services: 4 panels, 3 interactive (clicking first correctly enters Focus). |
| [verify_me_isolated.js](V2_AUDIT_EVIDENCE/verify_me_isolated.js) | (inline output) | Me, tested in isolation to avoid H-1 contamination: 8 panels, 6 interactive, clicking Profile correctly enters Focus |
| [verify_client_immersive.js](V2_AUDIT_EVIDENCE/verify_client_immersive.js) | [client_immersive_verification.txt](V2_AUDIT_EVIDENCE/client_immersive_verification.txt), screenshot `client_immersive_mechanism_check.png` | Clicking Markets' only interactive panel reaches Focus but never changes the hash to 3 segments; manually forcing a 3-segment hash does correctly reach Immersive — confirms H-2 (mechanism sound, never triggered by Client UI) |

## Phase 4 — Employee live interaction

| Script | Output | What it found |
|---|---|---|
| [verify_employee_more.js](V2_AUDIT_EVIDENCE/verify_employee_more.js) | [employee_more_verification.txt](V2_AUDIT_EVIDENCE/employee_more_verification.txt), screenshot `employee_more_performance_immersive.png` | Clicking the Performance More-hub tile does reach `#/employee/more/performance` with stage class `twm-stage--immersive` — the one case (besides Admin) where Immersive is genuinely reachable from ordinary UI |

## Phase 5 — Admin live interaction

| Script | Output | What it found |
|---|---|---|
| [verify_admin_cc_tiles.js](V2_AUDIT_EVIDENCE/verify_admin_cc_tiles.js) | [admin_cc_tiles_verification.txt](V2_AUDIT_EVIDENCE/admin_cc_tiles_verification.txt), screenshot `admin_cc_tile_deeplink_result.png` | Command Centre tile click navigates directly away (one `hashchange` straight to `#/admin/team`) — never engages an intermediate in-place Focus state |
| `grep -n "addEventListener" scripts/content/admin.js` | zero matches | Confirms all 36 Integration buttons + 3 Applications Review action chips are visually present but have no click behavior whatsoever |

## Phase 6 — Cross-role regression sweep

**Script:** [verify_phase6_crossrole.js](V2_AUDIT_EVIDENCE/verify_phase6_crossrole.js), full output [phase6_crossrole_verification.txt](V2_AUDIT_EVIDENCE/phase6_crossrole_verification.txt).

| Sub-test | Result |
|---|---|
| ⌘K input filtering — typed "complia" into the palette input | All 6 destination buttons remained visible/unfiltered — input is decorative |
| Dock responsive sweep — 3 roles × 3 viewports (phone 375px / tablet 900px / desktop 1440px) | Client & Employee docks fully on-screen at every viewport; Admin's 6-item dock has a bounding box (`left:-26.9` to `right:401.9` at phone width) wider than the 375px viewport — confirmed clipped in screenshot `phase6_admin_phone.png` vs. clean `phase6_client_phone.png`/`phase6_employee_phone.png` |
| Follow-up click test on the clipped Admin "More" button | `.click()` (center-point) still succeeded, landed on `#/admin/more` — button is technically clickable despite visual clipping; its hit-area is ~50% off-screen |
| Pending-decision badge cross-role sweep | Client Services: 2 badges, Employee More: 1 badge, Admin More: 2 badges — consistently used in all 3 roles |
| Role-switch + stale-focus interaction test | Focused a panel in `/employee/myday`, switched to Admin via dropdown — landed cleanly on `#/admin/command-centre` with a normal (non-crashed) render; this specific transition does not reproduce H-1 |
| 44px touch-target measurement, all 9 role×viewport combos | `minDockTouchTarget: 44` in every case |

## Absence-of-feature checks (negative evidence, run fresh across phases)

| Command | Result | Confirms absence of |
|---|---|---|
| `grep -rn "F5F1EB\|1B2A4D\|data-theme\|prefers-color-scheme" styles/ scripts/ index.html` | zero matches | Light theme |
| `grep -rni "chart\|canvas\|svg\|graph" styles/ scripts/` | one false-positive comment only | Chart/data-viz code |
| `grep -rni "draggable\|drag\|resize\|sortable" scripts/ styles/` | one text-string false positive only (a disclosure sentence, not code) | Personalisation/drag/resize |
| `grep -n "disconnect" scripts/content/client.js` | zero matches | SMC Disconnect control |
| `grep -rni "signal" scripts/content/client.js` | zero matches | Signals feature in Client (Markets/Home) |
| `grep -n "call\|whatsapp" -i scripts/content/employee.js` | zero functional matches | Calling/WhatsApp workflow |
| `grep -n "bulk\|rule" -i scripts/content/admin.js` | one descriptive placeholder only | Allocation Engine rule editor/bulk-reassign |
| `grep -n "addEventListener" scripts/content/admin.js` | zero matches | Any functional button wiring in Admin's content |
| `grep -n "₹\|%\|Rs\.\|INR" scripts/content/*.js` | one match (disclosed Practice balance) | Fabricated financial figures |
| `grep -n "Rahul\|Priya\|Amit\|Sharma\|Kumar\|Singh\|Gupta" scripts/content/*.js` | zero matches | Fabricated customer/lead names |
| `grep -n "sidebar\|side-nav\|sidenav" styles/ scripts/ index.html` | comments only | Reintroduced permanent sidebar |

## Known test limitations (disclosed, not papered over)

- No real mobile/notched device or simulator was available — `env(safe-area-inset-*)` behavior (P2-15) is confirmed structurally in CSS but not device-tested.
- No full keyboard-Tab-traversal accessibility sweep was built across all 24×N interactive elements (P2-16) — `:focus-visible` CSS rules are confirmed to exist, but a full traversal test was out of scope for this audit's time budget.
- Subjective/qualitative judgments (visual restraint, role "feel" differentiation — P1-22, P6-15) are explicitly left UNVERIFIED rather than scored, since no script can adjudicate them.

## POST-REMEDIATION METHODOLOGY NOTE (2026-11-12)

This session implemented fixes for every defect this file's live Playwright evidence documented, but **could not re-run any of the Playwright scripts above** — the Preview tool failed with `spawn .../disclaimer ENOENT` (a macOS Gatekeeper app-translocation issue on this machine) and `list_connected_browsers` returned `[]` (no Chrome extension bridge connected). Every verification this session was therefore static: `node --check` on every script file (all pass, zero syntax errors, confirmed fresh) plus direct file:line source re-inspection. This is explicitly weaker evidence than a live click and is disclosed as such in every phase file's own "POST-REMEDIATION UPDATE" section — nothing below is claimed as re-tested live.

**Negative-evidence greps above that are now stale** (the code they found absent now exists, so re-running them would no longer return the same result):
- `grep -rni "chart|canvas|svg|graph" styles/ scripts/` — would now match the new [chart.js](scripts/chart.js) (`TwmChart.sparkline/columns/funnel`).
- `grep -rni "draggable|drag|resize|sortable" scripts/ styles/` — would now match the new Option C implementation in [stage.js](scripts/stage.js) (`panelEl.draggable = true`, drag/drop handlers, resize-cycle button).
- `grep -n "disconnect" scripts/content/client.js` — would now match the real Disconnect button in Me's Linked Accounts panel.
- `grep -n "call|whatsapp" -i scripts/content/employee.js` — would now match `callingActions()`/`wireCallingActions()`.
- `grep -n "addEventListener" scripts/content/admin.js` — would now match dozens of real listeners (Integrations connect/test/health/rotate, Applications Review actions, Team onboard/offboard/revoke, Allocation rule add/remove, RA-gating toggle, DPDP stage-advance).
- `grep -n "bulk|rule" -i scripts/content/admin.js` — would now additionally match a real rule-add/remove UI (bulk re-assign specifically remains absent and is still disclosed in the panel's own text).

**Live-test results above that are superseded by this session's code changes** (described outcome no longer reflects current code, but was not re-confirmed by a new live run):
- `employee_more_hub_immersive_nav` / `admin_more_hub_immersive_nav` / `admin_command_centre_tile_deeplink` (originally FAIL-on-first-run, root-caused to H-1) — H-1 is now fixed at [app.js:114-118](scripts/app.js#L114-L118); these should no longer reproduce the timeout, but this has not been re-run live to confirm.
- `⌘K input filtering` (originally: typed "complia", all 6 buttons stayed visible) — the input now has a real filter listener ([app.js:165-173](scripts/app.js#L165-L173)); re-running this exact test should now show the list narrowing, but this has not been re-run live.
- `Dock responsive sweep` (originally: Admin's 6-item dock bounding box wider than a 375px viewport) — `.twm-dock` now has `overflow-x:auto` plus a phone-width media query; re-running this exact measurement should no longer show an off-screen bounding box, but this has not been re-run live.
- All 4 H-1 reproduction scripts (`repro_focus_bug.js`, `verify_cmdk_focus_bug.js`, `verify_cascade.js`, `verify_smc_bubbling.js`) — describe the pre-fix defect accurately as a historical record; re-running them against current code should now show no stale-focus symptom, since `focusState` is reset on every route-key change and the SMC-connect click no longer bubbles into the panel's own focus listener.

No new live test evidence was generated this session. The only test artifact added is the `node --check` pass confirmed above (no new output file — the command and PASS result are the full evidence). Re-running the full Playwright suite once the Preview tool / Chrome-extension bridge is available again is the correct next verification step, not a substitute for the code-trace work already done.
