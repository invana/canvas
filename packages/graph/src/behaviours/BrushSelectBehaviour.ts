/**
 * `BrushSelectBehaviour` — click-and-drag rectangular selection in screen
 * space. Every shape (and optionally connector) enclosed by the rectangle is
 * unioned with the existing selection.
 *
 * When a {@link ClickSelectBehaviour} is registered on the canvas (default
 * id `'click-select'`), the brush delegates selection mutations through it
 * so both behaviours stay in sync. Without a click-select target, the brush
 * falls back to driving `GraphLayer` state directly.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * Note: this behaviour creates a `Graphics` overlay attached to `ctx.stage`
 * for the rubber-band rectangle. That's one of two narrow carve-outs where
 * `@invana/graph` reaches into pixi directly — the alternative would be to
 * mount a private `ScreenLayer` per behaviour, which leaks an unnamed layer
 * id into the public registry.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new BrushSelectBehaviour({
 *     id: 'brush',
 *     layerId: 'graph',
 *     enabled: true,
 *     trigger: ['shift'],
 *     enableElements: ['shape', 'connector'],
 *   }),
 * );
 * ```
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

/** Element kinds the brush will pick up. */
export type BrushSelectElementType = SelectableElementType;

/** Modifier-key names accepted by `trigger`. */
export type BrushModifierKey = ModifierKey;

/** Visual style for the rubber-band rectangle. */
export interface BrushSelectStyle {
  /** Fill color `0xRRGGBB`. Default `0x1677ff`. */
  fill?: number;
  /** Fill opacity 0–1. Default `0.1`. */
  fillAlpha?: number;
  /** Stroke color `0xRRGGBB`. Default `0x1677ff`. */
  stroke?: number;
  /** Stroke opacity 0–1. Default `0.8`. */
  strokeAlpha?: number;
  /** Stroke width in pixels. Default `1`. */
  strokeWidth?: number;
  /** Dash pattern `[dashLen, gapLen]`. `[]` for solid. Default `[4, 4]`. */
  strokeDash?: number[];
}

/** Constructor options for `BrushSelectBehaviour`. */
export interface BrushSelectBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour brushes over. */
  layerId: string;
  /**
   * Optional `ClickSelectBehaviour` id to delegate to. Default `'click-select'`.
   * If found, the brush hands the merged selection to the click-select layer
   * so both stay in sync. Otherwise the brush mutates `GraphLayer` state
   * directly.
   */
  clickSelectId?: string;

  /**
   * Per-drag enable predicate. `boolean` global on/off; or a function
   * called with the pointerdown native event. Default `true`.
   */
  enable?: boolean | ((event: PointerEvent) => boolean);

  /**
   * Element types eligible for brush selection. Default `['shape', 'connector']`.
   */
  enableElements?: BrushSelectElementType[];

  /**
   * Modifier key(s) that must be held during pointerdown to activate the
   * brush. Empty array = any left-drag activates. Default `['shift']`.
   */
  trigger?: BrushModifierKey[];

  /**
   * Live-update the selection as the rect grows. `false` = apply only on
   * release. Default `false`.
   */
  immediately?: boolean;

  /**
   * Visual state name applied to brushed elements when no `ClickSelectBehaviour`
   * is targeted. Ignored on the delegate path. Default `'selected'`.
   */
  state?: string;

  /** Rectangle style. */
  style?: BrushSelectStyle;

  /**
   * Clear selection when the user clicks on the empty background (no drag).
   * Default `true`.
   */
  clearOnBackground?: boolean;

  /** Fired once on release if the brush produced a selection change. */
  onSelect?: (snapshot: SelectionSnapshot) => void;
}

