# RFC-001: Unified Interaction Events API

**Status:** Draft — v2 (updated after architecture review)  
**Date:** 2026-04-13  
**Author:** @invana/canvas team  

---

## Summary

Move raw pointer event detection into `RendererNodeBase` and `RendererEdgeBase` (core), expose them through a typed `canvas.events` bus, and refactor interaction plugins (`ClickSelectPlugin`, `HoverActivatePlugin`, `DragElementPlugin`) to be pure event consumers that subscribe to the bus and apply visual state.

---

## Problem Statement

### 1. No developer-facing event API

The `Canvas` class has no `.on()` method. There is no way to write:

```typescript
canvas.on('node:clicked', (e) => console.log(e.node.id));
```

`CanvasEventType` and `CanvasEvent` are defined in `types/index.ts` but never emitted anywhere. `EventEmitter` exists in `utils/EventEmitter.ts` but is not wired to anything.

### 2. Interaction plugins have a timing bug

All three interaction plugins call `setupExistingElements()` during `init()`:

```
canvas.init()
  └── ClickSelectPlugin.init()
        └── setupExistingElements()
              └── canvas.getPlugin('graph-data') → NULL   ← GraphDataPlugin not yet registered
                    no nodes attached → no click listeners
```

`GraphDataPlugin` is always registered *after* `canvas.init()`, so the plugins find zero elements. The only reason dragging works is that `DragElementPlugin` uses viewport-level event delegation instead of per-node listeners. Click and hover listeners are silently never attached to most nodes.

### 3. Wrong direction of responsibility

The current design has plugins reaching into the element tree to attach PixiJS listeners. This means:

- New nodes added via `graphPlugin.setData()` are never picked up by already-initialised plugins
- Plugins need direct PixiJS container access — tightly coupling them to rendering internals
- Removing or replacing a plugin leaves orphaned PixiJS event listeners

---

## Proposed Architecture

```
  ┌────────────────────────────────────────────────┐
  │  CORE (packages/canvas-core)                   │
  │                                                │
  │  RendererNodeBase / RendererEdgeBase           │
  │    - attaches own PixiJS listeners in ctor     │
  │    - emits into canvas.events on every pointer │
  │      event (click, dblclick, hover, rightclick)│
  │                                                │
  │  Canvas                                        │
  │    - holds EventEmitter<CanvasEventMap>        │
  │    - exposes .on() / .off() / .once()          │
  │    - emits canvas:clicked, canvas:contextmenu  │
  │      from DOM events                           │
  └───────────────────┬────────────────────────────┘
                      │  canvas.events (the shared bus)
          ┌───────────┼────────────────┐
          ▼           ▼                ▼
  ClickSelectPlugin  HoverActivatePlugin  DragElementPlugin
  (subscribes to     (subscribes to       (viewport delegation,
   node:clicked,      node:hover,          emits node:drag* into
   edge:clicked,      node:hoverend,       canvas.events)
   canvas:clicked)    edge:hover,
                      edge:hoverend)
          │           │                │
          ▼           ▼                ▼
   .setState()    .setState()      .x = newX
   ('selected')   ('active')       .y = newY
          │
          ▼
  Developer callbacks
  canvas.on('node:clicked', handler)
  canvas.on('selection:changed', handler)
  canvas.on('node:hover', showTooltip)
```

**The rule:** Core emits events. Plugins consume events to drive visual state. Developers subscribe to the same bus.

---

## Developer API (unchanged from v1)

```typescript
const canvas = new Canvas({ container, behavior: 'default' });
await canvas.init();

const graphPlugin = new GraphDataPlugin({ fitOnRender: true });
await canvas.registerPlugin(graphPlugin);
graphPlugin.setData({ nodes: [...], edges: [...] });

// All events work immediately — no setup needed
canvas.on('node:clicked',     (e) => console.log(e.node.id, e.position));
canvas.on('node:dblclicked',  (e) => canvas.viewport.fitContent());
canvas.on('node:contextmenu', (e) => showMenu(e.position, e.node));
canvas.on('node:hover',       (e) => showTooltip(e.node));
canvas.on('node:hoverend',    ()  => hideTooltip());
canvas.on('node:dragend',     (e) => savePosition(e.node.id, e.x, e.y));
canvas.on('edge:clicked',     (e) => console.log(e.edge.id));
canvas.on('selection:changed',(e) => updateSidebar(e.nodes, e.edges));
canvas.on('canvas:clicked',   (e) => clearSidebar());
canvas.on('canvas:contextmenu',(e)=> showCanvasMenu(e.position));
canvas.on('viewport:zoomed',  (e) => console.log('zoom:', e.scale));

// Disposer pattern
const off = canvas.on('node:clicked', handler);
off(); // unsubscribe

// One-shot
canvas.once('node:clicked', handler);
```

