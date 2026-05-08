# HaloDecoration

A soft filled ring outside the host's bounds. Static — no animation tick.

Registered as kind `'halo'`, target `'shape'`. The visible part is the `padding` band that pokes out beyond the shape's draw region; the inner area is hidden behind the host because halos sit in the `'halo'` z-band (below the shape).

Circle and ellipse hosts get a halo that traces the same rounded form. All other host kinds get an axis-aligned rounded rectangle that envelops the host's local-space AABB. Custom hosts can register their own halo variants if they need shape-fitting halos.

## Style

```ts
interface HaloStyle {
  color: number;       // hex
  alpha?: number;      // 0..1, default 0.4
  padding?: number;    // px outside the host bounds, default 4
}
```

## Usage

```ts
import { PrimitivesRenderer } from '@invana/canvas';
import { HaloDecoration } from '@invana/canvas/primitives';

renderer.registerDecoration('halo', 'shape', HaloDecoration);

// later, from a layer:
renderer.setDecoration(nodeId, 'halo', { color: 0x4f8cff, padding: 6 });
```

See [Decorations overview](./).
