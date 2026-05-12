# Marching-Ants Decoration — Implementation Plan

> Per your feedback memory ("plans go in the code repo"), once you approve this, copy it to `marching-ants-plan.md` at the repo root before implementation begins. The harness restricts plan-mode edits to this path only.

## Context

You want the classic "marching ants" selection-marquee animation — a dashed outline that animates by shifting its dash offset over time — around shape borders. The decoration is already listed in `packages/canvas/CLAUDE.md` as a planned built-in (`marching-ants` for shapes, `marching-ants-connector` for connectors), and `ShapePaintStyle` / `ConnectorPaintStyle` in `primitives/types.ts:296,319,330` already declare `dashArray` and `dashOffset` with a doc-comment explicitly citing marching-ants as the canonical use case. The infrastructure was wired in anticipation; nothing reads those fields yet.

The intended outcome:
1. Any shape (`circle`, `rect`, future `ellipse` / `polygon` / `path`) can be stroked with a dashed silhouette by passing `dashArray` / `dashOffset` to `paintInto`.
2. Any connector (`line`, `curve`) likewise honors a dashed override.
3. Two new always-animated decorations (`MarchingAntsDecoration`, `MarchingAntsConnectorDecoration`) advance `dashOffset` over time via the existing `tick(dt)` animation loop.
4. Two new storybook stories demonstrate both, matching the existing decoration-story pattern.

PixiJS v8's `g.stroke()` has no native dashed support, so the dash emission has to be implemented manually as a polyline.

## Approach

### 1. Dash emitter utility (new, shared)

Create `packages/canvas/src/primitives/paint/dashedStroke.ts`:

```ts
export function emitDashedStroke(
  g: Graphics,
  points: ReadonlyArray<Point>,
  opts: {
    color: number;
    alpha?: number;
    width: number;
    dashArray: readonly [number, number];
    dashOffset?: number;
    closed?: boolean;
    cap?: 'butt' | 'round' | 'square';
    join?: 'miter' | 'round' | 'bevel';
  },
): void;
```

Walks the polyline cumulatively by arc length, alternating dash/gap. Each dash is a `g.moveTo(...).lineTo(...)` followed by `g.stroke({...})`. Honors `dashOffset` (modulo `dashLength + gapLength`); negative offset → clockwise march. When `closed`, the implicit closing segment joins last point → first point.

This is the **single** dash renderer — every shape and connector funnels through it. Reusable for future dashed-border use cases (hover outlines, selection halos, etc.).

### 2. Shape silhouette tessellation

Each shape primitive learns to expose its outline as a polyline, then `paintInto` branches on `style.dashArray`:

- **`CircleShape`** (`packages/canvas/src/primitives/shapes/CircleShape.ts`)
  - Add `static outlinePoints(spec, anchor, inset)` — sample N points around the circle, where `N = max(24, ceil(2π·r / 4))` (≈ 1 pt per 4px of perimeter).
  - In `paintInto`: if `style?.dashArray`, call `emitDashedStroke(g, outlinePoints(...), { ..., closed: true })` and return. Else fall through to existing `g.circle(...)` + `applyMarkerFill`.

- **`RectShape`** (`packages/canvas/src/primitives/shapes/RectShape.ts`)
  - Add `static outlinePoints(spec, anchor, inset)` — emit 4 corner points (or sample arcs if `cornerRadius > 0`).
  - Same dashed-branch pattern in `paintInto`.

Only these two shapes exist today (per `ls primitives/shapes/`). When `Ellipse` / `Polygon` / `Path` shapes land, they follow the same `outlinePoints` + dashed-branch pattern. Document the contract in `IShape` JSDoc.

### 3. Connector dashed-stroke path

`Connector.ts:44` already has `g.stroke({ ... width: style.strokeWidth })` for decoration-overridden strokes. Extend `Connector.paintInto` (in `packages/canvas/src/primitives/connectors/Connector.ts`):

- If `style?.dashArray` present, densify the routed path with the existing `samplePath` (`primitives/connectors/pathSampling.ts`) and call `emitDashedStroke(g, points, { ..., closed: false })`.
- Otherwise keep the current native-stroke path.

This works uniformly across all `pathStyles/` (normal, rounded, smooth, bezier) because they all produce a `Path`, which `samplePath` already densifies.

### 4. New decorations

**`packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts`**

```ts
export interface MarchingAntsDecorationStyle {
  readonly color: number;
  readonly strokeWidth?: number;     // default 1.5
  readonly dashLength?: number;      // default 6
  readonly gapLength?: number;       // default 4
  readonly speedPxPerSec?: number;   // default 24 (negative = reverse)
  readonly inset?: number;           // default 0 (negative = outside silhouette)
  readonly alpha?: number;           // default 1
}

export class MarchingAntsDecoration extends ShapeDecorationBase<MarchingAntsDecorationStyle> {
  private elapsed = 0;
  private g = new Graphics();

  protected repaint(): void { /* ensure single Graphics child */ }

  tick(dt: number): boolean {
    const host = this.host;
    if (!host?.shape.paintInto) return true;
    this.elapsed += dt;
    const speed = this.style.speedPxPerSec ?? 24;
    const dash = this.style.dashLength ?? 6;
    const gap = this.style.gapLength ?? 4;
    const offset = -(this.elapsed / 1000) * speed;  // negative = clockwise

    this.g.clear();
    host.shape.paintInto(this.g, {
      color: this.style.color,
      alpha: this.style.alpha ?? 1,
      strokeWidth: this.style.strokeWidth ?? 1.5,
      fill: false,
      dashArray: [dash, gap],
      dashOffset: offset,
      inset: this.style.inset ?? 0,
    });
    return true;
  }
}
```

