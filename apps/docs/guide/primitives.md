# Primitives renderer

`PrimitivesRenderer` is the domain-free drawing API a Layer composes to draw shapes, connectors, markers, and decorations. The renderer is **not** a Layer and is never added to `canvas.layers` — Layers own it internally.

```ts
import { PrimitivesRenderer } from '@invana/canvas/primitives';

this.renderer = new PrimitivesRenderer({
  container: this.container,  // a Layer's root pixi Container
  camera: ctx.camera,
});
```

Construction options:

| Field | Description |
|---|---|
| `container` | A pixi `Container` the renderer draws into. Layers pass their own root. |
| `camera` | The canvas `Camera`. Used for world ↔ screen projection during hit-testing and pointer event translation. |
| `textureRegistry` *(optional)* | Shared image cache. When omitted the renderer creates an internal one. |

## Five extensible registries

The renderer ships built-ins for each and accepts custom registrations.

| Registry | Built-ins | Purpose |
|---|---|---|
| **shapes** | `circle`, `rect`, `arrow` | Closed silhouettes (and markers — markers are shapes). |
| **routers** | `straight`, `orth` (a.k.a. `orthogonal`), `manhattan`, `metro`, `er`, `oneSide` | Compute a `Polyline` (where bends sit) between two endpoints. |
| **pathStyles** | `normal`, `rounded`, `bezier`, `smooth` | Turn a `Polyline` into a `Path` (how segments between bends are drawn). |
| **anchors** | `center`, `boundary`, `perpendicular` | Resolve a shape-id endpoint to a concrete world point on the shape. |
| **decorations** | `glow` (shape decoration) | Halos / glows / borders / animations attached to a shape or connector. |

There is **no connector registry** — one concrete `Connector` class. Variation comes from the `anchor → router → pathStyle` pipeline.

## Adding shapes

```ts
renderer.addShape('node-a', {
  kind: 'circle',
  x: 0, y: 0,
  radius: 32,
  fill: 0x4f46e5,
  stroke: { color: 0x1e1b4b, width: 2 },
});

renderer.addShape('card', {
  kind: 'rect',
  x: 100, y: -24,
  width: 200, height: 48,
  cornerRadius: 8,
  fill: 0xfff7d6,
});
```

Update by id (partial spec):

```ts
renderer.updateShape('node-a', { x: 50, y: 20 });
```

Remove:

```ts
renderer.removeShape('node-a');
```

### Common shape spec fields (`BaseShapeSpec`)

| Field | Type | Description |
|---|---|---|
| `kind` | `string` | Registered shape kind. |
| `x` / `y` | `number` | World-space position. For `circle` this is the centre; for `rect` it's the top-left. |
| `fill` | `ShapeFill` | A number (solid color), a single `ShapeFillLayer`, or an array of layers stacked bottom-up. |
| `stroke` | `ShapeStroke` | Border. |
| `zIndex` | `number` | Default `0`. Higher draws on top; used for hit-test ordering. |
| `alpha` | `number` | 0..1 |
| `visible` | `boolean` | Default `true`. |

### Fill layers

A `ShapeFillLayer` is one painted/inset layer; an array stacks them bottom-up.

| Kind | Notes |
|---|---|
| `solid` | `{ color, alpha? }` |
| `image` | URL-loaded silhouette fill with `fit: 'fill' \| 'cover' \| 'contain' \| 'none' \| 'tile'`. |
| `glyph` | Font-rendered single character (icon-font codepoint, Unicode, emoji). `fontFamily`/`fontWeight` etc. configurable. |
| `text` | Multi-character text label (badge label, card title). |
| `svg` | Inline SVG path-d string with `viewBox`. |
| `image-inset` | URL-loaded raster inset (logo on a plate). |
| `svg-url` | SVG fetched from URL; primitives extracted into a single pathD. |

The engine has no dedicated "icon" kind — icon-library specifics (Font Awesome glyphs, Lucide SVGs, Fluent icons, …) are produced by developer code and dropped into a `glyph` or `svg` layer.

## Adding connectors

```ts
renderer.addConnector('a-b', {
  kind: 'connector',
  source: { kind: 'shape', shapeId: 'node-a', anchor: 'boundary' },
  target: { kind: 'shape', shapeId: 'card',  anchor: 'boundary', padding: 4 },
  router: 'manhattan',
  pathStyle: 'rounded',
  pathStyleOpts: { radius: 8 },
  stroke: { color: 0x111827, width: 2 },
  targetMarker: { kind: 'arrow', fill: 0x111827, lengthScale: 4, widthScale: 3 },
});
```

