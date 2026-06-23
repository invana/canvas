# Layout-aware rendering — LOD while moving + deferred reveal of new nodes

**Status**: Proposal
**Scope**: `@invana/canvas` (events), `@invana/graph` (behaviour + reveal gate), the iterative layouts
(`@invana/graph-layout-d3-force`), `@invana/canvas-react` (wrappers).
**Motivating consumer**: Invana Studio Explorer — node-expand produces 500+ node graphs; an animated
force layout settles slowly/jankily, and newly-added nodes flash at the origin before the layout places
them. Studio can only band-aid this (detune the force, or `animate:false`), so the fix belongs here as a
reusable engine capability.

---

## Problem

Two symptoms, one root cause — **the canvas can't coordinate rendering with a layout run.**

1. **Expensive animated settle.** With an iterative layout (`D3ForceLayout`, `animate: true`) every tick
   writes positions → a full repaint (edges re-stroked, labels re-placed) for the whole settle. On large
   graphs this is slow/janky. The existing LOD behaviours
   (`LabelResolutionLODBehaviour`, `EdgeSizeLODBehaviour`, `NodeSizeLODBehaviour`, all
   `ElementSizeLODBehaviour`-based) are **zoom/size-driven** — they don't engage just because the graph
   is *in motion*.

2. **Un-positioned flash.** `GraphStore.addData(...)` (`packages/graph/src/layer/GraphLayer.ts:417`)
   appends nodes that render at their default/anchor position *immediately*, and only then does the run
   reposition them — so you see pile-at-origin → jump-to-place. This is **independent of `animate`** (the
   add paints before the run starts). The store already distinguishes "un-positioned" nodes
   (`packages/graph/src/layout/OneShotPositionLayout.ts:235` — *"New (un-positioned) nodes start at
   their…"*); what's missing is *withholding their render until a run places them.*

## Current state (grounded)

- **Events** (`packages/canvas/src/events/CanvasEventBus.ts:57`, `CanvasGlobalEvents`): only
  `layout:added` / `layout:removed` (registration, from `LayoutRegistry`). `EventSourceKind` already
  includes `'layout'` (`events/CanvasEvent.ts:18`). The run's start/end is surfaced **only** as `message`
  text (`Canvas.showMessage`) — no typed run-lifecycle event.
- `Canvas.runLayout(id)` (`engine/Canvas.ts:390`) resolves a `Promise<void>` on settle; the active layout
  also runs via `refresh()`.
- Store positions via `setPosition` / `setPositionsBulk` / `getPosition` (`store/types.ts:161`); the
  un-positioned concept already exists for one-shot layouts.

## Proposal

Three additive pieces, each independently useful, sharing the new events. **They deliberately live at
different layers** — keep the layout doing geometry, the layer/behaviour doing rendering:

| Piece | Lives in | Default | Why there |
|---|---|---|---|
| Run events | layout / `Canvas.runLayout` | **always on** | only the run knows start/settle; it's a primitive, not a policy |
| LOD while moving | **opt-in behaviour** (`@invana/graph`) | off (opt-in) | render policy, consumer-specific, layout-agnostic, composes with zoom LOD |
| Deferred reveal | `GraphLayer` (+ store flag) | **on, opt-out** | the flash is near-universally unwanted (correctness/polish), but the render gate is the layer's job |

Rationale: a layout's responsibility is *positions*, not *render detail* — so detail/LOD must **not** be
baked into the layout. The events are the only layout-intrinsic part; everything else reacts to them at
the layer/behaviour level. This makes one behaviour work across all layout types (it branches on the
event's `animate` flag) and lets consumers opt in/out instead of having policy forced on them.

### 1. Layout run lifecycle events  (`@invana/canvas`)

Add to `CanvasGlobalEvents`:

```ts
'layout:run:start': { id: string; nodeCount: number; edgeCount: number; animate: boolean }
'layout:run:end':   { id: string; reason: 'settled' | 'stopped' | 'cancelled' }
// optional, high-frequency — gate behind a flag or omit:
// 'layout:run:tick': { id: string; alpha: number }

```

Emit from the run path (`Canvas.runLayout` / the `Layout` base) at the points that already call
`showMessage("Laying out…")` / `("…ready")`. Purely additive; subscribable via `useCanvasEvent`. This is
the missing primitive — everything else builds on it. Useful on its own for progress UIs / telemetry
(Studio already opens layout/render spans around `runLayout`).

### 2. `LayoutActivityLODBehaviour`  (`@invana/graph`)

A sibling of the zoom-driven LOD behaviours (`packages/graph/src/behaviours/`), triggered by **layout
activity** instead of zoom:

- `layout:run:start` → enter reduced-detail mode; `layout:run:end` → restore (any reason).

```ts
interface LayoutActivityLODBehaviourOptions {
  enabled?: boolean;        // default true
  minNodes?: number;        // only engage above this count; small graphs stay full-detail
  dropNodeLabels?: boolean; // hide node label text while moving
  dropEdgeLabels?: boolean;
  simplifyEdges?: boolean;  // straight routing, no decorations, while moving
  dropEdges?: boolean;      // (aggressive) skip edge rendering entirely while moving
}
```

Composes with zoom LOD (both just lower detail; restore is idempotent) and reuses the same detail
switches those behaviours already drive.

### 3. Deferred reveal of un-positioned nodes  (`@invana/graph`)

Cure the flash, built on the same events + the existing un-positioned concept:

- nodes added without an explicit position are **un-positioned** (store flag — extend what
  `OneShotPositionLayout` already relies on);
- while a run that will place them is active (`layout:run:start` → `…:end`), `GraphLayer` does **not
  render** un-positioned nodes/their incident edges (or draws them at opacity 0);
- on `layout:run:end` they're marked positioned and revealed (optional short fade).

For `D3ForceLayout` the run is the easy half (add nodes → reheat `alpha ≈ 0.3` → run → stop is what
`runLayout` already does); the new bit is the **hide-until-placed gate**. Exposed as `revealOnSettle`
(default on), independent of `animate` (cures the flash on both `true`/`false`).

## Alternatives considered

- **Consumer workarounds** (string-match `message`, hook the app's own `runLayout`) — leaky, per-app.
- **`animate: false` for large graphs** — removes the settling animation; blunt. Coarse fallback.
- **Runtime resolution drop** — not possible (PixiJS DPR fixed at `Application.init`).
- **Tick throttling** (paint every Nth tick) — orthogonal/complementary; could be a separate layout knob.

## Open questions

1. **Profile first** (in `apps/dev` / a story): which dominates per tick — edge re-stroke, label sprites,
   or sim compute? Sets the default `drop*` set for (2).
2. Default `minNodes`.
3. **Reveal failsafe**: if an add happens but **no run follows** (paused/disabled layout, or a layout
   that no-ops on tiny adds), reveal after a timeout so nodes never get stuck hidden.
4. Where the reveal gate lives — `GraphLayer` render skip vs a store visibility flag.
5. Restore API for (2) — `Canvas.update()` patch (emits `options:change`) vs a detail-mode setter.
6. Do manual runs (`refresh()` / header "Run layout") and expand re-layouts all emit the run events? (They
   should — consistent behaviour across triggers.)

## Rollout

1. **Events** (`CanvasEventBus` + emit in the run path) — additive, non-breaking, useful alone.
2. **`LayoutActivityLODBehaviour`** once profiling sets defaults.
3. **Deferred reveal** (`revealOnSettle`) on `GraphLayer` + store.
4. **`canvas-react`** wrappers + a docs story that profiles a large graph.
5. **Studio** drops its force-detune / decay band-aid and mounts the behaviour.
