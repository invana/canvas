# Reactive State Store — Design Note

> **Status: DESIGN / ROADMAP — not shipped.** Plan for consolidating the canvas's
> *definition + interaction* state into a single reactive store, behind a
> library-agnostic port (zustand today, swappable later). Companion to
> [`store-owns-state-plan.md`](./store-owns-state-plan.md),
> [`unified-canvas-options-plan.md`](./unified-canvas-options-plan.md), and
> [`collaborative-state-plan.md`](./collaborative-state-plan.md).

## Goal

One reactive store that is the single source of truth for the **canvas state** —
consumed by React components *and* plain-JS/engine code with **no duplicate copies and
no manual syncing**. zustand backs it today; a port abstraction keeps it transferable
(valtio / nanostores / a Yjs-backed store for collaboration) without touching consumers.

## Scope — what is "canvas state" vs. "data"

The store holds the **definition + interaction** layer. The **data layer stays out** —
this boundary is load-bearing (it's what keeps the system fast and syncable).

| In the store (reactive) | NOT in the store (`GraphStore` / `ColumnStore`) |
|---|---|
| config — layers / behaviours / layouts options + `activeLayout` | node/edge data & payloads |
| templates, theme | positions, pinned |
| interaction — selection, hover, view modes, camera transform | streaming feeds |

Why: immer/CRDT cloning bulk data costs ~5–50 ms per mutation at 500k items; typed-array
`ColumnStore` writes are ~10 ns. Hot, machine-rate data must never go through the reactive
store. See [`collaborative-state-plan.md`](./collaborative-state-plan.md) for the full
state-vs-data rationale.

## Today (verified)

- `Canvas.config` is a **plain object** (`private config: CanvasConfig = {}`), deep-merged
  in `update()`, read via `get()`, with a coarse **`options:change`** event
  (`packages/canvas/src/engine/Canvas.ts`). **Not** a reactive store.
- zustand is a dependency + `createLayerStore` wrapper (`packages/canvas/src/state/Store.ts`,
  middleware: `devtools → subscribeWithSelector → immer`) — but it's only wired into the base
  `Layer`, and `GraphLayer`'s state is an empty `_placeholder` stub.
- React `useGraphCanvasOptions()` copies config into `useState` and re-syncs on
  `options:change` — the copy/anti-pattern this plan removes.
- Interaction state is scattered: selection in `ClickSelectBehaviour` private maps; hover in
  the `GraphStore` runtime-presence compartment; camera in the viewport.

So: the infra (zustand, the config model, `update()`/`get()`, editors, React hooks) exists;
the config just isn't *on* a reactive store yet. This is an incremental refactor (~75% there),
not a rewrite.

## The port — program against this, not zustand

```ts
// @invana/canvas/src/state/ReactiveStore.ts — library-agnostic contract
export interface ReactiveStore<T> {
  getState(): T;
  /** declarative patch + optional action label — maps to setState today, a Yjs txn later */
  update(patch: DeepPartial<T>, action?: string): void;
  /** lowest-common-denominator: fires on any change */
  subscribe(listener: (state: T, prev: T) => void): () => void;
}
```

- **zustand is one adapter** behind it (`state/createConfigStore.ts`) — the *only* file that
  imports zustand. Enforced by lint: no `import … from 'zustand'` elsewhere.
- **Writes are declarative patches** (`update(patch, action?)`). Don't expose immer drafts or
  zustand's `set/get/api` creator signature — those are adapter-specific and would leak.
- **Selector + equality logic** lives in our `select()` helper, not the underlying lib, so the
  semantics survive a backend swap.
- **Telemetry is a port *decorator*** (`withTelemetry(store, sink)`), not a zustand middleware,
  so it transfers across backends (see [`collaborative-state-plan.md`] OTel section).

## React / JS consumption — no copies

```ts
// React: reads directly via useSyncExternalStore; re-renders only when the slice changes
const charge = useStore(store, s => s.layouts.force.charge);

// plain JS / engine / non-React widget:
store.subscribe(s => applyToRenderer(s));
```

UI components do **not** hold their own copy of canvas state. Legitimate local state stays
local: ephemeral widget UI (dropdown open, button hover) and editor edit-*drafts*
(react-hook-form buffer committed on Apply). Rule: **canvas state → the store; transient
widget state → local; never mirror store state into component state.**

## Consolidation phases (each keeps `pnpm check-types` green)

1. **Port + adapter.** Add `ReactiveStore<T>` + `createConfigStore` (zustand adapter); back
   `Canvas.config` with it (replace the plain object). Keep emitting `options:change` from a
   store subscription for back-compat.
2. **Read paths.** Add `useStore(store, selector)` (via `useSyncExternalStore`); replace the
   copy-based `useGraphCanvasOptions`. Plain JS uses `store.subscribe`.
3. **Fold in interaction state.** Migrate selection / hover into the store's `interaction`
   slice (this is `store-owns-state-plan.md`). **Open decision:** store *owns* interaction
   state (migrate out of `GraphStore`/behaviours) vs. `GraphStore` keeps presence and the
   store *mirrors* it. Lean: own it.
4. **Telemetry decorator**, then later a **Yjs adapter** behind the same port for collaboration
   — consumers unchanged.

Effort ≈ 2–3 days; most of it is the migration you'd do anyway. The abstraction itself is ~3
small files (port, adapter, hook) + the telemetry decorator. A trivial `Map`-backed adapter
used in tests proves the port is real and the swap is safe.

## Final shape

```
                 store: ReactiveStore<CanvasState>   (one source of truth)
                   {
                     config:      { layers, behaviours, layouts, activeLayout },  ← editors bind
                     templates, theme,
                     interaction: { selection, hover, viewMode, camera },          ← inspector reads
                   }
   React  ── useStore(store, selector) ──┐
   JS     ── store.subscribe ────────────┤  no copies; the renderer reads ColumnStore separately
   editors── update(patch, action) ──────┘
```

## Packaging

The "single canvas-state" is the **store**, not necessarily a separate package. Build it as a
`state/` module **inside `@invana/canvas`** (where `CanvasConfig` + zustand already live; matches
`unified-canvas-options-plan.md` Q1). Extract to `@invana/canvas-core` **only if** a second
consumer needs it standalone (e.g. the collaboration server). The consume-API (`useStore` /
`subscribe`) is identical either way, so extracting later is a move, not a rewrite.

## Open decisions

1. **Interaction-state ownership** (phase 3): store owns it vs. mirrors `GraphStore` presence.
2. **Packaging**: `state/` module in `@invana/canvas` now (recommended) vs. `@invana/canvas-core` package.
3. **Selector/equality API surface** on the port — keep it minimal and adapter-neutral.
