/**
 * `border` — primitive decoration: outline drawn on top of the host.
 *
 * Static. Single responsibility: emit border geometry into the supplied
 * Graphics. Traces a circle/ellipse for round hosts; rect (or rounded rect
 * if `cornerRadius` is set) for others.
 */

import type { Graphics } from 'pixi.js';
import type { Rect, StaticDecorationKind } from '../types';

/**
 * Shared option base for outline-style decorations (`border`, `halo`, ...).
 * Each decoration adds its own positional fields (`inset`, `padding`, ...)
 * and stroke/fill specifics on top.
 */
export interface OutlineDecorationOpts {
  readonly color: number;
  /** 0..1 opacity. Default depends on the decoration. */
  readonly alpha?: number;
  /** Rounded corner radius for rect-like hosts. Default `0` (sharp). */
  readonly cornerRadius?: number;
}

export interface BorderOpts extends OutlineDecorationOpts {
  /** Stroke width. Default `1`. */
  readonly width?: number;
  /**
   * Inset/outset relative to host bounds. Negative = outside; positive = inside.
   * Default `0` (sits on the host edge).
   */
  readonly inset?: number;
}

export function drawBorder(
  g: Graphics,
  bounds: Rect,
  opts: BorderOpts,
  hostKind?: string,
): void {
  const width = opts.width ?? 1;
  if (width <= 0) return;
  const alpha = opts.alpha ?? 1;
  const inset = opts.inset ?? 0;
  const cornerRadius = opts.cornerRadius ?? 0;

  const { x, y, width: w, height: h } = bounds;
  const cx = x + w / 2;
  const cy = y + h / 2;

  if (hostKind === 'circle' || hostKind === 'ellipse') {
    const rx = Math.max(0, w / 2 - inset);
    const ry = Math.max(0, h / 2 - inset);
    g.ellipse(cx, cy, rx, ry);
  } else if (cornerRadius > 0) {
    g.roundRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset, cornerRadius);
  } else {
    g.rect(x + inset, y + inset, w - 2 * inset, h - 2 * inset);
  }
  g.stroke({ color: opts.color, width, alpha });
}

export const borderKind: StaticDecorationKind<BorderOpts> = { draw: drawBorder };
