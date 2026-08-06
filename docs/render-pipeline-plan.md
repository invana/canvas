# Render pipeline — plan

Working design-of-record for **how render work is expressed, merged, ordered and
paid for** in `@invana/canvas`. Today there is no pipeline: a store event calls
the renderer imperatively and immediately. This proposes replacing that with a
**render-intent queue** — producers declare *what needs to change*, a per-frame
planner decides *what actually runs this frame* under a budget.

Sibling docs:

- [`large-graph-performance-plan.md`](./large-graph-performance-plan.md) — *steady-state*
  frame cost (pan / zoom / hover / drag). Its options are levers **inside** the
  execute stage of this pipeline.
- [`large-graph-load-pipeline-plan.md`](./large-graph-load-pipeline-plan.md) — the
  *initial load* freeze. Its batched install becomes **one intent class** here
  rather than a special case.
- [`renderer-split-design.md`](./renderer-split-design.md) — the
  `IRenderer` seam this pipeline sits on top of, and the enabler for the worker
  option in §8.

---

## 1. What exists today

Producers call the renderer directly:

- `GraphLayer.installNodeShape` → `renderer.addShape` (`GraphLayer.ts:1686`)
- `GraphLayer.updateNodeShape` → `renderer.updateShape` / `moveShape`
- layout tick → `moveShape` per node, then `updateConnector` per incident edge

`GraphLayer`'s flush handler (`GraphLayer.ts:471-497`) is a **hand-rolled
miniature of the right idea**: dirty sets (`dirtyGroups`, `dirtyStateNodes`,
`dirtyStateEdges`, `dirtyConnectors`) drained once per flush in a deliberate
order — groups first (frames move anchors), then node states (may change size),
then edge states, then routes. That ordering comment is a **dependency contract
written in prose**, and it is correct. The problem is that it exists once, for
one layer, for four hard-coded sets.

### What that costs

| Gap | Consequence |
|---|---|
| **No coalescing across producers** | A node touched by layout + hover + theme in one frame does the work three times. The four dirty sets dedupe *within* a category only. |
| **No cost model** | A 0.05 ms transform write and a 2 ms geometry retrace are indistinguishable to the caller, so the frame can't protect the cheap work when it's overloaded. |
| **No budget seam** | Nowhere to say "this frame has 8 ms." Work runs to completion or not at all — the root cause of the load freeze. |
| **Ordering is per-layer prose** | Every future layer re-derives (or gets wrong) the same positions → frames → routes → decorations ordering. |
| **Per-item events at machine rate** | Bulk load emits ~25k `node:add`/`edge:add`, each with a `getNode` lookup in the handler — the kernel's own doctrine says machine-rate work shouldn't take the event path. |
| **No backpressure** | A streaming feed that outpaces the renderer accumulates unbounded lag with no degradation strategy. |

---

## 2. The pipeline

```
producers            queue                planner              executor        present
─────────            ─────                ───────              ────────        ───────
store events    →                                          →   IRenderer   →   pixi
behaviours      →    RenderQueue     →    FramePlanner      →   calls           render
layout ticks    →    (coalesce by         (budget + order        (batched
LOD / theme     →     id+class)            + priority)            by class)
```

**1. Ingest.** Producers enqueue **intents**, never draw calls:
`queue.mark(id, class, hint?)`. Nobody reaches for the renderer directly. The
inversion is the point — the caller declares *that* work is needed; the pipeline
owns *when*.

**2. Coalesce.** Merge on `(elementId, class)`. Eight drag `pointermove`s in one
frame become one `move`. `install` + `restyle` collapses into one `install` that
reads current store state at execute time. Duplicate elimination happens *before*
the budget is spent, which is strictly better than chunking a list that still
contains the duplicates.

**3. Plan.** Order by cost class (§3), then priority (viewport / interaction),
then FIFO. Assign to the frame's budget; leftovers carry to the next frame.

**4. Execute.** Run in dependency order (§4), batched per class so the renderer
can take its fast paths.

**5. Present.** Pixi's own render pass, unchanged.

---

