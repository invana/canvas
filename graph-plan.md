# Refactor Plan: `ElementPlugin` → `@invana/plugin-graph-data`

## Overview

Rename all "element" rendering primitives to "graph" terminology, extract the high-level graph API into a new `@invana/plugin-graph-data` package, add named port support, replace flat `element:*` events with split semantic `graph:node:*` / `graph:edge:*` events, and remove `ElementPlugin` from `@invana/canvas`'s public exports once the new package is fully functional.

---

## Decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Package architecture | **Extract** — `ElementPlugin` rendering core stays private in `@invana/canvas`; new `@invana/plugin-graph-data` wraps it |
| D2 | Event naming | **Split by type** — `graph:node:click`, `graph:edge:click` etc. (not flat with discriminant) |
| D3 | Port system | **Named ports as optional layer** on top of dynamic `getConnectionPoint()` |
| D4 | `setData()` API | **High-level `ICanvasData`** — `{ nodes: INodeData[], edges: IEdgeData[] }` |
| D5 | ElementPlugin fate | **Remove from public exports** after `plugin-graph-data` is complete |

---

## Current State

### What exists today

- `ElementPlugin` lives in `packages/canvas/src/plugins/builtin/element-plugin/ElementPlugin.ts`
  - Low-level rendering: `addSolid(type, spec)`, `addConnector(type, spec)`, `updateSolid()`, `updateConnector()`, `setData(solids[], connectors[])`, `fitContent()`
  - Emits 14 events via `element:*` prefix; payload discriminant `elementType: 'solid' | 'connector'`
  - Fully exported from `@invana/canvas` public index

- `GraphDataPlugin` does **not exist yet** — expected by `D3ForceLayoutPlugin` but unimplemented

- `D3ForceLayoutPlugin` in `packages/plugins-layouts-d3-force`
  - Calls `canvas.getPlugin('graph-data')` to find it by id
  - Depends on: `getNodeData(): Map`, `getEdgeData(): Map`, `updateNodePositions(updates[])`
  - Has dead code: `.renderer` references, `setupDragListeners()` reaching into renderer internals

---

## Rename Map

### Classes & Types

| Before | After |
|---|---|
| `BaseSolid` | `BaseNode` |
| `BaseSolidSpec` | `BaseNodeSpec` |
| `BaseConnector` | `BaseEdge` |
| `BaseConnectorSpec` | `BaseEdgeSpec` |
| `SolidCtor` | `NodeCtor` |
| `ConnectorCtor` | `EdgeCtor` |
| `ElementPluginOptions` | `GraphPluginOptions` |
| `ElementObject` | `GraphObject` (internal only) |

### Methods on `ElementPlugin`

| Before | After |
|---|---|
| `addSolid(type, spec)` | `addNode(type, spec)` |
| `addConnector(type, spec)` | `addEdge(type, spec)` |
| `updateSolid(id, partial)` | `updateNode(id, partial)` |
| `updateConnector(id, partial)` | `updateEdge(id, partial)` |
| `removeSolid(id)` | `removeNode(id)` |
| `removeConnector(id)` | `removeEdge(id)` |
| `getSolid(id)` | `getNode(id)` |
| `getConnector(id)` | `getEdge(id)` |
| `registerElement(type, cls)` | `registerNode(type, cls)` |
| `registerConnector(type, cls)` | `registerEdge(type, cls)` |

### Event strings & payload

| Before | After |
|---|---|
| `element:click` | `graph:click` |
| `element:dblclick` | `graph:dblclick` |
| `element:contextmenu` | `graph:contextmenu` |
| `element:pointerover` | `graph:pointerover` |
| `element:pointerout` | `graph:pointerout` |
| `element:pointermove` | `graph:pointermove` |
| `element:pointerdown` | `graph:pointerdown` |
| `element:pointerup` | `graph:pointerup` |
| `element:dragstart` | `graph:dragstart` |
| `element:dragmove` | `graph:dragmove` |
| `element:dragend` | `graph:dragend` |
| `element:statechange` | `graph:statechange` |
| `element:added` | `graph:added` |
| `element:removed` | `graph:removed` |
| `elementType: 'solid'` | `elementType: 'node'` |
| `elementType: 'connector'` | `elementType: 'edge'` |

