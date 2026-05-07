# Renderers

A **Renderer** is a primitive drawing API. It knows how to draw a *class* of things — shapes and connectors, tile pyramids, raster images. It carries no domain knowledge.

Renderers are **not** user-facing. You don't add them to `canvas.layers`. You don't register them. They're tools that Layer authors compose internally.

```
User-facing                  Internal
─────────────                ───────────
Layer (composed by user)  →  uses a Renderer
                              │
                              ▼
                          ShapesRenderer (drawing primitive)
```

If you're building an app, you'll mostly interact with Layers (`GraphLayer`, `BackgroundLayer`, your own custom layers). You only reach for `ShapesRenderer` when you're *authoring* a new diagram-type Layer.

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

## ShapesRenderer

The kernel ships one renderer: `ShapesRenderer`. It's a fully generic, opinion-free drawing API for shapes and connectors. It knows about pixels, hit-testing, and a camera. It knows nothing about nodes, edges, tables, columns, swimlanes, or any other domain semantics.

### Five extensible registries

`ShapesRenderer` has five primitives, each registered by kind:

| Primitive | Job | Built-ins |
|---|---|---|
| **Shape** | a self-contained 2D thing with bounds | `circle`, `rect`, `ellipse`, `polygon`, `path`, `image`, `text` |
| **Connector** | a line between two endpoints | `line`, `curve` |
| **Marker** | a glyph attached to a connector endpoint | `arrow`, `circle`, `square`, `diamond` |
| **Router** | pure function: endpoints → polyline | `straight`, `orthogonal`, `bezier` |
| **Decoration** | visual augmentation of a shape or connector | `halo`, `border`, `glow`, `marching-ants`, `pulse-ring`, `dashed-border-rotating` |

Domain packages register their own (a flowchart layer ships `swimlane-divider`, an ER layer ships `conflict-warning` badge) without touching `@invana/canvas`.

### API surface

```ts
class ShapesRenderer {
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
  events: EventEmitter<ShapesRendererEventMap>;
}
```

That's the full surface. No `lod` option. No `labels` option. No `highlight` option. No `setHalo` / `setBorder` / `setGlow` — those are decorations registered by kind, applied via `setDecoration(id, slot, spec)`.

## Decorations — the visual augmentation system

A halo, a border, a marching-ants animation, a pulse ring — none of these are graph-specific. They're generic 2D visuals that ER diagrams, flowcharts, swimlanes, and graph all want, identically. So the rendering logic lives in the renderer once.

### Slot-based stacking

Each shape (or connector) holds **multiple decorations simultaneously**, one per named slot:

| Slot | Convention | Drawn |
|---|---|---|
| `halo` | selection / focus glow | behind shape |
| `border` | outline (solid or dashed) | on shape |
| `glow` | soft outer aura | behind halo |
| `pulse` | expanding ring(s) radiating outward | in front of shape |
| `badge` | status indicator overlay | in front of shape |
| `fx` | free-form domain effect | in front of everything |

Setting a slot to `null` removes its decoration. Slot z-order is fixed (`glow → halo → shape → border → pulse → badge → fx`). Multiple decorations stack — a selected node with halo + dashed border + pulse all at once.

