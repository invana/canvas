---
id: feat-2026-10-04-labels-balloon-on-zoom-and-edge-labels-have-no-lod
type: feat
title: Node and edge labels each get a zoom LOD — a visibility band and an on-screen size, tuned separately
status: accepted
opened: 2026-10-04
decided: 2026-10-04
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/renderer-pixijs, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: relates-to, object: doc:docs/text-labels-plan.md }
  - { predicate: relates-to, object: doc:docs/renderer-split-design.md }
  - { predicate: relates-to, object: rfc:feat-2026-10-03-dense-regions-cannot-be-inspected-in-place }
  - { predicate: relates-to, object: doc:docs/node-styling-unification-plan.md }
  - { predicate: relates-to, object: doc:docs/large-graph-performance-plan.md }
---

**Summary:** Today a label's on-screen size is `fontSize × zoom`, with no control. Zoom in on a cluster and the labels balloon; zoom out and they become unreadable specks. Edge labels have no LOD behaviour at all. This RFC:

- replaces `sym:TextLODBehaviour` with **`NodeLabelLODBehaviour`** and adds **`EdgeLabelLODBehaviour`**. Each owns one label type's **visibility band** and **on-screen size** (`zoomGrowth`, `minFontPx`, `maxFontPx`), so node and edge labels are tuned separately;
- fixes three label-visibility defects found while scoping. One is confirmed in Storybook today.

Composite card text is **out of scope**: its size is never touched and its visibility behaves exactly as today.

| | |
|---|---|
| **What's missing** | Control over label size across zoom (M1, M2); any edge-label LOD (M3) |
| **What's broken today** | The per-style `labelMinZoom` / `labelMaxZoom` band flickers every frame or never comes back (M4, **confirmed** T1–T2). `TextLOD` and `LabelCollision` overwrite one flag (M5, by reading). Collision measures undrawn boxes (M6, by reading). 4 LOD behaviours are missing from the settings panel (M7) |
| **Defect rows** | F1–F4, F11. F1–F4 can ship ahead of the feature (D-8) |
| **Feature rows** | F5–F13 |
| **Scope review** | 14 ideas from the review report re-checked against "does the ask need it?": 4 rejected, 8 deferred, 2 kept (§2.4) |
| **Open decisions** | none — D-1 … D-8 accepted 2026-10-04 |

Row status: proposed 0 · accepted 0 · implemented 18 · landed 0 · deferred 6 · rejected 0 · superseded 0

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| M1 | No control over label **size**. On-screen size = `fontSize × zoom`, so zooming in on a cluster blows labels up to 48–100 px, and zooming out shrinks them to unreadable specks | `file:packages/renderer-pixijs/src/primitives/decorations/shape/LabelDecoration.ts#L184` (label placed in host-local world units, no scale) | No option on any behaviour or style changes it |
| M2 | Node labels become pixel-constant under `sym:NodeScaleLODBehaviour` **only by accident**: the label gfx is a child of the shape gfx, which that behaviour scales by `1/zoom`. Edge labels aren't, so on a size-LOD'd map node labels stay fixed while edge labels balloon | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1293` (`surface: shape.shape.gfx`) · `#L659-L668` (`scaleShape`) | Coupling is undocumented and can't be opted out of |
| M3 | No edge-label LOD behaviour. `sym:TextLODBehaviour`'s sweep visits nodes only; edge labels have only the per-style band (M4) | `file:packages/graph/src/behaviours/ContentLODBehaviour.ts#L205-L213` | `for (const node of this.layer.store.nodes())` |
| M4 | **Defect.** The per-style band (`NodeStyle/EdgeStyle.labelMinZoom/labelMaxZoom`, documented as "camera zoom") computes zoom as `effectiveScale(this.gfx)`, the product of `scale.x` up the parent chain. After the label hides itself with `removeChild`, it has no parent, so the product is `1`. A label with `maxZoom < 1` therefore never comes back; with `minZoom ≤ 1` it detaches and re-attaches every other frame; with `minZoom > 1` it never shows again. Under `NodeScaleLOD` the host's `1/zoom` also cancels the camera, so z ≈ 1 even while attached | `file:packages/renderer-pixijs/src/primitives/decorations/shape/LabelDecoration.ts#L202-L215`, `#L380-L388` · same in `file:packages/renderer-pixijs/src/primitives/decorations/connector/LabelConnectorDecoration.ts#L152-L170`, `#L197-L205` · doc promise `file:packages/graph/src/layer/types.ts#L1165-L1168`, `#L1309-L1312` | T1, T2 |
| M5 | **Defect.** `TextLOD` and `LabelCollision` write the **same** per-shape flag (`labelWanted`): `setShapeTextVisible` routes through `setDecorationVisible(id, 'label')`. Collision also caches `lastVisible` assuming it is the only writer, so (a) crossing up into the band re-shows collision-hidden labels and collision never re-hides them; (b) below the band, labels entering the viewport get `show=true` from collision, overriding TextLOD; (c) LOD-hidden labels still occupy the collision index and block visible ones | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L763-L769`, `#L2336-L2351` (flag `#L2346`) · `file:packages/renderer-pixijs/src/renderer/mounted/ShapeInstance.ts#L70-L77` · `file:packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L316-L350`, `#L386-L389` | By reading. Latent: no story enables both (V3 confirms) |
| M6 | **Defect.** `getDecorationWorldBounds` = `spec.x/y + gfx.position + localBounds`. It ignores the host's LOD scale (`gfxScale`), the fisheye drawn offset/scale, and any label scale. Collision therefore tests world-size boxes for labels that are drawn pixel-constant | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L2307-L2326` | By reading (V4 confirms). Blocks any label-size work |
| M7 | **Defect (root rule 12).** `TextLOD`, `IconLOD`, `ImageLOD`, `EdgeLOD` declare no `kind`, so `CanvasSettingsEditor` can't resolve them although their editors exist (`content-lod`, `edge-lod`) | `file:packages/canvas-ui/src/editor-panels/canvas-settings/registry.ts#L313-L317` | grep: no `readonly kind` in those four classes |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | Label size as a style field (`ShapeLabelStyle.zoomScale`, like `visibility`) | Rejected | Every label would pay a per-frame `tick`. There would be no on/off toggle and no editor. Per-element granularity isn't asked for |
| R2 | A behaviour that calls a per-id `setLabelScale(id, s)` every zoom frame (the `NodeScaleLOD` pattern) | Rejected | The behaviour would have to resolve each node's font size every frame (`resolveNodeStyle`) and re-derive the host scale. The renderer already holds both, so one policy push is less code (D4) |
| R3 | Make `NodeScaleLOD` stop scaling labels | Rejected | Changes how the map stories (`story:canvas-demos/by-casestudies/geo-air-routes/AirRoutes` etc.) look for no gain. Once configured, `NodeLabelLOD` takes over label size anyway (D-5) |
| R4 | One `LabelLODBehaviour` with `nodes: {…}` / `edges: {…}` sub-configs | Rejected | Nested config breaks the flat-options convention (`NodeCentralityBehaviour` is the reference), and node and edge labels couldn't be enabled independently |
| R5 | One global `setLODLevel(level)` | Rejected | Already revised away: G5 note in `doc:docs/renderer-split-design.md`. Per-element exemptions (`alwaysShowTop`) can't be expressed |

