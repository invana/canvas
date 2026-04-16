/**
 * Brush Select Plugin
 *
 * Click and drag on the canvas background to draw a selection rectangle.
 * All nodes (and optionally edges) enclosed by the rectangle are selected.
 *
 * Supports:
 * - Modifier-key trigger (shift, ctrl, alt) or trigger-free (empty array)
 * - Brush selection always unions with current selection (no mode)
 * - Immediate selection while dragging or only on release
 * - Configurable overlay style (fill, stroke, dash)
 * - Delegation to ClickSelectPlugin when available
 *
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'brush-select',
 *       options: {
 *         trigger: ['shift'],
 *         // mode: 'default',
 *         enableElements: ['node', 'edge'],
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import type { ICanvasPointerEvent, CanvasGraphicsSurface } from '../types';
import type { Canvas } from '../core/Canvas';
import type { Viewport } from '../viewport/Viewport';
import type { CanvasPlugin } from './types';
import { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';
import { ClickSelectPlugin, type SelectableElement } from './ClickSelectPlugin';
import { PluginRegistry } from './registry';
// ---------------------------------------------------------------------------
// Types

export type BrushSelectElementType = 'node' | 'edge';

export interface BrushSelectStyle {
  /** Fill color as 0xRRGGBB hex number. Default: 0x1677ff */
  fill?: number;
  /** Fill opacity 0–1. Default: 0.1 */
  fillAlpha?: number;
  /** Stroke color as 0xRRGGBB hex number. Default: 0x1677ff */
  stroke?: number;
  /** Stroke opacity 0–1. Default: 0.8 */
  strokeAlpha?: number;
  /** Stroke line width in pixels. Default: 1 */
  strokeWidth?: number;
  /** Dash pattern [dash, gap]. Set to [] for solid line. Default: [4, 4] */
  strokeDash?: number[];
}

export interface BrushSelectOptions {
  /**
   * Whether the plugin is active.
   * Accepts a boolean or a predicate that receives the raw pointerdown event.
   */
  enable?: boolean | ((event: ICanvasPointerEvent) => boolean);

  /**
   * Element types that can be selected.
   * Default: ['node', 'edge']
   */
  enableElements?: BrushSelectElementType[];

  /**
   * Modifier key(s) that must be held during a drag to activate brush-select.
   * Accepted values (case-insensitive): 'shift', 'control', 'alt', 'meta'.
   * Set to [] to activate on any left-button drag on the canvas background.
   * Default: ['shift']
   */
  trigger?: string[];

  /**
   * When true, elements are selected/deselected live while the rectangle
   * is being drawn. When false (default), selection is applied only on
   * pointer release.
   */
  immediately?: boolean;


  /**
   * State name to apply to selected elements.
   * Must match a state name your style config recognises (e.g. 'selected', 'active').
   * Default: 'selected'
   */
  state?: string;

  /** Visual style for the selection rectangle overlay. */
  style?: BrushSelectStyle;

  /**
   * Clear the selection when clicking on the canvas background without dragging.
   * Default: true
   */
  clearOnBackground?: boolean;

  /**
   * Callback fired after the brush rectangle is released and selection changes.
   * Not fired during intermediate 'immediately' updates.
   */
  onSelect?: (result: { nodes: RendererNodeBase[]; edges: RendererEdgeBase[] }) => void;
}

// ---------------------------------------------------------------------------
// Helper: resolve resolved options with defaults