---

## Event Scope

| Event | Emitted by | Consumed by |
|---|---|---|
| `node:clicked` | `RendererNodeBase` | `ClickSelectPlugin`, developer |
| `node:dblclicked` | `RendererNodeBase` | developer |
| `node:contextmenu` | `RendererNodeBase` | developer |
| `node:hover` | `RendererNodeBase` | `HoverActivatePlugin`, developer |
| `node:hoverend` | `RendererNodeBase` | `HoverActivatePlugin`, developer |
| `node:dragstart` | `DragElementPlugin` (viewport delegation) | developer |
| `node:drag` | `DragElementPlugin` | developer |
| `node:dragend` | `DragElementPlugin` | developer |
| `node:selected` | `ClickSelectPlugin` | developer |
| `node:deselected` | `ClickSelectPlugin` | developer |
| `edge:clicked` | `RendererEdgeBase` | `ClickSelectPlugin`, developer |
| `edge:dblclicked` | `RendererEdgeBase` | developer |
| `edge:hover` | `RendererEdgeBase` | `HoverActivatePlugin`, developer |
| `edge:hoverend` | `RendererEdgeBase` | `HoverActivatePlugin`, developer |
| `edge:selected` | `ClickSelectPlugin` | developer |
| `edge:deselected` | `ClickSelectPlugin` | developer |
| `canvas:clicked` | `Canvas` (DOM) | `ClickSelectPlugin`, developer |
| `canvas:dblclicked` | `Canvas` (DOM) | developer |
| `canvas:contextmenu` | `Canvas` (DOM) | developer |
| `selection:changed` | `ClickSelectPlugin` | developer |
| `viewport:zoomed` | `ZoomControlPlugin` | developer |
| `viewport:panned` | `DragCanvasPlugin` | developer |

---

## Implementation

### Step 1 — `CanvasEventMap` in `types/index.ts`

Add typed payload interfaces and the master event map:

```typescript
// types/index.ts  (additions only)

export interface CanvasPointerPosition {
  screen: { x: number; y: number };   // pixel coords
  world:  { x: number; y: number };   // canvas/world coords
}

export interface NodePointerEvent {
  node: RendererNodeBase;
  position: CanvasPointerPosition;
  originalEvent: FederatedPointerEvent;
}

export interface NodeDragEvent {
  node: RendererNodeBase;
  x: number;
  y: number;
}

export interface NodeSelectionEvent {
  node: RendererNodeBase;
}

export interface EdgePointerEvent {
  edge: RendererEdgeBase;
  position: CanvasPointerPosition;
  originalEvent: FederatedPointerEvent;
}

export interface EdgeSelectionEvent {
  edge: RendererEdgeBase;
}

export interface SelectionChangedEvent {
  nodes: RendererNodeBase[];
  edges: RendererEdgeBase[];
}

export interface CanvasBgPointerEvent {
  position: CanvasPointerPosition;
  originalEvent: FederatedPointerEvent | Event;
}

export interface ViewportZoomEvent  { scale: number; }
export interface ViewportPanEvent   { x: number; y: number; }

export interface CanvasEventMap {
  'node:clicked':        NodePointerEvent;
  'node:dblclicked':     NodePointerEvent;
  'node:contextmenu':    NodePointerEvent;
  'node:hover':          NodePointerEvent;
  'node:hoverend':       NodePointerEvent;
  'node:dragstart':      NodeDragEvent;
  'node:drag':           NodeDragEvent;
  'node:dragend':        NodeDragEvent;
  'node:selected':       NodeSelectionEvent;
  'node:deselected':     NodeSelectionEvent;
  'edge:clicked':        EdgePointerEvent;
  'edge:dblclicked':     EdgePointerEvent;
  'edge:hover':          EdgePointerEvent;
  'edge:hoverend':       EdgePointerEvent;
  'edge:selected':       EdgeSelectionEvent;
  'edge:deselected':     EdgeSelectionEvent;
  'canvas:clicked':      CanvasBgPointerEvent;
  'canvas:dblclicked':   CanvasBgPointerEvent;
  'canvas:contextmenu':  CanvasBgPointerEvent;
  'selection:changed':   SelectionChangedEvent;
  'viewport:zoomed':     ViewportZoomEvent;
  'viewport:panned':     ViewportPanEvent;
}
```

