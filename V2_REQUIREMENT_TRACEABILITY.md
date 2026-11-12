# V2 Requirement Traceability Matrix

One row per requirement ID assigned across all six phase audits. Full evidence (exact file:line, test command, test result, screenshot) lives in the linked phase report — this file is the index, not a replacement for it. Status values: **WORKING** / **NOT CONNECTED** / **PARTIAL** / **NOT IMPLEMENTED** / **UNVERIFIED**.

**Updated 2026-11-12 (remediation session):** rows marked "resolved 2026-11-12" or "upgraded 2026-11-12" reflect code changes made in the first remediation pass this session, verified by static file:line re-inspection and `node --check` only. Original 2026-11-11 live-test evidence (cited inline where still applicable) remains valid for everything not marked as changed. See each phase file's own "POST-REMEDIATION UPDATE" section for full evidence.

**Updated again 2026-11-12 (live-verification pass):** rows marked "resolved + live-verified 2026-11-12" or "ACCEPTED DESIGN SIMPLIFICATION 2026-11-12" reflect a second pass that used a real local Chromium instance (`playwright-core`, cached revision 1243) against the prototype served at `http://127.0.0.1:8731` — 54/54 live checks passed, 0 failed (`V2_AUDIT_EVIDENCE/2026-11-12_playwright/regression.js` + `results.json`). This closed every remaining PARTIAL/NOT CONNECTED/NOT IMPLEMENTED row in Phases 3-5 except the explicitly-open product-decision items in each phase's §I, either via code (My Day queues, Customer document reveal, Lost reason-code, Applications upload/review, employee-ownership field + bulk-reassign + derived KPIs, News&IPO deep-link, Services Immersive) or via a direct owner decision recorded for Command Centre's Focus pattern and the More-hub 3-tier rebuild. See each phase file's own "LIVE-VERIFICATION UPDATE" section for full evidence and exact test-assertion names.

## Phase 1 — Design Foundation ([full report](V2_PHASE_1_AUDIT.md))

| Req ID | Requirement (one line) | Status |
|---|---|---|
| P1-01 | Locked dark palette (6 colours) | WORKING |
| P1-02 | Typography: Inter, tabular numbers | WORKING |
| P1-03 | Type scale caption→title-lg | WORKING |
| P1-04 | Spacing scale, 4px base | WORKING |
| P1-05 | Radius scale | WORKING |
| P1-06 | Glass surface styling | WORKING |
| P1-07 | Elevation/shadow + border rules | WORKING |
| P1-08 | Buttons: all 6 states | WORKING |
| P1-09 | Inputs: default/focus/disabled/error | WORKING |
| P1-10 | Chips incl. HOT/WARM/COLD/success/practice | WORKING |
| P1-11 | Segmented control/tabs | WORKING |
| P1-12 | Badges incl. pending-decision | WORKING |
| P1-13 | Panel container + title | WORKING |
| P1-14 | Empty/Error/Loading states | WORKING |
| P1-15 | Motion tokens + reduced-motion support | WORKING |
| P1-16 | Focus-mode dim opacity token (20%) | WORKING |
| P1-17 | 44px touch target minimum | WORKING |
| P1-18 | Breakpoints phone/tablet/desktop | WORKING |
| P1-19 | Disclosure strip component | WORKING |
| P1-20 | Light-theme palette | PARTIAL — dark only; spec itself makes it conditional |
| P1-21 | Chart/data-display styles | **WORKING** (resolved 2026-11-12) — shared `TwmChart` primitive (`sparkline`/`columns`/`funnel`) now exists and is consumed across all 3 roles |
| P1-22 | Subjective "glass restraint" visual judgment | UNVERIFIED — not script-checkable |

## Phase 2 — Shared Application Shell ([full report](V2_PHASE_2_AUDIT.md))

