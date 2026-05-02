// ── LassoSelectPlugin ─────────────────────────────────────────────────────────
// Behaviour plugin: click-and-drag on the canvas background to draw a freeform
// lasso polygon in world space. Every shape (and optionally connector) enclosed
// by the polygon is added to the selection — unioned with any existing one.
//
// When a `ClickSelectPlugin` is registered (default id `'click-select'`), the
// lasso delegates selection mutations through it so both plugins stay in sync.
// Otherwise it falls back to driving `GraphDataPlugin.setState()` directly.
//
// The polygon is drawn in **world space** so it stays glued to the graph
// during pan/zoom while the user draws — unlike `BrushSelectPlugin`, whose
// axis-aligned rectangle lives in screen space.
//
// This plugin is **opt-in** — register it explicitly when lasso-select is
// desired. It does not modify any visual state until a drag occurs.

import { Container, Graphics } from 'pixi.js';
import type {
  CanvasPlugin,
  PluginContext,
  CanvasEventMap,
} from '@invana/canvas-deprecated';
import type { GraphDataPlugin } from '../GraphDataPlugin.js';
import type { ClickSelectPlugin, SelectableElementType } from './ClickSelectPlugin.js';

type Handler<K extends keyof CanvasEventMap> = (e: CanvasEventMap[K]) => void;

/** Element kinds that the lasso will pick up. Mirrors `SelectableElementType`. */
export type LassoSelectElementType = 'shape' | 'connector';

/** Modifier-key names accepted by {@link LassoSelectPluginOptions.trigger}. */
export type LassoModifierKey = 'shift' | 'control' | 'alt' | 'meta';

/** Visual style for the lasso-polygon overlay. */
export interface LassoSelectStyle {
  /** Fill color as `0xRRGGBB`. Default `0x1677ff`. */
  fill?: number;
  /** Fill opacity 0–1. Default `0.1`. */
  fillAlpha?: number;
  /** Stroke color as `0xRRGGBB`. Default `0x1677ff`. */
  stroke?: number;
  /** Stroke opacity 0–1. Default `0.8`. */
  strokeAlpha?: number;
  /** Stroke line width in pixels. Default `1`. */
  strokeWidth?: number;
  /** Dash pattern `[dashLen, gapLen]`. Set to `[]` for a solid border. Default `[4, 4]`. */
  strokeDash?: number[];
}

/** Constructor / `setOptions` payload for {@link LassoSelectPlugin}. */
export interface LassoSelectPluginOptions {
  /** Plugin id override. Default: `'lasso-select'`. */
  key?: string;
  /** Id of the {@link GraphDataPlugin} the lasso reads through. Default: `'graph-data'`. */
  graphDataId?: string;
  /** Id of the optional {@link ClickSelectPlugin} the lasso delegates to. Default: `'click-select'`. */
  clickSelectId?: string;

  /**
   * Whether lasso-select is active.
   * `boolean` — global on/off.
   * `(event) => boolean` — per-pointerdown predicate.
   * Default: `true`.
   */
  enable?: boolean | ((event: PointerEvent) => boolean);

  /**
   * Element types eligible for lasso selection.
   * Default: `['shape', 'connector']`.
   */
  enableElements?: LassoSelectElementType[];

  /**
   * Modifier key(s) that must be held during pointerdown to activate the lasso.
   * Pass `[]` to activate on any left-button drag on the canvas background.
   * Default: `['shift']`.
   */
  trigger?: LassoModifierKey[];

  /**
   * When `true`, elements are added to the selection live while the polygon is
   * being drawn. When `false`, selection is applied only on pointer release.
   * Default: `false`.
   */
  immediately?: boolean;

  /**
   * State name applied to lasso-selected elements when no `ClickSelectPlugin`
   * is registered (fallback path only — when the lasso delegates to
   * `ClickSelectPlugin`, that plugin's own `state` is used).
   * Default: `'selected'`.
   */
  state?: string;

  /** Visual style for the polygon overlay. */
  style?: LassoSelectStyle;

  /**
   * Clear the selection when clicking on the canvas background without dragging.
   * Default: `true`.
   */
  clearOnBackground?: boolean;

  /**
   * Called once after a lasso release that produced a selection change.
   * Not fired during intermediate `immediately` updates.
   */
  onSelect?: (snapshot: { shapeIds: string[]; connectorIds: string[] }) => void;
}

