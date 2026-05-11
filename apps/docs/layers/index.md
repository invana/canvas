# Layers

A **Layer** is the unit of composition in `@invana/canvas`. Each layer owns its visual output, interaction state, and per-frame flush. A scene is a stack of layers ordered by `zIndex`.

This section catalogues the built-in layers that ship with `@invana/canvas`. For the conceptual deep-dive on the base classes (`Layer`, `WorldLayer`, `ScreenLayer`) — lifecycle, dirty batching, hit-testing — see [Engine → Layers](/guide/layers).

## Base classes

| Class | Coordinate space | When to use |
|---|---|---|
| [`WorldLayer`](/guide/layers#picking-a-base-worldlayer-vs-screenlayer) | World (camera-affected) | Diagram content: nodes, edges, ER tables, swimlanes, custom rendering. **Default for almost everything.** |
| [`ScreenLayer`](/guide/layers#picking-a-base-worldlayer-vs-screenlayer) | Screen (viewport-fixed) | Overlays glued to the viewport: minimaps, dev panels, toolbars, tooltips, lasso rectangles. |

Mental test: *if the user pans the camera 100 px right, should this thing move with the diagram or stay glued to the screen?* Move with the diagram → `WorldLayer`. Stay glued → `ScreenLayer`.

## Built-in layers

The engine ships two opt-in developer overlays. Both are `ScreenLayer` subclasses rendered as plain absolutely-positioned HTML overlays above the canvas — neither participates in engine hit-testing.

| Layer | Purpose |
|---|---|
| [`DevInfoLayer`](/layers/dev-info-layer) | HUD showing canvas size, camera position / zoom, visible world bounds, pointer coords, and FPS. |
| [`LayersPanelLayer`](/layers/layers-panel-layer) | Floating panel listing every mounted layer with a per-row visibility checkbox. |

Both layers are **opt-in** — they are not auto-registered. Construct and add them like any other layer:

```ts
import { Canvas, DevInfoLayer, LayersPanelLayer } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

canvas.layers.add(new DevInfoLayer({ corner: 'bottom-left' }));
canvas.layers.add(new LayersPanelLayer({ corner: 'top-right' }));
```

Background layers (`BackgroundLayer`, `ThemedBackgroundLayer`), minimaps, and other built-ins ship from their respective domain packages — see the [package status](/guide/packages) page for the current state.
