---
id: feat-2026-11-17-moving-objects-cannot-be-tracked-live
type: feat
title: Moving objects (ships, deliveries, shipments) cannot be tracked live
status: accepted
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/graph-layer-maplibre, pkg:@invana/canvas-ui]
design_of_record: doc:docs/geo-intelligence-plan.md
relations:
  - { predicate: relates-to, object: doc:docs/analyst-requirements.md }
  - { predicate: relates-to, object: rfc:feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config }
  - { predicate: manifests-in, object: story:canvas-demos/by-casestudies/maritime-tracking/LiveTracking }
  - { predicate: blocks, object: doc:docs/geo-intelligence-plan.md }
---

| | |
|---|---|
| What is missing | An analyst can place objects on a map, but cannot say "this vessel is *here*, *now*, heading *this way*, and its last report was *this old*" — there is no fix-ingestion API, no motion between fixes, no trail, no signal state, no follow camera |
| Why it is one RFC | The pieces share one data path (a fix → a position + a heading + a signal state → a frame) and one budget (5,000 objects at 1 Hz); splitting them would decide the hot path three times |
| Scope | Plan P5 rows V1–V7 and E3 (A15–A20, A24). Not P6 (time, replay, geofences) and not P7 (aggregation) |
| Rows | F1–F12 — see §4 |
| Row status | proposed 0 · accepted 0 · implemented 10 (F2–F11) · rejected 1 (F12) · superseded 1 (F1) · landed 0 |
| Open decisions | D9 (§7) — the one deviation from `packages/graph/CLAUDE.md` |

## 1. Motivation

| ID | Need | Requirement | Where it shows today | Evidence |
|---|---|---|---|---|
| S1 | Push position fixes by id; one API for WebSocket, SSE, polling and replay | A15 | the baseline story writes straight to the store: `{ id, lng, lat, course }` per tick, hand-rolled | `story:canvas-demos/by-casestudies/maritime-tracking/LiveTracking` |
| S2 | Motion between fixes — interpolate; dead-reckon when fixes are sparse (AIS: 2 s – 3 min) | A16 | the baseline hops once per second; a late fix freezes the marker | same story, observed 2026-11-17 |
| S3 | Marker turns to the heading | A17 | works from config (`rotationBind: 'data.course'`); the *fast* update path is undecided (RFC T6 of `rfc:feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config`) | `story:graph/Nodes/Icon/Rotated` |
| S4 | Trails — last N minutes / points, fading; the full track on selection | A18 | nothing draws a past position | — |
| S5 | Signal state — moving · stopped · stale · lost; stale and lost look different | A19 | the baseline computes fix age in the story and flips runtime states itself; the states and their overlays do work | same story: a vessel dimmed to `stale` |
| S6 | Follow a selected object | A20 | nothing | — |
| S7 | Thousands of objects at ~1 Hz stay smooth | A24 | unmeasured end to end (store side measured below) | §2 baseline |

**Ruled out** (things that were suspected to be gaps and are not)

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The store is too slow for 5,000 moving objects, so the reactive path needs a redesign | no | measured below: 0.43 ms per 5,000-position write |
| R2 | Positions must go through the reactive/immer store like other state | no — and it must not | `CLAUDE.md` kernel rule: machine-rate fields use the typed-array path; a bulk write never touches immer |
| R3 | Runtime states (`stale` / `lost`) need a new mechanism | no | `GraphStore.setNodeState` + `node.state` overlays + `nodeTypes.<t>.states.<s>.label` already style them; the baseline story shows it |
| R4 | Heading needs whole-shape rotation | no, for now | a rotated shape carries its label (label is a child of the shape container); heading stays an **icon** property (RFC T4/T5) |

## 2. Design

**Measured baseline** (vitest, node, 5,000 nodes, no renderer; 2026-11-17)

| Operation | Cost | Reading |
|---|---|---|
| `store.internal.setPositionsBulk(ids, xy)` over all 5,000 | 0.43 ms | the write is not the budget |
| `store.internal.updateNode(id, { data: { course } })` × 5,000 | 1.3 ms | cheap on the store; the **renderer republish per node** is not measured here |
| `store.internal.setNodeState(id, 'stale', on)` × 5,000 | 1.8 ms | same caveat |
| Renderer cost of 5,000 moving markers, with labels and icons | **not measured** | this is what V7 / F11 must measure — the store numbers say it will be the renderer, not the data |