| Req ID | Requirement (one line) | Status |
|---|---|---|
| P2-01 | Login/entry concept, disclosed non-functional | WORKING |
| P2-02 | Role-aware workspace renderer | WORKING |
| P2-03 | Hash router `#/<role>/<dest>/<panel?>` | WORKING |
| P2-04 | Identity/context header | WORKING |
| P2-05 | Floating Command Dock rendering | WORKING |
| P2-06 | Dock destinations role-specific, locked | WORKING |
| P2-07 | Adaptive Hybrid Stage — Overview | WORKING |
| P2-08 | Focus mode dim-to-20% behavior | **WORKING** (resolved 2026-11-12) — H-1 fixed app-wide (`renderRoute` now resets `focusState` on every route-key change); the original WORKING-in-isolation/PARTIAL-overall double-count no longer applies |
| P2-09 | Immersive mode, dock minimizes not removed | WORKING |
| P2-10 | Admin ⌘K palette, click + keyboard shortcut | WORKING (open/navigate mechanism only — see P6-11 for the input-filtering gap found in Phase 6) |
| P2-11 | Admin-only breadcrumbs | WORKING |
| P2-12 | AI Companion FAB, Client+Employee only | WORKING |
| P2-13 | Responsive grid reflow 1/2/3-col | WORKING |
| P2-14 | Dev-preview role switch, disclosed non-auth | WORKING |
| P2-15 | Dock never obscures mobile safe areas | UNVERIFIED — no real notched-device test available |
| P2-16 | Visible keyboard focus app-wide | UNVERIFIED — no full Tab-traversal sweep built |

## Phase 3 — Client Experience ([full report](V2_PHASE_3_AUDIT.md))

