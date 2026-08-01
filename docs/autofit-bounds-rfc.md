# RFC — `fitOnLoad` frames the wrong box: auto-fit vs. bounds freshness

**Status:** 🚧 investigated; one bug fixed, **the symptom is not fixed** — see §7.
**Packages:** `@invana/canvas` (`Canvas.fitView` / `_armAutoFit`), `@invana/graph`
(`GraphLayer.getBounds`).
**Symptom class:** "the nodes aren't rendering" — reported four times; every time
the scene was drawn correctly and the *camera* was wrong.

---

## 1. The symptom

`config.fitOnLoad` (on by default in `GraphCanvasApp`'s `BASE_CONFIG`) is meant to
frame the graph once it has settled. Instead the camera regularly lands zoomed
into the gap between two nodes, so the canvas looks empty apart from a few
edge segments crossing it at 40× magnification.

Observed, all on the current `feat/refactor` head:

| Surface | What the camera does |
|---|---|
| `usecases/GraphVisualiser` (Les Mis) | opens at **4400 %**; intermittently self-corrects to 66 % ~15 s later, often doesn't |
| `canvas-ui/apps/GraphCanvasApp/FullFeatured` | opens at **2750 %** |
| `graph-layouts/d3-hierarchy/Tree` | opens **blank**; the story's own "Re-fit camera" button reveals the tree |
| GraphVisualiser → flare · h1b2019 · life-tree | land laid-out but **unframed** at zoom 100 % |
| GraphVisualiser → uk-energy-flow (sankey) | frames correctly at 67 % |
| Any dataset with an **animated** force sim | frames correctly |

The Fit toolbar button — same `fitView` — usually corrects it, but on the
hierarchy datasets it made things *worse* (zoomed to 5443 %), which is the clue
that this is a measurement problem, not a timing preference.

## 2. What is established

Verified by reading the code and by instrumenting a scratch story:

1. **The scene is fine.** Status bar reports the full node/edge count, the minimap
   draws the whole graph, and node shapes are installed in the renderer
   (`hasShape` → `true`).
2. **The fit measures a near-degenerate box.** On the hierarchy datasets
   `GraphLayer.getBounds()` returned a **7 × 7** rect while 252 nodes were drawn
   spread across the viewport. 7 × 7 is exactly one node of `radius: 3.5` — i.e.
   the union of 252 circles that are all still stacked at the origin.
3. **Fitting a 7 × 7 rect into a ~1200 px viewport is the 4400 %.** The zoom is a
   faithful consequence of the box, not a separate bug.
4. **The auto-fit gets one shot per run for a one-shot layout.**
   `Canvas._armAutoFit` (`Canvas.ts:565`) re-fits on `layout:run:tick` (throttled
   100 ms) and once on `layout:run:end`. An animated force sim emits ticks over
   many frames, so a stale early measurement is corrected by the next one — which
   is exactly why animated datasets look fine and one-shot layouts don't.
   `D3ForceLayout.runStatic` emits a single `tick` immediately followed by `end`;
   `animate: false` is what the dataset settings ship.
5. **Every fit is scheduled one `requestAnimationFrame` out** — `Canvas.ts:570`,
   `requestAnimationFrame(() => this.fitView())`.

## 3. What is *not* yet established

The chain from a layout write to a measurable bound *looks* synchronous, and that
contradicts observation 2. Reading it forward:

- `store.setPositionsBulk(ids, xy)` (`GraphStore.ts:428`) writes the typed-array
  columns and, unless `silent`, enqueues a per-node `{ position }` update
  (`:445`) then schedules a flush (`:450`).
- `GraphLayer.getBounds()` (`GraphLayer.ts:1079`) calls `this.store.flush()`
  **before measuring** (`:1091`) — the comment there says this exists precisely so
  a one-shot layout's synchronous `end → fitView` can't read pre-layout bounds.
- That flush fires `node:update` on the layer (`GraphLayer.ts:392`), which reaches
  `updateNodeShape` → `PrimitivesRenderer.moveShape` (`:749`), and `moveShape`
  mutates `inst.spec.x/y` **in place** — the very fields
  `shapeWorldBounds` reads (`:2586`).

So by construction the bounds should be fresh. Two observations disagree with
each other, too:

- Les Mis **self-corrects** seconds later → looks like a one-frame ordering race.
- The hierarchy case still measured 7 × 7 a **full two seconds** after the run →
  looks like the positions never reached the renderer's specs at all.

**A fix written against either story alone would repair one and leave the other.**
Closing this gap is step 1 of the plan, not an afterthought.

## 4. Plan

### Step 1 — one instrumented run (decisive, ~15 min)

A scratch story that logs, at the layout's `end` and on each of the next three
frames, for the same three node ids:

- `store.getPosition(id)` — the source of truth,
- `renderer.getShapeWorldBounds(id)` — what the fit actually measures,
- `layer.getBounds()` and `camera.scale`.

Run it twice: once against a force dataset (`animate: false`), once against a
d3-hierarchy dataset. The three possible outcomes each name their own fix:

| Outcome | Reading | Fix lands in |
|---|---|---|
| **A.** Renderer matches the store immediately | the fit is firing on the wrong signal, not too early | `_armAutoFit` event wiring (`Canvas.ts:565`) |
| **B.** Renderer lags by exactly one frame | a measurement is depending on rAF callback ordering | `Canvas.fitView` (`:535`) |
| **C.** Renderer never catches up | bulk position writes aren't reaching the renderer's specs | the store→layer bridge (`GraphLayer.ts:392` / `GraphStore.setPositionsBulk`) |

### Step 2 — the change

Whichever branch, the shape of the fix is the same principle: **a measurement
must not depend on frame ordering.** `fitView` should drain whatever is pending
and then measure, rather than being scheduled a frame out and hoping the
renderer got there first.

Deliberately *not* in scope: changing *when* fits happen. `fitView` is shared by
the Fit toolbar button, `config.fitOnLoad`, and the layout wrappers' `end → fit`
(`D3SankeyLayout.tsx` and siblings). Re-timing it would ripple through all three
for a bug that is about *what gets measured*. Expected size: **under ~20 lines**,
in one of the two files above.

For outcome B specifically, `_armAutoFit`'s single rAF also wants a bounded
retry — re-fit while the measured box keeps changing, capped at a few frames — so
a static layout gets the same self-correction an animated one gets for free.

### Step 3 — verification

- The five surfaces in §1, by eye: they must open framed, with no manual Fit.
- `graph-layouts/d3-hierarchy/Tree` must render on load rather than after
  "Re-fit camera".
- The Fit button must frame correctly on the hierarchy datasets (currently
  5443 %).
- `pnpm --filter @invana/graph test` (96 tests) + `check-types` on canvas, graph
  and storybook.

## 5. What improves

- **`fitOnLoad` becomes trustworthy.** It is on by default in every
  `GraphCanvasApp`, so today the default configuration is the broken one.
- **One-shot layouts become first-class.** d3-hierarchy, sankey, ELK and
  geometric all produce their positions in a single write; they are precisely the
  ones this penalises. Today only an *animated* force sim reliably frames, which
  is backwards — the one-shot layouts are the ones with a well-defined settled
  state.
- **`layout.events.on('end') → canvas.fitView()` becomes a safe public recipe.**
  It's what the canvas-react layout wrappers do (`fitPadding`, default 80) and
  what a dozen imperative stories do by hand. Right now that recipe is a coin
  flip, so the docs are teaching something unreliable.
- **The Fit button stops lying.** Same measurement path, so today it can zoom
  *away* from the content.
- **It removes a whole class of false bug reports.** Four separate "nodes are not
  rendering" reports in one session were all this. Each cost a full diagnosis to
  rule out node styling, the data, the layout and the renderer in turn.
- **Consumers stop hand-rolling delays.** Without this, the workaround is
  `setTimeout(() => canvas.fitView(), 300)` in application code — a race
  re-implemented per consumer, and one that gets slower graphs wrong.

## 6. Risks

- `fitView` is on the critical path of every canvas; a synchronous drain before
  measuring adds work to the Fit button and to `fitOnLoad`. Both are user-scale
  events (once per load, once per click), not per-frame, so the cost is
  acceptable — but it must not be moved onto the per-tick follow-fit, which runs
  during a live sim.
- Outcome **C** would be the serious one: it would mean bulk position writes and
  the renderer's spec mirror can disagree, which affects anything reading
  `getShapeWorldBounds` (hit-testing bounds, the minimap, ELK's size queries),
  not just fitting. If step 1 lands there, this RFC should be re-scoped before
  any code is written.

---

## 7. Findings from step 1 (2026-08-02) — partially resolved, **not fixed**

The instrumented run happened. It rules out most of §3 and replaces the guesses
with measurements, but the symptom is still live.

### Measured

- **`getBounds()` is not stale by construction.** It calls `store.flush()` and
  then measures, exactly as documented. The earlier "one frame early" reading was
  an artefact of the probe: its counters were interpolated into the log line
  *before* `getBounds()` ran. Outcome **B** as written is wrong.
- **The fit really does measure a one-node box.** With the store holding correct
  positions, `_contentBounds()` returned `10 × 10` (one `radius: 5` node). Fitting
  that into the viewport *is* the 4400 %.
- **A later fit measures correctly.** Logged sequence on one load: fits #1–#3 saw
  `10 × 10` → scale `44.00`; fit #4 saw `1044 × 951` → scale `0.76`. So the
  projection does land — after several fits.
- **`layout:run:end` is healthy.** It arrives with `reason: 'settled'` for
  `graph-force` (666 ms and 695 ms on a cold load). That part was never broken —
  the earlier `'stopped'` observation was from the superseded *hierarchy* runs.
- **Two writers move a shape.** `moveShape` (position-only fast path, mutates
  `spec.x/y` in place) and `updateShape` — and `updateShape` is called for every
  node with `x=0, y=0`. Which of the two lands last decides what the fit sees.
  This is the live suspect and the next thing to instrument.

### Shipped in this pass

One genuine bug, found on the way and fixed in `Canvas._armAutoFit`: it read
`activeLayout` **once, at arm time**, and `return`ed early when it was null —
permanently discarding the `layout:run:*` subscriptions. A React root applies
config *after* mount, so the definition routinely is null at arm time, and every
later `settled` event was then ignored. It now always subscribes and re-reads
`activeLayout()` per event.

Also added: a re-fit on `data:flush` within a 1 s window of each fit request.
**This does not reliably work** — it corrected the fit while debug `console.log`s
were in the build and stopped when they were removed, i.e. it is timing-dependent.
It is kept because it is bounded and strictly better than nothing, but it is not
the fix and should not be treated as one.

### Revised proposal

Every "wait for it" mechanism — frame count, stability test, flush window — is
guessing when the projection catches up. **The measurement shouldn't depend on
projection at all.** `GraphLayer.getBounds()` derives from
`renderer.getShapeWorldBounds` (projected state); it should derive from the
**store**: `store.getPosition(id)` + `layer.boundsOfNode(node)`, which
`D3ForceLayout` already documents as "a pure calculation that does **not** need
the node to have rendered yet". That is deterministic on the first call.

Scope note: `getBounds()` also feeds the minimap, ELK's size queries and image
export, and it deliberately excludes hidden / collapsed elements — so this is a
larger change than §4 assumed, and wants its own review before implementation.
