---
id: fix-2026-09-17-auto-fit-frames-the-graph-before-the-layout-runs
type: fix
title: Auto-fit frames the graph before its layout has placed anything, then re-frames in visible hops
status: landed
opened: 2026-09-17
decided: 2026-09-17
landed: 2026-09-18
packages: [pkg:@invana/canvas, pkg:@invana/canvas-react, pkg:@invana/graph]
design_of_record: doc:docs/autofit-bounds-rfc.md
relations:
  - { predicate: caused-by, object: "file:packages/canvas/src/engine/Canvas.ts#L565-L567" }
  - { predicate: caused-by, object: "file:packages/canvas-react/src/layouts/ElkLayout.tsx#L56" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/tasks-panel/RunFlow" }
  - { predicate: relates-to, object: "doc:docs/autofit-bounds-rfc.md" }
  - { predicate: relates-to, object: "rfc:fix-2026-09-13-autofit-crops-composite-graphs" }
---

## Summary

| | |
|---|---|
| **What breaks** | A canvas with `config.fitOnLoad: true` **and** an `activeLayout` opens zoomed ~9× into empty space for ~0.5 s, then jumps — in several discrete steps — out to the framed graph |
| **Root cause** | `sym:Canvas._armAutoFit` fits **immediately** on arming, at a moment when the layout has not run and every node still sits at the store origin. The box is one node wide, and the zoom is a faithful consequence of it |
| **Not** | Stale bounds. `doc:docs/autofit-bounds-rfc.md` fixed that in 2026-08-13; `sym:GraphLayer.getBounds` now reads the store and is fresh. The box is **honest** — it is measured at the wrong *moment* |
| **Second defect** | The same report also covers a **500 ms fly-out from the centre**: every node glided from `(0, 0)` on the first layout run, because the store could not say "never positioned". Rows F6 · F7 |
| **Defect rows** | F1 · F2 · F3 · F4 (fit sequencing) · F6 · F7 (fly-out) — all landed |
| **Dressing rows** | F5 (per-story `fitOnLoad: false`) — rejected |
| **Open decisions** | None. D1 · D2 · D3 closed by what shipped (2026-09-18); D5 · D6 decided during implementation. **Carried forward instead:** D9 of `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load` (the user-owned-camera bit) |
| **Row status** | **landed 6** · rejected 1 — 7 rows, every one accounted for, so the RFC is **landed** |
| **Measured** | Visible states on load: **37 → 12**; the 741–1242 ms animation run is gone, and the graph is framed and in place by ~736 ms |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Canvas opens zoomed into the centre on empty space, settles to the fitted graph ~0.5 s later | `story:usecases/by-casestudies/tasks-panel/RunFlow` | Headless capture at virtual-time 1200 ms: background grid (28 world px) measures ~245 screen px ⇒ zoom ≈ **8.75×**, no cards in frame |
| S2 | The settle is not one move — it reads as a jitter | same | `sym:Canvas._armAutoFit` can issue a fit from three independent signals (`data:flush`, `layout:run:tick`, `layout:run:end`), each leading-edge-throttled at 100 ms, each an instant `sym:Camera.fitContent` — so a burst lands as several discrete camera writes |
| S3 | Final framing is correct | same | Capture at 1700 ms and beyond is byte-identical and correctly framed |
| S4 | Reported as a product defect, not a story defect | user report, 2026-09-17 | "the canvas is loading once all data zoom-in to the center and with jittery effect settling to fit"; asked for a core fix, not a per-story one |
| S5 | **After F1–F4 landed**, the graph still *flies out from the centre* over ~500 ms on first load | same | CDP screencast: 37 distinct visible states, of which ~25 are consecutive single-frame states between **741 ms and 1242 ms** — a continuous animation, not a settling staircase. 500 ms is exactly `sym:DEFAULT_POSITION_TRANSITION_MS` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Stale / unfresh bounds — the 2026-08 failure mode | **No** | `sym:GraphLayer.getBounds` derives from `store.getPosition` + `boundsOfNode` since `doc:docs/autofit-bounds-rfc.md` §8. At fit time the positions genuinely are all `(0,0)` |
| R2 | The ELK solve is slow or re-runs repeatedly | **No** | Captures are byte-identical from 1700 ms on; one settle, not a loop |
| R3 | A camera tween animates the jump | **No** | `sym:Camera.fitContent` writes `binding.setTransform` directly — instant, no easing (`file:packages/canvas-core/src/abstracts/Camera.ts#L321-L347`) |
| R4 | Composite origin offset (`rfc:fix-2026-09-13-autofit-crops-composite-graphs`) | **No** | That lands the box half a card off; here the box is correct *for the positions that exist* |
| R5 | Only affects stories that removed manual positions | **Partly** | Manual positions masked it: both fitters then framed the same box. Any graph whose placement comes from a layout is exposed — which is most of them |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | `config.fitOnLoad: true` arms auto-fit on the `update()` that carries it | `file:packages/canvas/src/engine/Canvas.ts#L695` | Arming happens at config-apply time, before any layout has run |
| D-2 | Arming fits **immediately** — "harmless otherwise (the run-driven fits below supersede it)" | `file:packages/canvas/src/engine/Canvas.ts#L565-L567` | A fit is issued while the graph has no layout-assigned positions |
| D-3 | With no `position` on any node, the store holds `(0, 0)` for all of them | `sym:GraphNode.position` is optional; placement is the layout's job | `_contentBounds` unions N coincident cards → one card: **146 × 68** |
| D-4 | `sym:Camera.fitContent` scales that box into the viewport | `file:packages/canvas-core/src/abstracts/Camera.ts#L327-L331` | `(1440 − 2×80) / 146 = 8.77×` — the measured 8.75× (S1). Height is not binding: `(900 − 160) / 68 = 10.9` |
| D-5 | ELK completes; `layout:run:end` + the flush window fire further fits | `file:packages/canvas/src/engine/Canvas.ts#L546-L589` | Camera travels 8.77× → ~1× in several leading-edge-throttled steps (S2) |
| D-6 | The config-first React wrapper fits **again**, on its own `end`, with its own padding | `file:packages/canvas-react/src/layouts/ElkLayout.tsx#L56`, `#L68-L72` | Two owners write the transform with different paddings (80 vs the prop) — a final extra hop even after D-5 settles |

**Why exactly this symptom:** D-3 + D-4 give a *specific, predictable* zoom — one node's box scaled into the viewport — which is what "zoomed into the centre on nothing" is. D-5 + D-6 give a *multi-step* return rather than one move, which is what reads as jitter. A cause that produced a wrong-but-stable frame, or a single smooth move, would not match.

### Second chain — the fly-out (S5)

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-7 | `sym:OneShotLayoutOptions.transition` defaults to **`true`** → 500 ms glide from current to computed positions | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L33-L43` | Every one-shot layout animates its result by default, ELK included |
| D-8 | The glide's start point is `store.getPosition(id)`, with the documented intent *"New (un-positioned) nodes start at their target so they don't fly in from the origin"* | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L253-L259` | The intent is correct and is the behaviour we want |
| D-9 | `sym:GraphStore.readPosition` returns `{ x, y }` read straight from the typed-array columns, which are **zero-filled on insert** — there is no "never positioned" state | `file:packages/graph/src/store/GraphStore.ts#L1518-L1524` | `p` is never nullish, so D-8's guard is dead code. Every node starts at `(0, 0)` |
| D-10 | 8 cards therefore glide from the viewport origin to their ELK positions over 500 ms, while the armed auto-fitter follows the expanding cloud (`data:flush` per frame, throttled) | S5's screencast | "Zoom-in to the center, jittery, settling to fit" — the second half of the original report |

**Why the first fix didn't cover it:** F1 removed the *camera's* pre-layout frame. D-7…D-10 are about *node positions*, and would animate identically with no auto-fit at all.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Headless Chrome, `--virtual-time-budget` 500 / 1200 / 1500 / 1700 / 2500 / 5000 ms against the story iframe | 1200 ms and 1500 ms byte-identical (over-zoomed, empty); 1700 ms onward byte-identical (framed) | One early wrong frame held for ≳300 ms, then the correct one — matches D-2 → D-5 |
| T2 | Predict the zoom from the fitter's own arithmetic | Predicted 8.77×, measured ≈8.75× from grid spacing | The zoom is the arithmetic consequence of a one-card box, confirming D-3/D-4 |
| T3 | Same story before positions were removed | No over-zoom reported across the preceding sessions | Manual positions made the first fit measure the real box (R5) |
| T4 | CDP screencast of the load, consecutive identical frames collapsed | 37 visible states; ~25 of them one frame apart across 741–1242 ms | A 500 ms *animation*, not N discrete fits — points at D-7, not at the fitter |
| T5 | Read the glide's start-point guard against the store's read path | `p?.x ?? target[…]` can never take the fallback: `readPosition` returns a zero-filled `{x, y}` | Confirms D-9 — the guard is unreachable, not mis-tuned |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/autofit-bounds-rfc.md` | `relates-to` — same surface, prior pass | fixed 2026-08-13 | Its fix (store-derived bounds) **holds**; it removed staleness as a cause. Its §7 note that "every 'wait for it' mechanism is guessing" is the argument for F1: don't guess when positions arrive, know when the layout says it placed them |
| `rfc:fix-2026-09-13-autofit-crops-composite-graphs` | `relates-to` | landed | Composite render-origin reconciliation in `sym:GraphLayer.getBounds` — orthogonal, unaffected |
| `doc:apps/storybook/CLAUDE.md` | documents the intended contract | current | "Frame the graph with `canvas.fitView(padding)` … rely on `fitOnLoad` and a **falsy** `activeLayout`" — the contract already says one fitter; the code does not enforce it |
| `doc:packages/canvas-ui/CLAUDE.md` · `sym:GraphCanvasApp` | downstream default | current | `fitOnLoad: true` ships on by default (`file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L190`), so every app-shell canvas with a layout is exposed |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | **landed** | `file:packages/canvas/src/engine/Canvas.ts` (`sym:Canvas._armAutoFit`) | Defer the arming fit by one frame; at fire time, **skip it** when `definition.activeLayout` is set and that layout has not yet reported a run | No 9× flash: the first camera write is the first one with real positions | Medium — changes when the camera first moves for every canvas that has a layout | D-2 |
| F2 | defect | **landed** | same | Bounded fallback (`LAYOUT_GRACE_MS = 1200`): if the armed layout reports no run in that window, fit anyway | A declared-but-never-running layout still gets framed instead of sitting unframed at 100 % | Low | F1 |
| F3 | defect | **landed** | same | Coalesce every fit request onto one rAF (`requestFit`), keeping the 100 ms throttles on the *signal* side | At most one camera write per frame — no staircase of differing transforms | Low | — |
| F4 | defect | **landed** | `file:packages/canvas-react/src/layouts/ElkLayout.tsx` · `D3ForceLayout.tsx` · `D3SankeyLayout.tsx` | **Revised from the original proposal:** rather than changing the `fitPadding` default, the wrapper skips its own fit at runtime when `sym:Canvas.autoFitArmed` (new public getter) is true | One owner for the transform, with **no story edits** — `fitOnLoad`-off canvases keep the wrapper as their fitter | Low (was Medium) | D1 |
| F5 | dressing | rejected | `story:usecases/by-casestudies/tasks-panel/*` | Set `fitOnLoad: false` per story so only the wrapper fits | Hides S1 in six stories; leaves the cause in place for every other canvas | Low | — |
| F6 | defect | **landed** | `file:packages/graph/src/store/GraphStore.ts` | `FLAG_PLACED` (bit 3 of the existing `flags` u8) set by all four write paths — `installNode` (only when the record carries a position), `setPosition`, `setPositionsBulk`, `updateNode` — and read by the new `sym:GraphStore.hasPosition`. `compact()` already carries the whole flags byte | The store distinguishes "at the origin" from "never placed" | Medium — hot-path store surface; a missed write path would leave a node permanently "unplaced" | D-9 |
| F7 | defect | **landed** | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L253-L259` | Start un-placed nodes **at** their target via `hasPosition`, and **skip the transition entirely when nothing moves** — otherwise the run animates identical endpoints for 500 ms and, worse, delays `end`, which is what F1's auto-fit now waits for | First run snaps into place and frames immediately; later runs still glide from where nodes were | Low, given F6 | F6 |

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphLayer.getBounds` reading the store | F1 assumes the box is honest, so "wait for the layout" is sufficient — no re-introduction of flush-watching | If bounds ever go back to projection-derived, F1 alone would under-fit again |
| U2 | `layout:run:end` with `reason: 'settled'` | F1/F2 gate on it; `doc:docs/autofit-bounds-rfc.md` §7 recorded superseded runs ending `'stopped'` | A layout that never emits `settled` falls to F2's fallback — hence F2 is not optional |
| U3 | `data:flush` window in `sym:Canvas._armAutoFit` | F3 folds it into the coalescer | Dropping it entirely would regress the case that window was added for |
| U4 | `sym:CanvasView.definition.activeLayout` readable at fire time | F1's gate | React roots apply config after mount — hence "defer one frame", not "read at arm time" (the 2026-08 bug) |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `sym:GraphCanvasApp` (`fitOnLoad: true` default) | package | Every app-shell canvas with a layout changes first-frame behaviour — for the better | Re-check the app stories' opening frame |
| X2 | 77 story files referencing `activeLayout` | stories | First camera write moves later by one layout run | Spot-check the layout families: `story:graph-layouts/d3-force/*`, `d3-hierarchy/*`, `elkjs`, `d3-sankey` |
| X3 | `story:designs/AgenticWorkflow` · `IterationLoop` · `SchemaER` | stories | Pass `fitPadding={72}` with `id` set — F4 makes that prop the *only* fitter or a no-op depending on D1 | Confirm framing unchanged |
| X4 | `story:usecases/by-casestudies/tasks-panel/*` (6) | stories | The reporting surface | Verify S1 gone; F5 becomes unnecessary |
| X5 | Published API surface | api | No type changes; `fitPadding`'s **default** changes in one path | `pnpm check-api-surface` unaffected — document in the wrapper TSDoc |
| X6 | `doc:apps/storybook/CLAUDE.md` fit guidance | docs | Its "one fitter" rule becomes enforced rather than advisory | Update the paragraph to state the new default |
| X7 | Imperative stories wiring `layout.events.on('end', () => camera.fitContent(...))` | stories | Untouched by F4 (React wrappers only) — they remain their own fitter | None, but they stay a second owner where `fitOnLoad` is also on |
| X8 | `sym:GraphStore` position writes — `setPosition`, `setPositionsBulk`, insert-with-position, `importData`, undo/redo, drag | package | **F6 only.** Every path that writes a position must set `FLAG_PLACED`, or a node stays "unplaced" forever and never glides again | Audit each write site; a test per path |
| X9 | Every `OneShotPositionLayout` subclass — elk · d3-hierarchy · d3-sankey · geometric | packages | **F7 only.** First run snaps instead of gliding; re-runs unchanged | Confirm each layout's first load reads as intended, not as a jump |
| X10 | `sym:GraphStore.exportData` / snapshot round-trip | package | **F6 only.** If the bit isn't restored on import, a restored graph re-snaps on its next layout | Decide whether `placed` is serialised (D5) |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | Headless capture at virtual-time 800 / 1200 / 1600 / 2500 ms | `story:usecases/by-casestudies/tasks-panel/RunFlow` | No frame shows the 9× empty view; cards render at ~1× throughout | F1 |
| V2 | **pass** | CDP screencast, consecutive identical frames collapsed | same | No staircase of fits; the remaining multi-frame run is the 500 ms position glide (S5), not camera writes | F3 |
| V8 | **pass** | CDP screencast after F6+F7 | same | 12 visible states (was 37); the 741–1242 ms run is gone; framed and in place from ~736 ms. Screenshot at t=1000 ms is byte-identical to the settled frame | F6, F7 |
| V9 | **control** · **pass** | Re-run a one-shot layout on an already-placed graph, sampling a node's `x` every 8 ms | headless scratch harness (`file:/scratch/checks.mjs`) against the built dist | **50 intermediate samples** between the first run's `x = 540` and the re-run's target `x = 1200` — the re-run glides where the first run snapped. F7's `moves` guard fires only when *every* endpoint is identical, so a placed graph keeps its transition | F7 |
| V11 | **pass** | `pnpm --filter @invana/graph test` incl. new `file:packages/graph/tests/store/GraphStorePlacement.test.ts` (9 cases: unplaced vs explicit origin, all four write paths, `compact()`, unknown id, remove-then-re-add) | repo | 120 passed | F6 |
| V3 | **pass** *(with a caveat)* | `activeLayout: 'ghost'` — an id with no registered layout — plus `fitOnLoad: true` | headless scratch harness (`file:/scratch/checks.mjs`) | No fit at 700 ms (`zoom 1.000`), a fit after the 1200 ms floor. **Caveat worth recording:** what the fallback frames is the *degenerate* box — six coincident unplaced nodes measure one node wide, so the fit lands at **zoom 37×**. F2 does what it promised (the canvas is not left unframed forever) and D3 is the reason it still looks wrong; a layout that never runs has no good frame to offer | F2 |
| V4 | **control** · **pass** | Animated force sim under `fitOnLoad: true` | `story:canvas-ui/apps/GraphCanvasApp/Default` (`story:graph-layouts/d3-force/LesMiserables` sets no `fitOnLoad`, so it tests nothing here) | Settles framed, graph centred and whole | F1, F3 |
| V5 | **control** · **pass** | No `activeLayout` at all, six nodes with explicit positions, `fitOnLoad: true` | headless scratch harness (`file:/scratch/checks.mjs`) | Fits on load exactly as before F1 — `zoom 1.000 → 1.255`, `x 720.0 → 92.5`. The gate in F1 is `activeLayout && !layoutHasPlaced`, so a canvas with no layout never enters the deferral path | F1 |
| V10 | **pass** *(confirms the wrinkle)* | `fitOnLoad` armed **after** the layout had already settled, as a toolbar toggle would | headless scratch harness (`file:/scratch/checks.mjs`) | Framed **1237 ms** after arming — i.e. via F2's floor, not immediately. The wrinkle D2 predicted is real and measured: arming late costs a 1.2 s wait, because `layoutHasPlaced` is local to each arming and a run that ended *before* the arm is not remembered | F1, F2 |
| V6 | **pass** | Settled frame after F4's runtime deferral | `story:designs/AgenticWorkflow` (explicit `fitPadding={72}` + `fitOnLoad: true`) · `story:graph-layouts/d3-hierarchy/Tree` | Both frame correctly; the ignored `fitPadding` is visually equivalent to the engine's 80 | F4 |
| V7 | **pass** | `pnpm build` · `check-types` · `lint` · `check-boundaries` · `check-api-surface` · node-import | repo | 20/20 · 19/19 · 19/19 · all intact — `sym:Canvas.autoFitArmed` is a class member, so no barrel export changed | F1–F4 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | When both `config.fitOnLoad` and a config-first layout wrapper are present, who owns framing? | (a) the engine — wrapper defaults to `null` when `id` is set; (b) the wrapper — engine skips fitting while a layout is active; (c) leave both, document the overlap | **(a)** — `activeLayout` already means the engine drives the layout, and the engine is the only party that knows about *other* layers. It also keeps one padding value | **accepted (a), by a narrower mechanism than proposed** — the wrapper's `fitPadding` default was left alone and the wrapper instead defers *at runtime* on `sym:Canvas.autoFitArmed` (F4). Same owner, no story edits |
| D2 | How long may F1 wait for a layout that never runs? | (a) 1200 ms fixed; (b) one animation frame after `data:flush` idles; (c) never — require the layout to report | **(a)** — a fixed, stated ceiling is debuggable; (b) reintroduces the guessing `doc:docs/autofit-bounds-rfc.md` §7 warned against | **accepted (a)** — `LAYOUT_GRACE_MS = 1200`, shipped. V10 measured the cost the option always had: a *late* arm waits the full 1237 ms, because each arming keeps its own `layoutHasPlaced` and does not remember a run that ended before it |
| D3 | Should `sym:Canvas.fitView` additionally refuse a degenerate box (N nodes, one-node bounds)? | (a) no — sequencing is the fix; (b) yes, as a belt-and-braces guard | **(a)** — the box is honest, and a genuine single-node graph must still frame. A guard here would silently not-fit real scenes | **accepted (a)** — no guard shipped. V3 shows the price: when F2's floor fires for a layout that never runs, the honest box is one node wide and the fit lands at **37×**. Still the right call — the alternative silently refuses to frame real single-node scenes — but the fallback path is now a *known* bad frame rather than an assumed-safe one |
| D4 | Does F5 land at all? | (a) drop it once F1 lands; (b) land it now as an interim | **(a)** — it is dressing by construction, and F1 is small | **rejected** — F1 landed; F5 unnecessary |
| D5 | How does the store say "never placed"? | (a) `FLAG_PLACED` bit in the existing `flags` u8; (b) `NaN` sentinel in the x/y columns; (c) no store change — have the layout treat its *first* run on a layer as "place, don't glide" | **(a)** — bit 3 is free, it costs no memory, and it is the same mechanism `pinned` / `hidden` already use. (b) poisons arithmetic on the hot columns; (c) is a heuristic that breaks on a layer that is re-seeded with new data | **accepted** — implemented as (a) |
| D6 | Is `placed` serialised in `exportData`? | (a) yes — a restored graph keeps its positions and won't re-snap; (b) no — treat import as unplaced | **(a)** — an imported graph *has* positions; pretending otherwise would make every load snap | **accepted**, and it needs no schema change: import goes through `installNode`, which sets the flag exactly when the record carries a `position`. Known edge: a graph exported *before* any layout ran carries `position: {0,0}` per node (`getNode` always emits one), so those import as *placed* and will glide once | accepted |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-17 | Reported from `story:usecases/by-casestudies/tasks-panel/RunFlow` after node positions were replaced by an ELK solve | proposed | Maintainer asked for a core fix rather than a per-story one |
| 2026-09-17 | Diagnosed by headless capture (T1) + fitter arithmetic (T2); prior art reviewed | proposed | Staleness (R1) ruled out — `doc:docs/autofit-bounds-rfc.md` already fixed that; this is a sequencing defect on the same surface |
| 2026-09-17 | F1 · F2 · F3 · F4 implemented, packages only | implemented | Gates green: build 20/20 · check-types 19/19 · lint 19/19 · boundaries · api surfaces unchanged · node-import. V1 and V2 pass |
| 2026-09-17 | **F4 revised during implementation.** The proposed `fitPadding` default change would have stranded `story:canvas-react/GraphCanvas/Basic` · `Advanced` · `WithTelemetry`, which pass `id` with no `fitPadding` and no `fitOnLoad` — they'd have lost framing and needed story edits, which this pass excluded. Replaced by a runtime check on the new `sym:Canvas.autoFitArmed`: strictly narrower, and it keeps the prop meaningful where the engine isn't fitting | implemented | What the document got wrong: it read the default as the mechanism, when the real question was *who is fitting right now* |
| 2026-09-17 | F5 rejected — F1 removes the need | rejected | Kept as the record that the per-story workaround was considered |
| 2026-09-17 | **Second defect found while verifying** (S5 · D-7…D-10 · T4 · T5): nodes glide from `(0,0)` because the store has no "never placed" state, so `OneShotPositionLayout`'s own guard is unreachable. Rows F6 · F7 added | proposed | Not implemented in that pass — the store's hot path is a wider surface than it was approved for |
| 2026-09-17 | F6 · F7 approved and implemented; D5 → (a), D6 → (a) | implemented | Gates green: build 20/20 · check-types 19/19 · lint 19/19 · boundaries · api surfaces unchanged · `@invana/graph` tests 120 passed. V8 and V11 pass |
| 2026-09-17 | **What implementation added to the document:** F7 needed a second clause nobody had written down — when *no* node moves, the transition must be skipped, not merely started from the right place. Animating identical endpoints is invisible but delays `end` by the full 500 ms, and F1 had just made the camera wait for `end`. The two fixes interlock: without the skip, F1 turns a harmless no-op animation into half a second of unframed graph | implemented | — |
| 2026-09-18 | **Reconciled against the shipped tree, and closed.** All six defect rows were verified present in `d43b6f88` and moved `implemented` → `landed`; the four checks left pending at the end of the implementation pass (V3 · V5 · V9 · V10) were driven headlessly against the built dist and all four pass. D1 · D2 · D3 closed with what actually shipped | landed | The document had been sitting at `status: proposed` with six `implemented` rows since the code landed. Nothing was wrong with the code; the RFC had simply stopped being updated at the moment it stopped being written |
| 2026-09-18 | **What the pending checks taught, now that they have been run.** Two of the four "pass" with a caveat that belongs in the record, not in a footnote. **V3:** F2's floor does fire — but what it frames is the degenerate box (six coincident unplaced nodes → `zoom 37×`), which is the *same* shape of wrong frame this RFC opened against, merely deferred by 1.2 s. **V10:** arming `fitOnLoad` late costs the full 1237 ms, because `layoutHasPlaced` is local to each arming and a run that ended before the arm is not remembered | landed | Both are consequences of decisions the RFC took deliberately (D2, D3) and neither is a regression — but "pending" was hiding the fact that the fallback path has a known-bad outcome. A check that is never run cannot tell you the cost of the option you chose |
