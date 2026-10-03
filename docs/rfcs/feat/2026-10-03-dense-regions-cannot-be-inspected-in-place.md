---
id: feat-2026-10-03-dense-regions-cannot-be-inspected-in-place
type: feat
title: A fisheye lens magnifies a dense region in place, keeping its surroundings
status: accepted
opened: 2026-10-03
decided: 2026-10-03
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/renderer-pixijs, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: relates-to, object: doc:docs/renderer-split-design.md }
  - { predicate: relates-to, object: doc:docs/render-planes-and-emphasis-plan.md }
  - { predicate: relates-to, object: doc:docs/large-graph-performance-plan.md }
  - { predicate: relates-to, object: doc:docs/handoff-2026-09-28-canvas-playbooks.md }
---

**Summary:** Today the only way to read a dense cluster is to zoom the camera, which throws away its
surroundings and, under text LOD, still hides labels until you're deep enough. This RFC adds a
G6-style **fisheye lens** (`sym:FisheyeBehaviour`, `kind: 'fisheye'`). Nodes under the pointer are
pushed apart and enlarged, and their labels are shown. Everything outside the lens stays put.
The distortion is **display-only**: a new renderer command, `sym:IElementRenderer.setShapeDisplayOverride`,
layers it on top of the node's logical position. The store, the layout and history never see it.
Edges, picking and LOD scaling all combine with it.

| | |
|---|---|
| **What's missing** | A focus+context view. You can zoom (and lose context) or overview (and lose detail), but not both at once |
| **Why it isn't a behaviour-only change** | Every renderer command that moves or scales a shape *overwrites* a single slot (`moveShape` writes the logical position, `scaleShape` writes the one `gfxScale`). A lens built on them is reset by every layout tick and fights NodeScaleLOD and HoverActivate (M3, M4) |
| **Core rows** | F1 (contract) · F3–F5 (renderer combines the override) · F8 (behaviour) |
| **Open decisions** | D-9 (dragging a magnified node keeps the lens offset from the cursor — V8) |