```ts
renderer.setDecoration('node-42', 'halo',   { kind: 'halo',   style: { color: 0x3b82f6, width: 4 } });
renderer.setDecoration('node-42', 'border', { kind: 'border', style: { dash: [6, 4], color: 0x000000 } });
renderer.setDecoration('node-42', 'pulse',  { kind: 'pulse-ring', style: { count: 3, periodMs: 1500 } });

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

Static decorations (`halo`, `border`, `glow`) cost zero per frame after their initial `setDecoration()` draw. Animated ones (`marching-ants`, `pulse-ring`) advance their phase internally; state holds only the *intent* (`pulsedNodeIds`), not the phase.

### Domain-package sugar

`renderer.setDecoration(targetId, slot, spec)` is intentionally terse and orthogonal — it's not always memorable for app code. Domain packages add ergonomic shortcuts that **mutate state**, never the renderer directly:

```ts
class GraphLayer extends WorldLayer<...> {
  haloNode(id: string, style?: HaloStyle | null): void {
    this.state.setState((s) => { s.haloStyles.set(id, style); });
    this.dirty.mark('halo', id);
  }
  pulseNode(id: string, opts: PulseRingStyle | false): void { /* state mutation */ }
  dashBorderNode(id: string, style: BorderStyle | null): void { /* state mutation */ }
}
```

The layer's `applyDirty()` projects state → `renderer.setDecoration(...)`. App code uses the friendly methods; the renderer stays generic; state remains the single source of truth so devtools, time-travel, and telemetry catch every change.

## End-to-end: hover triggers a halo

Six handoffs, each unidirectional. No back-channels.

```
1. User hovers a node
2. Browser fires pointermove
3. ShapesRenderer hit-tests, emits 'shape:pointerover' { id: 'node-42' }
4. GraphLayer translates to 'node:hover' { id: 'node-42', node: {...} }
5. HoverActivateBehaviour subscribes to layer.events('node:hover'),
   mutates layer.state.hoveredId = 'node-42'
6. GraphLayer's state subscriber fires, calls
   renderer.setDecoration('node-42', 'halo', { kind: 'halo', style: {...} })
7. Renderer attaches a HaloDecoration in slot 'halo' of node-42's container,
   draws it once
8. User sees glow.
```

The renderer never asks the layer anything. Behaviours never call into the renderer's internals. The contract is two surfaces: renderer's events out, renderer's API in (driven by the layer reading observable state).

## When to use the draw module instead

For simple custom layers that paint with a `pixi.Graphics` directly, you don't need `ShapesRenderer`. Use the `@invana/canvas` `draw` namespace — pure-function paint primitives:

```ts
import { WorldLayer, draw } from '@invana/canvas';

class GridLayer extends WorldLayer<GridOptions, {}> {
  protected createState() { return {}; }

  protected onMount(): void {
    const g = this.createGraphics('grid');
    for (let x = -1000; x <= 1000; x += 50) {
      draw.drawLineConnector(g, {
        kind: 'line',
        from: { x, y: -1000 },
        to:   { x, y:  1000 },
        stroke: 0xeeeeee,
        strokeWidth: 1,
      });
    }
  }

  hitTest() { return null; }
}
```

The `draw` module gives you `drawCircle`, `drawRect`, `drawEllipse`, `drawPolygon`, `drawPath`, `drawImage`, `drawArrow`, line/curve connector primitives, decoration draws (`drawHalo`, `drawBorder`, `drawGlow`), and animated decoration classes.

**Rule of thumb:** if your layer is a handful of static shapes (a grid, a backdrop, a logo, a debug overlay), use `draw.*` directly. If it's a data-driven scene with potentially thousands of items, hover/selection, decorations, and LOD, compose `ShapesRenderer` and let it manage the shape lifecycle.

## Reusability across diagram types

Because the renderer carries no domain knowledge, it's reusable:

| Layer | Renderer | Domain |
|---|---|---|
| `GraphLayer` | `ShapesRenderer` | nodes + edges with traversal |
| `ERDiagramLayer` *(future)* | `ShapesRenderer` | tables (header + column rows) + relationships |
| `FlowchartLayer` *(future)* | `ShapesRenderer` | steps, decisions, transitions |
| `SwimlaneLayer` *(future)* | `ShapesRenderer` | lanes + activities |
| `MapTilesLayer` *(future)* | a different tile renderer | map tile pyramids |

Same renderer, different brain. An ER layer would translate `shape:click` from the renderer into `table:click` or `column:click` after resolving which sub-region of a table was hit. A graph behaviour like `HoverActivateBehaviour` wouldn't apply directly — `ERDiagramLayer` would have its own (`HoverColumnBehaviour`?) tuned to ER semantics.

## What's next

- [Layers](/guide/layers) — how a Layer composes a Renderer with state and policy
- [Events](/guide/events) — the three-tier hierarchy: renderer → layer → behaviour
- [Behaviours](/guide/behaviours) — what subscribes to layer events, not renderer events