### What stays the same
- Routers: `normalRouter`, `orthRouter`, `erRouter`, `oneSideRouter`, `registerRouter()`
- Markers: `registerMarker()`
- Animation system: `animate()`, `clearAnimation()`, all handlers
- `fitContent()`, `setState()`, `clearState()`, `clearAllStates()`, `getStates()`
- `getBBox()`, `getCenter()`, `getConnectionPoint()` (dynamic port mechanism)

---

## New Type API (`packages/plugin-graph-data/src/types.ts`)

```ts
interface INodePort {
  x: number;  // offset from node centre
  y: number;
}

interface INodeData {
  id: string;
  x?: number;
  y?: number;
  shape: 'circle' | 'rect' | 'ellipse' | 'polygon' | 'diamond' | 'star' | 'hexagon';
  size: number;
  label?: string;
  data?: Record<string, unknown>;
  style?: DrawStyle;
  draggable?: boolean;
  ports?: Record<string, INodePort>;
  states?: Record<string, DrawStyle>;
}

interface IEdgeData {
  id: string;
  source: string;
  target: string;
  pathType: 'bezier' | 'straight' | 'orthogonal' | 'quadratic' | 'rounded' | 'smooth';
  label?: string;
  data?: Record<string, unknown>;
  style?: PathStyle;
  router?: string | { name: string; args?: Record<string, unknown> };
  vertices?: Point[];
  sourcePort?: string;
  targetPort?: string;
  sourceRadius?: number;
  targetRadius?: number;
  sourceOffset?: number;
  targetOffset?: number;
  startMarker?: string | ArrowSpec;
  endMarker?: string | ArrowSpec;
  states?: Record<string, PathStyle>;
}

interface ICanvasData {
  nodes: INodeData[];
  edges: IEdgeData[];
}

type StyleValue<T, D> = T | ((datum: D) => T);

interface IGraphStyles {
  node?: {
    fill?:        StyleValue<string, INodeData>;
    stroke?:      StyleValue<string, INodeData>;
    strokeWidth?: StyleValue<number, INodeData>;
  };
  edge?: {
    stroke?:      StyleValue<string, IEdgeData>;
    strokeWidth?: StyleValue<number, IEdgeData>;
  };
}

interface GraphDataPluginOptions {
  fitOnRender?: boolean;  // default: true
  fitPadding?:  number;   // default: 60
}```

---

## New Events (`packages/plugin-graph-data/src/events.ts`)

```ts
// Split by type — node events carry INodeData, edge events carry IEdgeData

// Node events
'graph:node:click'        → { nodeId, nodeData: INodeData, worldX, worldY, nativeEvent }
'graph:node:dblclick'     → same
'graph:node:contextmenu'  → same
'graph:node:pointerover'  → same
'graph:node:pointerout'   → same
'graph:node:pointermove'  → same
'graph:node:pointerdown'  → same
'graph:node:pointerup'    → same
'graph:node:dragstart'    → { nodeId, nodeData, worldX, worldY, nativeEvent, dx, dy }
'graph:node:dragmove'     → same
'graph:node:dragend'      → same
'graph:node:statechange'  → { nodeId, state, active }
'graph:node:added'        → { nodeId }
'graph:node:removed'      → { nodeId }

// Edge events (same 14 variants)
'graph:edge:click'        → { edgeId, edgeData: IEdgeData, worldX, worldY, nativeEvent }
'graph:edge:dblclick'     → same
'graph:edge:contextmenu'  → same
'graph:edge:pointerover'  → same
'graph:edge:pointerout'   → same
'graph:edge:pointermove'  → same
'graph:edge:pointerdown'  → same
'graph:edge:pointerup'    → same
'graph:edge:dragstart'    → { edgeId, edgeData, worldX, worldY, nativeEvent, dx, dy }
'graph:edge:dragmove'     → same
'graph:edge:dragend'      → same
'graph:edge:statechange'  → { edgeId, state, active }
'graph:edge:added'        → { edgeId }
'graph:edge:removed'      → { edgeId }

// Data lifecycle
'graph:data-changed'       → { nodeCount: number, edgeCount: number }
'graph:positions-updated'  → { count: number }
```