Row status: proposed 0 · accepted 0 · implemented 15 · landed 0 · deferred 3 · rejected 0 · superseded 0

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| M1 | Inspecting a dense region means zooming the camera; once zoomed in, the surroundings and the region's relation to them are off-screen | n/a (interaction gap) | No behaviour in `file:packages/graph/src/behaviours/` or `file:packages/canvas/src/behaviours/` magnifies locally |
| M2 | Under text LOD, labels in a dense region stay hidden until the camera crosses the band, so "zoom a little to peek" shows dots, not names | `file:packages/graph/src/behaviours/ContentLODBehaviour.ts#L207-L213` · `file:packages/graph/src/behaviours/TextLODBehaviour.ts#L70` | `sweep(bandVisible)` hides text on every non-exempt node |
| M3 | The renderer's per-frame transform commands write the **logical** position in place. A later `moveShape` / `updateShape` from the layer (every flush, every layout tick) overwrites any visual displacement | `file:packages/canvas-core/src/contracts/IElementRenderer.ts#L70-L77` · `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L768-L783` · `file:packages/graph/src/layer/GraphLayer.ts#L2509-L2537` · `file:packages/renderer-pixijs/src/primitives/base/ShapeBase.ts#L139` | `moveShape` mutates `inst.spec.x/y`; `draw` re-sets `gfx.position` from the spec |
| M4 | Visual scale is **one slot**, `gfxScale`, shared by NodeScaleLOD and HoverActivate. The last writer wins | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L653-L658` · `file:packages/graph/src/behaviours/NodeScaleLODBehaviour.ts#L194-L203` · `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L725-L750` | HoverActivate's TSDoc (`#L696`): "does NOT compose with LOD" |
| M5 | Edge endpoints, anchors and picking already honour `gfxScale` and the spec origin. A displacement modelled the same way would be followed for free | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L2429-L2441` · `#L2473-L2509` · `#L1799-L1808` · `file:packages/canvas-store/src/hit/PickingIndex.ts#L575-L616` | `endpointCenter` = `spec.x + boundsCentre·gfxScale`; `shapeRecord` hands picking `{ spec, scale }` |
| M6 | Precedent: G6's Fisheye plugin (Sarkar–Brown distortion, `trigger` pointermove/click/drag, `r` / `d` adjustable by wheel or drag, `nodeStyle: { label: true }`) | https://g6.antv.antgroup.com/en/manual/plugin/fisheye · source `antvis/G6` `packages/g6/src/plugins/fisheye/index.ts` | Its `d' = (d+1)·r·dist / (d·dist + r)` maps `[0,r] → [0,r]`, so the rim is continuous. It loops over **all** node data on every pointer move and rewrites node style |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | Write distorted positions into `GraphStore` (silently) | Rejected | `setPosition` queues `node:update`, feeds layouts, export and the operation log (`file:packages/graph/src/store/GraphStore.ts#L806-L854`). Positions are layout-derived state; a hover gesture must not change them |
| R2 | Use the existing transform `EffectSpec` (`TransformDelta { dx, dy, sx, sy }`) | Rejected | Edges and picking ignore effects, so clicks would land on the old spot. `applyEffectsToHost` calls `gfx.scale.set(sx, sy)`, dropping `gfxScale` (`file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1699`). `registerEffect` is not on `IElementRenderer`, so `pkg:@invana/graph` can't add a kind |
| R3 | Behaviour-only: drive `moveShape` / `scaleShape` directly, re-apply after `data:changed` | Rejected | M3 + M4: overwritten each flush while a layout runs, and it erases LOD/hover scale (there is no getter to multiply against). It would add a third last-writer-wins scale writer |
| R4 | A loupe **layer**: render a magnified copy of the region into a circle | Rejected | The only capture path is `IRenderer.extract` (synchronous GPU readback, raster export only, `file:packages/canvas-core/src/contracts/IRenderer.ts#L153-L158`). It needs a secondary-view contract, and it covers the context instead of keeping it (Q1) |
| R5 | Show lens labels with a runtime state `'fisheye'` + `labelForceShow` | Rejected | Each enter/leave flips a state, so `rerenderNode` rebuilds geometry (`file:packages/graph/src/layer/GraphLayer.ts#L587-L589`), then `data:changed` (`#L613`) makes ContentLOD run a full O(N) sweep and TextLOD an O(N log N) exemption refresh (`file:packages/graph/src/behaviours/ContentLODBehaviour.ts#L116`). That's per pointer frame, on the large graphs this is for |
| R6 | G6's membership test (iterate every node object each move) | Rejected | `GraphStore.nodes()` allocates a `GraphNode` per node (`file:packages/graph/src/store/GraphStore.ts#L666-L671`). A scan over the typed `x`/`y` columns (`#L2125-L2131`) gives the same answer with no allocation |

