# Badges — implementation plan

## Context

Nodes (and shapes generally) need small host-anchored visuals on any of 8 sides of their AABB — status pips, priority labels, severity flags, counts. The reference behavior is G6's `BadgeStyleProps` ([docs](https://g6.antv.antgroup.com/en/manual/element/node/base-node#badge-style)), which models badges as a separate styling subsystem with its own background/text/padding/placement fields.

A G6-style parallel system would duplicate fill resolution, stroke rendering, hit-testing, and decoration hosting that already exist for shapes. Since a badge is structurally identical to any shape (plate + content + stroke + optional decorations), we instead model badges as **regular shapes with anchoring metadata**. This delivers maximum reuse: every existing and future fill kind, shape kind, and decoration works on badges automatically.

**Use cases the design must cover** (both visible in the reference screenshot):
- **Icon-on-bg** badge — circular plate + single-character glyph (the gray "A")
- **Text-on-bg** badge — rounded-rect plate + multi-character text label (the red "Important", yellow "Notice")
- **Mixed icon + text** — same plate carrying both a glyph and a text fill layer
- **Decorated badges** — glow / ring / marching-ants applied to the badge itself (e.g. pulse on a critical-status badge)

## Design

### Core principle: a Badge IS a Shape

A badge is registered as a regular shape under id `` `${hostId}:${slot}` `` in the same shape map the renderer already maintains. Consequence:

- Every `ShapeFillLayer` kind works as badge content (`solid`, `glyph`, `svg`, `svg-url`, `image-inset`, plus the new `text` kind below).
- Every registered shape kind works as a badge plate (`circle`, `rect`, plus any future `hexagon`/`diamond`/`tag`).
- `setDecoration(badgeId, slot, …)` already works on badges with zero new code — that's how "decorations on badges" comes free.
- Same hit-test, z-index, alpha, and visibility semantics as any shape.

### Three primitive additions

#### 1. New `ShapeFillLayer` variant: `kind: 'text'`

Multi-character text content as an inset fill layer. Critical for text-on-bg badges, but reusable by any shape that wants a label inside it (ER cells, swimlane headers, flowchart nodes). Shape mirrors the existing `glyph` variant for consistency:

```ts
| {
    readonly kind: 'text';
    readonly text: string;
    readonly fontFamily?: string;
    readonly fontSize?: number;        // default 12
    readonly fontWeight?: number | string;
    readonly fontStyle?: 'normal' | 'italic';
    readonly color?: number;           // default 0x000000
    readonly alpha?: number;
    readonly maxLines?: number;        // default 1
    readonly align?: 'left' | 'center' | 'right';   // default 'center'
    readonly sizeRatio?: number;       // default 0.6 (same convention as glyph)
    readonly anchor?: InsetAnchor;     // default 'center'
  }
```

Renders via Pixi `Text` with the multi-char string. Sized by max-width fit within `bounds.width × sizeRatio` rather than the square bounds-fraction used by `glyph`/`svg`.

#### 2. New `BadgeOptions` type

Minimum delta over a shape spec — only the fields that justify badges existing as a concept:

```ts
export type BadgePlacement =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface BadgeOptions {
  /** The badge plate as a shape spec, minus x/y (placement provides position). */
  readonly shape: Omit<BaseShapeSpec, 'x' | 'y'>;

  /** Anchor point on the host AABB. */
  readonly placement: BadgePlacement;

  /** Pixel offset from the anchor along x/y. Default 0. */
  readonly offsetX?: number;
  readonly offsetY?: number;

  /**
   * Which point of the badge AABB lands at the anchor.
   * Default: mirror of placement (badge sits fully outside host).
   * Set to 'center' to half-overhang the host edge.
   */
  readonly origin?: BadgePlacement | 'center';

  /** Decorations applied to the badge shape, keyed by slot. */
  readonly decorations?: Readonly<Record<string, DecorationSpec>>;
}
```

No `fontSize`, `padding`, `backgroundFill`, `cornerRadius` — all expressible through `shape.fill` / `shape.stroke` / shape-kind fields.

#### 3. Renderer methods: `setBadge` / `removeBadge`

```ts
class PrimitivesRenderer {
  setBadge(hostId: string, slot: string, options: BadgeOptions): void;
  removeBadge(hostId: string, slot: string): void;
}
```

Internal behavior:

- **Add path**: compute anchored `(x, y)` from host bounds + placement + origin + offset → `addShape(badgeId, { ...options.shape, x, y })` where `badgeId = ${hostId}:${slot}` → for each entry in `options.decorations`, call `setDecoration(badgeId, decoSlot, decoSpec)`.
- **Track relationship**: store host→[slot→badgeId] map so the renderer knows which badges belong to which host.
- **Re-anchor on host update**: when `updateShape(hostId, …)` runs, recompute each badge's `(x, y)` from the new host bounds and call `updateShape(badgeId, …)`.
- **Cascading removal**: `removeShape(hostId)` removes all attached badges first, then the host.
- **Cascading visibility / alpha**: badges follow host's `visible` / `alpha` (multiply, don't replace — badge can be independently hidden).

### Origin computation

