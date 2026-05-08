# MarchingAntsDecoration

An animated dashed outline with a scrolling offset — the classic crawling-ants selection look.

Registered as kind `'marching-ants'`, target `'shape'`. Lands in the `'border'` z-band (above the shape).

Pixi v8's stroke API doesn't expose a native dash array, so dashes are drawn manually by walking the host's outline path. The `dashOffset` advances each tick to produce the animation. Dashes that span a polyline corner render as a single continuous path so the line join stays correct.

Outline geometry:
- `circle` / `ellipse` hosts → arc-segmented ring
- everything else → rectangular bbox perimeter

A connector variant (`MarchingAntsConnectorDecoration`) is also available.

## Style

```ts
interface MarchingAntsStyle {
  color: number;
  width?: number;       // default 1.5
  alpha?: number;       // 0..1, default 1
  dashLength?: number;  // default 6
  gapLength?: number;   // default 4
  speed?: number;       // px/ms, default 0.04
  inset?: number;       // outset from host bounds, default 2
}
```

## Usage

```ts
import { MarchingAntsDecoration } from '@invana/canvas/primitives';

renderer.registerDecoration('marching-ants', 'shape', MarchingAntsDecoration);
renderer.setDecoration(nodeId, 'marching-ants', { color: 0x000000 });
```

See [Decorations overview](./).