| Req ID | Requirement (one line) | Status |
|---|---|---|
| P3-01/02/03 | Home Hero/Journey Map/Branching journey (3 named architecture decisions) | **WORKING** (resolved 2026-11-12) — real `JOURNEY_BRANCHES` array (6 branches), each with a real navigate callback |
| P3-04 | Home 4 quick-action tiles | **WORKING** (resolved 2026-11-12) — wired via `addEventListener` to real navigation |
| P3-05 | Home expandable floating market panel | **WORKING** (resolved 2026-11-12) — `immersive: true` + `onFocus`, reachable via the new shared H-2 fix |
| P3-06 | Home educational portfolio preview | WORKING |
| P3-08 | Home Invest/Protect/Borrow deep-link into Services | **WORKING** (resolved 2026-11-12) — `[data-cat]` chips wired via `addEventListener` |
| P3-09 | Home applications/status tracking | WORKING |
| P3-11 | Home AI Companion entry point | WORKING |
| P3-12 | Home notifications empty state | WORKING |
| P3-13/22/38/48 | App-wide personalisation (Option C), Client instance | **WORKING** (resolved 2026-11-12) — shared drag/resize/hide/save-restore primitive built once in `stage.js`, see master finding #3 |
| P3-14 | Markets index strip w/ delay disclosure | WORKING |
| P3-15 | Markets sector performance (public) | WORKING |
| P3-16 | Markets personal watchlist, gated | WORKING |
| P3-17 | Markets market movers (public) | WORKING |
| P3-18 | Markets news & IPO highlights | WORKING |
| P3-19 | Markets pre-connection gating (only watchlist gated) | WORKING |
| P3-20 | Markets Focus: expand with chart+stats | **WORKING** (resolved 2026-11-12) — chart primitive now exists and renders inside Focus |
| P3-21 | Markets Immersive: instrument full-stage w/ chart | **WORKING** (resolved 2026-11-12) — H-2 fixed, chart primitive exists |
| P3-23 | Trade Practice\|Live tab, Practice default | WORKING |
| P3-24 | Trade Practice ₹10,00,000 virtual balance | WORKING |
| P3-27 | Trade Practice F&O payoff simulator | **WORKING** (resolved 2026-11-12) — real strike/premium/qty-driven payoff simulator via `fnoPayoffPanel()` + `TwmChart.sparkline()` |
| P3-29 | Trade PRACTICE ribbon + delay disclosure, all panels | WORKING |
| P3-30 | Trade Practice: no leaderboards/prizes | WORKING (compliant by omission) |
| P3-31 | Trade Practice Focus: expand position w/ chart+stats | **WORKING** (resolved 2026-11-12) — all 4 Practice panels now have `onFocus` |
| P3-32 | Trade Practice Immersive: simulator + order ticket full-stage | **WORKING** (resolved 2026-11-12) — F&O payoff panel is `immersive: true`, reachable via H-2 fix |
| P3-33 | Trade Live not-connected: single Connect banner | WORKING |
| P3-34 | Trade Live connected: never fabricate data | WORKING |
| P3-35 | Trade "Continue in SMC Ace" hand-off + disclosure | WORKING |
| P3-36 | Trade: no interactive/"coming soon" order-booking UI | WORKING (compliant by correct omission) |
| P3-37 | Trade: no Signals panel inside Trade | WORKING (compliant by correct omission) |
| P3-39 | Services hero-then-categories hybrid architecture | **WORKING** (resolved 2026-11-12) — new distinct `services-hero` panel with 3 real goal buttons added |
| P3-40 | Services 3 categories w/ exact sub-items | WORKING |
| P3-41 | Services My Applications, independent top-level panel | WORKING |
| P3-43 | Services Focus: expand category w/ sub-items | WORKING |
| P3-44 | Services Immersive: application flow full-stage | **WORKING** (resolved + live-verified 2026-11-12) — `immersive: true` added to Services' category panels; live-confirmed Focus→Open full view→Immersive click-through in real Chromium |
| P3-45 | Services Loans: RBI/Play-restriction pending badge | WORKING |
| P3-46 | Services Protect: insurer-arrangement pending badge | WORKING |
| P3-47 | Services: loading/error/no-data/unavailable states, all categories | **WORKING** (resolved 2026-11-12) — `my-applications` panel now has real `.twm-state-loading` and `.twm-state-error` (+ Retry) branches in addition to no-data |
| P3-50 | Me: 7 flat categories, no grouping | WORKING |
| P3-51 | Me KYC Vault: masked docs, reveal-on-demand | **WORKING** (resolved 2026-11-12) — real per-document `kycRevealed` state with working Reveal/Hide buttons |
| P3-52 | Me Linked Accounts: Connect/Disconnect pattern | **WORKING** (resolved 2026-11-12) — real Disconnect button wired, resolves H-3 |
| P3-53 | Me Consents & Data Rights: ledger + DPDP actions + AI-memory controls | **WORKING** (resolved 2026-11-12) — real DPDP request filing + real AI-memory delete/delete-all controls |
| P3-54 | Me Notifications: preference toggles | **WORKING** (resolved 2026-11-12) — 4 real persisted checkbox toggles |
| P3-55 | Me Support Tickets: list + create-new | **WORKING** (resolved 2026-11-12) — real create-ticket form + persisted ticket list |
| P3-56 | Me Delete Account: de-emphasized, triggers deletion flow | **WORKING** (resolved 2026-11-12) — real button wired to the same DPDP deletion-request flow as Consents |
| P3-57 | Me: no independent Applications tracker, shortcut only | WORKING |
| P3-58 | Me Focus: category expands in place | WORKING |
| P3-61 | Markets News panel links out to Home's Explore IPOs | **WORKING** (resolved + live-verified 2026-11-12) — `#news-ipo-explore` wired via `addEventListener`; live-confirmed the click actually changes the URL to `#/client/services/cat-invest` in real Chromium |
| P3-62 | Markets/Home Signals cards w/ "Trade this" deep-link | **WORKING** (resolved 2026-11-12) |
| P3-26/28 | Trade Practice panel content accuracy | UNVERIFIED — no real content exists to check |
| P3-42 | Home journey-branch deep-link correctness into Services | UNVERIFIED — mechanism doesn't exist to test |

