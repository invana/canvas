# Data model

::: warning Planned — in design
Types below are the target API for `@invana/graph`. Not yet shipped.
:::

The graph data model is two flat arrays — `nodes` and `edges` — plus an optional `styles` block for declarative styling. All shapes referenced are built-in shape kinds from `@invana/canvas`; routing comes from the same connector pipeline.

## `ICanvasData`

```ts
interface ICanvasData {
  nodes: INodeData[];
  edges: IEdgeData[];
}
```

Hand `ICanvasData` to `graphLayer.setData(data)`. The layer translates it into `renderer.addShape` / `renderer.addConnector` calls.

## `INodeData`

```ts
interface INodeData {
  id: string;
  x?: number;
  y?: number;
  shape: 'circle' | 'rect' | 'polygon' | 'regular-polygon' | 'star';
  size: number;                          // diameter / side / radius depending on shape
  label?: string;
  data?: Record<string, unknown>;        // user payload, untouched by the layer
  style?: NodeStyle;                     // per-node override
  draggable?: boolean;                   // default true; gates DragNodeBehaviour for this node
  ports?: Record<string, INodePort>;     // named anchor points (offsets from node centre)
  states?: Record<string, NodeStyle>;    // named state styles (hover, selected, …)
}

interface INodePort {
  x: number;                              // offset from node centre
  y: number;
}
```

`x` / `y` are optional because a layout (e.g. `D3ForceLayout`) can compute them. If positions are absent at `setData` time, the layer waits for a layout to write them before rendering.

## `IEdgeData`

```ts
interface IEdgeData {
  id: string;
  source: string;                                // node id
  target: string;                                // node id
  pathType: 'straight' | 'bezier' | 'orth' | 'manhattan' | 'rounded' | 'smooth';
  label?: string;
  data?: Record<string, unknown>;
  style?: EdgeStyle;
  router?: string | { name: string; args?: Record<string, unknown> };
  vertices?: Point[];                            // waypoints
  sourcePort?: string;                           // named port on source
  targetPort?: string;
  sourceRadius?: number;                         // padding on source endpoint
  targetRadius?: number;
  sourceOffset?: number;                         // pre-anchor offset along normal
  targetOffset?: number;
  startMarker?: string | MarkerShapeSpec;
  endMarker?: string | MarkerShapeSpec;
  states?: Record<string, EdgeStyle>;
}
```

`pathType` is a shortcut over the underlying `anchor → router → pathStyle` pipeline. The layer maps it into the right combination — e.g. `'rounded'` becomes `router: 'orth'` + `pathStyle: 'rounded'`. Use the full `router` field for finer control.

## `IGraphStyles` — declarative styling

```ts
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
```

```ts
graph.setStyles({
  node: {
    fill: (n) => n.data?.kind === 'user' ? '#3b82f6' : '#10b981',
  },
  edge: { stroke: '#94a3b8', strokeWidth: 1 },
});
```

Per-node `INodeData.style` overrides `IGraphStyles.node`. Per-edge `IEdgeData.style` overrides `IGraphStyles.edge`. The layer caches resolved styles and only re-resolves when `setStyles` or the node/edge spec changes.

## CRUD vs. bulk

Two ways to mutate:

| Method | When |
|---|---|
| `setData(data)` | Initial load or full replacement. |
| `addNode(data)` / `addEdge(data)` / `updateNode(id, partial)` / `updateEdge(id, partial)` / `removeNode(id)` / `removeEdge(id)` | Incremental. `removeNode` cascade-removes connected edges. |

For high-frequency feeds (streaming graph updates, simulations), call the bulk equivalents — they hit the underlying `ColumnStore` directly without going through immer:

| Method | Notes |
|---|---|
| `addNodesBulk(nodes)` / `addEdgesBulk(edges)` | Single typed-array growth pass; ~ms for 100k items. |
| `updateNodePositionsBulk(updates)` | The contract `D3ForceLayout` uses to write positions back each tick. |

## Reading data

```ts
graph.getNode(id);              // INodeData | undefined
graph.getEdge(id);              // IEdgeData | undefined
graph.getNodes();               // ReadonlyMap<string, INodeData>
graph.getEdges();               // ReadonlyMap<string, IEdgeData>
```

Layouts read via these accessors and write back via `updateNodePositionsBulk`. Behaviours read via these accessors and write to `layer.state` (selection / hover) — never directly to node data.
