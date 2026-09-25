---
id: fix-2026-09-26-layout-rerun-glides-under-a-stale-camera
type: fix
title: A one-shot layout re-run glides the nodes under a stale camera, then snaps the frame
status: accepted
opened: 2026-09-26
decided: 2026-09-26
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/graph, pkg:@invana/canvas, pkg:@invana/canvas-react, pkg:@invana/graph-layout-d3-force]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/layout/OneShotPositionLayout.ts#L267-L330" }
  - { predicate: caused-by, object: "file:apps/storybook/stories/usecases/by-casestudies/global-model/GlobalModel.stories.tsx#L170" }
  - { predicate: caused-by, object: "file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L758-L760" }
  - { predicate: caused-by, object: "file:packages/graph-layout-d3-force/src/forceSolver.ts#L378-L380" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
  - { predicate: relates-to, object: "rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load" }
---

## Summary

| | |
|---|---|
| **What breaks** | Switching **Detail** (High / Medium / Low) in `story:usecases/by-casestudies/global-model/GlobalModel` makes the diagram slide to the left (and up) for about half a second. Then the view jumps back to centre |
| **Root cause** | Two motions happen one after the other when they should overlap. The ELK re-run **glides the nodes** over 500 ms (`sym:OneShotPositionLayout` `transition: true`) while the camera stays still. Only after the glide finishes does the story call an **instant** `sym:Canvas.fitView`. ELK places its result from a top-left origin, so a diagram that changes size grows or shrinks toward that corner, and on screen it drifts toward the top-left |
| **Not the cause** | The ELK result itself (it is correct), the template swap (it changes node sizes in place and moves nothing), `fitOnLoad` (it is `false` in the story's `settings.json`), and `CollapseExpandBehaviour` (see `rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera`) |
| **Defect rows** | `F1` (a layout reports how far its position transition has got) · `F2` (the one-shot base emits that progress) · `F3` (`runLayout(id, { fitCamera })` moves the camera together with the glide) · `F5` (the story uses F3) |
| **Other rows** | `F4` (the React layout wrappers' end-fit skips a run that already frames itself — removes a second fit owner) · `F6` (the `fitOnLoad` auto-fitter follows one-shot transitions the same way — same defect, engine-owned) |
| **Open decisions** | none — `D1` (a) blend, `D2` `fitCamera`, `D3` F6 deferred to a follow-up |
| **Row status** | proposed 0 · accepted 0 · implemented 6 · landed 0 · deferred 2 · rejected 0 · superseded 0 |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | On a Detail switch, the whole diagram moves toward the left of the viewport for about 0.5 s | `story:usecases/by-casestudies/global-model/GlobalModel`, header **Detail** switcher | Maintainer report, 2026-09-25 |
| S2 | When that motion stops, the view jumps to centre the diagram | same | same |
| S4 | After F1–F5, an **ELK → Force** switch still throws the whole graph aside: ~500 ms in, the content jumps 594 px left and 141 px up in about one frame, stays there ~5 s while the simulation relaxes, then `fitCamera`'s end fit brings it back (a 618 px camera step) | GlobalModel, **Layout** switcher | rAF probe, 2026-09-26: centre offset `(-7, -7)` → `(-593.6, -140.7)` between samples at 351 and 522 ms; camera unchanged until 5.5 s |
| S3 | *Adjacent:* on a switch to **Force**, the `D3ForceLayout` wrapper's end-fit uses its default `fitPadding` of 80 while the story fits at 60, so two fits with different paddings can both land | `file:apps/storybook/stories/usecases/by-casestudies/global-model/GlobalModel.stories.tsx#L231` | code reading. F4 + F5 remove it |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The engine auto-fitter (`fitOnLoad`) moves the camera | **No** | `settings.json` sets `"fitOnLoad": false`. `sym:Canvas.autoFitArmed` is false, so its listeners stand down |
| R2 | The template patch moves nodes | **No** | `canvas.update(DETAIL_TEMPLATES[…])` changes structures, stylings and layout spacing. It writes no positions. Only `runLayout` writes them |
| R3 | ELK computes a wrong or offset result | **No** | The final, centred frame is correct. Only the path to it is wrong |
| R4 | Group frames animate on their own | **No** | Frames are derived from their members on every flush (`file:packages/graph/src/layer/GraphLayer.ts#L2860-L2890`). They follow the member glide and add no motion of their own |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | The switcher's effect calls `stopLayout` → `update(DETAIL_TEMPLATES[detail])` → `runLayout('elk').then(() => fitView(60))` | `file:apps/storybook/stories/usecases/by-casestudies/global-model/GlobalModel.stories.tsx#L159-L171` | The camera is written only after `runLayout` resolves |
| 2 | ELK solves with the new node sizes and spacing (e.g. High uses a 60×84 node size with `nodeSpacing: 80`, Medium uses 264×116 with `nodeSpacing: 40`). Its coordinates start at a top-left origin | `file:apps/storybook/stories/usecases/by-casestudies/global-model/detail-templates.json` · `file:packages/graph-layout-elkjs/src/ElkLayout.ts#L148` | The new layout's extent differs from the old one, anchored at the same corner |
| 3 | `sym:OneShotPositionLayout.writePositions` finds that nodes move, so it tweens each node from its old position to its new one over `DEFAULT_POSITION_TRANSITION_MS` (500 ms, `easeOutCubic`) with `sym:animatePositions`, and resolves `apply` only in `onComplete` | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L267-L330` · `file:packages/canvas-core/src/lib/animation/animatePositions.ts#L39` | The camera stays still for the full 500 ms while the content shrinks or grows toward the top-left: **S1** |
| 4 | `runLayout` resolves → `fitView(60)` → `camera.fitContent`, which writes the transform in one step | `file:packages/canvas/src/engine/Canvas.ts#L523-L526` | The view jumps to the new frame in a single frame: **S2** |
| 5 | The `<ElkLayout fitPadding={60}>` wrapper also fits one frame after `end` | `file:packages/canvas-react/src/layouts/ElkLayout.tsx#L80-L101` | A second fit owner. Harmless here only because both use padding 60 (S3 shows the case where they differ) |

The drift direction follows from the top-left origin: when the extent changes, the far (right and bottom) edges move the most, the near edges barely move, and the centre of the content moves toward the top-left. This is why the diagram reads as "moving left" rather than zooming in place.

### Diagnosis of S4 — the force layout re-centres the graph on the world origin

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 4.1 | `D3ForceLayout` already **starts from the current positions**: placed nodes are seeded and the run restarts at `reheatAlpha` 0.5 | `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L309-L331` · `#L377` | Starting positions are not the problem |
| 4.2 | With no `center` / `x` / `y` / `radial` configured (GlobalModel sets none), both the live and the worker path add `forceCenter(0, 0)` | `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L758-L760` · `file:packages/graph-layout-d3-force/src/forceSolver.ts#L378-L380` | The simulation pins the centre of the graph to world `(0, 0)` |
| 4.3 | ELK places its diagram with the top-left corner at the origin, so the ELK centre is about `(+1700, +430)` world | V2 measurement | Two layouts, two different world origins |
| 4.4 | d3's `forceCenter` translates every node by the full centroid offset on the first tick (strength 1) | S4: 594 / 0.362 ≈ 1640, 141 / 0.362 ≈ 390 world units in one step | The jump in S4 |
| 4.5 | A force run reports no `transition`, so `fitCamera` fits only at `end` (~5.5 s) | F3 | The graph sits off to the side until then |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Read the code path in steps 1–4 | The camera is written only in `.then()` of a 500 ms tween | Motion happens in two phases: nodes, then camera |
| T2 | rAF probe of `viewport.{x,y,scale}` and the content-bounds centre (screen space) across High → Low → Medium on the pre-fix story, as done in `rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera` | **2 distinct camera transforms per switch** (one step, up to 75 px pan + the zoom change); content centre up to **903 px** off the viewport centre before the step | Confirms S1/S2: the camera holds through the glide, then fits in one write |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera` | relates-to | accepted (implemented) | Its F5: a user gesture cancels camera animation (`binding.onTransformChange` → `cancelAnimation`). F3 here must respect the same rule: a user pan or zoom during the glide takes the camera |
| `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load` | relates-to | landed | `sym:Camera.animateTo` and the private `Canvas._fitViewAnimated`. That approach needs the **target** bounds up front. We don't know them before the glide, because group frames are derived from member positions (R4), so this RFC follows the live bounds instead (D1) |
| `doc:docs/autofit-bounds-rfc.md` / `rfc:fix-2026-09-13-autofit-crops-composite-graphs` | relates-to | landed | `sym:GraphLayer.getBounds` reads from the store (always up to date, no projection lag). This is what makes a per-frame fit during the glide accurate |
| `sym:LayoutRunOptions.preserveCamera` | relates-to | shipped | A per-run camera flag already exists and flows to `layout:run:*` events and the wrappers. `fitCamera` is its counterpart |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-core/src/abstracts/Layout.ts#L58-L73` · `sym:LayoutEvents` | Add an event `transition: { progress: number }`. `progress` is the **eased** fraction from 0 to 1 of a position transition, emitted once per frame. It is a new event rather than per-frame `tick`s because the auto-fitter treats `tick` as "the layout has placed" (throttled fits every 100 ms), which would make it step in stairs | A layout can report how far its glide has got without the contract knowing about cameras | Low–medium: public type in the dependency-free core. Additive. The API surface snapshot lists names, so it changes only if a new type is exported | — |
| F2 | defect | implemented | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L313-L328` | Emit `transition` from each `animatePositions` frame. `onFrame` gets the eased `t`, which needs a one-line change to `sym:animatePositions` to pass the eased `t` as a second `onFrame` argument (additive). Emit `progress: 1` in `onComplete`. Snapped runs emit nothing | ELK, d3-hierarchy, geometric and Sankey-style runs all report glide progress | Low: additive callback argument, no existing caller reads it | F1 |
| F3 | defect | implemented | `file:packages/canvas/src/engine/Canvas.ts#L1011-L1057` · `sym:Canvas.runLayout` · `sym:LayoutRunOptions` | New run option `fitCamera?: boolean \| { padding?: number }` (name: D2). When set, `runLayout` records the starting camera transform. On each `transition` frame it computes the fit transform for the *current* content bounds (`_contentBounds`, read from the store) and writes `blend(start, fit, progress)` (see D1). Zoom is interpolated in log space. On `end` it runs one exact `fitView(padding)`. A run with no transition (snap, or a force sim) gets only that end fit. If the camera's current transform no longer matches the last one F3 wrote (the user panned or zoomed), it stops following for the rest of the run. The `layout:run:*` events carry `fitCamera` so the fitters can tell | The camera moves together with the nodes. The diagram stays centred during the 500 ms and ends exactly framed, with no drift and no jump | **Medium**: new public option on a core type, and a per-frame `getBounds` (O(nodes)) while a run is gliding, only when a caller opts in. Fine for GlobalModel's ~100 nodes. A 10k-node graph pays 30 bound passes per switch | F1, F2 |
| F4 | defect | implemented | `file:packages/canvas-react/src/layouts/ElkLayout.tsx#L80-L101` · `D3ForceLayout.tsx#L80-L98` · `D3SankeyLayout.tsx#L77-L96` | The wrappers' `end` fit returns early when `layout.runOptions.fitCamera` is set, the same way it already does for `preserveCamera` | One camera owner per run. Removes the second fit (step 5) and the padding mismatch (S3) | Low: only affects runs that opt in | F3 |
| F5 | defect | implemented | `file:apps/storybook/stories/usecases/by-casestudies/global-model/GlobalModel.stories.tsx#L170` | `void canvas.runLayout(layout, { fitCamera: { padding: 60 } })`, and drop `.then(() => canvas.fitView(60))` | Fixes S1/S2 in the story | Low | F3, F4 |
| F7 | defect | implemented | `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts` (`runLive` → `configureForces`, `snapshotStatic` → `params.center`) | When no `center` / `x` / `y` / `radial` is configured **and** some nodes already have positions, the default `forceCenter` goes at the **centroid of those positions** instead of `(0, 0)`. Both paths (live simulation and worker solve) compute it the same way. A first load with nothing placed keeps `(0, 0)`, and an explicit `center` still wins | A layout switch or re-run relaxes the graph **in place**: no jump to the origin. ELK → Force keeps the picture where ELK left it | **Medium**: every force story that re-runs on an already-placed graph stays where it is instead of re-centring on the origin. That is the intended change, but it changes how those stories look. The first load is unchanged | — |
| F8 | defect | deferred | `sym:Canvas.runLayout` `fitCamera` | Follow a running simulation (`tick`-driven, eased toward the current fit) rather than one end fit | Removes the remaining end step on a force run that grows or shrinks noticeably | Medium: 60 Hz fit during a long simulation | F7 — not chosen now (maintainer picked F7 only) |
| F6 | defect | deferred | `file:packages/canvas/src/engine/Canvas.ts#L586-L760` · private `_armAutoFit` | With `fitOnLoad` on, a re-run of the active layout follows its transition the same way (shared helper with F3) instead of gliding under the old camera and then fitting on `end` plus the flush watch | Every canvas with `fitOnLoad` and a one-shot layout gets the same smooth re-run (layout switch, `refresh`, a topology change that re-runs the layout) | **Medium–high**: changes how existing `fitOnLoad` stories *look* on re-runs. Interacts with the flush watch, the grace timer and `fitAnimation` for the first fit. Deferred by D3 to its own RFC — unblocked by F3's `_followRun` helper, which it would reuse | F3 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphLayer.getBounds` reads from the store (`file:packages/graph/src/layer/GraphLayer.ts#L1206-L1268`) | F3 fits mid-glide on bounds read in the same frame | If it went back to renderer projection, the fit would be one flush behind and the camera would lag the nodes by a frame |
| U2 | `sym:animatePositions` drives the tween with rAF | F2's progress rate matches the frame rate | none |
| U3 | Camera gesture handling from `rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera` F5 | F3's "user took the camera" check relies on gestures changing the transform | none |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `story:usecases/by-casestudies/global-model/GlobalModel` | story (on branch `fix/global-model-text-alignment`, not on `main`) | The Detail and Layout switches glide the camera with the nodes | F5 |
| C2 | Every other `runLayout(...)` caller: the `LayoutSwitcher` / `GraphControlsToolbar` layout buttons in `pkg:@invana/canvas-ui`, `sym:Canvas.refresh`, `sym:GraphCanvas` topology re-runs, `CollapseExpandBehaviour` re-flows (`preserveCamera`) | engine and UI callers | None unless they pass `fitCamera`. F6 changes the ones on `fitOnLoad` canvases | none for F1–F5; visual check V6 if F6 lands |
| C3 | `pkg:@invana/canvas-react` `ElkLayout` / `D3ForceLayout` / `D3SankeyLayout` wrappers | React bindings | F4 adds one early return | none |
| C4 | Custom layouts outside the repo that extend `sym:Layout` | published API | `LayoutEvents` gains an event. A layout that never emits it simply gets the end-only fit | none |
| C5 | `api/canvas-core.surface.txt` · `api/canvas.surface.txt` | API snapshot | No new export name expected (the fields go on existing types) | re-run `check-api-surface` |
| C6 | Serialised `CanvasConfig` | persisted state | None — `fitCamera` is a per-call run option, not config | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | rAF probe of the camera transform and the content-bounds centre in screen space across Medium → High → Low → Medium | GlobalModel | The bounds centre stays within ~a few px of the viewport centre on every frame. The camera changes over ~30 frames, with no single-frame step at the end | F1–F3, F5 |
| V2 | pass | Same probe across ELK ↔ Force | GlobalModel | ELK: as V1. Force: one end fit, no second hop at a different padding | F3, F4, F5 |
| V3 | pass | Drag the canvas during the glide | GlobalModel | The follow stops. The user's pan wins, and there is no end snap back | F3 |
| V4 | pass | **Control**: `runLayout(id)` with no `fitCamera` | `story:graph-layouts/elkjs/*`, the toolbar layout switcher | Same as today: glide, then the existing fitter | F1–F4 |
| V5 | pass | **Control**: `preserveCamera` re-flow after a group toggle | GlobalModel, double-click a frame | The camera doesn't move (`rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera` F6 still holds) | F3, F4 |
| V6 | skipped | A `fitOnLoad` canvas re-runs its one-shot layout | `story:canvas-ui/apps/GraphCanvasApp/*` with a layout switch | Follows like V1, and the first-load fit / `fitAnimation` / entrance are unchanged. *Skipped: F6 deferred (D3)* | F6 |
| V8 | pass | ELK → Force → ELK probe | GlobalModel | No first-tick jump: centre offset stays near where ELK left it through the simulation; the end fit is a small step, not ~600 px | F7 |
| V9 | pass | **Control**: first load of a force story | `story:graph-layouts/d3-force/Lattice` | Same as today — world origin at the screen centre. *Lattice configures `center` explicitly, so this covers the explicit-centre path; the nothing-placed default keeps `(0, 0)` by construction (`placedCentroid` / `seededCentroid` return `null`)* | F7 |
| V7 | pass | `pnpm check-types` · `pnpm lint` (boundaries + API surface) · `pnpm build` · canvas-core + graph tests | repo | green | F1–F6 |

### Results, 2026-09-26

| Check | Measured |
|---|---|
| V1 · GlobalModel High → Low → Medium (1400×900) | **23–30 distinct camera transforms per switch** (was 2), largest single frame step 4–13 px. Content centre off the viewport centre at most **42 px** (Low → Medium), **123 px** (Medium → High), **178 px** (High → Low, the largest size change); was 115 / 344 / 903 px. It ends 6–21 px off, the same final frame as before the fix |
| V1 · Medium → Low, per frame | Camera holds while ELK solves (~500 ms; node sizes already changed), then eases from `(45.5, 287.7, 0.362)` to `(47.3, 231.6, 0.3175)` over ~450 ms. Centre stays within 22 px throughout |
| V2 · ELK → Force | The camera holds while the simulation runs (~10 s here), then **one** fit at the end (618 px step). No second hop — the wrapper's padding-80 fit stood down (F4). The simulation reports no `transition`, so this is F3's end-only fit, as scoped. It is still a jump; following a live simulation is out of scope (see History) |
| V2 · Force → ELK | 30 eased transforms, ends centred (10 px) |
| V3 · Drag during High glide | The glide runs for ~400 ms (zoom 0.362 → 0.742 of a 0.758 target), then the drag's first move takes the camera: x advances exactly +30 px per step (+150 px), y and zoom freeze, and there is no end fit / snap back |
| V4 · Control, `runLayout(id)` without `fitCamera` | Measured as T2 (the pre-fix story line temporarily restored): identical to before — 2 transforms, up to 903 px off-centre |
| V5 · Control, collapse + expand a frame | 1 distinct camera transform across both toggles — the camera does not move |
| V7 | `check-types` (19 tasks), `pnpm lint` (eslint, boundaries, API surface unchanged, node-import), build, canvas-core 143 + graph 199 tests — all green |
| V8 · ELK → Force after F7 (visible-only bounds) | No jump. The content drifts 18 → 68 px over 4 frames (~50 ms) as the simulation relaxes, and never more than **71 px** off-centre (was ~650 px). At 5.5 s the end fit re-frames once (zoom 0.362 → 0.471, the graph settled more compact): that remaining step is F8's territory. Force → ELK: 30 eased frames, ends centred |
| Probe note | The earlier "135 px off after the fit" read counted invisible display objects left near the origin. With visible-only bounds the final view is exactly centred (0, 0) |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | How does the camera move during the glide? | (a) **blend**: `camera = lerp(start, fit(bounds now), progress)`. It starts exactly where the user left it (no jump when the new templates first change the sizes), tracks the moving content, and ends exactly framed · (b) **track**: `camera = fit(bounds now)` every frame. Always perfectly framed, but it jumps on the first frame because node sizes already changed before the run · (c) **predict**: work out the target bounds up front and `animateTo` in parallel. Two independent curves, and it needs a position override in `nodeSpec` so derived group frames can be measured | **(a)** — no jump at either end, no geometry prediction, and reuses store-derived bounds | accepted |
| D2 | Option name and shape | `fitCamera: boolean \| { padding? }` · `camera: 'fit' \| 'preserve'` (replacing `preserveCamera`) · `followCamera` | **`fitCamera`**, next to `preserveCamera` and additive. Merging the two into one union would be cleaner but changes a shipped option. Revisit that separately if wanted | accepted |
| D3 | Include F6 (the `fitOnLoad` auto-fitter follows too)? | now · separate RFC · never | **Separate follow-up**. F1–F5 fix the reported story with an opt-in. F6 changes every `fitOnLoad` canvas and should be measured on its own | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-25 | Diagnosed in chat | — | Maintainer asked why the canvas moves left and then centres on a Detail switch. Three options were given: (A) move the camera with the glide, (B) snap Detail runs, (C) animate only the end fit (would only hide the symptom) |
| 2026-09-26 | Maintainer chose A. Opened | proposed | Written to scope A. F6 is split out as D3 |
| 2026-09-26 | F1–F5 approved with D1 (a), D2 `fitCamera`, D3 F6 deferred | accepted | Maintainer: "ok go ahead" |
| 2026-09-26 | F1–F5 implemented | implemented | `LayoutEvents.transition` + `LayoutRunOptions.fitCamera` + `fitCamera` flag on `layout:run:*` (core). `animatePositions` passes the eased progress to `onFrame`. `OneShotPositionLayout` emits `transition`. `Canvas.runLayout` follows via the private `_followRun` (log-space zoom, linear centre, gesture stand-down) and `_fitTransform`, now shared with `_fitViewAnimated`. The auto-fitter and the three React wrappers stand down for `fitCamera` runs. Story uses `fitCamera: { padding: 60 }`. V1–V5, V7 pass. Lesson: the follow is exact only at the ends. Mid-glide the blend leaves the content up to 178 px off-centre on the largest switch (it was 903). That is the price of D1 (a) not jumping at the start. Observed, not fixed: a Force switch still jumps once, after a ~10 s simulation. Following a live simulation needs its own design |
| 2026-09-26 | S4 found after F1–F5; F7 + F8 added | accepted | The maintainer saw the Force switch still move aside and come back, and asked whether the layout could start from the existing positions. It already does (4.1). The jump is the default `forceCenter(0, 0)` (4.2–4.4). Maintainer chose F7; F8 deferred |
| 2026-09-26 | F7 implemented | implemented | Default `forceCenter` at the centroid of the placed nodes (live: `placedCentroid(this.nodes)` into `configureForces`; static: `seededCentroid` → explicit `params.center`). d3-force types + build, repo `check-types` + `lint` green. V8, V9 pass |
