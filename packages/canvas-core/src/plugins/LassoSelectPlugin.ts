/**
 * Lasso Select Plugin
 *
 * Click and drag on the canvas background to draw a freeform lasso polygon.
 * All nodes (and optionally edges) enclosed by the lasso are selected using
 * a point-in-polygon (ray casting) algorithm.
 *
 * Supports:
 * - Modifier-key trigger (shift, ctrl, alt) or trigger-free (empty array)
 * - Lasso selection always unions with current selection
 * - Immediate selection while drawing or only on release
 * - Configurable overlay style (fill, stroke, dash)
 * - Delegation to ClickSelectPlugin when available
 *
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'lasso-select',
 *       options: {
 *         trigger: ['shift'],
 *         enableElements: ['node', 'edge'],
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import type { CanvasGraphicsSurface } from '../types';
import type { Canvas } from '../core/Canvas';
import type { Viewport } from '../viewport/Viewport';
import type { CanvasPlugin, LayerGroupConfig } from './types';
import type { CanvasBgPointerEvent } from '../types';
import { drawPolygonFromPoints } from '../primitives/shapes';
import type { ShapeStyle } from '../primitives/shapes';
import { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';
import { ClickSelectPlugin, type SelectableElement } from './ClickSelectPlugin';
import { PluginRegistry } from './registry';

// ---------------------------------------------------------------------------
// Types

export type LassoSelectElementType = 'node' | 'edge';

export interface LassoSelectStyle {
  /** Fill color (CSS hex string). Default: '#1677ff' */
  fill?: string;
  /** Fill opacity 0–1. Default: 0.1 */
  fillAlpha?: number;
  /** Stroke color (CSS hex string). Default: '#1677ff' */
  stroke?: string;
  /** Stroke opacity 0–1. Default: 0.8 */
  strokeAlpha?: number;
  /** Stroke line width in pixels. Default: 1 */
  strokeWidth?: number;
  /** Dash pattern [dash, gap]. Set to [] for solid line. Default: [4, 4] */
  strokeDash?: number[];
}

export interface LassoSelectOptions {
  /**
   * Whether the plugin is active.
   * Accepts a boolean or a predicate that receives the native pointer event.
   */
  enable?: boolean | ((event: PointerEvent) => boolean);

  /**
   * Element types that can be selected.
   * Default: ['node', 'edge']
   */
  enableElements?: LassoSelectElementType[];

  /**
   * Modifier key(s) that must be held during a drag to activate lasso-select.
   * Accepted values (case-insensitive): 'shift', 'control', 'alt', 'meta'.
   * Set to [] to activate on any left-button drag on the canvas background.
   * Default: ['shift']
   */
  trigger?: string[];

  /**
   * When true, elements are selected live while the lasso is being drawn.
   * When false (default), selection is applied only on pointer release.
   */
  immediately?: boolean;

  /**
   * State name to apply to selected elements.
   * Default: 'selected'
   */
  state?: string;

  /** Visual style for the lasso overlay. */
  style?: LassoSelectStyle;

  /**
   * Clear the selection when clicking on the canvas background without dragging.
   * Default: true
   */
  clearOnBackground?: boolean;

  /**
   * Callback fired after the lasso is released and selection changes.
   * Not fired during intermediate 'immediately' updates.
   */
  onSelect?: (result: { nodes: RendererNodeBase[]; edges: RendererEdgeBase[] }) => void;
}

// ---------------------------------------------------------------------------
// Helper: resolve options with defaults

function resolveOptions(opts: LassoSelectOptions): Required<LassoSelectOptions> {
  return {
    enable:            opts.enable            ?? true,
    enableElements:    opts.enableElements    ?? ['node', 'edge'],
    trigger:           opts.trigger           ?? ['shift'],
    immediately:       opts.immediately       ?? false,
    state:             opts.state             ?? 'selected',
    style:             opts.style             ?? {},
    clearOnBackground: opts.clearOnBackground ?? true,
    onSelect:          opts.onSelect          ?? (() => undefined),
  };
}

// ---------------------------------------------------------------------------
// Point-in-polygon (ray casting algorithm)

