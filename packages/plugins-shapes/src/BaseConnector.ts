// ── BaseConnector ─────────────────────────────────────────────────────────────
// Abstract base class for all path/routing connector elements.
// Subclasses implement route(); draw() has a shared default implementation.

import type { DrawContext } from './DrawContext.js';
import { LOD } from './LODController.js';
import type {
  BaseConnectorSpec,
  ArrowSpec,
  BBox,
  HaloSpec,
  PathCommand,
  PathStyle,
  Point,
  RouterFn,
} from './spec/index.js';
import { DEFAULT_EDGE_STATES } from './defaultStates.js';

/** Default halo style applied when `spec.halo` is partially or fully omitted. */
const DEFAULT_HALO: Required<HaloSpec> = {
  color: '#7c3aed',
  width: 6,
  offset: 2,
  alpha: 0.35,
  visibleStates: ['selected'],
};

/**
 * Abstract base class for all connector (path/routing) elements managed by
 * {@link ShapesPlugin}.
 *
 * @remarks
 * Only `route()` is abstract — it returns the sequence of {@link PathCommand}s
 * that define the connector's path from `from` to `to`.  The default `draw()`
 * implementation strokes that path, draws arrowheads, and renders a midpoint
 * label at {@link LOD.DETAIL} zoom.
 *
 * @example
 * ```ts
 * class CurvedConnector extends BezierConnector {
 *   draw(ctx: DrawContext, detail: LOD) {
 *     super.draw(ctx, detail);    // stroke + arrows + label
 *   }
 * }
 * shapesPlugin.registerConnector('curved', CurvedConnector);
 * ```
 *
 * @typeParam S - The concrete spec type (must extend {@link BaseConnectorSpec}).
 */
export abstract class BaseConnector<S extends BaseConnectorSpec = BaseConnectorSpec> {
  /**
   * The current spec for this connector.
   * Modified by {@link ShapesPlugin.updateConnector} — do not mutate directly.
   */
  spec: S;

  /** Currently active state names. */
  readonly activeStates: Set<string> = new Set();

  /**
   * Called by {@link ShapesPlugin} to inject the router registry so that
   * connectors with a `spec.router` field can resolve the named router.
   * @internal
   */
  _routerRegistry?: Map<string, RouterFn>;

