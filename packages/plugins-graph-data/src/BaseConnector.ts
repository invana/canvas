// ── BaseEdge ─────────────────────────────────────────────────────────────────
// Abstract base class for all path/routing connector elements.
// Subclasses implement route(); draw() has a shared default implementation.

import type { DrawContext } from './DrawContext.js';
import { LOD } from './LODController.js';
import type {
  BaseEdgeSpec,
  ArrowSpec,
  BBox,
  PathCommand,
  PathStyle,
  Point,
  RouterFn,
} from './spec/index.js';

/**
 * Abstract base class for all connector (path/routing) elements managed by
 * {@link ElementPlugin}.
 *
 * @remarks
 * Only `route()` is abstract — it returns the sequence of {@link PathCommand}s
 * that define the connector's path from `from` to `to`.  The default `draw()`
 * implementation strokes that path, draws arrowheads, and renders a midpoint
 * label at {@link LOD.DETAIL} zoom.
 *
 * Override `draw()` for entirely custom appearance (e.g. animated flow lines).
 *
 * @example
 * ```ts
 * class CurvedConnector extends BezierConnector {
 *   draw(ctx: DrawContext, detail: LOD) {
 *     super.draw(ctx, detail);    // stroke + arrows + label
 *   }
 * }
 * elementPlugin.registerEdge('curved', CurvedConnector);
 * ```
 *
 * @typeParam S - The concrete spec type (must extend {@link BaseEdgeSpec}).
 */
export abstract class BaseEdge<S extends BaseEdgeSpec = BaseEdgeSpec> {
  /**
   * The current spec for this connector.
   * Modified by {@link ElementPlugin.updateEdge} — do not mutate directly.
   */
  spec: S;

  /**
   * Currently active state names.
   * @see {@link BaseSolid.activeStates}
   */
  readonly activeStates: Set<string> = new Set();

  /**
   * Called by {@link ElementPlugin} to inject the router registry so that
   * connectors with a `spec.router` field can resolve the named router.
   * @internal
   */
  _routerRegistry?: Map<string, RouterFn>;