function resolveOptions(opts: BrushSelectOptions): Required<BrushSelectOptions> {
  return {
    enable:          opts.enable          ?? true,
    enableElements:  opts.enableElements  ?? ['node', 'edge'],
    trigger:         opts.trigger         ?? ['shift'],
    immediately:     opts.immediately     ?? false,
    state:           opts.state           ?? 'selected',
    style:           opts.style           ?? {},
    clearOnBackground: opts.clearOnBackground ?? true,
    onSelect:        opts.onSelect        ?? (() => undefined),
  };
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Plugin

export class BrushSelectPlugin implements CanvasPlugin {
  readonly id = 'brush-select';
  readonly name = 'Brush Select';

  getLayers() {
    return [];
  }

  private _canvas: Canvas | null = null;
  private _viewport: Viewport | null = null;
  private _options: Required<BrushSelectOptions>;

  // Screen-space drawing surface (does not pan/zoom with viewport)
  private _rectGraphics: CanvasGraphicsSurface | null = null;
  private _removeStageSurface: (() => void) | null = null;
  private _unsubscribers: Array<() => void> = [];

  // Minimum drag distance in screen-pixels before brush activates
  private static readonly DRAG_THRESHOLD = 3;

  constructor(options: BrushSelectOptions = {}) {
    this._options = resolveOptions(options);
  }

  /** Update options at runtime. */
  setOptions(options: Partial<BrushSelectOptions>): void {
    this._options = resolveOptions({ ...this._options, ...options });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('BrushSelectPlugin: canvas must have viewport initialised');
    }

    // Create a screen-space overlay via the canvas factory (not viewport — doesn't pan/zoom).
    const surface = canvas.createStageSurface('brush-select-overlay', 9999);
    this._rectGraphics = surface.graphics;
    this._removeStageSurface = surface.remove;

    // Use Canvas event bus for pointer events (background only)
    this._unsubscribers.push(
      canvas.events.on('canvas:pointerdown', (e) => this._onPointerDown(e.originalEvent as ICanvasPointerEvent)),
      canvas.events.on('canvas:pointermove', (e) => this._onPointerMove(e.originalEvent as ICanvasPointerEvent)),
      canvas.events.on('canvas:pointerup', () => this._onPointerUp()),
      canvas.events.on('canvas:pointerupoutside', () => this._onPointerUp()),
      canvas.events.on('canvas:clicked', () => {
        if (!this._options.clearOnBackground || this._dragActive) return;
        this._clearSelection();
      }),
    );
  }

  destroy(): void {
    for (const unsub of this._unsubscribers) unsub();
    this._unsubscribers = [];
    this._removeStageSurface?.();
    this._removeStageSurface = null;
    this._rectGraphics = null;
    this._dragActive = false;
    this._dragStart = null;
    this._dragCurrent = null;
    this._canvas = null;
    this._viewport = null;
  }

  // ---------------------------------------------------------------------------
  // Event handlers

  private _dragActive = false;
  private _dragStart: { x: number; y: number } | null = null;
  private _dragCurrent: { x: number; y: number } | null = null;

  private _onPointerDown = (event: ICanvasPointerEvent): void => {
    // Reset all drag state unconditionally — no stale state from previous drags
    this._clearRect();
    this._dragActive = false;
    this._dragStart = null;
    this._dragCurrent = null;

    // Only left-button on the canvas background (not on a node/edge)
    if (event.button !== 0) return;

    // Check enable guard
    const { enable } = this._options;
    const isEnabled = typeof enable === 'function' ? enable(event) : enable;
    if (!isEnabled) return;

    // Check trigger modifiers
    if (!this._triggerActive(event)) return;

    // Pause the viewport's built-in drag plugin so canvas doesn't pan
    this._viewport!.pauseDrag();

    this._dragActive = true;
    this._dragStart = { x: event.global.x, y: event.global.y };
    this._dragCurrent = { x: event.global.x, y: event.global.y };
    console.log('[BrushSelect] brush started', this._dragStart);
  };

  private _onPointerMove = (event: ICanvasPointerEvent): void => {
    if (!this._dragActive || !this._dragStart) return;

    // If the mouse button was released outside the canvas (missed pointerup), clean up
    const nativeEvent = (event.nativeEvent ?? event) as PointerEvent;
    if (nativeEvent.buttons === 0) {
      this._onPointerUp();
      return;
    }

    const dx = event.global.x - this._dragStart.x;
    const dy = event.global.y - this._dragStart.y;

    // Don't start drawing until threshold exceeded
    if (
      Math.sqrt(dx * dx + dy * dy) < BrushSelectPlugin.DRAG_THRESHOLD &&
      this._dragCurrent &&
      this._dragCurrent.x === this._dragStart.x &&
      this._dragCurrent.y === this._dragStart.y
    ) {
      return;
    }

    this._dragCurrent = { x: event.global.x, y: event.global.y };
    this._drawRect();

    if (this._options.immediately) {
      this._applySelection();
    }
  };

  private _onPointerUp = (): void => {
    if (!this._dragActive || !this._dragStart || !this._dragCurrent) return;

    // Hide the overlay
    this._clearRect();

    // Apply selection on release (unless immediately already handled it)
    const hasArea = this._rectHasArea();
    if (hasArea) {
      console.log('[BrushSelect] brush selection released');
      const result = this._applySelection();
      if (result) {
        this._options.onSelect(result);
      }
    } else if (this._options.clearOnBackground) {
      console.log('[BrushSelect] pointerup with no drag, clearing selection');
      this._clearSelection();
    }

    // Always resume viewport drag
    this._viewport?.resumeDrag();
    this._dragActive = false;
    this._dragStart = null;
    this._dragCurrent = null;
  };

  /**
   * Fired on any background tap (directly on viewport, replicating the same check
   * Canvas.ts uses to emit canvas:clicked). Handles clearOnBackground reliably
   * without depending on canvas:clicked — which can be blocked if the overlay
   * Container intercepts the pointertap event.
   */
  // No longer needed: background tap handler is replaced by canvas:clicked event

  /** Shared helper: clear all selection via ClickSelectPlugin or direct fallback. */
  private _clearSelection(): void {
    if (!this._canvas) return;
    const clickSelect = this._canvas.getPlugin<ClickSelectPlugin>('click-select');
    if (clickSelect) {
      clickSelect.clearSelection();
    } else {
      // Fallback: directly remove state from all elements
      const graphPlugin = this._canvas.getPlugin<any>('graph-data');
      if (!graphPlugin) return;
      const all = [
        ...graphPlugin.getRenderedNodes(),
        ...graphPlugin.getRenderedEdges(),
      ];
      for (const el of all) {
        el.setState(this._options.state, false);
      }
      this._canvas.events.emit('selection:changed', { nodes: [], edges: [] });
    }
  }

  // ---------------------------------------------------------------------------
  // Drawing

  private _drawRect(): void {
    if (!this._rectGraphics || !this._dragStart || !this._dragCurrent) return;

    const { x: startX, y: startY } = this._dragStart;
    const { x: currentX, y: currentY } = this._dragCurrent;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    const style = this._options.style;
    const fill        = style.fill        ?? 0x1677ff;
    const fillAlpha   = style.fillAlpha   ?? 0.1;
    const stroke      = style.stroke      ?? 0x1677ff;
    const strokeAlpha = style.strokeAlpha ?? 0.8;
    const strokeWidth = style.strokeWidth ?? 1;
    const strokeDash  = style.strokeDash  ?? [4, 4];

    this._rectGraphics.clear();

    // PixiJS v8 API: shape → fill() → stroke()
    const g = this._rectGraphics;
    g.rect(x, y, w, h);
    g.fill({ color: fill, alpha: fillAlpha });

    if (strokeDash.length >= 2) {
      g.setStrokeStyle({
        color: stroke,
        alpha: strokeAlpha,
        width: strokeWidth,
        cap: 'butt',
        join: 'miter',
        pixelLine: false,
      });
      // PixiJS v8 doesn't have built-in dash; we manually draw a dashed rect border
      this._drawDashedRect(g, x, y, w, h, strokeDash, stroke, strokeAlpha, strokeWidth);
    } else {
      g.rect(x, y, w, h);
      g.stroke({ color: stroke, alpha: strokeAlpha, width: strokeWidth });
    }
  }

  /** Manually draw a dashed rectangle outline using individual dashed line segments. */
  private _drawDashedRect(
    g: CanvasGraphicsSurface,
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

    // Draw four sides as dashed lines
    const sides: Array<[number, number, number, number]> = [
      [x,     y,     x + w, y    ],  // top
      [x + w, y,     x + w, y + h],  // right
      [x + w, y + h, x,     y + h],  // bottom
      [x,     y + h, x,     y    ],  // left
    ];

    for (const [x1, y1, x2, y2] of sides) {
      const totalLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const nx = (x2 - x1) / totalLen;
      const ny = (y2 - y1) / totalLen;
      let dist = 0;
      let drawing = true;

      while (dist < totalLen) {
        const segLen = Math.min(drawing ? dashLen : gapLen, totalLen - dist);
        if (drawing) {
          const sx = x1 + nx * dist;
          const sy = y1 + ny * dist;
          const ex = x1 + nx * (dist + segLen);
          const ey = y1 + ny * (dist + segLen);
          g.moveTo(sx, sy);
          g.lineTo(ex, ey);
          g.stroke({ color, alpha, width: lineWidth });
        }
        dist += segLen;
        drawing = !drawing;
      }
    }
  }

  private _clearRect(): void {
    this._rectGraphics?.clear();
  }

  private _rectHasArea(): boolean {
    if (!this._dragStart || !this._dragCurrent) return false;
    return (
      Math.abs(this._dragCurrent.x - this._dragStart.x) > BrushSelectPlugin.DRAG_THRESHOLD ||
      Math.abs(this._dragCurrent.y - this._dragStart.y) > BrushSelectPlugin.DRAG_THRESHOLD
    );
  }

  // ---------------------------------------------------------------------------
  // Selection logic

  /**
   * Compute which elements fall inside the current brush rect, apply the
   * configured selection mode, and return the final selected sets.
   * Returns null if the plugin state is incomplete.
   */
  private _applySelection(): { nodes: RendererNodeBase[]; edges: RendererEdgeBase[] } | null {
    if (!this._dragStart || !this._dragCurrent || !this._canvas || !this._viewport) return null;

    const graphPlugin = this._canvas.getPlugin<any>('graph-data');
    if (!graphPlugin) return null;

    const { x: startX, y: startY } = this._dragStart;
    const { x: currentX, y: currentY } = this._dragCurrent;

    // Convert screen rect corners to world coordinates
    const topLeft     = this._viewport.toWorld(Math.min(startX, currentX), Math.min(startY, currentY));
    const bottomRight = this._viewport.toWorld(Math.max(startX, currentX), Math.max(startY, currentY));

    const wx1 = topLeft.x;
    const wy1 = topLeft.y;
    const wx2 = bottomRight.x;
    const wy2 = bottomRight.y;

    const { enableElements, state } = this._options;
    const wantNodes = enableElements.includes('node');
    const wantEdges = enableElements.includes('edge');

    // --- Hit-test nodes ---
    const enclosedNodes = new Set<RendererNodeBase>();
    if (wantNodes) {
      for (const node of graphPlugin.getRenderedNodes() as RendererNodeBase[]) {
        if (node.x >= wx1 && node.x <= wx2 && node.y >= wy1 && node.y <= wy2) {
          enclosedNodes.add(node);
        }
      }
    }

    // --- Hit-test edges (both endpoints must be enclosed) ---
    const enclosedEdges = new Set<RendererEdgeBase>();
    if (wantEdges) {
      const edgeDataMap: Map<string, { source: string; target: string }> = graphPlugin.getEdgeData();
      const nodeIds = new Set<string>();
      for (const n of enclosedNodes) nodeIds.add(n.id);

      for (const edge of graphPlugin.getRenderedEdges() as RendererEdgeBase[]) {
        const edgeData = edgeDataMap.get(edge.id);
        if (!edgeData) continue;
        if (nodeIds.has(edgeData.source) && nodeIds.has(edgeData.target)) {
          enclosedEdges.add(edge);
        }
      }
    }

    // --- Always union selection with enclosed elements ---
    const clickSelect = this._canvas.getPlugin<ClickSelectPlugin>('click-select');
    if (clickSelect) {
      // Union: add to current selection
      const prev = new Set(clickSelect.getSelected());
      for (const n of enclosedNodes) prev.add(n);
      for (const e of enclosedEdges) prev.add(e);
      console.log('[BrushSelect] union selection, new selected:', Array.from(prev).map(e => e.id));
      clickSelect.selectMultiple(Array.from(prev));
      return {
        nodes: Array.from(prev).filter(e => e instanceof RendererNodeBase) as RendererNodeBase[],
        edges: Array.from(prev).filter(e => e instanceof RendererEdgeBase) as RendererEdgeBase[],
      };
    } else {
      // Fallback: union selection
      const all = [
        ...graphPlugin.getRenderedNodes(),
        ...graphPlugin.getRenderedEdges(),
      ];
      // Get current selection
      const selected = new Set<SelectableElement>();
      for (const el of all) {
        if ((el as any).getState && (el as any).getState(state)) {
          selected.add(el);
        }
      }
      for (const n of enclosedNodes) selected.add(n);
      for (const e of enclosedEdges) selected.add(e);
      console.log('[BrushSelect] fallback union selection, new selected:', Array.from(selected).map(e => e.id));
      // Clear all
      for (const el of all) {
        el.setState(state, false);
      }
      // Apply new
      for (const el of selected) {
        el.setState(state, true);
      }
      // Emit aggregate event
      this._canvas.events.emit('selection:changed', {
        nodes: Array.from(selected).filter(e => e instanceof RendererNodeBase) as RendererNodeBase[],
        edges: Array.from(selected).filter(e => e instanceof RendererEdgeBase) as RendererEdgeBase[],
      });
      return {
        nodes: Array.from(selected).filter(e => e instanceof RendererNodeBase) as RendererNodeBase[],
        edges: Array.from(selected).filter(e => e instanceof RendererEdgeBase) as RendererEdgeBase[],
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Modifier key helpers

  private _triggerActive(event: ICanvasPointerEvent): boolean {
    const { trigger } = this._options;
    // Empty trigger = activate on any drag (no modifier required)
    if (trigger.length === 0) return true;

    const src = (event.nativeEvent as PointerEvent | MouseEvent | undefined) ?? event;
    const active = new Set<string>();
    if (src.shiftKey) active.add('shift');
    if (src.ctrlKey)  active.add('control');
    if (src.altKey)   active.add('alt');
    if (src.metaKey)  active.add('meta');

    return trigger.some(k => active.has(k.toLowerCase()));
  }
}

// Self-register so the plugin can be used via string key in Canvas options
PluginRegistry.register('brush-select', BrushSelectPlugin);