`CanvasEventMap` module augmentation (in `src/index.ts`):

```ts
declare module '@invana/canvas' {
  interface CanvasEventMap {
    'graph:node:click':        GraphNodeClickEvent;
    'graph:node:dblclick':     GraphNodeDblClickEvent;
    'graph:node:contextmenu':  GraphNodeContextMenuEvent;
    'graph:node:pointerover':  GraphNodePointerOverEvent;
    'graph:node:pointerout':   GraphNodePointerOutEvent;
    'graph:node:pointermove':  GraphNodePointerMoveEvent;
    'graph:node:pointerdown':  GraphNodePointerDownEvent;
    'graph:node:pointerup':    GraphNodePointerUpEvent;
    'graph:node:dragstart':    GraphNodeDragStartEvent;
    'graph:node:dragmove':     GraphNodeDragMoveEvent;
    'graph:node:dragend':      GraphNodeDragEndEvent;
    'graph:node:statechange':  GraphNodeStateChangeEvent;
    'graph:node:added':        GraphNodeAddedEvent;
    'graph:node:removed':      GraphNodeRemovedEvent;
    'graph:edge:click':        GraphEdgeClickEvent;
    'graph:edge:dblclick':     GraphEdgeDblClickEvent;
    'graph:edge:contextmenu':  GraphEdgeContextMenuEvent;
    'graph:edge:pointerover':  GraphEdgePointerOverEvent;
    'graph:edge:pointerout':   GraphEdgePointerOutEvent;
    'graph:edge:pointermove':  GraphEdgePointerMoveEvent;
    'graph:edge:pointerdown':  GraphEdgePointerDownEvent;
    'graph:edge:pointerup':    GraphEdgePointerUpEvent;
    'graph:edge:dragstart':    GraphEdgeDragStartEvent;
    'graph:edge:dragmove':     GraphEdgeDragMoveEvent;
    'graph:edge:dragend':      GraphEdgeDragEndEvent;
    'graph:edge:statechange':  GraphEdgeStateChangeEvent;
    'graph:edge:added':        GraphEdgeAddedEvent;
    'graph:edge:removed':      GraphEdgeRemovedEvent;
    'graph:data-changed':      GraphDataChangedEvent;
    'graph:positions-updated': GraphPositionsUpdatedEvent;
  }
}
```

---

## `GraphDataPlugin` Public API

```ts
class GraphDataPlugin implements CanvasPlugin {
  readonly id = 'graph-data'
  constructor(options?: GraphDataPluginOptions)

  // Lifecycle
  register(ctx: PluginContext): void
  destroy(): void

  // Data
  setData(data: ICanvasData): void
  setStyles(styles: IGraphStyles): void

  // CRUD
  addNode(data: INodeData): void
  addEdge(data: IEdgeData): void
  removeNode(id: string): void          // also removes all connected edges
  removeEdge(id: string): void
  updateNode(id: string, partial: Partial<INodeData>): void
  updateEdge(id: string, partial: Partial<IEdgeData>): void
  getNode(id: string): INodeData | undefined
  getEdge(id: string): IEdgeData | undefined

  // Layout plugin contract
  getNodeData(): Map<string, INodeData>  // D3 mutates x/y in-place on these objects
  getEdgeData(): Map<string, IEdgeData>
  updateNodePositions(updates: Array<{ id: string; x: number; y: number }>): void

  // Extension registry (delegates to internal ElementPlugin)
  registerNode(type: string, cls: NodeCtor): void
  registerEdge(type: string, cls: EdgeCtor): void
  registerRouter(name: string, fn: RouterFn): void
  registerMarker(name: string, fn: MarkerFn): void

  // Animation & state (delegates to internal ElementPlugin)
  animateNode(id: string, animations: ElementAnimations): void
  clearNodeAnimation(id: string, type?: string): void
  setState(id: string, state: string, active: boolean): void
  getStates(id: string): string[]
  fitContent(padding?: number): void
}
```

---

## Internal `_renderAll()` Translation Logic

