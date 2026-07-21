# CLAUDE.md — packages/canvas-react (`@invana/canvas-react`)

**The headless React binding layer for `@invana/canvas`.** A declarative `<Canvas>` whose JSX children map to engine layers, behaviours, and layouts via React context — no custom reconciler — plus the hooks that expose engine/store state reactively. **It renders no application UI and never imports `@invana/ui`.** ≈ React Flow's headless core (`<ReactFlow>`, `useReactFlow`, `useNodes`); the pixels live in `@invana/canvas-ui`, which is built on top of these bindings.

> 🚧 **Migration in progress** (`docs/ui-consolidation-plan.md`). This package historically also held UI (components, toolbars, menus, `GraphCanvasApp`); those are moving to `@invana/canvas-ui` on the **headless-vs-pixels** axis, and the dependency direction is flipping to **canvas-ui → canvas-react**. The rules below describe the **target** (headless-only); some UI still physically lives here until the phased move lands. **Don't add new UI here** — new pixels go to `canvas-ui`.

**Litmus for anything landing here:** it renders `null` (an engine wrapper), provides a context, or is a hook. If it draws UI the user sees, it belongs in `@invana/canvas-ui`.

## Pattern

- **Two roots, one per engine class** — `<Canvas>` and `<GraphCanvas>`. They share one lifecycle hook (`useCanvasEngine` + `CanvasHost` in `useCanvasEngine.tsx`: StrictMode-safe `init`, WebGPU→WebGL crash fallback, `config` apply, ref forwarding, sized host `<div>`) and differ **only** in the engine class they instantiate and the contexts they provide:
  - `<Canvas>` — owns a base **`Canvas`** (`@invana/canvas`); provides **`CanvasContext`** only (read via `useCanvas()`). For non-graph canvases. Base layer/behaviour/layout wrappers work under it; no graph context, no `config.activeLayout` auto-run.
  - `<GraphCanvas>` — owns a **`GraphCanvas`** (`@invana/graph`, a strict `Canvas` superset); provides **`CanvasContext` + `GraphCanvasContext`** (so `useCanvas()` **and** `useGraphCanvas()` / `useGraphCanvasUpdate()` / `useGraphCanvasOptions()` work), and `config.activeLayout` auto-runs. This is the graph root; **`GraphCanvasApp` builds on it** (it imports it as `GraphCanvasRoot` to avoid clashing with the engine `GraphCanvas` type used in its `onReady` signatures).
  - Child components aren't mounted until the engine is ready, so `useCanvas()` (and, under `<GraphCanvas>`, `useGraphCanvas()`) are always non-null inside them. Cleanup calls `canvas.destroy()`.
  - **Why the split (and why two contexts):** most wrappers (`<GraphLayer>`, `<D3ForceLayout>`, behaviours, minimap, background) read `useCanvas()` — base API only — so they work under either root. Only the graph hooks/toolbars read `useGraphCanvas()`, so they need `<GraphCanvas>`. The context a component reads is what gates which root(s) it works under.
- Child wrappers (`<GraphLayer>`, `<DragPanBehaviour>`, `<D3ForceLayout>`, …) render `null`. They read the engine from `useCanvas()` and do their imperative work in `useEffect` — register on mount, unregister on cleanup. One wrapper per engine class.
- `forwardRef` on each root exposes the underlying engine instance (`Canvas` / `GraphCanvas`). That's the only surface on the ref; for everything else go through the engine directly (`ref.current.layers.get(...)`, `ref.current.events.tap(...)`).

## Hooks (`src/hooks/`) — the reactive seam

Hooks are the headless heart of this package: they turn engine/store state into reactive React values that `@invana/canvas-ui` builds its UI on.

- **Store hooks** — `useStore(store, selector)` (a `useSyncExternalStore` slice over a kernel `ReactiveStore`), `useGraphCanvasOptions` / `useGraphCanvasUpdate` (read/patch `store.view.definition`). This is the coupling mechanism: UI reads through these and reflects store changes instantly.
- **Engine hooks** — `useCamera` / `useZoom` / `useFitContent` / `useSelection` / `useLayout` / `useCanvasEvent` / `useGraphEvent` / … Resolve the engine from `CanvasContext` **or** an explicit `canvas` arg (`useResolvedCanvas(explicit ?? context)`), so they work from a `<Canvas>` descendant **or** target any instance — multi-canvas-safe.

Hooks may return data, callbacks, and **null-rendering** engine wrappers (e.g. a `<DevInfoLayer>` element), but **not** pixels. A turnkey hook that hands back a button (`useDevTool` / `useMiniMap`) is UI → it lives in `@invana/canvas-ui` and imports the layer-wrapper back from here.

## No application UI here

Components, toolbars, menus, and `GraphCanvasApp` are **pixels** → `@invana/canvas-ui`. Their design-kit styling rules (`@invana/ui` chrome, Tailwind tokens, `ACTIVE_CLASS` / `ACTIVE_MENU_ITEM_CLASS` active treatments, `Tooltipped`, the `*Toolbar` recipe) now live in `packages/canvas-ui/CLAUDE.md`. During the migration some of these files are still physically here; treat that as debt to move, not a pattern to extend.

## Rules

- **No `pixi.js` imports** — wrap engine APIs only.
- **No `@invana/ui` import, and no application UI.** Everything here renders `null`, provides a context, or is a hook. Draws pixels? → `@invana/canvas-ui`.
- **No `@invana/canvas-ui` dependency** (that would cycle — the dependency runs canvas-ui → canvas-react, not back).
- Wrapper effects key on `id` (and for layouts `targetLayerId`) — those are the "identity" props. Other option changes require unmount/remount; document that on every wrapper.
- `<Canvas>` must be StrictMode-safe: track a cancelled flag through the init promise so a double-mount in dev tears down the half-initialised engine cleanly.
- Render order matters. A `<D3ForceLayout targetLayerId="graph">` sibling that runs before its `<GraphLayer id="graph">` mounts won't find the layer. Place layer wrappers before the layouts/behaviours that depend on them in the JSX.

## Scope (v0)

- `<Canvas>` — base engine root (`Canvas`). `<GraphCanvas>` — graph engine root (`GraphCanvas`, both contexts + `activeLayout`). Shared lifecycle in `useCanvasEngine.tsx`.
- `<GraphLayer>` — wraps `@invana/graph` `GraphLayer`. Props: `id`, `data`, `nodeOption`, `edgeOption`. `data` is reactive (calls `layer.setData`); the rest are init-only.
- `<DragPanBehaviour>` / `<WheelZoomBehaviour>` — wraps the engine behaviours of the same name. Props: `id`, `enabled`.
- `<DragNodeBehaviour>` — wraps `@invana/graph` `DragNodeBehaviour`. Props: `id`, `layerId` (default `'graph'`), plus the engine option set (`filter`, `pinWhileDragging`, `pinOnRelease`, `dragCursor`, `groupAware`).
- `<D3ForceLayout>` — wraps `@invana/graph-layout-d3-force` `D3ForceLayout`. Props: `targetLayerId`, plus the layout's own option object. Calls `layout.apply(layer)` on mount; on `end` event optionally calls `camera.fitContent(layer.getBounds(), padding)`.

Not yet wrapped: ElkLayout, MiniMapLayer, DensityContourLayer, BubbleSetsLayer, hover/select/lasso/brush behaviours, DragNodeBehaviour. Same pattern — add files when needed.