---

### Step 2 — `Canvas` gains event bus + `.on/.off/.once`

```typescript
// core/Canvas.ts

import { EventEmitter } from '../utils/EventEmitter';
import type { CanvasEventMap } from '../types';

export class Canvas {
  // NEW: the shared event bus
  readonly events = new EventEmitter<CanvasEventMap>();

  on<K extends keyof CanvasEventMap>(event: K, cb: (data: CanvasEventMap[K]) => void) {
    return this.events.on(event, cb);
  }
  off<K extends keyof CanvasEventMap>(event: K, cb: (data: CanvasEventMap[K]) => void) {
    this.events.off(event, cb);
  }
  once<K extends keyof CanvasEventMap>(event: K, cb: (data: CanvasEventMap[K]) => void) {
    return this.events.once(event, cb);
  }

  async init(): Promise<void> {
    // ... existing init ...

    // Replace the swallowed contextmenu handler:
    // BEFORE: canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
    // AFTER:
    canvasEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const world = this._viewport!.toWorld(
        (e as MouseEvent).clientX - this._container.getBoundingClientRect().left,
        (e as MouseEvent).clientY - this._container.getBoundingClientRect().top
      );
      this.events.emit('canvas:contextmenu', {
        position: { screen: { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }, world },
        originalEvent: e,
      });
    });
  }
}
```

---

### Step 3 — `RendererNodeBase` owns raw pointer detection

`RendererNodeBase` needs a reference to `canvas.events`. This is passed down from `Renderer` → `RendererNodeBase` at construction time (Renderer already holds `canvas`):

```typescript
// elements/nodes/RendererNodeBase.ts

// New option field (alongside existing NodeShapeOptions):
interface NodeShapeOptions {
  // ... existing ...
  events?: EventEmitter<CanvasEventMap>;   // NEW — injected by Renderer
  viewport?: Viewport;                      // NEW — needed for world coords
}

// In constructor, after existing setup:
constructor(options: NodeShapeOptions) {
  // ... existing ...

  const { events, viewport } = options;

  if (events && viewport) {
    this.eventMode = 'static';

    this.on('pointertap', (e: FederatedPointerEvent) => {
      if (this.isDisabled()) return;
      const pos = resolvePointerPosition(e, viewport);
      events.emit('node:clicked', { node: this, position: pos, originalEvent: e });
    });

    this.on('pointerdoubletap', (e: FederatedPointerEvent) => {
      if (this.isDisabled()) return;
      const pos = resolvePointerPosition(e, viewport);
      events.emit('node:dblclicked', { node: this, position: pos, originalEvent: e });
    });

    this.on('pointerover', (e: FederatedPointerEvent) => {
      if (this.isDisabled()) return;
      const pos = resolvePointerPosition(e, viewport);
      events.emit('node:hover', { node: this, position: pos, originalEvent: e });
    });

    this.on('pointerout', (e: FederatedPointerEvent) => {
      if (this.isDisabled()) return;
      const pos = resolvePointerPosition(e, viewport);
      events.emit('node:hoverend', { node: this, position: pos, originalEvent: e });
    });

    this.on('rightclick', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      const pos = resolvePointerPosition(e, viewport);
      events.emit('node:contextmenu', { node: this, position: pos, originalEvent: e });
    });
  }
}
```

Same pattern applied to `RendererEdgeBase` for `edge:clicked`, `edge:dblclicked`, `edge:hover`, `edge:hoverend`.

---

### Step 4 — `Renderer` injects `events` + `viewport` when creating elements

```typescript
// rendering/Renderer.ts

// Renderer already holds canvas reference. When creating a node:
const node = createNode({
  // ... existing options ...
  events:   this._canvas.events,     // NEW
  viewport: this._canvas.viewport,   // NEW
});
```

This is the only change to `Renderer`. No other coupling.

---

### Step 5 — `utils/eventHelpers.ts` (new small file)

