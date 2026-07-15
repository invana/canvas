# CLAUDE.md — packages/canvas-react (`@invana/canvas-react`)

React bindings for `@invana/canvas`. A declarative `<Canvas>` whose JSX children map to engine layers, behaviours, and layouts via React context — no custom reconciler.

## Pattern

- **Two roots, one per engine class** — `<Canvas>` and `<GraphCanvas>`. They share one lifecycle hook (`useCanvasEngine` + `CanvasHost` in `useCanvasEngine.tsx`: StrictMode-safe `init`, WebGPU→WebGL crash fallback, `config` apply, ref forwarding, sized host `<div>`) and differ **only** in the engine class they instantiate and the contexts they provide:
  - `<Canvas>` — owns a base **`Canvas`** (`@invana/canvas`); provides **`CanvasContext`** only (read via `useCanvas()`). For non-graph canvases. Base layer/behaviour/layout wrappers work under it; no graph context, no `config.activeLayout` auto-run.
  - `<GraphCanvas>` — owns a **`GraphCanvas`** (`@invana/graph`, a strict `Canvas` superset); provides **`CanvasContext` + `GraphCanvasContext`** (so `useCanvas()` **and** `useGraphCanvas()` / `useGraphCanvasUpdate()` / `useGraphCanvasOptions()` work), and `config.activeLayout` auto-runs. This is the graph root; **`GraphCanvasApp` builds on it** (it imports it as `GraphCanvasRoot` to avoid clashing with the engine `GraphCanvas` type used in its `onReady` signatures).
  - Child components aren't mounted until the engine is ready, so `useCanvas()` (and, under `<GraphCanvas>`, `useGraphCanvas()`) are always non-null inside them. Cleanup calls `canvas.destroy()`.
  - **Why the split (and why two contexts):** most wrappers (`<GraphLayer>`, `<D3ForceLayout>`, behaviours, minimap, background) read `useCanvas()` — base API only — so they work under either root. Only the graph hooks/toolbars read `useGraphCanvas()`, so they need `<GraphCanvas>`. The context a component reads is what gates which root(s) it works under.
- Child wrappers (`<GraphLayer>`, `<DragPanBehaviour>`, `<D3ForceLayout>`, …) render `null`. They read the engine from `useCanvas()` and do their imperative work in `useEffect` — register on mount, unregister on cleanup. One wrapper per engine class.
- `forwardRef` on each root exposes the underlying engine instance (`Canvas` / `GraphCanvas`). That's the only surface on the ref; for everything else go through the engine directly (`ref.current.layers.get(...)`, `ref.current.events.tap(...)`).

## UI: hooks + components + toolbars

The control/toolbar UI lives **here** (moved out of `@invana/canvas-ui`, which is now editors-only), in three layers — the React-Flow split:

- **Hooks** (`src/hooks/`) — `useCamera` / `useZoom` / `useFitContent` / `useCanvasEvent`. Resolve the engine from `CanvasContext` **or** an explicit `canvas` arg (`useResolvedCanvas(explicit ?? context)`), so they work from a `<Canvas>` descendant **or** target any instance — multi-canvas-safe.
- **Components** (`src/components/`) — the dumb building blocks: `Panel`, `Tooltipped`, `ControlButton`, `ZoomControls`, `FitContentButton`, `LockToggle`, `ClearButton`, `OptionPicker` (+ `ToolbarIcon` / `PanelPosition` / `TooltipSide` types). **Engine-agnostic, icon-agnostic** (icons passed as a `ToolbarIcon` prop), props-in / callbacks-out. Chrome from `@invana/ui` (Button / DropdownMenu / Tooltip / Nav\*); no raw `<button>`/`<select>`, no `lucide-react` import here. These import **no** canvas/engine — keep them dumb. The canvas equivalents of React Flow's `<Panel>` / `<ControlButton>`. **Tooltips:** every interactive control surfaces its `title` / `label` as a real `@invana/ui` (Radix) tooltip via the shared `Tooltipped` wrapper (self-contained `TooltipProvider`), with an optional `tooltipSide` prop — so the controls read well dropped into a `NavHorizontal` / `NavVertical` slot. **Styling:** default to the design-kit look — the `@invana/ui` chrome plus its Tailwind design tokens (`primary`, `accent`, …). Assume the design-kit Tailwind theme is present; don't write components that avoid Tailwind. For **active / selected / toggled** toolbar buttons reuse the design-kit sidebar nav-item treatment via the shared `ACTIVE_CLASS` (`bg-primary/15 text-primary ring-1 ring-primary/25`) layered over a `'ghost'` Button — a subtle primary tint + icon + ring, **not** a solid `'default'`-variant fill. For the **selected item inside a dropdown/radio picker** use the lighter `ACTIVE_MENU_ITEM_CLASS` (`text-primary font-medium`) on the active `DropdownMenuRadioItem` instead — the tint + ring read as heavy in a menu list. Both are exported from `ControlButton`; don't reintroduce per-component active styles.
- **Toolbars** (`src/toolbars/`) — assembled from the components; **named with the `*Toolbar` suffix**. `CanvasControlsToolbar` **self-wires** zoom/fit/lock from the hooks (React Flow's `<Controls>`; pass `bare` + an explicit `canvas` to drive the active canvas from external chrome). `GraphToolbar` is a callback-driven turnkey (layout/select/clear). New self-wiring toolbars follow the recipe: consume a hook, render a component inside a `<Panel>`, accept an optional `canvas` prop, and end the name in `Toolbar`.

`@invana/ui` is a dependency (the components use its chrome). `@invana/canvas-ui` is **not** a dependency of this package.

## Rules

- No `pixi.js` imports — wrap engine APIs only.
- The `src/components/` building blocks stay **dumb**: no `@invana/canvas` / `@invana/canvas-react` / engine imports, no `lucide-react`. Engine wiring belongs in `src/toolbars/` (via the hooks) or the consumer.
- **Default to design-kit styling.** UI components use `@invana/ui` chrome + its Tailwind design tokens; the design-kit Tailwind theme is assumed available (don't engineer around its absence). Active/selected/toggled buttons = the shared `ACTIVE_CLASS` nav-item treatment over a `'ghost'` Button, not a solid fill; selected dropdown-menu items = `ACTIVE_MENU_ITEM_CLASS`. Reuse both (exported from `ControlButton`) rather than hand-rolling per-component active styles.
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