---

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D1 | New renderer command `setShapeDisplayOverride(id, override \| null)` + `clearShapeDisplayOverrides()` on `IElementRenderer`, in the "per-frame transforms (commands, not spec writes)" group. `ShapeDisplayOverride = { dx?, dy?, scale?, showText? }` is declared in `pkg:@invana/canvas-core` contracts | `file:packages/canvas-core/src/contracts/IElementRenderer.ts#L70-L77` | A transient visual stays out of state, by the same reasoning the contract already gives for drag/zoom transforms. Generic, not fisheye-specific |
| D2 | The renderer stores the override per shape **separately** from `spec` and `gfxScale`. Drawn origin = `spec + (dx, dy)`; drawn scale = `gfxScale × scale`, applied **about the shape's local-bounds centre** so rects and cards don't drift toward their top-left origin. It's re-applied after every `draw` / `moveShape` / `scaleShape` | M3 · M4 · `file:packages/renderer-pixijs/src/primitives/base/ShapeBase.ts#L139` | Layout ticks and LOD/hover scale update the base; the override rides on top. No path overwrites it except its owner |
| D3 | Geometry answers use the **drawn** transform: `endpointCenter`, `anchorShapeRef`, `partIdAt`, `getShapeWorldBounds`, `getShapeCenter`, badge and decoration re-anchoring. `shapeRecord` returns a displaced spec copy plus the product scale, **only for overridden shapes** | M5 · `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1971-L1979` · `#L1443` · `#L2531` | Edges re-route to the drawn node and clicks hit what you see. `pkg:@invana/canvas-store`'s `PickingIndex` needs **no change** |
| D4 | `getShapePosition` keeps returning the **logical** position (documented) | Callers `file:packages/canvas/src/behaviours/DragShapeBehaviour.ts#L95` · `file:packages/graph/src/behaviours/NodeResizeBehaviour.ts#L335` · `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L384` | Those compute deltas from and write back to the logical position. Returning the drawn one would make them write the lens offset into state (R1 by the back door) |
| D5 | Text: the renderer tracks LOD text visibility (`setShapeTextVisible`, `setDecorationVisible(id,'label')`) per shape. Drawn visibility = `override.showText === true ? true : lodVisible` | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L668` · `#L2213` · `file:packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L389` | Lens labels show regardless of TextLOD/ContentLOD/LabelCollision, and those keep working unmodified. Clearing the override restores whatever LOD last wanted. No state flip, no `data:changed`, no sweep (fixes R5) |
| D6 | `FisheyeBehaviour` in `pkg:@invana/graph`, `kind = 'fisheye'`, `targetLayerId` required (root rule 8), options-first `resolveOptions` pattern (§2.1). DOM listeners on `ctx.canvasElement` / `window`, like `LassoSelectBehaviour` | `file:packages/graph/src/behaviours/LassoSelectBehaviour.ts#L164-L188` | Follows the existing behaviour shape; never auto-enables (root rule 7) |
| D7 | The lens centre and radius are held in **screen px** and converted to world once per frame (`camera.toWorld`, `r_world = r_px / camera.scale`) | `file:packages/canvas-core/src/abstracts/Camera.ts#L427` | The lens feels the same size at any zoom (Q3) |
| D8 | Membership: new `GraphStore.nodeIdsWithin(cx, cy, r, out?)` scans the `x`/`y` columns of **visible** nodes using logical positions | `file:packages/graph/src/store/GraphStore.ts#L2125-L2131` | O(N) typed-array work and O(k) allocation per frame. The lens is computed from layout positions, never from distorted ones, so there's no feedback |
| D9 | Distortion (pure helper `fisheyeDisplace`): `dist' = (d+1)·r·dist / (d·dist + r)` along the focus→node ray; node scale `1 + (nodeScale − 1)·(1 − dist/r)` | M6 | Continuous at the rim (`dist = r` → no move, scale 1), so nodes don't pop as they cross it |
| D10 | Per frame (rAF-coalesced): diff the new membership against the previous one. Entered/kept nodes get `setShapeDisplayOverride`, exited ones get `null`. Incident edges of every touched node (via `GraphStore.edgesOf`) are re-routed once each with `updateConnector(eid, {})` | `file:packages/graph/src/store/GraphStore.ts#L697` · `file:packages/graph/src/layer/GraphLayer.ts#L605-L611` | Edges follow; cost scales with the lens population, not the graph |
| D11 | The layer's `data:changed` (layout tick, data edit) schedules a recompute with the current focus | `file:packages/graph/src/layer/GraphLayer.ts#L613` | The lens tracks a running force layout without jitter (D2 keeps the override; D11 refreshes its numbers) |
| D12 | Gesture yield: while `ctx.gestures.owner` is someone else (node drag, lasso), the lens clears its overrides and hides. It resumes on release | `file:packages/canvas-core/src/abstracts/GestureArbiter.ts#L60-L80` | Dragging a magnified node can't feed the lens offset back through the drag maths |
| D13 | Lens ring: a `'screen'` overlay (`ctx.createOverlay`), redrawn only when `radius` or the style changes and moved with `setPosition` each frame | `file:packages/canvas-core/src/abstracts/CanvasContext.ts#L120` | Pointer motion costs one transform write for the ring |
| D14 | Triggers: `'pointermove'` (follows the cursor; hides on `pointerleave`), `'click'` (moves to the click), `'drag'` (pointerdown inside the lens claims the gesture, which suspends drag-pan) | `file:packages/canvas-core/src/abstracts/GestureArbiter.ts#L60-L80` | G6 parity |
| D15 | Wheel adjust: `radiusWheelModifier` (default `'alt'`) and `distortionWheelModifier` (default `'shift'`), active only with the pointer inside the lens. A capture-phase `wheel` listener on the canvas host's parent calls `preventDefault` + `stopPropagation` so pixi-viewport's non-passive zoom listener never sees the event. Delta = `deltaX + deltaY` (Shift+wheel on macOS arrives as `deltaX`) | `file:packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L42-L55` · `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L421-L425` | Resizing the lens never zooms the camera; a plain wheel still zooms (Q4) |
| D16 | Disable / destroy / `pointerleave`: `clearShapeDisplayOverrides` for tracked ids, re-route their edges, destroy the overlay, remove listeners | n/a | The graph is drawn exactly as before the lens existed |