```typescript
// utils/eventHelpers.ts
import type { FederatedPointerEvent } from 'pixi.js';
import type { Viewport } from '../viewport/Viewport';
import type { CanvasPointerPosition } from '../types';

export function resolvePointerPosition(
  event: FederatedPointerEvent,
  viewport: Viewport
): CanvasPointerPosition {
  const screen = { x: event.globalX, y: event.globalY };
  const world  = viewport.toWorld(screen.x, screen.y);
  return { screen, world };
}
```

---

### Step 6 — Refactor `ClickSelectPlugin` to be a pure consumer

**Remove entirely:** `setupExistingElements()`, `makeElementSelectable()`, per-element `pointertap` attachment.

**Replace with:**

```typescript
async init(canvas: Canvas): Promise<void> {
  this._canvas = canvas;

  // Subscribe to core events — works for all nodes, past and future
  canvas.on('node:clicked', (e) => this.onNodeClick(e.node, e.originalEvent));
  canvas.on('edge:clicked', (e) => this.onEdgeClick(e.edge, e.originalEvent));
  canvas.on('canvas:clicked', () => {
    if (this._options.clearOnBackground) this.clearSelection();
  });
}

private onNodeClick(node: RendererNodeBase, event: FederatedPointerEvent): void {
  const isMultiSelect = this._options.multiSelect &&
    (event.shiftKey || event.ctrlKey || event.metaKey);

  if (this.isSelected(node)) {
    if (isMultiSelect) this.deselect(node);
  } else {
    isMultiSelect ? this.addToSelection(node) : this.select(node);
  }
}

// addToSelection / deselect / clearSelection — existing logic kept,
// but now also emit into canvas.events:

addToSelection(element: SelectableElement): void {
  if (this._selected.has(element)) return;
  this._selected.add(element);
  element.setState(this._options.selectedState, true);

  if (element instanceof RendererNodeBase)
    this._canvas?.events.emit('node:selected', { node: element });
  else
    this._canvas?.events.emit('edge:selected', { edge: element });

  this._canvas?.events.emit('selection:changed', {
    nodes: this.getSelectedNodes(),
    edges: this.getSelectedEdges(),
  });
}

// emitSelectionChange() private method also fixed:
// BEFORE: (this._canvas as any).emit?.('selectionChanged', ...)  ← broken cast
// AFTER: this._canvas?.events.emit('selection:changed', { nodes, edges })
```

---

### Step 7 — Refactor `HoverActivatePlugin` to be a pure consumer

**Remove entirely:** `setupExistingElements()`, `makeElementHoverable()`, per-element `pointerover/pointerout` attachment.

**Replace with:**

```typescript
async init(canvas: Canvas): Promise<void> {
  this._canvas = canvas;

  canvas.on('node:hover',    (e) => this.activateHover(e.node));
  canvas.on('node:hoverend', (e) => this.onHoverEnd(e.node));
  canvas.on('edge:hover',    (e) => this.activateHover(e.edge));
  canvas.on('edge:hoverend', (e) => this.onHoverEnd(e.edge));
}

// activateHover / clearHover — existing logic kept unchanged
```

Zero changes to the visual behaviour. The `hoverDelay`, `highlightNeighbors`, `neighborState` options all continue to work exactly as before.

---

### Step 8 — `DragElementPlugin` stays delegation-based, adds bus emit

`DragElementPlugin` already uses viewport-level delegation (efficient, correct). No structural change needed. Add three emit calls:

```typescript
// In onPointerMove, after position update:
this._canvas?.events.emit('node:drag', { node, x: newX, y: newY });

// In onPointerMove, when drag first detected:
this._canvas?.events.emit('node:dragstart', { node, x: startNodeX, y: startNodeY });

// In onPointerUp:
this._canvas?.events.emit('node:dragend', { node, x: node.x, y: node.y });
```

Also remove `setupExistingNodes()` / `makeNodeDraggable()` — the cursor hover effects (`grab`/`grabbing`) can stay as per-node PixiJS cursor assignments which are purely visual with no timing issue.

---

### Step 9 — `ZoomControlPlugin` / `DragCanvasPlugin`

One line each:

```typescript
// ZoomControlPlugin — after zoom applied via pixi-viewport:
this._canvas?.events.emit('viewport:zoomed', { scale: this._viewport.scale.x });

// DragCanvasPlugin — in onPointerMove after pan:
this._canvas?.events.emit('viewport:panned', { x: this._viewport.x, y: this._viewport.y });
```