## Phase 4 — Employee Experience ([full report](V2_PHASE_4_AUDIT.md))

| Req ID | Requirement (one line) | Status |
|---|---|---|
| P4-01 | Dock: 5 destinations, exact order | WORKING |
| P4-02 | AI Copilot FAB, all Employee screens | WORKING |
| P4-03 | My Day: 5 Overview panels | WORKING |
| P4-04 | My Day AI Briefing: illustrative only | WORKING |
| P4-05 | My Day Targets vs Actuals: no invented KPIs | WORKING |
| P4-06 | My Day Focus: queue item engages Focus | WORKING (mechanism) |
| P4-06b | My Day Focus: shows underlying record detail | **WORKING** (resolved + live-verified 2026-11-12) — queues derived live from real leads/tasks/applications; clicking a row deep-links to the real record's detail panel in Immersive |
| P4-07 | CRM Leads\|Customers tab, fixed, Leads default | WORKING |
| P4-08 | CRM lead scoring HOT/WARM/COLD | WORKING |
| P4-09 | CRM lead pipeline: 4 stages exact | WORKING |
| P4-10 | CRM Customer 360° view: 6 items exact | WORKING |
| P4-11 | Applications: filter chips by product type | WORKING (presence) |
| P4-11b | Applications: filter chips actually filter | **WORKING** (resolved 2026-11-12) — `[data-filter]` wired, kanban filters by `applicationsFilter` |
| P4-12 | Applications: 6-stage sequence exact | WORKING |
| P4-13 | Applications Decision: stays pending, never fabricated | WORKING |
| P4-14 | Tasks: literal to-do list, distinct from My Day | WORKING |
| P4-15 | More hub: 4 tiles exact | WORKING |
| P4-16 | More hub tile → Immersive sub-view | WORKING |
| P4-17 | Performance: locked destination, no invented KPIs | WORKING |
| P4-18 | Fixed-chrome exceptions (CRM tab, Applications columns) | WORKING |
| P4-19 | Non-hallucination: no fabricated employee/lead/call data | WORKING |
| P4-20 | CRM Customers: masked docs, reveal-on-demand | **WORKING** (resolved + live-verified 2026-11-12) — real per-document masked/reveal state, mirroring Client Me's KYC Vault pattern |
| P4-21 | More hub: each tile has own Overview/Focus/Immersive | **WORKING** (resolved + live-verified 2026-11-12, owner decision: "rebuild all 8 as full 3-tier screens") — all 4 tiles now land in Focus, each with Open full view reaching Immersive |
| P4-22 | Calling: in-context action w/ auto-attach recording | **WORKING** (resolved 2026-11-12) — one-tap call + WhatsApp template, both auto-logging activity+notes to the record |
| P4-23 | CRM: Converted→Customer record, Lost→reason code | **WORKING** (resolved + live-verified 2026-11-12) — Converted creates a real customer record; Lost now requires a `#lost-reason` select, persisted — live-confirmed both the prompt and the persisted reason |
| P4-24 | App-wide personalisation (Option C), Employee instance | **WORKING** (resolved 2026-11-12) |
| P4-25 | CRM Focus: select lead/customer → full detail | **WORKING** (resolved 2026-11-12) — real lead/customer records now exist and navigate to detail panels |
| P4-26 | CRM Immersive: active call/doc review full-stage | **WORKING** (resolved 2026-11-12) — lead/customer detail panels are `immersive: true`, reachable via H-2 fix |
| P4-27 | Applications Focus: select application → checklist detail | **WORKING** (resolved 2026-11-12) — real per-application buttons navigate to detail panel |
| P4-28 | Applications Immersive: upload/review/send-to-review | **WORKING** (resolved + live-verified 2026-11-12) — real file-upload input, 3-item review checklist, and a gated `#send-to-review` action; live-confirmed both the checklist and upload control render |
| P4-29 | Tasks Focus: select task → detail/notes | **WORKING** (resolved 2026-11-12) — real per-task buttons navigate to detail panel |
| — | Employee role-permission detail | UNVERIFIED — explicitly open product decision, no ID assigned |