```
shape → element type string  (1:1: 'circle' → 'circle', 'rect' → 'rect', etc.)

size → spec geometry:
  'circle'  → { radius: size / 2 }
  'rect'    → { width: size, height: size }
  'ellipse' → { radiusX: size / 2, radiusY: size / 3 }
  'polygon' | 'diamond' | 'star' | 'hexagon' → { radius: size / 2 }

edge endpoint resolution (priority order):
  1. edge.sourcePort set AND sourceNode.ports[sourcePort] exists:
       from = { x: sourceCenter.x + port.x, y: sourceCenter.y + port.y }
       → use explicit from, no sourceId (bypasses dynamic getConnectionPoint)
  2. else: pass sourceId → ElementPlugin handles dynamic getConnectionPoint()
  Same logic for targetPort / targetId.

style resolution:
  _resolveStyle(globalStyleConfig, datum):
    each key: if value is function → call with datum; else use statically
  merge order: per-node/edge style override wins over global IGraphStyles

pass-through fields (must not be dropped in translation):
  router, vertices, sourceRadius, targetRadius, sourceOffset, targetOffset,
  startMarker, endMarker, states, opacity, cursor, zIndex, draggable, interactive
```

---

## Package Structure: `packages/plugin-graph-data/`

```
packages/plugin-graph-data/
├── package.json
├── tsconfig.json
└── src/
    ├── types.ts              INodeData, IEdgeData, ICanvasData, IGraphStyles,
    │                         INodePort, GraphDataPluginOptions
    ├── events.ts             All graph:node:* + graph:edge:* event classes
    │                         + CanvasEventMap module augmentation
    ├── GraphDataPlugin.ts    Main plugin class
    └── index.ts              Public exports
```

**`package.json` key fields:**
```json
{
  "name": "@invana/plugin-graph-data",
  "version": "0.0.1",
  "type": "module",
  "scripts": { "build": "tsup", "dev": "tsup --watch", "check-types": "tsc --noEmit" },
  "peerDependencies": { "@invana/canvas": "workspace:*" },
  "devDependencies": { "@invana/canvas": "workspace:*", "@repo/typescript-config": "workspace:*" }
}
```

---

## Implementation Phases

### Phase 1 — Rename rendering primitives in `packages/canvas`

> ⚠️ **Atomic commit required** — event string rename breaks storybook immediately. Stories must be updated in the same commit.

1. Rename abstract base classes and specs:
   - `BaseSolid` → `BaseNode` (file: `BaseNode.ts`), `BaseSolidSpec` → `BaseNodeSpec`
   - `BaseConnector` → `BaseEdge` (file: `BaseEdge.ts`), `BaseConnectorSpec` → `BaseEdgeSpec`
   - `SolidCtor` → `NodeCtor`, `ConnectorCtor` → `EdgeCtor`

2. Update all 7 node element classes (`CircleElement`, `RectElement`, `EllipseElement`, `PolygonElement`, `DiamondElement`, `StarElement`, `HexagonElement`) — change `extends BaseSolid` → `extends BaseNode`

3. Update all 6 connector classes (`BezierConnector`, `StraightConnector`, `OrthogonalConnector`, `QuadraticConnector`, `RoundedConnector`, `SmoothConnector`) — change `extends BaseConnector` → `extends BaseEdge`

4. Rename all methods on `ElementPlugin` per the rename map table above

5. In `ElementEvents.ts`: rename all 14 event string literals and discriminant values (`'solid'` → `'node'`, `'connector'` → `'edge'`); rename event classes (`ElementClickEvent` → `GraphClickEvent` etc.)

6. Update `CanvasEventMap` in `packages/canvas/src/types/events.ts`:
   - Remove all `element:*` entries
   - Add `graph:*` flat entries pointing to renamed event classes

7. Update `packages/canvas/src/index.ts` — updated re-exports for all renamed symbols

8. *(parallel)* Update all ~25 storybook stories that import `BaseSolid`, `BaseConnector`, `ElementPlugin`, or `element:*` event strings