interface ResolvedOptions {
  enable: boolean | ((event: PointerEvent) => boolean);
  enableElements: BrushSelectElementType[];
  trigger: BrushModifierKey[];
  immediately: boolean;
  state: string;
  style: BrushSelectStyle;
  clearOnBackground: boolean;
  onSelect: ((snapshot: SelectionSnapshot) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<BrushSelectBehaviourOptions>,
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

const DRAG_THRESHOLD = 3;

export class BrushSelectBehaviour extends Behaviour {
  private readonly clickSelectId: string;
  private opts: ResolvedOptions;

  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;

  private overlay: Container | null = null;
  private gfx: Graphics | null = null;

  private dragActive = false;
  private dragStart: { x: number; y: number } | null = null;
  private dragCurrent: { x: number; y: number } | null = null;

  // Native canvas-element listener disposers.
  private listenerDisposers: Array<() => void> = [];

  constructor(opts: BrushSelectBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['shift+drag-on-bg'] });
    this.clickSelectId = opts.clickSelectId ?? 'click-select';
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `BrushSelectBehaviour "${this.id}": layer "${this.layerId}" not found.`,
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;

    // Mount the screen-space overlay.
    this.overlay = new Container();
    this.overlay.label = `${this.id}-overlay`;
    this.overlay.zIndex = 9999;
    ctx.stage.sortableChildren = true;
    ctx.stage.addChild(this.overlay);
    this.gfx = new Graphics();
    this.overlay.addChild(this.gfx);

    const el = ctx.canvasElement;
    if (!el) {
      // Headless mode — no DOM listeners. Behaviour is effectively a no-op.
      return;
    }

    const onDown = (e: PointerEvent) => this.handlePointerDown(e);
    const onMove = (e: PointerEvent) => this.handlePointerMove(e);
    const onUp = (e: PointerEvent) => this.handlePointerUp(e);
    const onCancel = () => this.cancelDrag();

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    // No `pointerleave` listener — see LassoSelectBehaviour for rationale.

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

  setOptions(patch: Partial<BrushSelectBehaviourOptions>): void {
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
    this.clearRect();
    this.dragActive = false;
    this.dragStart = null;
    this.dragCurrent = null;

    if (!this._enabled) return;
    if (e.button !== 0) return;

    const { enable } = this.opts;
    if (typeof enable === 'function' ? !enable(e) : !enable) return;
    if (!this.triggerActive(e)) return;

    // Reject presses that land on overlaid DOM chrome (lil-gui, HTML controls)
    // rather than the canvas itself.
    const target = e.target;
    if (target !== this.ctxRef?.canvasElement) return;

    const p = this.screenFromEvent(e);

    // Defer to the node-drag behaviour when the press lands on a node. In a
    // single-canvas renderer every pointer event targets the same <canvas>
    // element, so the `e.target` check above can't tell a node from the bare
    // background — a hit-test can. Pressing a node (e.g. to drag the current
    // selection) must not start a fresh brush on top of it.
    const world = this.ctxRef?.camera.toWorld(p.x, p.y);
    if (world && this.layer?.getRenderer()?.hitTest(world.x, world.y)?.kind === 'shape') {
      return;
    }

    // Pause camera pan so the canvas doesn't move while the brush is drawn.
    this.ctxRef?.camera.viewport.plugins.pause('drag');

    this.dragActive = true;
    this.dragStart = p;
    this.dragCurrent = p;
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.dragActive || !this.dragStart) return;
    if (e.buttons === 0) {
      this.handlePointerUp(e);
      return;
    }
    const p = this.screenFromEvent(e);
    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;
    if (
      Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD &&
      this.dragCurrent &&
      this.dragCurrent.x === this.dragStart.x &&
      this.dragCurrent.y === this.dragStart.y
    ) {
      return;
    }
    this.dragCurrent = p;
    this.drawRect();
    if (this.opts.immediately) this.applySelection();
  }

  private handlePointerUp(_e: PointerEvent): void {
    if (!this.dragActive || !this.dragStart || !this.dragCurrent) {
      this.ctxRef?.camera.viewport.plugins.resume('drag');
      this.dragActive = false;
      return;
    }
    this.clearRect();
    const hasArea = this.rectHasArea();
    if (hasArea) {
      const snapshot = this.applySelection();
      if (snapshot) this.opts.onSelect?.(snapshot);
    } else if (this.opts.clearOnBackground) {
      this.clearSelection();
    }
    this.ctxRef?.camera.viewport.plugins.resume('drag');
    this.dragActive = false;
    this.dragStart = null;
    this.dragCurrent = null;
  }

  private cancelDrag(): void {
    if (!this.dragActive) return;
    this.clearRect();
    this.ctxRef?.camera.viewport.plugins.resume('drag');
    this.dragActive = false;
    this.dragStart = null;
    this.dragCurrent = null;
  }

  // ─── Drawing ────────────────────────────────────────────────────────────