function pointInPolygon(
  px: number,
  py: number,
  polygon: { x: number; y: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x;
    const yi = polygon[i]!.y;
    const xj = polygon[j]!.x;
    const yj = polygon[j]!.y;
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ---------------------------------------------------------------------------
// Plugin

export class LassoSelectPlugin implements CanvasPlugin {
  readonly id = 'lasso-select';
  readonly name = 'Lasso Select';

  /**
   * Declare the overlay layer so LayerManager owns and manages it.
   * zIndex 9999 ensures the lasso renders above all graph content.
   */
  getLayers(): LayerGroupConfig[] {
    return [
      {
        id: 'lasso-select',
        zIndex: 9999,
        layers: [{ id: 'overlay', type: 'custom' }],
      },
    ];
  }

  private _canvas: Canvas | null = null;
  private _viewport: Viewport | null = null;
  private _options: Required<LassoSelectOptions>;

  // Drawing surface — created once, reused every frame.
  // Passed to primitive functions; never drawn to directly in this file.
  private _graphics: CanvasGraphicsSurface | null = null;

  // HTMLCanvasElement for getBoundingClientRect() in native pointer handlers
  private _canvasEl: HTMLCanvasElement | null = null;

  // Cleanup functions returned by canvas.events.on()
  private _unsubscribers: Array<() => void> = [];

  /** Minimum screen-space distance (px) between consecutive lasso points to avoid over-sampling */
  private static readonly MIN_POINT_DISTANCE = 5;

  constructor(options: LassoSelectOptions = {}) {
    this._options = resolveOptions(options);
  }

  /** Update options at runtime. */
  setOptions(options: Partial<LassoSelectOptions>): void {
    this._options = resolveOptions({ ...this._options, ...options });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('LassoSelectPlugin: canvas must have viewport initialised');
    }

    // Retrieve the overlay layer registered via getLayers() and managed by LayerManager.
    // The layer lives in viewport (world) space — lasso points are converted to world
    // coordinates before drawing so the overlay stays aligned with graph elements.
    const overlayLayer = canvas.layerManager.getLayer('lasso-select', 'overlay');
    if (!overlayLayer) {
      throw new Error('LassoSelectPlugin: overlay layer not found');
    }

    // Disable pointer interactivity so events pass through to nodes/edges.
    overlayLayer.interactive = false;
    // PixiJS v8: setting interactive=false only sets eventMode='auto', not 'none'.
    // 'auto' still participates in hit-testing and intercepts clicks.
    // Must explicitly set 'none' to make the layer fully transparent to pointer events.
    overlayLayer.container.eventMode = 'none';

    // Graphics surface created via the layer — keeps pixi.js out of this file at runtime.
    this._graphics = overlayLayer.createGraphicsSurface('lasso-select-graphics');

    this._canvasEl = canvas.getCanvasElement();

    this._unsubscribers.push(
      canvas.events.on('canvas:pointerdown', (e) => this._onPointerDown(e)),
      // canvas:pointermove / canvas:pointerup are NOT used here because Canvas.ts
      // filters them out when the pointer is over a node/edge (emitBgPointer guard).
      // Native window listeners are attached on drag-start instead (see _onPointerDown).
      canvas.events.on('canvas:clicked', () => {
        if (!this._options.clearOnBackground || this._dragActive) return;
        this._clearSelection();
      }),
    );
  }

  destroy(): void {
    for (const unsub of this._unsubscribers) unsub();
    this._unsubscribers = [];

    // Remove any dangling native window listeners from an in-progress drag
    window.removeEventListener('pointermove', this._nativePointerMove);
    window.removeEventListener('pointerup', this._nativePointerUp);

    // The layer (and its contents) is unregistered by Canvas when the plugin is removed.
    this._graphics = null;
    this._canvasEl = null;

    this._dragActive = false;
    this._lassoPoints = [];
    this._canvas = null;
    this._viewport = null;
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // Points are stored in world coordinates (from e.position.world), so no
  // screenToWorld conversion is needed at draw or hit-test time.

  private _dragActive = false;
  private _lassoPoints: { x: number; y: number }[] = [];

  private _onPointerDown(e: CanvasBgPointerEvent): void {
    this._clearLasso();
    this._dragActive = false;
    this._lassoPoints = [];

    const native = e.originalEvent as PointerEvent;
    if (native.button !== 0) return;

    const { enable } = this._options;
    const isEnabled = typeof enable === 'function' ? enable(native) : enable;
    if (!isEnabled) return;

    if (!this._triggerActive(native)) return;

    // Pause viewport's built-in drag so canvas doesn't pan while lasso-ing
    this._viewport!.pauseDrag();

    this._dragActive = true;
    this._lassoPoints = [{ x: e.position.world.x, y: e.position.world.y }];

    // Use native window listeners for move/up so they fire even when the pointer
    // moves over nodes/edges (canvas:pointermove / canvas:pointerup are filtered
    // by Canvas.ts's emitBgPointer guard when e.target !== viewport).
    window.addEventListener('pointermove', this._nativePointerMove);
    window.addEventListener('pointerup', this._nativePointerUp);
  }

  // Native window pointermove — fires even when pointer is over nodes/edges.
  // Converts client coordinates to world coordinates using viewport.toWorld().
  private _nativePointerMove = (e: PointerEvent): void => {
    if (!this._dragActive || this._lassoPoints.length === 0) return;

    // If mouse button was released outside the window (missed pointerup), clean up
    if (e.buttons === 0) {
      this._nativePointerUp();
      return;
    }

    if (!this._viewport || !this._canvasEl) return;

    const rect = this._canvasEl.getBoundingClientRect();
    const world = this._viewport.toWorld(e.clientX - rect.left, e.clientY - rect.top);
    const newPt = { x: world.x, y: world.y };

    const last = this._lassoPoints[this._lassoPoints.length - 1]!;
    const dx = newPt.x - last.x;
    const dy = newPt.y - last.y;

    // Downsample: only add point if far enough from the previous one (in world units)
    if (Math.sqrt(dx * dx + dy * dy) < LassoSelectPlugin.MIN_POINT_DISTANCE) return;

    this._lassoPoints.push(newPt);
    this._drawLasso();

    if (this._options.immediately) {
      this._applySelection();
    }
  };

  private _nativePointerUp = (): void => {
    window.removeEventListener('pointermove', this._nativePointerMove);
    window.removeEventListener('pointerup', this._nativePointerUp);
    this._onPointerUp();
  };

  private _onPointerUp(): void {
    if (!this._dragActive || this._lassoPoints.length === 0) return;

    this._clearLasso();

    // Need at least 3 points to form a polygon with area
    const hasArea = this._lassoPoints.length >= 3;
    if (hasArea) {
      const result = this._applySelection();
      if (result) {
        this._options.onSelect(result);
      }
    } else if (this._options.clearOnBackground) {
      this._clearSelection();
    }

    this._viewport?.resumeDrag();
    this._dragActive = false;
    this._lassoPoints = [];
  }

  // ---------------------------------------------------------------------------
  // Selection helpers

  private _clearSelection(): void {
    if (!this._canvas) return;
    const clickSelect = this._canvas.getPlugin<ClickSelectPlugin>('click-select');
    if (clickSelect) {
      clickSelect.clearSelection();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const graphPlugin = this._canvas.getPlugin<any>('graph-data');
      if (!graphPlugin) return;
      const all: Array<RendererNodeBase | RendererEdgeBase> = [
        ...graphPlugin.getRenderedNodes(),
        ...graphPlugin.getRenderedEdges(),
      ];
      for (const el of all) el.setState(this._options.state, false);
      this._canvas.events.emit('selection:changed', { nodes: [], edges: [] });
    }
  }

  // ---------------------------------------------------------------------------
  // Drawing
  //
  // Lasso points are stored directly in world coordinates (captured from
  // e.position.world), so no coordinate conversion is needed here.

  private _buildShapeStyle(): ShapeStyle {
    const s = this._options.style;
    const dashPattern = (s.strokeDash ?? [4, 4]);
    return {
      fill:              s.fill        ?? '#1677ff',
      fillAlpha:         s.fillAlpha   ?? 0.1,
      stroke:            s.stroke      ?? '#1677ff',
      strokeAlpha:       s.strokeAlpha ?? 0.8,
      strokeWidth:       s.strokeWidth ?? 1,
      strokeStyle:       dashPattern.length >= 2 ? 'dashed' : 'solid',
      strokeDashPattern: dashPattern.length >= 2 ? dashPattern : undefined,
    };
  }

  private _drawLasso(): void {
    if (!this._graphics || this._lassoPoints.length < 2) return;

    const g = this._graphics;
    g.clear();

    // Points are already in world coordinates — draw directly on the viewport layer.
    const flatPts = this._lassoPoints.flatMap(pt => [pt.x, pt.y]);

    drawPolygonFromPoints(g, flatPts, this._buildShapeStyle());
  }

  private _clearLasso(): void {
    this._graphics?.clear();
  }

  // ---------------------------------------------------------------------------
  // Selection logic

  private _applySelection(): { nodes: RendererNodeBase[]; edges: RendererEdgeBase[] } | null {
    if (this._lassoPoints.length < 3 || !this._canvas || !this._viewport) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphPlugin = this._canvas.getPlugin<any>('graph-data');
    if (!graphPlugin) return null;

    // Points are already in world coordinates — use directly for hit-testing.
    const worldPolygon = this._lassoPoints;

    const { enableElements, state } = this._options;
    const wantNodes = enableElements.includes('node');
    const wantEdges = enableElements.includes('edge');

    // Hit-test nodes: point-in-polygon
    const enclosedNodes = new Set<RendererNodeBase>();
    if (wantNodes) {
      for (const node of graphPlugin.getRenderedNodes()) {
        if (pointInPolygon(node.x, node.y, worldPolygon)) {
          enclosedNodes.add(node);
        }
      }
    }

    // Hit-test edges: both source and target must be enclosed
    const enclosedEdges = new Set<RendererEdgeBase>();
    if (wantEdges) {
      const edgeDataMap = graphPlugin.getEdgeData();
      const nodeIds = new Set<string>();
      for (const n of enclosedNodes) nodeIds.add(n.id);

      for (const edge of graphPlugin.getRenderedEdges()) {
        const edgeData = edgeDataMap.get(edge.id);
        if (!edgeData) continue;
        // edgeData.source / target may be string | Point — only string IDs are valid here
        const sourceId = typeof edgeData.source === 'string' ? edgeData.source : '';
        const targetId = typeof edgeData.target === 'string' ? edgeData.target : '';
        if (sourceId && targetId && nodeIds.has(sourceId) && nodeIds.has(targetId)) {
          enclosedEdges.add(edge);
        }
      }
    }

    // Union with current selection
    const clickSelect = this._canvas.getPlugin<ClickSelectPlugin>('click-select');
    if (clickSelect) {
      const prev = new Set<SelectableElement>(clickSelect.getSelected());
      for (const n of enclosedNodes) prev.add(n);
      for (const e of enclosedEdges) prev.add(e);
      clickSelect.selectMultiple(Array.from(prev));
      return {
        nodes: Array.from(prev).filter((e): e is RendererNodeBase => e instanceof RendererNodeBase),
        edges: Array.from(prev).filter((e): e is RendererEdgeBase => e instanceof RendererEdgeBase),
      };
    }

    // Fallback: apply state directly
    const all: SelectableElement[] = [
      ...graphPlugin.getRenderedNodes(),
      ...graphPlugin.getRenderedEdges(),
    ];
    const selected = new Set<SelectableElement>();
    for (const el of all) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((el as any).getState && (el as any).getState(state)) selected.add(el);
    }
    for (const n of enclosedNodes) selected.add(n);
    for (const e of enclosedEdges) selected.add(e);

    for (const el of all) el.setState(state, false);
    for (const el of selected) el.setState(state, true);

    const resultNodes = Array.from(selected).filter((e): e is RendererNodeBase => e instanceof RendererNodeBase);
    const resultEdges = Array.from(selected).filter((e): e is RendererEdgeBase => e instanceof RendererEdgeBase);

    this._canvas.events.emit('selection:changed', { nodes: resultNodes, edges: resultEdges });

    return { nodes: resultNodes, edges: resultEdges };
  }

  // ---------------------------------------------------------------------------
  // Modifier key helpers

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

// Self-register so the plugin can be used via string key in Canvas options
PluginRegistry.register('lasso-select', LassoSelectPlugin);
