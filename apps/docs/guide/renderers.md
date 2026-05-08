# Renderers

A **Renderer** is a primitive drawing API. It knows how to draw a *class* of things — shapes and connectors with their decorations and markers — and nothing else.

Renderers are **not** user-facing. You don't add them to `canvas.layers`. You don't register them. They're tools that Layer authors compose internally.

```
User-facing                  Internal
─────────────                ───────────
Layer (composed by user)  →  uses a Renderer
                              │
                              ▼
                          PrimitivesRenderer (drawing primitive)
```

If you're building an app, you'll mostly interact with Layers (`GraphLayer`, `BackgroundLayer`, your own custom layers). You only reach for `PrimitivesRenderer` when you're *authoring* a new diagram-type Layer.

## Why a renderer is separate from a layer

This separation is the most load-bearing call in the architecture. If you can articulate it, the rest of the system makes sense.

The split: **a Layer has data + state + events + policy that mean something to the user. A Renderer is a primitive — drawing + hit-testing + raw events.**

| Concern | Renderer | Layer |
|---|---|---|
| Drawing pixels | yes | projects state → renderer per RAF |
| Hit-testing | yes | uses renderer's hit-test |
| Camera-aware coords | yes | — |
| Raw pointer events (`shape:pointerover`) | emits | translates to domain events |
| **Source of truth** (data + interaction state) | — | **owns (`state` field)** |
| Domain events (`node:click`, `selection:changed`) | — | emits |
| LOD policy (when to switch detail) | offers `setLODLevel(id, level)` | decides + projects |
| Label resolution policy | offers `rasteriseLabel(id, res)` | decides + projects |
| Decorations (halo, glow, marching-ants) | offers `setDecoration(id, slot, spec)` | decides + projects |
| Hover/select/drag detection | — | — *(behaviour does this)* |

The pattern is: the renderer offers primitives, the layer applies policy. *Should this node show a halo right now?* That's policy, layer-side. *How is a halo drawn?* That's a primitive, renderer-side.

## Canonical terminology

Locked vocabulary used throughout the renderer and the rest of the kernel:

| Term | Definition |
|---|---|
| **Primitive** | A drawing element managed by `PrimitivesRenderer`. Today: `Shape` or `Connector`. |
| **Shape** | A 2D primitive with a closed silhouette (`circle`, `rect`, `ellipse`, `polygon`, `path`). Has `bounds()` and `drawGeometry()`. |
| **Connector** | A line-like primitive joining two endpoints, optionally passing through waypoints. **One concrete class** — visual variation comes from the `router`. |
| **Endpoint** | The `source` or `target` of a connector. Resolves to either a literal point or a shape id. |
| **Waypoint** | An intermediate, user-supplied point a router must respect. |
| **Path** | The router's output: an ordered list of `PathCommand`s (`M`/`L`/`Q`/`C`). The connector renders the path natively via Pixi's `moveTo`/`lineTo`/`quadraticCurveTo`/`bezierCurveTo`. |
| **Polyline** | A flat point list. The **derived** form of a path used for hit-testing and uniform-arc-length sampling. Produced by `samplePath(path, n)`. |
| **Router** | Pure function `(source, target, waypoints?, opts?) → Path`. |
| **Marker** | A shape painted at a connector endpoint, oriented along the polyline tangent. **Markers are shapes** — no separate registry. |
| **Decoration** | A visual augmentation of a shape or connector (`glow`, `ring`, `marching-ants`, `breathing`, `pulse-ring`). |
| **Slot** | A named z-band on a primitive's surface (e.g. `'halo'`, `'glow'`, `'ring'`). Decorations attach to slots. |
| **PaintStyle** | Override flags passed into `paintInto` (color, alpha, strokeWidth, dashArray, dashOffset, inset). |
| **Spec** | The data record describing a primitive instance (`CircleSpec`, `BaseConnectorSpec`). Plain JSON. |

Words deliberately **not used**: `vertex` (overlaps "endpoint"), `path` for polyline (reserved for the `path` shape kind), `edge` (graph-domain term, not primitive-domain).

## PrimitivesRenderer

The kernel ships one renderer: `PrimitivesRenderer`. It's a fully generic, opinion-free drawing API for shapes and connectors. It knows about pixels, hit-testing, and a camera. It knows nothing about nodes, edges, tables, columns, swimlanes, or any other domain semantics.

### Four extensible registries

`PrimitivesRenderer` has four primitives, each registered by kind:

| Primitive | Job | Built-ins |
|---|---|---|
| **Shape** | a self-contained 2D thing with bounds | `circle`, `rect`, `ellipse`, `polygon`, `path`, `text` |
| **Connector** | a line-like primitive joining two endpoints (one class, router-driven visual variation) | one `Connector` class |
| **Router** | pure function: endpoints + waypoints → `Path` | `straight`, `orthogonal`, `orthogonal-rounded`, `bezier`, `curve` |
| **Decoration** | visual augmentation of a shape or connector | `ring`, `glow`, `marching-ants`, `breathing`, `pulse-ring`, plus connector-side variants |

