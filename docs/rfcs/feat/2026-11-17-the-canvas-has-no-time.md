---
id: feat-2026-11-17-the-canvas-has-no-time
type: feat
title: The canvas has no time — nothing can ask "what is the time now" or be told to scrub, play or go live
status: rejected
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/canvas-react]
design_of_record: null
relations:
  - { predicate: relates-to, object: doc:docs/analyst-requirements.md }
  - { predicate: relates-to, object: doc:docs/geo-intelligence-plan.md }
  - { predicate: depends-on, object: doc:docs/canvas-state-plan.md }
---

> **REJECTED 2026-11-17 — kept as the record.** The canvas does not get a clock. Why: (1) history storage and detections belong to the backend (D-7); (2) core stays a pure rendering engine, so view time is the app's concern (D-6 was accepted only while the feature was in scope). The design note `time-model-plan` was discarded with it. What would reopen this: a time-aware product screen that needs a shared, per-user view time inside the canvas. Nothing was implemented; no code or API snapshot changed.

| | |
|---|---|
| What is missing | One shared notion of "now" for the canvas: a state an analyst (or a playbook) can drive — play, pause, seek, rate, window, go live — and one function every layer calls to read it |
| Scope | **Z1 only** of plan P6: the state, the pure `Clock`, the actions, `parseTime`, `useCanvasTime()`. Layer filtering, `TrackStore`, replay, the slider and detections are later RFCs (landing order in `doc:docs/time-model-plan.md` §4) |
| Design of record | The deleted design note `time-model-plan` (D1–D8, accepted 2026-11-17, then discarded with this RFC; its content lives only in this document). Not re-litigated here; only the open points the code raised are decisions below |
| Rows | T1–T9 — see §4 |
| Row status | rejected 9 (T1–T9) · proposed 0 · accepted 0 · implemented 0 · landed 0 |
| Open decisions | none — D-4 moot (rejected); D-1…D-3, D-5…D-7 accepted but moot |
| Ships a story? | Yes — `story:canvas-core/Time/ClockPlayground` (a hook-driven readout; no slider yet, that is P6 step 4) |

## 1. Motivation

| ID | Need | Requirement | Where it shows today | Evidence |
|---|---|---|---|---|
| S1 | Every consumer reads the same "now" | A5, A21 | `TrackingBehaviour` reads `Date.now()` itself | `file:packages/graph/src/behaviours/TrackingBehaviour.ts#L141` |
| S2 | An analyst can leave live and go back to a past moment, then return | A5, A22 | no state to hold "I am looking at 02:10 on the 12th" | `sym:CanvasView` has no time slice |
| S3 | Time is driven by actions, so a playbook / assistant / slider issue the same commands | A9, A25 | actions exist for camera, focus, inspect; none for time | `file:packages/canvas-core/src/state/view/createActions.ts#L156-L316` |
| S4 | Time values from data are comparable | A6, A23 | features carry free-form `properties`; ISO strings, epoch seconds and epoch ms all occur | `file:packages/graph-layer-maplibre/src/features/types.ts#L84` |
| S5 | Live mode costs nothing for a canvas that never opts in | D2 | — | root `CLAUDE.md` machine-rate rule |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| X1 | Write `now` into the store on a timer | rejected | D2; the reactive path is for human-rate state, and a 60 Hz subscriber storm for a value derivable from two numbers is pure waste |
| X2 | Put the clock on `canvas` only (an engine field, not state) | rejected | a playbook, an exported view, a second analyst's panel and `useCanvasTime` all need to *read and drive* it through the store like every other interaction; an engine field is invisible to them |
| X3 | Make scrubbing an undo step | rejected | D3; undo of "I looked at Tuesday" is noise |

## 2. Design