  /**
   * Called by {@link ShapesPlugin} to inject the marker registry so that
   * connectors with custom marker type names can resolve drawing functions.
   * @internal
   */
  _markerRegistry?: Map<string, (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void>;

  /**
   * Registry name under which this connector was added (e.g. `'bezier'`,
   * `'orthogonal'`). Set by {@link ShapesPlugin.addConnector}; used by the
   * endpoint resolver to pick a tangent-direction strategy.
   * @internal
   */
  _connectorType?: string;

  /**
   * Cached route from the last `draw()` call.
   * @internal
   */
  _cachedRoute: PathCommand[] | null = null;

  /**
   * Called by {@link ShapeObject} to trigger a redraw when this element is
   * marked dirty.
   * @internal
   */
  _onDirty?: () => void;

  /**
   * Called by {@link ShapeObject} when the halo underlay needs a redraw.
   * Set automatically — do not override.
   * @internal
   */
  _onHaloDirty?: () => void;

  constructor(spec: S) {
    this.spec = spec;
  }

  // ── Abstract member ──────────────────────────────────────────────────────────

  /**
   * Compute the path from `from` to `to`, optionally threading through `waypoints`.
   */
  abstract route(from: Point, to: Point, waypoints: Point[]): PathCommand[];

  // ── Built-in methods ─────────────────────────────────────────────────────────

  draw(ctx: DrawContext, _detail: LOD): void {
    const { from, to } = this.spec;
    const style = this.resolveStyle();

    const rawWaypoints = this.spec.vertices ?? this.spec.waypoints ?? [];
    const routedWaypoints = this._runRouter(from, to, rawWaypoints);
    this._cachedRoute = this.route(from, to, routedWaypoints);

    const endAngle   = this._endTangentAngle(this._cachedRoute, to);
    const startAngle = this._startTangentAngle(this._cachedRoute, from);

    let drawRoute = this._cachedRoute;
    let arrowTip  = to;
    let arrowTail = from;

    const endMarkerSpec   = this._resolveMarkerSpec(this.spec.endMarker  ?? this.spec.endArrow);
    const startMarkerSpec = this._resolveMarkerSpec(this.spec.startMarker ?? this.spec.startArrow);
    const endMarkerSize   = endMarkerSpec?.size   ?? 10;
    const startMarkerSize = startMarkerSpec?.size ?? 10;
    const endHasMarker    = !endMarkerSpec   || endMarkerSpec.type   !== 'none';
    const startHasMarker  =  startMarkerSpec && startMarkerSpec.type !== 'none';

    // ── End placement ─────────────────────────────────────────────────────────
    // `to` is already on the target's perimeter (placed by `rayBoundaryHit`).
    // The arrow tip lands exactly there by default; `targetOffset` (default 0)
    // pushes the tip back along the tangent for a visible gap. The line is
    // automatically trimmed back by `markerSize` so the marker has clean
    // space to draw without overlapping the line.
    const endTipBackoff = this.spec.targetOffset ?? 0;
    if (endTipBackoff !== 0) {
      arrowTip = {
        x: to.x - endTipBackoff * Math.cos(endAngle),
        y: to.y - endTipBackoff * Math.sin(endAngle),
      };
    }
    const endLineBackoff = endTipBackoff + (endHasMarker ? endMarkerSize : 0);
    if (endLineBackoff > 0) {
      const lineEnd = {
        x: to.x - endLineBackoff * Math.cos(endAngle),
        y: to.y - endLineBackoff * Math.sin(endAngle),
      };
      drawRoute = this._trimRouteEnd(drawRoute, lineEnd);
    }

    // ── Start placement ───────────────────────────────────────────────────────
    // Mirror of the end logic. `startAngle` points from `from` back toward
    // the source's centre, so the "forward along the curve" direction is the
    // opposite (startAngle + π).
    const fwdAngle = startAngle + Math.PI;
    const startTipBackoff = this.spec.sourceOffset ?? 0;
    if (startTipBackoff !== 0) {
      arrowTail = {
        x: from.x + startTipBackoff * Math.cos(fwdAngle),
        y: from.y + startTipBackoff * Math.sin(fwdAngle),
      };
    }
    const startLineBackoff = startTipBackoff + (startHasMarker ? startMarkerSize : 0);
    if (startLineBackoff > 0) {
      const lineStart = {
        x: from.x + startLineBackoff * Math.cos(fwdAngle),
        y: from.y + startLineBackoff * Math.sin(fwdAngle),
      };
      drawRoute = this._trimRouteStart(drawRoute, lineStart);
    }

    ctx.strokePath(drawRoute, style);

    if (endHasMarker) {
      const markerType  = endMarkerSpec?.type  ?? 'triangle';
      const markerColor = endMarkerSpec?.color  ?? (style.stroke as string | undefined) ?? '#999999';
      const markerAlpha = style.strokeAlpha ?? 1;
      this._drawMarker(ctx, arrowTip, endAngle, markerType, endMarkerSize, markerColor, markerAlpha, endMarkerSpec);
    }

    if (startHasMarker) {
      const markerColor = startMarkerSpec!.color ?? (style.stroke as string | undefined) ?? '#999999';
      this._drawMarker(ctx, arrowTail, startAngle, startMarkerSpec!.type, startMarkerSize, markerColor, style.strokeAlpha ?? 1, startMarkerSpec!);
    }

  }

  private _runRouter(from: Point, to: Point, vertices: Point[]): Point[] {
    const routerField = this.spec.router;
    if (!routerField || !this._routerRegistry) return vertices;
    const name = typeof routerField === 'string' ? routerField : routerField.name;
    const args = typeof routerField === 'object' ? routerField.args : undefined;
    const fn   = this._routerRegistry.get(name);
    if (!fn) {
      console.warn(`[BaseConnector] Unknown router: "${name}". Falling back to passthrough.`);
      return vertices;
    }
    return fn(from, to, vertices, args);
  }

  private _resolveMarkerSpec(
    marker: string | ArrowSpec | undefined,
  ): ArrowSpec | undefined {
    if (!marker) return undefined;
    if (typeof marker === 'string') return { type: marker as ArrowSpec['type'] };
    return marker;
  }

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

  private _endTangentAngle(route: PathCommand[], to: Point): number {
    const last = route[route.length - 1];
    if (!last) return Math.atan2(to.y - this.spec.from.y, to.x - this.spec.from.x);
    if (last.cmd === 'C') return Math.atan2(last.y - last.cp2y, last.x - last.cp2x);
    if (last.cmd === 'Q') return Math.atan2(last.y - last.cpy, last.x - last.cpx);
    const prev = route[route.length - 2];
    const px = prev && 'x' in prev ? prev.x : this.spec.from.x;
    const py = prev && 'y' in prev ? prev.y : this.spec.from.y;
    return Math.atan2(to.y - py, to.x - px);
  }

  private _startTangentAngle(route: PathCommand[], from: Point): number {
    const first = route[1];
    if (!first) return Math.atan2(this.spec.to.y - from.y, this.spec.to.x - from.x);
    if (first.cmd === 'C') return Math.atan2(from.y - first.cp1y, from.x - first.cp1x);
    if (first.cmd === 'Q') return Math.atan2(from.y - first.cpy, from.x - first.cpx);
    if (first.cmd !== 'Z' && 'x' in first) return Math.atan2(from.y - first.y, from.x - first.x);
    return Math.atan2(this.spec.to.y - from.y, this.spec.to.x - from.x);
  }

  getBBox(): BBox {
    const wps = this.spec.vertices ?? this.spec.waypoints ?? [];
    const route = this._cachedRoute ?? this.route(this.spec.from, this.spec.to, wps);
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
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }

  getCenter(): Point {
    return this._getMidpoint();
  }

  hitTest(wx: number, wy: number): boolean {
    const b = this.getBBox();
    return wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY;
  }

  setState(state: string, active: boolean): void {
    if (active) this.activeStates.add(state);
    else this.activeStates.delete(state);
    this.onStateChange?.(state, active);
    this.markDirty();
    if (this._isHaloVisibleState(state)) this._onHaloDirty?.();
  }

  markDirty(): void {
    this._cachedRoute = null;
    this._onDirty?.();
  }

  resolveStyle(): PathStyle {
    let style: PathStyle = { ...(this.spec.style ?? {}) };
    for (const state of this.activeStates) {
      // Built-in default first, then user spec.states override (higher priority).
      const fallback = DEFAULT_EDGE_STATES[state];
      if (fallback) style = { ...style, ...fallback };
      const override = this.spec.states?.[state];
      if (override) style = { ...style, ...override };
    }
    return style;
  }

  // ── Halo ────────────────────────────────────────────────────────────────────

  /** Resolved halo settings (defaults merged with `spec.halo`). */
  resolveHalo(): Required<HaloSpec> {
    return { ...DEFAULT_HALO, ...(this.spec.halo ?? {}) };
  }

  /** `true` when at least one of the halo's `visibleStates` is currently active. */
  isHaloActive(): boolean {
    const halo = this.resolveHalo();
    if (halo.visibleStates.length === 0) return false;
    for (const state of halo.visibleStates) {
      if (this.activeStates.has(state)) return true;
    }
    return false;
  }

  /**
   * Stroke the routed path into the halo underlay context. Drawn beneath the
   * connector body so the visible band of halo equals
   * `halo.offset + halo.width` on each side.
   */
  drawHalo(ctx: DrawContext, detail: LOD): void {
    if (detail === LOD.DOT || !this.isHaloActive()) return;

    const wps = this.spec.vertices ?? this.spec.waypoints ?? [];
    const route = this._cachedRoute ?? this.route(this.spec.from, this.spec.to, wps);
    this._cachedRoute = route;

    const bodyStroke = this.resolveStyle();
    const bodyWidth  = bodyStroke.strokeWidth ?? 1;
    const halo = this.resolveHalo();

    ctx.strokePath(route, {
      stroke: halo.color,
      strokeWidth: bodyWidth + 2 * (halo.offset + halo.width),
      strokeAlpha: halo.alpha,
      strokeCap: 'round',
      strokeJoin: 'round',
    });
  }

  private _isHaloVisibleState(state: string): boolean {
    const halo = this.resolveHalo();
    return halo.visibleStates.includes(state);
  }

  // ── Optional lifecycle hooks ──────────────────────────────────────────────────

  onMount?(): void;
  onUpdate?(prev: S, next: S): void;
  onDestroy?(): void;
  onStateChange?(state: string, active: boolean): void;
  onAnimationTick?(dt: number): void;

  // ── Private helpers ───────────────────────────────────────────────────────────

  private _getMidpoint(): Point {
    const wps = this.spec.vertices ?? this.spec.waypoints ?? [];
    const route = this._cachedRoute ?? this.route(this.spec.from, this.spec.to, wps);
    const pts: Point[] = [];
    for (const cmd of route) pts.push(...this._cmdPoints(cmd));
    if (pts.length < 2) return this.spec.from;
    return pts[Math.floor(pts.length / 2)]!;
  }

  private _trimRouteEnd(route: PathCommand[], newEnd: Point): PathCommand[] {
    if (route.length < 2) return route;
    const result = [...route];
    const last = result[result.length - 1]!;
    if (last.cmd === 'C') result[result.length - 1] = { ...last, x: newEnd.x, y: newEnd.y };
    else if (last.cmd === 'Q') result[result.length - 1] = { ...last, x: newEnd.x, y: newEnd.y };
    else if (last.cmd === 'L') result[result.length - 1] = { cmd: 'L', x: newEnd.x, y: newEnd.y };
    return result;
  }

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

// ── Backward-compatibility alias ─────────────────────────────────────────────
/** @deprecated Use {@link BaseConnector} instead. */
export { BaseConnector as BaseEdge };
