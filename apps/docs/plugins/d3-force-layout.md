# D3ForceLayoutPlugin

Force-directed graph layout using [d3-force](https://github.com/d3/d3-force). Runs a physics simulation that positions nodes based on charge repulsion, link attraction, and optional collision forces.

> **Package:** `@invana/plugin-layouts-d3-force`

## Installation

```bash
npm install @invana/plugin-layouts-d3-force
# or
pnpm add @invana/plugin-layouts-d3-force
```

## Setup

`D3ForceLayoutPlugin` requires [`GraphDataPlugin`](./graph-data.md) to be registered first.

```ts
import { Canvas } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';

const canvas = new Canvas({ container });
await canvas.init();

const graph = new GraphDataPlugin();
await canvas.plugins.register(graph);

const layout = new D3ForceLayoutPlugin({ charge: -300 });
await canvas.plugins.register(layout);
```

## Starting the simulation

```ts
graph.setData({ nodes, edges });
await layout.start();
```

`start()` begins the D3 simulation. By default it animates in real time. Nodes will converge toward a stable layout.

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `charge` | `number` | `-350` | Charge force strength (negative = repulsion) |
| `linkDistance` | `number` | `100` | Target distance between connected nodes |
| `collisionRadius` | `number` | — | Enable collision force with this radius |
| `animate` | `boolean` | `true` | Update positions on every simulation tick |
| `iterations` | `number` | `300` | Max iterations when `animate: false` |

## Controlling the simulation

```ts
layout.stop();           // halt the simulation
layout.isRunning();      // boolean
layout.setOptions({ charge: -500, linkDistance: 120 });
```

## Interaction

The plugin automatically reheats the simulation while the user drags a node:

- On `shape:dragmove`, the dragged node is fixed to the pointer position and the simulation restarts with `alphaTarget(0.3)`.
- On `shape:dragend`, the fixed position is released and `alphaTarget` returns to `0`.

No additional setup is required.

## Example

```ts
import { lesMiserablesDataRaw } from '@invana/plugin-example-datasets';

const graph = new GraphDataPlugin({ fitOnRender: false });
await canvas.plugins.register(graph);

const layout = new D3ForceLayoutPlugin({
  charge: -400,
  linkDistance: 80,
  collisionRadius: 25,
});
await canvas.plugins.register(layout);

graph.setData(lesMiserablesDataRaw);
await layout.start();
```
