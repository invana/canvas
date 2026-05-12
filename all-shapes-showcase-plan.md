# All-Shapes Showcase + Polygon / RegularPolygon / Star primitives

> Note on plan location: per your standing preference, plans live in the repo, not the harness. On approval, this file will be re-written to `all-shapes-showcase-plan.md` at the repo root before implementation begins.

## Context

You want a single Storybook story under `Canvas/Shapes/` that renders **every supported shape kind side-by-side** (circle, rectangle, triangle, hexagon, star, free-form polygon). The point is to have one canonical "everything renders" page that the matching showcase stories under `Canvas/Decorations/Shapes/` and `Canvas/Effects/Shapes/` can mirror — same shape lineup, decorations / effects applied on top — to prove decorators and effects compose with every shape kind.

Today only `CircleShape` and `RectShape` exist (`packages/canvas/src/primitives/shapes/`). Triangle / star / hexagon / polygon are mentioned as built-in kinds in `architecture-proposal.md` and listed under "Deferred to follow-ups" in `primitives-v0-plan.md`. The showcase can't exist until those primitives ship — so the plan is **shape primitives first, then the showcase story**.

Two acknowledged deviations from `apps/storybook/CLAUDE.md`:
- That doc says "Draw one or two graphics at most" in shape stories. The showcase exists precisely to violate that — it draws **one of every kind** in one frame. Existing shape stories (`CircleSolid`, `RectSolid`) already draw 3 instances each, so this is a small extension of that pattern, not a new precedent.
- That doc says "Always wire up a lil-gui panel" for shape stories. You chose the static labeled grid (no GUI). The showcase's job is "every kind renders" — GUI would distract. Per-kind stories already cover interactive tweaking.

## Decisions (locked)

1. **Shape API** — one polygon kind + named convenience kinds, all sharing helpers:
   - `polygon` — free-form, `vertices: Point[]` relative to origin.
   - `regular-polygon` — `sides`, `radius`, optional `rotation`. Covers triangle (sides=3), hexagon (sides=6), pentagon, octagon, etc. via a single class.
   - `star` — `points`, `innerRadius`, `outerRadius`, optional `rotation`. Distinct geometry (alternating radii), distinct class.
2. **Story** — labeled grid, static, no GUI. File `AllShapes.stories.ts`, title `Canvas/Shapes/AllShapes`.
3. **Primitive naming** stays domain-free per `packages/canvas/CLAUDE.md`'s Domain-Free Primitives Rule. `PolygonShape`, `RegularPolygonShape`, `StarShape` all pass the "strip the domain word" test (there's no domain word to strip).

## Implementation

### Phase 1 — Polygon helper module

**New file:** `packages/canvas/src/primitives/shapes/_polyUtils.ts`

Pure-function module. No imports from `pixi.js`. Exports:

- `polygonBounds(vertices: ReadonlyArray<Point>): Rect` — tight AABB.
- `pointInPolygon(localX: number, localY: number, vertices: ReadonlyArray<Point>): boolean` — even-odd ray-cast.
- `offsetPolygon(vertices: ReadonlyArray<Point>, distance: number): Point[]` — parallel offset by `distance` (positive = inset). Vertex-normal averaging on each vertex; sufficient for convex / mildly concave silhouettes which is all the convenience kinds produce. Documented limit: extreme concavity may self-intersect; free-form `polygon` insets are best-effort.
- `regularPolygonVertices(sides: number, radius: number, rotationRad: number): Point[]` — centred at origin; first vertex placed at angle `-π/2 + rotationRad` so a triangle / pentagon points up by default and a hexagon sits flat-top with `rotation = 0`. (The flat-top default is the one users expect; documented in TSDoc.)
- `starVertices(points: number, innerRadius: number, outerRadius: number, rotationRad: number): Point[]` — alternating outer/inner, centred at origin, first outer vertex at angle `-π/2 + rotationRad`.
- `rayPolygonIntersection(localFromCenter: Point, vertices: ReadonlyArray<Point>): Point | null` — line-segment intersection test against each edge from origin toward `localFromCenter`; returns the farthest hit (boundary exit point).

These are the exact helpers anticipated by `primitives-redesign-plan.md` lines 60-66.

### Phase 2 — Spec types

**Edit:** `packages/canvas/src/primitives/types.ts` (after the existing `RectSpec` block around lines 375-385)

Add:

```ts
export interface PolygonSpec extends BaseShapeSpec {
  readonly kind: 'polygon';
  readonly vertices: ReadonlyArray<Point>;  // relative to (x, y)
}

export interface RegularPolygonSpec extends BaseShapeSpec {
  readonly kind: 'regular-polygon';
  readonly sides: number;       // ≥ 3
  readonly radius: number;
  readonly rotation?: number;   // radians
}

export interface StarSpec extends BaseShapeSpec {
  readonly kind: 'star';
  readonly points: number;      // ≥ 3
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly rotation?: number;   // radians
}
```