### Endpoint kinds

```ts
// Bound to a shape — the anchor resolves the real point each frame
{ kind: 'shape', shapeId: string, anchor?: AnchorSpec, padding?: number }

// Fixed point in world space
{ kind: 'point', x: number, y: number, tangent?: Vec2 }
```

`padding` on a shape endpoint moves the endpoint outward along the anchor tangent — useful when a glow/halo decoration extends past the silhouette and you want the line to visibly start at the decoration's edge.

### Routers — choosing the polyline topology

| Kind | Behaviour |
|---|---|
| `straight` | Direct line between endpoints + waypoints. |
| `orth` (alias `orthogonal`) | Axis-aligned H/V bends. |
| `manhattan` | Obstacle-aware orthogonal; A* on a coarse grid around `RouterCtx.obstacles`. Falls back to `orth` when no obstacles. |
| `metro` | Subway-style bends with mid-segment offsets. |
| `er` | ER-diagram style endpoint-aware routing. |
| `oneSide` | Forces both endpoints on the same side of their hosts (parent-child trees). |

Pass per-router options via `routerOpts`.

### PathStyles — choosing the visual style

| Kind | Behaviour |
|---|---|
| `normal` | Straight segments between polyline points. |
| `rounded` | Quadratic fillets at corners. Pass `pathStyleOpts: { radius: N }`. |
| `bezier` | Single cubic Bézier A→B with auto-derived control points. |
| `smooth` | Catmull-Rom spline → cubic Bézier. |

### Anchors — resolving a shape endpoint to a point

| Kind | Behaviour |
|---|---|
| `center` | Geometric centre of the AABB. |
| `boundary` | Perimeter intersection toward the other endpoint. |
| `perpendicular` | Side-aware exit; useful with `orth` / `manhattan`. |

Specify on the endpoint: `anchor: 'boundary'` or `anchor: { name: 'boundary', opts: { ... } }`.

### Markers

A marker is **any registered shape spec without `x`/`y`** — the connector positions and orients it at the polyline endpoint. Use the `arrowMarkerSpec` helper for the built-in arrow:

```ts
import { arrowMarkerSpec } from '@invana/canvas/primitives';

renderer.addConnector('a-b', {
  kind: 'connector',
  source: { kind: 'shape', shapeId: 'a' },
  target: { kind: 'shape', shapeId: 'b' },
  router: 'straight',
  stroke: { color: 0x111827, width: 2 },
  targetMarker: arrowMarkerSpec({ fill: 0x111827, lengthScale: 4, widthScale: 3 }),
});
```

Or pass the raw spec inline: `{ kind: 'arrow', fill: 0x111827, lengthScale: 4 }`.

`ArrowMarker` is the only built-in marker today. Sizing is **proportional to the host connector's stroke width** — a 1px line gets a 4×3 arrow with default scales; a 7px line gets a 28×21 arrow. The base width is additionally clamped to `≥ strokeWidth` so a thick line never feeds into a narrower arrow base.

To author a custom marker, register a shape kind that exposes a `static paintInto(g, spec, anchor, angleRad, style?, strokeWidth?)` (and optionally `static markerInset(spec, strokeWidth?)` to tell the connector how much to trim the line so it stops where the marker visually begins).

## Decorations

A decoration attaches to a shape or connector and paints into a slot (`'halo'`, `'border'`, `'glow'`, anything you name). `setDecoration` registers/replaces; `null` removes:

```ts
renderer.setDecoration('node-a', 'glow', {
  kind: 'glow',
  style: { color: 0xffd700, radius: 16, layers: 6, innerAlpha: 0.55 },
});

renderer.setDecoration('node-a', 'glow', null); // clear
```

### Built-in decorations

| Kind | Target | Style |
|---|---|---|
| `glow` | `shape` | `{ color: number, radius?: number, layers?: number, innerAlpha?: number }` |

That's the entire shipping set today. Other decorations (`halo`, `border`, `marching-ants`, `pulse-ring`, `breathing`, connector decorations) are planned but not yet built.

### Animated decorations

A decoration that exposes `tick(deltaMs): boolean` is automatically registered into the renderer's per-frame animation set. `tickAnimations(dt)` on the renderer (called by the canvas tick) advances every animated decoration; `tick` returns `true` to keep ticking, `false` to retire.