### 2.1 State

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `view.interaction.time: CanvasTime` — `{ mode: 'live' \| 'scrub', anchor: { wall, t }, rate, playing, window: { from, to } \| null, extents: Record<sourceId, { from, to }> }` | D1: per-user, ephemeral, like camera | not in `definition`, so it is not persisted, not converged, not exported |
| 2 | `now()` is `live → wall`; `scrub & !playing → anchor.t`; `scrub & playing → anchor.t + (wall − anchor.wall) × rate` | D2 | no field is written per frame; reading is O(1), allocation-free |
| 3 | Every transition **re-anchors**: `pause`, `setRate` and `goLive` first fold elapsed time into `anchor` | removes the jump a rate change would otherwise cause | each action is a pure `CanvasTime → CanvasTime` function, testable with an injected wall clock |
| 4 | The wall clock is injected into `Clock` (`wall: () => number`, default `Date.now`) | headless tests; K5 (live and replay agree) | the same `Clock` serves tests, stories and the engine |
| 5 | `extents` is **keyed by source id**; `timeExtent(state)` is the union | the slider needs bounds; two layers each know their own data | step 2 and 3 RFCs call `reportExtent(sourceId, …)`; no reshaping later (see D-1) |

### 2.2 What stays out of undo history (D3)

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `classifyViewPatch` returns `'skip'` for any patch whose path is not `definition/*` (user edit) or in `RECORDED_INTERACTION` | `file:packages/canvas/src/engine/Canvas.ts#L227-L231` | **no bypass code is needed**: `interaction/time` is skipped by default. `cameraIntent` is only recorded because it is listed in `RECORDED_INTERACTION` (`#L225`); `time` simply is not |
| 2 | The consequence is **pinned by a test**, so adding `'time'` to that set later is a visible, reviewed change | D3(b) is reserved for a playbook "set window" step | test lives in `pkg:@invana/graph` (root rule 10: no tests in `pkg:@invana/canvas`) |

### 2.3 Parsing

| Input | Result | Note |
|---|---|---|
| `number` | taken as **epoch milliseconds** | no unit guessing. `parseTime(v, { unit: 's' })` for epoch seconds; a heuristic ("looks like seconds") silently misreads 1970 data |
| `Date` | `getTime()` | `NaN` → `null` |
| ISO date-only `YYYY-MM-DD` | UTC midnight | per ECMAScript |
| ISO date-time **without** offset | **UTC** (a `Z` is supplied) | ECMAScript parses these as *local* time; that would break K4 (DST, two analysts in two zones) |
| ISO date-time with `Z` / `±hh:mm` | exact | — |
| anything else / unparseable | `null` | never `NaN`, never throws; callers decide to skip or report |

### 2.4 Where it lives

| Piece | Package | Why |
|---|---|---|
| `CanvasTime` type, `defaultCanvasTime()`, field on `CanvasView.interaction` | `pkg:@invana/canvas-core` | the view type is the vocabulary (`file:packages/canvas-core/src/state/view/CanvasView.ts#L61`) |
| `Clock`, pure transitions, `timeExtent`, `parseTime` | `pkg:@invana/canvas-core` | dependency-free: passes `core-purity` (imports nothing) |
| `actions.time.*` | `pkg:@invana/canvas-core` (`createActions`) | every mutation is a named action; names `view:time:*` feed telemetry |
| `store.clock` (a `Clock` bound to `view`) | interface in `pkg:@invana/canvas-core`, built in `pkg:@invana/canvas-store` | next to `actions`; one instance per canvas |
| `canvas.clock` passthrough, `ctx.store.clock` for layers | `pkg:@invana/canvas` (no new logic, no tests) | layers already reach the store through `ctx.store` |
| `useCanvasTime()` | `pkg:@invana/canvas-react` | headless: reads a store slice, draws nothing |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `time-model-plan` (deleted 2026-11-17) | was the design of record | discarded | nothing; D1–D8 survive only as cited here |
| `doc:docs/canvas-state-plan.md` | kernel rules | landed | interaction is ephemeral; machine-rate stays off the reactive path |
| `rfc:feat-2026-11-17-moving-objects-cannot-be-tracked-live` | consumer | implemented | `clockSource: 'wall'` is today's behaviour and stays so; Z1 does not touch `TrackingBehaviour` |