### Phase 3 — Shape classes

All three extend `ShapeBase<TSpec>`, follow the exact pattern of `CircleShape.ts` (centre-relative origin, since polygons / stars are most natural that way). Each:

- `static readonly kind = '...'`
- `constructor(spec, host)` → `super(host); this.draw(spec);`
- `protected drawGeometry(g, spec, style)`:
  - resolve `vertices`: for `PolygonShape` it's `spec.vertices`; for the others it's computed via `_polyUtils`.
  - if `style?.inset` is set, replace vertices with `offsetPolygon(vertices, inset)`.
  - if `style?.dashArray` → call `emitDashedStroke(g, vertices, { ..., closed: true })` and return.
  - otherwise trace via `g.moveTo(v0).lineTo(v1)...closePath()`, then `applyFill` (passing trace closure for fill clipping like the existing shapes do), then re-trace + `applyStroke`.
- `bounds()` → `polygonBounds(vertices)` (cached on spec change; recompute lazily on each `bounds()` call is fine — same approach as the existing shapes).
- `override contains(localX, localY)` → `pointInPolygon(localX, localY, vertices)`.
- `override boundaryIntersect(localFromCenter)` → `rayPolygonIntersection(localFromCenter, vertices)` (vertices are already centre-relative for all three classes).
- `obstacleTest()` → world-space closure: translate the world point by `-spec.x, -spec.y`, then `pointInPolygon` against an `offsetPolygon(vertices, -inflate)`. For the convenience kinds, that's tight; for free-form polygons it's approximate.
- `static paintInto(g, spec, anchor, angleRad, style?)` — rotate vertices by `angleRad`, translate to `anchor`, trace, `applyMarkerFill`. Mirrors `CircleShape.paintInto` / `RectShape.paintInto`. Lets stars / triangles be used as connector markers in the future.

**New files:**
- `packages/canvas/src/primitives/shapes/PolygonShape.ts`
- `packages/canvas/src/primitives/shapes/RegularPolygonShape.ts`
- `packages/canvas/src/primitives/shapes/StarShape.ts`

### Phase 4 — Registration + public API

**Edit:** `packages/canvas/src/primitives/PrimitivesRenderer.ts` line 208-214 — `registerBuiltins()`:

```ts
this.registerShape('circle', CircleShape);
this.registerShape('rect', RectShape);
this.registerShape('polygon', PolygonShape);
this.registerShape('regular-polygon', RegularPolygonShape);
this.registerShape('star', StarShape);
this.registerShape('arrow', ArrowMarker);
```

**Edit:** `packages/canvas/src/primitives/index.ts`:
- Add class exports: `PolygonShape`, `RegularPolygonShape`, `StarShape`.
- Add type exports: `PolygonSpec`, `RegularPolygonSpec`, `StarSpec`.

`packages/canvas/src/index.ts` already does `export * from './primitives';` (line 126) so they re-export automatically.

### Phase 5 — The showcase story

**New file:** `apps/storybook/stories/Canvas/Shapes/AllShapes.stories.ts`

Layout: a 3×2 labeled grid in world space. Cell size ~140×140 px, gap 40 px, six cells:

```
┌──────────┬──────────┬──────────┐
│  Circle  │   Rect   │ Triangle │   ← regular-polygon, sides=3
├──────────┼──────────┼──────────┤
│ Hexagon  │   Star   │ Polygon  │   ← polygon (free-form arrow/blob)
└──────────┴──────────┴──────────┘
```

