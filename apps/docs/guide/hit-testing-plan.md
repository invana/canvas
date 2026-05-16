# Hit-testing — plan

Status: draft, awaiting review. Two coupled changes packaged together:

1. Move hit-area ownership from `PrimitivesRenderer` into `ShapeBase` / `ConnectorBase` (the primitives that already know their own geometry).
2. Add a renderer-level **screen-pixel hit floor** so tiny on-screen shapes / edges stay hoverable at low camera zoom.

Plus an architectural note on how this composes with future ER-style composite hosts (tables of columns, etc.).

## Why

### Problem 1 — hover misses tiny visuals

`PrimitivesRenderer.wireShapePointer` / `wireConnectorPointer` set `gfx.hitArea` against geometry in **world units**:

- Shape — `containsFn(x, y) = inst.shape.contains(x, y)` (e.g. circle: `x² + y² ≤ r²`).
- Connector — `distanceToPolylineSq(path, x, y) ≤ (strokeWidth / 2 + 4)²`. The `4` slop is also a world constant.

At low camera zoom (or for shapes that are small in world units), the visible render is fatter than the mathematical shape because of anti-aliasing and pixel quantisation. The cursor sits on a screen pixel that visually overlaps the shape, but its world-coord projection is many world units from the shape — geometrically outside. `pointerover` never fires.

Concrete: `radius: 16` world units at `camera.scale = 0.05` renders at `1.6 px` (≈ 1 anti-aliased dot). The cursor lands on the visible dot but its world-space distance from centre can be `~20` world units — outside `r = 16`. Miss.

### Problem 2 — `PrimitivesRenderer` owns shape geometry it shouldn't

Hit-test geometry *is* part of a shape's identity. `wireShapePointer` reaches into `inst.shape.contains` and passes it to Pixi. That delegation is fine, but it forces the renderer to know the wiring detail. A cleaner model: `ShapeBase` sets its own `gfx.hitArea` at mount, and the renderer only wires events. Same for connectors.

The renderer keeps responsibility for:
- pointer wiring (`gfx.on('pointerover', …)`),
- world-coord translation,
- re-emit as typed `shape:pointerover` / `connector:pointerover` on the renderer event bus,
- the screen-pixel floor (interaction policy, not geometry — see below).

## Design principles

1. **Geometry belongs to the primitive.** A `Shape` already knows `contains(x, y)`. Setting `gfx.hitArea` from that data lives in `ShapeBase`, not in the renderer.
2. **The screen-pixel floor is an interaction *policy*, not geometry.** A `Circle` is a circle — that's its shape. "Clicks within 6 screen px of any shape always count" is a UX rule about how the renderer presents primitives to the user. It belongs in `PrimitivesRenderer`, layered on top of the primitive's geometric `contains`.
3. **Primitives stay domain-free.** Per `packages/canvas/CLAUDE.md`, no primitive references domain concepts (table, column, port, …). ER-style composite hosts are domain-level compositions of flat primitives, not a new kind of primitive.
4. **No new public API surface unless earned.** Don't add a `getHitArea()` method; the shape already exposes `contains` and a `gfx`. The wiring just moves into the base class.

## Architecture

### Primitive owns its `hitArea`

```
ShapeBase
├─ gfx              (Pixi.Graphics — drawn content)
├─ contains(x, y)   (existing — exact local-space geometry test)
└─ mount() {
     this.gfx.eventMode = 'static';
     this.gfx.hitArea = { contains: (x, y) => this.contains(x, y) };
   }
```

Same shape for `ConnectorBase`. Connector `contains` needs the resolved `path` (router output) — already cached on the instance; we move that ownership onto `ConnectorBase` so connector hit-test is self-contained.

### Renderer owns the screen-px floor (interaction policy)

When the renderer wires events on a shape, it replaces the geometric-only `hitArea` with one that ORs in the screen-px floor:

```
// renderer at wire time
const geometric = inst.shape.gfx.hitArea.contains;  // set by ShapeBase
inst.shape.gfx.hitArea = {
  contains: (x, y) => geometric(x, y) || this.withinScreenFloor(x, y),
};
```

