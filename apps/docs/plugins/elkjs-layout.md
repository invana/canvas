# ElkLayoutPlugin

One-shot graph layout using [ELK.js](https://github.com/kieler/elkjs). Computes static node positions with hierarchical, layered, or force-based algorithms.

> **Package:** `@invana/plugin-layouts-elkjs`

## Installation

```bash
npm install @invana/plugin-layouts-elkjs
# or
pnpm add @invana/plugin-layouts-elkjs
```

## Setup

`ElkLayoutPlugin` requires [`GraphDataPlugin`](./graph-data.md) to be registered first.

```ts
import { Canvas } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { ElkLayoutPlugin } from '@invana/plugin-layouts-elkjs';

const canvas = new Canvas({ container });
await canvas.init();

const graph = new GraphDataPlugin();
await canvas.plugins.register(graph);

const layout = new ElkLayoutPlugin({ algorithm: 'layered' });
await canvas.plugins.register(layout);
```

## Running the layout

```ts
graph.setData({ nodes, edges });
await layout.run();
```

`run()` reads the current graph data, sends it to ELK, and applies the computed positions back to the graph.

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `algorithm` | `string` | `'layered'` | ELK layout algorithm identifier |
| `layoutOptions` | `LayoutOptions` | `{}` | Raw ELK layout options forwarded to the root graph |
| `defaultNodeWidth` | `number` | `60` | Fallback node width when not present in node data |
| `defaultNodeHeight` | `number` | `40` | Fallback node height when not present in node data |

## Re-running with new options

```ts
await layout.rerun({ algorithm: 'mrtree', layoutOptions: { 'elk.direction': 'DOWN' } });
```

## Common algorithms

- `layered` — hierarchical layering (default)
- `mrtree` — tree layout
- `force` — force-directed
- `radial` — radial layout
- `box` — packing-based

Full algorithm and option reference: [ELK Documentation](https://eclipse.dev/elk/reference.html)

## Example

```ts
import { generateRandomTree } from '@invana/plugin-example-datasets';

const { nodes, edges } = generateRandomTree({ nodeCount: 50, edgeCount: 49 });

const graph = new GraphDataPlugin({ fitOnRender: false });
await canvas.plugins.register(graph);

const layout = new ElkLayoutPlugin({
  algorithm: 'layered',
  layoutOptions: {
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': 80,
  },
});
await canvas.plugins.register(layout);

graph.setData({ nodes, edges });
await layout.run();
graph.fitContent();
```
