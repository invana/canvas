# Text Labels for Nodes & Edges — Plan

> Plan-mode location. On approval, move to repo root as `text-labels-plan.md`
> per user preference (memory: `feedback_plans_in_repo`).

## Context

`@invana/graph` currently renders nodes and edges as plain shapes — no text
labels anywhere. `NodeRenderHints.label?: string` is declared but unused
(`packages/graph/src/layer/types.ts:58` — *"rendered by future extensions,
ignored for now"*). `EdgeRenderHints` has no label field at all. The only
text rendering in the engine today is `kind: 'text'` as an **inset fill layer**
(`packages/canvas/src/primitives/paint/insetContentLayer.ts:121`) — paints
text *inside* a shape's bounds via plain Pixi `Text`, with a minimal option
set (font, size, color, anchor, widthRatio).

That covers neither labels-below-nodes, labels-along-edges, rich/HTML text,
backgrounds, wrap, ellipsis, autoRotate, nor any cross-label policy like
collision. G6's label model
([nodes](https://g6.antv.antgroup.com/en/manual/element/node/base-node#label-style),
[edges](https://g6.antv.antgroup.com/en/manual/element/edge/base-edge#label-styles))
is the feature target — comprehensive typography, pill background, placement,
overflow, autorotate, dynamic resolution.

We want a **single canvas-level Label decoration** that covers all of this,
plus the things G6 doesn't (rich/HTML text), with collision factored out as a
separate behaviour.

## Goals

- One `LabelDecoration` primitive in `@invana/canvas`, two positioner variants
  (shape, connector). Reusable beyond graph.
- Two text content kinds in MVP: `text` (Pixi `Text`) and `html-text` (Pixi
  `HTMLText`). `bitmap-text` deferred as future perf escape hatch.
- Shape labels: 13 placements (8 outside sides + center + 4 inside corners) +
  screen-space offset + optional rotation.
- Connector labels: `placement: 'start' | 'center' | 'end' | number(0..1)` +
  `pathOffset` (along tangent) + `offset` (screen-space, post-rotation) +
  `autoRotate` with auto-flip.
- Optional pill background (fill, stroke, radius, padding, shadow).
- Wrap / maxLines / ellipsis / textOverflow.
- Per-label `minZoom` / `maxZoom` LOD.
- `LabelCollisionBehaviour` (graph package) — greedy hide-on-overlap with
  priority sort. Opt-in like all behaviours.
- **Deprecate** the inset `kind: 'text'` fill layer; migrate callers.

## Non-goals

- `bitmap-text` content kind (deferred).
- Force-shift / dodge collision strategies (only greedy hide in MVP).
- Label editing / inline text input.
- i18n / bidi-specific handling (Pixi handles LTR/RTL natively; we don't add
  controls on top).
- Animated text transitions.

## Architecture

```
packages/canvas/src/primitives/
  decorations/
    shape/LabelDecoration.ts          ← shape-anchored positioner
    connector/LabelDecoration.ts      ← path-anchored positioner
  paint/
    labelContent.ts                    ← text | html-text rendering
    labelBackground.ts                 ← rounded-rect pill
    pathTangent.ts                     ← samplePathWithTangent helper
  types.ts                             ← LabelStyle, content & positioner types

packages/graph/src/
  layer/types.ts                       ← extend hints with `label`
  layer/GraphLayer.ts                  ← translate hints → decoration specs
  behaviours/LabelCollisionBehaviour.ts ← greedy hide, opt-in
```

**What/where split.** A label is *content* (text bytes + style) plus a
*positioner* (host bounds → x,y,rotation). These are orthogonal — same content
goes through either positioner unchanged.

**Existing reusables.** `PrimitivesRenderer.samplePath`
(`packages/canvas/src/.../PrimitivesRenderer.ts:61`) already samples a point
on a connector path; we extend it (or add `samplePathWithTangent`) so every
path kind returns `{ point, tangent }`. The badges system
(`packages/canvas/src/primitives/badges/`) is conceptually related but solves
a different problem (slot-based child shapes); we don't reuse it.

## Type design (nested option shape)

```ts
// packages/canvas/src/primitives/types.ts

export type LabelContent =
  | {
      kind: 'text';
      text: string;
      font?: {
        family?: string;          // default: 'sans-serif'
        size?: number;            // default: 12 (px at scale 1)
        weight?: number | string; // default: 400
        style?: 'normal' | 'italic';
        variant?: 'normal' | 'small-caps';
        letterSpacing?: number;
        lineHeight?: number;
      };
      fill?: number;              // default: 0x000000
      alpha?: number;             // default: 1
      align?: 'left' | 'center' | 'right'; // default: 'center'
      decoration?: {              // underline / strikethrough
        line?: 'underline' | 'line-through' | 'overline';
        color?: number;
        style?: 'solid' | 'dotted' | 'dashed' | 'wavy';
      };
    }
  | {
      kind: 'html-text';
      html: string;
      // Per-tag style map (Pixi HTMLText tagStyles)
      tagStyles?: Record<string, Partial<HtmlTagStyle>>;
      // Inline CSS injected into the HTML render (fonts, classes)
      cssOverrides?: string[];
      // Base style applied when no tag override matches
      defaultStyle?: HtmlTagStyle;
      // Fixed render width; required for HTMLText word wrap
      width?: number;
    };

export interface LabelWrap {
  maxWidth?: number | string;     // px or '%' of host width. default: undefined (no wrap)
  maxLines?: number;              // default: 1
  wordWrap?: boolean;             // default: false
  overflow?: 'clip' | 'ellipsis'; // default: 'ellipsis' when maxLines set
}

export interface LabelBackground {
  fill?: number;
  fillAlpha?: number;             // default: 1
  stroke?: number;
  strokeAlpha?: number;
  strokeWidth?: number;           // default: 1
  radius?: number | [number, number, number, number];
  padding?: number | [number, number] | [number, number, number, number];
  shadow?: { color: number; blur: number; offsetX?: number; offsetY?: number };
}

export interface LabelStyle {
  content: LabelContent;
  background?: LabelBackground;
  wrap?: LabelWrap;
  offset?: { x?: number; y?: number };  // screen-space, post-rotation
  rotation?: number;                     // radians, manual override (shape only by default)
  alpha?: number;
  zIndex?: number;
  cursor?: string;
  visibility?: { minZoom?: number; maxZoom?: number };
  // Collision-behaviour-only hooks; primitive ignores them
  priority?: number;
  collisionGroup?: string;
  forceShow?: boolean;
}

// Shape host
export type ShapeLabelPlacement =
  | 'center'                           // inside, centered (subsumes inset text)
  | 'top'    | 'top-right'    | 'right'  | 'bottom-right'
  | 'bottom' | 'bottom-left'  | 'left'   | 'top-left'
  | 'inside-top-left' | 'inside-top-right'
  | 'inside-bottom-left' | 'inside-bottom-right';

export interface ShapeLabelSpec extends LabelStyle {
  placement?: ShapeLabelPlacement;   // default: 'bottom'
  hostId: string;                    // shape this label anchors to
}

// Connector host
export type ConnectorLabelPlacement = 'start' | 'center' | 'end' | number;

export interface ConnectorLabelSpec extends LabelStyle {
  placement?: ConnectorLabelPlacement; // default: 'center'
  pathOffset?: number;                 // px along tangent (positive = toward target)
  autoRotate?: boolean;                // default: true
  keepUpright?: boolean;               // flip when tangent angle ∈ (π/2, 3π/2). default: true
  hostId: string;                      // connector this label anchors to
}
```

**Per-hints integration in graph package:**

```ts
// packages/graph/src/layer/types.ts

export interface NodeRenderHints {
  // ... existing fields
  label?: string | NodeLabelHint;
}

// NodeLabelHint = LabelStyle minus hostId (graph provides it) + node placement
export type NodeLabelHint = Omit<ShapeLabelSpec, 'hostId'>;
export type EdgeLabelHint = Omit<ConnectorLabelSpec, 'hostId'>;

export interface EdgeRenderHints {
  // ... existing fields
  label?: string | EdgeLabelHint;
}
```

A bare string shorthand (`label: 'Hello'`) expands to
`{ content: { kind: 'text', text: 'Hello' } }` with defaults. Most callers
will use the shorthand.

## Inset text → Label decoration (deprecation)

The current `kind: 'text'` fill layer
(`packages/canvas/src/primitives/types.ts:211`,
`packages/canvas/src/primitives/paint/insetContentLayer.ts:121`) is replaced by
a Label decoration with `placement: 'center'`. Migration:

1. Add a deprecation TSDoc note on `kind: 'text'` in fill layer types pointing
   to `LabelDecoration`.
2. Sweep callers — primarily Storybook stories that currently set
   `spec.fill = { kind: 'text', ... }`. Convert each to attach a
   `LabelDecoration` with `placement: 'center'` to the shape.
3. After migration, **remove** the `'text'` branch from
   `ShapeFillLayer` and the rendering code in `insetContentLayer.ts`. (Glyph,
   svg, image-inset branches stay.)
4. **`kind: 'glyph'` is *not* affected** — glyphs are a separate, smaller
   primitive (memory: `feedback_glyph_kind_only`). They stay as a fill layer.

Risk: any external consumer of the canvas package using `kind: 'text'` breaks.
Acceptable — the package is pre-1.0 and the rewrite is explicit.

## Path tangent — supporting autoRotate across all path kinds

Extend the path-sampling utility so every path style returns point + tangent:

```ts
// packages/canvas/src/primitives/paint/pathTangent.ts
export interface PathSample { point: Vec2; tangent: Vec2; /* unit length */ }
export function samplePathWithTangent(path: Path, t: number): PathSample;
```

Per path kind:
| Kind        | Tangent source                                                |
|-------------|---------------------------------------------------------------|
| straight    | constant direction (target − source) normalised               |
| bezier Q/C  | analytical derivative at t                                    |
| smooth      | analytical derivative at t                                    |
| rounded     | piecewise: segment dir on straights, arc tangent on corners   |
| orth / manhattan | direction of segment containing t (corners snap — correct) |
| bump-radial | finite difference: samplePath(t+ε) − samplePath(t−ε)          |

`autoRotate` reads `Math.atan2(tangent.y, tangent.x)`. `keepUpright` flips by
π when the angle falls in `(π/2, 3π/2)`. At orthogonal corners, pick the
segment containing t — labels exactly at a corner snap to one side.

## Performance plan

**Engine-level mitigations (in MVP):**

1. **Mutation over recreation.** `LabelDecoration.update()` mutates the
   existing Pixi `Text.text` and `style` rather than destroying / recreating.
   Same for HTMLText. Same for background `Graphics.clear()` + redraw.
2. **Background and text in one Container.** Single Pixi `Container` per
   label; background is a `Graphics` child, text is a `Text`/`HTMLText`
   sibling. Pixi batches across the layer.
3. **LOD via `visibility.minZoom` / `maxZoom`.** Below threshold, the label's
   container is *removed from the scene graph* (not just `visible = false`).
   Re-mounted on zoom-in.
4. **Viewport culling piggybacks on host.** If host shape/connector is culled
   by the engine, label is culled. Decoration lifecycle is driven by host.

**Documented limits (TSDoc + docs/concepts page):**
- `text`: comfortable up to ~2–5k visible labels.
- `html-text`: ~50–200 visible. Use `text` for high density.
- `bitmap-text`: planned follow-on for ~50k+ density.

**Out of scope (future):** async HTMLText rasterization, atlas pooling for
bitmap text, font preloading orchestration.

## LabelCollisionBehaviour (MVP, opt-in)

```ts
// packages/graph/src/behaviours/LabelCollisionBehaviour.ts

export interface LabelCollisionOptions {
  strategy?: 'hide';                // MVP only strategy; 'dodge'/'fade' later
  prioritise?: 'priority-field'     // read LabelStyle.priority
              | 'node-degree'       // higher degree wins (graph-aware)
              | ((label) => number);
  flickerGuardMs?: number;          // default: 100; hysteresis to avoid pop
  spatialHashCell?: number;         // default: 128px
  groups?: {                        // labels in different groups never compete
    nodes?: string;                 // default: 'nodes'
    edges?: string;                 // default: 'edges'
  };
}
```

**Algorithm per frame:**
1. Collect all visible labels (already mounted, passed LOD).
2. Bucket their AABBs into a spatial hash.
3. Sort by `priority` (resolved via `prioritise` strategy), descending.
4. Walk sorted: a label is *shown* if its AABB does not overlap any
   already-shown label in the same `collisionGroup`. Otherwise mark hidden.
5. Apply hysteresis — a label hidden last frame stays hidden until clear by a
   margin > flicker threshold (and vice versa).
6. `forceShow: true` skips all checks (used for selected / hovered).

Cheap: O(n) bucket + O(n · k) overlap check where k is avg labels per cell.
At 5k labels with 128px cells, k stays in single digits for typical graphs.

Registration is explicit (project rule #7): `canvas.addBehaviour(new LabelCollisionBehaviour({...}))`
and `behaviour.enable()`.

## Critical files to modify

| File | Change |
|---|---|
| `packages/canvas/src/primitives/types.ts` | Add `LabelContent`, `LabelStyle`, `LabelWrap`, `LabelBackground`, `ShapeLabelSpec`, `ConnectorLabelSpec`. Deprecate `kind: 'text'` in `ShapeFillLayer`. |
| `packages/canvas/src/primitives/decorations/shape/LabelDecoration.ts` | **NEW**. Shape-anchored positioner; lifecycle (mount/update/destroy); 13 placements; LOD; hit-testing. |
| `packages/canvas/src/primitives/decorations/connector/LabelDecoration.ts` | **NEW**. Path-anchored positioner; placement/pathOffset/autoRotate/keepUpright; LOD; hit-testing. |
| `packages/canvas/src/primitives/paint/labelContent.ts` | **NEW**. Renders `text` / `html-text` content into a Container. Handles wrap/maxLines/ellipsis via Pixi `style.wordWrap` + truncation pass. |
| `packages/canvas/src/primitives/paint/labelBackground.ts` | **NEW**. Rounded-rect Graphics with padding, stroke, shadow. Reused by both decoration variants. |
| `packages/canvas/src/primitives/paint/pathTangent.ts` | **NEW**. `samplePathWithTangent(path, t)` covering all path kinds. |
| `packages/canvas/src/primitives/paint/insetContentLayer.ts:121` | Sweep `'text'` branch after caller migration; remove. Keep glyph/svg/image-inset. |
| `packages/canvas/src/PrimitivesRenderer.ts` (line ~61) | Export `samplePathWithTangent`. Add `addShapeLabel(id, spec)` / `addConnectorLabel(id, spec)` / `update*` / `remove*` lifecycle. |
| `packages/graph/src/layer/types.ts:40` | Replace `label?: string` placeholder with `label?: string \| NodeLabelHint` on `NodeRenderHints`. Add `label?: string \| EdgeLabelHint` to `EdgeRenderHints`. |
| `packages/graph/src/layer/GraphLayer.ts:422,459` | In `nodeSpec()` / `edgeSpec()`, translate `label` hint into `addShapeLabel` / `addConnectorLabel` calls. Wire updates and removal into the existing store-subscription path. |
| `packages/graph/src/behaviours/LabelCollisionBehaviour.ts` | **NEW**. Greedy hide-on-overlap. |
| `packages/graph/src/index.ts` | Export `LabelCollisionBehaviour`, label hint types. |
| `apps/storybook/stories/graph-labels/` | **NEW** stories — see Verification. |
| Existing storybook stories using `fill: { kind: 'text', ... }` | Migrate to `LabelDecoration` with `placement: 'center'`. |

TSDoc on every new public surface (project rule #9).

## Verification

End-to-end via Storybook (port 6006), no automated tests for canvas package
(project rule #10):

1. `pnpm --filter @canvas/storybook dev`
2. New story group `graph-labels/`:
   - **Node label placements** — one node, slider cycling all 13 placements.
   - **Node label backgrounds** — grid: text only, pill, pill+stroke,
     pill+shadow.
   - **Node label wrap & ellipsis** — long text with `wrap.maxLines: 1..3`.
   - **HTML node label** — `<b>`, `<i>`, color tags via `tagStyles`.
   - **Edge label placements** — straight edge with `'start' / 'center' /
     'end' / 0.25 / 0.75`.
   - **Edge label path types** — same label on straight, bezier, smooth,
     orth, manhattan, rounded, bump-radial edges. Verify autoRotate looks
     correct on each.
   - **Edge pathOffset + screen offset** — label near source with `pathOffset:
     24` to pad off the source node; combined with `offset.y: -10`.
   - **Collision behaviour** — dense graph (use d3-force layout with ~500
     nodes from `@invana/graph-datasets`), toggle behaviour on/off; verify
     hide + priority-by-degree. Toggle `forceShow` on selection.
   - **LOD** — story with `visibility: { minZoom: 0.5 }`, zoom out and verify
     labels unmount.
3. Migrate existing inset-text usages — confirm those stories still render
   identical output via Label decoration.
4. Manual perf check: 2k visible `text` labels with collision on — should
   stay >40fps on the dev machine. If not, document the actual ceiling.

## Open questions (resolve in PR review, not blockers)

- **Option naming**: nested groups (this plan) vs G6-flat (`labelFontSize`,
  ...). Plan uses nested; flip if you'd prefer 1:1 G6 parity.
- **`html-text` font loading**: do we surface a `fontCss` helper on the
  canvas package, or leave it to consumers? (Existing `loadIconFont` at
  `packages/canvas/src/fonts/loadIconFont.ts` is the closest pattern.)
- **Collision priority defaults**: `'priority-field'` falls back to what when
  the user doesn't set `priority`? Proposal: fall back to `'node-degree'` for
  node labels, edge index for edge labels.
- **Animated label transitions** (fade on show/hide from collision) — out of
  MVP unless cheap. Likely add later as a render hook on the decoration.