**Files touched in Phase 1:**
- `packages/canvas/src/plugins/builtin/element-plugin/BaseSolid.ts` → `BaseNode.ts`
- `packages/canvas/src/plugins/builtin/element-plugin/BaseConnector.ts` → `BaseEdge.ts`
- `packages/canvas/src/plugins/builtin/element-plugin/spec/index.ts`
- `packages/canvas/src/plugins/builtin/element-plugin/ElementEvents.ts`
- `packages/canvas/src/plugins/builtin/element-plugin/ElementPlugin.ts`
- `packages/canvas/src/plugins/builtin/element-plugin/index.ts`
- `packages/canvas/src/plugins/builtin/index.ts`
- `packages/canvas/src/types/events.ts`
- `packages/canvas/src/index.ts`
- All 7 node element classes, all 6 connector classes
- All `apps/storybook/stories/**` files using element terminology

---

### Phase 2 — Add `getPlugin()` to `PluginContext`

Required so layout plugins can find peer plugins without a direct `Canvas` reference.

9. Update `PluginContext` interface in `packages/canvas/src/plugins/types.ts`:
   ```ts
   getPlugin<T extends CanvasPlugin>(id: string): T | undefined
   ```

10. Update `PluginSystem` in `packages/canvas/src/plugins/PluginSystem.ts` — inject a getter closure into the context object built during `_setContext()`:
    ```ts
    getPlugin: <T extends CanvasPlugin>(id: string) => this._plugins.get(id) as T | undefined
    ```

**Files touched:** `packages/canvas/src/plugins/types.ts`, `packages/canvas/src/plugins/PluginSystem.ts`

---

### Phase 3 — Scaffold `packages/plugin-graph-data`

Follow `packages/plugins-layouts-d3-force` as the structural template.

11. Create `packages/plugin-graph-data/package.json`
12. Create `packages/plugin-graph-data/tsconfig.json`
13. Create `src/types.ts` — all type definitions
14. Create `src/events.ts` — all event classes + `CanvasEventMap` augmentation
15. Create `src/GraphDataPlugin.ts` skeleton (class stub, constructor, id field)
16. Create `src/index.ts`

---

### Phase 4 — Implement `GraphDataPlugin` core *(depends on Phase 1, 3)*

17. Implement `register(ctx: PluginContext)`:
    - Instantiate and register owned `ElementPlugin` (`key: 'graph-elements'`) into `ctx`
    - Subscribe to flat `graph:*` events emitted by `ElementPlugin`
    - Re-emit as split `graph:node:*` / `graph:edge:*` with full `INodeData` / `IEdgeData` payloads

18. Implement `setData(data: ICanvasData)`:
    - Clear `_nodeStore: Map<string, INodeData>` and `_edgeStore: Map<string, IEdgeData>`
    - Populate stores from input arrays
    - Call `_renderAll()`
    - If `fitOnRender: true` → call `this._elements.fitContent(fitPadding)`
    - Emit `graph:data-changed`

19. Implement `_renderAll()` — translate stores → `ElementPlugin.setData(nodes[], edges[])` using the shape/size/style/port translation rules above

20. Implement `setStyles(styles: IGraphStyles)`:
    - Store styles
    - For each existing node/edge: call `updateNode`/`updateEdge` with re-resolved style

---

### Phase 5 — Named ports *(depends on Phase 4)*

21. In `_renderAll()` edge translation — resolve port positions before building connector spec:
    - If `edge.sourcePort` and `sourceNode.ports?.[edge.sourcePort]` both exist:
      - Compute `from = { x: sourceCenter.x + port.x, y: sourceCenter.y + port.y }`
      - Pass explicit `from`, **no `sourceId`** — bypasses `getConnectionPoint()`
    - Else: pass `sourceId` → `ElementPlugin` handles dynamic perimeter attachment
    - Mirror logic for `targetPort` / `targetId`

---

### Phase 6 — Layout plugin contract *(depends on Phase 4)*

22. Implement `getNodeData()` — return `_nodeStore` directly (D3 mutates `x`/`y` on these objects in-place; never clone)
23. Implement `getEdgeData()` — return `_edgeStore` directly
24. Implement `updateNodePositions(updates: Array<{id, x, y}>)`:
    - Update `_nodeStore` positions in-place
    - Call `this._elements.updateNode(id, { x, y })` for each update
    - Emit `graph:positions-updated`

---

### Phase 7 — Full CRUD API *(depends on Phase 4)*

