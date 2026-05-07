# Layers

Built-in `Layer` subclasses that ship with `@invana/canvas`. Drop them onto any `Canvas` via `canvas.layers.add(...)` — no graph data required.

| Layer | Base | Description |
|---|---|---|
| [`BackgroundLayer`](./background) | `WorldLayer` | Plain solid / grid / dot background that pans and zooms with the camera |
| [`ThemedBackgroundLayer`](./themed-background) | `WorldLayer` | Variant that resolves its colors from the active theme |
| [`DevInfoLayer`](./dev-info) | `ScreenLayer` | Glued-to-corner FPS / camera / draw-call overlay |

::: warning Status
The toolkit layers above are described in `architecture-proposal.md` and listed in the canvas `CLAUDE.md` scope, but the implementations have not landed yet — only the base classes (`Layer`, `WorldLayer`, `ScreenLayer`) ship today. These pages document the planned API.
:::

## Picking a base — `WorldLayer` vs `ScreenLayer`

Default to `WorldLayer`. Diagram content (graph nodes, edges, custom rendering) is camera-affected — it pans and zooms with the user's view.

Reach for `ScreenLayer` only when the content must stay glued to a screen position regardless of camera: minimaps, dev info, floating toolbars, tooltips, lasso rectangles, status badges. The mental test: *if the user pans the camera 100px right, should this thing move with the diagram or stay glued to the screen?*
