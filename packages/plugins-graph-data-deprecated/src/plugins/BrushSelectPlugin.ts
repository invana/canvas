// ── BrushSelectPlugin ─────────────────────────────────────────────────────────
// Behaviour plugin: click-and-drag on the canvas background to draw a selection
// rectangle in screen space. Every shape (and optionally connector) enclosed by
// the rectangle is added to the selection — unioned with any existing one.
//
// When a `ClickSelectPlugin` is registered (default id `'click-select'`), the
// brush delegates selection mutations through it so both plugins stay in sync.
// Otherwise it falls back to driving `GraphDataPlugin.setState()` directly.
//
// This plugin is **opt-in** — register it explicitly when brush-select is
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

/** Element kinds that the brush will pick up. Mirrors `SelectableElementType`. */
export type BrushSelectElementType = 'shape' | 'connector';

/** Modifier-key names accepted by {@link BrushSelectPluginOptions.trigger}. */
export type BrushModifierKey = 'shift' | 'control' | 'alt' | 'meta';

/** Visual style for the selection-rectangle overlay. */
export interface BrushSelectStyle {
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

/** Constructor / `setOptions` payload for {@link BrushSelectPlugin}. */
export interface BrushSelectPluginOptions {
  /** Plugin id override. Default: `'brush-select'`. */
  key?: string;
  /** Id of the {@link GraphDataPlugin} the brush reads through. Default: `'graph-data'`. */
  graphDataId?: string;
  /** Id of the optional {@link ClickSelectPlugin} the brush delegates to. Default: `'click-select'`. */
  clickSelectId?: string;

  /**
   * Whether brush-select is active.
   * `boolean` — global on/off.
   * `(event) => boolean` — per-pointerdown predicate.
   * Default: `true`.
   */
  enable?: boolean | ((event: PointerEvent) => boolean);

  /**
   * Element types eligible for brush selection.
   * Default: `['shape', 'connector']`.
   */
  enableElements?: BrushSelectElementType[];

  /**
   * Modifier key(s) that must be held during pointerdown to activate the brush.
   * Pass `[]` to activate on any left-button drag on the canvas background.
   * Default: `['shift']`.
   */
  trigger?: BrushModifierKey[];

  /**
   * When `true`, elements are added to the selection live while the rectangle
   * is being drawn. When `false`, selection is applied only on pointer release.
   * Default: `false`.
   */
  immediately?: boolean;

  /**
   * State name applied to brush-selected elements when no `ClickSelectPlugin`
   * is registered (fallback path only — when the brush delegates to
   * `ClickSelectPlugin`, that plugin's own `state` is used).
   * Default: `'selected'`.
   */
  state?: string;

  /** Visual style for the rectangle overlay. */
  style?: BrushSelectStyle;

  /**
   * Clear the selection when clicking on the canvas background without dragging.
   * Default: `true`.
   */
  clearOnBackground?: boolean;