interface ResolvedOptions {
  enable:            boolean | ((event: PointerEvent) => boolean);
  enableElements:    LassoSelectElementType[];
  trigger:           LassoModifierKey[];
  immediately:       boolean;
  state:             string;
  style:             LassoSelectStyle;
  clearOnBackground: boolean;
  onSelect:          ((snapshot: { shapeIds: string[]; connectorIds: string[] }) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: LassoSelectPluginOptions,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    enable:            true,
    enableElements:    ['shape', 'connector'],
    trigger:           ['shift'],
    immediately:       false,
    state:             'selected',
    style:             {},
    clearOnBackground: true,
    onSelect:          undefined,
  };
  return {
    enable:            patch.enable            ?? base.enable,
    enableElements:    patch.enableElements    ?? base.enableElements,
    trigger:           patch.trigger           ?? base.trigger,
    immediately:       patch.immediately       ?? base.immediately,
    state:             patch.state             ?? base.state,
    style:             patch.style             ?? base.style,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect:          'onSelect' in patch ? patch.onSelect : base.onSelect,
  };
}

/** Ray-casting point-in-polygon. Polygon points must be in the same space as `(px, py)`. */
function pointInPolygon(
  px: number,
  py: number,
  polygon: ReadonlyArray<{ x: number; y: number }>,
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x;
    const yi = polygon[i]!.y;
    const xj = polygon[j]!.x;
    const yj = polygon[j]!.y;
    const intersect =
      ((yi > py) !== (yj > py)) &&
      (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * `LassoSelectPlugin` — click-and-drag freeform lasso selection on the canvas
 * background. Unions enclosed shapes (and optionally connectors) with the
 * existing selection. Cooperates with {@link ClickSelectPlugin} when present.
 *
 * @example
 * ```ts
 * await canvas.plugins.register(new GraphDataPlugin({ data }));
 * await canvas.plugins.register(new ClickSelectPlugin({ multiple: true }));
 * await canvas.plugins.register(new LassoSelectPlugin({
 *   trigger:        ['shift'],
 *   enableElements: ['shape', 'connector'],
 *   immediately:    false,
 * }));
 * ```
 */
export class LassoSelectPlugin implements CanvasPlugin {
  readonly id: string;

  /** Min screen-space distance (px) between consecutive points — avoids over-sampling. */
  private static readonly MIN_POINT_DISTANCE = 5;
  /** Min screen-space drag (px) before we treat the gesture as a lasso (vs. a click). */
  private static readonly DRAG_THRESHOLD = 3;

  private readonly _graphDataId:   string;
  private readonly _clickSelectId: string;

  private _options: ResolvedOptions;
  private _ctx:    PluginContext   | null = null;
  private _graph:  GraphDataPlugin | null = null;

  private _layer:    Container | null = null;
  private _graphics: Graphics  | null = null;

  private _onPointerDown: Handler<'canvas:pointerdown'> | null = null;
  private _onPointerMove: Handler<'canvas:pointermove'> | null = null;
  private _onPointerUp:   Handler<'canvas:pointerup'>   | null = null;
  private _onClicked:     Handler<'canvas:clicked'>     | null = null;

  private _dragActive    = false;
  /** Polygon points in WORLD space — stay glued to the graph during pan/zoom. */
  private _worldPoints:    Array<{ x: number; y: number }> = [];
  /** Last screen-space point — used only for the screen-distance downsample. */
  private _lastScreenPoint: { x: number; y: number } | null = null;
  /** First screen-space point — used to detect whether the gesture has area. */
  private _startScreenPoint: { x: number; y: number } | null = null;

  constructor(options: LassoSelectPluginOptions = {}) {
    this.id             = options.key           ?? 'lasso-select';
    this._graphDataId   = options.graphDataId   ?? 'graph-data';
    this._clickSelectId = options.clickSelectId ?? 'click-select';
    this._options       = resolveOptions(null, options);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    const graph = ctx.getPlugin<GraphDataPlugin>(this._graphDataId);
    if (!graph) {
      throw new Error(
        `[LassoSelectPlugin] requires a GraphDataPlugin registered with id "${this._graphDataId}". ` +
        `Register it before LassoSelectPlugin.`,
      );
    }
    this._ctx   = ctx;
    this._graph = graph;

    // World-space overlay — pans/zooms with the camera so the polygon stays
    // anchored to the graph while the user draws and the camera is panned.
    this._layer    = ctx.createLayer({ id: `${this.id}-overlay`, zIndex: 9999, label: 'LassoSelect' });
    this._graphics = new Graphics();
    this._layer.addChild(this._graphics);

    this._onPointerDown = (e) =>
      this._handlePointerDown(e.screenX, e.screenY, e.worldX, e.worldY, e.nativeEvent);
    this._onPointerMove = (e) =>
      this._handlePointerMove(e.screenX, e.screenY, e.worldX, e.worldY, e.nativeEvent);
    this._onPointerUp   = () => this._handlePointerUp();
    this._onClicked     = () => {
      if (this._dragActive) return;
      if (this._options.clearOnBackground) this._clearSelection();
    };

    ctx.events.on('canvas:pointerdown', this._onPointerDown);
    ctx.events.on('canvas:pointermove', this._onPointerMove);
    ctx.events.on('canvas:pointerup',   this._onPointerUp);
    ctx.events.on('canvas:clicked',     this._onClicked);
  }

  destroy(): void {
    if (this._ctx) {
      if (this._onPointerDown) this._ctx.events.off('canvas:pointerdown', this._onPointerDown);
      if (this._onPointerMove) this._ctx.events.off('canvas:pointermove', this._onPointerMove);
      if (this._onPointerUp)   this._ctx.events.off('canvas:pointerup',   this._onPointerUp);
      if (this._onClicked)     this._ctx.events.off('canvas:clicked',     this._onClicked);
    }
    this._onPointerDown = null;
    this._onPointerMove = null;
    this._onPointerUp   = null;
    this._onClicked     = null;

    this._graphics?.destroy();
    this._graphics = null;
    this._layer?.removeFromParent();
    this._layer?.destroy({ children: true });
    this._layer = null;

    this._dragActive       = false;
    this._worldPoints      = [];
    this._lastScreenPoint  = null;
    this._startScreenPoint = null;
    this._graph = null;
    this._ctx   = null;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Resolved current options (read-only snapshot). */
  get options(): Readonly<ResolvedOptions> {
    return this._options;
  }

  /** Update one or more options at runtime. */
  setOptions(patch: Partial<LassoSelectPluginOptions>): void {
    this._options = resolveOptions(this._options, patch);
  }

  // ── Pointer handlers ────────────────────────────────────────────────────────

  private _handlePointerDown(
    screenX:     number,
    screenY:     number,
    worldX:      number,
    worldY:      number,
    nativeEvent: PointerEvent,
  ): void {
    // Reset every transient bit unconditionally — no stale state from a prior drag.
    this._clearPolygon();
    this._dragActive       = false;
    this._worldPoints      = [];
    this._lastScreenPoint  = null;
    this._startScreenPoint = null;

    if (nativeEvent.button !== 0) return;

    const { enable } = this._options;
    const isEnabled = typeof enable === 'function' ? enable(nativeEvent) : enable;
    if (!isEnabled) return;

    if (!this._triggerActive(nativeEvent)) return;

    // Pause camera pan so the canvas doesn't move while the lasso is drawn.
    this._ctx?.camera.lockPan();

    this._dragActive       = true;
    this._worldPoints      = [{ x: worldX, y: worldY }];
    this._lastScreenPoint  = { x: screenX, y: screenY };
    this._startScreenPoint = { x: screenX, y: screenY };
  }

  private _handlePointerMove(
    screenX:     number,
    screenY:     number,
    worldX:      number,
    worldY:      number,
    nativeEvent: PointerEvent,
  ): void {
    if (!this._dragActive || !this._lastScreenPoint) return;

    // Mouse button released outside the canvas (we missed pointerup) — clean up.
    if (nativeEvent.buttons === 0) {
      this._handlePointerUp();
      return;
    }

    const dx = screenX - this._lastScreenPoint.x;
    const dy = screenY - this._lastScreenPoint.y;

    // Downsample in screen-space — keeps spacing consistent across zoom levels.
    if (Math.hypot(dx, dy) < LassoSelectPlugin.MIN_POINT_DISTANCE) return;

    this._worldPoints.push({ x: worldX, y: worldY });
    this._lastScreenPoint = { x: screenX, y: screenY };
    this._drawPolygon();

    if (this._options.immediately) {
      this._applySelection();
    }
  }

  private _handlePointerUp(): void {
    if (!this._dragActive) {
      this._ctx?.camera.unlockPan();
      return;
    }

    this._clearPolygon();

    const hasArea = this._gestureHasArea();
    if (hasArea) {
      const snapshot = this._applySelection();
      if (snapshot) this._options.onSelect?.(snapshot);
    } else if (this._options.clearOnBackground) {
      this._clearSelection();
    }

    this._ctx?.camera.unlockPan();
    this._dragActive       = false;
    this._worldPoints      = [];
    this._lastScreenPoint  = null;
    this._startScreenPoint = null;
  }

  private _gestureHasArea(): boolean {
    // Need at least 3 distinct vertices for a polygon, AND the gesture must
    // have moved beyond the click-vs-drag threshold in screen space.
    if (this._worldPoints.length < 3) return false;
    if (!this._startScreenPoint || !this._lastScreenPoint) return false;
    const dx = this._lastScreenPoint.x - this._startScreenPoint.x;
    const dy = this._lastScreenPoint.y - this._startScreenPoint.y;
    return Math.hypot(dx, dy) > LassoSelectPlugin.DRAG_THRESHOLD;
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  // Points are in world space — drawn directly on the world-space layer.

  private _drawPolygon(): void {
    const g = this._graphics;
    if (!g || this._worldPoints.length < 2) return;

    const style       = this._options.style;
    const fill        = style.fill        ?? 0x1677ff;
    const fillAlpha   = style.fillAlpha   ?? 0.1;
    const stroke      = style.stroke      ?? 0x1677ff;
    const strokeAlpha = style.strokeAlpha ?? 0.8;
    const strokeWidth = style.strokeWidth ?? 1;
    const strokeDash  = style.strokeDash  ?? [4, 4];

    // Stroke width is in world units; divide by zoom so the line stays at a
    // constant on-screen thickness regardless of camera scale.
    const zoom = this._ctx?.camera.scale ?? 1;
    const lineWidth = strokeWidth / Math.max(zoom, 1e-6);

    g.clear();

    // Filled polygon (closed automatically by Pixi).
    const first = this._worldPoints[0]!;
    g.moveTo(first.x, first.y);
    for (let i = 1; i < this._worldPoints.length; i++) {
      const p = this._worldPoints[i]!;
      g.lineTo(p.x, p.y);
    }
    g.closePath();
    g.fill({ color: fill, alpha: fillAlpha });

    if (strokeDash.length >= 2) {
      this._drawDashedClosedPolyline(
        g, this._worldPoints, strokeDash, stroke, strokeAlpha, lineWidth, zoom,
      );
    } else {
      g.moveTo(first.x, first.y);
      for (let i = 1; i < this._worldPoints.length; i++) {
        const p = this._worldPoints[i]!;
        g.lineTo(p.x, p.y);
      }
      g.lineTo(first.x, first.y);
      g.stroke({ color: stroke, alpha: strokeAlpha, width: lineWidth });
    }
  }

  private _drawDashedClosedPolyline(
    g:         Graphics,
    points:    ReadonlyArray<{ x: number; y: number }>,
    dash:      number[],
    color:     number,
    alpha:     number,
    lineWidth: number,
    zoom:      number,
  ): void {
    // Dash lengths are screen-space pixels; convert to world units to keep
    // the dash cadence visually constant at any zoom level.
    const dashLen = (dash[0] ?? 4) / Math.max(zoom, 1e-6);
    const gapLen  = (dash[1] ?? 4) / Math.max(zoom, 1e-6);

    const n = points.length;
    for (let i = 0; i < n; i++) {
      const a = points[i]!;
      const b = points[(i + 1) % n]!;
      const totalLen = Math.hypot(b.x - a.x, b.y - a.y);
      if (totalLen === 0) continue;
      const nx = (b.x - a.x) / totalLen;
      const ny = (b.y - a.y) / totalLen;
      let dist = 0;
      let drawing = true;

      while (dist < totalLen) {
        const segLen = Math.min(drawing ? dashLen : gapLen, totalLen - dist);
        if (drawing) {
          g.moveTo(a.x + nx * dist,            a.y + ny * dist);
          g.lineTo(a.x + nx * (dist + segLen), a.y + ny * (dist + segLen));
          g.stroke({ color, alpha, width: lineWidth });
        }
        dist += segLen;
        drawing = !drawing;
      }
    }
  }

  private _clearPolygon(): void {
    this._graphics?.clear();
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  /**
   * Compute the elements enclosed by the current lasso polygon, union them with
   * the existing selection, and apply via {@link ClickSelectPlugin} when
   * available — otherwise via {@link GraphDataPlugin.setState}.
   */
  private _applySelection(): { shapeIds: string[]; connectorIds: string[] } | null {
    const ctx   = this._ctx;
    const graph = this._graph;
    if (!ctx || !graph || this._worldPoints.length < 3) return null;

    const polygon = this._worldPoints;

    const { enableElements } = this._options;
    const wantShapes     = enableElements.includes('shape');
    const wantConnectors = enableElements.includes('connector');

    // Hit-test shapes by their stored centre {x, y}.
    const enclosedShapeIds = new Set<string>();
    if (wantShapes) {
      for (const id of graph.getRenderedNodeIds()) {
        const data = graph.getNodeData(id);
        if (!data) continue;
        const nx = data.x ?? 0;
        const ny = data.y ?? 0;
        if (pointInPolygon(nx, ny, polygon)) {
          enclosedShapeIds.add(id);
        }
      }
    }

    // Hit-test connectors — both endpoints must be enclosed.
    const enclosedConnectorIds = new Set<string>();
    if (wantConnectors) {
      for (const id of graph.getRenderedEdgeIds()) {
        const data = graph.getEdgeData(id);
        if (!data) continue;
        if (enclosedShapeIds.has(data.source) && enclosedShapeIds.has(data.target)) {
          enclosedConnectorIds.add(id);
        }
      }
    }

    const clickSelect = ctx.getPlugin<ClickSelectPlugin>(this._clickSelectId);
    if (clickSelect) {
      // Union with current selection via ClickSelectPlugin so both stay in sync.
      const merged = new Map<string, SelectableElementType>();
      for (const sid of clickSelect.getSelectedShapeIds())     merged.set(sid, 'shape');
      for (const cid of clickSelect.getSelectedConnectorIds()) merged.set(cid, 'connector');
      for (const sid of enclosedShapeIds)     merged.set(sid, 'shape');
      for (const cid of enclosedConnectorIds) merged.set(cid, 'connector');

      const elements: Array<{ id: string; type: SelectableElementType }> = [];
      for (const [id, type] of merged) elements.push({ id, type });
      clickSelect.selectMultiple(elements);

      return {
        shapeIds:     clickSelect.getSelectedShapeIds(),
        connectorIds: clickSelect.getSelectedConnectorIds(),
      };
    }

    // Fallback path — drive GraphDataPlugin states directly. Union semantics:
    // existing `state`-active elements are kept; enclosed elements are added.
    const { state } = this._options;
    for (const sid of enclosedShapeIds)     graph.setState(sid, state, true);
    for (const cid of enclosedConnectorIds) graph.setState(cid, state, true);

    // We don't know prior selection without click-select — return only the
    // lasso's own contribution as a best-effort snapshot.
    return {
      shapeIds:     [...enclosedShapeIds],
      connectorIds: [...enclosedConnectorIds],
    };
  }

  /** Clear the selection — through ClickSelectPlugin when present, else direct. */
  private _clearSelection(): void {
    const ctx   = this._ctx;
    const graph = this._graph;
    if (!ctx || !graph) return;

    const clickSelect = ctx.getPlugin<ClickSelectPlugin>(this._clickSelectId);
    if (clickSelect) {
      clickSelect.clearSelection();
      return;
    }
    const { state } = this._options;
    for (const id of graph.getRenderedNodeIds()) graph.setState(id, state, false);
    for (const id of graph.getRenderedEdgeIds()) graph.setState(id, state, false);
  }

  // ── Modifier-key check ──────────────────────────────────────────────────────

  private _triggerActive(event: PointerEvent): boolean {
    const { trigger } = this._options;
    if (trigger.length === 0) return true;

    const active = new Set<string>();
    if (event.shiftKey) active.add('shift');
    if (event.ctrlKey)  active.add('control');
    if (event.altKey)   active.add('alt');
    if (event.metaKey)  active.add('meta');

    return trigger.some(k => active.has(k.toLowerCase()));
  }
}