## 3. Intent classes — the cost model

The central insight: *"render work" is not one thing.* The classes differ by
roughly 100×, and a planner that knows this can keep cheap work at 60 fps while
only expensive classes slip.

| Class | What it does | Renderer call | Rough cost | Degradation policy |
|---|---|---|---|---|
| `move` | position-only translate | `moveShape` (`PrimitivesRenderer.ts:749`) | ~0.05 ms | **Never defer.** Always drains fully. |
| `scale` | uniform rescale, no retrace | `scaleShape` | ~0.05 ms | never defer; hit-reindex deferred to gesture settle (already the case) |
| `restyle` | stroke / tint only, cached geometry | `setConnectorStroke` | ~0.1 ms | run on-screen; drop off-screen |
| `route` | re-run anchors + router + redraw | `updateConnector` | ~0.5–2 ms | defer off-screen; one per element per frame |
| `install` | construct + trace + index + decorations | `addShape` / `addConnector` | ~0.3–1 ms | budgeted; viewport-first; LOD-gated |
| `geometry` | full spec retrace + re-anchor | `updateShape` | high | defer aggressively; coalesce hard |
| `remove` | teardown | `removeShape` / `removeConnector` | low | run immediately (frees memory) |

Two properties follow that we can't express today:

- **Graceful degradation.** Under pressure a frame runs every `move` and
  `restyle`, half the `route`s, and no `install`s — the graph stays *responsive*
  while getting *less complete*. Today one expensive class starves everything.
- **Cheap classification of the fast paths.** `connectorGeometryUnchanged`
  (`PrimitivesRenderer.ts:993`) already decides restyle-vs-route; that decision
  becomes the intent class rather than an inline branch.

### Coalescing rules

Merging two intents for the same element (row = queued, column = incoming):

| | `move` | `restyle` | `route` | `geometry` | `install` | `remove` |
|---|---|---|---|---|---|---|
| **`move`** | `move` | both | both | `geometry` | `install` | `remove` |
| **`restyle`** | both | `restyle` | `route` | `geometry` | `install` | `remove` |
| **`route`** | both | `route` | `route` | `geometry` | `install` | `remove` |
| **`geometry`** | `geometry` | `geometry` | `geometry` | `geometry` | `install` | `remove` |
| **`install`** | `install` | `install` | `install` | `install` | `install` | *drop both* |
| **`remove`** | `remove` | `remove` | `remove` | `remove` | `install` | `remove` |

Rule of thumb: the **stronger** class absorbs the weaker (`geometry` ⊃ `route` ⊃
`restyle`), `move` is orthogonal (transform vs content) so it coexists,
`install` supersedes everything (it reads live state anyway), and
`install` + `remove` in the same frame annihilate.

---

## 4. Dependency ordering

The execute stage runs classes in a fixed order so downstream work reads settled
upstream geometry. This generalises `GraphLayer.ts:471-497` from prose into the
pipeline's contract:

```
1. remove            free first, so later work doesn't touch dead elements
2. install           new elements exist before anything routes to them
3. move / scale      positions settle
4. container frames  group auto-fit re-fits against moved children   (domain hook)
5. geometry          size-changing restyles, before anchors are read
6. route             connectors re-anchor against final geometry
7. restyle           stroke/tint on final paths
8. decorations       anchored to final bounds
```

Steps 4 is domain-specific (groups are a `@invana/graph` concept), so the
pipeline exposes an ordered **stage hook** rather than hard-coding it — layers
register a callback at a named stage. The engine stays domain-free.

---

## 5. Budget and interaction awareness

The planner takes a per-frame budget, driven by `InteractionTracker`
(`Canvas.ts:248`), which already classifies the active gesture:

| Interaction | Budget | Rationale |
|---|---|---|
| first 2 frames after mount | ~0 ms | let the empty canvas paint; never look hung |
| `idle` | 8–10 ms | nobody's watching the frame clock |
| `pan` / `zoom` / `drag` | ~2 ms | the gesture owns the frame; deferred work gets the scraps |
| `layout` running | ~4 ms | share with the simulation |

