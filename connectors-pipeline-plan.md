# Connectors Pipeline — Anchor → Router → PathStyle

## Context

`primitives-redesign-plan.md` §4 collapsed all connector visual variation into a single `router` stage. The list `straight | orthogonal | orthogonal-rounded | bezier | curve` mixes two concerns:

- **Topology** (where does the line bend?) — straight, manhattan, orthogonal, metro, ER
- **Visual style** (how are bends drawn?) — sharp segments, rounded fillets, smooth curves, single bezier

This conflation makes "manhattan with rounded corners" or "ER with smooth curves" express awkwardly (`orthogonal-rounded` is a one-off router that exists only to plug this gap). It also caps the matrix of routings × visual styles at whatever we hand-author.

X6 / JointJS / mxGraph all separate these into orthogonal pluggable stages. Adopting that split lets connectors support any drawing combination without bloating the router list.

A third gap surfaces from the current code: **endpoint resolution is positional only**. In [PrimitivesRenderer.resolveEndpoint](packages/canvas/src/primitives/PrimitivesRenderer.ts) (lines 536–543), when a connector references a shape by id, the renderer plucks `target.spec.x, target.spec.y` (the shape's origin). No boundary intersection, no perimeter snap, no port awareness. Connectors between two non-zero-sized shapes end inside them. An **anchor** stage formalizes endpoint resolution and makes it pluggable.

This plan introduces a three-stage connector pipeline: `anchor → router → pathStyle`. Each stage is a registered pure function. The `Connector` class stays as the renderer that walks the final `Path`. The redesign plan's §4 router-only model is reversed.

---

## Terminology

The user-facing primitive stays **Connector**. Stage names below are internal; the user composes them via spec fields.

| Term | Definition |
|---|---|
| **Connector** | Top-level primitive joining `source` and `target`, optionally via `waypoints`. Single concrete `Connector` class (already exists). |
| **Anchor** | Pure function `(endpoint, fromPoint, ctx) → Point`. Resolves a `ConnectorEndpointSpec` to a concrete world-space point on the source/target shape. **Stage 1.** |
| **Router** | Pure function `(source, target, waypoints?, opts?) → Polyline`. Decides path topology — where bends sit. **Stage 2.** |
| **PathStyle** | Pure function `(polyline, opts?) → Path`. Decides visual style — how segments between bend points are rendered. **Stage 3.** |
| **Polyline** | Flat point list. Output of router, input to pathStyle. Already used for hit-testing via `samplePath`. |
| **Path** | Ordered list of `PathCommand` (M/L/Q/C). Output of pathStyle, input to `Connector` class. Type already defined in [primitives/types.ts](packages/canvas/src/primitives/types.ts) lines 46–77. |

Words deliberately **not used**: `edge`, `link`, `connector` (for inner stages — already taken).

---

## Pipeline

```
ConnectorSpec
   │
   ▼
┌──────────┐  resolves ConnectorEndpointSpec → concrete (x, y) on shape boundary.
│  anchor  │  Built-ins: center (default), boundary. Pluggable.
└──────────┘
   │  AnchoredPoint × 2  (source, target with optional tangent hint)
   ▼
┌──────────┐  pure pathfinding. Decides bend points.
│  router  │  Built-ins: straight (default), manhattan, orthogonal, metro, er, oneSide.
└──────────┘
   │  Polyline  [A, p1, p2, …, B]
   ▼
┌──────────┐  pure visual styling. Decides how segments between bends are drawn.
│pathStyle │  Built-ins: normal (default), rounded, smooth, bezier. (jumpover deferred.)
└──────────┘
   │  Path  [M, L, Q, C, …]
   ▼
┌──────────┐  existing Connector class. Walks Path via Pixi moveTo / lineTo /
│Connector │  quadraticCurveTo / bezierCurveTo. Paints markers using tangentAt(path, 0|1).
└──────────┘
   │
   ▼
 pixels
```

Three registries (`anchorRegistry`, `routerRegistry`, `pathStyleRegistry`), all open for user extension. To add any new drawing style, register a new function in one of the three — no changes to the `Connector` class.

---

## Spec changes

```ts
export type ConnectorEndpointSpec =
  | { readonly kind: 'point'; readonly x: number; readonly y: number; readonly tangent?: Vec2 }
  | { readonly kind: 'shape'; readonly shapeId: string; readonly anchor?: AnchorSpec };

export type AnchorSpec =
  | string                                                       // 'center' | 'boundary' | …
  | { readonly name: string; readonly opts?: Readonly<Record<string, unknown>> };

export interface BaseConnectorSpec {
  readonly kind: string;
  readonly source: ConnectorEndpointSpec;
  readonly target: ConnectorEndpointSpec;
  readonly waypoints?: ReadonlyArray<Point>;
  readonly router?: string;                                      // default 'straight'
  readonly routerOpts?: Readonly<Record<string, unknown>>;
  readonly pathStyle?: string;                                   // NEW; default 'normal'
  readonly pathStyleOpts?: Readonly<Record<string, unknown>>;
  // unchanged
  readonly sourceMarker?: MarkerShapeSpec;
  readonly targetMarker?: MarkerShapeSpec;
  readonly stroke?: ShapeStroke;
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
}
```

Defaults preserve current behaviour: omitting `router` gives `straight`; omitting `pathStyle` gives `normal`; omitting `anchor` on a shape endpoint gives `center` (matches today's `spec.x, spec.y`-based resolution semantically).

---

## Stage 1 — Anchor

### Function signature

```ts
type Anchor = (
  endpoint: ConnectorShapeEndpoint,                              // { kind: 'shape', shapeId, anchor? }
  fromPoint: Point,                                              // the OTHER endpoint, used for ray projection
  ctx: AnchorCtx,
) => AnchoredPoint;                                              // { x, y, tangent? }

interface AnchorCtx {
  getShape(id: string): { spec: BaseShapeSpec; bounds: Rect; intersect?(localFrom: Point): Point | null };
}
```

### Built-ins

- **`center`** (default) — bounding-box center of the referenced shape. Equivalent to current behaviour. Always returns a point; never null.
- **`boundary`** — ray from `fromPoint` to shape origin, intersected with the shape silhouette. Falls back to AABB intersection if the shape provides no `intersect` method. Tangent is set perpendicular to the boundary normal at the intersection point.
- **`port:<name>`** — *deferred*; needs a port system on shapes.

### Two-pass resolution

Anchors need `fromPoint`, but `fromPoint` is itself an anchor result. Resolved with a cheap two-pass approach in `PrimitivesRenderer.routePath`:

1. **Pass 1** — resolve both endpoints with the `center` anchor (or the literal point for `kind: 'point'`).
2. **Pass 2** — re-resolve each endpoint with its declared anchor, passing the pass-1 point of the *other* endpoint as `fromPoint`.

Boundary intersection always projects from the other endpoint's center. Stable, deterministic, no fixed-point iteration.

### `IShape.boundaryIntersect` (new optional method)

```ts
// in IShape / ShapeBase
boundaryIntersect?(localFrom: Point): Point | null;
```

`ShapeBase` provides a default that intersects the ray from `localFrom` to `(0, 0)` with `this.bounds()` (AABB). Geometric shapes override:

- `CircleShape` — analytical (point on circle along the ray direction).
- `EllipseShape` — analytical (parametric ellipse intersection).
- `PolygonShape` — walk edges, return nearest segment intersection.
- `RectShape` — keeps the AABB default.
- `PathShape` — keeps the AABB default for v0; can override later.

Without this method, the `boundary` anchor visually works for rectangles and approximates for circles (a few pixels off). Override roll-out can lag the anchor stage shipping.

---

## Stage 2 — Router

### Function signature

```ts
type Router = (
  source: AnchoredPoint,
  target: AnchoredPoint,
  waypoints?: ReadonlyArray<Point>,
  opts?: Readonly<Record<string, unknown>>,
) => Polyline;
```

**Routers return `Polyline` (Point[]), not `Path`.** This reverses `primitives-redesign-plan.md` §Phase 1b ("convert routers to return `Path`"). Curves are no longer router output — they belong to pathStyle.

### Built-ins

- **`straight`** (default) — `[source, ...waypoints, target]`. Already implemented; signature change only (drop M/L wrapping).
- **`manhattan`** — H/V segments only. L-shape for `dx, dy ≠ 0`; stair when waypoints anchor mid-segments. Source/target tangent (from anchor) chooses initial leg direction when present.
- **`orthogonal`** — manhattan + side-aware port handling. Identical to `manhattan` until shapes declare port sides.
- **`metro`** — manhattan but corners constrained to 45° angles (3 segments per bend). Common for transit-style diagrams.
- **`er`** — perpendicular exit from rectangular shapes; closest face automatically. Sensible default for ER diagrams.
- **`oneSide`** — forces routing to leave source on a specified side, loop around, return to target. Useful for "all-on-one-side" layouts.

### What's removed

`orthogonal-rounded` — the special-case router introduced in `primitives-redesign-plan.md` — does not exist. Its capability is `router: 'orthogonal' + pathStyle: 'rounded'`.

`bezier` and `curve` routers from the redesign plan are not routers — they move to pathStyle.

---

## Stage 3 — PathStyle

### Function signature

```ts
type PathStyle = (
  polyline: Polyline,
  opts?: Readonly<Record<string, unknown>>,
) => Path;
```

Pure geometric transform — no shape context, no spec, just polyline-in / Path-out.

### Built-ins

- **`normal`** (default) — `M, L, L, …`. Sharp segments. Single-segment polyline → `[M, L]` (equivalent to old `straight` router).
- **`rounded`** — replaces interior corners with quadratic arc fillets of radius `r` (configurable, defaults sensibly). Emits `M, L, Q, L, Q, L, …`. Two-point polyline degrades to `normal`.
- **`smooth`** — Catmull-Rom spline through polyline points → cubic beziers. Emits `M, C, C, …`. Preserves polyline endpoints exactly. Replaces the redesign plan's `curve` router.
- **`bezier`** — single cubic between `polyline[0]` and `polyline[last]` with auto-generated control points. Intermediate polyline points are *ignored* for v0 (a future option `useWaypointsAsControls: boolean` can opt in to control-hint behaviour). Emits `M, C`. Replaces the redesign plan's `bezier` router.
- **`jumpover`** — *deferred*. `normal` + arc hops over crossings; cosmetic.

### Auto-control-point strategy for `bezier` (no-waypoint case)

Direction-aware s-curve:
- `axisVec` = horizontal `(1, 0)` if `|dx| ≥ |dy|`, else vertical `(0, 1)`.
- `c1 = source + axisVec * dist * tension`
- `c2 = target − axisVec * dist * tension`
- `tension` defaults to `0.5`; configurable via `pathStyleOpts.tension`.
- Override `axis: 'h' | 'v' | 'auto'` via opts; default `'auto'`.

Produces a clean s-curve for both horizontal and vertical layouts. When the source/target anchor provides a `tangent`, prefer `tangent` over the axis heuristic.

---

## `PrimitivesRenderer` changes

```ts
class PrimitivesRenderer {
  private routerRegistry = new Map<string, Router>();
  private pathStyleRegistry = new Map<string, PathStyle>();      // NEW
  private anchorRegistry = new Map<string, Anchor>();            // NEW

  registerRouter(name: string, fn: Router): void;
  registerPathStyle(name: string, fn: PathStyle): void;          // NEW
  registerAnchor(name: string, fn: Anchor): void;                // NEW

  private routePath(spec: BaseConnectorSpec): Path {
    // Pass 1 — center / literal points
    const sourceCenter = this.resolveEndpointCenter(spec.source);
    const targetCenter = this.resolveEndpointCenter(spec.target);

    // Pass 2 — declared anchor with the other endpoint's center as fromPoint
    const source = this.resolveAnchor(spec.source, targetCenter);
    const target = this.resolveAnchor(spec.target, sourceCenter);

    // Stage 2 → Stage 3
    const router = this.routerRegistry.get(spec.router ?? 'straight')!;
    const pathStyle = this.pathStyleRegistry.get(spec.pathStyle ?? 'normal')!;
    const polyline = router(source, target, spec.waypoints, spec.routerOpts);
    return pathStyle(polyline, spec.pathStyleOpts);
  }
}
```

`Connector` class and `ConnectorBase` are untouched — they still receive a `Path` and walk it. Markers still attach via `tangentAt(path, 0)` / `tangentAt(path, 1)` on the final Path; the anchor → router → pathStyle pipeline is transparent to the marker stage.

---

## Migration phases

### Phase A — pathStyle stage

1. Add `pathStyleRegistry` to `PrimitivesRenderer`. Add `BaseConnectorSpec.pathStyle?` and `pathStyleOpts?`.
2. Implement built-ins: `normal`, `rounded`, `bezier`, `smooth`. Files under `primitives/connectors/pathStyles/`.
3. Convert `straight` router signature: returns `Polyline` (Point[]) instead of `Path`. Delete the M/L wrapping; `normal` pathStyle re-introduces it.
4. Update `routePath` to compose `router → pathStyle`.
5. Storybook stories — `straight` × `{normal, rounded, smooth, bezier}` (4 stories, visually distinct).

Independently shippable: existing connectors keep working with default `'normal'` pathStyle.

### Phase B — anchor stage

1. Add `anchorRegistry`. Extend `ConnectorEndpointSpec` shape variant with `anchor?`.
2. Implement `center` (default), `boundary`.
3. Add optional `IShape.boundaryIntersect`. AABB default in `ShapeBase`. Override in `CircleShape` (analytical), `EllipseShape` (analytical), `PolygonShape` (segment-walk).
4. Two-pass resolution in `routePath`.
5. Storybook story — connectors between circles/rects with `anchor: 'boundary'` end on the boundary, not inside.

Independently shippable: connectors without explicit anchor keep `center` semantics.

### Phase C — non-trivial routers

1. `manhattan`, `orthogonal`, `metro`, `er`, `oneSide`. Files under `primitives/connectors/routers/`.
2. Storybook stories: `manhattan × {normal, rounded, smooth}` (3); `er × normal` (1); `metro × normal` (1).

---

## File-level migration

| Today / planned | Becomes | Notes |
|---|---|---|
| `primitives/connectors/routers/straight.ts` | unchanged file, signature returns `Polyline` not `Path` | strip M/L wrapping |
| `primitives/connectors/routers/bezier.ts` (planned in redesign) | **moves to** `primitives/connectors/pathStyles/bezier.ts` | now a pathStyle |
| `primitives/connectors/routers/curve.ts` (planned in redesign) | **moves to** `primitives/connectors/pathStyles/smooth.ts` | renamed + re-categorized |
| `primitives/connectors/routers/orthogonal-rounded.ts` (planned in redesign) | **DELETED** | expressed as `orthogonal + rounded` |
| **NEW** | `primitives/connectors/pathStyles/{normal, rounded, smooth, bezier}.ts` | pathStyle registry |
| **NEW** | `primitives/connectors/anchors/{center, boundary}.ts` | anchor registry |
| **NEW** | `primitives/connectors/routers/{manhattan, orthogonal, metro, er, oneSide}.ts` | topological routers (Phase C) |
| `primitives/PrimitivesRenderer.ts` | three registries + two-pass anchor resolution | core pipeline change |
| `primitives/types.ts` | `BaseConnectorSpec` + `ConnectorEndpointSpec` extended | spec changes |
| `primitives/base/ShapeBase.ts` | adds default `boundaryIntersect` | AABB ray intersect |
| `primitives/shapes/{CircleShape, EllipseShape, PolygonShape}.ts` | override `boundaryIntersect` | analytical / segment-walk |
| `primitives/connectors/Connector.ts` | unchanged | still walks Path |
| `primitives/base/ConnectorBase.ts` | unchanged | markers still post-pathStyle |

---

## Reconciliation with `primitives-redesign-plan.md`

The redesign plan needs a small follow-up edit (separate change, after this plan is approved):

- **§4 (Connector kinds are on the wrong axis)** — conclusion is reversed. Visual variation does NOT belong solely to the router; it splits across router (topology) and pathStyle (visual style). Add a footnote pointing to this plan.
- **§Canonical Terminology** — `Router` definition becomes "outputs Polyline, not Path". New entries: `Anchor`, `PathStyle`.
- **§New Folder Structure** — add `pathStyles/` and `anchors/` siblings to `routers/`.
- **§Migration Phase 1b** — replace "convert routers to return Path" with "convert routers to return Polyline + add pathStyle stage". `bezier`, `curve`, `orthogonal-rounded` move out of the router list.
- **§Phase 5 (Waypoints)** — semantics of waypoints clarifies: routers receive them; pathStyles do not (pathStyle only sees the polyline). Future `useWaypointsAsControls` opt is explicitly a routerOpts/pathStyleOpts decision per case.

---

## Critical files

- [packages/canvas/src/primitives/types.ts](packages/canvas/src/primitives/types.ts) — `ConnectorEndpointSpec`, `BaseConnectorSpec`, `Path`, `Polyline`, `IShape`
- [packages/canvas/src/primitives/PrimitivesRenderer.ts](packages/canvas/src/primitives/PrimitivesRenderer.ts) — registry plumbing, `routePath` (lines 526–543 today)
- [packages/canvas/src/primitives/base/ConnectorBase.ts](packages/canvas/src/primitives/base/ConnectorBase.ts) — unchanged; markers stay post-pathStyle (lines 54–72 today)
- [packages/canvas/src/primitives/connectors/Connector.ts](packages/canvas/src/primitives/connectors/Connector.ts) — unchanged; walks Path (lines 18–66 today)
- [packages/canvas/src/primitives/connectors/pathSampling.ts](packages/canvas/src/primitives/connectors/pathSampling.ts) — `samplePath` and `tangentAt` continue to operate on Path post-pathStyle
- [packages/canvas/src/primitives/base/ShapeBase.ts](packages/canvas/src/primitives/base/ShapeBase.ts) — add default `boundaryIntersect`
- [packages/canvas/src/primitives/shapes/CircleShape.ts](packages/canvas/src/primitives/shapes/CircleShape.ts), [EllipseShape.ts](packages/canvas/src/primitives/shapes/EllipseShape.ts), [PolygonShape.ts](packages/canvas/src/primitives/shapes/PolygonShape.ts) — analytical overrides
- [primitives-redesign-plan.md](primitives-redesign-plan.md) — §4, §Canonical Terminology, §Migration Phases, §Phase 5 each get a small follow-up edit after this plan ships

---

## Verification

After each phase:

1. `pnpm --filter @invana/canvas build` — must succeed.
2. `pnpm check-types` — must succeed across the monorepo.
3. `pnpm --filter @canvas/storybook dev` — open `http://localhost:6006`. Spot-check:
   - **Phase A:** `straight` × `{normal, rounded, smooth, bezier}` — 4 stories, all visually distinct, all share the same connector spec except for `pathStyle`.
   - **Phase B:** `anchor: 'boundary'` between two circles ends on the circles' boundaries, not at their centers.
   - **Phase C:** `manhattan` × `{normal, rounded, smooth}` looks right; `er` and `metro` produce expected topologies.
4. No tests in `packages/canvas` per project rule.

---

## Out of scope

- **Waypoint semantics for `bezier` pathStyle** (control-point hints). v0 ignores intermediate polyline points; revisit in a follow-up if needed.
- **`jumpover` pathStyle.** Cosmetic; defer.
- **Named ports** (`port:<name>` anchor variant). Needs a port system on shapes — separate plan.
- **Tests for `packages/canvas`.** Per project rule.
- **Storybook story rewrites beyond new pipeline coverage.**
- **`primitives-redesign-plan.md` follow-up edits.** Tracked above; land separately after this plan is approved.
