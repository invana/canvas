# CLAUDE.md — packages/graph-layout-d3-force (`@invana/graph-layout-d3-force`)

D3 force-directed `Layout` for `@invana/graph`.

**Status:** skeleton.

```ts
const layout = new D3ForceLayout({ charge: -300 });
await layout.apply(graphLayer);
```

A `Layout` reads `layer.data`, computes positions, writes them back. It does not register with the canvas, render, or subscribe to input (proposal §2.3).

## Groups — attraction, not containment

`cluster: { strength }` pulls every member of a group (and the frame itself) toward
that group's centroid each tick. It is **not** a container layout: members stay
loose and can drift outside the frame. For true nested boxes use `ElkLayout`
(native compound) or a `SubgraphPositionLayout` with `includeGroups` — this layout
is iterative, so laying each group out separately would mean N nested simulations.

Two rules it shares with the rest of the layouts:

- **Only real groups cluster.** A group is a node whose resolved style carries
  `group` (`GraphLayer.isGroupNode`). `parentId` alone is the shared hierarchy
  field, so clustering on it would drag every tree parent's children into a blob.
- **Collapsed-group members are excluded** from both the live and the static
  snapshot (via `isPlaceableNode`). Collapse-hiding is derived, never stored, so a
  plain `hidden` check used to simulate invisible nodes and let them push the
  visible graph around.

## `animate: true` vs `animate: false`

Two distinct execution models — pick per use case:

- **`animate: true`** (default) — a **live, interactive** simulation. d3 owns the
  tick loop on the main thread; positions write back every tick (the renderer
  animates the settle), and external nudges (drag, cursor-follower, pin flips)
  reheat α so neighbours readjust. Stays on the main thread because the tick loop
  reads/writes the store and reacts to events every frame — a worker round-trip
  would wreck the drag feel.
- **`animate: false`** — a **static one-shot**. Solve to convergence, commit the
  settled positions in a single paint, done. No per-tick repaint storm, no
  interactivity. This is the path that runs in a Web Worker (below). Use it for
  large / streamed graphs where the live animation costs too much.

## Worker (the `animate: false` static settle)

The static settle runs **off the main thread in a Web Worker**, so converging a
graph (~hundreds of force ticks, each `O(N log N)`) doesn't freeze paint / input.
Mirrors `ElkLayout`'s off-thread approach; the freeze is most visible when a
streaming loop re-applies the active layout on every chunk.

Three files, one shared implementation:

- **`forceSolver.ts`** — the pure solve (`solveForces(input) → positions`). No DOM,
  no `@invana` imports. Runs **identically** in the worker and in the main-thread
  fallback, so there's no duplicated force-building.
- **`forceSolver.worker.ts`** — the worker entry point: a thin
  `onmessage → solveForces → postMessage(positions)` shim. Exists only because a
  worker boots from its own module. It's the **second tsup entry** (`entry: ['src/index.ts',
  'src/forceSolver.worker.ts']`) so it lands at `dist/forceSolver.worker.js`, which the
  default `workerFactory` references via `new Worker(new URL('./forceSolver.worker.js',
  import.meta.url), { type: 'module' })` — the pattern Vite / webpack 5 / Rollup bundle
  as a worker asset.
- **`D3ForceLayout.ts`** — orchestration: serialises the snapshot into a
  transferable `ForceSolveInput` (`collide.radius`, the only function-valued
  option, is pre-resolved to a per-node array so nothing un-cloneable crosses the
  boundary), dispatches to a lazily-created / reused worker, and drops stale
  results via a monotonic `solveToken` when a newer run supersedes an in-flight one.

**Fallback is mandatory and silent.** No `Worker` global (Node / SSR / tests),
factory throws, or a worker runtime error → `solveForces` runs synchronously on
the main thread (correct, just blocking). Override the worker via
`workerFactory`. The worker is a pure optimisation, **never** a correctness
dependency.

**Incremental reheat.** An incremental streaming add (most nodes already settled)
reheats to `reheatAlpha` (default `0.5`) instead of a full `alpha = 1`
re-layout, so the existing arrangement stays stable while new nodes settle in.
First run (nothing settled yet) uses the full `alpha`.

## When does a layout need a worker?

A worker is **only** worth it for solves heavy enough to perceptibly freeze the
main thread at the scales the layout runs. It is not free — serialization, an
async hop, a second bundle entry, and a fallback path. For a layout that finishes
in well under a frame, the `postMessage` round-trip costs **more** than the
compute. So it's a deliberate per-layout call driven by algorithmic cost:

| Layout | Solve cost | Worker? |
|---|---|---|
| `d3-force` | iterative, ~300 ticks × `O(N log N)` | ✅ this package (custom worker) |
| `elkjs` | super-linear graph algorithm | ✅ already (elkjs's prebuilt `elk-worker.min.js`) |
| `d3-hierarchy` (tree / cluster / radial) | single `O(N)` tidy-tree pass | ❌ runs in under a frame |
| `d3-hierarchy` (pack / sunburst) | ~`O(N log N)`, one pass | ❌ fast enough in practice |
| `geometric` (grid / snake / circular) | trivial `O(N)` arithmetic | ❌ never |
| `d3-sankey` | bounded iterative relaxation, small DAGs | ❌ typically tiny / fast |

Rule of thumb: **iterative or super-linear** solvers (force, ELK) earn a worker;
**closed-form / single-pass** layouts (hierarchy, geometric, sankey) compute in
one fast pass and don't. The two heavy layouts use *different* worker sources
(this package's custom worker vs. elkjs's prebuilt one), so there is no shared
"run any layout in a worker" harness yet — and with only two, building one would
be premature. Extract a shared harness only when a third heavy iterative layout
lands.