`GlowDecoration` is static — it does not animate.

## Badges

A badge is a regular shape registered as a "follower" of a host shape — its `(x, y)` is computed from the host's AABB + a placement anchor:

```ts
renderer.setBadge('node-a', 'count', {
  placement: 'top-right',
  shape: {
    kind: 'circle',
    radius: 10,
    fill: 0xef4444,
  },
  offsetX: 2,
  offsetY: -2,
  decorations: {
    label: { kind: 'glow', style: { color: 0xfca5a5, radius: 6 } },
  },
});

renderer.removeBadge('node-a', 'count');
```

Eight `BadgePlacement` values: `top` / `bottom` / `left` / `right` / `top-left` / `top-right` / `bottom-left` / `bottom-right`. The badge re-anchors automatically on `updateShape(hostId, ...)` and cascade-removes on `removeShape(hostId)`.

Because a badge is just a shape under the hood, every shape capability works on it: any registered kind as the plate, any fill layer as content, any registered decoration via `setDecoration` on the badge's id.

## Hit-testing

```ts
const hit = renderer.hitTest(worldX, worldY);
// → { kind: 'shape' | 'connector', id: string } | null
```

The renderer maintains a spatial index (`rbush`) of shape AABBs and connector segments. `hitTest` returns the topmost hit; resolution is by `zIndex` then by registration order. Shapes can implement `contains(localX, localY)` for precise containment beyond AABB; `CircleShape` does this so a click in the bounding-box corner doesn't register as a hit.

## Pointer events

The renderer emits raw pointer events for shapes and connectors:

```ts
renderer.events.on('shape:pointerdown', ({ id, worldX, worldY, button }) => {
  // ...
});

renderer.events.on('shape:click', ({ id, worldX, worldY, button }) => {
  // ...
});
```

| Event | Payload |
|---|---|
| `shape:pointerover` / `:pointerout` | `{ id, worldX, worldY }` |
| `shape:pointerdown` / `:pointerup` | `{ id, worldX, worldY, button }` |
| `shape:click` / `:doubleclick` | `{ id, worldX, worldY, button }` — left-button only |
| `shape:contextmenu` | `{ id, worldX, worldY }` — right-button |
| `connector:pointerover` / `:pointerout` | `{ id, worldX, worldY }` |
| `connector:pointerdown` / `:pointerup` | `{ id, worldX, worldY, button }` |
| `connector:click` / `:doubleclick` | `{ id, worldX, worldY, button }` — left-button only |
| `connector:contextmenu` | `{ id, worldX, worldY }` — right-button |

`click` fires only on left-button (button `0`); right-button releases go to `contextmenu` instead. `doubleclick` fires *in addition to* the second `click` when the OS-defined double-click interval is met — matches DOM semantics. The browser's native right-click context menu is suppressed on the canvas element by default; opt out with `new Canvas({ suppressBrowserContextMenu: false })`.

Layers translate these raw events into domain events (`node:click`, `edge:hover`, etc.) via `layer.events`. Behaviours subscribe to either layer events or these raw renderer events.

## Re-routing connectors

When obstacle-aware routers (`manhattan`, etc.) are in play, moving an obstacle requires re-routing every dependent connector:

```ts
renderer.reRouteAllConnectors();
```

`DragShapeBehaviour` calls this automatically per move (when `reRouteConnectors: true`, default).

## Custom registrations

```ts
renderer.registerShape('hexagon', HexagonShape);

renderer.registerRouter('s-curve', (src, tgt, waypoints, ctx, opts) => [
  src, /* ... */ tgt,
]);

renderer.registerPathStyle('stepped', (polyline, opts) => /* Path */);
renderer.registerAnchor('top-edge', anchorFn);

renderer.registerDecoration('halo', HaloDecoration, { target: 'shape' });
```

Custom additions are subject to the **domain-free primitives rule** — the registered class's name and its code must remain geometric. A `pk-badge` decoration is fine; a `node-halo` decoration is not (call it `halo` and let domain packages name the sugar method `haloNode(id)`).

## Lifecycle

```ts
// in your Layer's onUnmount:
this.renderer.destroy();
```

`destroy` clears all internal bookkeeping. Call it before the host Layer's container is destroyed.

## Render stats

```ts
const { shapes, connectors, animatedDecorations } = renderer.getRenderStats();
```

Useful for a `ScreenLayer` dev info overlay.