**What the engine provides and does not**

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | The engine owns the only frame loop; `Canvas.tick` advances the camera, drains every data source's coalesced flush, then updates layers | `file:packages/canvas/src/engine/Canvas.ts#L643` (camera tick) and the flush loop below it; `file:packages/canvas-core/src/contracts/IRenderer.ts#L133-L146` ("the engine owns the only requestAnimationFrame") | a behaviour that needs to run **per frame** has no public seam — layers and behaviours have no `tick`/`onFrame`; only `Layout` (`events 'tick'`) and `animatePositions` (own `requestAnimationFrame`) animate |
| 2 | `LayerData.setPositionsBulk` writes slots and marks each id `moved`, then `schedule()`s one flush | `file:packages/canvas-core/src/state/data/LayerData.ts#L237-L245` | the data path for a frame of positions already exists and already coalesces to one flush per frame |
| 3 | Position writes are **not recorded** in the operation log | `file:packages/graph/src/store/GraphStore.ts#L291` | a track is not history; replay (Z3) needs its own recorded source — P6, not this RFC |
| 4 | `animatePositions` tweens a `from`/`to` buffer pair with its own `requestAnimationFrame` and hands each frame to `onFrame` | `file:packages/canvas-core/src/lib/animation/animatePositions.ts#L50` | it is the right *shape* (flat `Float32Array`, one write per frame) but one tween per target pair, not a stream of fixes, and it breaks "engine owns the only RAF" |
| 5 | Under `MapLayer` the canvas camera is **mirrored from the map** every `move`; a follow camera must move the map, not the canvas camera | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L310-L337` (`syncCameraFromMap` → `camera.setTransform`) | follow needs a driver per camera owner |
| 6 | `BubbleSetsLayer` is the pattern for derived geometry: a `WorldLayer` publishing `path` specs through a `SpecStore`, recomputed on a debounce | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L96-L120` | trails are derived geometry of the same kind (rule 5: a layer publishes specs, never constructs a display object) |

**The shape of the answer**

