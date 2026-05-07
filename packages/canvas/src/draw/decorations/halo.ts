/**
 * `halo` — primitive decoration: filled ring outside host bounds.
 *
 * Static (no animation). Single responsibility: emit a halo geometry into the
 * supplied Graphics given host bounds + host kind. The renderer holds the
 * Graphics in the host's `'halo'` slot and calls `drawHalo` on mount/update.
 *
 * Outline traces a circle/ellipse for round hosts and a (rounded) rect for
 * everything else. `cornerRadius` controls the outer corner roundness for
 * rect-like hosts; pass the host's own `cornerRadius` so the halo matches.
 */

import type { Graphics } from 'pixi.js';
import type { Rect, StaticDecorationKind } from '../types';
import type { OutlineDecorationOpts } from './border';

export interface HaloOpts extends OutlineDecorationOpts {
  /** Padding outside the host bounds. Default `4`. */
  readonly padding?: number;
}

export function drawHalo(g: Graphics, bounds: Rect, opts: HaloOpts, hostKind?: string): void {
  const padding = opts.padding ?? 4;
  const alpha = opts.alpha ?? 0.4;
  const cornerRadius = opts.cornerRadius ?? 0;
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (hostKind === 'circle' || hostKind === 'ellipse') {
    g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
  } else if (cornerRadius > 0) {
    g.roundRect(
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2,
      cornerRadius + padding,
    );
  } else {
    g.rect(x - padding, y - padding, width + padding * 2, height + padding * 2);
  }
  g.fill({ color: opts.color, alpha });
}

export const haloKind: StaticDecorationKind<HaloOpts> = { draw: drawHalo };