## 4. The fix

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| T1 | defect | rejected | `file:packages/canvas-core/src/state/view/CanvasView.ts` | add `CanvasTime`, `TimeWindow`, `TimeExtent`; `interaction.time`; `defaultCanvasTime()` in `defaultCanvasView()` | the state exists, defaults to `{ mode: 'live', … }` | **medium** — changes the serialised view shape and the public type | — |
| T2 | defect | rejected | new `file:packages/canvas-core/src/state/time/clock.ts` | `Clock` class + pure `nowOf(time, wall)` + transitions (`seeked`, `played`, `paused`, `rated`, `windowed`, `wentLive`) + `timeExtent(time)` | one place that defines what "now" means | low | T1 |
| T3 | defect | rejected | `file:packages/canvas-core/src/state/view/createActions.ts` | `actions.time.{ play, pause, seek, setRate, setWindow, goLive, reportExtent }`, labels `view:time:*`; `seek(t)` of an unparseable value is a no-op | the commands S3 asks for; validation: `rate` finite and non-zero, `from ≤ to`, `t` finite | low | T1, T2 |
| T4 | defect | rejected | `file:packages/canvas-core/src/state/time/parseTime.ts` | `parseTime(value, opts?) → number \| null` per §2.3 | comparable timestamps (S4) | low | — |
| T5 | defect | rejected | `file:packages/canvas-core/src/state/CanvasStore.ts`, `file:packages/canvas-store/src/CanvasStore.ts` | `readonly clock: Clock` on the interface; `createCanvasStore` builds `new Clock(() => view.getState().interaction.time)` | `store.clock.now()` | **medium** — interface gains a member: every hand-built `CanvasStore` must add it | T2 |
| T6 | defect | rejected | `file:packages/canvas-core/src/index.ts`, `file:packages/canvas-store/src/index.ts`, `file:packages/canvas/src/index.ts`; `api/*.surface.txt` | named exports (rule 16: no new star); regenerate snapshots with `pnpm build && node scripts/check-api-surface.mjs --write` in the same change | surface drift is deliberate and reviewable | **medium** — public API | T1–T5 |
| T7 | defect | rejected | new `file:packages/canvas-react/src/hooks/useCanvasTime.ts` | `useCanvasTime(canvas?)` → `{ mode, playing, rate, window, extent, getNow(), play, pause, seek, setRate, setWindow, goLive }`. Subscribes to the `time` slice only; `getNow` is a **function**, not a value, so the component does not re-render per frame | U1 of the plan | low | T3, T5 |
| T8 | dressing | rejected | `file:packages/canvas/src/io/stateExport.ts` | **no change** to export/import; pinned by a test that a snapshot has no `time` and an import leaves `time` untouched | a stale wall anchor in a saved file would be wrong on reopen; listing this row records that omission is deliberate | low | T1 |
| T9 | defect | rejected | new `story:canvas-core/Time/ClockPlayground` (`apps/storybook/stories/…`) | readout of `mode / now / rate / window / extent` and buttons for each action, via `useCanvasTime`; plain JSON config, no hand-rolled CSS | rule 11 | low | T7 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:createActions` (`v(action, recipe)` seam) | the new actions use it | none — same pattern as `cameraIntent` |
| U2 | `sym:classifyViewPatch` in `file:packages/canvas/src/engine/Canvas.ts#L227` | D3 relies on its default-`skip` | if someone adds `'time'` to `RECORDED_INTERACTION`, scrubbing becomes log noise — pinned by T8's sibling test |
| U3 | `store.view` patch stream (immer structural sharing) | `useCanvasTime` selects the `time` slice | none: an unrelated write leaves the slice identity unchanged |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| W1 | `file:packages/canvas-store/src/CanvasStore.ts` (`createCanvasStore`) | construction | gains `clock` | T5 |
| W2 | `file:packages/canvas-core/tests/helpers/makeContext.ts` | hand-built store | missing `clock` fails `check-types` | add it |
| W3 | `file:apps/storybook/stories/canvas-store/Playground.stories.tsx` | hand-built store | same | add it if it builds a `CanvasStore` literal; otherwise none |
| W4 | `file:packages/canvas-store/src/telemetry/tracing.ts` | decorates `actions` | new `view:time:*` action names appear in traces | none; confirm the wrapper iterates generically |
| W5 | `file:packages/canvas/src/io/stateExport.ts#L206-L224` | serialised state | copies `interaction` field by field, so `time` is excluded **automatically**; any future "serialise whole interaction" refactor would leak it | T8 test |
| W6 | `file:packages/canvas/src/engine/playbook.ts#L122-L195` | playbook capture/apply | captures a fixed list of sections; `time` not among them | none now; a "set window" playbook step is D3(b), later |
| W7 | `api/canvas-core.surface.txt`, `api/canvas-store.surface.txt`, `api/canvas.surface.txt` | published API snapshots | new names | T6, regenerate |
| W8 | `pkg:@invana/canvas-react` consumers of `defaultCanvasView()` shape (tests: `file:packages/canvas-store/tests/view/CanvasView.test.ts`) | tests asserting the exact default view | may deep-equal the whole object | update expected value |
| W9 | `pkg:@invana/graph` `TrackingBehaviour` | behaviour | **none** — keeps `Date.now()`; wiring to `clock` is the replay RFC | — |
| W10 | docs | `doc:docs/geo-intelligence-plan.md` | P6 status line | set Z1 to `implemented` after landing; no `apps/docs/` API page (root rule) |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | `Clock` truth table with an injected wall: live → wall; seek → fixed; play ×1, ×60, ×−1; pause re-anchors; `setRate` mid-play does not jump `now`; `goLive` returns wall | `pkg:@invana/canvas-core` vitest | all pass | T2 |
| V2 | pending | action validation: `rate` 0 / `NaN` / `Infinity` rejected; `from > to` rejected; `seek(NaN)` no-op; `reportExtent(id, null)` removes | `pkg:@invana/canvas-store` `tests/actions.test.ts` | state unchanged on bad input | T3 |
| V3 | pending | `parseTime` table: ms number; `{unit:'s'}`; Date; `2026-03-08` ; `2026-03-08T01:30:00` (UTC, **not** local — run under `TZ=America/New_York` and `TZ=Asia/Kolkata`); `…Z`; `…+05:30`; `'garbage'`; `''`; `NaN` | `pkg:@invana/canvas-core` vitest, both `TZ`s | identical results in both zones | T4 |
| V4 | pending | D3 pin: `play / seek / setRate / setWindow` produce **zero** `canvas.history` entries and `canUndo` stays false | `pkg:@invana/graph` `tests/canvas/` | 0 entries | T3, U2 |
| V5 | pending | export/import: `exportCanvasState` has no `time`; importing a snapshot leaves a running scrub untouched | `pkg:@invana/graph` tests | pass | T8 |
| V6 | pending | `useCanvasTime`: a component re-renders on `seek` / `play`, **does not** re-render while time advances under `play` (render count over 2 s of fake timers) | `pkg:@invana/canvas-react` tests | count unchanged | T7 |
| V7 | pending | **budget**: `clock.now()` ≥ 5 M calls/s (it will be called per layer per frame); `seek` write p95 under 0.2 ms with 20 layers registered, measured, number recorded here | `pkg:@invana/canvas-store` perf test, like `file:packages/canvas-store/tests/performance.test.ts` | meets budget | T2, T3, K1 |
| V8 | pending | surface: `node scripts/check-api-surface.mjs` clean after regenerate; `git diff api/` shows only the new names | repo root | additions only | T6 |
| V9 | pending | `pnpm check-types` (19 packages) · `pnpm check-boundaries` (core-purity) · `pnpm lint` (baseline 0 errors) | repo root | green | T1–T9 |
| V10 | pending | **control**: existing suites unchanged — canvas-core, canvas-store, graph 456, maplibre 109, canvas-ui 22, bubble-sets 20; `LiveTracking` story still ticks on the wall clock | all packages touched + visible Chromium | same counts, same behaviour | W9 |
| V11 | pending | story renders and each action moves the readout; Storybook `tsc --noEmit` clean | `story:canvas-core/Time/ClockPlayground` | as described | T9 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | The plan's §2.1 shows a single `extent`. Keep it, or key by source id? | (a) single `extent` any source overwrites; (b) `extents` keyed by source + derived union | **(b).** Two layers with different ranges would fight over a single field, and changing the state shape in RFC 2 means a second migration of the serialised view. Cost: one extra field and a `reportExtent(sourceId, …)` signature. This **deviates from the wording** of the plan note, so it needs your yes | accepted 2026-11-17 |
| D-2 | Reverse play (negative rate) | (a) allow; (b) forward only | (a). The anchor formula handles it for free, and "scrub back at ×−10" is a natural replay gesture. Layers must tolerate non-monotonic `now` — a stated rule for RFC 2/3 | accepted 2026-11-17 |
| D-3 | `store.clock` vs a free function `nowOf(store)` only | (a) a `Clock` member on `CanvasStore`; (b) function only, no interface change | (a). A member can be spied and injected in tests and avoids every layer rebuilding a closure; costs one interface member (W2, W3) | accepted 2026-11-17 |
| D-4 | `parseTime` numeric default | (a) ms, explicit `unit: 's'`; (b) auto-detect seconds vs ms | (a). Auto-detection misreads small epoch-ms values and any pre-2001 seconds value; one explicit option is cheaper than one silent wrong answer | open |
| D-5 | Time in presentations: a playbook step `view.time` and recording it in the log | (a) own RFC landing before layer filtering; (b) inside Z1; (c) after P6 | (a). Z1 stays state + actions; a playbook must be able to set time before any layer filters by it | accepted 2026-11-17 |
| D-6 | Should time live in core (`view.interaction.time`, `actions.time`, `store.clock`) or in an extension package (`@invana/canvas-time`) so core stays a pure rendering engine? | (a) core as written; (b) new package, own store, explicit behaviour id; (c) core gets only a generic extension seam | Recommended (b). **Maintainer chose (a) on 2026-11-17**, accepting the core vocabulary in exchange for native playbook, export and telemetry integration. Recorded as the answer to a raised concern, not re-opened | accepted 2026-11-17 |
| D-7 | Who owns time-history storage and detections (dwell, co-location, geofence, deviation, ETA)? | (a) the backend; (b) the canvas as a stopgap; (c) an optional extension package | Recommended (a). **Maintainer chose (a) on 2026-11-17.** The canvas holds view time, filters what is already loaded and renders server-sent detection events. Consequences for later RFCs: Z4–Z8 are cut from canvas P6 and re-scoped to rendering events; `TrackStore` shrinks to a bounded replay window fed through a data hook; a window change is announced so the app can load data | accepted 2026-11-17 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened. Read `CanvasView`, `createActions`, `classifyViewPatch`, `stateExport`, `playbook`, `useCamera` | proposed | Found that D3 needs no bypass: `time` is skipped by `classifyViewPatch`'s default; the work is pinning it with a test, not writing code |
| 2026-11-17 | Maintainer accepted D-1, D-2, D-3 and D-5 as recommended; D-4 not yet answered | proposed | D-5 adds a follow-up RFC `feat/…-a-playbook-step-cannot-set-time` (`StepSpec.view.time`, `RECORDED_INTERACTION`, `describeViewParts`), to land before the layer-filtering RFC. Z1 scope unchanged |
| 2026-11-17 | Maintainer raised the concern that core must stay a pure rendering engine; asked whether time belongs in core. Recommendation was an extension package; maintainer chose core as written (D-6) | proposed | Standing guardrail the maintainer stated: core changes add capability, not opinion. Any later core addition (D-5's playbook step field included) is checked against it in its own RFC |
| 2026-11-17 | Maintainer asked why the canvas takes data responsibility; chose backend ownership of history and detections (D-7) | proposed | Z1 scope unchanged: view time is a canvas concern. `doc:docs/time-model-plan.md` D4, D5, D7 and §2.4 now need revising (not yet edited) |
| 2026-11-17 | Maintainer chose to discard time from the canvas: view time becomes an app and server concern (after D-7 gave history and detections to the backend). T1–T9 rejected; RFC rejected | rejected | Rows kept, not deleted. D-5 follow-up RFC (playbook step time) is therefore not needed. `time-model-plan` (since deleted), P6 in `doc:docs/geo-intelligence-plan.md` and the time rows of `doc:docs/analyst-requirements.md` are now out of date (not yet edited) |
| 2026-11-17 | Discarded `time-model-plan.md` (never committed) and its `docs/README.md` line; removed dangling references; added the rejection banner; kept the RFC as the record | rejected | `doc:docs/geo-intelligence-plan.md` line 162 still lists P6 as this RFC (not edited) |