`withinScreenFloor(x, y)` reads `this.camera.scale` per call (cheap; no `camera:zoom` subscription needed) and tests `(x² + y²) ≤ (MIN_HIT_PX / scale)²` for shapes, `distanceToPolylineSq(path, x, y) ≤ (MIN_HIT_PX / scale)²` for connectors.

Effect: the floor is a backstop. Big shapes hit via geometry; tiny shapes hit via floor; the floor never *shrinks* a hit area.

### Both hit-test paths share the same logic

`PrimitivesRenderer.hitTest(worldX, worldY)` is the manual rbush-backed path used by lasso / brush behaviours and programmatic queries. The floor must apply there too — otherwise federated events and manual queries disagree.

Two adjustments:

- `HitIndex.query(x, y, padWorld)` — accept a world-unit pad on the query bbox. Callers pass `MIN_HIT_PX / camera.scale`. Without this, rbush prunes tiny shapes from the candidate set before the floor can rescue them.
- After candidate generation, the `contains` test is the same floor-wrapped `contains` used by federated events. Extract a `containsWithFloor(inst, x, y)` helper on the renderer so both paths call it.

### ER-readiness — flat primitives compose

ER tables, columns, swimlanes, ports are **domain compositions of flat primitives**, modelled in a future `@invana/er` package. The primitive layer never sees these concepts.

Example: a table with three columns is **four primitives**, not one:

```
shape "table-customers"              ← rect, background + header
shape "table-customers.col-id"       ← thin rect, child position inside table bounds
shape "table-customers.col-name"     ← thin rect
shape "table-customers.col-email"    ← thin rect
```

Each is its own `ShapeInstance` with its own id, its own `contains`, its own `gfx.hitArea`, its own hover decoration target. The renderer treats them all the same.

The parent-of relationship lives in the domain layer's store:

```
ERLayer.state.parentOf = {
  'table-customers.col-id':    'table-customers',
  'table-customers.col-name':  'table-customers',
  ...
}
```

Lineage edges anchor to column ids directly:

```
connector "lineage-1"
  source: 'table-orders.col-user_id'
  target: 'table-customers.col-id'
```

"Hover column → highlight lineage neighbours + parent table" is a domain-aware hover behaviour (`LineageHoverBehaviour`, future) that:

1. Listens to `renderer.events.on('shape:pointerover')` as today.
2. On hover of a column id, does BFS over the lineage graph (existing `HoverActivateBehaviour` pattern) to collect connected column ids + edge ids.
3. Reads `parentOf[id]` to also apply a state to the parent table.

No new primitive API surface. No event bubbling. No sub-hit-areas. No composite primitive.

#### When sub-hit-areas would become necessary

Only as a perf escape hatch if profiling shows that "50 columns × 1000 tables" (50k thin rects + their gfxes) is unmanageable. In that case the API evolution is:

```ts
interface IShape {
  contains(x, y): boolean;                                  // existing
  getSubAreas?(): Array<{ subId: string; contains(x, y): boolean }>;  // new, optional
}
```

The renderer's hover emit would gain an optional `subId`. **Not in scope for this plan**; flagged here so the `getSubAreas?` evolution path is preserved.

## Changes by file

### `packages/canvas/src/primitives/base/ShapeBase.ts`

- In `mountTo(parent)` (or equivalent constructor / lifecycle):
  - Set `this.gfx.eventMode = 'static'`.
  - Set `this.gfx.cursor = 'pointer'` (carry over from renderer).
  - Set `this.gfx.hitArea = { contains: (x, y) => this.contains(x, y) }`.
- Document: hit area is set from the geometric `contains`. Renderer may *override* with a wrapped version to add interaction policy.

### `packages/canvas/src/primitives/base/ConnectorBase.ts`

