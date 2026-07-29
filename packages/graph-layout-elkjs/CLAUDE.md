# CLAUDE.md — packages/graph-layout-elkjs (`@invana/graph-layout-elkjs`)

[ELK](https://eclipse.dev/elk/) `Layout` for `@invana/graph`. Wraps the
`elkjs` JS port (no wasm). The solve runs **off the main thread in a Web
Worker** by default — see [Worker](#worker) below.

```ts
import { ElkLayout } from '@invana/graph-layout-elkjs';

const layout = new ElkLayout({
  algorithm: 'layered',
  direction: 'RIGHT',
  nodeSpacing: 30,
  layerSpacing: 80,
});
layout.events.on('end', () => canvas.camera.fitContent(graphLayer.getBounds(), 80));
await layout.apply(graphLayer);
```

## Lifecycle

ELK is **one-shot** — there is no tick simulation. A single `apply()`
call:

1. snapshots `layer.store` (nodes + edges, resolving width/height per node),
2. builds an ELK `root` graph with the merged property bag,
3. awaits `elk.layout()`,
4. converts ELK's top-left coordinates to canvas centre coordinates and
   bulk-writes them via `store.setPositionsBulk`,
5. emits `tick` once, then `end: { reason: 'completed' }`.

`stop()` (or a second `apply()` call) bumps a monotonic run token. The
in-flight ELK Promise still settles — `elkjs` has no cancel API — but its
result is dropped and `end: { reason: 'stopped' }` fires immediately.

## Worker

The ELK solve runs in a **Web Worker** (`elkjs/lib/elk-worker.min.js` via the
`elk-api` build). The algorithm is CPU-heavy and super-linear in graph size, so
running it on the main thread — which is what `elk.bundled.js`'s synchronous
"fake worker" does — freezes paint and input for the whole computation. That
freeze is most visible when a one-shot layout re-runs on every streaming update
(`GraphCanvas` re-applies the active layout whenever nodes are added). Moving
the solve to a worker keeps the UI responsive.

One worker is created **lazily on the first `apply()`** and reused for the
instance's lifetime — a layout that's registered but never run never spawns a
worker. The default factory does
`new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url), { type: 'classic' })`,
which Vite / webpack 5 / Rollup statically detect and bundle as a worker asset
(verified: a Storybook production build emits a standalone `elk-worker.min.*.js`).
Override with `workerFactory` when a bundler needs a different idiom.

When no `Worker` global exists (Node / SSR / test runners) or worker
construction throws synchronously, `ElkLayout` falls back to the synchronous
`elk.bundled.js` build (dynamically imported, so it stays out of the worker-path
chunk) — correct, but main-thread-blocking, which is acceptable where workers
don't exist at all.

## Compound groups (`includeGroups`, default **on**)

A **group** is a node whose resolved style carries `group` (`GraphLayer.isGroupNode`).
Its members nest under it in the ELK graph, so ELK packs them inside the container
box and the frame the layer draws is the box ELK computed.

- **`parentId` alone is not a group.** It's the shared hierarchy field — it carries
  plain trees too — so only a *group node* nests. An ordinary parent/child tree lays
  out flat, exactly as it did before.
- **Container insets come from the group**, not a constant: `GroupOptions.padding`
  (default `16`) on all sides plus `headerHeight` on top, so a title band or a
  `tabbed-rect` tab gets reserved space instead of being packed into.
- **`autoFit` containers are handed no size.** Their stored width/height is the
  *previous* frame's computed fit; feeding that back as a `MINIMUM_SIZE` floor would
  let the frame grow but never shrink. A fixed-size group (`autoFit: false`) does get
  its declared size as the floor.
- **Collapsed groups are leaves.** The frame is placed as the single node the
  renderer draws; its members are excluded and keep their frozen positions. Their
  edges are re-pointed at the frame (mirroring `GraphLayer.effectiveEndpoint`) rather
  than dropped, so a collapsed group still feels the pull of its members' edges.
  Several edges collapsing onto the same pair merge into one — merged ids are skipped
  by the `edgeRouting` write-back, since they address no single stored edge.
- **Nested groups** fall out of the recursion; each level reads its own insets.
- **`elk.hierarchyHandling: INCLUDE_CHILDREN`** (edges routed *across* container
  boundaries) is applied only for algorithms that honour it — `layered` today.
  Others still nest; they just solve each container separately.

There is **one** code path: with `includeGroups: false`, or on a graph with no
groups, the builder produces exactly the flat graph it always did.

## Node sizing

ELK needs concrete `width × height` for every node. By default `ElkLayout`
reads the resolved shape's local AABB via `layer.boundsOfNode(node)`,
which routes through the shape registry's `static boundsOf` hook — every
registered shape kind (built-in *and* custom shapes registered via
`canvas.primitives.registerShape(...)`) flows through the same path
without a per-kind switch in this package. Falls back to
`defaultNodeSize` (`40 × 40`) when the renderer isn't mounted yet, the
resolved shape kind isn't registered, or the registered ctor doesn't
expose `boundsOf`.

Override per-node with `nodeSize: (node) => ({ width, height })` —
useful when the layout-time footprint must differ from the visual
footprint (e.g. label-aware padding, port reservations).

## Options surface

Convenience fields (`algorithm`, `direction`, `nodeSpacing`,
`layerSpacing`, `edgeNodeSpacing`, `edgeSpacing`, `padding`) cover the
~90% common case and map 1:1 to ELK properties. For anything else, pass
through via `layoutOptions: Record<string, string>` — keys win over the
convenience fields. See the [ELK reference](https://eclipse.dev/elk/reference.html)
for the full catalogue.

## Edge routing

`edgeRouting: 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES'` does two things: it sets
`elk.edgeRouting`, and (unlike the other convenience fields) it reads ELK's
computed bend points back out of `result.edges[].sections[0].bendPoints` and
writes them onto each edge as `style.shape.waypoints` (with `pathType: 'orth'`),
spreading any prior edge style. The `orth` router then replays them, so edges
follow ELK's node-avoiding routes instead of cutting across nodes — the way to
keep edges off nodes at scale (the client-side `manhattan` obstacle router
can't, see `code-kg` stories).

Coordinate caveat: routing assumes nodes whose `node.position` is their
**centre** (so the rendered node occupies exactly ELK's node box and bend
points line up). `circle` is centred natively; `GraphLayer.nodeSpec` centre-fits
the `composite` shape. Top-left-origin kinds like `rect` would render offset
from the routes — they'd need the same centre-fit before using `edgeRouting`.

Leaving `edgeRouting` unset keeps the prior behaviour: only node positions are
written, no edge geometry touched.