## Phase 5 — Admin Experience ([full report](V2_PHASE_5_AUDIT.md))

| Req ID | Requirement (one line) | Status |
|---|---|---|
| P5-01 | Dock: 6 destinations, exact order | WORKING |
| P5-02 | Admin ⌘K + breadcrumbs, supplementary | WORKING (cross-ref Phase 2) |
| P5-03 | Command Centre: 8 cross-cutting tiles | WORKING |
| P5-04 | Command Centre tiles deep-link to destination | WORKING |
| P5-05 | "Needs Your Attention" 3-item action strip | WORKING |
| P5-06 | Team: Employees + Allocation Engine grouped | WORKING (presence) |
| P5-07 | Allocation Engine: 4 assignment methods named | WORKING |
| P5-08 | Sales & CRM: oversight + monitoring grouped | WORKING (presence) |
| P5-09 | Applications Review: reuses Employee's 6-stage sequence | WORKING |
| P5-10 | Applications Review: admin approval-role left open | WORKING |
| P5-11 | Applications Review Decision: stays pending | WORKING |
| P5-12 | Compliance: 4 panels exact | WORKING |
| P5-13 | DPDP requests: non-instant, honest | WORKING |
| P5-14 | DPDP workflow states disclosed as provisional | WORKING |
| P5-15 | DPDP approval authority left open | WORKING |
| P5-16 | More hub: 4 tiles exact | WORKING |
| P5-17 | More hub tile → Immersive sub-view | WORKING |
| P5-18 | Integrations: 9 named services exact | WORKING |
| P5-19 | Integrations: masked keys, honest status | WORKING |
| P5-20 | Signals Desk: 7-stage pipeline exact | WORKING |
| P5-21 | Signals Desk: Shadow Mode default | WORKING |
| P5-22 | Signals Desk: RA-switch role-control left open | WORKING |
| P5-23 | System Health: structure open, no invented values | WORKING |
| P5-24 | Fixed-chrome exceptions (Applications Review/Compliance cols) | WORKING |
| P5-25 | Non-hallucination: no fabricated approval/compliance data | WORKING |
| P5-26 | Integrations: Connect/Test/Health/Rotate (36 buttons) | **WORKING as a disclosed mock** (resolved 2026-11-12) — all wired, local-only, explicitly labelled non-live |
| P5-27 | Applications Review admin actions (3 chips) | **WORKING** (resolved 2026-11-12) — wired, mutates real application-stage records |
| P5-28 | App-wide personalisation (Option C), Admin instance | **WORKING** (resolved 2026-11-12) |
| P5-29 | Command Centre Focus: tile expands in place, dims rest | **ACCEPTED DESIGN SIMPLIFICATION 2026-11-12** — owner explicitly chose "keep deep-link-only" over building in-place Focus; no longer an open defect |
| P5-30 | Command Centre Immersive: review/approval flow full-stage | **ACCEPTED DESIGN SIMPLIFICATION 2026-11-12** — same owner decision as P5-29; generic Signals Desk/System Health content via the existing mechanism is accepted as-is |
| P5-31 | More hub: each tile has own Overview/Focus/Immersive | **WORKING** (resolved + live-verified 2026-11-12, owner decision: "rebuild all 8 as full 3-tier screens") — all 4 Admin tiles now land in Focus, each with Open full view reaching Immersive |
| P5-32 | Signals Desk: RA publish-gating switch control | **WORKING** (resolved 2026-11-12) — real `#ra-toggle` button wired |
| P5-33 | Team Employees: onboard/offboard/session-revoke/perf/call-review | **WORKING** (resolved + live-verified 2026-11-12, owner decision: "derive Performance KPIs from real data") — onboard/offboard + revoke wired; `employeeId` field added, performance now derived live from real leads/customers; live-confirmed KPI numbers render. Call-recording review correctly remains absent — no real telephony data exists in this prototype, disclosed in-UI |
| P5-34 | Allocation Engine: bulk re-assign, editable rules | **WORKING** (resolved + live-verified 2026-11-12) — rule add/remove wired; bulk re-assign now fully wired via the new `employeeId` field (checkbox list + target select + apply); live-confirmed `1 lead reassigned` |
| P5-35 | Sales & CRM: org-wide lead/customer oversight | **WORKING** (resolved + live-verified 2026-11-12) — real org-wide list wired; reassignment/owner visibility now shown via the same `employeeId` field; live-confirmed owner attribution renders |
| P5-36 | Sales & CRM: sales monitoring/pipeline visualization | **WORKING** (resolved 2026-11-12) — real `TwmChart.funnel`/`columns` pipeline visualization |
| — | Admin role/permission-set for approvals | UNVERIFIED — explicitly open product decision |
| — | "View as" persona switch | UNVERIFIED — explicitly out of locked baseline per spec |

