# CLAUDE.md — packages/canvas-react (`@invana/canvas-react`)

React bindings for `@invana/canvas`. A declarative `<Canvas>` whose JSX children map to engine layers, behaviours, and layouts via React context — no custom reconciler.

## Pattern

- `<Canvas>` — owns the engine instance. Renders a sized `<div>`, runs `await new Canvas().init(...)` inside `useEffect`, then provides the initialised `Canvas` via `CanvasContext`. Cleanup calls `canvas.destroy()`. Child components are not mounted until the engine is ready, so `useCanvas()` is always non-null inside them.
- Child wrappers (`<GraphLayer>`, `<DragPanBehaviour>`, `<D3ForceLayout>`, …) render `null`. They read the engine from `useCanvas()` and do their imperative work in `useEffect` — register on mount, unregister on cleanup. One wrapper per engine class.
- `forwardRef` on `<Canvas>` exposes the underlying `Canvas` instance. That's the only surface on the ref; for everything else go through the engine directly (`ref.current.layers.get(...)`, `ref.current.events.tap(...)`).

## Rules

- No `pixi.js` imports — wrap engine APIs only.
- Wrapper effects key on `id` (and for layouts `targetLayerId`) — those are the "identity" props. Other option changes require unmount/remount; document that on every wrapper.
- `<Canvas>` must be StrictMode-safe: track a cancelled flag through the init promise so a double-mount in dev tears down the half-initialised engine cleanly.
- Render order matters. A `<D3ForceLayout targetLayerId="graph">` sibling that runs before its `<GraphLayer id="graph">` mounts won't find the layer. Place layer wrappers before the layouts/behaviours that depend on them in the JSX.

## Scope (v0)

- `<Canvas>` — engine root.
- `<GraphLayer>` — wraps `@invana/graph` `GraphLayer`. Props: `id`, `data`, `nodeOption`, `edgeOption`. `data` is reactive (calls `layer.setData`); the rest are init-only.
- `<DragPanBehaviour>` / `<WheelZoomBehaviour>` — wraps the engine behaviours of the same name. Props: `id`, `enabled`.
- `<DragNodeBehaviour>` — wraps `@invana/graph` `DragNodeBehaviour`. Props: `id`, `layerId` (default `'graph'`), plus the engine option set (`filter`, `pinWhileDragging`, `pinOnRelease`, `dragCursor`, `groupAware`).
- `<D3ForceLayout>` — wraps `@invana/graph-layout-d3-force` `D3ForceLayout`. Props: `targetLayerId`, plus the layout's own option object. Calls `layout.apply(layer)` on mount; on `end` event optionally calls `camera.fitContent(layer.getBounds(), padding)`.

Not yet wrapped: ElkLayout, MiniMapLayer, DensityContourLayer, BubbleSetsLayer, hover/select/lasso/brush behaviours, DragNodeBehaviour. Same pattern — add files when needed.