**Markers are shapes**, not a fifth registry. An arrow is a triangle shape; a diamond marker is a polygon shape; both are placed at a connector endpoint and oriented along the path tangent.

**Image is a fill mode**, not a shape kind. A circle with a texture fill paints an avatar; a rect with a texture fill paints a thumbnail. Pixi v8 supports texture fills natively, so there's no separate `image` shape.

Domain packages register their own primitives — a flowchart layer ships a `swimlane-divider` decoration, an ER layer ships a `pk-badge` decoration — without touching `@invana/canvas`. Whatever they register must remain *geometric*: see the [Domain-Free Primitives Rule](#domain-free-primitives-rule) below.

### API surface

```ts
class PrimitivesRenderer {
  // Mutation
  addShape(id: string, spec: BaseShapeSpec): void;
  updateShape(id: string, partial: Partial<BaseShapeSpec>): void;
  removeShape(id: string): void;
  addConnector(id: string, spec: BaseConnectorSpec): void;
  updateConnector(id: string, partial: Partial<BaseConnectorSpec>): void;
  removeConnector(id: string): void;

  // Visual decoration (one generic method, slot-composed)
  setDecoration(targetId: string, slot: string,
                decoration: { kind: string; style: unknown } | null): void;

  // LOD + label primitives the layer drives
  setLODLevel(id: string, level: number): void;
  rasteriseLabel(id: string, resolution: number): void;

  // Per-frame animation tick (called by Canvas after layer.flush())
  tickAnimations(deltaMs: number): void;

  // Hit testing
  hitTest(worldX: number, worldY: number):
    { kind: 'shape' | 'connector'; id: string; subId?: string } | null;

  // Raw events — DOM-level, hit-tested, no semantic interpretation
  events: EventEmitter<PrimitivesRendererEventMap>;
}
```

That's the full surface. No `lod` option. No `labels` option. No `highlight` option. No `setHalo` / `setBorder` / `setGlow` — those are decorations registered by kind, applied via `setDecoration(id, slot, spec)`.

### Where to import from

`PrimitivesRenderer` and its base classes live under the `@invana/canvas/primitives` subpath:

```ts
import {
  PrimitivesRenderer,
  ShapeBase,
  ConnectorBase,
  ShapeDecorationBase,
  ConnectorDecorationBase,
  CircleShape,
  RectShape,
  Connector,
  ArrowMarker,
  straightRouter,
  GlowDecoration,
} from '@invana/canvas/primitives';
```

The kernel barrel (`@invana/canvas`) re-exports the same symbols — both paths work, but `/primitives` makes the intent clearer when you're authoring a custom renderer-side primitive.

## Decorations — the visual augmentation system

A halo, a ring, a marching-ants animation, a pulse ring, a breathing border — none of these are graph-specific. They're generic 2D visuals that ER diagrams, flowcharts, swimlanes, and graph all want, identically. So the rendering logic lives in the renderer once.

### Slot-based stacking

Each shape (or connector) holds **multiple decorations simultaneously**, one per named slot:

| Slot | Convention | Drawn |
|---|---|---|
| `halo` | selection / focus glow | behind shape |
| `border` / `ring` | outline (solid or dashed) | on shape |
| `glow` | soft outer aura | behind halo |
| `pulse` | expanding ring(s) radiating outward | in front of shape |
| `badge` | status indicator overlay | in front of shape |
| `fx` | free-form domain effect | in front of everything |

Setting a slot to `null` removes its decoration. Slot z-order is fixed (`glow → halo → shape → border → pulse → badge → fx`). Multiple decorations stack — a selected node with halo + dashed ring + pulse all at once.

```ts
renderer.setDecoration('node-42', 'halo',  { kind: 'glow', style: { color: 0x3b82f6, intensity: 0.6 } });
renderer.setDecoration('node-42', 'ring',  { kind: 'ring', style: { dash: [6, 4], color: 0x000000 } });
renderer.setDecoration('node-42', 'pulse', { kind: 'pulse-ring', style: { count: 3, periodMs: 1500 } });

// remove a slot:
renderer.setDecoration('node-42', 'halo', null);
```

### Animation runs on the Canvas tick

Animated decorations participate in the single Canvas `requestAnimationFrame` — no fragmented per-decoration RAFs:

```
canvas.tick(deltaMs):
  for layer in layers (z-order):
    if layer.dirty.hasPending(): layer.flush()
    layer.renderer.tickAnimations(deltaMs)   ← walks animated decorations
  surfaces.render()                           ← single pixi commit
```

Static decorations (`ring`, `glow`) cost zero per frame after their initial `setDecoration()` draw. Animated ones (`marching-ants`, `pulse-ring`, `breathing`) advance their phase internally; state holds only the *intent* (`pulsedNodeIds`), not the phase.

### Decoration geometry lives in pure-function primitives

The renderer-level decoration class (e.g. `GlowDecoration`) is a thin wrapper that owns the `IShapeDecoration` / `IConnectorDecoration` lifecycle (Container/Graphics + `mount` / `update` / `destroy`). It delegates **all** geometry and animation to a sibling pure-function primitive in `primitives/decorations/<shape|connector>/`.

Authoring rule: never re-implement decoration geometry inside a renderer wrapper — extend the underlying draw primitive instead. Shape decorations also accept an optional `outlinePolyline` per `update()` for true shape-following parallel offset on `polygon` / `path` hosts (falls back to AABB rect when not provided).

### Domain-package sugar

`renderer.setDecoration(targetId, slot, spec)` is intentionally terse and orthogonal — it's not always memorable for app code. Domain packages add ergonomic shortcuts that **mutate state**, never the renderer directly:

```ts
class GraphLayer extends WorldLayer<...> {
  haloNode(id: string, style?: HaloStyle | null): void {
    this.state.setState((s) => { s.haloStyles.set(id, style); });
    this.dirty.mark('halo', id);
  }
  pulseNode(id: string, opts: PulseRingStyle | false): void { /* state mutation */ }
  ringNode(id: string, style: RingStyle | null): void { /* state mutation */ }
}
```

The layer's `applyDirty()` projects state → `renderer.setDecoration(...)`. App code uses the friendly methods; the renderer stays generic; state remains the single source of truth so devtools, time-travel, and telemetry catch every change.

## End-to-end: hover triggers a halo

Six handoffs, each unidirectional. No back-channels.

```
1. User hovers a node
2. Browser fires pointermove
3. PrimitivesRenderer hit-tests, emits 'shape:pointerover' { id: 'node-42' }
4. GraphLayer translates to 'node:hover' { id: 'node-42', node: {...} }
5. HoverActivateBehaviour subscribes to layer.events('node:hover'),
   mutates layer.state.hoveredId = 'node-42'
6. GraphLayer's state subscriber fires, calls
   renderer.setDecoration('node-42', 'halo', { kind: 'glow', style: {...} })
7. Renderer attaches a GlowDecoration in slot 'halo' of node-42's container,
   draws it once
8. User sees glow.
```

The renderer never asks the layer anything. Behaviours never call into the renderer's internals. The contract is two surfaces: renderer's events out, renderer's API in (driven by the layer reading observable state).

## Domain-Free Primitives Rule

`primitives/` is **domain-free**. No primitive — shape, connector, decoration, marker, router, fill resolver, icon, text — references a domain concept. Forbidden references include: `node`, `edge`, `vertex`, `table`, `column`, `row`, `lane`, `header`, `port`, `pin`, `link`, `network`, `graph` (the data structure), `entity`, `relationship`, `swimlane`, `ER`, `flowchart`, `BPMN`. The primitives layer only knows about geometric concepts (circle, rect, polygon, path, polyline, fill, stroke, glyph, decoration slot).

Domain packages (`@invana/graph`, future `@invana/swimlane`, `@invana/er`) compose primitives by extending `WorldLayer` / `ScreenLayer` and calling `primitivesRenderer.addShape` / `addConnector` / `setDecoration`. Domain packages may register **new geometric primitives** (e.g., a `hexagon` shape kind, a `manhattan-routed` router, a `pk-badge` decoration), but the registered class itself must remain geometric — its name and its code must not reference the domain concept that motivated it.

**Test:** if you can rename the file by stripping the domain word and the file still makes sense (`PrimaryKeyBadgeDecoration` → `BadgeDecoration` works fine; `SwimlaneShape` → `Shape` does not), it belongs in `primitives/`. Otherwise it belongs in the domain package.

This rule is not enforced by tooling. It's a discipline statement — treat it as load-bearing when adding code to `packages/canvas`.

## Reusability across diagram types

Because the renderer carries no domain knowledge, it's reusable:

| Layer | Renderer | Domain |
|---|---|---|
| `GraphLayer` | `PrimitivesRenderer` | nodes + edges with traversal |
| `ERDiagramLayer` *(future)* | `PrimitivesRenderer` | tables (header + column rows) + relationships |
| `FlowchartLayer` *(future)* | `PrimitivesRenderer` | steps, decisions, transitions |
| `SwimlaneLayer` *(future)* | `PrimitivesRenderer` | lanes + activities |
| `MapTilesLayer` *(future)* | a different tile renderer | map tile pyramids |

Same renderer, different brain. An ER layer would translate `shape:click` from the renderer into `table:click` or `column:click` after resolving which sub-region of a table was hit. A graph behaviour like `HoverActivateBehaviour` wouldn't apply directly — `ERDiagramLayer` would have its own (`HoverColumnBehaviour`?) tuned to ER semantics.

## What's next

- [Layers](/guide/layers) — how a Layer composes a Renderer with state and policy
- [Events](/guide/events) — the three-tier hierarchy: renderer → layer → behaviour
- [Behaviours](/guide/behaviours) — what subscribes to layer events, not renderer events