For `placement: 'top-right'` with default origin (mirror = `'bottom-left'`):
- Anchor on host AABB = `(host.x + host.w, host.y)`
- Origin on badge AABB = `(badge.x, badge.y + badge.h)` (its bottom-left)
- Solve for badge top-left so that origin lands on anchor: `badge.x = host.x + host.w + offsetX`, `badge.y = host.y - badge.h + offsetY`

For `placement: 'top-right'` with `origin: 'center'`:
- Origin on badge AABB = badge center
- `badge.x = host.x + host.w - badge.w/2 + offsetX`, `badge.y = host.y - badge.h/2 + offsetY`

The 16 combinations (8 placements × {default, center}) are encoded as two pure functions: `placementToHostAnchor(bounds, placement)` and `originToBadgeOffset(bounds, origin)`. Both live in a new file `placement.ts` next to `BadgeOptions`.

## Critical files

### New files
- `packages/canvas/src/primitives/badges/types.ts` — `BadgePlacement`, `BadgeOptions`, exported through `primitives/types.ts` re-export.
- `packages/canvas/src/primitives/badges/placement.ts` — pure `placementToHostAnchor` / `originToBadgeOffset` helpers. No Pixi.
- `packages/canvas/src/primitives/paint/textInsetLayer.ts` (or extend existing `insetContentLayer.ts`) — Pixi `Text` factory + max-width fit logic for the new `text` fill kind.

### Modified files
- `packages/canvas/src/primitives/types.ts` — add `kind: 'text'` to `ShapeFillLayer` union (around line 106–177); re-export `BadgeOptions` / `BadgePlacement`.
- `packages/canvas/src/primitives/paint/insetContentLayer.ts` — add `text` branch alongside the existing `glyph` / `svg` / `image-inset` / `svg-url` branches; `positionAndScale` gets a max-width-fit code path for text.
- `packages/canvas/src/primitives/PrimitivesRenderer.ts` — add `setBadge` / `removeBadge`; track host→badges map; hook into `updateShape` / `removeShape` for cascading.
- `packages/canvas/src/primitives/index.ts` — export `BadgeOptions`, `BadgePlacement`.

### Storybook stories
- `apps/storybook/stories/canvas/Badges.stories.tsx` (new) — reproduce the reference screenshot: a circle host with three badges (gray "A" glyph half-overhanging top-right; red "Important" text right; yellow "Notice" text bottom-right). Plus a story demonstrating glow on a badge to verify decoration nesting works. All story logic inside the `play` function with literal data per [feedback_storybook_data_pattern](~/.claude/projects/-Users-ravi-merugu-Projects-Invana-canvas/memory/feedback_storybook_data_pattern.md). Center via `canvas.camera.fitContent(layer.getBounds(), 100)`.

## Existing utilities to reuse

- **Shape registry + dispatch** in `PrimitivesRenderer.addShape` / `removeShape` (lines 148–189) — `setBadge` delegates to `addShape` for plate creation. No duplication of construction, hit-test registration, or container management.
- **Decoration dispatch** in `PrimitivesRenderer.setDecoration` (lines 234–307) — `setBadge` calls this verbatim for each entry in `options.decorations`. No new decoration plumbing.
- **Fill resolution** in `paint/insetContentLayer.ts` — adding the `text` branch reuses the existing `syncInsetLayers` walk in `ShapeBase.draw` (lines 65–78); no changes to `ShapeBase` required.
- **`positionAndScale`** in `paint/insetContentLayer.ts` (lines 173–209) — already centers/anchors inset content within shape bounds using `InsetAnchor`. The text branch reuses it with a different size rule.
- **`ShapePaintStyle` override** + `host.shape.paintInto` (types.ts 214–224, used by `GlowDecoration`) — guarantees decorations on badges work because badges are real shapes that extend `ShapeBase` and inherit `paintInto`.

## Open implementation questions (resolve at code-time, not now)

- Whether `setBadge` should accept an array of badges per host (`setBadges(hostId, options[])`) as a convenience for atomic re-sync. Defer until a consumer asks.
- Whether `text` fill layer needs LOD-aware label resolution (`setLabelResolution` is already on `IShape`). Probably yes for sharp text under zoom, but a 1.0 default is fine for v0.
- Whether `placement` should accept percentages along an edge (e.g. `'top:25%'`) for tag-style badges along an edge. Out of scope for v0.

## Verification

Visual (the primary signal — type-check alone won't catch placement bugs):

1. `pnpm --filter @invana/canvas build` — ensure tsup emits cleanly.
2. `pnpm --filter @canvas/storybook dev` → http://localhost:6006 → open the new **Canvas › Badges** story.
3. Confirm the screenshot reproduction:
   - Gray "A" circle half-overhangs the host's top-right corner.
   - Red "Important" rounded-rect sits flush right of the host.
   - Yellow "Notice" rounded-rect sits at bottom-right.
4. Drag the host (via `DragPanBehaviour` over a draggable layer or by mutating the shape spec via a debug GUI) — all three badges must follow.
5. Open the glow-on-badge story — confirm the decoration paints around the badge silhouette, not the host.
6. Remove the host shape via a story button — all three badges must disappear.

Type-check:

```bash
pnpm check-types
```

No tests for `packages/canvas` per the global rule.
