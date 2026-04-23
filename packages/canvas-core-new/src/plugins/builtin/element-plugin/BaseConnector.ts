// ── BaseConnector ─────────────────────────────────────────────────────────────
// Abstract base class for all path/routing connector elements.
// Subclasses implement route(); draw() has a shared default implementation.

import type { DrawContext } from './DrawContext.js';
import { RenderDetail } from '../shape-plugin/LODController.js';
import type { BaseConnectorSpec, BBox, PathCommand, PathStyle, Point } from './spec/index.js';

/**
 * Abstract base class for all connector (path/routing) elements managed by
 * {@link ElementPlugin}.
 *
 * @remarks
 * Only `route()` is abstract — it returns the sequence of {@link PathCommand}s
 * that define the connector's path from `from` to `to`.  The default `draw()`
 * implementation strokes that path, draws arrowheads, and renders a midpoint
 * label at {@link RenderDetail.DETAIL} zoom.
 *
 * Override `draw()` for entirely custom appearance (e.g. animated flow lines).
 *
 * @example
 * ```ts
 * class CurvedConnector extends BezierConnector {
 *   draw(ctx: DrawContext, detail: RenderDetail) {
 *     super.draw(ctx, detail);    // stroke + arrows + label
 *   }
 * }
 * elementPlugin.registerConnector('curved', CurvedConnector);
 * ```
 *
 * @typeParam S - The concrete spec type (must extend {@link BaseConnectorSpec}).
 */
export abstract class BaseConnector<S extends BaseConnectorSpec = BaseConnectorSpec> {
  /**
   * The current spec for this connector.
   * Modified by {@link ElementPlugin.updateConnector} — do not mutate directly.
   */
  spec: S;

  /**
   * Currently active state names.
   * @see {@link BaseSolid.activeStates}
   */
  readonly activeStates: Set<string> = new Set();

  /**
   * Called by {@link ElementObject} when a redraw is needed.
   * @internal
   */
  _onDirty?: () => void;

  /**
   * Cached route from the last `draw()` call.
   * Cleared (set to `null`) whenever `markDirty()` is called so the next draw
   * forces a full re-route.
   * @internal
   */
  _cachedRoute: PathCommand[] | null = null;

  constructor(spec: S) {
    this.spec = spec;
  }

  // ── Abstract member ──────────────────────────────────────────────────────────

  /**
   * Compute the path from `from` to `to`, optionally threading through `waypoints`.
   *
   * @remarks
   * Must return at least two commands: an `M` (move-to) and at least one
   * `L` / `C` / `Q` (line or curve).  The returned array is used by the default
   * `draw()` to stroke the connector and by `getBBox()` to compute bounds.
   *
   * @param from      - Source endpoint in world space.
   * @param to        - Target endpoint in world space.
   * @param waypoints - Intermediate control / bend points.
   */
  abstract route(from: Point, to: Point, waypoints: Point[]): PathCommand[];

  // ── Built-in methods ─────────────────────────────────────────────────────────

  /**
   * Draw this connector.
   *
   * @remarks
   * Default implementation:
   * 1. Routes the path via `this.route()`.
   * 2. Strokes the path with the resolved style.
   * 3. Draws a triangle arrowhead at `to` (unless `endArrow.type === 'none'`).
   * 4. Draws a midpoint label at {@link RenderDetail.DETAIL}.
   *
   * Override to customise appearance while still calling `super.draw()` for
   * the base behaviour.
   */
  draw(ctx: DrawContext, detail: RenderDetail): void {
    const { from, to, waypoints = [], label } = this.spec;
    const style = this.resolveStyle();

    this._cachedRoute = this.route(from, to, waypoints);
    ctx.strokePath(this._cachedRoute, style);

    // Default end arrow (triangle)
    const endArrow = this.spec.endArrow;
    if (!endArrow || endArrow.type !== 'none') {
      const angle = this._endTangentAngle(this._cachedRoute, to);
      const arrowColor = endArrow?.color ?? (style.stroke as string | undefined) ?? '#999999';
      const arrowType = (endArrow?.type ?? 'triangle') as 'triangle' | 'triangle-outline' | 'diamond' | 'circle' | 'square';
      ctx.drawArrow(to, angle, arrowType, endArrow?.size ?? 10, arrowColor, style.strokeAlpha ?? 1);
    }

    // Optional start arrow
    const startArrow = this.spec.startArrow;
    if (startArrow && startArrow.type !== 'none') {
      const angle = this._startTangentAngle(this._cachedRoute, from);
      const arrowColor = startArrow.color ?? (style.stroke as string | undefined) ?? '#999999';
      const arrowType = startArrow.type as 'triangle' | 'triangle-outline' | 'diamond' | 'circle' | 'square';
      ctx.drawArrow(from, angle, arrowType, startArrow.size ?? 10, arrowColor, style.strokeAlpha ?? 1);
    }

    if (detail >= RenderDetail.DETAIL && label) {
      const mid = this._getMidpoint();
      ctx.drawLabel(label, mid.x, mid.y - 12);
    }
  }

