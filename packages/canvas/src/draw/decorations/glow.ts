/**
 * `glow` — primitive decoration: soft outer glow.
 *
 * Static, but uses a one-time `setup` hook to install a `BlurFilter` on the
 * slot Container. The `draw` step emits the same shape geometry as `halo`
 * (with larger padding); the BlurFilter softens it into a glow.
 *
 * BlurFilter cost is per-frame on the filter-area rect (cheap) — not
 * per-shape pixel.
 */

import { BlurFilter, type Container, type Graphics } from 'pixi.js';
import type { Rect, StaticDecorationKind } from '../types';

export interface GlowOpts {
  readonly color: number;
  /** Padding outside the host bounds. Default `12`. */
  readonly padding?: number;
  /** 0..1 fill alpha. Default `0.6`. */
  readonly alpha?: number;
  /** Pixi `BlurFilter.strength`. Default `8`. Higher = wider, softer glow. */
  readonly blur?: number;
}

export function setupGlow(slot: Container, opts: GlowOpts): void {
  slot.filters = [new BlurFilter({ strength: opts.blur ?? 8 })];
}

export function drawGlow(g: Graphics, bounds: Rect, opts: GlowOpts, hostKind?: string): void {
  const padding = opts.padding ?? 12;
  const alpha = opts.alpha ?? 0.6;
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (hostKind === 'circle' || hostKind === 'ellipse') {
    g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
  } else {
    g.roundRect(
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2,
      Math.max(padding, 6),
    );
  }
  g.fill({ color: opts.color, alpha });
}

export const glowKind: StaticDecorationKind<GlowOpts> = {
  setup: setupGlow,
  draw: drawGlow,
};
