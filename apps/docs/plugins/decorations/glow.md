# GlowDecoration

A soft outer glow rendered via Pixi's `BlurFilter`. Static — no animation tick.

Registered as kind `'glow'`, target `'shape'`. Lands in the `'glow'` z-band (deepest behind the host) so the blur radiates outward without occluding the shape.

Same shape geometry as `HaloDecoration`, but rendered with a blur filter, larger padding, and lower alpha. Cheaper than it looks — `BlurFilter` runs once per frame on the small filter-area rect, not per shape pixel.

## Style

```ts
interface GlowStyle {
  color: number;
  padding?: number;   // px outside host bounds (filter-area expansion), default 12
  alpha?: number;     // 0..1, default 0.6
  blur?: number;      // BlurFilter strength, default 8
}
```

## Usage

```ts
import { GlowDecoration } from '@invana/canvas/primitives';

renderer.registerDecoration('glow', 'shape', GlowDecoration);
renderer.setDecoration(nodeId, 'glow', { color: 0xff8c4f, blur: 12 });
```

See [Decorations overview](./).