## Phase 6 — Cross-Role Consistency ([full report](V2_PHASE_6_AUDIT.md))

| Req ID | Requirement (one line) | Status |
|---|---|---|
| P6-01 | One shared design system, all 3 roles | WORKING |
| P6-02 | Each role clearly differentiated (tokens/structure) | WORKING |
| P6-03 | Dock behaviour mechanism consistent across roles | WORKING |
| P6-04 | No permanent sidebar anywhere | WORKING |
| P6-05 | No invented data/claims (grep-provable half) | WORKING |
| P6-06 | Meaningful, consistently-patterned empty states | WORKING |
| P6-07 | Open decisions consistently labelled, all 3 roles | WORKING |
| P6-08 | Role-switch control: clean landing, no stale-state crash | WORKING |
| P6-09 | Adaptive Hybrid Stage mechanism, shared across roles | WORKING |
| P6-10 | 44px dock touch targets, all roles × all breakpoints | WORKING |
| P6-11 | ⌘K palette input actually filters destinations | **WORKING** (resolved 2026-11-12) — real `input` listener filters the destination list live, Enter/Escape supported |
| P6-12 | Dock renders fully on-screen at phone width, all roles | **WORKING** (resolved 2026-11-12) — `.twm-dock` now has `overflow-x:auto` + phone-width media query with label ellipsis |
| P6-13 | No invented *capabilities* (soft/subjective half) | **WORKING** (resolved 2026-11-12) — the inert-control instances this finding cited (Admin Integrations/Review, Employee filter chips) are all now wired |
| P6-14 | Spec's own "no contradictions found" Phase 6 claim | UNVERIFIED — unsourced same-day planning-doc assertion, not independently verifiable as a test result; this audit's own independent testing did find the P6-12 contradiction |
| P6-15 | Subjective role "feel"-differentiation beyond tokens | UNVERIFIED — qualitative design judgment, not script-checkable |

## Cross-cutting bugs and systemic findings (not tied to one Req ID)

| ID | Finding | First found | Status |
|---|---|---|---|
| H-1 | Stale `focusState` breaks panel interactivity after any non-Dock navigation; 5 confirmed reproduction paths spanning all 3 roles | Phase 2 | **RESOLVED 2026-11-12** — `renderRoute` resets `focusState` on every route-key change; event-bubbling sub-case resolved via a `closest()` guard in `stage.js`'s panel click listener |
| H-2 | Immersive mode structurally unreachable from every Client-role screen | Phase 3 | **RESOLVED 2026-11-12** — shared "Open full view" mechanism added to `stage.js`, app-wide |
| H-3 | `smcConnected` has no Disconnect path anywhere | Phase 3 | **RESOLVED 2026-11-12** — real Disconnect button wired in Client Me's Linked Accounts panel |
