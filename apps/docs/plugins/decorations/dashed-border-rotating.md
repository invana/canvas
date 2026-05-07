# DashedBorderRotatingDecoration

A dashed circular border that rotates around the host center. Animated.

Registered as kind `'dashed-border-rotating'`, target `'shape'`. Lands in the `'border'` z-band.

The decoration always traces a circle whose radius is derived from the host's AABB diagonal half-length plus `padding`. Uses the same dashed-stroke technique as `MarchingAntsDecoration`, but draws once and animates the container's `rotation` instead of re-stroking — cheaper per frame.

## Style

```ts
interface DashedBorderRotatingStyle {
  color: number;
  width?: number;
  alpha?: number;
  dashLength?: number;
  gapLength?: number;
  padding?: number;   // outside host bounds, default 4
  speed?: number;     // radians per ms, default 0.0008
}
```

## Usage

```ts
import { DashedBorderRotatingDecoration } from '@invana/canvas/renderers/shapes';

renderer.registerDecoration('dashed-border-rotating', 'shape', DashedBorderRotatingDecoration);
renderer.setDecoration(nodeId, 'dashed-border-rotating', { color: 0x4f8cff, padding: 8 });
```

See [Decorations overview](./).
