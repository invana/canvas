# PulseRingDecoration

An expanding stroked ring that fades as it grows, looping forever. Animated.

Registered as kind `'pulse-ring'`, target `'shape'`. Lands in the `'pulse'` z-band (above the shape).

The ring traces the exact host outline geometry — sharp-cornered rect for `rect` hosts, ellipse for `circle`/`ellipse`, properly offset polygon for `polygon`/`path`. Edge-normal intersection keeps every edge at a uniform `padding` distance from the original.

Set `ringCount > 1` to emit N evenly-phased concentric rings simultaneously (radar-ping effect). Each ring owns a dedicated `Graphics` so Pixi's path state never bleeds between rings.

## Style

```ts
interface PulseRingStyle {
  color: number;
  width?: number;        // default 2
  alpha?: number;        // starting alpha when a ring spawns, default 0.6
  startPadding?: number; // outset when ring first appears, default 0
  endPadding?: number;   // outset when ring disappears, default 30
  periodMs?: number;     // one ring cycle, default 1500
  ringCount?: number;    // concurrently visible rings, evenly staggered, default 1
}
```

## Usage

```ts
import { PulseRingDecoration } from '@invana/canvas/primitives';

renderer.registerDecoration('pulse-ring', 'shape', PulseRingDecoration);
renderer.setDecoration(nodeId, 'pulse-ring', { color: 0x4f8cff, ringCount: 3 });
```

See [Decorations overview](./).
