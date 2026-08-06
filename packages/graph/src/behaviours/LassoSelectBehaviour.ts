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

import {
  Behaviour,
  type BehaviourOptions,
  type CanvasContext,
  type IOverlayDevice,
} from '@invana/canvas';

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
  targetLayerId: string;
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
  override readonly kind = 'lasso-select';
  private readonly clickSelectId: string;
  private opts: ResolvedOptions;

  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;

  private overlay: IOverlayDevice | null = null;

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
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `LassoSelectBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`,
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;

    // World-space overlay so the polygon stays anchored when the user pans the
    // camera mid-draw. Transient by definition — it never becomes state
    // (`docs/renderer-split-design.md` §3).
    this.overlay = ctx.createOverlay(`${this.id}-overlay`, 'world');

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
    this.overlay?.destroy();
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

    // Take the pointer so the camera doesn't pan while the lasso is drawn (and
    // no other gesture starts on top of it). Refused = someone else is already
    // mid-gesture, so don't begin a lasso.
    if (!this.claimGesture()) return;

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
      this.releaseGesture();
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
    this.releaseGesture();
    this.dragActive = false;
    this.worldPoints = [];
    this.lastScreen = null;
    this.startScreen = null;
  }

  private cancelDrag(): void {
    if (!this.dragActive) return;
    this.clearPolygon();
    this.releaseGesture();
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
    const g = this.overlay;
    if (!g || this.worldPoints.length < 2) return;

    const style = this.opts.style;
    const zoom = this.ctxRef?.camera.scale ?? 1;
    // Stroke width is authored in screen pixels; divide by zoom so the outline
    // keeps its apparent thickness as the camera scales.
    const lineWidth = (style.strokeWidth ?? 1) / Math.max(zoom, 1e-6);
    const dash = style.strokeDash ?? [4, 4];

    g.clear()
      .poly(this.worldPoints, true)
      .fill({ color: style.fill ?? 0x1677ff, alpha: style.fillAlpha ?? 0.1 })
      .poly(this.worldPoints, true)
      .stroke({
        color: style.stroke ?? 0x1677ff,
        alpha: style.strokeAlpha ?? 0.8,
        width: lineWidth,
        ...(dash.length >= 2 ? { dashArray: [dash[0]! / zoom, dash[1]! / zoom] as const } : {}),
      });
  }


  private clearPolygon(): void {
    this.overlay?.clear();
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
        if (node.hidden === true) continue; // lasso skips hidden nodes
        const pos = node.position ?? { x: 0, y: 0 };
        if (pointInPolygon(pos.x, pos.y, polygon)) enclosedShapes.add(node.id);
      }
    }
    const enclosedConnectors = new Set<string>();
    if (wantConnectors) {
      for (const edge of layer.store.edges()) {
        if (!layer.store.isEdgeVisible(edge.id)) continue; // and hidden edges
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