### Confirming test (M4)

| Test | Action | Result | Inference |
|------|--------|--------|-----------|
| T1 | Playwright, `story:graph/Nodes/Label/LODZoomRange` (top row: no band · middle row: `labelMinZoom 1.0` · bottom row: `labelMaxZoom 0.8`). Wheel-zoom 0.747 → 0.518 → 1.866 → 0.518 | First pass at 0.518: bottom row shows (correct). After 1.866 → 0.518: **bottom row stays hidden** | Once detached, z reads `1` > 0.8, so the label never re-attaches |
| T2 | Same story at zoom 0.518: 24 crops of the `in: circle` label at ~40 ms intervals | 12 crops show the label, 12 don't (two distinct hashes, alternating) | Detach → z = 1 ≥ 1.0 → re-attach → z = 0.518 → detach: the label flips every frame |

---

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D1 | **Two visibility channels per label, combined with AND.** The LOD channel `textWanted` is written only by `setShapeTextVisible` / new `setConnectorTextVisible`. The collision channel `labelWanted` is written only by `setDecorationVisible(id, 'label')`. Drawn = `showText` (fisheye force) ∨ (`textWanted` ∧ `labelWanted`) | M5 · `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L748-L752` (already ORs the fisheye force) | Each writer owns its flag, so collision's `lastVisible` cache is correct again. No reason enum and no new contract for shapes |
| D2 | The per-style band reads the **camera zoom** = `effectiveScale(hostSurface.parent)`, not `effectiveScale(this.gfx)` | M4 | Detaching the label no longer changes the reading; the host's LOD / fisheye scale no longer cancels it. Matches the documented promise |
| D3 | Label world bounds come from the **drawn** transform: `spec + drawnOffset + drawnScale × (gfx.position + gfx.scale × localBounds)` | M6 | Collision sees what is on screen, under NodeScaleLOD, fisheye and the new label scale |
| D4 | New contract type `LabelSizePolicy { zoomGrowth?, minFontPx?, maxFontPx? }` and `setLabelSizePolicy(target: 'shape' \| 'connector', policy \| null)`. A behaviour pushes it on enable / option change and pushes `null` on disable | R2 | The behaviour does **no per-frame work**; the renderer owns the maths it has the inputs for |
| D5 | Pure helper `resolveLabelScale({ fontSize, zoom, hostScale, policy, inside })` in `pkg:@invana/canvas-core`: `natural = fontSize × zoom × hostScale` (what's drawn today) · `target = zoomGrowth === undefined ? natural : fontSize × zoom^zoomGrowth` · `target = clamp(target, minFontPx, maxFontPx)` · `s = target / natural` · `inside-*` placements → `min(s, 1)` · `fontSize` is `text.fontSize` or `html-text.defaultFontSize` (default 12) — *corrected at implementation, see §8* | P5.5 precedent: geometry that a second backend would reuse lives engine-side | Unit-testable; a three.js backend reuses it |
| D6 | The renderer applies `s` to each `'label'` decoration of the matching target and **re-anchors** it: `position = anchor + s × align + offset`, so outside placements stay attached to the node's edge. It re-applies in `tickAnimations` when `camera.scale` or the policy changed since the last apply | `file:packages/renderer-pixijs/src/primitives/decorations/shape/LabelDecoration.ts#L184` · `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1667` | One transform write per label per zoom-changed frame, the same order of work as `NodeScaleLOD`'s per-node `scaleShape` |
| D7 | `hostScale` = the shape's `gfxScale` (LOD / hover). The fisheye **override** scale is excluded | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L659-L668` | NodeScaleLOD is cancelled, not double-counted. The lens still magnifies labels |
| D8 | `ContentLODBehaviour` gains a target hook (`'nodes'` default, `'edges'`): its crossing-gated band sweep iterates the chosen element set and calls the subclass toggle | M3 · `file:packages/graph/src/behaviours/ContentLODBehaviour.ts#L205-L213` | Edge labels reuse the band machinery; Icon/Image LOD are untouched |
| D9 | `NodeLabelLODBehaviour` = TextLOD (band + `alwaysShowTop`) + size options pushed as the `'shape'` policy. `EdgeLabelLODBehaviour` = band (edges) + size options pushed as the `'connector'` policy | — | One studio panel per label type; separate controls |
| D10 | **Every default is a no-op.** No band means always visible. `zoomGrowth`, `minFontPx` and `maxFontPx` all unset means the policy is `null` (label size untouched) | — | `TextLOD` callers migrate with identical output (D-4) |
| D11 | Composite card text: the band still hides it (through `setShapeTextVisible`, exactly as TextLOD does); the size policy reaches only `'label'` decorations | `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L379-L390` | Composite behaviour unchanged (V8 control) |
| D12 | Collision skips labels the LOD channel has hidden, via a read `isTextVisible(id)` | M5(c) | Exempt (`alwaysShowTop`) labels stop losing to invisible ones (D-6) |

### 2.1 Options (flat, serialisable)

| ID | Option | NodeLabelLOD | EdgeLabelLOD | Type | Default | Note |
|----|--------|:-:|:-:|------|---------|------|
| O1 | `targetLayerId` | ✅ | ✅ | `string` | required | Root rule 8 |
| O2 | `minZoom` / `maxZoom` | ✅ | ✅ | `number` | unbounded | Visibility band (camera zoom) |
| O3 | `alwaysShowTop` | ✅ | — | `number` ∈ [0, 1] | `0` | Unchanged from TextLOD |
| O4 | `zoomGrowth` | ✅ | ✅ | `number` ∈ [0, 1] | unset = follow the node (today) | `1` = grows with the world · `0.5` = √zoom · `0` = fixed screen size, keeping each label's own `fontSize` |
| O5 | `minFontPx` | ✅ | ✅ | `number` (CSS px) | unset | On-screen floor |
| O6 | `maxFontPx` | ✅ | ✅ | `number` (CSS px) | unset | On-screen cap — the "don't balloon" knob |

### 2.2 Examples

#### E1 — "labels shouldn't balloon when I zoom in" (the original ask)

```ts
import { NodeLabelLODBehaviour } from '@invana/graph';

canvas.behaviours.register(
  new NodeLabelLODBehaviour({
    id: 'node-labels',
    targetLayerId: 'graph',
    enabled: true,
    minFontPx: 10, // never smaller than 10px when zoomed out
    maxFontPx: 20, // never bigger than 20px when zoomed in
  }),
);
```

| Camera zoom | Node (radius 16) on screen | Label today (12px) | Label with E1 |
|---|---|---|---|
| 0.5 | 16 px | 6 px (unreadable) | **10 px** |
| 1 | 32 px | 12 px | 12 px |
| 1.5 | 48 px | 18 px | 18 px |
| 2 | 64 px | 24 px | **20 px** |
| 4 | 128 px | 48 px | **20 px** — label is now small relative to the node |

#### E2 — smooth damping instead of a hard cap

```ts
new NodeLabelLODBehaviour({ id: 'node-labels', targetLayerId: 'graph', enabled: true,
  zoomGrowth: 0.5, // grows with √zoom
  maxFontPx: 24,
});
```

| Camera zoom | today | E2 |
|---|---|---|
| 0.25 | 3 px | 6 px |
| 1 | 12 | 12 |
| 4 | 48 | 24 |
| 9 | 108 | 36 → **24** |

#### E3 — edge labels: appear later, stay small

```ts
import { EdgeLabelLODBehaviour } from '@invana/graph';

new EdgeLabelLODBehaviour({ id: 'edge-labels', targetLayerId: 'graph', enabled: true,
  minZoom: 1.2,  // hidden at overview, shown once you zoom in
  zoomGrowth: 0, // then a fixed screen size (its own fontSize, e.g. 10px)
});
```

With E1 and E3 together (node label 12px, edge label 10px):

| Camera zoom | Node labels | Edge labels |
|---|---|---|
| 0.5 | 10 px | hidden |
| 1 | 12 px | hidden |
| 1.5 | 18 px | 10 px |
| 4 | 20 px | 10 px |

#### E4 — map: pixel-constant nodes, and labels that match

```ts
canvas.behaviours.register(new NodeScaleLODBehaviour({ id: 'node-size', enabled: true,
  layers: [{ targetLayerId: 'graph', sizePx: 6 }] }));
canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'node-labels', targetLayerId: 'graph', enabled: true,
  zoomGrowth: 0, minZoom: 3 }));   // explicit now, not an accident of parenting (M2)
canvas.behaviours.register(new EdgeLabelLODBehaviour({ id: 'edge-labels', targetLayerId: 'graph', enabled: true,
  zoomGrowth: 0, minZoom: 6 }));   // edge labels match instead of ballooning
```

#### E5 — with label collision: more labels as you zoom in

```ts
new NodeLabelLODBehaviour({ id: 'node-labels', targetLayerId: 'graph', enabled: true, zoomGrowth: 0.5, maxFontPx: 18 });
new LabelCollisionBehaviour({ id: 'label-collision', targetLayerId: 'graph', enabled: true, prioritise: 'node-degree' });
```

- Today, world-scaled labels keep the same overlaps at every zoom (everything scales together), so collision changes nothing as you zoom.
- With `zoomGrowth < 1`, zooming in spreads labels apart, so the shown set **grows** as you zoom in. Needs F1, F2 and F11 (V6).

#### E6 — React

```tsx
<GraphCanvas data={data}>
  <NodeLabelLODBehaviour minZoom={0.6} alwaysShowTop={0.05} maxFontPx={20} />
  <EdgeLabelLODBehaviour minZoom={1.2} zoomGrowth={0.5} maxFontPx={12} />
</GraphCanvas>
```

#### E7 — migrating from `TextLODBehaviour` (no option changes)

```diff
- import { TextLODBehaviour } from '@invana/canvas-react';
+ import { NodeLabelLODBehaviour } from '@invana/canvas-react';
- <TextLODBehaviour id="text-lod" targetLayerId="graph" />
+ <NodeLabelLODBehaviour id="text-lod" targetLayerId="graph" />
```

- Keep the `id`: view state is keyed by behaviour id (`file:packages/canvas-core/src/state/view/CanvasView.ts#L31`), so saved definitions still apply.

#### E8 — live tuning (settings editor / studio path)

```ts
canvas.update({ behaviours: { 'node-labels': { maxFontPx: 16 } } }); // → setOptions → new policy, no remount
canvas.update({ behaviours: { 'edge-labels': { enabled: false } } }); // → policy null, edge labels back to world size
```

### 2.3 Node labels vs edge labels

| Concern | Node labels | Edge labels |
|---|---|---|
| Size | O4–O6. Scaled from the edge that touches the node, so they stay attached | O4–O6, separate values. Scaled about their centre on the path |
| `inside-*` placements | Shrink only (`s ≤ 1`): the fit-to-box rule can't grow | n/a |
| Band | O2 | O2 — usually a higher `minZoom` than nodes |
| Exemption | `alwaysShowTop` (degree) | none in v1 (X8) |
| Collision | group `nodes` | group `edges` (already separate) |
| Composite card text | band only, size untouched (D11) | — |

### 2.4 Scope review — is this over-engineered?

Every idea from the review report was re-checked against one question: *does the ask (node/edge labels sized and gated by zoom, composite out) need it?*

| ID | Earlier idea | Verdict | Why |
|----|--------------|---------|-----|
| X1 | Reason-enum visibility API `setLabelVisible(id, visible, reason)` | **rejected** → D1 | Two writers need two flags, not a taxonomy. The fisheye force already exists. Shapes need no contract change |
| X2 | Shared `ZoomLODBehaviour` base for all LODs | **deferred** (F22) | 5 copies of ~30 lines. Unifying them touches every LOD and `api/canvas.surface.txt` for no user-visible change. Revisit when a 6th zoom-driven behaviour lands |
| X3 | Per-label raster-resolution tiers | **deferred** (F18) | With `zoomGrowth < 1`, labels get re-rasterised at higher resolution than needed: wasted memory, never blurry. Revisit if a story shows GPU pressure |
| X4 | Stop edge labels re-sampling their path every frame | **deferred** (F19) | Real, but independent of zoom size — its own fix RFC |
| X5 | Cosmetic renames (`NodeScale→NodeSize`, `EdgeScale→EdgeSize`, `Icon→NodeIcon`, `Image→NodeImage`, `EdgeLOD→EdgeThinning`, `label-resolution-lod→text-resolution-lod`) | **deferred** (F21) | ~60 files and a published-API break for zero behaviour change. F4's kinds use the **existing** class names, so class and kind already match |
| X6 | Flatten `layers[]` on the size LODs | **deferred** (F21) | An API break for consistency only |
| X7 | Delete the dead `EdgeScaleLOD.strokeWidthPx` | **deferred** (F21) | Unrelated to labels; trivial chore |
| X8 | `EdgeLabelLOD.keepActive` (hovered/selected edges keep their label) | **rejected** | Couples the LOD to interaction state. The base's `isNodeExempt` hook is where it would go if asked |
| X9 | `EdgeLabelLOD.maxLengthRatio` (hide labels longer than their edge) | **deferred** (F20) | Needs a per-edge length cache and a label-width read. Ship size + band first; add it when a story shows spill |
| X10 | `referenceZoom` option | **rejected** | "Zoom 1 = authored size" is the convention everywhere else; one fewer knob |
| X11 | `LabelCollision` `nodeLabels` / `edgeLabels` toggles | **rejected** | Collision groups already separate them; per-element `labelCollisionGroup` / `forceShow` cover the rest |
| X12 | Viewport-budgeted size sweep | **deferred** (F23) | One transform write per label per zoom-changed frame is cheap; V9 decides |
| X13 | Renderer-level size policy vs a per-id command | **kept** (D4) | The behaviour does zero per-frame work, and only the renderer has `fontSize` + host scale + camera |
| X14 | Rename `TextLOD → NodeLabelLOD` | **kept** (D-2) | Its scope changes (it gains size) and it needs an edge sibling. The one rename that pays for itself |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|-----|----------|--------|---------------|
| `doc:docs/text-labels-plan.md` | relates-to | design of record for label decorations | 13 placements, per-label `visibility` band (fixed here, D2), collision groups |
| `doc:docs/renderer-split-design.md` (G5 note) | relates-to | revised | LOD stays per-element commands, never spec writes. D4 adds one policy command in the same group |
| `rfc:feat-2026-10-03-dense-regions-cannot-be-inspected-in-place` | relates-to | accepted | Its D5 (`showText` beats LOD/collision) is kept. D1 splits the single flag it stored into two channels; the force semantics are unchanged |
| `doc:docs/node-styling-unification-plan.md` | relates-to | plan | Composite content-LOD is its phase 6. This RFC deliberately leaves composite text alone (D11) |
| yFiles `ZoomInvariantLabelStyle` (external) | relates-to | shipped upstream | World size vs fixed screen size around a threshold. O5/O6 express the same idea |
| G6 v5 `fix-element-size` behaviour (external) | relates-to | shipped upstream | Label font kept fixed while zooming out, as a behaviour |
| sigma.js (external) | relates-to | shipped upstream | Fixed-px labels; size ≈ √zoom elsewhere. `zoomGrowth: 0.5` is a familiar setting |
| Cytoscape `min-zoomed-font-size` (external) | relates-to | shipped upstream | Hide by on-screen size — a possible later O-row, not v1 |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L748-L769`, `#L2336-L2351` | `setShapeTextVisible` writes only `textWanted` and stops routing through `setDecorationVisible`. Label drawn = `showText ∨ (textWanted ∧ labelWanted)` (D1) | TextLOD and collision stop overwriting each other (M5 a, b) | **medium**: changes how two shipped commands store state; fisheye D5 depends on it | — |
| F2 | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L2307-L2326` | Bounds from the drawn transform (D3) | Collision correct under NodeScaleLOD / fisheye / label scale (M6) | **medium**: changes which labels collision shows in any story that scales hosts | — |
| F3 | defect | implemented | `file:packages/renderer-pixijs/src/primitives/decorations/shape/LabelDecoration.ts#L202-L215`, `file:packages/renderer-pixijs/src/primitives/decorations/connector/LabelConnectorDecoration.ts#L152-L170` | The band reads `effectiveScale(hostSurface.parent)` (D2) | No flicker; labels come back; correct under NodeScaleLOD (M4) | **medium**: visibly changes 6 stories (C3), all toward the documented behaviour | — |
| F4 | defect | implemented | `TextLOD` (via F9), `IconLOD`, `ImageLOD`, `EdgeLOD` + `file:packages/canvas-ui/src/editor-panels/canvas-settings/registry.ts#L313-L317` | `kind` = `'icon-lod'`, `'image-lod'`, `'edge-lod'` (matching the class names) + registry rows with the existing `content-lod` / `edge-lod` editors; typeLabel "Edge Thinning LOD" | Rule 12 compliance (M7) | low | — |
| F5 | feat | implemented | `file:packages/canvas-core/src/contracts/IElementRenderer.ts#L124-L129` · `file:packages/renderer-pixijs/src/renderer/mounted/ConnectorInstance.ts` · `file:packages/canvas-core/src/headless/HeadlessRenderer.ts#L131` | `setConnectorTextVisible(id, visible)`; connector labels use the same two-channel AND (D1) | Edge labels get a LOD channel separate from collision | **medium**: public contract every backend implements | F1 |
| F6 | feat | implemented | `file:packages/canvas-core/src/contracts/IElementRenderer.ts` · new `sym:LabelSizePolicy`, `sym:resolveLabelScale` in `pkg:@invana/canvas-core` · headless | Type + `setLabelSizePolicy(target, policy \| null)` + pure helper (D4, D5); headless records the policy | The seam | **medium**: public contract + new export | — |
| F7 | feat | implemented | `file:packages/renderer-pixijs/src/primitives/decorations/shape/LabelDecoration.ts#L184` · `LabelConnectorDecoration.ts` · `PrimitivesRenderer.tickAnimations` `#L1667` | Store the anchor/align from `repaint`; `applyScale(s)` re-anchors; the renderer re-applies when `camera.scale` or the policy changed (D6, D7) | Labels sized per the policy and still attached | **high**: on the per-frame path of every label; with the policy `null` it must be byte-for-byte today's behaviour (V1) | F6 |
| F8 | feat | implemented | `file:packages/graph/src/behaviours/ContentLODBehaviour.ts#L205-L213` | Target hook `'nodes' \| 'edges'` for the band sweep (D8) | Edge band reuses the machinery | low | — |
| F9 | feat | implemented | `file:packages/graph/src/behaviours/TextLODBehaviour.ts` → `NodeLabelLODBehaviour.ts`; `behaviours/index.ts`, `src/index.ts` | Rename (no shim); `kind = 'node-label-lod'`; add O4–O6; push the `'shape'` policy on enable / `setOptions`, `null` on disable | The node half | **medium**: published class rename in `@invana/graph` | F6, F8 |
| F10 | feat | implemented | new `file:packages/graph/src/behaviours/EdgeLabelLODBehaviour.ts` | `kind = 'edge-label-lod'`; band over edges via `setConnectorTextVisible`; O4–O6 → `'connector'` policy | The edge half | low | F5, F6, F8 |
| F11 | defect | implemented | `file:packages/canvas-core/src/contracts/IElementRenderer.ts` · `file:packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L316-L350` | `isTextVisible(id)` read; collision skips LOD-hidden labels (D12) | M5(c): invisible labels stop blocking visible ones | low | F1, F5 |
| F12 | feat | implemented | `file:packages/canvas-react/src/behaviours/TextLODBehaviour.tsx` → `NodeLabelLODBehaviour.tsx`; new `EdgeLabelLODBehaviour.tsx`; `src/index.ts` | Null-rendering wrappers; default ids `'node-label-lod'` / `'edge-label-lod'` | E6 | low | F9, F10 |
| F13 | feat | implemented | `file:packages/canvas-ui/src/editors/behaviours/content-lod/` (+ size fields) · new `editors/behaviours/edge-label-lod/` · `registry.ts` | `fields.ts` + `mapping.ts` + panel for O1–O6; registry rows `'node-label-lod'`, `'edge-label-lod'` (rule 12) | Editable in `GraphCanvasApp` / studio | low | F9, F10 |
| F14 | feat | implemented | `api/canvas-core.surface.txt`, `api/canvas.surface.txt` | Regenerate (`pnpm build && node scripts/check-api-surface.mjs --write`) | `check-api-surface` green | low | F6 |
| F15 | feat | implemented | `file:packages/canvas-core/tests/` (helper) · `file:packages/graph/tests/behaviours/` (headless) | `resolveLabelScale` table tests (§2.2 numbers); NodeLabel/EdgeLabel LOD push / clear the policy and sweep the right element set | V5, V7 | low | F6, F9, F10 |
| F16 | feat | implemented | `story:canvas-demos/by-casestudies/workflow/WorkflowPlan` · `story:canvas-demos/by-casestudies/global-model/GlobalModel` · `story:graph/Behaviours/Fisheye` | Mechanical rename `TextLODBehaviour → NodeLabelLODBehaviour` (E7). **Needs explicit OK (root rule 11, D-7)** | Stories compile after F9 | low | F9 |
| F17 | dressing | implemented | `roadmap.md` § behaviours | Rows for Node / Edge label LOD (🚧 → ✅ on landing) | Status visible | low | F9, F10 |
| F18 | feat | deferred | `sym:TextResolutionLODBehaviour` · `setLabelsResolution` | Tier per label from its on-screen scale (X3) | No over-rasterising of fixed-size labels | medium | Unblocked by GPU-memory pressure shown in a story |
| F19 | defect | deferred | `file:packages/renderer-pixijs/src/primitives/decorations/connector/LabelConnectorDecoration.ts#L155`, `#L177` | Re-sample the path only on path / zoom change (X4) | Static graphs stop paying per frame | medium | Own fix RFC |
| F20 | feat | deferred | `EdgeLabelLODBehaviour` | `maxLengthRatio` fit-to-edge (X9) | Short edges stop spilling labels | low | A story showing spill |
| F21 | dressing | deferred | size LODs, Icon/Image/EdgeLOD, TextResolution kind | Cosmetic renames, flatten `layers[]`, drop dead option (X5–X7) | Naming consistency | medium (API break) | One chore RFC, if wanted |
| F22 | dressing | deferred | `pkg:@invana/canvas` + all LODs | Shared `ZoomLODBehaviour` base (X2) | Less duplication | medium | A 6th zoom-driven behaviour |
| F23 | feat | implemented | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts` (`tickLabelSizes`, `sizeShapeLabel`, `sizeConnectorLabel`, `setShapeTextVisible`, `setConnectorTextVisible`, `setShapeDisplayOverride`) | Size what is drawn and on screen. (1) Under a policy, labels the text LOD hides are skipped and sized when shown (LOD show, or a lens forcing `showText`); collision-hidden labels are still sized — collision measures them. (2) A zoom frame sizes only labels whose node / path ends sit in the viewport (grown 10% a side) and queues the rest; frames where the zoom holds still keep the on-screen set current and size 1 000 queued labels. A cleared policy still sweeps every label | Per-frame cost follows what is visible, not graph size (V9, V17). Off-screen labels converge within ~10 still frames | medium: on the per-frame path; raster export taken mid-catch-up could show an off-screen label at its previous size (converges in ~10 frames) | V9 over budget — trigger met 2026-10-04 |
| F24 | dressing | implemented | `file:apps/storybook/stories/graph/Nodes/Label/LabelZoomSize.stories.ts` (`story:graph/Nodes/Label/LabelZoomSize`) | Verification story (D-7b): 15 hard-coded nodes / 15 labelled edges, `NodeLabelLOD` + `EdgeLabelLOD` + `LabelCollision` + `NodeScaleLOD` toggle, every option in lil-gui through `canvas.update` | Live surface for V3, V4, V6 | low | F9, F10 |
| F25 | defect | implemented | `file:packages/canvas-ui/src/editors/behaviours/content-lod/mapping.ts` · `types.ts` · `fields.ts` · `file:packages/canvas-ui/src/editor-panels/canvas-settings/registry.ts` · `file:packages/graph/src/behaviours/labelSize.ts` · `file:packages/graph/src/behaviours/ContentLODBehaviour.ts` | `null` = unset end to end (the fisheye `maxRadius` convention). `formToOptions`: cleared `maxZoom` (`0`) → `null`. New `labelLodOptionsToForm` / `labelLodFormToOptions` for the node/edge label rows (D-9): form-only `sizeLabels` switch — off sends `zoomGrowth`/`minFontPx`/`maxFontPx` as `null` (no policy), on passes them through with a cleared (`0`) font bound → `null`. `labelSizePolicyOf` treats `null` / `≤ 0` font bounds as unset; `inBand` treats `null` as unbounded. Icon/Image LOD keep the plain band mapping | The editor can clear a cap, a bound, or the whole policy; "fixed size" (`zoomGrowth 0`) stays reachable. Before: a cleared field became `0` and the old cap silently stayed | low (option types widen to `number \| null`; new canvas-ui exports `labelLODOptionsToForm` / `labelLODFormToOptions`) | F13 |
| F26 | defect | implemented | `file:packages/graph/src/behaviours/ContentLODBehaviour.ts` (`onRegister` / `onDestroy`) | **One content-LOD per (target layer, `kind`)** (D-10 A). A per-layer claim (`WeakMap<GraphLayer, Map<kind, id>>`) is taken in `onRegister` and released in `onDestroy`. A second instance of the same kind on the same layer throws: `NodeLabelLODBehaviour "b": layer "graph" already has node-label-lod "a" — one per layer; put the band and size options on "a"`. Different kinds (node + edge labels, icon + image) and different layers are unaffected | Removes the conflict class: two instances fought over one visibility channel (last sweep wins, order-dependent), a size-less instance pushed `null` over the other's size policy on every layout tick, and disabling either one cleared both. Applies to all four subclasses (Node/Edge label, Icon, Image) — each channel has exactly one writer class | low: no story or package registers two of one kind (scan 2026-10-04) | F8 |
| F27 | defect | implemented | `file:packages/canvas-core/src/abstracts/registries/BehaviourRegistry.ts#L45-L52` (`register`) | If `wire()` throws, delete the map entry before rethrowing | A rejected behaviour (F26, or the existing "layer not found" throw) no longer lingers in `canvas.behaviours.list()`, so the settings panel doesn't show a dead row and the id can be reused | **medium**: the registration path of every behaviour; only changes anything when `register` throws | — |
| F28 | dressing | implemented | `file:apps/storybook/stories/graph/Behaviours/Fisheye.stories.ts` (`story:graph/Behaviours/Fisheye`) | Rename the instance id `'text-lod'` → `'node-labels'`. Start with `minZoom 1.8` + `zoomGrowth 0.5`, `maxFontPx 16`. Replace the single "text LOD" toggle with a lil-gui **Node labels** folder (on, min zoom, size labels, zoom growth, min/max font) writing through `canvas.update`. Header comment explains band + size + lens | Live surface for V8 (lens over a size policy). **Story edit — asked for 2026-10-04 ("add the NodeLabelLODBehaviour to the fisheye story")** | low | — |
| F29 | feat | implemented | `file:packages/graph/tests/behaviours/labelLOD.test.ts` · `file:packages/canvas-core/tests/` | Headless: duplicate kind on one layer throws and leaves the first working; node + edge on one layer OK; same kind on two layers OK; unregister releases the claim (re-register succeeds); a throwing `register` leaves no registry entry | V13–V15 | low | F26, F27 |
| F30 | dressing | implemented | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts` | Cleanup ("clean up any code implementation that we over engineered"): drop the duck-typed `SizableLabel` interface + `asSizableLabel` (an opt-in seam for custom label kinds nobody has) for `instanceof LabelDecoration` / `LabelConnectorDecoration` | Less code; monomorphic hot path | low | — |
| F31 | dressing | implemented | `file:packages/renderer-pixijs/src/primitives/decorations/connector/LabelConnectorDecoration.ts` | Drop `isContained()` (always `false`; existed only for F30's interface) | — | low | F30 |
| F32 | dressing | implemented | `file:packages/canvas-core/src/lib/geometry/labels/labelScale.ts` · `api/*.surface.txt` | `resolveLabelScale(fontSize, zoom, hostScale, policy, contained?)` positional; `sym:LabelScaleInput` removed (no per-label allocation on the zoom path) | One fewer public type | low (published API of this unlanded branch only; snapshots regenerated) | — |
| F33 | dressing | implemented | `file:packages/graph/src/behaviours/ContentLODBehaviour.ts` | `abstract override readonly kind: string` replaces the `kind ?? constructor.name` fallback in the F26 claim — every subclass already declares it | The type system enforces the claim key | low | F26 |
| F34 | dressing | implemented | `file:packages/canvas-ui/src/index.ts` · `content-lod/index.ts` | Stop exporting the `labelSizeFields` fragment (already composed into `nodeLabelLODFields` / `edgeLabelLODFields`) | Smaller surface | low | F25 |

---

## 5. Blast radius

### Upstream (what this depends on)

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | Pixi `removeChild` nulls `parent` | The M4 cause; D2 reads from `hostSurface.parent` instead | Low: stable pixi semantics |
| U2 | `this.camera.scale` readable in `tickAnimations` | D6 change detection | Low: already used by `tickLabelRasterise` (`#L1713`) |
| U3 | `ShapeInstance.gfxScale` vs `displayOverride.scale` split (fisheye RFC) | D7 counts one and excludes the other | Medium: if a future writer folds the lens into `gfxScale`, labels would cancel the lens |
| U4 | `labelContent` default `fontSize ?? 12` | D5's `fontSize` input | Low |

### Downstream (who could break)

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| C1 | `sym:HeadlessElementRenderer` + any third-party `IElementRenderer` | published contract | 3 new methods (`setConnectorTextVisible`, `setLabelSizePolicy`, `isTextVisible`) | Headless in F5/F6/F11; third parties get a type error (intended, pre-1.0) |
| C2 | `sym:TextLODBehaviour` importers: `pkg:@invana/graph` barrels, `pkg:@invana/canvas-react` wrapper + index, `pkg:@invana/canvas-ui` `content-lod` editor (types/fields/panel) + index | published API | Class renamed, no shim | F9, F12, F13 |
| C3 | Stories using the per-style band: `story:graph/Nodes/Label/LODZoomRange`, `story:canvas-demos/by-casestudies/geo-air-routes/AirRoutes` (`labelMinZoom 3` under NodeScaleLOD: today likely never shows), `story:canvas-demos/by-casestudies/rag-embeddings/EmbeddingExplorer` (`1.5`: likely never returns), `story:canvas-demos/by-casestudies/code-kg/DotsForce` (`0.6`), `story:canvas-demos/by-casestudies/citations/CitationGraph` (`0.6`), `story:designs/NetworkMap` (`0.55`): the last three flicker below their threshold today | visual | **Look changes** — toward the documented behaviour | V2 on `LODZoomRange`; eyeball the other five |
| C4 | Collision stories: `story:graph/Behaviours/LabelCollision`, `story:graph/Nodes/Label/CollisionPriority`, `story:canvas-demos/by-casestudies/citations/CitationGraph`, `story:designs/NetworkMap` | visual | Identical unless hosts are scaled (none of these use NodeScaleLOD / fisheye) | V1 control |
| C5 | `sym:FisheyeBehaviour` | behaviour | `showText` force kept; labels of lensed nodes still magnify (D7) | V8 |
| C6 | TextLOD stories (F16) | story source | Import rename only | D-7 |
| C7 | `api/canvas-core.surface.txt`, `api/canvas.surface.txt` | snapshot | New `LabelSizePolicy`, `resolveLabelScale` | F14 |
| C8 | Raster export (`file:packages/canvas/src/io/imageExport.ts`) | io | Captures labels as drawn (sized) — WYSIWYG. SVG/state export use specs, so labels come out at world size | TSDoc note; none |
| C9 | `docs/` plans naming TextLOD: `doc:docs/render-planes-and-emphasis-plan.md`, `doc:docs/renderer-split-design.md`, `doc:docs/large-graph-load-pipeline-plan.md`, `doc:docs/large-graph-performance-plan.md` | docs | Stale class name | Rename mentions in plans; RFCs untouched (history) |
| C10 | Any consumer registering two content-LODs of one kind on one layer (none in-repo, scan 2026-10-04: `story:graph/Nodes/Label/LabelZoomSize` has one node + one edge, allowed) | published behaviour | `register` now throws (F26) | Merge into one instance |
| C11 | `sym:BehaviourRegistry` callers that catch a `register` throw and then read `list()` (none known) | engine | Rejected behaviour no longer listed (F27) | None |
| C12 | `story:graph/Behaviours/Fisheye` | story source + look | Instance id + defaults + panel folder (F28); labels hold 16 px max outside the lens | Eyeball |
| C13 | `sym:resolveLabelScale` / `sym:LabelScaleInput` (`pkg:@invana/canvas-core`, re-exported by `pkg:@invana/canvas`) | published API (unlanded) | Positional signature; type removed (F32) | Snapshots regenerated; no other caller |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | **Control.** Playwright smoke with no label LOD registered | `story:graph-layouts/d3-force/LesMiserables`, `story:graph/Behaviours/LabelCollision`, `story:graph/Nodes/Label/LODZoomRange` (top row) | Renders as on `main`; no console errors. **2026-10-04:** smoke only (Playwright screenshots, no console/page errors), not pixel-diffed against `main` | F1, F2, F7 |
| V2 | pass | Re-run T1 + T2 | `story:graph/Nodes/Label/LODZoomRange` | Bottom row reappears after zooming in then out; 24/24 samples hide the middle row at 0.518. **2026-10-04:** both hold (24/24 identical hidden crops; bottom row back at 0.518 after 1.866) | F3 |
| V3 | pass | TextLOD band + LabelCollision, zoom across the band both ways | Verification story (D-7) | No overlapping label reappears; no hidden label pops in. **2026-10-04:** band `minZoom 1` at fit 1.436 → 0.575 (all node labels hidden, none popped in) → 1.436 (same shown set as before, collision-hidden labels stayed hidden) | F1, F11 |
| V4 | pass | LabelCollision + NodeScaleLOD at zoom 0.3 / 1 / 5 | Verification story | Shown set matches the visible overlaps. **2026-10-04:** eyeballed at zoom 0.42 and 3.59 with node-size LOD on — no visible overlaps among shown labels; not asserted numerically | F2 |
| V5 | pass | Unit: `resolveLabelScale` reproduces the §2.2 E1 / E2 tables; `inside-*` clamps at 1; `undefined` policy → 1 | `pkg:@invana/canvas-core` tests | Exact values. **2026-10-04:** 7 tests, `file:packages/canvas-core/tests/lib/labelScale.test.ts` | F6 |
| V6 | pass | E5 in the browser: count of shown labels at zoom 1 vs 3 | Verification story | Rises with zoom (constant today). **2026-10-04:** qualitative — 9 of 15 node labels at 0.42 (floor 9px, collision on), every in-view label at 3.59 | F2, F7, F9 |
| V7 | pass | Headless: NodeLabel / EdgeLabel LOD push the policy on enable / `setOptions`, `null` on disable; the band sweeps nodes vs edges | `pkg:@invana/graph` tests | As specified. **2026-10-04:** 8 tests in `file:packages/graph/tests/behaviours/labelLOD.test.ts` + 2 `getOptions` cases | F8–F10 |
| V8 | pass | **Control.** Composite card text size at zoom 4 with vs without NodeLabelLOD; fisheye still magnifies labels with `zoomGrowth: 0` | `story:graph/Behaviours/Fisheye` + a composite story | Identical card text; lens labels magnified. **2026-10-04 (Playwright, behaviours registered at runtime):** `story:canvas-demos/SimpleAndCompositeNodes` at zoom 3 — composite card text identical with vs without `NodeLabelLOD { zoomGrowth: 0, maxFontPx: 10 }` while the simple node label shrank to the cap; `story:canvas-demos/tools/GraphVisualiser` (Les Mis) with `NodeLabelLOD { zoomGrowth: 0, maxFontPx: 9 }` + `FisheyeBehaviour` — lens labels magnified, outside labels at the cap | D11, D7 |
| V9 | pass | Perf: 5k labelled nodes + 5k edge labels, continuous wheel zoom, policy on vs off | Verification story / Chrome trace | Label scaling ≤ 1 ms/frame; else F23. **Re-scoped by D-11:** ≤ 1 ms for a band or a zoomed-in view (V17); every label on screen at once with no band is a documented limit. **2026-10-04:** 5 000 node + 5 000 edge labels mounted (generated data loaded into `story:canvas-demos/tools/GraphVisualiser` at runtime), 60 wheel steps, `tickLabelSizes` timed in-page: policy **off** 0.1 ms per sweep (only on policy pushes); policy **on** (`zoomGrowth .5`, 9–18 px, both targets) **2.9–3.4 ms mean, 3.8 ms max per zoom frame**. Headless Chromium + SwiftShader, so total frame time (~130 ms) is not meaningful; the sweep is pure CPU. Over budget → F23 | F7 |
| V10 | pass | `pnpm check-types` · `pnpm lint` (`check-boundaries`, `check-api-surface`) · `pnpm build` · package tests | repo | Green. **2026-10-04:** `check-types` (all 22 packages), `lint` (0 errors; no new warnings in changed files), `check-boundaries`, `check-api-surface` (after F14), package builds, tests (core 174, renderer-pixijs 12, graph 363) | F1–F16 |
| V11 | pass | `CanvasSettingsEditor` shows Node labels / Edge labels / Icon / Image / Edge Thinning sections; editing `maxFontPx` applies live | `GraphCanvasApp` host | No remount; sizes update. **2026-10-04:** `story:canvas-demos/by-casestudies/paper-citations/CitationNetwork` (has the panel), all five LOD behaviours registered at runtime → rows "Node Label LOD", "Edge Label LOD", "Icon LOD", "Image LOD", "Edge Thinning LOD", none "no editor". Typing `maxFontPx` 18 → 30 in the form: same instance, `getOptions().maxFontPx` 30, renderer `shape` policy 30. **Clearing** the field wrote `0`, not unset → F25 | F4, F13 |
| V12 | pass | Clear / switch in the settings editor, then headless | `story:canvas-demos/by-casestudies/paper-citations/CitationNetwork` · `file:packages/graph/tests/behaviours/labelLOD.test.ts` | Cleared bound → no bound; switch off → no policy; switch on → restored. **2026-10-04:** browser — clear Max font → `maxFontPx null`, policy `{zoomGrowth .5, minFontPx 9}`; Max zoom 2 → cleared → `null`; switch off → all three `null`, policy `null`; on → restored; same instance throughout. Headless — 2 new tests (null / ≤ 0 font bounds, null band bound); graph 365/365, `check-types`, `lint` green | F25 |
| V13 | pass | Duplicate kind rejected; first keeps working | `pkg:@invana/graph` tests | Second `NodeLabelLOD` on `graph` throws; first's band + policy unaffected; node + edge OK; two layers OK; unregister → re-register OK  **2026-10-04:** 3 tests in `file:packages/graph/tests/behaviours/labelLOD.test.ts` (graph 368/368) | F26, F29 |
| V14 | pass | Registry rollback | `pkg:@invana/canvas-core` tests | A behaviour whose `onRegister` throws is absent from `list()` and its id can be registered again  **2026-10-04:** 2 tests in `file:packages/canvas-core/tests/registries/BehaviourRegistry.test.ts` — `register` and the deferred `registerAll` path (core 176/176) | F27, F29 |
| V15 | pass | Fisheye story: band + size + lens, panel folder live | `story:graph/Behaviours/Fisheye` (Playwright) | Labels capped at 16 px outside, magnified in the lens; folder edits apply without remount; no console errors  **2026-10-04:** Playwright — zoomed past 1.8: labels held ≈16 px; "size labels" off → labels balloon with the world; lens over a cluster magnifies its labels past the cap; no console errors | F28, V8 |
| V16 | pass | `pnpm check-types` · `pnpm lint` · package tests | repo | Green  **2026-10-04:** `check-types`, `lint` (0 errors; boundaries, API surfaces unchanged, node-import), tests core 176 · graph 368 · renderer-pixijs 12 | F26–F29 |
| V17 | pass | Perf after F23, realistic setups | Same 5k + 5k harness as V9 | ≤ 1 ms per zoom frame. **2026-10-04:** zoomed in (~2×) 0.44 ms mean / 0.7 ms max; band hiding labels (zoomed out) 0.1 ms; zoomed in + band 0.44 / 0.8 ms. All-visible zoomed out still 1.2 mean / 3.7 max → D-11 | F23 |
| V18 | pass | F23 correctness: labels shown mid-zoom and panned in right after a zoom are at the current size | `story:graph/Behaviours/Fisheye` (Playwright) | Uniform label sizes. **2026-10-04:** wheel across the 1.8 band, then an immediate drag-pan — every visible label at the capped size, no console errors | F23 |
| V19 | pass | Repo green after F23 + F30–F34 | repo | **2026-10-04:** `pnpm build`, `check-types` (19/19), `lint` (0 errors; boundaries, API surfaces after `--write`, node-import), tests core 176 · graph 368 · renderer-pixijs 12 | F23, F30–F34 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D-1 | Split label LOD by **target** (node / edge) or by **axis** (keep TextLOD for visibility, add a `LabelSizeLOD`)? | target-first · axis-first | **Target-first**: one panel per label type, separate controls come for free, band and size live together | accepted (2026-10-04) |
| D-2 | Rename `TextLOD → NodeLabelLOD`, or keep `TextLOD` and add `EdgeLabelLOD` beside it? | rename (no shim) · keep | **Rename**: its scope changes and it needs a sibling. Cost: 13 src files + 3 stories (F16) | accepted (2026-10-04) |
| D-3 | Does NodeLabelLOD's band keep hiding composite card text? | keep (as TextLOD) · labels only | **Keep**: "composite out of scope" = don't change it | accepted (2026-10-04) |
| D-4 | Default label size when O4–O6 are unset | follow the node (today) · `zoomGrowth: 1` | **Follow the node**: migration changes nothing; NodeScaleLOD maps keep pixel-constant labels | accepted (2026-10-04) |
| D-5 | Once O4–O6 are set, does label size ignore NodeScaleLOD's host scale? | yes (label behaviour owns label size) · no (multiply) | **Yes**: one owner per property; E4 shows the explicit setup | accepted (2026-10-04) |
| D-6 | Include F11 (collision skips LOD-hidden labels; adds `isTextVisible`)? | include · defer | **Include**: without it `alwaysShowTop` labels lose to invisible ones | accepted (2026-10-04) |
| D-7 | Stories (root rule 11): (a) the import rename in 3 stories; (b) one new verification story `graph/Nodes/Label/LabelZoomSize` (E1 + E3 + collision toggles in lil-gui) | (a) yes/no · (b) yes/no | **(a) yes**, forced by D-2. **(b) yes**: V3, V4, V6, V9 need a live surface, and imperative stories expose no canvas handle | accepted (2026-10-04) |
| D-8 | Land the defects (F1–F4) ahead of the feature? | ahead · together | **Ahead**: independently shippable; F3 is visible today | accepted (2026-10-04) |
| D-9 | How does the label editor say "leave label size alone", when the forms number field cannot be blank and `zoomGrowth 0` means "fixed size"? | A: form-only "Size labels on zoom" switch · B: `zoomGrowth 0` = unset · C: leave it | **A**: explicit, keeps "fixed size" reachable; B loses the headline use case, C leaves no way to clear the policy | accepted (2026-10-04, "up to u") |
| D-10 | What happens when two content-LODs of the same kind target the same layer? | **A**: one per (layer, kind), the second throws · **B**: compose — visibility = AND of every instance, one size-policy owner (a second with size options throws) · **C**: dev warning only | **A**. B needs a per-layer coordinator plus a renderer-side policy owner, and still has to reject a second size owner; band-and-size on one instance already expresses everything two instances could (AND of two bands = their intersection). C leaves the silent fight in place. Throwing matches the registry's duplicate-id rule | accepted (2026-10-04, "ok") |
| D-11 | V9's all-visible case — no band, zoomed out, 10 000 labels drawn at once — still costs ~3.7 ms per zoom frame after F23 (the per-label pixi transform write is the floor). Accept as a known limit, or keep F17 from landing? | accept (document on `setLabelSizePolicy` + roadmap) · pursue (bitmap-text labels / GPU-side scaling — its own RFC) | **Accept**: 10 000 simultaneously drawn labels are unreadable; every realistic setup (a band, or zoomed in) is ≤ 0.8 ms (V17) | accepted (2026-10-04, "ok go a head") |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-10-04 | Review report written (LOD family inventory, 11 findings) | — | Scratchpad `text-and-shape-lod-review.md` |
| 2026-10-04 | T1, T2 run against `story:graph/Nodes/Label/LODZoomRange` | — | M4 confirmed: band never recovers / flips every frame |
| 2026-10-04 | Opened; scope review of 14 ideas → kept 2, deferred 8, rejected 4 (§2.4) | proposed | Composite text explicitly out of scope (maintainer) |
| 2026-10-04 | Approved whole ("yes") | accepted | D-1 … D-8 accepted with the recommendations; D-7 (a) and (b) authorise the three story renames and the new story |
| 2026-10-04 | F1–F17, F24 implemented on `feat/label-zoom-lod` | accepted | V1–V7, V10 pass; V8, V9 skipped (reasons in §6); V11 pending |
| 2026-10-04 | Implementation notes | accepted | (1) D5: `html-text` labels size from `defaultFontSize` rather than being excluded. (2) A remounted `'label'` decoration now re-applies both visibility channels (`setDecoration`). Before, a remount showed a label collision had hidden while collision's `lastVisible` cache still said "hidden" — a fourth face of M5. (3) Badge plates are excluded from the size policy (`ShapeInstance.isBadge`): their text is the badge. (4) The renderer ignores an unchanged policy push: `onFullReconcile` re-pushes on every `data:changed`, which a running layout fires per tick. (5) `ContentLODBehaviour` moved to the live-`_options` + `onOptionsChanged` pattern (its `setOptions` override is gone), the exemption hook became `isExempt`, and `band$` was dropped (no callers). (6) F13 reuses the `content-lod` editor (new `nodeLabelLODFields` / `edgeLabelLODFields` / `labelSizeFields`) instead of a separate `edge-label-lod` folder — one editor already served the family. (7) Style `offset` scales with the label, so the gap to the host or path keeps its proportion. (8) The story authors `bgFill`: fill is outside the theme's role map, so unfilled nodes rendered invisible |
| 2026-10-04 | V8, V11 pass; V9 fail (Playwright, behaviours registered at runtime on existing stories — no story edited) | accepted | V9: 3.4 ms/zoom frame at 5k + 5k labels → F23 trigger met, set `proposed`. V11 surfaced F25 (cleared editor field → `0`), `proposed`. Both await approval |
| 2026-10-04 | F25 approved ("ok"), D-9 delegated → A; F25 implemented | accepted | V12 pass. F23 still `proposed`, awaiting a decision |
| 2026-10-04 | F26–F29 + D-10 opened ("fix it completely" after "can I use both text-LOD and node-labels?") | accepted | Two instances of one content-LOD kind on one layer fight over one channel; proposed exclusive per (layer, kind). Awaiting approval |
| 2026-10-04 | F26–F29 approved ("ok", D-10 = A) and implemented | accepted | V13–V16 pass. `registerAll` got the same rollback as `register` (deferred wiring at `Canvas.init`). F23 still `proposed` |
| 2026-10-04 | F23 implemented ("fix it"); cleanup F30–F34 ("clean up any code implementation that we over engineered") | accepted | Profiling: the sweep was ~1.2 ms isolated / ~3.8 ms in-frame, dominated by pixi transform writes, so the fix sizes only drawn, on-screen labels. V17, V18, V19 pass; V9's all-visible case remains over budget → D-11 proposed |
| 2026-10-04 | D-11 accepted ("ok go a head") | accepted | V9 re-scoped → pass via V17; the all-visible cost documented on `IElementRenderer.setLabelSizePolicy` and the roadmap row. Every row is `implemented`; awaiting commit + merge to flip rows / RFC to `landed` |