Budget checks are amortised (read the clock every ~32 items, not per item) so the
timing call doesn't dominate cheap classes. `install` and `geometry` are the only
classes that can be cut mid-drain; `move`/`restyle`/`remove` always complete.

Drained from `Canvas.tickOnce` (`Canvas.ts:456`) between the data flush and the
layer walk, so anything executed this frame paints this frame. `FrameMeter` gains
a `pipeline` phase so the existing telemetry attributes it instead of folding it
into `layers`.

---

## 6. The bulk lane

Per-element intents are right at human rate and wrong at machine rate. The
kernel doctrine already draws this line for positions (typed arrays, never the
reactive path); the pipeline extends it to **install and update**:

- **Human-rate lane** — per-element intents, as above. Hover, select, drag,
  single edits.
- **Bulk lane** — a range descriptor (`{ class, epoch, idRange | Uint32Array }`)
  the executor walks directly, with **no per-item event dispatch and no per-item
  store lookup**. Loading 5k nodes becomes one bulk `install` intent, not 5k
  events + 5k `getNode` calls.

Threshold-switched (~500 items), so small operations keep today's exact
behaviour and the bulk path only engages where it pays.

---

## 7. Epochs and backpressure

**Epochs.** Every intent carries a load generation. `setData` / `clear` /
unmount bumps the epoch, invalidating all queued work in one integer compare —
no per-item cancellation walk, no stale element installed over new data.

**Backpressure.** When queue depth grows faster than it drains (streaming feed,
hot layout), the planner escalates rather than accumulating lag:

1. raise LOD thresholds (fewer edges, no labels)
2. drop off-screen `restyle` / `route` entirely — the cull pass will fix them
   when they re-enter
3. switch per-element intents to the bulk lane
4. surface it: emit a `render:work:*` progress/pressure signal so UI can show it

The queue depth is also the natural health metric to export via telemetry.

---

## 8. Threads — what moves off the main thread

Reasonable to consider, but **not for rendering itself**.

### Genuinely worth moving

| Work | Why it works | Note |
|---|---|---|
| **Layout** | pure math over positions; no DOM, no GPU | the big one. `elkjs` already ships a worker build (`workerUrl`); d3-force runs over `Float32Array` positions posted back per tick |
| **Data ingest** | `JSON.parse` + normalize + index of a large payload blocks today | return typed arrays, transfer them |
| **Derived geometry** | bubble-sets contours, d3-contour density, edge bundling, orthogonal routing, clustering / centrality | all pure functions of positions + topology |
| **Index building** | bulk rbush load | build off-thread, transfer, swap in |
| **Vertex-buffer construction** | for batched edges: build the interleaved buffer off-thread, upload on main | how deck.gl / sigma / cosmograph do it — the one place a worker touches rendering productively |

The `ColumnStore` / `GraphStore` typed arrays are already transferable, so the
data model is ready. Caveat: `SharedArrayBuffer` needs COOP/COEP headers — plan
on transfer + double-buffering unless deployment headers are controlled.

### What does not move

**Rendering.** Constructing display objects and uploading geometry has to happen
where the renderer lives. Pixi v8 *can* render to an `OffscreenCanvas` in a
worker, but that relocates the freeze rather than removing it. Gain: the React UI
stays perfectly smooth while the canvas is busy. Cost:

- every pointer event round-trips main → worker → render, adding input latency —
  on a graph app, where drag and hover *are* the product, that's a regression
- text/font metrics in workers are constrained; DOM overlays (tooltips, menus)
  stay on main and need position sync
- debugging, profiling and Storybook all get harder

**Verdict: not now.** But note the payoff already queued up — once drawing sits
behind `IRenderer` / `IPrimitivesRenderer`
([`renderer-split-design.md`](./renderer-split-design.md)), a
worker renderer is *just another implementation of that interface* with a
postMessage transport. The extraction buys the option for free. Don't build for
it; don't foreclose it.