- Add an `_path: Path` field. Connector keeps its own resolved path (mirrors `ConnectorInstance.path`, which becomes the renderer's view of the same data — see below).
- Add `setPath(path: Path)` method called by the renderer after routing.
- In mount:
  - `this.gfx.eventMode = 'static'`, cursor, etc.
  - `this.gfx.hitArea = { contains: (x, y) => distanceToPolylineSq(this._path, x, y) <= this.tolSq() }`.
  - `tolSq()` reads the spec's stroke width: `(stroke.width / 2 + 4)²` (the world-constant slop stays here as the geometric default; the screen-px floor is applied by the renderer on top).

### `packages/canvas/src/instancing/ConnectorInstance.ts`

- `path` field stays as the renderer's cache. After router resolves a path, renderer calls `inst.connector.setPath(inst.path)` so the primitive sees the same data.
- Alternative: drop `inst.path` entirely, only `inst.connector.path`. Cleaner, but touches more call sites — prefer to keep both initially and consolidate in a follow-up if it stays in sync.

### `packages/canvas/src/primitives/PrimitivesRenderer.ts`

- `wireShapePointer` — drop the `hitArea` setup (now in `ShapeBase`). Wrap the existing `hitArea.contains` with the screen-px floor at wire time. Rename to `wireShapeEvents` to reflect its narrowed scope.
- `wireConnectorPointer` — same: drop `hitArea` setup, wrap with floor, rename to `wireConnectorEvents`.
- Add a `private readonly MIN_HIT_PX` constant (proposed default `6`).
- Add a `private withinShapeFloor(localX, localY): boolean` helper.
- Add a `private withinConnectorFloor(localX, localY, path): boolean` helper.
- Add a `private containsWithFloor(inst, worldX, worldY): boolean` helper used by `hitTest`.
- `hitTest(worldX, worldY)` — query rbush with `pad = MIN_HIT_PX / camera.scale`; for each candidate, use `containsWithFloor` instead of the raw `inst.shape.contains` / `distanceToPolylineSq` check.
- `connectorHitToleranceSq` — keep, but mark "geometric only". The floor application sits in the helper.
- After path recompute (`recomputeConnectorPath`, `reanchorAllConnectors`, `reRouteAllConnectors`), call `inst.connector.setPath(inst.path)` so primitive-owned hit area stays in sync.

### `packages/canvas/src/hit/HitIndex.ts`

- `query(x, y)` → `query(x, y, padWorld = 0)`. Search rect becomes `{ minX: x - pad, minY: y - pad, maxX: x + pad, maxY: y + pad }`.
- Existing callers of `query(x, y)` keep working (default `padWorld = 0`).

### Documentation

- `apps/docs/guide/primitives.md` — add a short "Hit-testing" section: primitives own their geometric hit area via `contains` and `hitArea`; the renderer adds a screen-pixel floor on top.
- TSDoc on `ShapeBase.mountTo`, `ConnectorBase.setPath`, `PrimitivesRenderer.containsWithFloor` per the project's "doc the source, not the data model" rule.

### Non-changes

- `HoverActivateBehaviour`, `GraphLayer`, `MiniMapLayer` — untouched. They subscribe to renderer events; the event surface is unchanged.
- `EdgeSizeLODBehaviour`, `NodeSizeLODBehaviour` — untouched. They scale visual size; the floor is independent.
- Decorations / effects — untouched. Decorations don't set their own `eventMode = 'static'` today; their gfxes are passive overlays.

## Risks / open questions

### 1. Does Pixi 8 prune children before our `hitArea.contains` runs?

Pixi's `EventBoundary` may use parent global bounds to prune recursion before testing a child's `hitArea`. If yes, our floor never gets a chance because the tiny child gets pruned at the parent (layer container) level.

**Verification step**: at low zoom, set a breakpoint in `containsFn` and confirm it's called. If it's not, two mitigations:

- Set `gfx.boundsArea = new Rectangle(-MIN_HIT_PX/scale, -MIN_HIT_PX/scale, …)` to force a non-degenerate global bounds. Needs re-evaluation per `camera:zoom`, so we'd subscribe to scale changes — small cost.
- Make the layer container itself non-pruning by setting `interactiveChildren = true` and an explicit hitArea. (Default Pixi behaviour, but worth confirming.)

This is the most important unknown; address before writing code.

### 2. `MIN_HIT_PX` value

Proposed `6`. Touch-target guidelines argue `8`–`10`; cursor precision argues `4`. Pick once for the renderer; promote to a `PrimitivesRendererOptions` field if a story needs a different value.

### 3. Floor for non-centroid-origin shapes

For `polygon` / `path` shapes, the local origin is `(0, 0)` and may not match the geometric centroid. The floor test `(x² + y²) ≤ floor²` would then be biased toward one corner of the shape. Two options:

- Accept the bias as a corner case. The floor only kicks in when the geometric test fails; a click outside a polygon but near `(0, 0)` would now hit. Edge-case only relevant for very tiny / degenerate polygons.
- Cache a centroid on each shape (compute once when geometry is set) and floor-test against centroid. More correct, slightly more code.

Recommendation: ship with origin-based floor, document the bias, upgrade to centroid if a story exposes the issue.

### 4. Connector primitive owning `path` — duplication vs. ownership

Today `ConnectorInstance.path` is the single source of truth, set by the renderer after `routePath`. Moving (a copy of) it onto `ConnectorBase` so the primitive's `hitArea` can read it introduces a sync point. Mitigations:

- Renderer's `recomputeConnectorPath` / `reanchorAllConnectors` / `reRouteAllConnectors` calls `inst.connector.setPath(inst.path)` explicitly. Two call sites total — easy to keep aligned.
- Or pass a `() => Path` getter to `ConnectorBase` at construct time, so the primitive reads through to `inst.path` without copying. Avoids sync entirely but tangles ownership.

Lean toward the explicit `setPath` — clearer ownership semantics, sync points are obvious.

### 5. Decoration / badge interception

Need to confirm no decoration sets `eventMode = 'static'` on its overlay gfx. A quick grep before merge.

## Validation

### Reproducer

Any Graph story with `WheelZoomBehaviour` enabled. Zoom out until nodes are ≤ 2 screen px. Try to hover. Before fix: `HoverActivateBehaviour` doesn't fire. After fix: hover fires within `MIN_HIT_PX` of node centre.

Apply the same to a connector-heavy story (e.g. Routes Delaunay). Edges should stay hoverable at any zoom.

### Manual checks

- Big shape (`radius: 100`, zoom 1.0) — hover boundary matches the visible circle (floor is not triggered).
- Small shape (`radius: 16`, zoom 0.05) — hover triggers within ~6 px of centre.
- Connector at low zoom — hover triggers within ~6 px of the polyline.
- Lasso / brush selection (uses `PrimitivesRenderer.hitTest`) — tiny shapes selectable.
- `MiniMapLayer` (also uses `hitTest`) — click-to-jump still works.

### No new story required

The fix is hit-test plumbing, not a new primitive. Rule 11 doesn't apply. If interactive demonstration is wanted, add a `Min hit px` slider to an existing graph hover story and let the reviewer feel it.

## Sequencing

Two PRs is the cleanest split:

1. **PR 1 — `hitArea` ownership move.** `ShapeBase` / `ConnectorBase` set their own `hitArea`; renderer's `wireShapePointer` / `wireConnectorPointer` stop touching it; rename to `wireShapeEvents` / `wireConnectorEvents`. No behaviour change end-to-end.
2. **PR 2 — screen-pixel floor.** Renderer wraps the primitive-set `hitArea` at wire time; `HitIndex.query` gains `padWorld`; `hitTest` uses `containsWithFloor`. Adds the new behaviour.

Can also land as one PR; the split exists for review hygiene (1 is structural, 2 is behaviour).

## Out of scope

- Sub-hit-areas inside a single composite primitive (`getSubAreas?`). Documented as a future evolution; not implemented.
- Hover routing between Pixi and MapLibre (the prior conversation about `passInputToMap`). Tracked separately.
- Configurable `MIN_HIT_PX` per layer / per shape kind. Renderer constant for now.
- Tests for any of this in `packages/canvas`. Per project rule 10, no tests in that package unless explicitly asked.
