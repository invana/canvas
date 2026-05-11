# Obstacle-Aware Routing — `manhattan` / `metro` / `er` / `oneSide`

## Context

`connectors-pipeline-plan.md` shipped four topology routers (`manhattan`, `metro`, `er`, `oneSide`) that produce H/V or 45° polylines based on endpoint geometry alone. None of them knows about other shapes in the layer — a connector routed between two boxes happily slices through a third box sitting in its path.

X6 / JointJS treat obstacle avoidance as the defining feature of the **`manhattan`** router (their `Orth` is what we currently call `manhattan` — simple H/V). The X6 docs page the user pointed at shows a yellow box mid-path being routed around. Without that, the router list looks complete but is missing the production-grade case.

This plan adds A*-based obstacle awareness to all four topology routers and aligns naming with X6 / JointJS / mxGraph: our current simple H/V router is renamed to `orth`; the name `manhattan` is reused for the new obstacle-aware A* implementation. `metro`, `er`, and `oneSide` upgrade in place — same registry key, smarter pathfinding when obstacles are present.

Obstacles are **auto-collected** by `PrimitivesRenderer`: every shape in the layer except the source and target shapes (when those endpoints are `kind: 'shape'`) is fed to the router as a `Rect`. Callers can override or opt out via `routerOpts.obstacles`.

---

## Naming change (breaking)

