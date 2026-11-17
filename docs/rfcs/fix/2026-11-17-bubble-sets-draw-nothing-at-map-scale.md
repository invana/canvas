---
id: fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale
type: fix
title: Bubble sets draw nothing at map scale, and misjudge pixel-constant members
status: accepted
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/graph-layer-bubble-sets, pkg:@invana/canvas-ui]
design_of_record: doc:docs/geo-intelligence-plan.md
relations:
  - { predicate: manifests-in, object: story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations }
  - { predicate: blocks, object: doc:docs/geo-intelligence-plan.md }
---

| | |
|---|---|
| What breaks | On a `MapLayer` canvas, `BubbleSetsLayer` paints no contour for any set — no error, no warning |
| Root cause | `bubblesets-js` grids in whole units; at map scale the world is 512 units across, a cluster spans 0.1–0.7 units, so any `pixelGroup` small enough to resolve it yields an empty outline (F1). Separately, members are sized from their **authored** spec, which `NodeScaleLODBehaviour` rewrites to screen pixels (F2) |
| Defect rows | F1, F2, F3, F5 |
| Row status | proposed 0 · accepted 0 · implemented 5 (F1–F5) · landed 0 |
| Open decisions | none |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Two sets (5 and 6 members) over the Telangana sample paint nothing; `specs` stays empty after recompute | `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` (before its hand-computed hulls) | live probe 2026-11-17: `circuits.specs` had 0 entries, `sets: 2`, members present with bounds `0.008 × 0.008` |
| S2 | The same members, coordinates and radii multiplied by 1000 produce a 1,522-point outline | standalone `bubblesets-js` run | `createOutline` returned 0 points at world scale, 1,522 at ×1000 |

**Ruled out**

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The anchor layer being `visible: false` hides its nodes from the compute | no | `boundsOfNode` returned real bounds for the hidden layer's nodes |
| R2 | The recompute never ran | no | sets were registered and members resolved; the library returned an empty path |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `MapLayer` pins content in web-mercator pixels at zoom 0: the whole earth is 512 world units | `file:packages/graph-layer-maplibre/src/mercator.ts` (`WORLD_SIZE = 512`) | a city-scale cluster is ~0.1 units, a district-scale one ~0.7 |
| 2 | `computeAndPaint` passes world-unit rects and options straight to the library | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L260`, `#L295` (`algorithmOptions`) | the library's grid cell is `pixelGroup` world units |
| 3 | `bubblesets-js` builds an integer-indexed potential grid; sub-unit cells collapse | S2 | 0 outline points → `publishSet` publishes nothing → S1 |
| 4 | (independent) members are measured by `GraphLayer.boundsOfNode`, which reads the **authored** spec | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L286-L292` → `file:packages/graph/src/layer/GraphLayer.ts#L1499-L1502` (`boundsOfSpec(nodeSpec(node))`) | under `NodeScaleLODBehaviour` the spec holds screen-px sizes "as if world units" (the transform scales them back), so a 20 px marker measures 20 world units — 40× a district at map scale |

**Confirming test**

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Kakatiya set at world scale, `pixelGroup 0.002` | 0 points | step 3 |
| T2 | Same, inputs and radii × `k = 4 / 0.002`, `pixelGroup 4`, output ÷ `k` | 1,524 points; first point at world (369.16, 229.97) — inside the Warangal area | F1's transform is sufficient and places correctly |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/geo-intelligence-plan.md` | design of record (P1, B1–B2) | 📋 | this RFC scopes P1's landing |
| `rfc:feat-2026-10-21-an-annotation-is-part-of-the-graph` | relates-to (D3: frames as a world layer) | landed | bubble sets stay a derived-geometry world layer — no change to that choice |

