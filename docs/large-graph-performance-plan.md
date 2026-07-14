# Large-graph rendering performance — plan

Working design-of-record for making `@invana/canvas` smooth on **large, crowded
graphs** — the "hairball" case: thousands of nodes and tens of thousands of edges
occupying the same screen region. Captures the **symptom**, the **measured root
cause**, the **options we're exploring**, and the **order to do them in**.

Companion to the telemetry work (branch `feat/canvas-telemetry-otel`) that we used
to *measure* all of this — see "How we measured it" below.

---

## 1. Symptom

Reference workload: the full **Game of Thrones** graph — **~4,959 nodes /
~28,679 edges** (`@invana/graph-datasets/game-of-thrones`), force-laid-out into a
dense cluster where nodes and long edges overlap heavily.

Three interactions feel choppy at this scale:

- **Zoom** in/out — stutters.
- **Hover** a node/edge + highlight incident edges — stutters.
- **Drag** a node — not smooth.

Crucially, the behaviour splits by **zoom regime** (see §4), which changes what
the fix even is.

---

## 2. How we measured it (observability)

Rather than guess, we built per-frame telemetry first (branch
`feat/canvas-telemetry-otel`): a `FrameMeter` in the engine that times every
`Canvas.tickOnce` — real (unclamped) frame time + a CPU **phase breakdown**
(`camera` / `dataFlush` / `layers`) — attributed to the active gesture
(`idle`/`pan`/`zoom`/`drag`/`hover`/`layout`) by an `InteractionTracker`, exported
via OTLP to HyperDX (dashboards seeded in `invana/docker/hyperdx/`).

What the dashboards showed on the reference workload:

- **Idle** sits at ~70 FPS. The drops are **pan (~26 FPS)**, then layout/drag/zoom.
- The dip is almost entirely the **`layers`** phase — i.e. **layer rendering
  (edge re-route + redraw)**, *not* camera or data-flush.
- **Dropped ("jank") frames** cluster on pan/drag/layout, never on idle/hover-empty.

So the render pipeline, specifically the **per-frame edge work**, is the cost.

---

## 3. Root cause

1. **No viewport culling + one Graphics per edge.** Each connector is a Pixi
   `Container` + body `Graphics` + 2 marker `Graphics`
   (`packages/canvas/src/primitives/base/ConnectorBase.ts:49`) — ~4 display
   objects × ~28.6k edges ≈ **110k+ objects**, plus nodes. There is **no
   per-element culler** (only a layer-level `cullable` flag on `Layer`; no Pixi
   `CullerPlugin` / `cullableChildren` pass). So the entire scene is traversed and
   submitted **every frame**, on-screen or not.

2. **Per-frame O(edges) render during pan/drag/layout.** Position churn dirties
   connectors, which re-route + redraw (`Graphics.clear()` + re-emit path). This
   is the `layers` phase spike. (Straight router skips the obstacle build — that's
   a lazy getter, `PrimitivesRenderer.ts:712` — so it's O(edges), not
   O(edges×shapes), for the default router.)

