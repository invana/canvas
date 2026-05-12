# Glossary

Canonical vocabulary used across `@invana/canvas` and the domain packages. Aligns with SVG / JointJS terminology where they agree; fills gaps with the most-recognised term. Use these words exactly — alternatives create confusion in cross-package design.

## Engine concepts

| Term | Definition |
|---|---|
| **Canvas** | Engine root. Owns the pixi `Application`, the tick loop, the `Camera`, the `CanvasEventBus`, and the two registries (`LayerRegistry`, `BehaviourRegistry`). |
| **Layer** | Unit of rendered output. Owns its data + state + options + events + visible output + z-order. `WorldLayer` for camera-affected content, `ScreenLayer` for fixed overlays. |
| **Behaviour** | Subscribes to input, mutates a Layer's state. No rendering, no data. Opt-in — every behaviour is explicitly registered AND enabled by the developer. |
| **Layout** | Pure function: reads a layer's data, computes positions, writes them back. Not registered with the canvas. |
| **Renderer** | Internal drawing API used *by* Layers, never added to `canvas.layers`. `PrimitivesRenderer` is the one renderer shipped today. |
| **Camera** | Transform state — pan offset, zoom scale, world↔screen projection. |
| **Viewport** | The DOM surface the canvas renders into. Distinct from `Camera`: the camera never gets clicked or resized, the viewport does. |

## Primitives — drawing-level vocabulary

| Term | Definition |
|---|---|
| **Primitive** | A drawing element managed by `PrimitivesRenderer`. Today: `Shape` or `Connector`. Markers and badges are shapes. |
| **Shape** | A 2D primitive with a closed silhouette (`circle`, `rect`, `polygon`, `regular-polygon`, `star`, …). Has `bounds()` and `drawGeometry()`. |
| **Connector** | A line-like primitive joining two endpoints, optionally passing through waypoints. **One concrete class** — visual variation comes from the `anchor → router → pathStyle` pipeline. |
| **Endpoint** | The `source` or `target` of a connector. Either a literal `{ kind: 'point', x, y }` or a `{ kind: 'shape', shapeId, anchor? }`. |
| **Waypoint** | An intermediate, developer-supplied point a router must respect. (Equivalent to JointJS `vertices`.) |
| **Anchor** | Stage 1 of the connector pipeline. Resolves a shape-id endpoint to a concrete world point on the shape. Built-ins: `center`, `boundary`, `perpendicular`. |
| **Router** | Stage 2. Pure function `(source, target, waypoints?, opts?) → Polyline`. Decides where bends sit. Built-ins: `straight`, `orth`, `manhattan`, `metro`, `er`, `oneSide`. |
| **PathStyle** | Stage 3. Pure function `(polyline, opts?) → Path`. Decides how segments between bends are drawn. Built-ins: `normal`, `rounded`, `smooth`, `bezier`. |
| **Polyline** | Flat point list. Output of router, input to pathStyle. Also produced from a `Path` via `samplePath` for hit-testing and decorations that need uniform-arc-length sampling. |
| **Path** | Ordered list of `PathCommand` (`M`/`L`/`Q`/`C`). Output of pathStyle, walked natively by `Connector` via Pixi's `moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`. |
| **Marker** | A shape painted at a connector endpoint and oriented along the path tangent. Markers are shapes — no separate registry. |
| **Badge** | A shape registered as a follower of a host shape. Auto-anchored to one of eight placements on the host's bounding box; cascade-removes on `removeShape(host)`. |
| **Spec** | The plain-JSON data record describing a primitive instance (`CircleSpec`, `BaseConnectorSpec`). |

## Visual augmentation — three orthogonal concepts

These compose independently and are easy to confuse. Pick the right one for what you're adding.

| Term | Adds | Reads | Writes | Examples |
|---|---|---|---|---|
| **Decoration** | New geometry attached to the host | Host bounds / path | Its own pixi container in a slot on the host | `glow`, `pulse-ring`, `marching-ants`, `flow-particles` |
| **Effect** | Nothing — modulates the host itself | Host gfx | Host transform (`dx`/`dy`/`dRot`/`sx`/`sy`) or style (`tint`/`alpha`) | `shake`, `breathing` |
| **Animation** | Nothing — it's a time engine | `deltaMs` | Any `tick(dt)` consumer (decoration / effect) | `Tween` primitive + easings |

A pulse ring is a decoration (new rings drawn). A "shape gently breathing" is an effect (the host scale modulates). Both use `Tween` for their interpolation curves.

| Term | Definition |
|---|---|
| **Slot** | A named z-band on a primitive (e.g. `'halo'`, `'border'`, `'glow'`, `'pulse'`, `'fx'`). Decorations attach to slots; one decoration per slot per host. |
| **PaintStyle** | Override flags passed into a primitive's `paintInto` — `color`, `alpha`, `strokeWidth`, `fill`, `dashArray`, `dashOffset`, `inset`. Decorations use these to repaint the host's silhouette. |

## Fills

| Term | Definition |
|---|---|
| **ShapeFill** | A number (solid color), a single `ShapeFillLayer`, or an array of layers stacked bottom-up. |
| **Fill kind** | One of `solid`, `image`, `glyph`, `text`, `svg`, `image-inset`, `svg-url`. The engine ships these; icon-vendor specifics (Font Awesome, Lucide, Fluent, …) are produced in developer code and dropped into a `glyph` or `svg` layer. The engine is icon-vendor-agnostic by design. |

## Events

| Term | Definition |
|---|---|
| **CanvasEventBus** | The single canvas-wide event bus exposed at `canvas.events`. Has two channels: `on(name, handler)` for typed events and `tap(handler)` for the firehose envelope channel. |
| **SourceEmitter** | A per-source emitter (`layer.events`, `behaviour.events`). Local subscribers see the plain payload; the bus's tap subscribers see the wrapped `CanvasEvent` envelope. |
| **CanvasEvent envelope** | `{ type, timestamp, source: { kind, id }, payload }` — the wrapper every tap subscriber receives. `type` is `${source.kind}:${source.id}:${name}`. |
| **Tap exclude list** | Suffix patterns the tap drops by default to keep telemetry tractable — `pointermove`, `render:tick`, `shape:pointermove`, `connector:pointermove`, `state:dirty-flush`. Override per subscription. |

## Words deliberately not used

- **`vertex`** — collides with the geometric meaning; we say `endpoint` (connector endpoints) or `waypoint` (intermediate point).
- **`path`** — overloaded; in our vocabulary `Path` is the `PathCommand[]` output of pathStyle, **not** a shape kind.
- **`edge`, `link`** — graph-domain terms. They belong in `@invana/graph`, never in `@invana/canvas`.
- **`element`** — too generic. Use `shape`, `connector`, `primitive`, `node`, or `edge` for the specific thing meant.
- **`plugin` / `plugins`** — implementation detail of the previous architecture. The new world has Layers, Behaviours, Layouts, and Renderers — no plugins.