| Registry key | Before | After |
|---|---|---|
| `straight` | simple straight + waypoints | unchanged |
| `orth` | — (didn't exist) | **new key** — simple H/V (was `manhattan`) |
| `orthogonal` | alias of `manhattan` (simple H/V) | alias of `orth` (still simple H/V) |
| `manhattan` | simple H/V | **obstacle-aware H/V A\*** |
| `metro` | simple 45° + bend | **obstacle-aware 45° A\*** when obstacles present, falls through to current logic when not |
| `er` | stubs + simple bridge | stubs + **obstacle-aware bridge** between stubs |
| `oneSide` | forced exit + simple bridge | forced exit + **obstacle-aware bridge** to target |

Implications:

- The current `Routers/Manhattan.stories.ts` story switches to `router: 'orth'` for its simple-H/V demonstration; a **new** `Routers/Manhattan.stories.ts` is added showing obstacle avoidance.
- The internal `manhattanRouter` export becomes `orthRouter` (file renamed `routers/manhattan.ts` → `routers/orth.ts`).
- A **new** `manhattanRouter` is exported from `routers/manhattan.ts`.
- `connectors-pipeline-plan.md` and `packages/canvas/CLAUDE.md` follow-up edits (see Reconciliation).

---

## Renderer ↔ router contract change

Today `IRouter` takes `(source, target, waypoints?, opts?) → Polyline`. To pass obstacles without conflating them with per-router opts, add a fifth parameter — a `RouterCtx`:

```ts
export interface RouterCtx {
  /**
   * World-space rectangles the router should treat as obstacles. Empty array
   * means "no avoidance". The renderer collects this from layer state by
   * default; callers can override via `routerOpts.obstacles`.
   */
  readonly obstacles: ReadonlyArray<Rect>;
}

export type IRouter = (
  source: Endpoint,
  target: Endpoint,
  waypoints?: ReadonlyArray<Point>,
  opts?: Record<string, unknown>,
  ctx?: RouterCtx,
) => Polyline;
```

`ctx` is optional so the four existing simple routers (and any user-registered router) keep working without modification. Routers that care read `ctx?.obstacles ?? []`.

In `PrimitivesRenderer.routePath`:

```ts
const ctx: RouterCtx = { obstacles: this.resolveObstacles(spec) };
const polyline = router(source, target, spec.waypoints, spec.routerOpts, ctx);
```

`resolveObstacles(spec)`:

1. If `spec.routerOpts?.obstacles` is `'none'` → `[]`.
2. If `spec.routerOpts?.obstacles` is an array of `Rect` → use it verbatim.
3. Otherwise auto-collect: every `ShapeInstance` world-bounds **except** the shapes referenced by `spec.source` / `spec.target`.

```ts
type ObstaclesOpt = 'auto' | 'none' | ReadonlyArray<Rect>;
```

`'auto'` is the default and equivalent to omitting the field.

---

## Domain responsibility note (canvas vs graph)

`packages/canvas/CLAUDE.md` requires `primitives/` to be domain-free. Auto-collecting "every shape except source/target as an obstacle" is technically a graph-domain assumption — in an ER diagram, sub-cells inside a table shouldn't block edges that route between tables.

The decision is to keep canvas's default auto-collect anyway (pragmatic ergonomics for direct `PrimitivesRenderer` users) AND have domain layers inject curated obstacle lists when they're built. Both paths complement; neither is exclusive:

- **Canvas default** — when `routerOpts.obstacles` is absent or `'auto'`, the renderer auto-collects every shape except the source/target shape ids. Useful for ad-hoc primitives users (storybook stories, raw-canvas demos).
- **Domain override** — when a domain layer (`GraphLayer`, future `ErLayer`, future `SwimlaneLayer`, etc.) adds a connector, it provides `routerOpts.obstacles` explicitly with a curated `Rect[]`. The canvas auto-collect path is skipped.

For the future `@invana/graph` plan that introduces `GraphLayer`:

1. `GraphLayer.addEdge(spec)` wraps `renderer.addConnector(...)`.
2. Before delegating, derive `routerOpts.obstacles` from the layer's node set, excluding the edge's source/target node ids. Read each node's bounds via `renderer.getShapeWorldBounds(id)` (public accessor; added in the responsibility-decision plan).
3. If `spec.routerOpts.obstacles` was already supplied by the caller, respect it (don't override).
4. **Watchout:** GraphLayer adds non-node shapes (labels, badges, decorations). It must always pass an explicit list — otherwise canvas's default auto-collect treats those shapes as obstacles too. Pass a curated `Rect[]` (nodes only) or `'none'` to suppress avoidance.

This split keeps the canvas API contract small (`RouterCtx { obstacles: Rect[] }`) and pushes the policy of "what counts as an obstacle in this domain" to the layer that knows.

---

## Algorithm — A* on a coarse grid

### Grid construction (`_obstacleGrid.ts`)

Given source/target points and obstacle rects:

1. **Bounding region** — AABB containing source, target, all obstacles, padded by `margin` (default `64`) so the path can route around obstacles that sit at the edge of the source-target span.
2. **Cell size** — `gridStep` from `routerOpts` (default `16`). World units.
3. **Inflate obstacles** — each obstacle expanded by `inflate` (default `4` + half stroke) so the path doesn't graze edges.
4. **Mark blocked cells** — for each grid cell, if its centre lies inside any inflated obstacle rect, mark it blocked.
5. **Clamp** — total grid cell count clamped to a configurable maximum (default `40_000` = 200×200) so a runaway grid step doesn't allocate gigabytes. Hitting the cap returns "no path"; the caller falls back to a straight bridge.

Grid representation: a flat `Uint8Array` (`0` = free, `1` = blocked) with width × height inferred from the bounding region. Coordinate conversion utilities `worldToCell(x, y)` and `cellToWorld(cx, cy)` round to centre.

### A* (`_aStar.ts`)

Standard A* with a binary-heap priority queue:

```ts
function aStar(grid, start, goal, opts: { connectivity: 4 | 8 }): CellIndex[] | null
```

- **Connectivity 4** — H/V neighbours only. Manhattan-distance heuristic.
- **Connectivity 8** — H/V/diagonal neighbours. Octile-distance heuristic. Diagonal cost = `√2`; cardinal cost = `1`. Plus a "no-corner-cutting" rule: a diagonal move from `(cx, cy)` to `(cx+1, cy+1)` is allowed only if both `(cx+1, cy)` and `(cx, cy+1)` are free.
- **Snap to free cell** — if the literal source / target cell is blocked (e.g., the target shape's bounds got inflated and the centre fell inside), search outward in a 3×3, then 5×5 expansion until a free neighbour is found.
- **Tie-breaking** — secondary key on `h` (heuristic to goal) so A* prefers paths that head toward the goal among equal-cost frontiers. Reduces zig-zag.

Output: `CellIndex[]` from start to goal inclusive, or `null` if unreachable (caller falls back to a straight `[source, target]` polyline + console warning in dev).

### Path simplification

After A*, walk the cell path:

- Drop interior cells that are collinear with their neighbours (same direction in vs out).
- Convert remaining cells to world coordinates (cell centre).
- For 8-connectivity: collapse same-direction runs across H, V, and diagonal axes — three direction signatures, not two.

Result is a clean polyline of bend points.

### Routing-only paths (post-A*)

Each router is a thin shell around `aStar`:

```ts
manhattan: aStar(grid, source, target, { connectivity: 4 }) → simplify → world polyline
metro:     aStar(grid, source, target, { connectivity: 8 }) → simplify → world polyline (mixes H/V/45°)
er:        stubA = source + sourceTangent * stub
           stubB = target - targetTangent * stub
           bridge = aStar(grid, stubA, stubB, { connectivity: 4 }) → simplify
           → [source, stubA, ...bridge, stubB, target]
oneSide:   exit = source projected `padLength` along `side` direction
           bridge = aStar(grid, exit, target, { connectivity: 4 }) → simplify
           → [source, exit, ...bridge]
```

When `ctx.obstacles` is empty (or absent), each router skips A* entirely and uses the simple geometric construction it has today — so the no-obstacle case is fast and produces identical output to current behaviour.

### routerOpts (per router)

All four routers extend their existing `routerOpts` with shared A* knobs:

```ts
interface RouterOpts {
  // existing per-router options stay
  obstacles?: ObstaclesOpt;        // 'auto' | 'none' | Rect[]
  gridStep?: number;               // cell size in world units (default 16)
  margin?: number;                 // bounding-region padding (default 64)
  inflate?: number;                // obstacle inflation (default 4)
  maxCells?: number;               // budget cap (default 40_000)
}
```

---

## Folder structure

```
packages/canvas/src/primitives/connectors/routers/
├── _aStar.ts                ← NEW: aStar(grid, start, goal, { connectivity }), simplifyCellPath
├── _obstacleGrid.ts         ← NEW: buildObstacleGrid({ source, target, obstacles, gridStep, margin, inflate, maxCells })
├── straight.ts              ← unchanged
├── orth.ts                  ← was manhattan.ts; rename file + export `orthRouter`
├── manhattan.ts             ← NEW: obstacle-aware H/V via _aStar (connectivity 4)
├── metro.ts                 ← UPDATED: obstacle-aware path via _aStar (connectivity 8); fast path for empty obstacles
├── er.ts                    ← UPDATED: stubs + A* bridge (connectivity 4)
└── oneSide.ts               ← UPDATED: forced exit + A* bridge (connectivity 4)
```

---

## `PrimitivesRenderer` changes

```ts
private routePath(spec: BaseConnectorSpec): Path {
  // ... existing anchor pass-1 / pass-2 code unchanged

  const ctx: RouterCtx = { obstacles: this.resolveObstacles(spec) };
  const polyline = router(source, target, spec.waypoints, spec.routerOpts, ctx);
  return pathStyle(polyline, spec.pathStyleOpts);
}

private resolveObstacles(spec: BaseConnectorSpec): ReadonlyArray<Rect> {
  const opt = (spec.routerOpts as { obstacles?: 'auto' | 'none' | ReadonlyArray<Rect> } | undefined)?.obstacles;
  if (opt === 'none') return [];
  if (Array.isArray(opt)) return opt;
  // 'auto' or undefined: every shape except source/target shapes
  const excludeIds = new Set<string>();
  if (spec.source.kind === 'shape') excludeIds.add(spec.source.shapeId);
  if (spec.target.kind === 'shape') excludeIds.add(spec.target.shapeId);
  const out: Rect[] = [];
  for (const [id, inst] of this.shapeInstances) {
    if (excludeIds.has(id)) continue;
    out.push(this.shapeWorldBounds(inst));
  }
  return out;
}
```

---

## Migration phases

### Phase 1 — Rename + RouterCtx scaffolding

1. `git mv packages/canvas/src/primitives/connectors/routers/manhattan.ts orth.ts`. Export becomes `orthRouter`.
2. Update barrel export — `manhattanRouter` → `orthRouter`.
3. PrimitivesRenderer registration:
   - `'orth'` → `orthRouter`
   - `'orthogonal'` → `orthRouter` (alias unchanged in behaviour, name redirected)
   - `'manhattan'` → still `orthRouter` for one phase (no behaviour change yet)
4. Add `RouterCtx` type. Update `IRouter` signature with optional `ctx`. Existing routers don't need code changes (they ignore `ctx`).
5. Add `resolveObstacles` in `PrimitivesRenderer.routePath`. Pass `ctx` to every router call. With `manhattan` still aliased to `orthRouter`, the auto-collected obstacles are simply ignored.
6. `git mv` story `Routers/Manhattan.stories.ts` → `Routers/Orth.stories.ts`. Update title + export name to `Orth`. Switch `router: 'manhattan'` to `router: 'orth'`. Add a one-line note in the story that the obstacle-aware version under `Manhattan` is coming.

Independently shippable: existing visual output unchanged; the `manhattan` registry key still resolves to the simple router.

### Phase 2 — A* shared infrastructure

1. `_obstacleGrid.ts` — `buildObstacleGrid(...)`. World ↔ cell conversion. Inflate obstacles. Mark blocked cells. Cap total cells; return `null` on overflow.
2. `_aStar.ts` — `aStar(grid, start, goal, { connectivity })`. Binary-heap priority queue (small inline implementation, no dep). No-corner-cutting rule for connectivity 8. `simplifyCellPath(cells, connectivity) → CellIndex[]` collapsing collinear runs.
3. Tests — **none**, per `packages/canvas` rule. Visual verification only via the obstacle stories below.

Independently shippable: no router uses the new helpers yet; just dead code that compiles.

### Phase 3 — Obstacle-aware `manhattan`

1. New `routers/manhattan.ts` exports `manhattanRouter`. Implementation:
   - If `ctx.obstacles` is empty → delegate to `orthRouter` (preserves performance and exact output).
   - Otherwise build grid, run A* connectivity-4, simplify, return polyline.
   - Failure case: A* returns `null` (no path or grid cap hit) → fall back to `orthRouter` with a `console.warn` in dev.
2. PrimitivesRenderer registration: `'manhattan'` now → `manhattanRouter` (NEW). `'orth'` and `'orthogonal'` still → `orthRouter`.
3. New story `Routers/Manhattan.stories.ts` — two endpoint shapes plus 1–3 yellow obstacle rects. GUI toggles `routerOpts.obstacles` between `'auto'` and `'none'` so the user can A/B the avoidance.
4. Build + check-types + storybook spot-check.

### Phase 4 — `metro`, `er`, `oneSide` upgrades

1. `metro.ts`:
   - When `ctx?.obstacles` non-empty: A* connectivity-8, simplify (preserving 45° runs), return polyline.
   - When empty: existing 3-point geometric construction.
2. `er.ts`:
   - Compute stubA / stubB the same way as today (perpendicular along tangents, default stubLength 16).
   - When `ctx?.obstacles` non-empty: bridge via A* connectivity-4 between stubA and stubB.
   - When empty: existing `bridgeOrthogonal` per-pair construction.
3. `oneSide.ts`:
   - Compute `exit` the same way as today.
   - When `ctx?.obstacles` non-empty: A* connectivity-4 from `exit` to `target`. Polyline = `[source, exit, ...A*]`.
   - When empty: existing midBend construction.
4. Storybook updates — add an "obstacles" GUI toggle to `Metro`, `Er`, `OneSide` stories, mirroring `Manhattan`.
5. Build + check-types + storybook spot-check.

### Phase 5 — Reconciliation

1. `connectors-pipeline-plan.md` — add a footnote pointing to this plan; update §"Stage 2 — Router → Built-ins" to note `manhattan` is obstacle-aware and `orth` is the simple variant.
2. `primitives-redesign-plan.md` — small note in §"Connector kinds" router list (already a known stale section).
3. `packages/canvas/CLAUDE.md` — replace stale "Built-in routers: `straight`, `orthogonal`, `bezier`" line with the current set including `orth` and the obstacle-aware semantics.

---

## File-level changes

| Today | After | Notes |
|---|---|---|
| `routers/manhattan.ts` | `routers/orth.ts` | Renamed; export `orthRouter`. Same code. |
| **NEW** | `routers/manhattan.ts` | Obstacle-aware H/V via `_aStar`. |
| `routers/metro.ts` | `routers/metro.ts` | Adds A* fast-path; existing logic kept as fallback. |
| `routers/er.ts` | `routers/er.ts` | Bridge replaced by A* when obstacles present. |
| `routers/oneSide.ts` | `routers/oneSide.ts` | Bridge replaced by A* when obstacles present. |
| **NEW** | `routers/_obstacleGrid.ts` | Grid construction. |
| **NEW** | `routers/_aStar.ts` | A* search + path simplification + binary heap. |
| `primitives/types.ts` | updated | New `RouterCtx`; `IRouter` gains optional `ctx`. |
| `primitives/PrimitivesRenderer.ts` | updated | Three new registrations (`orth`, `orthogonal` redirect, `manhattan` rebound), `resolveObstacles`, ctx passed. |
| `primitives/index.ts` | updated | Export `orthRouter`, drop `manhattanRouter` re-export then re-add pointing to new impl, export `RouterCtx` type. |
| `apps/storybook/.../Routers/Manhattan.stories.ts` | renamed to `Orth.stories.ts` | Title + export updated; `router: 'orth'`. |
| **NEW** | `apps/storybook/.../Routers/Manhattan.stories.ts` | Obstacle-avoidance demo with toggle. |

---

## Critical files

- [packages/canvas/src/primitives/types.ts](packages/canvas/src/primitives/types.ts) — `RouterCtx`, `IRouter` signature.
- [packages/canvas/src/primitives/PrimitivesRenderer.ts](packages/canvas/src/primitives/PrimitivesRenderer.ts) — `routePath`, `resolveObstacles`, builtin registrations (~line 130).
- `packages/canvas/src/primitives/connectors/routers/_aStar.ts` — new core algorithm.
- `packages/canvas/src/primitives/connectors/routers/_obstacleGrid.ts` — new grid utility.
- `packages/canvas/src/primitives/connectors/routers/manhattan.ts` — new obstacle-aware router.
- `packages/canvas/src/primitives/connectors/routers/{metro,er,oneSide}.ts` — extend with A* fast-path.

---

## Verification

After each phase:

1. `pnpm --filter @invana/canvas build` ✓
2. `pnpm check-types` ✓
3. Storybook spot-check (port 6006):
   - **Phase 1:** `Routers/Orth` story renders identically to old `Manhattan` story; `router: 'manhattan'` (still simple) renders identically too.
   - **Phase 3:** New `Routers/Manhattan` story shows the line **routing around** an obstacle rect. Toggling `obstacles: 'none'` reverts to a straight L cutting through.
   - **Phase 4:** `Metro`, `Er`, `OneSide` stories — adding obstacles re-routes; removing them produces the original Phase C output exactly.
4. **No tests** in `packages/canvas` per project rule.

Performance sanity check (manual):

- Grid cap (`maxCells: 40_000`) hit in dev console with 30+ obstacles + small `gridStep` — should fall back to straight line, not freeze the frame.
- 5 obstacles, default `gridStep: 16`, source-to-target span ≤ 800px → A* completes inside one frame budget (< 16ms). No formal benchmark; eyeball during the storybook spot-check.

---

## Out of scope

- **Visibility-graph algorithm.** Deferred — A* covers production-grade need for grid-aligned diagrams. Visibility graph wins for arbitrary-angle connectors which we don't have.
- **JointJS-style perturbation.** Deferred — A* is more robust in dense layouts.
- **Connector-vs-connector avoidance.** Today only shapes are obstacles. Crossing connectors render normally.
- **Non-rectangular obstacles.** Circles / polygons / paths are treated as their AABB. Tighter inflation is good enough for v0.
- **Dynamic re-routing during drag.** A* runs on `addConnector` / `updateConnector`. Layers that re-route during drag pay the cost on every update — performance tuning is out of scope.
- **Tests for `packages/canvas`** per project rule.
- **Storybook story rewrites beyond the new obstacle demos.**