| Part | One line |
|---|---|
| Ingest | `TrackingBehaviour.pushFixes(fixes)` buffers the latest fixes per id; transport-agnostic |
| Frame | a `frame` event on the canvas bus (one emit per engine tick) drives the behaviour; no second RAF |
| Motion | render at `now − renderDelay` between two fixes (interpolation); past the last fix, dead-reckon from `speed` + `course` for at most `maxExtrapolateMs`, then hold |
| Write | one `setPositionsBulk` per frame, only for ids that moved |
| State | `moving` / `stopped` / `stale` / `lost` as runtime states, written on **transitions only** |
| Trail | a separate `TrailsLayer` (specs), fed by the behaviour's accepted fixes |
| Follow | the behaviour names a target; a camera driver (canvas camera, or the map under `MapLayer`) moves to it |
| Geo | `graph-layer-maplibre` adds the lng/lat ↔ world adapter and the knots/km conversion; `@invana/graph` stays in world units (plan D-T2) |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/geo-intelligence-plan.md` | design of record (P5, V1–V7, E3; decisions D-T1/D-T2) | 📋 | this RFC scopes P5's landing and decides the open frame / budget questions |
| `doc:docs/analyst-requirements.md` | requirements A15–A20, A24 | 📋 | the acceptance language |
| `rfc:feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config` | relates-to | implemented | icon heading (T4) and per-type state labels exist; T5 (whole-shape rotation) and T6 (hot-path icon rotation) are deferred **to this RFC's measurement** (F12) |
| `rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale` | relates-to | accepted | the derived-geometry layer pattern, and the zoom-settle recompute for world-width strokes |
| `doc:docs/canvas-state-plan.md` | constraint | design of record | positions are derived locally and never synced; machine-rate fields use the typed-array path |

## 4. The feature

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | superseded | `pkg:@invana/canvas-core` (`CanvasEventBus` map), `file:packages/canvas/src/engine/Canvas.ts#L643` (`tick`) | **superseded by an event that already exists:** `render:loop:tick` (`sym:FrameTick`) is emitted once per `Canvas.tickOnce`, unconditionally, with `ts` and `dt`. `TrackingBehaviour` subscribes to it; nothing is added to `canvas-core` and the position write lands in the next flush (one frame, imperceptible). Original text: add a `frame` event emitted once per engine tick | behaviours can run per frame without a second `requestAnimationFrame` (G3 holds); one clock for tracking, follow and trails | **medium** — a new event on the core vocabulary, emitted on the hot path of every canvas; widens a public type; `check-api-surface` snapshot changes | — |
| F2 | defect | implemented | `pkg:@invana/graph` `sym:TrackingBehaviour` (new) | `pushFixes(fixes)`: `{ id, t, x, y, course?, speed? }` in world units, `t` in ms epoch; keeps a **short window** of fixes per id (everything from the newest fix at or before `now − renderDelay − 1 s`; two are not enough once the render delay exceeds the fix interval); drops a fix older than the newest (out-of-order); unknown ids fire a `fix:unknown` event and are otherwise ignored (D3); `targetLayerId` + options in `config.behaviours.<id>` | one transport-agnostic ingestion door (A15) | low — additive; a new class | — |
| F3 | defect | implemented | `pkg:@invana/graph` `file:packages/graph/src/behaviours/tracking/motion.ts` (new, pure functions) | per-frame position: between two fixes at `now − renderDelayMs` interpolate linearly (heading by the shortest arc); past the newest fix extrapolate from `speed` + `course` for up to `maxExtrapolateMs`, then hold; collect only ids whose position changed into one `Float32Array`; one `setPositionsBulk` | smooth motion (A16); a late fix no longer freezes a marker for long; **no per-node store calls** per frame | **medium** — the interpolation window deliberately shows the past by `renderDelayMs`; documented, configurable, and part of the stories | F1, F2 |
| F4 | defect | implemented | same behaviour | signal state from fix age and speed: `moving` / `stopped` (speed below `stoppedBelowSpeed` for `stoppedAfterMs`) / `stale` (age > `staleAfterMs`) / `lost` (age > `lostAfterMs`); written through `store.internal.setNodeState` **on transitions only**; the states are the ones the P2 overlays and `nodeTypes.<t>.states` already style | A19; the story's hand-rolled fix-age loop disappears | low | F2 |
| F5 | defect | implemented | same behaviour | when a fix carries `course`, write `data.course` through `store.internal.updateNode` only if it moved by more than `courseEpsilonDeg` (default 1°) | A17 live; a vessel on a steady course costs no republish | **medium** — each write republishes that node's spec in the renderer (unmeasured); the epsilon and F12 bound it | F2, F11 |
| F6 | defect | implemented | `pkg:@invana/graph` `sym:TrailsLayer` (new `WorldLayer`, pattern of `BubbleSetsLayer`) | per tracked id a ring buffer (`maxPoints`, `maxAgeMs`); publishes `path` specs split into `fadeBands` segments of falling alpha; rebuilt when a fix lands, not per frame; `fullTrackOnSelect` draws the selected id's whole buffer; width is `strokeWidthPx / scale`, refreshed on zoom settle (D6) | A18; rule 5 holds — no display object built outside the renderer | **medium** — a new layer; world-unit stroke needs the settle recompute or the trail thins under zoom | F2 |
| F7 | defect | implemented | `pkg:@invana/graph` (behaviour option `follow: { targetId }`) + `file:packages/graph-layer-maplibre/src/MapLayer.ts` (camera driver) | each frame the behaviour asks its camera driver to centre on the target, zoom unchanged; default driver sets the canvas camera, `MapLayer` registers a driver that `jumpTo`s the map (the canvas camera is a mirror there); a user **press** on the map (or a drag on a plain canvas) releases the follow and calls `onFollowReleased` — a press, not a drag, because a follow re-centres the map every frame and `jumpTo` resets MapLibre's drag handler before a drag can start (found in the story); a wheel zoom keeps the follow | A20 on both a plain canvas and a map | **medium** — two camera owners; a driver seam is new; the map driver writes at frame rate | F1, F2 |
| F8 | dressing | implemented | `pkg:@invana/graph-layer-maplibre` | `lngLatFix({ id, t, lng, lat, course?, speedKn? })` → world fix (projects, converts knots to world units per second at that latitude); `pushLngLatFixes` convenience | an app feeds AIS/GPS as-is; `@invana/graph` stays domain-free (plan D-T2) | low | F2 |
| F9 | dressing | implemented | `pkg:@invana/canvas-ui` `file:packages/canvas-ui/src/editors/behaviours/tracking/` | `fields.ts` + `mapping.ts` + connected editor for the behaviour; `TrailsLayer` editor; both classes declare `override readonly kind` (root rule 12) | the studio and stories can edit tracking state (E3) | low — follows the existing pattern | F2, F6 |
| F10 | dressing | implemented | stories (root rule 11) | one story per state: `graph/Behaviours/Tracking/{Interpolation,DeadReckoning,SignalState,Follow}`, `graph/Layer/Trails`; `LiveTracking` migrates onto the behaviour (drops its feed loop for `pushFixes`) | each piece's own states are shown, not hidden in a demo | low | F2–F7 |
| F11 | dressing | implemented | stories + a bench | the **budget**: a headless bench of the data path (already measured, §2) and a Storybook `…/maritime-tracking/Scale5000` story with a frame-time readout (`DevInfoLayer`); measures the CPU-side tick (drain + flush) and reports GPU frame time without gating on it (D8) | A24; the number replaces a guess before F5/F12 are decided | low — measurement only | F3 |
| F12 | defect | rejected | `pkg:@invana/canvas-core` `contracts/IRenderer.ts`, `pkg:@invana/renderer-pixijs` | **rejected — condition not met (F11):** every heading rewritten each second for 5,000 objects costs p95 2.4 ms of tracking tick; a hot path is not needed. Original text: if republishing a node per heading change breaks the budget, add a hot-path `setShapeIconRotation(id, rad)` to the renderer contract (RFC T6) and have F5 use it for `course` | heading updates at scale stay inside the budget | **high** — a renderer-contract addition; a second route for one value (the spec says one thing, the hot path another) | F11 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `LayerData.setPositionsBulk` and its one-flush-per-frame coalescing | the whole data path of F3 | a change to bulk semantics (e.g. recording, or per-id events) makes every frame O(n) heavier — covered by V5 |
| U2 | `Canvas.tick` ordering (camera → flush → layers → renderer) | F1 emits between flush and layers | a reorder moves the `frame` event relative to position visibility |
| U3 | `GraphStore.setNodeState` / `updateNode` semantics (no recording through `internal`) | F4 / F5 | recording them would flood the log |
| U4 | `MapLayer.syncCameraFromMap` | F7's map driver writes the map, the camera follows | a change to the mirror seam breaks follow under a map |
| U5 | `pixi.js` — none | contracts only; F12 is the sole renderer addition and is conditional | — |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:canvas-demos/by-casestudies/maritime-tracking/LiveTracking` | story | its feed loop, fix-age loop and `setPositionsBulk` call are replaced by the behaviour | F10 — keep the baseline's numbers in the RFC history before it changes |
| X2 | `pnpm check-api-surface` snapshots | gate | F1 adds an event to `canvas-core`; F2/F6 add exports to `@invana/graph` | regenerate in the same change (`pnpm build && node scripts/check-api-surface.mjs --write`) |
| X3 | Every `Canvas` consumer | runtime | F1 adds one emit per frame; with no listener it must cost nothing | V6 control |
| X4 | Serialised visualisations (`config`, exported state) | data | gains an optional `behaviours.<tracking>` and `layers.<trails>` entry — additive; old state loads unchanged | none |
| X5 | `story:graph/Nodes/Icon/Rotated`, `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` | stories | share the heading and state-label paths F5 touches | V6 control |
| X6 | `pkg:@invana/canvas-ui` settings registry (`CanvasSettingsEditorPanel`) | editor | two new `kind`s to register | F9 |
| X7 | Docs | docs | `doc:docs/geo-intelligence-plan.md` P5 rows and `doc:docs/analyst-requirements.md` A15–A20, A24 change status | update both when rows land |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | unit: interpolation between two fixes at the render delay; shortest-arc heading across 359° → 1°; out-of-order fix dropped | `pkg:@invana/graph` | position / heading within 1e-6 of the closed form | F2, F3 |
| V2 | pass | unit: dead reckoning from speed + course for exactly `maxExtrapolateMs`, then hold | same | distance travelled = speed × time, capped | F3 |
| V3 | pass | unit: signal-state transitions fire exactly once per change (`moving → stale → lost → moving`), and `stopped` needs the dwell | same | one `setNodeState` per transition, none per frame | F4 |
| V4 | pass | unit: trail ring buffer honours `maxPoints` and `maxAgeMs`; bands fall in alpha; `fullTrackOnSelect` | same | published specs match | F6 |
| V5 | pass | measure: 5,000 objects, 1 Hz fixes, labels + icons + 20-point trails on a selected 50; CPU-side tick (drain + flush) per frame | `story:canvas-demos/by-casestudies/maritime-tracking/Scale5000` | p95 ≤ the D8 budget; GPU frame time reported | F3, F5, F6, F11 |
| V6 | pass | **control** — with no `TrackingBehaviour` registered, a canvas's frame cost and the `Rotated` and `GeoAnnotations` stories are unchanged | `story:graph/Nodes/Icon/Rotated`, `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` | identical rendering; the `frame` emit is free with no listener | F1, F5 |
| V7 | pass | follow: select a vessel, the map keeps it centred; a manual pan releases it and emits `follow:released` — on a plain canvas and under `MapLayer` | `story:graph/Behaviours/Tracking/Follow` | centred within 1 px at rest; released on gesture | F7 |
| V8 | pass | offline: the engine pieces make no outside call (abort non-localhost requests; a plain-canvas story still tracks) | stories without `MapLayer` | tracking works with the network cut | F2–F6 (plan D-10) |
| V9 | pass | lng/lat adapter: knots → world units per second at 1.3° N and 60° N | `pkg:@invana/graph-layer-maplibre` | matches the great-circle value within 0.5 % | F8 |
| V10 | pass | `pnpm check-types` · `check-boundaries` · `check-api-surface` · lint (0 new warnings) · tests in each touched package | repo | green | all |
| V11 | pass | the editor changes a live tracking option (e.g. `staleAfterMs`) through `canvas.update` and the next transition uses it | `story:canvas-ui/editors/…` | applied without remount | F9 |

**Observed (2026-11-17)**

| Check | Result |
|---|---|
| V1–V4 | 31 new tests in `pkg:@invana/graph` (whole suite 456 pass) |
| V5 | `story:canvas-demos/by-casestudies/maritime-tracking/Scale5000`, 5,000 objects, 1 Hz, 50 trails, icons rotating, Chromium on software GL. **Tracking tick** (sample 5,000 + one bulk write): p50 0.6 ms, p95 0.7 ms, max 0.7 ms. **Stress** — every heading rewritten each second: p50 1.8 ms, p95 2.4 ms, max 4.0 ms; `dataFlush` p95 0.1 ms; `layers` p95 3.1 ms. All inside D8 (≤ 4 ms p95). **GPU frame time ≈ 258 ms** (4 fps) — and **the same 257 ms with tracking disabled** (nothing moving, nothing written): it is the software rasteriser drawing 5,000 icon markers, not tracking. Reported, not gated (D8) |
| V6 | `Rotated` and `GeoAnnotations` render with no errors after the change; no core file was touched (F1 superseded), so the per-frame cost of a canvas with no behaviour is unchanged by construction |
| V7 | `story:graph/Behaviours/Tracking/Follow`: selecting a vessel puts it at the exact centre of the viewport and keeps it there; a drag resets the picker to `none` through `onFollowReleased`. Under `MapLayer` (`LiveTracking` with a temporary `follow.targetId`): the map centres on the vessel; a press on the map releases it and the drag then moves the map |
| V8 | `Interpolation` and `Trails` with every non-localhost request aborted: they render, zero outside requests |
| V9 | `packages/graph-layer-maplibre/tests/tracking.test.ts` (8): knots → world units/s within 0.5 % of the great-circle value at 1.3° N, 30° N and 60° N, east–west and north–south. Added `vitest` to the package |
| V10 | `check-types` (19) · `check-boundaries` · `check-api-surface` (unchanged — F1 superseded, and `@invana/graph` is not a snapshotted barrel) · lint 0 errors, graph warnings back at the 35 baseline · tests: graph 456, bubble-sets 16, maplibre 8, canvas-ui 16 |
| V11 | the apply path: `canvas.update({ behaviours: { tracking: { staleAfterMs } } })` reaches the behaviour and the next transition uses it (`trackingBehaviour.test.ts`); the editors' `optionsToForm` / `formToOptions` round-trip and both `kind`s resolve in the settings registry (`trackingEditors.test.ts`). **The editor UI itself was not driven** |

**Findings that changed the RFC**

| ID | Finding | Effect |
|---|---|---|
| N1 | `render:loop:tick` already is a per-frame event, emitted unconditionally | F1 superseded; D1 resolved to "a per-frame event", with no core change and no `check-api-surface` diff |
| N2 | `GraphStore.setPositionsBulk` throws unless `xy.length === ids.length * 2` exactly | the behaviour passes `xy.subarray(0, ids.length * 2)` (a view, no copy) |
| N3 | Two fixes are not enough: with `renderDelayMs` above the fix interval, `now − delay` falls before the older of the two and the object holds at it | F2 keeps a time-trimmed window of fixes (`pushFix`) |
| N4 | A `MapLayer` canvas sets `pointer-events: none`, so a node under it cannot be clicked | follow under a map is a setting (`follow.targetId`), not a click; the `Follow` story (plain canvas) follows by click |
| N5 | `jumpTo` every frame stops MapLibre's drag from ever starting, so `dragstart` never fires while following | the map driver releases on `mousedown` / `touchstart` instead |
| N6 | The trail's head is the newest fix, which is ahead of the marker (drawn `renderDelayMs` in the past) | the docblocks said the opposite; corrected |
| N7 | The status bar of `GraphCanvasApp` reads "0 nodes and 0 edges rendered" while nodes draw (seen in `LiveTracking`, with `MapLayer` and with a plain canvas at 5,000) | not investigated — a stale metric, outside this RFC; candidate follow-up |
| N8 | `packages/graph/CLAUDE.md` says a behaviour never writes a node's `.data` | F5 writes `data[courseKey]` — see D9 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | How does a behaviour get a per-frame hook? | (a) a `frame` event on the canvas bus · (b) the behaviour owns a `requestAnimationFrame` (the `animatePositions` precedent) · (c) a `tick` method on `Behaviour` | (a): one clock, no new base-class contract, free with no listener. (b) breaks "the engine owns the only RAF" and cannot be driven by hand in a test. (c) widens every behaviour for one consumer | accepted 2026-11-17 |
| D2 | How is motion between fixes drawn? | (a) interpolate between the last two fixes (shows the past by a delay) · (b) dead-reckon only (no delay, jumps on each fix) · (c) both: interpolate while fixes are fresh, extrapolate when late | (c) with `renderDelayMs` default 1500: smooth at normal rates and honest when a fix is late. (b) alone jumps at every fix | accepted 2026-11-17 |
| D3 | A fix for an id the graph does not have | (a) ignore · (b) add a node · (c) ignore and emit `fix:unknown` | (c): an unknown id needs a `type` and an icon, which only the app knows; the event lets it add the node, then the next fix lands | accepted 2026-11-17 |
| D4 | Who draws the trail? | (a) a separate `TrailsLayer` · (b) the behaviour | (a): rule 5 — a layer publishes specs; keeps the behaviour domain-free and lets trails be toggled, styled and edited on their own | accepted 2026-11-17 |
| D5 | How does a trail fade? | (a) `fadeBands` segments of falling alpha · (b) per-vertex gradient | (a): `PathSpec` has one stroke alpha; bands need no renderer change. Revisit if banding is visible | accepted 2026-11-17 |
| D6 | Trail width at zoom | (a) world width (thins as you zoom out) · (b) pixel-constant by recompute on zoom settle (as `BubbleSetsLayer` F3) · (c) wait for the P3 pixel-constant stroke | (b): works today with a known pattern; (c) would block P5 on P3 | accepted 2026-11-17 |
| D7 | Where does tracking live? | (a) `@invana/graph` · (b) a new package | (a) as plan D-T2: one behaviour plus one layer; revisit if it grows | accepted 2026-11-17 |
| D8 | What is "inside the budget"? | (a) a frame-time target on the GPU · (b) the **CPU-side tick** (drain + flush) at 5,000 moving objects, with GPU frame time reported but not gated | (b), target ≤ 4 ms p95: a software-rendered CI browser makes GPU frame time meaningless; the CPU side is what this code controls. The store side already measures 0.43 ms | accepted 2026-11-17 |
| D9 | F5 writes the live heading into a node's `.data` (`data.course`), which `packages/graph/CLAUDE.md` forbids for behaviours | (a) write `data[courseKey]` (default `course`, `null` = write none) · (b) bind the icon to a presentation field a behaviour may own (needs a new `NodeStyle` channel) · (c) the app writes the heading itself | (a) as built: a live heading is the feed's own attribute, like the position, not presentation derived from other state; `courseKey: null` opts out. (b) is the compliant route if you disagree and costs a style field in `graph` and `canvas-core` | open — **needs your call** |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened from plan P5 after the `LiveTracking` baseline story and a store-side measurement (setPositionsBulk 0.43 ms, 5,000 courses 1.3 ms, 5,000 states 1.8 ms) | proposed | summarised in chat; no code written |
| 2026-11-17 | Approved whole by the maintainer ("approve the whole plan") | accepted | D1–D8 accepted with the recommendations |
| 2026-11-17 | F2–F11 implemented; F1 superseded by an existing event (N1); F12 rejected, its condition not met (V5); V1–V11 pass except as noted (V11 UI not driven); D9 raised (N8) | accepted | not committed; the RFC reaches `landed` when F2–F11 are `landed` (in `main`) |
