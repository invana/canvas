---
id: fix-2026-09-24-collapse-toggle-snaps-the-camera
type: fix
title: Toggling a group frame teleports the camera instead of gliding it
status: accepted
opened: 2026-09-24
decided: 2026-09-24
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/graph, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L288-L298" }
  - { predicate: caused-by, object: "file:packages/canvas-core/src/abstracts/Camera.ts#L380-L390" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
  - { predicate: manifests-in, object: "story:graph/Behaviours/CollapseExpand" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load" }
---

## Summary

| | |
|---|---|
| **What breaks** | Double-clicking a group frame (or its `+`/`−`) collapses/expands it, and in the **same frame** the whole scene jumps so the frame lands at screen centre — 533 px sideways on `story:usecases/by-casestudies/global-model/GlobalModel`. It reads as the graph "dancing", not transitioning |
| **Root cause** | `sym:CollapseExpandBehaviour.centerAfterReproject` re-centres with `sym:Camera.centerOn`, which is an **instant** `setTransform` with no animation path. The frame's geometry also swaps in one step. Nothing in the chain eases |
| **Not the cause** | The story (it only enables the behaviour with defaults) and the layouts (a collapse re-runs neither ELK nor d3-force) — see §1 Ruled out |
| **Defect rows** | `F6` (`centerOnToggle` defaults to `false` — a toggle no longer moves the camera) · `F1` (animated `centerOn`) · `F2` (the opt-in re-centre glides) · `F3` (its editor field) — **implemented** · `F5` (a user gesture cancels a glide) — **implemented** |
| **Deferred** | `F4` (morph the frame's geometry) — a feature, own RFC |
| **Open decisions** | none — `D1` revised by the maintainer to **don't move the camera** (F6); `D2` (300 ms) applies to the opt-in |
| **Row status** | proposed 0 · accepted 0 · implemented 5 · landed 0 · deferred 1 · rejected 0 · superseded 0 |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Collapsing the AirRoutes frame moves the camera **once**, 533.6 px on x, between two consecutive frames; no motion before or after | `story:usecases/by-casestudies/global-model/GlobalModel`, double-click at (1250, 530) in a 1400×900 viewport | Playwright + `__PIXI_APP_INIT__` hook sampling the viewport every rAF for 1.5 s: 92 frames, **2 distinct transforms** — `(45.5, 287.7)` → `(-488.1, 271.4)` at t = 28 ms |
| S2 | Expanding it again moves the camera once more, 21.8 px, also in a single frame | same, double-click on the collapsed tab | samples `(-488.1, 271.4)` → `(-466.3, 276.5)`, nothing between |
| S3 | The frame's own geometry swaps in the same frame as the camera jump: a 255×175 px frame becomes a ~40 px tab (and back), members vanish/appear, incident edges re-route | same | screenshots `load` → `collapse` → `expanded` in the probe run |
| S4 | *Incidental, out of scope:* on the collapsed tab, the re-routed incident edges paint over it and a double-click at its centre hit the `AirRoutes.route:airport->airport` edge (edge preview opened) instead of the frame | same, double-click at (700, 458) | hover status bar: `Hovered Edge - route [ID: AirRoutes.route:airport->airport]`. Wants its own fix RFC |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The story wires something that re-fits / re-lays out on toggle | **No** | `file:apps/storybook/stories/usecases/by-casestudies/global-model/GlobalModel.stories.tsx#L159-L170` re-runs the layout only on the Detail/Layout switchers; `settings.json` has `fitOnLoad: false` and `collapse-expand: { enabled: true }` — defaults |
| R2 | A collapse re-runs the active layout (ELK/d3-force) and the nodes move | **No** | `file:packages/graph/src/canvas/GraphCanvas.ts#L81` re-runs only on `addedNodes`/`removedNodes`; the collapsed flag goes through `node:state` → `dirtyGroups` (`file:packages/graph/src/layer/GraphLayer.ts#L536-L547`), never a layout. Member positions after expand match pre-collapse offsets within 2 px |
| R3 | Drag-pan momentum (`decelerate`, on by default) from the double-click's two presses keeps drifting after `centerOn` | **No** | A jittered human-style double-click (3–6 px drift between presses) produced the same 2 distinct transforms — no drift frames. (`setTransform` does not stop the pixi-viewport `decelerate` plugin, so this *could* bite on a bigger drag, but it is not what is seen) |
| R4 | The camera is re-centred twice (one-shot `data:changed` firing more than once) | **No** | `off()` runs first in the handler (`file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L293-L294`); samples show exactly one move per toggle |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Toggle writes `collapsed` presence state; `centerAfterReproject` arms a one-shot `data:changed` listener first | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L257-L267` | Centring waits for the new geometry — correct |
| 2 | On the next flush `GraphLayer` drains dirty groups: silhouette closes/opens, members cull/uncull, edges re-route — all in one frame | `file:packages/graph/src/layer/GraphLayer.ts#L564-L580` | S3: the frame itself snaps |
| 3 | The listener reads the frame's world bounds and calls `camera.centerOn(cx, cy)` | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L295-L296` | — |
| 4 | `centerOn` computes the target and `binding.setTransform`s it immediately; it has no duration parameter, and it *cancels* any `animateTo` glide | `file:packages/canvas-core/src/abstracts/Camera.ts#L380-L390` | S1/S2: the full pan distance is applied between two frames |
| 5 | Steps 2 and 4 land in the same paint | S1 sample at t = 28 ms coincides with the geometry swap | The eye sees shape change **and** a whole-scene jump at once — the "dancing" |

The magnitude is what makes it read as a defect: the frame was already under the pointer (the user just double-clicked it), and a 533 px teleport moves it *away* from where the eye is. `centerOnToggle`'s own contract — "re-centring keeps the frame under the eye" (`file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L80-L87`) — does not hold for an instant jump.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Sample `viewport.{x,y,scale}` every rAF across a collapse | 1 step, 533.6 px, 0 intermediate frames | Camera motion is instant, not eased |
| T2 | Same across an expand | 1 step, 21.8 px | Same path both directions |
| T3 | Jittered double-click | Identical to T1 | Momentum is not a factor (R3) |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load` | relates-to | landed | Its C4 added `sym:Camera.animateTo` (eased `{x,y,zoom}` tween, cancelled by any other camera write, ticked by `Canvas.tickOnce`). This fix **reuses that mechanism** — no new animation machinery |
| commit `7209a647` "double-click a group frame to toggle it, and re-centre after" | caused-by | shipped | The one-shot `data:changed` timing is right and stays; only the final camera write changes |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-core/src/abstracts/Camera.ts#L380-L390` · `sym:Camera.centerOn` | Add an optional second arg `{ durationMs?, easing?, onDone? }`. `durationMs > 0` → route through `animateTo({ x: tx, y: ty, zoom: scale }, …)`; absent/`0` → today's instant write, unchanged | A pan-only "go to" can glide. Existing callers (`sym:GraphLayer.centerOnPoints`, the behaviour) are untouched until they opt in | Low–medium: public method signature in the dependency-free floor; additive and optional, so no caller breaks. API-surface snapshot lists names, not signatures | — |
| F2 | defect | implemented | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts` · `sym:CollapseExpandBehaviourOptions` | New flat option `centerDurationMs?: number` (default per `D2`, `0` = instant, today's behaviour). `centerAfterReproject` passes it to `centerOn` with `easeOutCubic` | The re-centre becomes a ~300 ms eased pan; the frame swap (S3) still happens at the start, the scene then slides to it. A user pan/zoom mid-glide cancels it (existing `animateTo` rule) | **Medium**: changes how every collapsible-group story *looks* by default | F1 |
| F3 | defect | implemented | `file:packages/canvas-ui/src/editors/behaviours/collapse-expand/{fields,mapping,types}.ts` | Add `centerDurationMs` as a number field ("Centre glide (ms)", 0–1000), shown only when `centerOnToggle` is on; defaulted in `mapping.ts` | Rule 12: the new option is editable state in `CanvasSettingsEditorPanel` | Low | F2 |
| F4 | dressing → feature | deferred | `sym:GraphLayer` group drain + `pkg:@invana/renderer-pixijs` | Morph the frame between expanded and collapsed geometry (tween bounds, fade members/edges) instead of swapping in one frame | Removes S3's shape pop; with F2 the whole toggle reads as one motion | High: spec-level tweening of group silhouettes, member alpha and edge re-routing across two packages. Unblocked by a `feat/` RFC of its own | F2 |
| F5 | defect | implemented | `file:packages/canvas-core/src/abstracts/Camera.ts#L141-L159` · `sym:Camera` constructor's `binding.onTransformChange` handler | Call `this.cancelAnimation()` there. That callback fires only for **backend-driven** changes (drag, wheel, pinch, momentum — `file:packages/renderer-pixijs/src/renderer/PixiViewportBinding.ts#L127-L140`), never for Camera's own writes | Makes `animateTo`'s documented rule — "a user who pans or zooms mid-glide owns the camera" — true for real gestures, not only for programmatic `set*` calls. Fixes V4's failure: the glide stops fighting the drag, and drag-pan momentum no longer inherits the glide's velocity | Low–medium: also changes `CanvasConfig.fitAnimation`'s first fit (a gesture during it now cancels it — the documented intent). A still-coasting momentum from an earlier pan would cancel a glide started during it; the double-click's own `pointerdown` stops that momentum first, so a toggle is unaffected | — |
| F6 | defect | implemented | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts` (`centerOnToggle` default + gate `=== true`) · `file:packages/canvas-ui/src/editors/behaviours/collapse-expand/{mapping,types,fields}.ts` | `centerOnToggle` defaults to `false`: collapsing / expanding leaves the camera where it is; the frame stays where the user clicked it. Opting in (`true`) re-centres with the F2 glide | Removes the camera move entirely — the maintainer's call on `D1` | **Medium**: every story mounting `CollapseExpandBehaviour` (C2, C3) stops re-centring; serialised configs that never set the key change behaviour, configs with `centerOnToggle: true` are unaffected | — |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:Camera.animateTo` + `Canvas.tickOnce` → `camera.tick` | F1 glides only while the engine ticks | If a canvas stops ticking while idle, the glide would stall mid-way |
| U2 | `data:changed` emitted after the group drain | F2 still needs post-reproject bounds | Unchanged by this RFC |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `sym:GraphLayer.centerOnPoints` (`file:packages/graph/src/layer/GraphLayer.ts#L1509-L1523`) | internal caller of `centerOn` | None — no second arg, stays instant | none |
| C2 | `story:graph/Behaviours/CollapseExpand` + the 8 `story:graph/Groups/*` stories that mount `CollapseExpandBehaviour` (`AllOptions`, `CircleGroup`, `CircleNestedGroups`, `GroupWithEdges`, `HackerStyle`, `NestedGroups`, `RectGroup`) | stories | Re-centre now glides by default | none (visual check V5) |
| C3 | `story:usecases/by-casestudies/global-model/GlobalModel` | story, **not on `main` yet** (branch `fix/global-model-text-alignment`) | Glides once both land | none |
| C4 | `pkg:@invana/canvas-react` `CollapseExpandBehaviour` wrapper | props derive from the options type | New optional prop appears | none |
| C5 | Serialised `CanvasConfig` (`behaviours["collapse-expand"]`, e.g. GlobalModel `settings.json`) | persisted state | Additive optional key; old configs get the default | none |
| C6 | `api/canvas-core.surface.txt` | API snapshot | No new export name | re-run `check-api-surface` to confirm |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Re-run the rAF viewport probe across a collapse | GlobalModel, (1250, 530) | ≥ 12 distinct, monotonic transforms over ~300 ms, final value equal to today's `(-488.1, 271.4)` | F1, F2 |
| V2 | pass | Same across an expand | GlobalModel collapsed tab | Eased 21.8 px pan, same end transform as today | F1, F2 |
| V3 | pending | **Control**: `centerDurationMs: 0` | GlobalModel | Exactly today's T1 — 2 distinct transforms | F2 |
| V4 | pass | Drag-pan during the glide | GlobalModel with `centerOnToggle` switched on in the editor: double-click (327, 395), drag (700→800, 780) at +40…+150 ms. (First run, before F5: **fail** on `story:graph/Groups/NestedGroups`) | Glide cancels; the user's pan wins, no snap-back | F1, F2, F5 |
| V5 | pass | Collapse/expand in the stories on `main` | `story:graph/Behaviours/CollapseExpand`, `story:graph/Groups/NestedGroups` | Glides; nested toggles still centre the right frame | F2 |
| V6 | pass | Editor shows and applies the field | `CanvasSettingsEditorPanel` in GlobalModel | Changing it alters the next toggle's glide live | F3 |
| V7 | pass | `pnpm check-types` · `pnpm lint` (boundaries + api-surface) · `pnpm build` · canvas-core (143) + graph (190) tests | repo | green | F1–F3 |

### Results, 2026-09-24

| Check | Measured |
|---|---|
| V5 · `graph/Behaviours/CollapseExpand`, collapse at (365, 600) | 19 distinct transforms over 302 ms, x 365.8 → 700.0 on an ease-out curve, landing exactly on target. Expand: 0 px (the circle frame keeps its centre — correct) |
| V5 · `graph/Groups/NestedGroups`, inner collapse at (700, 195) | 18 transforms over 286 ms, (700, 433.8) → (605.8, 544.2). Expand: 18 transforms → (700, 592.7) |
| V1 · GlobalModel, collapse at (1250, 530) | 19 transforms over 302 ms, x 45.5 → −488.1 eased — the same end transform as the 1-frame jump measured in S1 |
| V2 · GlobalModel, expand at (714, 457) | 18 transforms over 288 ms → (−466.3, 276.5), the same end as S2 |
| F6 · GlobalModel, collapse (1250, 530) then expand (1250, 475) | 1 distinct transform across both toggles — the camera does not move; screenshots confirm the frame closed and re-opened |
| V6 · GlobalModel settings panel → Collapse / Expand | Fields *Double-click to toggle* · *Centre on toggle* (off by default) · *Centre glide (ms)* render; switching *Centre on toggle* on makes the next toggle glide live — 19 transforms over 303 ms, (45.5, 287.7) → (396.7, 357.5) |
| V4 after F5 · GlobalModel, drag during the glide | **Pass.** Glide runs 3 frames, then the drag's first move cancels it: y freezes at 317.1, x advances exactly +20 px per drag step, then coasts in the **drag's** direction with y unchanged. No snap-back, no glide velocity inherited |
| V4 before F5 · `graph/Groups/NestedGroups`, drag during the glide | **Fail.** Pointer down at +63 ms, up at +146 ms: the glide ran on to its target regardless, erasing the +100 px drag. Then drag-pan momentum, computed from viewport positions sampled *during the glide*, drifted the camera a further ~200 px in the **glide's** direction for > 1.2 s. Control: the same drag with no toggle pans +100 px and coasts right, as expected. Cause and fix: `F5` |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where should the camera go after a toggle? | (a) **centre** the frame, glided (today's intent) · (b) **hold**: pan only by the frame's own centre shift, so it stays where the user clicked (≈0 px on collapse, ≈22 px on expand here) · (c) both, as `centerOnToggle: 'center' \| 'hold' \| 'none'` | **(a) now** — it is the documented behaviour, F1–F3 fix *how* it moves. (b) is a legitimate alternative; if wanted, add it later as a separate flat option rather than turning the boolean into a union | **revised** → no camera move by default (F6); (a) kept as the opt-in |
| D2 | Default `centerDurationMs` | 0 (opt-in) · 250 · 300 · 400 (the `animateTo` default) | **300** with `easeOutCubic` — long enough to track a 500 px pan, short enough not to delay the next click | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-24 | Opened | proposed | Reported on GlobalModel as "becomes the centre and dances". Measured with a Playwright rAF probe: one instant pan per toggle; layouts, story wiring and momentum ruled out. S4 (edges steal the double-click on a collapsed tab) noted for a separate RFC |
| 2026-09-24 | F1–F3, D1 (a), D2 (300 ms) approved | accepted | Maintainer: "ok" |
| 2026-09-24 | F1–F3 implemented | implemented | `centerOn(x, y, { durationMs, easing, onDone })`; `centerDurationMs` option (default 300); editor field. Build, types, lint, surface, tests green (V7). Glide confirmed in two stories (V5) |
| 2026-09-24 | V4 failed; F5 added | proposed | A drag during the glide does not cancel it, and momentum then inherits the glide's velocity — the original "dancing", now reached through a different door. Pre-existing in `sym:Camera.animateTo` (also affects `fitAnimation`); F2 makes it reachable on every toggle |
| 2026-09-24 | V1, V2 pass | implemented | Changes carried onto `fix/global-model-text-alignment` (where GlobalModel lives) at the maintainer's request; the throwaway `fix/collapse-toggle-camera-snap` branch is unused |
| 2026-09-24 | D1 revised; F6 implemented | implemented | Maintainer: "on collapse or expanding the group is still recentering. it should not". `centerOnToggle` now defaults to `false`; build, types, graph tests (193) green; GlobalModel probe shows zero camera motion |
| 2026-09-24 | F5 approved and implemented | implemented | Maintainer: "fix f5". `cancelAnimation()` in the `onTransformChange` bridge; only drag / decelerate / wheel / pinch plugins are installed (`file:packages/renderer-pixijs/src/renderer/PixiViewportBinding.ts#L94-L118`), so no programmatic write trips it. V4, V6 pass; types, canvas-core (143) + graph (193) tests, boundaries, API surface green. Still pending: V3 (`centerDurationMs: 0` control) |
