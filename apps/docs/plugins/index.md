# Plugins

Built-in extensions that ship with `@invana/canvas` — opt-in pieces you register to give a `Canvas` instance behaviour and look. Three categories:

- **[Decorations](/plugins/decorations/)** — halo, border, glow, marching-ants, pulse-ring, dashed-border-rotating.
- **[Layers](/plugins/layers/)** — `BackgroundLayer`, `ThemedBackgroundLayer`, `DevInfoLayer`.
- **[Behaviours](/plugins/behaviours/)** — `DragPanBehaviour`, `WheelZoomBehaviour`, `PinchZoomBehaviour`, `KeyboardCameraInputBehaviour`.

Decorations register into the `ShapesRenderer`. Layers mount onto the `Canvas` via `canvas.layers.add(...)`. Behaviours register via `canvas.behaviours.add(...)` — none of them auto-enable; every behaviour is explicitly opt-in.