  /**
   * Called once after a brush release that produced a selection change.
   * Not fired during intermediate `immediately` updates.
   */
  onSelect?: (snapshot: { shapeIds: string[]; connectorIds: string[] }) => void;
}

interface ResolvedOptions {
  enable:            boolean | ((event: PointerEvent) => boolean);
  enableElements:    BrushSelectElementType[];
  trigger:           BrushModifierKey[];
  immediately:       boolean;
  state:             string;
  style:             BrushSelectStyle;
  clearOnBackground: boolean;
  onSelect:          ((snapshot: { shapeIds: string[]; connectorIds: string[] }) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: BrushSelectPluginOptions,
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

/**
 * `BrushSelectPlugin` — click-and-drag rectangular selection on the canvas
 * background. Unions enclosed shapes (and optionally connectors) with the
 * existing selection. Cooperates with {@link ClickSelectPlugin} when present.
 *
 * @example
 * ```ts
 * await canvas.plugins.register(new GraphDataPlugin({ data }));
 * await canvas.plugins.register(new ClickSelectPlugin({ multiple: true }));
 * await canvas.plugins.register(new BrushSelectPlugin({
 *   trigger:        ['shift'],
 *   enableElements: ['shape', 'connector'],
 *   immediately:    false,
 * }));
 * ```
 */
export class BrushSelectPlugin implements CanvasPlugin {
  readonly id: string;

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

  private _dragActive  = false;
  private _dragStart:   { x: number; y: number } | null = null;
  private _dragCurrent: { x: number; y: number } | null = null;

  constructor(options: BrushSelectPluginOptions = {}) {
    this.id             = options.key           ?? 'brush-select';
    this._graphDataId   = options.graphDataId   ?? 'graph-data';
    this._clickSelectId = options.clickSelectId ?? 'click-select';
    this._options       = resolveOptions(null, options);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    const graph = ctx.getPlugin<GraphDataPlugin>(this._graphDataId);
    if (!graph) {
      throw new Error(
        `[BrushSelectPlugin] requires a GraphDataPlugin registered with id "${this._graphDataId}". ` +
        `Register it before BrushSelectPlugin.`,
      );
    }
    this._ctx   = ctx;
    this._graph = graph;

    // Screen-space overlay — does not pan/zoom with the camera.
    this._layer    = ctx.createScreenLayer({ id: `${this.id}-overlay`, zIndex: 9999 });
    this._graphics = new Graphics();
    this._layer.addChild(this._graphics);

    this._onPointerDown = (e) => this._handlePointerDown(e.screenX, e.screenY, e.nativeEvent);
    this._onPointerMove = (e) => this._handlePointerMove(e.screenX, e.screenY, e.nativeEvent);
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

    this._dragActive  = false;
    this._dragStart   = null;
    this._dragCurrent = null;
    this._graph = null;
    this._ctx   = null;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Resolved current options (read-only snapshot). */
  get options(): Readonly<ResolvedOptions> {
    return this._options;
  }

  /** Update one or more options at runtime. */
  setOptions(patch: Partial<BrushSelectPluginOptions>): void {
    this._options = resolveOptions(this._options, patch);
  }

  // ── Pointer handlers ────────────────────────────────────────────────────────

  private _handlePointerDown(screenX: number, screenY: number, nativeEvent: PointerEvent): void {
    // Reset every transient bit unconditionally — no stale state from a prior drag.
    this._clearRect();
    this._dragActive  = false;
    this._dragStart   = null;
    this._dragCurrent = null;

    if (nativeEvent.button !== 0) return;

    const { enable } = this._options;
    const isEnabled = typeof enable === 'function' ? enable(nativeEvent) : enable;
    if (!isEnabled) return;

    if (!this._triggerActive(nativeEvent)) return;

    // Pause camera pan so the canvas doesn't move while the brush is drawn.
    this._ctx?.camera.lockPan();

    this._dragActive  = true;
    this._dragStart   = { x: screenX, y: screenY };
    this._dragCurrent = { x: screenX, y: screenY };
  }

  private _handlePointerMove(screenX: number, screenY: number, nativeEvent: PointerEvent): void {
    if (!this._dragActive || !this._dragStart) return;

    // Mouse button released outside the canvas (we missed pointerup) — clean up.
    if (nativeEvent.buttons === 0) {
      this._handlePointerUp();
      return;
    }

    const dx = screenX - this._dragStart.x;
    const dy = screenY - this._dragStart.y;

    // Don't draw until the threshold is exceeded (avoids flashing rect on a click).
    if (
      Math.sqrt(dx * dx + dy * dy) < BrushSelectPlugin.DRAG_THRESHOLD &&
      this._dragCurrent &&
      this._dragCurrent.x === this._dragStart.x &&
      this._dragCurrent.y === this._dragStart.y
    ) {
      return;
    }

    this._dragCurrent = { x: screenX, y: screenY };
    this._drawRect();

    if (this._options.immediately) {
      this._applySelection();
    }
  }

  private _handlePointerUp(): void {
    if (!this._dragActive || !this._dragStart || !this._dragCurrent) {
      this._ctx?.camera.unlockPan();
      this._dragActive = false;
      return;
    }

    this._clearRect();

    const hasArea = this._rectHasArea();
    if (hasArea) {
      const snapshot = this._applySelection();
      if (snapshot) this._options.onSelect?.(snapshot);
    } else if (this._options.clearOnBackground) {
      this._clearSelection();
    }

    this._ctx?.camera.unlockPan();
    this._dragActive  = false;
    this._dragStart   = null;
    this._dragCurrent = null;
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────

  private _drawRect(): void {
    const g = this._graphics;
    if (!g || !this._dragStart || !this._dragCurrent) return;

    const x = Math.min(this._dragStart.x, this._dragCurrent.x);
    const y = Math.min(this._dragStart.y, this._dragCurrent.y);
    const w = Math.abs(this._dragCurrent.x - this._dragStart.x);
    const h = Math.abs(this._dragCurrent.y - this._dragStart.y);

    const style       = this._options.style;
    const fill        = style.fill        ?? 0x1677ff;
    const fillAlpha   = style.fillAlpha   ?? 0.1;
    const stroke      = style.stroke      ?? 0x1677ff;
    const strokeAlpha = style.strokeAlpha ?? 0.8;
    const strokeWidth = style.strokeWidth ?? 1;
    const strokeDash  = style.strokeDash  ?? [4, 4];

    g.clear();
    g.rect(x, y, w, h);
    g.fill({ color: fill, alpha: fillAlpha });

    if (strokeDash.length >= 2) {
      this._drawDashedRect(g, x, y, w, h, strokeDash, stroke, strokeAlpha, strokeWidth);
    } else {
      g.rect(x, y, w, h);
      g.stroke({ color: stroke, alpha: strokeAlpha, width: strokeWidth });
    }
  }

  private _drawDashedRect(
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
    const gapLen  = dash[1] ?? 4;

    const sides: Array<[number, number, number, number]> = [
      [x,     y,     x + w, y    ],  // top
      [x + w, y,     x + w, y + h],  // right
      [x + w, y + h, x,     y + h],  // bottom
      [x,     y + h, x,     y    ],  // left
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
          g.moveTo(x1 + nx * dist,            y1 + ny * dist);
          g.lineTo(x1 + nx * (dist + segLen), y1 + ny * (dist + segLen));
          g.stroke({ color, alpha, width: lineWidth });
        }
        dist += segLen;
        drawing = !drawing;
      }
    }
  }

  private _clearRect(): void {
    this._graphics?.clear();
  }

  private _rectHasArea(): boolean {
    if (!this._dragStart || !this._dragCurrent) return false;
    return (
      Math.abs(this._dragCurrent.x - this._dragStart.x) > BrushSelectPlugin.DRAG_THRESHOLD ||
      Math.abs(this._dragCurrent.y - this._dragStart.y) > BrushSelectPlugin.DRAG_THRESHOLD
    );
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  /**
   * Compute the elements enclosed by the current brush rect, union them with
   * the existing selection, and apply via {@link ClickSelectPlugin} when
   * available — otherwise via {@link GraphDataPlugin.setState}.
   */
  private _applySelection(): { shapeIds: string[]; connectorIds: string[] } | null {
    const ctx   = this._ctx;
    const graph = this._graph;
    if (!ctx || !graph || !this._dragStart || !this._dragCurrent) return null;

    // Convert screen-space rect corners → world-space.
    const tl = ctx.camera.toWorld(
      Math.min(this._dragStart.x, this._dragCurrent.x),
      Math.min(this._dragStart.y, this._dragCurrent.y),
    );
    const br = ctx.camera.toWorld(
      Math.max(this._dragStart.x, this._dragCurrent.x),
      Math.max(this._dragStart.y, this._dragCurrent.y),
    );
    const wx1 = Math.min(tl.x, br.x);
    const wy1 = Math.min(tl.y, br.y);
    const wx2 = Math.max(tl.x, br.x);
    const wy2 = Math.max(tl.y, br.y);

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
        if (nx >= wx1 && nx <= wx2 && ny >= wy1 && ny <= wy2) {
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
    // brush's own contribution as a best-effort snapshot.
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