**`packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts`**

Mirror of the above, extends `ConnectorDecorationBase`, calls `host.connector.paintInto(g, { color, strokeWidth, fill:false, dashArray, dashOffset })`. No `inset` (connectors are 1D, per `types.ts:326` comment). The `decorations/connector/` folder is new — create it.

### 5. Registration + exports

- `packages/canvas/src/primitives/PrimitivesRenderer.ts` constructor (~line 201-203):
  ```ts
  this.registerDecoration('marching-ants', MarchingAntsDecoration, { target: 'shape' });
  this.registerDecoration('marching-ants-connector', MarchingAntsConnectorDecoration, { target: 'connector' });
  ```
- `packages/canvas/src/primitives/index.ts`: re-export both classes + style interfaces.

### 6. Stories

Pattern matches existing `Glow.stories.ts` / `PulseRing.stories.ts` — all logic inside `play`, flat-literal shape data (per your storybook-data feedback memory), `canvas.camera.fitContent(layer.getBounds(), 100)` at the end (per your center-drawing feedback memory).

- **`apps/storybook/stories/Canvas/Decorations/MarchingAnts.stories.ts`** — circle + rect with marching-ants decoration; lil-gui controls for `color`, `strokeWidth`, `dashLength`, `gapLength`, `speedPxPerSec`, `inset`.
- **`apps/storybook/stories/Canvas/Decorations/MarchingAntsConnector.stories.ts`** — straight line + curved connector between two anchors; same gui controls (no `inset`).

## Critical files to modify

- `packages/canvas/src/primitives/paint/dashedStroke.ts` *(new)*
- `packages/canvas/src/primitives/shapes/CircleShape.ts`
- `packages/canvas/src/primitives/shapes/RectShape.ts`
- `packages/canvas/src/primitives/connectors/Connector.ts`
- `packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts` *(new)*
- `packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts` *(new)*
- `packages/canvas/src/primitives/PrimitivesRenderer.ts` (2 register lines)
- `packages/canvas/src/primitives/index.ts` (exports)
- `apps/storybook/stories/Canvas/Decorations/MarchingAnts.stories.ts` *(new)*
- `apps/storybook/stories/Canvas/Decorations/MarchingAntsConnector.stories.ts` *(new)*

## Reuse — existing utilities to lean on

- `ShapeDecorationBase` / `ConnectorDecorationBase` — lifecycle base classes; subclasses only implement `repaint()` + optional `tick(dt)`.
- `samplePath` (`primitives/connectors/pathSampling.ts:27`) — densifies any `Path` into a flat polyline; reuse for connector tessellation.
- `tickAnimations` (`PrimitivesRenderer.ts:605`) — decorations with a `tick` method are auto-registered into the animation set; no special wiring needed.
- `PulseRingDecoration` (`primitives/decorations/shape/PulseRingDecoration.ts`) — closest precedent for always-animated, paintInto-delegating decoration. Mirror its `tick` shape and Graphics child management.

## Verification

1. `pnpm --filter @invana/canvas check-types` — no TS errors.
2. `pnpm --filter @invana/canvas build` — tsup ESM + dts emit cleanly.
3. `pnpm --filter @canvas/storybook dev` → open `http://localhost:6006`:
   - `Decorations / MarchingAnts` — confirm ants march around both circle and rect; verify direction reverses when `speedPxPerSec` goes negative; verify `inset` shifts the dashed outline inside / outside silhouette; verify dash/gap controls take effect smoothly.
   - `Decorations / MarchingAntsConnector` — confirm dashed segments march along both straight and curved connectors; verify camera pan/zoom keeps the animation smooth (no jitter).
4. Manual eyeball: pause-frame check that dashes connect cleanly at start/end on the closed shape silhouettes (no visible seam at the loop point).
5. No new tests — per the project rule "do not write tests for `packages/canvas`".

## Out of scope (explicit non-goals)

- New shapes (Ellipse, Polygon, Path, Image, Text). They get dashed support when they land, following the same `outlinePoints` + paintInto-branch pattern.
- Per-shape custom `outlinePoints` step-size tuning beyond the simple "1 point per 4px perimeter" heuristic. Iterate later if visible polygonization shows up.
- Connector decoration `inset` (connectors are 1D, no inside/outside).
- Variable-speed / easing on the march. The animation is uniform; `speedPxPerSec` is the only knob.