---

## What Does NOT Change

- Visual behaviour of hover, click selection, drag is identical
- `NodeStates`, `EdgeStates`, `setState()` — unchanged
- `ClickSelectPlugin` public API: `.select()`, `.getSelected()`, `.clearSelection()` — unchanged
- `HoverActivatePlugin` public API: `.clearHover()`, `.hoveredElement` — unchanged
- `DragElementPlugin` options and threshold behaviour — unchanged
- Plugin registration pattern — unchanged
- Storybook stories — unchanged (except a new Interactions story)

---

## File Change Summary

| File | Change | Nature |
|---|---|---|
| `types/index.ts` | Add `CanvasEventMap` + payload types | Additive |
| `utils/eventHelpers.ts` | New file: `resolvePointerPosition()` | New (~15 lines) |
| `core/Canvas.ts` | Add `events` field + `.on/.off/.once` + contextmenu forward | +12 lines |
| `rendering/Renderer.ts` | Pass `events` + `viewport` to node/edge constructors | +2 lines |
| `elements/nodes/RendererNodeBase.ts` | Wire PixiJS listeners → `canvas.events` in ctor | +25 lines |
| `elements/edges/RendererEdgeBase.ts` | Same for edges | +20 lines |
| `plugins/ClickSelectPlugin.ts` | Remove `setupExistingElements`, subscribe via bus, fix broken `emitSelectionChange` | -30 / +20 lines |
| `plugins/HoverActivatePlugin.ts` | Remove `setupExistingElements`, subscribe via bus | -30 / +10 lines |
| `plugins/DragElementPlugin.ts` | Remove `setupExistingNodes`, add 3 bus emits | -15 / +5 lines |
| `plugins/ZoomControlPlugin.ts` | Add 1 bus emit | +1 line |
| `plugins/DragCanvasPlugin.ts` | Add 1 bus emit | +1 line |
| `index.ts` | Export new types | +10 lines |

Net: ~+110 lines, ~-75 lines. No breaking changes.

---

## Implementation Plan

### Phase 1 — Core wiring
1. `types/index.ts` — add `CanvasEventMap` and payload types
2. `utils/eventHelpers.ts` — `resolvePointerPosition`
3. `core/Canvas.ts` — add `events`, `.on/.off/.once`, contextmenu DOM forward
4. `rendering/Renderer.ts` — pass `events` + `viewport` to element constructors
5. `elements/nodes/RendererNodeBase.ts` — wire pointer events → bus
6. `elements/edges/RendererEdgeBase.ts` — wire pointer events → bus

### Phase 2 — Plugin refactoring
7. `ClickSelectPlugin` — remove per-element setup, subscribe via bus, fix `emitSelectionChange`
8. `HoverActivatePlugin` — remove per-element setup, subscribe via bus
9. `DragElementPlugin` — remove per-node setup, add bus emits
10. `ZoomControlPlugin` / `DragCanvasPlugin` — add bus emits

### Phase 3 — Storybook
11. New `Interactions.stories.ts` — demonstrates all events with a live log panel

---

## Open Questions

1. **`canvas:clicked` vs viewport deselect** — should `canvas:clicked` fire for *every* background click, or only when no node/edge was the target? Current `ClickSelectPlugin` uses `event.target === viewport` to distinguish. `canvas:clicked` should use the same guard so it never fires when a node was clicked.

2. **Edge hit area** — edges have a very thin stroke as the click target. Should `RendererEdgeBase` add an invisible wider hit region (8–12px) so `edge:clicked` is reliably triggerable? Proposal: yes, transparent `hitArea` rectangle added silently, without changing visual appearance. Could be a follow-up.

3. **`node:hover` fires before plugin applies state** — since `RendererNodeBase` emits `node:hover` and `HoverActivatePlugin` subscribes to it, the developer's handler and the plugin's `.setState('active')` run in subscription order. Plugins are registered first (before developer callbacks), so state is applied before the developer callback fires. This ordering should be documented.

4. **Disabled nodes** — `RendererNodeBase` guards pointer events with `if (this.isDisabled()) return`. Should disabled nodes suppress *all* events including `node:hover`, or just ignore visual state changes? Current proposal: suppress all (existing guard stays).
