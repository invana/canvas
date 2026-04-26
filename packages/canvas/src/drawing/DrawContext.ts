// ── DrawContext ────────────────────────────────────────────────────────────────
// Shared drawing interface for element authors.  Lives outside any plugin so
// that any future plugin (plugin-graph, community plugins) can type their draw
// methods against it without importing from a specific plugin.
//
// PixiDrawContext (the concrete implementation) lives inside element-plugin and
// is never exported publicly.

import type { DrawStyle, PathStyle } from '../graphics-utils/types.js';
import type { Point } from '../types/canvas.js';

// ── Path commands (SVG path subset) ──────────────────────────────────────────

/**
 * A single path command — SVG-style M / L / C / Q / Z.
 * Used by {@link DrawContext.strokePath} and returned by `BaseConnector.route()`.
 */
export type PathCommand =
  | { cmd: 'M'; x: number; y: number }
  | { cmd: 'L'; x: number; y: number }
  | { cmd: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
  | { cmd: 'Q'; cpx: number; cpy: number; x: number; y: number }
  | { cmd: 'Z' };

// ── Drawing interface ─────────────────────────────────────────────────────────

/**
 * Drawing abstraction passed to every element's `draw()` method.
 *
 * @remarks
 * Hides PixiJS entirely from element implementations.  Every method maps to a
 * `graphics-utils/` drawing utility so the underlying GPU draw calls remain
 * consistent across all built-in and community elements.
 *
 * Element classes (and community plugins) should **only** interact with the
 * canvas renderer through this interface.
 */
export interface DrawContext {
  // ── Solid fills ─────────────────────────────────────────────────────────────

  /** Draw a filled / stroked circle centred at (cx, cy). */
  fillCircle(cx: number, cy: number, r: number, style: DrawStyle): void;

  /** Draw a filled / stroked rectangle.  x, y = top-left corner. */
  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    style: DrawStyle & { cornerRadius?: number },
  ): void;

  /** Draw a filled / stroked ellipse centred at (cx, cy). */
  fillEllipse(cx: number, cy: number, rx: number, ry: number, style: DrawStyle): void;

  /**
   * Draw a regular polygon (triangle=3, hexagon=6, …).
   * x, y = centre.  `rotation` is in the style object (radians).
   */
  fillPolygon(
    cx: number,
    cy: number,
    radius: number,
    sides: number,
    style: DrawStyle & { rotation?: number },
  ): void;

  /**
   * Draw a star shape.  x, y = centre.
   * `points`, `innerRatio`, and `rotation` live in the style object.
   */
  fillStar(
    cx: number,
    cy: number,
    radius: number,
    style: DrawStyle & { points?: number; innerRatio?: number; rotation?: number },
  ): void;

  // ── Path strokes ─────────────────────────────────────────────────────────────

  /**
   * Stroke an arbitrary path described by an array of {@link PathCommand}s.
   * Used by connectors to render their routed geometry.
   */
  strokePath(commands: PathCommand[], style: PathStyle): void;

  // ── Labels ────────────────────────────────────────────────────────────────────

  /**
   * Draw a centred text label at (x, y).
   *
   * @param text  - Label string.
   * @param x     - World-space x.
   * @param y     - World-space y.
   * @param style - Optional text style overrides.
   */
  drawLabel(
    text: string,
    x: number,
    y: number,
    style?: {
      fontSize?: number;
      fill?: string;
      fontFamily?: string;
      fontWeight?: string;
      align?: 'left' | 'center' | 'right';
    },
  ): void;

  // ── Arrows ───────────────────────────────────────────────────────────────────

  /**
   * Draw an arrowhead at `tip` pointing in `angle` direction (radians).
   * Used by the default {@link BaseConnector.draw} for connector endpoints.
   *
   * @param tip      - World-space tip of the arrow.
   * @param angle    - Direction the arrow points, in radians.
   * @param type     - Arrow shape name.
   * @param size     - Arrow size in world-space pixels.
   * @param color    - Arrow fill / stroke color.
   * @param alpha    - Opacity (0–1).
   * @param extraArgs - Shape-specific extra params (e.g. `rx`, `ry` for ellipse).
   */
  drawArrow(
    tip: Point,
    angle: number,
    type: string,
    size: number,
    color: string,
    alpha?: number,
    extraArgs?: Record<string, unknown>,
  ): void;
}
