/**
 * `LassoSelectBehaviour` — click-and-drag freeform polygon selection in
 * **world** space (the polygon stays anchored to the graph during pan/zoom).
 *
 * Mirrors {@link BrushSelectBehaviour} but operates with point-in-polygon
 * containment instead of an AABB rect. Delegates to a
 * {@link ClickSelectBehaviour} when one is registered.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * Same pixi-overlay carve-out as `BrushSelectBehaviour` — the world-space
 * polygon is rendered into a `Graphics` attached to `ctx.world` (which
 * pans/zooms with the camera).
 */

import { Container, Graphics } from 'pixi.js';
import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type {
  ClickSelectBehaviour,
  SelectableElementType,
  SelectionSnapshot,
} from './ClickSelectBehaviour';
import type { ModifierKey } from './ModifierTracker';

/** Element kinds the lasso will pick up. */
export type LassoSelectElementType = SelectableElementType;

/** Modifier-key names accepted by `trigger`. */
export type LassoModifierKey = ModifierKey;

/** Visual style for the polygon overlay. Same shape as the brush style. */
export interface LassoSelectStyle {
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  strokeAlpha?: number;
  /** Stroke width in *screen* pixels (auto-divided by zoom). Default `1`. */
  strokeWidth?: number;
  /** Dash pattern in screen pixels `[dashLen, gapLen]`. Default `[4, 4]`. */
  strokeDash?: number[];
}

/** Constructor options for `LassoSelectBehaviour`. */
export interface LassoSelectBehaviourOptions extends BehaviourOptions {
  layerId: string;
  clickSelectId?: string;

  enable?: boolean | ((event: PointerEvent) => boolean);
  enableElements?: LassoSelectElementType[];
  trigger?: LassoModifierKey[];
  immediately?: boolean;
  state?: string;
  style?: LassoSelectStyle;
  clearOnBackground?: boolean;
  onSelect?: (snapshot: SelectionSnapshot) => void;
}

interface ResolvedOptions {
  enable: boolean | ((event: PointerEvent) => boolean);
  enableElements: LassoSelectElementType[];
  trigger: LassoModifierKey[];
  immediately: boolean;
  state: string;
  style: LassoSelectStyle;
  clearOnBackground: boolean;
  onSelect: ((snapshot: SelectionSnapshot) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<LassoSelectBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    enable: true,
    enableElements: ['shape', 'connector'],
    trigger: ['shift'],
    immediately: false,
    state: 'selected',
    style: {},
    clearOnBackground: true,
    onSelect: undefined,
  };
  return {
    enable: patch.enable ?? base.enable,
    enableElements: patch.enableElements ?? base.enableElements,
    trigger: patch.trigger ?? base.trigger,
    immediately: patch.immediately ?? base.immediately,
    state: patch.state ?? base.state,
    style: patch.style ?? base.style,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect: 'onSelect' in patch ? patch.onSelect : base.onSelect,
  };
}

/** Min screen-space distance (px) between consecutive points — avoids over-sampling. */
const MIN_POINT_DISTANCE = 5;
/** Min screen-space drag (px) before we treat the gesture as a lasso (vs. a click). */
const DRAG_THRESHOLD = 3;