  /**
   * Compute the tangent angle at the **end** of a route (for the end arrow).
   * Uses the last segment's incoming tangent: cp2→to for cubics, cp→to for
   * quadratics, prev→to for lines.
   */
  private _endTangentAngle(route: PathCommand[], to: Point): number {
    const last = route[route.length - 1];
    if (!last) return Math.atan2(to.y - this.spec.from.y, to.x - this.spec.from.x);
    if (last.cmd === 'C') {
      return Math.atan2(last.y - last.cp2y, last.x - last.cp2x);
    }
    if (last.cmd === 'Q') {
      return Math.atan2(last.y - last.cpy, last.x - last.cpx);
    }
    // L or M — use previous point
    const prev = route[route.length - 2];
    const px = prev && 'x' in prev ? prev.x : this.spec.from.x;
    const py = prev && 'y' in prev ? prev.y : this.spec.from.y;
    return Math.atan2(to.y - py, to.x - px);
  }

  /**
   * Compute the tangent angle at the **start** of a route (for the start arrow).
   * Points away from `from`, i.e. along the first outgoing segment.
   */
  private _startTangentAngle(route: PathCommand[], from: Point): number {
    const first = route[1]; // index 0 is the M command
    if (!first) return Math.atan2(this.spec.to.y - from.y, this.spec.to.x - from.x);
    if (first.cmd === 'C') {
      return Math.atan2(from.y - first.cp1y, from.x - first.cp1x);
    }
    if (first.cmd === 'Q') {
      return Math.atan2(from.y - first.cpy, from.x - first.cpx);
    }
    if (first.cmd !== 'Z' && 'x' in first) {
      return Math.atan2(from.y - first.y, from.x - first.x);
    }
    return Math.atan2(this.spec.to.y - from.y, this.spec.to.x - from.x);
  }

  /**
   * Bounding box derived from the most-recently cached route output.
   * Falls back to a straight line bbox if no route has been computed yet.
   */
  getBBox(): BBox {
    const route = this._cachedRoute
      ?? this.route(this.spec.from, this.spec.to, this.spec.waypoints ?? []);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const cmd of route) {
      for (const p of this._cmdPoints(cmd)) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }
    const pad = ((this.spec.style?.strokeWidth ?? 2) / 2) + 8;
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
    };
  }

  /** World-space midpoint of the connector path. */
  getCenter(): Point {
    return this._getMidpoint();
  }

  /**
   * Bbox-based hit test.  Connectors use the expanded bbox (+ stroke padding)
   * as their hit region since precise path hit-testing is expensive.
   */
  hitTest(wx: number, wy: number): boolean {
    const b = this.getBBox();
    return wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY;
  }

  /**
   * Activate or deactivate a named state.
   * @see {@link BaseSolid.setState}
   */
  setState(state: string, active: boolean): void {
    if (active) {
      this.activeStates.add(state);
    } else {
      this.activeStates.delete(state);
    }
    this.onStateChange?.(state, active);
    this.markDirty();
  }

  /**
   * Signal that a redraw is needed.
   * Also clears the cached route so the next draw forces a full re-route.
   */
  markDirty(): void {
    this._cachedRoute = null;
    this._onDirty?.();
  }

  /**
   * Merge base stroke style with active-state overrides.
   * @see {@link BaseSolid.resolveStyle}
   */
  resolveStyle(): PathStyle {
    let style: PathStyle = { ...(this.spec.style ?? {}) };
    for (const state of this.activeStates) {
      const override = this.spec.states?.[state];
      if (override) style = { ...style, ...override };
    }
    return style;
  }

  // ── Optional lifecycle hooks ──────────────────────────────────────────────────

  /** @see {@link BaseSolid.onMount} */
  onMount?(): void;
  /** @see {@link BaseSolid.onUpdate} */
  onUpdate?(prev: S, next: S): void;
  /** @see {@link BaseSolid.onDestroy} */
  onDestroy?(): void;
  /** @see {@link BaseSolid.onStateChange} */
  onStateChange?(state: string, active: boolean): void;
  /** @see {@link BaseSolid.onAnimationTick} */
  onAnimationTick?(dt: number): void;

  // ── Private helpers ───────────────────────────────────────────────────────────

  private _getMidpoint(): Point {
    const route = this._cachedRoute
      ?? this.route(this.spec.from, this.spec.to, this.spec.waypoints ?? []);
    const pts: Point[] = [];
    for (const cmd of route) {
      pts.push(...this._cmdPoints(cmd));
    }
    if (pts.length < 2) return this.spec.from;
    return pts[Math.floor(pts.length / 2)]!;
  }

  private _cmdPoints(cmd: PathCommand): Point[] {
    switch (cmd.cmd) {
      case 'M': return [{ x: cmd.x, y: cmd.y }];
      case 'L': return [{ x: cmd.x, y: cmd.y }];
      case 'C': return [
        { x: cmd.cp1x, y: cmd.cp1y },
        { x: cmd.cp2x, y: cmd.cp2y },
        { x: cmd.x,    y: cmd.y    },
      ];
      case 'Q': return [{ x: cmd.cpx, y: cmd.cpy }, { x: cmd.x, y: cmd.y }];
      case 'Z': return [];
    }
  }
}

// Re-export RenderDetail for convenience.
export { RenderDetail };
