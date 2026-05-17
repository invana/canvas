# CLAUDE.md — packages/graph-layout-elkjs (`@invana/graph-layout-elkjs`)

[ELK](https://eclipse.dev/elk/) `Layout` for `@invana/graph`. Wraps the
`elkjs` JS port — no wasm, no worker by default.

```ts
import { ElkLayout } from '@invana/graph-layout-elkjs';

const layout = new ElkLayout({
  algorithm: 'layered',
  direction: 'RIGHT',
  nodeSpacing: 30,
  layerSpacing: 80,
});
layout.events.on('end', () => canvas.camera.fitContent(graphLayer.getBounds(), 80));
await layout.apply(graphLayer);
```

## Lifecycle

ELK is **one-shot** — there is no tick simulation. A single `apply()`
call:

1. snapshots `layer.store` (nodes + edges, resolving width/height per node),
2. builds an ELK `root` graph with the merged property bag,
3. awaits `elk.layout()`,
4. converts ELK's top-left coordinates to canvas centre coordinates and
   bulk-writes them via `store.setPositionsBulk`,
5. emits `tick` once, then `end: { reason: 'completed' }`.

`stop()` (or a second `apply()` call) bumps a monotonic run token. The
in-flight ELK Promise still settles — `elkjs` has no cancel API — but its
result is dropped and `end: { reason: 'stopped' }` fires immediately.

## Node sizing

ELK needs concrete `width × height` for every node. By default `ElkLayout`
reads the resolved `style.shape` via `layer.resolveNodeStyle(node)`:

| shape kind | size                              |
|-----------:|-----------------------------------|
| `circle`   | `2*radius × 2*radius`             |
| `rect`     | `width × height`                  |
| `arc`      | `2*outerR × 2*outerR`             |
| _none_     | `defaultNodeSize` (`40 × 40`)     |

Override per-node with `nodeSize: (node) => ({ width, height })`.

## Options surface

Convenience fields (`algorithm`, `direction`, `nodeSpacing`,
`layerSpacing`, `edgeNodeSpacing`, `edgeSpacing`, `padding`) cover the
~90% common case and map 1:1 to ELK properties. For anything else, pass
through via `layoutOptions: Record<string, string>` — keys win over the
convenience fields. See the [ELK reference](https://eclipse.dev/elk/reference.html)
for the full catalogue.