**Also worth knowing:** `scheduler.postTask()` with explicit priorities (and
`scheduler.yield()`) is a better fit than `requestIdleCallback` for non-visual
main-thread work, and complements the rAF-drained queue. Chrome-only today; easy
to feature-detect.

---

## 9. Where it lives

- `packages/canvas/src/engine/RenderQueue.ts` — coalescing queue, epochs, depth metric.
- `packages/canvas/src/engine/FramePlanner.ts` — budget, ordering, degradation ladder.
- `ctx.render` on `CanvasContext` — what layers/behaviours enqueue against.
- **Domain-free.** Classes are geometric (`move` / `route` / `geometry`), never
  node/edge. `@invana/graph` maps its concepts onto them; group-frame settling
  attaches via the stage hook (§4).
- **Not the store.** `@invana/canvas-store` stays the source of truth for
  *state*; the pipeline is the renderer-side projection of state changes. It
  consumes store events, never replaces them.

---

## 10. Phasing — incremental, not big-bang

| Phase | Work | Notes |
|---|---|---|
| **R0** | `RenderQueue` + `FramePlanner` + `ctx.render` + `tickOnce` drain + `FrameMeter` phase | No consumers. Nothing changes behaviour. |
| **R1** | `install` class only — `GraphLayer` enqueues installs | **This is the load plan's P1–P2.** The freeze goes away; everything else still runs the old imperative path. |
| **R2** | Move `GraphLayer`'s four dirty sets onto the queue (`route` / `restyle` / `geometry`) | Behaviour-preserving refactor; the flush handler's ordering becomes §4's contract. Biggest correctness-risk step — land it alone. |
| **R3** | `move` / `scale` classes; layout + drag write through the queue | Unlocks cost-class degradation during gestures. |
| **R4** | Bulk lane (§6) | Kills the 25k-event dispatch on load. |
| **R5** | Backpressure + pressure telemetry (§7) | Needed once streaming feeds are real. |
| **W1** | Layout into a worker | Independent of R0–R5; can run in parallel. |
| **W2** | Ingest / derived geometry into workers | Independent. |
| **W3** | Batched edge geometry with off-thread buffer build | Depends on option B in the perf plan. |

R1 is deliberately first and narrow: it delivers the user-visible win (no load
freeze) while touching one class, and proves the queue before the riskier R2
refactor moves existing working code onto it.

---

## 11. Risks

- **R2 is a behaviour-preserving refactor of code that currently works.** The
  ordering in `GraphLayer.ts:471-497` encodes hard-won correctness (group frames
  before anchors, node size before routes). Moving it must be done in one focused
  change with the ordering contract asserted, not incrementally.
- **Coalescing hides bugs.** If a producer relies on a synchronous render
  side-effect (reading `getShapeWorldBounds` right after an update), deferral
  breaks it. Audit renderer-reading call sites — `GraphLayer.getBounds`
  (`GraphLayer.ts:1067`) is already known to read the renderer, not the store.
- **Debuggability.** "Why didn't this repaint?" gets harder. Mitigate with a dev
  queue inspector (depth by class, deferred counts) surfaced through the existing
  telemetry tap.
- **Over-abstraction.** If only `install` ever gets deferred, the queue is
  ceremony. R1 must be judged on measured win before R2–R5 are committed.

---

## 12. Open decisions

- **Do `move` intents route through the queue at all**, or stay a direct
  fast-path write? Queueing costs a map lookup per move on the hottest path;
  the win is one uniform model. Measure at R3.
- **Per-layer queues vs one canvas-wide queue.** One queue can budget across
  layers (a busy graph layer yields to a cheap overlay); per-layer is simpler and
  matches today's `layer.flush()`. Leaning canvas-wide.
- **Does the planner own layout too?** A one-shot layout on 5k nodes is another
  long macrotask under the same budget pressure — but it changes layout
  semantics. Deferred; W1 (worker) may make it moot.
- **How much of the perf plan's steady-state options collapse into class
  policies** — option G (hover fast-path) is exactly `restyle`, option E (gate
  hit-test by zoom) is adjacent. Worth a pass to fold them in rather than
  implementing twice.