  /**
   * Called by {@link ElementPlugin} to inject the marker registry so that
   * connectors with custom marker type names can resolve drawing functions.
   * @internal
   */
  _markerRegistry?: Map<string, (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void>;

  /**
   * Cached route from the last `draw()` call.
   * Cleared (set to `null`) whenever `markDirty()` is called so the next draw
   * forces a full re-route.
   * @internal
   */
  _cachedRoute: PathCommand[] | null = null;

  /**
   * Called by {@link ElementObject} to trigger a redraw when this element is
   * marked dirty.  Injected by the pool/scene system; do not set manually.
   * @internal
   */
  _onDirty?: () => void;

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
   * 4. Draws a midpoint label at {@link LOD.DETAIL}.
   *
   * Override to customise appearance while still calling `super.draw()` for
   * the base behaviour.
   */
  draw(ctx: DrawContext, detail: LOD): void {
    const { from, to, label } = this.spec;
    const style = this.resolveStyle();

    // Resolve waypoints — `vertices` takes precedence over deprecated `waypoints`
    const rawWaypoints = this.spec.vertices ?? this.spec.waypoints ?? [];

    // Two-stage pipeline: run router if specified, otherwise pass waypoints through
    const routedWaypoints = this._runRouter(from, to, rawWaypoints);

    this._cachedRoute = this.route(from, to, routedWaypoints);

    // Compute tangent angles before any trimming (they reference the full route)
    const endAngle   = this._endTangentAngle(this._cachedRoute, to);
    const startAngle = this._startTangentAngle(this._cachedRoute, from);

    // Trim path endpoints so strokes begin/end at element boundaries.
    // `from`/`to` are element centres; sourceRadius/targetRadius are the radii.
    let drawRoute = this._cachedRoute;
    let arrowTip  = to;
    let arrowTail = from;

    const effectiveTargetTrim = (this.spec.targetRadius ?? 0) + (this.spec.targetOffset ?? 0);
    if (effectiveTargetTrim > 0) {
      arrowTip  = {
        x: to.x - effectiveTargetTrim * Math.cos(endAngle),
        y: to.y - effectiveTargetTrim * Math.sin(endAngle),
      };
      drawRoute = this._trimRouteEnd(drawRoute, arrowTip);
    }

    const effectiveSourceTrim = (this.spec.sourceRadius ?? 0) + (this.spec.sourceOffset ?? 0);
    if (effectiveSourceTrim > 0) {
      // startAngle points from cp1 back toward `from`; negate to get forward direction
      const fwdAngle = startAngle + Math.PI;
      arrowTail = {
        x: from.x + effectiveSourceTrim * Math.cos(fwdAngle),
        y: from.y + effectiveSourceTrim * Math.sin(fwdAngle),
      };
      drawRoute = this._trimRouteStart(drawRoute, arrowTail);
    }

    ctx.strokePath(drawRoute, style);

    // Resolve end marker (startMarker > startArrow; endMarker > endArrow)
    const endMarkerSpec   = this._resolveMarkerSpec(this.spec.endMarker  ?? this.spec.endArrow);
    const startMarkerSpec = this._resolveMarkerSpec(this.spec.startMarker ?? this.spec.startArrow);

    // Draw end marker (default: triangle) at the trimmed tip
    if (!endMarkerSpec || endMarkerSpec.type !== 'none') {
      const markerType  = endMarkerSpec?.type  ?? 'triangle';
      const markerColor = endMarkerSpec?.color  ?? (style.stroke as string | undefined) ?? '#999999';
      const markerSize  = endMarkerSpec?.size   ?? 10;
      const markerAlpha = style.strokeAlpha ?? 1;
      this._drawMarker(ctx, arrowTip, endAngle, markerType, markerSize, markerColor, markerAlpha, endMarkerSpec);
    }

    // Draw start marker (default: none) at the trimmed tail
    if (startMarkerSpec && startMarkerSpec.type !== 'none') {
      const markerColor = startMarkerSpec.color ?? (style.stroke as string | undefined) ?? '#999999';
      this._drawMarker(ctx, arrowTail, startAngle, startMarkerSpec.type, startMarkerSpec.size ?? 10, markerColor, style.strokeAlpha ?? 1, startMarkerSpec);
    }

    if (detail >= LOD.DETAIL && label) {
      const mid = this._getMidpoint();
      ctx.drawLabel(label, mid.x, mid.y - 12);
    }
  }

  /**
   * Run the router specified in `spec.router` (if any) to augment waypoints.
   * If no router is specified, the raw waypoints are returned unchanged.
   */
  private _runRouter(from: Point, to: Point, vertices: Point[]): Point[] {
    const routerField = this.spec.router;
    if (!routerField || !this._routerRegistry) return vertices;

    const name = typeof routerField === 'string' ? routerField : routerField.name;
    const args = typeof routerField === 'object' ? routerField.args : undefined;
    const fn   = this._routerRegistry.get(name);
    if (!fn) {
      console.warn(`[BaseEdge] Unknown router: "${name}". Falling back to passthrough.`);
      return vertices;
    }
    return fn(from, to, vertices, args);
  }

  /**
   * Normalise a `startMarker` / `endMarker` spec field.
   * Accepts a string shorthand (e.g. `'triangle'`) or a full {@link ArrowSpec}.
   */
  private _resolveMarkerSpec(
    marker: string | ArrowSpec | undefined,
  ): ArrowSpec | undefined {
    if (!marker) return undefined;
    if (typeof marker === 'string') return { type: marker as ArrowSpec['type'] };
    return marker;
  }

  /**
   * Draw a single arrow marker — dispatches to the custom marker registry for
   * unknown types, falls through to `DrawContext.drawArrow` for built-in types.
   */
  private _drawMarker(
    ctx: DrawContext,
    tip: Point,
    angle: number,
    type: string,
    size: number,
    color: string,
    alpha: number,
    spec: ArrowSpec | undefined,
  ): void {
    const customFn = this._markerRegistry?.get(type);
    if (customFn && spec) {
      customFn(ctx, tip, angle, spec);
      return;
    }
    const extraArgs: Record<string, unknown> = {};
    if (spec?.rx !== undefined) extraArgs['rx'] = spec.rx;
    if (spec?.ry !== undefined) extraArgs['ry'] = spec.ry;
    ctx.drawArrow(tip, angle, type, size, color, alpha, Object.keys(extraArgs).length ? extraArgs : undefined);
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
    const wps = this.spec.vertices ?? this.spec.waypoints ?? [];
    const route = this._cachedRoute
      ?? this.route(this.spec.from, this.spec.to, wps);
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
    const wps = this.spec.vertices ?? this.spec.waypoints ?? [];
    const route = this._cachedRoute
      ?? this.route(this.spec.from, this.spec.to, wps);
    const pts: Point[] = [];
    for (const cmd of route) {
      pts.push(...this._cmdPoints(cmd));
    }
    if (pts.length < 2) return this.spec.from;
    return pts[Math.floor(pts.length / 2)]!;
  }

  /**
   * Return a copy of `route` with the final command's endpoint replaced by
   * `newEnd`.  For cubic/quadratic curves the control points are kept so the
   * curve still approaches `newEnd` from the same direction — this is an exact
   * retraction along the final tangent for small trim distances.
   */
  private _trimRouteEnd(route: PathCommand[], newEnd: Point): PathCommand[] {
    if (route.length < 2) return route;
    const result = [...route];
    const last = result[result.length - 1]!;
    if (last.cmd === 'C') {
      result[result.length - 1] = { ...last, x: newEnd.x, y: newEnd.y };
    } else if (last.cmd === 'Q') {
      result[result.length - 1] = { ...last, x: newEnd.x, y: newEnd.y };
    } else if (last.cmd === 'L') {
      result[result.length - 1] = { cmd: 'L', x: newEnd.x, y: newEnd.y };
    }
    return result;
  }

  /**
   * Return a copy of `route` with the M command's position replaced by
   * `newStart`.  For cubic/quadratic curves the first control point is kept so
   * the path still exits `newStart` in the same direction.
   */
  private _trimRouteStart(route: PathCommand[], newStart: Point): PathCommand[] {
    if (route.length < 1) return route;
    const result = [...route];
    result[0] = { cmd: 'M', x: newStart.x, y: newStart.y };
    return result;
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

// Re-export LOD for convenience.
export { LOD };
