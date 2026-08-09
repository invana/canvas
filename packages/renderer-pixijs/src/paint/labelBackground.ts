/**
 * Rounded-rect "pill" background drawn behind a label's text. Shared between
 * shape- and connector-anchored label decorations.
 *
 * The pill is a single `Graphics` cleared and re-drawn on each repaint —
 * cheap (one rect path), and avoids per-frame allocation when style changes.
 */

import { Graphics, Filter, type ColorMatrixFilter } from 'pixi.js';
import type { LabelBackground } from '../types';

export interface BackgroundDrawArgs {
  /** Inner content width in pixels (text bounds). */
  readonly width: number;
  /** Inner content height in pixels. */
  readonly height: number;
}

/** Resolved padding `[top, right, bottom, left]` from any of the shorthand forms. */
export function resolvePadding(
  pad: LabelBackground['padding'] | undefined,
): readonly [number, number, number, number] {
  if (pad === undefined) return [4, 6, 4, 6];
  if (typeof pad === 'number') return [pad, pad, pad, pad];
  if (pad.length === 2) return [pad[0], pad[1], pad[0], pad[1]];
  return [pad[0], pad[1], pad[2], pad[3]];
}

/** Resolved radius `[tl, tr, br, bl]` from a number or the per-corner tuple. */
export function resolveRadius(
  r: LabelBackground['radius'] | undefined,
): readonly [number, number, number, number] {
  if (r === undefined) return [4, 4, 4, 4];
  if (typeof r === 'number') return [r, r, r, r];
  return r;
}

/**
 * Draw the pill into `g`. `width` / `height` are the *content* dimensions —
 * padding is added on top of them so the pill encloses the text.
 *
 * Returns the outer pill size, useful for layout (e.g. positioning the text
 * inside it).
 */
export function drawLabelBackground(
  g: Graphics,
  bg: LabelBackground,
  args: BackgroundDrawArgs,
): { width: number; height: number; padding: readonly [number, number, number, number] } {
  g.clear();
  const padding = resolvePadding(bg.padding);
  const [pt, pr, pb, pl] = padding;
  const outerW = args.width + pl + pr;
  const outerH = args.height + pt + pb;
  const radius = resolveRadius(bg.radius);

  // Pixi v8 has no per-corner radius shorthand on Graphics — emit a manual
  // rounded path so per-corner radii are honoured. When all four corners
  // share a radius, fall back to the built-in `roundRect` for simplicity.
  if (allEqual(radius)) {
    g.roundRect(-pl, -pt, outerW, outerH, radius[0]);
  } else {
    traceRoundedRect(g, -pl, -pt, outerW, outerH, radius);
  }

  if (bg.fill !== undefined) {
    g.fill({ color: bg.fill, alpha: bg.fillAlpha ?? 1 });
  }
  if (bg.stroke !== undefined) {
    g.stroke({
      color: bg.stroke,
      alpha: bg.strokeAlpha ?? 1,
      width: bg.strokeWidth ?? 1,
    });
  }

  // Pixi v8 filter-based shadow is heavy. For v0 we draw a cheap soft-shadow
  // approximation: a second pass of the same rect, offset, lower-alpha, no
  // stroke. Good enough for label pills; switch to a filter later if needed.
  if (bg.shadow) {
    const offX = bg.shadow.offsetX ?? 1;
    const offY = bg.shadow.offsetY ?? 2;
    const alpha = bg.shadow.alpha ?? 0.25;
    // We rendered the foreground pill first; for shadow we need it behind.
    // So we wipe and re-issue, shadow first then foreground.
    g.clear();
    if (allEqual(radius)) {
      g.roundRect(-pl + offX, -pt + offY, outerW, outerH, radius[0]);
    } else {
      traceRoundedRect(g, -pl + offX, -pt + offY, outerW, outerH, radius);
    }
    g.fill({ color: bg.shadow.color, alpha });
    // Foreground pass.
    if (allEqual(radius)) {
      g.roundRect(-pl, -pt, outerW, outerH, radius[0]);
    } else {
      traceRoundedRect(g, -pl, -pt, outerW, outerH, radius);
    }
    if (bg.fill !== undefined) g.fill({ color: bg.fill, alpha: bg.fillAlpha ?? 1 });
    if (bg.stroke !== undefined) {
      g.stroke({
        color: bg.stroke,
        alpha: bg.strokeAlpha ?? 1,
        width: bg.strokeWidth ?? 1,
      });
    }
  }

  return { width: outerW, height: outerH, padding };
}

function allEqual(r: readonly [number, number, number, number]): boolean {
  return r[0] === r[1] && r[1] === r[2] && r[2] === r[3];
}

/**
 * Trace a rounded rect with per-corner radii using arcTo. Order: top-left,
 * top-right, bottom-right, bottom-left. Each corner radius is clamped to
 * half of the shorter side so opposite corners don't overlap on tiny pills.
 */
function traceRoundedRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r: readonly [number, number, number, number],
): void {
  const maxR = Math.min(w, h) / 2;
  const tl = Math.min(r[0], maxR);
  const tr = Math.min(r[1], maxR);
  const br = Math.min(r[2], maxR);
  const bl = Math.min(r[3], maxR);

  g.moveTo(x + tl, y);
  g.lineTo(x + w - tr, y);
  g.arcTo(x + w, y, x + w, y + tr, tr);
  g.lineTo(x + w, y + h - br);
  g.arcTo(x + w, y + h, x + w - br, y + h, br);
  g.lineTo(x + bl, y + h);
  g.arcTo(x, y + h, x, y + h - bl, bl);
  g.lineTo(x, y + tl);
  g.arcTo(x, y, x + tl, y, tl);
  g.closePath();
}

// Pixi types referenced for compatibility; not used in the cheap-shadow path.
// Kept here so future filter-based shadows have a clear import surface.
export type _FilterTypes = Filter | ColorMatrixFilter;