### 2.1 Options (flat, serialisable)

| ID | Option | Type | Default | Note |
|----|--------|------|---------|------|
| O1 | `targetLayerId` | `string` | required | Root rule 8 |
| O2 | `trigger` | `'pointermove' \| 'click' \| 'drag'` | `'pointermove'` | D14 |
| O3 | `radius` | `number` (screen px) | `120` | G6 default |
| O4 | `minRadius` / `maxRadius` | `number` / `number \| null` | `20` / `null` → half the smaller canvas side | Clamp for wheel adjust |
| O5 | `distortion` | `number` | `1.5` | G6 `d` |
| O6 | `minDistortion` / `maxDistortion` | `number` | `0` / `5` | G6 bounds |
| O7 | `nodeScale` | `number` | `1.5` (D-5) | Size at the focus; fades to 1 at the rim (D9) |
| O8 | `showLabels` | `boolean` | `true` | Sets `showText` on lens nodes (D5) |
| O9 | `radiusWheelModifier` / `distortionWheelModifier` | `'alt' \| 'shift' \| 'ctrl' \| 'meta' \| null` | `'alt'` / `'shift'` | `null` disables that adjust |
| O10 | `lensStrokeColor` / `lensStrokeWidth` / `lensFillColor` / `lensFillAlpha` | `number` | `0x64748b` / `2` / `0x94a3b8` / `0.08` | Manual colours; theming deferred with F15 |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|-----|----------|--------|---------------|
| G6 Fisheye plugin (external, URL in M6) | relates-to | shipped upstream | Formula, triggers, option names (mapped to flat, unit-explicit names), labels-in-lens default. Not its O(N)-per-move membership or its style-rewrite mechanism (R5, R6) |
| `doc:docs/renderer-split-design.md` §3 | relates-to | design of record | Transient visuals are renderer commands or overlays, never specs. D1 and D13 follow it |
| `doc:docs/render-planes-and-emphasis-plan.md` | relates-to | partly superseded | Its replacement adds a renderer *colour fast path* "sibling of the existing transform fast path". D1 is another such sibling, for displacement |
| `doc:docs/large-graph-performance-plan.md` | relates-to | plan | Machine-rate visuals stay off the reactive store. D8/D10 keep per-frame work proportional to the lens |
| `doc:docs/handoff-2026-09-28-canvas-playbooks.md` | relates-to | handoff | "The canvas has NO lens / filter" refers to a **data** lens (query/filter). This is a **visual** lens. Naming stays `Fisheye*` to avoid the collision |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | implemented | `file:packages/canvas-core/src/contracts/IElementRenderer.ts#L70-L77` (new `sym:ShapeDisplayOverride`, `sym:IElementRenderer.setShapeDisplayOverride`, `sym:IElementRenderer.clearShapeDisplayOverrides`) | Add the type + two methods with TSDoc (D1, D4, D5 semantics); export from the contracts barrel | The seam exists | **medium**: public contract every backend must implement; `api/canvas-core.surface.txt` + `api/canvas.surface.txt` change | — |
| F2 | defect | implemented | `file:packages/canvas-core/src/headless/HeadlessRenderer.ts#L58-L110` | Implement both methods by recording overrides in a public `displayOverrides` map (the double answers `getShapeWorldBounds` with `null` for every shape, so there was nothing to make honour the override) | Headless consumers compile; behaviour tests assert what the lens asked to draw | low | F1 |
| F3 | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L606-L624`, `#L653-L658`, `#L768-L783` | Per-instance `displayOverride`; apply drawn position/scale (about the bounds centre) after `draw`, `moveShape`, `scaleShape`; `markShapeMoved` on change. Shapes with no override take an untouched path (one null check) | D2 | **high**: on the hot path of every node move and LOD scale; a regression shows in every story. Zero-override path must be byte-for-byte today's behaviour | F1 |
| F4 | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1799-L1808`, `#L1971-L1979`, `#L2429-L2441`, `#L2473-L2509`, `#L1443`, `#L2531` | Route geometry answers through `drawnOrigin(inst)` / `drawnScale(inst)` helpers (D3); `getShapePosition` stays logical (D4) | Edges, anchors, part hover, picking, badges and decorations follow the lens | **medium**: touches anchor maths and picking for every shape (identity when no override) | F3 |
| F5 | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L668`, `#L2213` | Remember LOD text/label visibility per shape; drawn = `showText \|\| lod`; re-apply on override set/clear | Lens labels show under TextLOD/ContentLOD/LabelCollision without changing them (D5) | medium: changes how two existing visibility commands store state | F3 |
| F6 | defect | implemented | `file:packages/graph/src/store/GraphStore.ts` (new `sym:GraphStore.nodeIdsWithin`) | Typed-column radius scan over visible nodes, optional reusable `out` array | D8 | low | — |
| F7 | defect | implemented | `file:packages/graph/src/behaviours/fisheye.ts` (new `sym:fisheyeDisplace`) | Pure distortion + scale-falloff helper (D9) | Unit-testable maths, shared with any future distortion | low | — |
| F8 | defect | implemented | `file:packages/graph/src/behaviours/FisheyeBehaviour.ts` (new `sym:FisheyeBehaviour`), `file:packages/graph/src/behaviours/index.ts`, `file:packages/graph/src/index.ts` | Options + `resolveOptions` (§2.1), `kind = 'fisheye'`, triggers, overlay ring, rAF loop, membership diff, edge re-route, `data:changed` recompute, gesture yield, cleanup (D6–D14, D16) | The feature | medium: new interactive behaviour; DOM listeners must be torn down exactly | F1, F6, F7 |
| F9 | defect | implemented | `file:packages/graph/src/behaviours/FisheyeBehaviour.ts` | Modifier-gated wheel adjust of radius/distortion via capture-phase listener (D15) | Q4 | **medium**: depends on DOM listener ordering against pixi-viewport; must not swallow plain-wheel zoom | F8 |
| F10 | defect | implemented | `file:packages/canvas-react/src/behaviours/FisheyeBehaviour.tsx` (new), `file:packages/canvas-react/src/index.ts` | Null-rendering wrapper, same shape as `file:packages/canvas-react/src/behaviours/NodeCentralityBehaviour.tsx` | React consumers mount it declaratively | low | F8 |
| F11 | defect | implemented | `file:packages/canvas-ui/src/editors/behaviours/fisheye/` (`fields.ts`, `mapping.ts`, `types.ts`, `FisheyeEditorPanel.tsx`, `index.ts`), `file:packages/canvas-ui/src/editor-panels/canvas-settings/registry.ts#L305`, `file:packages/canvas-ui/src/index.ts` | Schema editor for O2–O10 + registry key `'fisheye'` (root rule 12) | Editable from `GraphCanvasApp` and the studio | low | F8 |
| F12 | defect | implemented | `api/canvas-core.surface.txt`, `api/canvas.surface.txt` | Regenerate (`pnpm build && node scripts/check-api-surface.mjs --write`) | `check-api-surface` green | low | F1 |
| F13 | dressing | implemented | `roadmap.md` § Interactions (behaviours) | Row "Fisheye lens — focus+context magnifier (`FisheyeBehaviour`)" added as 🚧; flip to ✅ on landing | Status visible | low | F8 |
| F14 | dressing | deferred | `sym:FisheyeBehaviour` option `showDistortionPercent` | G6's `showDPercent` label on the ring | Parity | low | `IOverlayDevice` has no text primitive (`file:packages/canvas-core/src/contracts/IOverlayDevice.ts#L41-L70`). Unblocked by an overlay text primitive or a DOM badge |
| F15 | dressing | deferred | `sym:FisheyeBehaviour` lens colours | Themed lens colours (`ColorRole`) instead of O10 manual numbers | Follows theme switches | low | Unblocked by deciding which role the ring borrows |
| F16 | defect | deferred | `sym:GraphStore.nodeIdsWithin` | Spatial-index (rbush) membership instead of the column scan | Sub-linear membership past ~200k nodes | medium | Only if V9 shows the scan above ~1 ms/frame at the target size |
| F17 | defect | implemented | `file:packages/canvas-core/src/headless/HeadlessRenderer.ts#L35-L52` (`noopOverlay`) | Add `setVisible` / `setZIndex` / `setPosition` — the no-op overlay lacked three of `IOverlayDevice`'s ops, so any behaviour calling them threw headless | Found by V13; the headless double satisfies the overlay contract | low | — |
| F18 | dressing | implemented | `file:apps/storybook/stories/graph/Behaviours/Fisheye.stories.ts` (`story:graph/Behaviours/Fisheye`) | One imperative story (D-8): flare tree under a live force layout, `TextLODBehaviour` hiding labels at overview zoom, `ColorByBehaviour` by package, every `FisheyeBehaviourOptions` field in lil-gui, radius / distortion read back from the behaviour so Alt/Shift+wheel round-trips into the panel | Demo + manual verification surface | low | F8 |

