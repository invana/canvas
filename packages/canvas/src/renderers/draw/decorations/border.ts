/**
 * `border` — primitive decoration: outline drawn on top of the host.
 *
 * Static. Single responsibility: emit border geometry into the supplied
 * Graphics. Traces a circle/ellipse for round hosts; rect (or rounded rect
 * if `cornerRadius` is set) for others.
 */

import type { Graphics } from 'pixi.js';
import type { Rect, StaticDecorationKind } from '../types';

export interface BorderOpts {
  readonly color: number;
  /** Stroke width. Default `1`. */
  readonly width?: number;
  /** 0..1 stroke alpha. Default `1`. */
  readonly alpha?: number;
  /** Optional rounded corner radius for rect hosts. Default `0`. */
  readonly cornerRadius?: number;
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