All code inside `play` (per your standing memory). For each cell:
- One shape at the cell centre.
- A `text` shape (or a small `rect` + glyph fill — TBD by trying both; the simpler path is reusing the engine's text-fill primitive) below as the label. **Decision pending verification:** the cleanest label is a single fill-text inside a hidden rect, OR we add labels via DOM overlay since this is a static "everything renders" page. I'll pick whichever existing pattern is already used in another story during implementation — preferring engine-native if a `text` primitive exists, else DOM overlay.

Each shape uses distinct fill + stroke so they're visually crisp. Same flat-JSON data pattern as `CircleSolid.stories.ts`:

```ts
const shapes = [
  { id: 'circle',   kind: 'circle',          x: -200, y: -100, radius: 50, fill: 0x4f9cf9, stroke: { color: 0x1e40af, width: 2 } },
  { id: 'rect',     kind: 'rect',            x:  -50, y: -150, width: 100, height: 100, cornerRadius: 8, fill: 0x10b981, stroke: { color: 0x047857, width: 2 } },
  { id: 'tri',      kind: 'regular-polygon', x:  200, y: -100, sides: 3, radius: 55, fill: 0xf59e0b, stroke: { color: 0xb45309, width: 2 } },
  { id: 'hex',      kind: 'regular-polygon', x: -200, y:  100, sides: 6, radius: 55, fill: 0xa855f7, stroke: { color: 0x6d28d9, width: 2 } },
  { id: 'star',     kind: 'star',            x:    0, y:  100, points: 5, outerRadius: 55, innerRadius: 22, fill: 0xef4444, stroke: { color: 0x991b1b, width: 2 } },
  { id: 'poly',     kind: 'polygon',         x:  200, y:  100, vertices: [{x:-40,y:-30},{x:40,y:-30},{x:60,y:0},{x:40,y:30},{x:-40,y:30},{x:-60,y:0}], fill: 0x06b6d4, stroke: { color: 0x0e7490, width: 2 } },
];
for (const s of shapes) layer.renderer.addShape(s.id, s);
canvas.camera.fitContent(layer.getBounds(), 100);
```

Container id: `cvs-all-shapes`. Boilerplate (RenderLayer subclass, behaviours, camera fit) lifted from `CircleSolid.stories.ts` 1:1.

## Critical files

**New:**
- `packages/canvas/src/primitives/shapes/_polyUtils.ts`
- `packages/canvas/src/primitives/shapes/PolygonShape.ts`
- `packages/canvas/src/primitives/shapes/RegularPolygonShape.ts`
- `packages/canvas/src/primitives/shapes/StarShape.ts`
- `apps/storybook/stories/Canvas/Shapes/AllShapes.stories.ts`

**Edited:**
- `packages/canvas/src/primitives/types.ts` — add `PolygonSpec`, `RegularPolygonSpec`, `StarSpec`.
- `packages/canvas/src/primitives/PrimitivesRenderer.ts` — register the three new kinds in `registerBuiltins`.
- `packages/canvas/src/primitives/index.ts` — re-export the three classes + three specs.

## Reuse (no new code where existing utilities work)

- `ShapeBase` (`packages/canvas/src/primitives/base/ShapeBase.ts`) — all three classes extend it. Get `draw`, `paintInto`, fill-layer mounting for free.
- `applyFill`, `applyMarkerFill`, `applyStroke` from `primitives/paint/applyFillStroke` — same as `CircleShape`/`RectShape`.
- `emitDashedStroke` from `primitives/paint/dashedStroke` — dashed support comes for free once we feed it the densified polyline (and a polygon outline IS already a polyline, so no densification needed for the convenience kinds; free-form polygons too).
- `BaseShapeSpec`, `Point`, `Rect`, `ShapeHostInfo`, `ShapePaintStyle` from `primitives/types`.
- Story scaffolding (`Canvas`, `WorldLayer`, `PrimitivesRenderer`, `DragPanBehaviour`, `WheelZoomBehaviour`, `createContainer`) lifted directly from `CircleSolid.stories.ts:1-30`.

## Verification

1. **Types**: `pnpm check-types` clean.
2. **Build**: `pnpm --filter @invana/canvas build` succeeds; `pnpm build` (turbo) succeeds.
3. **Storybook**: `pnpm --filter @canvas/storybook dev`, navigate to `Canvas/Shapes/AllShapes`. Confirm all six shapes render with fills + strokes at the expected positions, no console errors.
4. **Camera fit**: opening the story should auto-centre on the 3×2 grid (the `fitContent` call).
5. **Pan/zoom sanity**: drag-pan and wheel-zoom should work (DragPan + WheelZoom registered).
6. **Existing stories don't regress**: open `Canvas/Shapes/CircleSolid` and `Canvas/Shapes/RectSolid` after the change to confirm nothing about registration order or exports broke them.
7. **Decorations / effects compose** (deferred to follow-up tasks, but worth flagging): once this lands, the `Canvas/Decorations/Shapes/` and `Canvas/Effects/Shapes/` folders should each gain a mirror "AllShapes" story (e.g. `AllShapesGlow`, `AllShapesShake`) reusing the same shape lineup. Out of scope for this plan — implement separately.

## Out of scope

- No tests in `packages/canvas` (per CLAUDE.md rule #10).
- No new decoration / effect code.
- No mirror showcase stories under `Canvas/Decorations/Shapes/` or `Canvas/Effects/Shapes/` yet — separate follow-up.
- No `EllipseShape` or `PathShape` (also deferred per `primitives-v0-plan.md`).
- No GUI panel on the showcase (explicit deviation, documented above).