/** Ray-casting point-in-polygon. */
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
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export class LassoSelectBehaviour extends Behaviour {
  private readonly clickSelectId: string;
  private opts: ResolvedOptions;

  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;

  private overlay: Container | null = null;
  private gfx: Graphics | null = null;

  private dragActive = false;
  /** Polygon points in WORLD space. */
  private worldPoints: Array<{ x: number; y: number }> = [];
  private lastScreen: { x: number; y: number } | null = null;
  private startScreen: { x: number; y: number } | null = null;

  private listenerDisposers: Array<() => void> = [];

  constructor(opts: LassoSelectBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['shift+drag-lasso'] });
    this.clickSelectId = opts.clickSelectId ?? 'click-select';
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `LassoSelectBehaviour "${this.id}": layer "${this.layerId}" not found.`,
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;

    // World-space overlay so the polygon stays anchored when the user pans
    // the camera mid-draw.
    this.overlay = new Container();
    this.overlay.label = `${this.id}-overlay`;
    this.overlay.zIndex = 9999;
    ctx.world.sortableChildren = true;
    ctx.world.addChild(this.overlay);
    this.gfx = new Graphics();
    this.overlay.addChild(this.gfx);

    const el = ctx.canvasElement;
    if (!el) return;

    const onDown = (e: PointerEvent) => this.handlePointerDown(e);
    const onMove = (e: PointerEvent) => this.handlePointerMove(e);
    const onUp = (e: PointerEvent) => this.handlePointerUp(e);
    const onCancel = () => this.cancelDrag();

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    // NOTE: no `pointerleave` listener. Freeform lassos routinely sweep over
    // the canvas edge (or over overlapping GUI panels) — cancelling on leave
    // mid-draw kills the gesture. Window-level pointerup + pointercancel
    // cover the genuine end-of-drag and OS-level cancellation cases.

    this.listenerDisposers.push(
      () => el.removeEventListener('pointerdown', onDown),
      () => window.removeEventListener('pointermove', onMove),
      () => window.removeEventListener('pointerup', onUp),
      () => window.removeEventListener('pointercancel', onCancel),
    );
  }

  protected override onDestroy(): void {
    this.cancelDrag();
    for (const off of this.listenerDisposers) off();
    this.listenerDisposers.length = 0;
    this.gfx?.destroy();
    this.gfx = null;
    this.overlay?.removeFromParent();
    this.overlay?.destroy({ children: true });
    this.overlay = null;
    this.layer = null;
    this.ctxRef = null;
  }

  protected override onDisable(): void {
    this.cancelDrag();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  setOptions(patch: Partial<LassoSelectBehaviourOptions>): void {
    this.opts = resolveOptions(this.opts, patch);
  }

  // ─── Pointer handlers ───────────────────────────────────────────────────

  private screenFromEvent(e: PointerEvent): { x: number; y: number } {
    const el = this.ctxRef?.canvasElement;
    if (!el) return { x: e.clientX, y: e.clientY };
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private handlePointerDown(e: PointerEvent): void {
    this.clearPolygon();
    this.dragActive = false;
    this.worldPoints = [];
    this.lastScreen = null;
    this.startScreen = null;

    if (!this._enabled) return;
    if (e.button !== 0) return;
    // Reject presses on overlaid DOM chrome rather than the canvas itself.
    if (e.target !== this.ctxRef?.canvasElement) return;

    const { enable } = this.opts;
    if (typeof enable === 'function' ? !enable(e) : !enable) return;
    if (!this.triggerActive(e)) return;

    const screen = this.screenFromEvent(e);
    const world = this.ctxRef!.camera.toWorld(screen.x, screen.y);

    // Defer to the node-drag behaviour when the press lands on a node. The
    // `e.target` check above is insufficient on a single-canvas renderer (every
    // pointer event targets the same <canvas>), so hit-test instead. Pressing a
    // node — e.g. to drag the current selection — must not begin a fresh lasso.
    if (this.layer?.getRenderer()?.hitTest(world.x, world.y)?.kind === 'shape') {
      return;
    }

    this.ctxRef?.camera.viewport.plugins.pause('drag');

    this.dragActive = true;
    this.worldPoints = [{ x: world.x, y: world.y }];
    this.lastScreen = screen;
    this.startScreen = screen;
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.dragActive || !this.lastScreen) return;
    if (e.buttons === 0) {
      this.handlePointerUp(e);
      return;
    }
    const screen = this.screenFromEvent(e);
    const dx = screen.x - this.lastScreen.x;
    const dy = screen.y - this.lastScreen.y;
    if (Math.hypot(dx, dy) < MIN_POINT_DISTANCE) return;

    const world = this.ctxRef!.camera.toWorld(screen.x, screen.y);
    this.worldPoints.push({ x: world.x, y: world.y });
    this.lastScreen = screen;
    this.drawPolygon();
    if (this.opts.immediately) this.applySelection();
  }

  private handlePointerUp(_e: PointerEvent): void {
    if (!this.dragActive) {
      this.ctxRef?.camera.viewport.plugins.resume('drag');
      return;
    }
    this.clearPolygon();
    const hasArea = this.gestureHasArea();
    if (hasArea) {
      const snapshot = this.applySelection();
      if (snapshot) this.opts.onSelect?.(snapshot);
    } else if (this.opts.clearOnBackground) {
      this.clearSelection();
    }
    this.ctxRef?.camera.viewport.plugins.resume('drag');
    this.dragActive = false;
    this.worldPoints = [];
    this.lastScreen = null;
    this.startScreen = null;
  }

  private cancelDrag(): void {
    if (!this.dragActive) return;
    this.clearPolygon();
    this.ctxRef?.camera.viewport.plugins.resume('drag');
    this.dragActive = false;
    this.worldPoints = [];
    this.lastScreen = null;
    this.startScreen = null;
  }

  private gestureHasArea(): boolean {
    if (this.worldPoints.length < 3) return false;
    if (!this.startScreen || !this.lastScreen) return false;
    const dx = this.lastScreen.x - this.startScreen.x;
    const dy = this.lastScreen.y - this.startScreen.y;
    return Math.hypot(dx, dy) > DRAG_THRESHOLD;
  }

  // ─── Drawing ────────────────────────────────────────────────────────────

  private drawPolygon(): void {
    const g = this.gfx;
    if (!g || this.worldPoints.length < 2) return;

    const style = this.opts.style;
    const fill = style.fill ?? 0x1677ff;
    const fillAlpha = style.fillAlpha ?? 0.1;
    const stroke = style.stroke ?? 0x1677ff;
    const strokeAlpha = style.strokeAlpha ?? 0.8;
    const strokeWidthPx = style.strokeWidth ?? 1;
    const strokeDash = style.strokeDash ?? [4, 4];

    const zoom = this.ctxRef?.camera.scale ?? 1;
    const lineWidth = strokeWidthPx / Math.max(zoom, 1e-6);

    g.clear();
    const first = this.worldPoints[0]!;
    g.moveTo(first.x, first.y);
    for (let i = 1; i < this.worldPoints.length; i++) {
      const p = this.worldPoints[i]!;
      g.lineTo(p.x, p.y);
    }
    g.closePath();
    g.fill({ color: fill, alpha: fillAlpha });

    if (strokeDash.length >= 2) {
      this.drawDashedClosed(g, this.worldPoints, strokeDash, stroke, strokeAlpha, lineWidth, zoom);
    } else {
      g.moveTo(first.x, first.y);
      for (let i = 1; i < this.worldPoints.length; i++) {
        const p = this.worldPoints[i]!;
        g.lineTo(p.x, p.y);
      }
      g.lineTo(first.x, first.y);
      g.stroke({ color: stroke, alpha: strokeAlpha, width: lineWidth });
    }
  }

  private drawDashedClosed(
    g: Graphics,
    points: ReadonlyArray<{ x: number; y: number }>,
    dash: number[],
    color: number,
    alpha: number,
    lineWidth: number,
    zoom: number,
  ): void {
    const dashLen = (dash[0] ?? 4) / Math.max(zoom, 1e-6);
    const gapLen = (dash[1] ?? 4) / Math.max(zoom, 1e-6);
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
          g.moveTo(a.x + nx * dist, a.y + ny * dist);
          g.lineTo(a.x + nx * (dist + segLen), a.y + ny * (dist + segLen));
          g.stroke({ color, alpha, width: lineWidth });
        }
        dist += segLen;
        drawing = !drawing;
      }
    }
  }

  private clearPolygon(): void {
    this.gfx?.clear();
  }

  // ─── Selection ──────────────────────────────────────────────────────────

  private triggerActive(e: PointerEvent): boolean {
    const { trigger } = this.opts;
    if (trigger.length === 0) return true;
    const active = new Set<string>();
    if (e.shiftKey) active.add('shift');
    if (e.ctrlKey) active.add('control');
    if (e.altKey) active.add('alt');
    if (e.metaKey) active.add('meta');
    return trigger.some((k) => active.has(k.toLowerCase()));
  }

  private applySelection(): SelectionSnapshot | null {
    const layer = this.layer;
    const ctx = this.ctxRef;
    if (!layer || !ctx || this.worldPoints.length < 3) return null;

    const polygon = this.worldPoints;
    const wantShapes = this.opts.enableElements.includes('shape');
    const wantConnectors = this.opts.enableElements.includes('connector');

    const enclosedShapes = new Set<string>();
    if (wantShapes) {
      for (const node of layer.store.nodes()) {
        const pos = node.position ?? { x: 0, y: 0 };
        if (pointInPolygon(pos.x, pos.y, polygon)) enclosedShapes.add(node.id);
      }
    }
    const enclosedConnectors = new Set<string>();
    if (wantConnectors) {
      for (const edge of layer.store.edges()) {
        if (enclosedShapes.has(edge.source) && enclosedShapes.has(edge.target)) {
          enclosedConnectors.add(edge.id);
        }
      }
    }

    const clickSelect = ctx.behaviours.get<ClickSelectBehaviour>(this.clickSelectId);
    if (clickSelect) {
      const merged = new Map<string, SelectableElementType>();
      for (const sid of clickSelect.getSelectedShapeIds()) merged.set(sid, 'shape');
      for (const cid of clickSelect.getSelectedConnectorIds()) merged.set(cid, 'connector');
      for (const sid of enclosedShapes) merged.set(sid, 'shape');
      for (const cid of enclosedConnectors) merged.set(cid, 'connector');
      const elements: Array<{ id: string; type: SelectableElementType }> = [];
      for (const [id, type] of merged) elements.push({ id, type });
      clickSelect.selectMultiple(elements);
      return {
        shapeIds: clickSelect.getSelectedShapeIds(),
        connectorIds: clickSelect.getSelectedConnectorIds(),
      };
    }

    const { state } = this.opts;
    for (const sid of enclosedShapes) layer.store.setNodeState(sid, state, true);
    for (const cid of enclosedConnectors) layer.store.setEdgeState(cid, state, true);
    return { shapeIds: [...enclosedShapes], connectorIds: [...enclosedConnectors] };
  }

  private clearSelection(): void {
    const ctx = this.ctxRef;
    const layer = this.layer;
    if (!ctx || !layer) return;
    const clickSelect = ctx.behaviours.get<ClickSelectBehaviour>(this.clickSelectId);
    if (clickSelect) {
      clickSelect.clearSelection();
      return;
    }
    layer.store.clearNodeState(this.opts.state);
    layer.store.clearEdgeState(this.opts.state);
  }
}