---

## 5. Blast radius

### Upstream (what this depends on)

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | `ShapeBase.draw` setting `gfx.position` from the spec (`file:packages/renderer-pixijs/src/primitives/base/ShapeBase.ts#L139`) | F3 re-applies the override after it | A shape that positions itself elsewhere (composite internals, `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L304`) must still sit under the host `gfx` |
| U2 | pixi-viewport's wheel listener target and phase (`file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L421-L425`) | F9's interception relies on capturing above it | A pixi-viewport upgrade that listens on `window` in capture phase would let zoom fire alongside lens resize |
| U3 | `GestureArbiter` ownership notifications | D12 gesture yield, D14 drag trigger | Low: stable contract |

### Downstream (who could break)

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| C1 | `sym:HeadlessElementRenderer` and any third-party `IElementRenderer` implementation | published contract | Must implement two new methods | F2 for the in-repo double; third parties get a type error (intended, pre-1.0) |
| C2 | Every story rendering nodes via `pkg:@invana/renderer-pixijs` | visual | None when no override is set (F3/F4 identity path) | V1 control |
| C3 | `sym:NodeScaleLODBehaviour`, `sym:HoverActivateBehaviour` (writers of `gfxScale`) | behaviour | They now multiply with the lens scale instead of being overwritten | V5 |
| C4 | `sym:TextLODBehaviour`, `sym:ContentLODBehaviour`, `sym:LabelCollisionBehaviour` | behaviour | Their visibility writes are stored and combined, not applied raw | V6 + V7 (control: they behave as today with no lens) |
| C5 | `sym:DragShapeBehaviour`, `sym:NodeResizeBehaviour`, `sym:CollapseExpandBehaviour` (`getShapePosition` callers) | behaviour | None: `getShapePosition` stays logical (D4) | V8 |
| C6 | `pkg:@invana/canvas-store` `PickingIndex` | picking | None in code; it receives displaced specs for lensed shapes (D3) | V4 |
| C7 | Raster export (`file:packages/canvas/src/io/imageExport.ts#L118`) | io | A capture while the lens is active includes the distortion and the ring overlay. SVG/state export use specs and are unaffected | Documented in the behaviour's TSDoc; none |
| C8 | `api/canvas-core.surface.txt`, `api/canvas.surface.txt` | API snapshot | New exports | F12 |
| C9 | `CanvasSettingsEditor` registry (`file:packages/canvas-ui/src/editor-panels/canvas-settings/registry.ts`) | UI | New `'fisheye'` entry | F11 |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | **Control**: Playwright smoke, no fisheye registered | `story:graph-layouts/d3-force/LesMiserables`, `story:graph/Behaviours/LabelCollision`, `story:graph/Behaviours/HoverActivate`, `story:canvas/concepts/Effects/Shapes/ComposedEffects` | Render as expected, no console/page errors (2026-10-03). Smoke only — not pixel-diffed against `main` | F3, F4, F5 |
| V2 | pass | Unit (`file:packages/graph/tests/behaviours/`, new `fisheye.test.ts`) | `fisheyeDisplace` | `dist=0` → 0; `dist=r` → `r` and scale 1; monotonic in `dist`; `d=0` → identity | F7 |
| V3 | pass | Unit (`file:packages/graph/tests/store/`) | `nodeIdsWithin` | Returns exactly the visible nodes within `r`; hidden nodes excluded; reuses `out` | F6 |
| V4 | pass | Playwright on `story:graph/Behaviours/Fisheye` (`trigger: 'click'`) | Hover `FibonacciHeap` at its drawn spot (598, 469), then its logical spot (600, 447) | Drawn spot → hover ring on the magnified node; logical spot → nothing (2026-10-03). Edges visibly end on the drawn nodes; the polyline was not asserted numerically | F3, F4 |
| V5 | skipped | Playwright (canvas handle) on `story:canvas-demos/by-casestudies/geo-air-routes/AirRoutes` with `FisheyeBehaviour` registered at runtime | Zoom out (NodeScaleLOD active), hover inside the lens | Lens nodes are LOD scale × lens scale; leaving restores LOD scale exactly; hover ring still appears | F3, F8 — not run: no session story mounts NodeScaleLOD with the lens. Composition is by construction (`drawnScale = gfxScale × scale`, `file:packages/renderer-pixijs/src/renderer/mounted/ShapeInstance.ts`) |
| V6 | pass | Same harness, zoomed out past the TextLOD band | Move the lens over a cluster | Labels appear only inside the lens; leave → hidden again; zooming in shows all labels as today | F5, F8 |
| V7 | pass | **Control**: same story, lens disabled | Zoom across the TextLOD band | Labels show/hide exactly as on `main` | F5 |
| V8 | fail | Playwright on `story:graph/Behaviours/Fisheye` (force layout running) | Move the lens during simulation; then drag a magnified node 100px | **Pass:** no jitter while the layout ticks; on drag start the lens clears and returns on release (D12). **Fail:** the dragged node does not sit under the cursor — it trails it by its former lens offset (~25px here). `DragNodeBehaviour` moves the *logical* start by the pointer delta (`file:packages/graph/src/behaviours/DragNodeBehaviour.ts#L385-L404`); when D12 clears the override the node snaps back to logical, and the grab offset keeps the displacement. See D-9 | F3, F8 |
| V9 | skipped | Perf trace (not run this session — no 50k-node fixture traced) | 50k-node graph, lens moving at 60 fps | Membership scan ≤ 1 ms/frame; no full-graph `setShapeTextVisible` sweeps triggered by the lens | F6, F8 |
| V10 | pass | Playwright: Alt+wheel ×8 inside the lens, then plain wheel ×3 | `story:graph/Behaviours/Fisheye` | Alt/Shift adjust radius/distortion within bounds and the camera doesn't zoom; plain wheel zooms as today | F9 |
| V11 | pass | `pnpm check-types` · `pnpm lint` (`check-boundaries`, `check-api-surface`) · `pnpm build` | repo | Green after F12 regenerates snapshots | F1–F12 |
| V12 | pending | `CanvasSettingsEditor` renders the Fisheye section; editing `radius` applies live via `setOptions` | `GraphCanvasApp` host with the behaviour registered | Ring resizes without remount | F11 |
| V13 | pass | Unit, headless (`file:packages/graph/tests/behaviours/fisheyeBehaviour.test.ts`, 7 tests) | `FisheyeBehaviour` on `HeadlessRenderer` | Overrides exactly the in-lens nodes; focus scale = `nodeScale`, neighbours pushed outward, `showText`; store positions untouched; cleared on `setFocus(null)` / `disable()`; cleared while another owner holds the gesture and restored on release; live `setOptions`; clamping | F2, F6, F8, F17 |
| V14 | pass | Regression suites | `pkg:@invana/canvas-core` (167), `pkg:@invana/renderer-pixijs` (7), `pkg:@invana/graph` (353 incl. 20 new) | Green | F1–F8 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D-1 | Distortion lens or magnifier loupe? | distortion (G6) · loupe (R4) | distortion | accepted (2026-10-03) |
| D-2 | Where does the displacement live? | renderer override command (D1) · behaviour-only `moveShape`/`scaleShape` (R3) | renderer override | accepted (2026-10-03) |
| D-3 | Lens radius units | screen px · world units (G6) | screen px | accepted (2026-10-03) |
| D-4 | Wheel/drag adjust in v1 | modifier-gated wheel · none · drag | modifier-gated wheel (`alt` radius, `shift` distortion) | accepted (2026-10-03) |
| D-5 | Default `nodeScale` | `1.5` (more detail) · `1` (G6 parity, labels only) | `1.5`: "more detail" was the ask, and the falloff (D9) keeps the rim seamless | accepted (2026-10-03) |
| D-6 | Wheel interception mechanism | capture-phase DOM listener (D15) · teach `GestureArbiter` wheel ownership and have `WheelZoomBehaviour` yield | capture-phase listener: local to the behaviour; an arbiter wheel claim touches `pkg:@invana/canvas-core` + `WheelZoomBehaviour` for one consumer. Revisit if a second wheel-claiming behaviour appears | accepted (2026-10-03) |
| D-7 | Should `showText` beat `LabelCollisionBehaviour`'s hide inside the lens? | yes · no (respect collision) | yes: the lens spreads nodes apart, and its whole point is to read them | accepted (2026-10-03) |
| D-8 | Ship a story? | none (root rule 11) · `story:graph/Behaviours/Fisheye` on request | one story — requested ("write a single story too") → F18 | accepted (2026-10-03) |
| D-9 | Dragging a magnified node: where does it sit relative to the cursor? (V8) | **clear** (today, D12): lens clears on drag start, node snaps to logical and trails the cursor by its old offset · **freeze**: keep the overrides and skip recomputes while another owner holds the gesture, so the node stays under the cursor; recompute on release (one settle-jump then, smaller than today's) · **inverse-map**: drop the node so its *drawn* position under the lens equals the release point (invert the fisheye per node) | **freeze** — direct manipulation is the part users feel; D12's premise (lens offset feeding drag maths) does not hold, because `DragNodeBehaviour` is delta-based on the logical position. Inverse-map is exact but over-built for a transient lens | open |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-10-03 | Opened | proposed | Q1–Q4 answered in chat ("go with yours") → D-1…D-4 accepted; D-5…D-8 open |
| 2026-10-03 | Approved whole + one story ("ok write a single story too") | accepted | D-5…D-8 accepted with the recommendations |
| 2026-10-03 | F1–F13, F17, F18 implemented on `feat/fisheye-behaviour` | accepted | V1–V4, V6, V7, V10, V11, V13, V14 pass; V5, V9 skipped (not run); V12 pending; **V8 fails** → D-9 opened |
| 2026-10-03 | Implementation notes | accepted | (1) The headless double answers `getShapeWorldBounds` with `null`, so F2 records overrides instead. (2) The headless no-op overlay lacked three `IOverlayDevice` ops → F17. (3) The renderer's effect path overwrote `gfx.scale`; overridden hosts now compose effect × LOD × lens scale there, non-overridden hosts are byte-for-byte unchanged. (4) D12's "drag maths feedback" premise was wrong — see D-9 |
