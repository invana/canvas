# Decorations

A **decoration** is a generic 2D visual attached to a host primitive — a halo around a node, a border on a table, a marching-ants outline on a selected edge. Decorations live in the `ShapesRenderer` and are projected from layer state via `renderer.setDecoration(id, kind, style)`.

Six built-in shape decorations ship with `@invana/canvas`. Two also ship in connector variants (`MarchingAntsConnectorDecoration`, `PulsatingGlowConnectorDecoration`).

| Kind | Class | Animated | Slot |
|---|---|---|---|
| [`halo`](./halo) | `HaloDecoration` | no | `halo` (below shape) |
| [`border`](./border) | `BorderDecoration` | no | `border` (above shape) |
| [`glow`](./glow) | `GlowDecoration` | no | `glow` (deepest behind shape) |
| [`marching-ants`](./marching-ants) | `MarchingAntsDecoration` | yes | `border` |
| [`pulse-ring`](./pulse-ring) | `PulseRingDecoration` | yes | `pulse` (above shape) |
| [`dashed-border-rotating`](./dashed-border-rotating) | `DashedBorderRotatingDecoration` | yes | `border` |

Animated decorations advance their phase via `tickAnimations(dt)` driven by the Canvas tick.