  private drawRect(): void {
    const g = this.gfx;
    if (!g || !this.dragStart || !this.dragCurrent) return;
    const x = Math.min(this.dragStart.x, this.dragCurrent.x);
    const y = Math.min(this.dragStart.y, this.dragCurrent.y);
    const w = Math.abs(this.dragCurrent.x - this.dragStart.x);
    const h = Math.abs(this.dragCurrent.y - this.dragStart.y);

    const style = this.opts.style;
    const fill = style.fill ?? 0x1677ff;
    const fillAlpha = style.fillAlpha ?? 0.1;
    const stroke = style.stroke ?? 0x1677ff;
    const strokeAlpha = style.strokeAlpha ?? 0.8;
    const strokeWidth = style.strokeWidth ?? 1;
    const strokeDash = style.strokeDash ?? [4, 4];

    g.clear();
    g.rect(x, y, w, h);
    g.fill({ color: fill, alpha: fillAlpha });

    if (strokeDash.length >= 2) {
      this.drawDashedRect(g, x, y, w, h, strokeDash, stroke, strokeAlpha, strokeWidth);
    } else {
      g.rect(x, y, w, h);
      g.stroke({ color: stroke, alpha: strokeAlpha, width: strokeWidth });
    }
  }

  private drawDashedRect(
    g: Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    dash: number[],
    color: number,
    alpha: number,
    lineWidth: number,
  ): void {
    const dashLen = dash[0] ?? 4;
    const gapLen = dash[1] ?? 4;
    const sides: Array<[number, number, number, number]> = [
      [x, y, x + w, y],
      [x + w, y, x + w, y + h],
      [x + w, y + h, x, y + h],
      [x, y + h, x, y],
    ];
    for (const [x1, y1, x2, y2] of sides) {
      const totalLen = Math.hypot(x2 - x1, y2 - y1);
      if (totalLen === 0) continue;
      const nx = (x2 - x1) / totalLen;
      const ny = (y2 - y1) / totalLen;
      let dist = 0;
      let drawing = true;
      while (dist < totalLen) {
        const segLen = Math.min(drawing ? dashLen : gapLen, totalLen - dist);
        if (drawing) {
          g.moveTo(x1 + nx * dist, y1 + ny * dist);
          g.lineTo(x1 + nx * (dist + segLen), y1 + ny * (dist + segLen));
          g.stroke({ color, alpha, width: lineWidth });
        }
        dist += segLen;
        drawing = !drawing;
      }
    }
  }

  private clearRect(): void {
    this.gfx?.clear();
  }

  private rectHasArea(): boolean {
    if (!this.dragStart || !this.dragCurrent) return false;
    return (
      Math.abs(this.dragCurrent.x - this.dragStart.x) > DRAG_THRESHOLD ||
      Math.abs(this.dragCurrent.y - this.dragStart.y) > DRAG_THRESHOLD
    );
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
    if (!layer || !ctx || !this.dragStart || !this.dragCurrent) return null;

    const tl = ctx.camera.toWorld(
      Math.min(this.dragStart.x, this.dragCurrent.x),
      Math.min(this.dragStart.y, this.dragCurrent.y),
    );
    const br = ctx.camera.toWorld(
      Math.max(this.dragStart.x, this.dragCurrent.x),
      Math.max(this.dragStart.y, this.dragCurrent.y),
    );
    const wx1 = Math.min(tl.x, br.x);
    const wy1 = Math.min(tl.y, br.y);
    const wx2 = Math.max(tl.x, br.x);
    const wy2 = Math.max(tl.y, br.y);

    const wantShapes = this.opts.enableElements.includes('shape');
    const wantConnectors = this.opts.enableElements.includes('connector');

    const enclosedShapes = new Set<string>();
    if (wantShapes) {
      for (const node of layer.store.nodes()) {
        const pos = node.position ?? { x: 0, y: 0 };
        if (pos.x >= wx1 && pos.x <= wx2 && pos.y >= wy1 && pos.y <= wy2) {
          enclosedShapes.add(node.id);
        }
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

    // Delegate to ClickSelectBehaviour when present.
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

    // Fallback — toggle the state directly on the GraphLayer.
    const { state } = this.opts;
    for (const sid of enclosedShapes) layer.setNodeState(sid, state, true);
    for (const cid of enclosedConnectors) layer.setEdgeState(cid, state, true);

    return {
      shapeIds: [...enclosedShapes],
      connectorIds: [...enclosedConnectors],
    };
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
    layer.clearNodeState(this.opts.state);
    layer.clearEdgeState(this.opts.state);
  }
}