25. `addNode`, `addEdge` — add to store then call `_elements.addNode` / `_elements.addEdge`
26. `removeNode` — remove from store, remove all connected edges from store + renderer, call `_elements.removeNode`
27. `removeEdge` — remove from store, call `_elements.removeEdge`
28. `updateNode`, `updateEdge` — merge partial into store, call `_elements.updateNode` / `updateEdge` with translated diff
29. `getNode`, `getEdge` — return from store
30. Delegate registry: `registerNode`, `registerEdge`, `registerRouter`, `registerMarker`
31. Delegate animation/state: `animateNode`, `clearNodeAnimation`, `setState`, `getStates`, `fitContent`

---

### Phase 8 — Update `D3ForceLayoutPlugin` *(depends on Phase 2)*

32. Remove dead code: `setupDragListeners()`, `.renderer` references, `_hasLoggedFirstUpdate`
33. Replace `async init(canvas: Canvas)` with `register(ctx: PluginContext)` per `CanvasPlugin` interface
34. Find peer plugin via `ctx.getPlugin<GraphDataPlugin>('graph-data')` instead of `canvas.getPlugin()`
35. Drag restart: listen to `canvas.events.on('graph:node:dragend', ...)` to reheat simulation (`alphaTarget(0.3).restart()`)
36. Live drag during simulation: listen to `graph:node:dragmove` to update the fixed node position in the D3 node datum

**Files touched:** `packages/plugins-layouts-d3-force/src/D3ForceLayoutPlugin.ts`

---

### Phase 9 — Remove `ElementPlugin` from public exports *(depends on Phase 7)*

37. Remove `ElementPlugin` (and `ElementPluginOptions`) from `packages/canvas/src/index.ts`
38. Remove `ElementPlugin` re-export from `packages/canvas/src/plugins/builtin/index.ts`

> `ElementPlugin.ts` is **not deleted** — it remains as an unexported internal engine used by `GraphDataPlugin`.

**Files touched:** `packages/canvas/src/index.ts`, `packages/canvas/src/plugins/builtin/index.ts`

---

### Phase 10 — Storybook wiring *(incremental from Phase 4)*

39. Add `"@invana/plugin-graph-data": "workspace:*"` to `apps/storybook/package.json`
40. Rewrite stories that use `ElementPlugin` directly to use `GraphDataPlugin.setData()`:
    - `stories/canvas/node-styles/` — 6 stories
    - `stories/canvas/edge-styles/` — 7 stories
    - `stories/canvas/animations/nodes/` — 7 stories
    - `stories/canvas/showcase/LargeGraph.stories.ts`
41. Update `CustomElement.stories.ts`: `BaseSolid` → `BaseNode`, `registerElement` → `registerNode`

---

## Files Modified Summary

### `packages/canvas`

| File | Change |
|---|---|
| `src/plugins/builtin/element-plugin/BaseSolid.ts` | Rename → `BaseNode.ts`, class → `BaseNode` |
| `src/plugins/builtin/element-plugin/BaseConnector.ts` | Rename → `BaseEdge.ts`, class → `BaseEdge` |
| `src/plugins/builtin/element-plugin/spec/index.ts` | `BaseSolidSpec` → `BaseNodeSpec`, `BaseConnectorSpec` → `BaseEdgeSpec` |
| `src/plugins/builtin/element-plugin/ElementEvents.ts` | Event strings + discriminant values renamed; event classes renamed |
| `src/plugins/builtin/element-plugin/ElementPlugin.ts` | All public methods renamed; becomes unexported internal after Phase 9 |
| `src/plugins/builtin/element-plugin/index.ts` | Updated exports |
| `src/plugins/builtin/index.ts` | Remove `ElementPlugin` export (Phase 9) |
| `src/plugins/types.ts` | Add `getPlugin<T>()` to `PluginContext` |
| `src/plugins/PluginSystem.ts` | Inject `getPlugin` closure into context |
| `src/types/events.ts` | Replace `element:*` with `graph:*` in `CanvasEventMap` |
| `src/index.ts` | Updated re-exports; remove `ElementPlugin` in Phase 9 |
| All 7 node element classes | `extends BaseNode` |
| All 6 connector classes | `extends BaseEdge` |

