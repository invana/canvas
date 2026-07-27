# Large-graph **load** — plan

Working design-of-record for making the **initial load** of a large graph
(~5k nodes / ~20k edges) non-blocking *and* fast-feeling. Loading currently
freezes the tab for seconds — before any layout runs — because every element is
installed into the renderer in one unbroken synchronous burst.

**This doc is a consumer, not an architecture.** The machinery lives in
[`render-pipeline-plan.md`](./render-pipeline-plan.md): a render-intent queue with
cost classes, a frame budget, and a planner. Load is that pipeline's **`install`
class** plus a load-specific policy for *what to build, in what order, and what
not to build at all*. Nothing here re-proposes a scheduler.

Sibling: [`large-graph-performance-plan.md`](./large-graph-performance-plan.md) —
the *steady-state* frame cost once mounted. Disjoint problem; none of its levers
touch load.

---

## 1. Symptom

Load `~5,000` nodes + `~20,000` edges. The tab is unresponsive — no paint, no
input — for seconds, then everything appears at once. Reproduces with **no active
layout**, so layout is not the cause.

---

## 2. Root cause — the install path never yields

`GraphLayer.setData` (`GraphLayer.ts:587`) wraps the store writes in one
`batch()`. The frame-coalesced flush then replays every buffered `node:add` /
`edge:add` (or `onMount`'s initial-sync loop, `GraphLayer.ts:341-347`) and
installs each element inline:

**Per node** — `installNodeShape` (`GraphLayer.ts:1686`): `renderer.addShape`
(`PrimitivesRenderer.ts:564`) constructs the shape class, traces its `Graphics`,
inserts into the rbush hit index — then `syncNodeLabel` + `syncNodeDecorations` +
`syncNodeBadges`. The label is a real pixi `Text`, typically the largest
per-node item.

**Per edge** — `installEdgeConnector` (`GraphLayer.ts:1695`):
`renderer.addConnector` (`PrimitivesRenderer.ts:930`) constructs a `Container` +
body `Graphics` + 2 marker `Graphics`, then runs a full `recomputeConnectorPath`
(anchors → router → decoration trim → draw) — at a moment when positions are
often about to be replaced by a layout.

~25k items × a few hundred µs, all inside **one macrotask**. The browser cannot
paint or process input, and pixi never gets a frame until the loop ends. Every
downstream cost (first GPU upload, layout, autofit) queues behind it.

**Why nothing today helps:**

| Existing lever | Why it misses |
|---|---|
| `cull()` (`PrimitivesRenderer.ts:700`) | Toggles `renderable` on **existing** instances. The cost is *constructing* them. |
| `flushMode: 'frame'` | Coalesces *how often* a flush runs. One flush still installs everything. |
| `EdgeLODBehaviour` / text-LOD | Runs *after* install — the objects were already built. |

---

## 3. The framing — budgeting alone is not "snappy"

Putting installs on a budget makes the load **non-blocking**: the same 2–4 s of
work spread over ~200 frames. The tab responds, but the user watches elements
popcorn in for three seconds. Snappiness needs three levers, and budgeting is
only the first:

1. **Yield** — never hold the frame (§4).
2. **Cut** — don't build what can't be seen (§5). *Largest single win.*
3. **Order** — reveal as progressive **fidelity**, not progressive elements (§6).

Plus one sequencing rule against the layout (§7).

---

## 4. Yield — install as a budgeted intent class

`GraphLayer` stops calling `addShape` / `addConnector` inline and enqueues
`install` intents (pipeline plan §3). Two properties matter for load:

- **`install` is a deferrable class.** The planner runs every `move` and
  `restyle` at full rate and lets `install` slip. A half-loaded graph still pans,
  hovers and drags at 60 fps.
- **The budget is interaction-aware** (pipeline plan §5): ~0 ms for the first two
  frames after mount (let the empty canvas paint — never look hung), 8–10 ms
  idle, ~2 ms while a gesture is active. Loading yields to the user rather than
  competing with them.

Load-specific additions to the queue's behaviour:

- **Nodes before edges** (`install` priority), so every connector routes to a
  shape that already exists.
- **Epoch per load** — `setData` / `clear` / unmount bumps it, so a re-load can't
  install stale elements over new data (pipeline plan §7).
- **`syncThreshold` (~500 items)** — below it, install synchronously and skip the
  queue. Small graphs, stories and tests behave exactly as they do today.
- **Bulk lane** (pipeline plan §6) — one bulk `install` intent instead of 25k
  `node:add` events each with a `getNode` lookup in the handler.

---

## 5. Cut — don't build what can't be seen

This matters **more than scheduling** and is cheaper to implement. At load you
are typically zoom-fit on 5k nodes, where nothing is legible:

| Cut | Why |
|---|---|
| **Labels** | 5k pixi `Text` objects at a zoom where each is sub-pixel. `TextLODBehaviour` hides them a frame later anyway. Install the label decoration lazily on entering the zoom band. Very likely the biggest per-node cost. |
| **Edges** | `EdgeLODBehaviour` already thins to `keepFraction` at low zoom — apply it at *install* time, not after. At fit-zoom that's ~2k of 20k edges installed; the rest materialize on zoom-in. |
| **Badges / decorations** | Same rule: skip at install when LOD will hide them. |
| **Routing** | Install connectors unrouted; route on first settle instead of routing into positions that are about to move. |

Together these can take the install from ~25k items to nearer ~5k cheap ones —
the difference between "3 s of streaming" and "under a second".

**Consequence for LOD behaviours:** they stop being *hide/show* toggles and
become *materialize/dematerialize* triggers. That is a small step toward full
instance virtualization (§9) and should be built with that in mind.

---

## 6. Order — progressive fidelity

Reveal order decides whether the load reads as intentional or broken:

1. **Frame the camera first**, from **store** bounds — positions live in the
   store, so this needs zero instances. The view never jumps afterwards.
2. **Node bodies only** — the whole graph appears as a point cloud almost
   immediately. The scene looks *complete* within a few hundred ms, just
   low-fidelity.
3. **Edges** stream in over the next second.
4. **Labels / decorations** last, and only where zoom warrants.

The scene *sharpens* rather than *assembles*. A complete-looking low-fidelity
scene beats a half-built high-fidelity one.

**Not recommended: a spinner until complete.** It converts a 3 s ugly load into a
3 s blank one and forfeits the biggest perceptual win — that the graph looks
basically done after ~300 ms. Show a small determinate progress chip instead
(`12,400 / 25,000`) over a live canvas.

Progress rides the pipeline's work events:

```ts
'render:work:start':    { label: string; total: number }
'render:work:progress': { label: string; done: number; total: number }
'render:work:end':      { label: string; total: number; durationMs: number }
```

(Confirm naming against [`event-taxonomy.md`](./event-taxonomy.md) before adding
to `CanvasEventBus`.) `GraphLayer` re-emits a layer-scoped equivalent. **The
`@invana/canvas-ui` progress chip is out of scope here** — emit the events; wire
`GraphCanvasApp` as a follow-up.

---

## 7. Stage against the layout

Do **not** install edges while a force simulation is hot — every tick re-routes
them all. Hold edges until the layout cools (or first settle), then stream.
Faster *and* it removes the worst visual churn.

Node installs during layout are fine, and correct for free: an intent executes
against **live store state** (`this.nodeSpec(node)` at execute time, not enqueue
time), so a node still queued when the layout moves it installs at its current
position.

---

## 8. Hazards — partial-render states

Deferring installs means "the store has it" and "the renderer has it" diverge for
a while. Each renderer-reading consumer needs a decision:

| Site | Behaviour with pending installs | Resolution |
|---|---|---|
| **`GraphLayer.getBounds`** (`GraphLayer.ts:1067`) | Reads `renderer.getShapeWorldBounds` / `getConnectorPolyline` → returns bounds of the **installed subset only**, so `fitOnLoad` frames a fraction of the graph. | Fall back to store position + resolved size for pending ids (also what §6.1 needs), **or** re-fit on `render:work:end`. `_armAutoFit` already re-fits on layout ticks — same hook. |
| **Hit-testing** | Pending elements aren't in the rbush → not hoverable/clickable until installed. | Accept; the progress chip explains it. |
| **`cull()`** | Newly installed elements default `renderable = true`; if the camera moved earlier in the load they aren't culled until the next camera move. | Invalidate `Canvas._lastCullKey` after each install batch so the next frame re-culls. |
| **`exportImage`** (`export/imageExport.ts:148`) | Would capture a partially-installed scene. | Drain the queue synchronously first. |
| **`exportState` / `exportData`** | Store-driven — unaffected. | None. |
| **`MiniMapLayer`** | Reads the source layer's store, not the renderer — verify before landing. | Fall back to store positions if it reads the renderer. |
| **Headless / tests / `initWithStage`** | `tickOnce` may never run, so nothing installs. | `syncThreshold` covers small fixtures; expose a synchronous drain + a `batching: false` canvas option. |

---

## 9. The ceiling — and what's next if we hit it

§4–§7 give *responsive throughout* and *looks-done-fast*. They do **not** give a
sub-second fully-materialized 25k-object scene — 25k pixi display objects cost
what they cost, including GPU upload.

If measurements still disappoint, the next step is **not more scheduling**:

- **Instance virtualization** — renderer keeps `spec` + bounds for everything but
  a pixi instance only for the visible working set; `cull()` becomes
  materialize/dematerialize over a pool. Load cost becomes O(visible),
  independent of graph size. Structural: spec-driven hit index, decoration
  re-attach, `GraphLayer` slot maps tolerating a missing instance. §5's
  LOD-as-materialization is the on-ramp.
- **Edge batching** (option B in the perf plan) — the only lever for the fully
  zoomed-out hairball, where nothing is off-screen to virtualize. The vertex
  buffer build can go to a worker (pipeline plan §8).

Reach for these only once P0's trace says the cheap levers have topped out.

---

## 10. Phasing

Mapped onto the pipeline plan's phases — load work is R1 plus load policy.

| Phase | Work | Depends on |
|---|---|---|
| **L0 — measure** | Take one load trace of 5k/20k; split time across store insert / `addShape` / `addConnector` / first GPU upload. Sets the budget + threshold numbers and confirms the label hypothesis. | — |
| **L1 — install class** | `GraphLayer` enqueues `install` intents; nodes-before-edges, epoch, `syncThreshold`. **The freeze goes away here.** | pipeline R0 |
| **L2 — cut work** | Install-time LOD gating: labels, edge `keepFraction`, badges, unrouted connectors. **Largest single win — do not defer this to a later phase.** | L1 |
| **L3 — order + progress** | Camera fit from store bounds; node-bodies-first reveal; `render:work:*` events; the `getBounds` / `fitOnLoad` fix from §8. | L1 |
| **L4 — layout staging** | Hold edges until the layout cools. | L1, L3 |
| **L5 — bulk lane** | One bulk install intent instead of 25k events. | pipeline R4 |
| **L6 — tune** | Budget + threshold against the L0 trace; adaptive shrink when the previous frame overran. | all |

L2 is deliberately early: it is low-risk, it is the biggest win, and tuning in L6
is far more meaningful once the item count is already down.

---

## 11. Open decisions

- **Budget + threshold defaults** — 8–10 ms idle / ~2 ms in-gesture / 500-item
  sync threshold are starting guesses. L0 sets them.
- **Does `data:changed` still mean "rendered"?** It fires on flush, which today
  implies installed. Proposal: keep it a **data** signal and let `render:work:*`
  carry render completion — but audit consumers relying on the coupling (layout
  triggering, `fitOnLoad`).
- **Where install-time LOD is decided** — the LOD behaviours own the thresholds,
  but install happens in `GraphLayer`. Needs a read-only "would this be visible at
  the current zoom?" query rather than duplicated threshold logic.
- **Does the layout itself need the same treatment?** A one-shot layout on 5k
  nodes is another long macrotask. Moving it to a worker (pipeline plan §8, W1)
  probably beats budgeting it.