3. **Edge hit-test in a crowd is expensive (hover only).** On every `pointermove`
   the renderer rbush-queries candidates then, per candidate, `samplePath()` +
   `distanceToPolyline()` — and the path sampling is **uncached**
   (`PrimitivesRenderer.ts:1705`). Edge bounding boxes are **loose** (the
   rectangle spanning the endpoints; a long edge's box covers half the screen), so
   in a dense area a single point falls inside **hundreds** of edge bboxes → the
   spatial index stops pruning → hundreds of path-samplings per hover-frame. See
   §5.

4. **`flushMode: 'sync'` by default** (`GraphStore.ts:172`) → no rAF coalescing, so
   a 120 Hz `pointermove` during drag triggers 120 flushes/sec instead of one per
   frame.

(Note: the LOD behaviours that would *add* per-zoom O(edges) re-stroking —
`EdgeSizeLODBehaviour` etc. — are **not** in the `GraphCanvasApp` default bundle,
so they aren't the cause here; they'd make it worse if enabled.)

---

## 4. The key framing — it depends on the zoom regime

The single most important insight: **the right fix depends on how much of the
graph is on screen.**

| Regime | Picture | What helps | What does **nothing** |
|---|---|---|---|
| **Zoomed in** (a fraction visible) | most of the graph is off-screen | **Viewport culling** (drop the working set 10×+), fast per-node/edge hit-test | — |
| **Zoomed out** (whole hairball) | *everything* is on screen | **Edge batching**, **zoom-LOD / aggregation**, **node-only picking** | **Culling** (nothing is off-screen to cull); per-edge hit-test (overlapping edges are un-pickable anyway) |

Consequence: **culling is not a universal fix.** For the fully-zoomed-out hairball
screenshot it buys *nothing* — that regime needs batching + LOD. Pick the first
lever by the regime that actually hurts.

---

## 5. Edge hit-test in a crowd — cost *and* correctness

Hit-testing in a dense area has **two separate problems**. Nodes have neither
(tight bboxes → a hover point lands in only a few node boxes → cheap and correct
even when dense; overlap just picks nearest/topmost). Edges have both.

### 5a. Cost (performance)

On every `pointermove` the renderer rbush-queries candidates, then per candidate
runs `samplePath()` + `distanceToPolyline()` — and the sampling is **uncached**
(`PrimitivesRenderer.ts:1705`). Edge bboxes are **loose** (the rectangle spanning
the endpoints), so in a hairball a single point sits inside **hundreds** of edge
bboxes → the index stops pruning → hundreds of path-samplings per hover-frame =
the "hovering is choppy" symptom. **Bounded**: it runs only on `pointermove`, so a
still graph costs nothing. Fixes: cache path samples (D), tighten the candidate
set (H, below).

### 5b. Correctness — "did it pick the *right* edge?"

This is the sharper worry in a real hairball, and it's **not** just a perf tweak.
The current algorithm returns the edge whose polyline is **nearest** the cursor
(within a pixel floor). That is *technically* correct — the truly-nearest edge is
always among the candidates — but the **UX collapses** when many edges are
near-coincident under the pointer:

- **Genuine ambiguity.** When 20+ edges pass within a pixel or two of the cursor,
  "the edge you meant" is ill-defined. Nearest-wins picks *an* edge, but not
  necessarily *your* edge — sub-pixel geometry decides.
- **Instability / flicker.** Because the winner is decided by tiny distance
  differences, moving the cursor 1px flips the selection between near-coincident
  edges — the highlight **jitters** instead of locking on.
- **Invisibility.** Even when it picks "correctly," you can't *see* which of the
  overlapping lines is selected without the highlight — and the highlight itself
  is one thin line lost in the bundle.
- **No z-order to lean on.** Unlike overlapping nodes (topmost wins,
  meaningfully), edges are effectively co-planar, so "topmost" isn't a useful
  tie-break.

**Honest takeaway:** in a truly overlapping bundle, *per-edge hover is inherently
unreliable* — no algorithm makes 20 coincident edges individually, confidently
pickable at that zoom. The realistic answer is **make the candidate set tight and
correct, stabilize the choice, bias toward intent, and degrade gracefully** — not
pretend to pick a single edge from a blur. The options below (H–L) address this,
and the recommended combo is in §5c.

### 5c. Recommended disambiguation approach

A pragmatic layering, cheapest first:

1. **Tighten the candidate set (H).** Index edges by their **path segments** (or a
   coarse grid) instead of one loose whole-edge bbox, so candidates are edges
   *physically near* the point — not every long edge crossing the region. Fixes
   both the over-return (perf) and makes "nearest" meaningful.
2. **Stabilize the pick (I).** Nearest-within-tolerance **plus a stable tie-break**
   (e.g. keep the current hover unless another edge is clearly closer by a hysteresis
   margin) → kills the 1px flicker.
3. **Bias toward intent (J).** Near a node, prefer edges **incident to that node**
   (edges fan out and separate near their endpoints, where you usually aim). Makes
   "hover to trace an edge from a node" reliable even in the hairball.
4. **Lead with node hover, not edge hover (K).** In dense graphs the natural gesture
   is *hover a node → light up its incident edges* (already provided by
   `HoverActivateBehaviour`), not *hover one edge in the middle of the bundle*.
   Treat node→neighbourhood as the primary affordance; direct edge hover is the
   secondary, zoom-gated one.
5. **Gate + graceful fallback (E, L).** Below a zoom threshold (edges visually
   merged) hit-test **nodes only**; when several edges are genuinely tied, optionally
   surface a small **picker** ("3 edges here: A→B, C→D, …") instead of guessing.

This is a *separate* workstream from the render-perf phases and can land
independently.

---

## 6. Options we're exploring

Grouped by lever. Each notes which **regime** it addresses, rough **effort**, and
**status** (✅ shipped / 📋 planned).

| # | Option | Regime | What / how | Effort | Status |
|---|---|---|---|---|---|
| A | **Viewport culling** | zoomed-in | Each frame (throttled), query the existing `HitIndex` rbush against `camera.getVisibleBounds()`; toggle `renderable` off for shapes/connectors outside it. (Alt: Pixi v8 `Culler` + `cullableChildren`.) | med | ✅ `HitIndex.searchRect` + `PrimitivesRenderer.cull` driven from `Canvas.tickOnce` on camera move |
| B | **Edge batching / instancing** | zoomed-out | Draw all edges as **one** batched geometry / GPU-instanced draw instead of ~28.6k separate `Graphics`. The only lever when everything is visible. | high | 📋 deferred — measure C+culling first |
| C | **Zoom-based edge LOD / aggregation** | zoomed-out | Below a zoom threshold, stop drawing every edge (they merge into a sub-pixel blob): sample/thin, fade, or render an aggregate **density** layer instead. | med | ✅ `EdgeLODBehaviour` (thin to `keepFraction` by sample/weight/degree) |
| D | **Cache edge path samples** | hover | Memoise `samplePath` on the `ConnectorInstance`; invalidate on re-route. Kills the per-frame resampling in hit-test. | low | 📋 |
| E | **Gate edge hit-test by zoom** | crowded | Below a zoom threshold, hit-test **nodes only** — per-edge picking is meaningless when edges overlap a pixel. | low | 📋 (partly subsumed: `EdgeLODBehaviour` drops thinned edges from the hit index too) |
| F | **Frame-coalesced flush** | drag | Default the graph store (or drag path) to `flushMode: 'frame'` so `pointermove` churn collapses to one flush/rAF. | low | ✅ `GraphLayer` builds its store with `flushMode: 'frame'` |
| G | **Hover highlight fast-path** | hover | A hover highlight only changes stroke colour/width, not geometry — redraw on the cached path (`setConnectorStroke`) instead of a full `updateConnector` re-route. | low | 📋 |

### Edge-pick **correctness** in a crowd (§5b)

| # | Option | Solves | What / how | Effort |
|---|---|---|---|---|
| H | **Segment-level hit index** | ambiguity + cost | Index each edge by its polyline **segments** (tight bboxes) or a coarse grid, so rbush candidates are edges *physically near* the point — not every long edge whose loose box crosses the region. Makes "nearest" meaningful **and** cheap. | med |
| I | **Stable nearest + hysteresis** | flicker | Pick nearest-within-tolerance, but keep the current hovered edge unless another is closer by a margin → the highlight locks on instead of jittering on sub-pixel moves. | low |
| J | **Node-incidence bias** | wrong edge | Near a node, prefer edges **incident to that node** (they separate near their endpoints, where you aim) — makes "trace an edge from a node" reliable in the bundle. | low |
| K | **Node-hover-first affordance** | ambiguity | Make *hover node → highlight incident edges* (already in `HoverActivateBehaviour`) the primary path; direct edge hover is secondary + zoom-gated. UX policy, not new geometry. | low |
| L | **Ambiguity picker** | ambiguity | When several edges are genuinely tied under the cursor, surface a small list ("3 edges here …") instead of silently guessing. Optional, heavier UX. | med |

### Discarded / non-issues
- **Per-frame jank attribution span** (`canvas.frame.jank`) — built then removed:
  the aggregate phase breakdown already identifies the cause (edges/`layers`), and
  with no culling every heavy frame has the same cause, so per-frame forensics
  added surface for no new insight. Re-addable in ~30 min if a *mysterious* drop
  appears.

---

## 7. Recommended sequencing ("first")

The order should track the regime that hurts most, but a good default:

**Phase 0 — cheap, standalone wins (no renderer rewrite).** D + E + F + G, plus
the low-effort edge-pick correctness fixes **I + J + K** (stable pick + node
bias + node-hover-first). These remove the hover jank, smooth drag, and stop the
edge-hover flicker with small, localized changes. Do these first regardless of
regime — low risk, immediate. **Status: F ✅ shipped; D / E / G / I / J / K still open.**

**Phase 0.5 — edge-pick correctness (H, optionally L).** The segment-level hit
index (H) is the structural fix that makes "nearest edge" both cheap and *right*
in a crowd; the ambiguity picker (L) is the optional graceful fallback. Land when
reliable edge hover in dense areas matters. **Status: 📋 open.**

**Phase 1 — viewport culling (A). ✅ shipped.** The biggest win for **zoomed-in**
interaction (the drag/hover-in screenshots). Reuses the rbush we already maintain.

**Phase 2 — edge batching + LOD (B + C).** The real fix for the **zoomed-out
hairball** (the dense screenshot), where culling can't help. **Status: C ✅ shipped
(`EdgeLODBehaviour`); B deferred** — measure whether C + culling suffice before the
larger connector-renderer rewrite.

If the **zoomed-out hairball** is the primary pain, swap Phase 1 and Phase 2.

> **Also shipped alongside these:** a node-content zoom-LOD family —
> `TextLODBehaviour` / `IconLODBehaviour` / `ImageLODBehaviour` (hide labels /
> icons / image fills by zoom band) and `NodeCentralityBehaviour` (size + label +
> weighted-degree). These cut per-node render cost the same way C cuts per-edge.

---

## 8. Open decisions

- **Which regime is the priority** — zoomed-in interaction vs the zoomed-out
  hairball? Sets Phase 1 vs Phase 2 order.
- **Culling implementation** — custom rbush-driven cull (more control, reuses our
  index) vs Pixi v8 `Culler` (less code).
- **Batching model** — a single merged `Graphics`/mesh for edges vs true GPU
  instancing; how it coexists with per-edge state (hover/selected) and decorations.
- **LOD policy** — thresholds + whether low-zoom edges become an aggregate density
  layer (there's already `@invana/graph-layer-d3-contour` for density overlays).
- **Edge-pick UX in a crowd** — how far to go: is stable-nearest + node-incidence
  bias + node-hover-first (I/J/K) "good enough," or do we also want the
  segment-level index (H) and/or an ambiguity picker (L)? Accept that per-edge
  hover is *inherently* unreliable in a fully-overlapping bundle — the goal is
  reliable-when-separable + graceful-when-not, not magic single-edge selection at
  any density.