### NEW: `packages/plugin-graph-data/`

| File | Description |
|---|---|
| `package.json` | `@invana/plugin-graph-data`, peer dep `@invana/canvas` |
| `tsconfig.json` | Extends `@repo/typescript-config/base.json` |
| `src/types.ts` | `INodeData`, `IEdgeData`, `ICanvasData`, `IGraphStyles`, `INodePort`, `GraphDataPluginOptions` |
| `src/events.ts` | All `graph:node:*` + `graph:edge:*` event classes + `CanvasEventMap` augmentation |
| `src/GraphDataPlugin.ts` | Main plugin implementation |
| `src/index.ts` | Public API exports |

### `packages/plugins-layouts-d3-force/`

| File | Change |
|---|---|
| `src/D3ForceLayoutPlugin.ts` | `init(canvas)` → `register(ctx)`, remove dead code, fix drag listeners |

### `apps/storybook/`

| File | Change |
|---|---|
| `package.json` | Add `@invana/plugin-graph-data` dependency |
| `stories/canvas/node-styles/*.stories.ts` (6 files) | Use `GraphDataPlugin.setData()` |
| `stories/canvas/edge-styles/*.stories.ts` (7 files) | Use `GraphDataPlugin.setData()` |
| `stories/canvas/animations/nodes/*.stories.ts` (7 files) | Use `GraphDataPlugin.setData()` |
| `stories/canvas/showcase/LargeGraph.stories.ts` | Use `GraphDataPlugin.setData()` |

---

## Verification Checklist

| # | Check |
|---|---|
| 1 | `pnpm check-types` passes with zero errors after each phase |
| 2 | `pnpm --filter @canvas/storybook dev` runs without console errors |
| 3 | D3 layout story: nodes animate to force positions; node drag restarts simulation |
| 4 | Named port story: edge attaches to exact port offset, not perimeter |
| 5 | Custom node story compiles using `BaseNode` / `registerNode` |
| 6 | `canvas.events.on('graph:node:click', e => e)` — TypeScript infers full `INodeData` payload (no `any`) |
| 7 | `canvas.events.on('element:click', ...)` — TypeScript compile **error** (confirms removal) |
| 8 | `pnpm build` (turbo) completes for all packages in correct dependency order |

---

## Scope Boundaries

**Included:**
- All `element:*` → `graph:*` renames (strings, classes, types, methods)
- `BaseSolid` → `BaseNode`, `BaseConnector` → `BaseEdge` with all 13 subclasses
- New `@invana/plugin-graph-data` with full CRUD, layout contract, and named ports
- `D3ForceLayoutPlugin` lifecycle fix (`init` → `register`)
- Storybook updates

**Excluded:**
- Routers (`normalRouter`, `orthRouter`, `erRouter`, `oneSideRouter`) — no rename, stay in `@invana/canvas`
- Marker system — stays in `@invana/canvas`, same API
- Animation handlers (`breathe`, `colorCycle`, etc.) — no rename, stay in `@invana/canvas`
- `BackgroundPlugin`, `DrawingPlugin`, `DevInfoPlugin` — untouched
- `ShapePlugin` (legacy) — untouched
- Dynamic port positions computed from node geometry — named ports support static offsets only

---

## Important Notes

1. **Phase 1 is atomic with storybook updates.** Renaming `element:*` → `graph:*` breaks storybook immediately. These must land in a single commit.

2. **`IEdgeData` passthrough completeness.** The fields `router`, `vertices`, `sourceRadius`, `targetRadius`, `sourceOffset`, `targetOffset`, `startMarker`, `endMarker`, `states`, `opacity`, `cursor`, `zIndex`, `draggable`, `interactive` must all flow through `_renderAll()` to the connector spec without being silently dropped.

3. **D3 in-place mutation.** `getNodeData()` returns `_nodeStore` directly. D3 mutates `x`, `y`, `vx`, `vy` on the stored objects. Never return clones from `getNodeData()`.

4. **`ElementPlugin` stays as internal engine.** After Phase 9, the class file is not deleted — only its public export from `@invana/canvas` is removed. `GraphDataPlugin` continues to own and use it internally.