## 4. The fix

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L205-L311` (`computeAndPaint`, `algorithmOptions`) | compute in a normalised space: `k = LIB_CELL / pixelGroup` with `LIB_CELL = 4` (the library default); multiply member / non-member rects, edge lines, `nodeR0/1`, `edgeR0/1`, `morphBuffer` by `k`; pass `pixelGroup: LIB_CELL`; divide the outline points by `k` before smoothing / publishing | every world-unit option works at any scale. At the default `pixelGroup: 4`, `k = 1` — byte-identical behaviour for existing users | low — pure coordinate transform, identity at defaults | — |
| F2 | defect | implemented | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L286` (`rectForNode`) | measure a member by its **drawn** world bounds (`graph.getRenderer()?.getShapeWorldBounds(id)`, which the hit index refreshes after `scaleShape`), falling back to the authored bounds, then to the small box | pixel-constant markers can be set members; contours hug what's on screen | **medium** — bubble shapes change wherever `NodeScaleLODBehaviour` is on (the currently-broken case); recompute must re-run on zoom settle when members are pixel-constant (F3) | — |
| F3 | defect | implemented | same file | recompute on `input:camera:zoom` **settle** (debounced by `recomputeDebounceMs`) — only when a set member's drawn size changed by more than 0.5 % since the last paint (`memberRects` baseline); one cheap measure per member otherwise, and no recompute for a plain graph | the contour follows marker size across zoom | medium — a recompute per zoom settle; bounded by set count × member count | F2 |
| F4 | dressing | implemented | `file:packages/canvas-ui/src/editors/layers/bubble-sets-layer/fields.ts` | allow sub-unit values (step `0.001`) for `pixelGroup`, radii and `morphBuffer` in the editor | the settings editor can configure a map-scale bubble set | low | F1 |
| F5 | defect | implemented | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts` | add `setOptions(patch)` — merge into `options`, replace `sets` when given, schedule a recompute. Found while writing V6: `sym:configurable` only forwards `canvas.update({ layers })` to an instance that has a `setOptions` method, and `BubbleSetsLayer` has none, so the settings editor (and any JSON `config.layers['bubble-sets']`) is silently ignored. Existing stories change a bubble set by mutating `layer.options` and calling `recompute()` | the layer becomes config-driven like every other layer (root rule 12; the geo-intelligence plan's "everything is JSON" goal); F4's editor fields start to apply | low — additive; `graphLayerId` stays constructor-only (cross-layer id) | — |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `bubblesets-js` `createOutline` | F1 relies on its grid being scale-relative to `pixelGroup` | a library change to absolute units would need `LIB_CELL` revisited |
| U2 | `sym:PrimitivesRenderer.getShapeWorldBounds` reflecting `scaleShape` | F2 reads it | **resolved**: it computes from the spec and the live `rec.scale` on each call (`file:packages/canvas-store/src/hit/PickingIndex.ts#L366-L379`), not from the lazily re-indexed boxes — never stale |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:graph-layers/bubble-sets/BubbleSetsLayer` | story | F1 identity at its defaults (`pixelGroup 4`); F2 changes nothing there (no scale-LOD) | V1 control |
| X2 | `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` | story | can replace its hand-computed hulls with `BubbleSetsLayer` | plan S1 (separate change) |
| X3 | `pkg:@invana/canvas-ui` `BubbleSetsLayerEditorPanel` | editor | field steps (F4) | F4 |
| X4 | Published `BubbleSetsLayerOptions` | API | no type change | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | control — visual compare before / after | `story:graph-layers/bubble-sets/BubbleSetsLayer` | identical contours | F1 |
| V2 | pass | new story: bubble sets on a map, world-sized members | `story:graph-layers/bubble-sets/AtMapScale` | two sets painted around their members at map zoom 7–13 | F1 |
| V3 | pass | new story: members are pixel-constant markers (`NodeScaleLODBehaviour`) | `story:graph-layers/bubble-sets/PixelConstantMembers` | contour hugs the markers at map zoom 8 and 12; follows after a zoom settles | F2, F3 |
| V4 | pass | unit test: `k`-transform round-trip (inputs scaled, output unscaled). The package has no test runner today — this adds a `vitest` setup mirroring `pkg:@invana/graph` | `pkg:@invana/graph-layer-bubble-sets` | outline points within 1e-6 of the ×k run divided by k | F1 |
| V5 | pass | `pnpm check-types` · `pnpm lint` · `pnpm build` | repo | green | all |
| V6 | pass | config applies live | `sym:configurable` → `BubbleSetsLayer` | the layer's options change | F4, F5 — was a code-read failure (no `setOptions`). Now: `GeoAnnotations` constructs the layer with `sets: []` and every set and radius comes from `config.layers['bubble-sets']` through `canvas.update` — both clusters paint. The settings-editor UI itself was not driven |

