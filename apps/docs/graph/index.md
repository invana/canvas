# Graph package

::: warning Planned — in design
`@invana/graph` is still a skeleton. The API surface, types, and event names below are the **target** design; the runtime is not yet built. This section exists so consumers and contributors can comment on the shape before code lands.
:::

`@invana/graph` is the first domain package built on `@invana/canvas`. It provides `GraphLayer`, the node/edge data model, the graph-flavoured behaviours (hover, click-select, lasso, brush, drag-node), and the minimap.

The engine remains domain-free: every node/edge concept lives in this package. `@invana/canvas` knows only about shapes and connectors. `GraphLayer` projects node/edge data into `renderer.addShape` / `renderer.addConnector` calls and surfaces `node:*` / `edge:*` events on `layer.events`.

## Design principles

- **Layer, not plugin.** A `GraphLayer` extends `WorldLayer` and owns its data. `canvas.layers.add(graphLayer)`. No `getPlugin('graph-data')` indirection.
- **Bulk hot data lives in a typed-array column store.** Node and edge attributes go into `ColumnStore` instances — fast bulk writes, ~10 ns per mutation, designed for millions of items. See the architecture proposal for the rationale.
- **Behaviours never auto-enable.** Selection, drag, lasso, brush, hover are each registered AND enabled by the developer. No magic.
- **Events are split by type.** `node:click` and `edge:click` are distinct events with distinct payloads, not a flat `element:click` with a discriminant.
- **Layouts are pure functions.** A `Layout` reads node positions, computes new ones, writes them back. It doesn't register with the canvas and doesn't render.

## What ships here

| Module | Status |
|---|---|
| `GraphLayer` | planned |
| `MiniMapLayer` | planned |
| `HoverBehaviour`, `ClickSelectBehaviour`, `LassoSelectBehaviour`, `BrushSelectBehaviour`, `DragNodeBehaviour`, `PanBehaviour` | planned |
| `INodeData`, `IEdgeData`, `ICanvasData`, `IGraphStyles` types | planned (see [Data model](./data-model.md)) |
| `node:*` / `edge:*` event catalogue | planned (see [Events](./events.md)) |
| `D3ForceLayout` (in `@invana/graph-layout-d3-force`) | planned |
| `ElkLayout` (in `@invana/graph-layout-elkjs`) | planned |
| Sample datasets (in `@invana/graph-datasets`) | partial |

## Target shape

```ts
import { Canvas } from '@invana/canvas';
import { GraphLayer, DragNodeBehaviour, ClickSelectBehaviour } from '@invana/graph';

const canvas = new Canvas({ el: container });
await canvas.init();

const graph = new GraphLayer({
  id: 'graph',
  fitOnRender: true,
});
canvas.layers.add(graph);

canvas.behaviours.register(new DragNodeBehaviour({ layerId: 'graph' }), { enabled: true });
canvas.behaviours.register(new ClickSelectBehaviour({ layerId: 'graph' }), { enabled: true });

graph.setData({
  nodes: [
    { id: 'a', shape: 'circle', size: 24, x: -80, y: 0 },
    { id: 'b', shape: 'rect',   size: 32, x:  80, y: 0 },
  ],
  edges: [
    { id: 'a-b', source: 'a', target: 'b', pathType: 'bezier' },
  ],
});

graph.events.on('node:click', ({ nodeId, nodeData }) => {
  console.log('clicked', nodeId, nodeData);
});
```

## Cross-layer dependencies

If you add a `MiniMapLayer`, declare its source explicitly:

```ts
canvas.layers.add(new MiniMapLayer({ id: 'mini', graphLayerId: 'graph' }));
```

The minimap does not infer "the only graph layer." Every cross-layer dependency is an explicit `*LayerId` option field.
