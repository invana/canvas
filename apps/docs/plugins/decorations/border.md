# BorderDecoration

An outline drawn on top of the host. Static — no animation tick.

Registered as kind `'border'`, target `'shape'`. Lands in the `'border'` z-band (above the shape).

Like the halo, the outline traces a circle/ellipse for round hosts and an AABB-rounded-rect for others. Set `cornerRadius` to override the auto-pick on rectangular hosts.

## Style

```ts
interface BorderStyle {
  color: number;
  width?: number;          // px, default 1
  alpha?: number;          // 0..1, default 1
  cornerRadius?: number;   // for rect hosts, default 0
  inset?: number;          // negative = outside the shape, positive = inside, default 0
}
```

## Usage

```ts
import { BorderDecoration } from '@invana/canvas/renderers/shapes';

renderer.registerDecoration('border', 'shape', BorderDecoration);
renderer.setDecoration(nodeId, 'border', { color: 0x111111, width: 2 });
```

See [Decorations overview](./).