**Observed (2026-11-17)**

| Check | Result |
|---|---|
| V1 | `story:graph-layers/bubble-sets/BubbleSetsLayer` rendered after the change: three smooth contours around their members, as before. Byte-identity at the default grid is also unit-tested (V4, `pixelGroup 4` → `k = 1`) |
| V2 | `story:graph-layers/bubble-sets/AtMapScale`: both sets painted as blobs at map zoom 7.4 and 11; the Hyderabad contour wraps its members when zoomed in |
| V3 | `story:graph-layers/bubble-sets/PixelConstantMembers`: at zoom 11.2 the contour hugs 18 px markers (measured by drawn size); at zoom 9 it re-tightened to ≈ 5 px margin (the F3 zoom-settle recompute ran); at zoom 13 it grew with the stroke and reach, which are world units by design |
| V4 | `packages/graph-layer-bubble-sets/tests/outline.test.ts` — 13 tests: identity at the default grid, the library returns 0 points at map scale (the defect), the wrapper returns > 100, outline stays in world units around the members, round trip against a hand-scaled run, empty input, a non-member changes the outline at map scale. Added `vitest` to the package |
| V5 | `check-types` (bubble-sets, canvas-ui, storybook) · `check-boundaries` · `check-api-surface` · eslint — 0 errors; the 12 warnings are in code this change did not touch |

**Findings that changed the RFC**

| ID | Finding | Effect |
|---|---|---|
| N1 | The library's `createOutline` types omit `pixelGroup` although its constructor honours it (probe: 0 → 1,522 points) | F1 passes options as a variable; commented in `file:packages/graph-layer-bubble-sets/src/outline.ts` |
| N2 | `BubbleSetsLayer` has no `setOptions` | new row F5, V6 fails until it lands |
| N3 | A bubble set's `label` (`placement: 'centroid'`) drew nothing at map zoom 7.4 or 11 in `AtMapScale` | not investigated — out of P1's scope; the story omits labels. Candidate follow-up row |
| N4 | The library's routing does not strictly keep the outline out of a non-member's rect (3 points inside in both runs) | tests assert only that a non-member changes the outline at map scale, not exclusion |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Recompute on zoom (F3) | (a) always on zoom settle · (b) only when a member is pixel-constant · (c) never — document | (b): zero cost for today's users, correct for markers | accepted 2026-11-17 — implemented as "only when a member's drawn size changed", which is (b) without having to detect `NodeScaleLODBehaviour` |
| D2 | Add `setOptions` to `BubbleSetsLayer` (F5) | (a) now, in this RFC · (b) its own RFC · (c) leave — editor stays inert | (a): it is additive, it closes V6, and it is what makes a bubble set JSON-configurable | accepted 2026-11-17 ("go") |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened from the GeoAnnotations story and the geo-intelligence plan (P1) | proposed | diagnosis and T2 measured before writing |
| 2026-11-17 | Approved by the maintainer ("ok proceed") | accepted | D1 accepted |
| 2026-11-17 | F1–F4 implemented; V1–V5 pass; V6 fails (N2) → F5 added | accepted | F5 and D2 await approval; the RFC reaches `landed` when F1–F5 are `landed`/`rejected` and the change is in `main` |
| 2026-11-17 | F5 approved (D2 (a)) and implemented: `setOptions` + `tests/setOptions.test.ts` (3 tests); V6 to be re-driven through the GeoAnnotations story | accepted | |
| 2026-11-17 | F5 approved (D2 (a)) and implemented: `setOptions` + `tests/setOptions.test.ts` (3 tests); V6 to be re-driven through the GeoAnnotations story | accepted | |
