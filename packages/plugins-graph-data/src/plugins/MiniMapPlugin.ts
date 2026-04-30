// ── MiniMapPlugin ─────────────────────────────────────────────────────────────
// Bird's-eye overview of the graph with a draggable viewport indicator.
//
// The minimap renders all graph-data nodes/edges into its own PixiJS
// Application, mounted as an absolutely-positioned overlay on the canvas's
// parent element. Clicking jumps the main camera; dragging the indicator
// pans the main camera continuously.
//
// World bounds are derived from current node positions (cached, refreshed via
// `refresh()`) and unioned with the camera's visible bounds every frame so
// the viewport indicator is always visible inside the minimap.
//
// This plugin is **opt-in** — register it explicitly when a minimap is
// desired. It depends on a registered GraphDataPlugin to read nodes/edges.

import { Application, Graphics } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { CanvasPlugin, PluginContext } from '@invana/canvas';
import type { CameraAPI } from '@invana/canvas';
import type { GraphDataPlugin } from '../GraphDataPlugin.js';

/** Anchor corner inside the canvas's parent element. */
export type MiniMapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Constructor / `setOptions` payload for {@link MiniMapPlugin}. */
export interface MiniMapPluginOptions {
  /** Plugin id override. Default: `'minimap'`. */
  key?: string;
  /**
   * Id of the {@link GraphDataPlugin} this minimap reads from.
   * Default: `'graph-data'`.
   */
  graphDataId?: string;

  /** Minimap width in pixels. Default: `200`. */
  width?: number;
  /** Minimap height in pixels. Default: `150`. */
  height?: number;
  /** Background color of the minimap (hex number). Default: `0x1a1a2e`. */
  backgroundColor?: number;

  /** Viewport indicator fill color. Default: `0x4a90d9`. */
  viewportFill?: number;
  /** Viewport indicator stroke color. Default: `0x2a70b9`. */
  viewportStroke?: number;
  /** Viewport indicator fill alpha (0–1). Default: `0.3`. */
  viewportFillAlpha?: number;
  /** Viewport indicator stroke width in pixels. Default: `2`. */
  viewportStrokeWidth?: number;

  /** World-space padding around content bounds. Default: `20`. */
  padding?: number;
  /** Whether the user can drag/click the minimap to pan the main camera. Default: `true`. */
  enableDrag?: boolean;
  /** Anchor corner. Default: `'bottom-right'`. */
  position?: MiniMapPosition;
}

const DEFAULTS: Required<Omit<MiniMapPluginOptions, 'key' | 'graphDataId'>> = {
  width:               200,
  height:              150,
  backgroundColor:     0x1a1a2e,
  viewportFill:        0x4a90d9,
  viewportStroke:      0x2a70b9,
  viewportFillAlpha:   0.3,
  viewportStrokeWidth: 2,
  padding:             20,
  enableDrag:          true,
  position:            'bottom-right',
};

interface Bounds { x: number; y: number; width: number; height: number; }

/**
 * Bird's-eye overview of the graph with a draggable viewport indicator.
 *
 * @example
 * ```ts
 * const minimap = new MiniMapPlugin({
 *   width: 280, height: 180, position: 'bottom-right',
 * });
 * await canvas.plugins.register(minimap);
 * minimap.refresh(); // call after layout settles or data changes
 * ```
 */
export class MiniMapPlugin implements CanvasPlugin {
  readonly id: string;
  private readonly _graphDataId: string;

  private _options: Required<Omit<MiniMapPluginOptions, 'key' | 'graphDataId'>>;
  private _ctx: PluginContext | null = null;
  private _camera: CameraAPI | null = null;

  private _container: HTMLDivElement | null = null;
  private _app: Application | null = null;
  private _worldGfx: Graphics | null = null;
  private _viewportGfx: Graphics | null = null;

  /** Cached bounds derived from node positions. Recomputed on `refresh()`. */
  private _nodeBounds: Bounds = { x: -500, y: -500, width: 1000, height: 1000 };

  /** Per-frame projection scale + offset (world → minimap). */
  private _scale = 1;
  private _offsetX = 0;
  private _offsetY = 0;

  private _isDragging = false;
  private _dragOffset = { x: 0, y: 0 };

  constructor(options: MiniMapPluginOptions = {}) {
    const { key, graphDataId, ...rest } = options;
    this.id           = key         ?? 'minimap';
    this._graphDataId = graphDataId ?? 'graph-data';
    this._options     = { ...DEFAULTS, ...rest };
  }

  // ── CanvasPlugin lifecycle ────────────────────────────────────────────────

  async register(ctx: PluginContext): Promise<void> {
    this._ctx = ctx;
    this._camera = ctx.camera;

    this._mountContainer(ctx);
    await this._initApp();

    this._worldGfx    = new Graphics();
    this._viewportGfx = new Graphics();
    this._app!.stage.addChild(this._worldGfx);
    this._app!.stage.addChild(this._viewportGfx);

    if (this._options.enableDrag) this._wireInteractions();

    this._recomputeNodeBounds();
    this._app!.ticker.add(this._render, this);
  }

  destroy(): void {
    if (this._app) {
      this._app.ticker.remove(this._render, this);
      this._app.destroy(true, { children: true });
      this._app = null;
    }
    this._container?.remove();
    this._container = null;
    this._worldGfx = null;
    this._viewportGfx = null;
    this._camera = null;
    this._ctx = null;
  }

  enable(): void { this.show(); }
  disable(): void { this.hide(); }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Recompute world bounds from current node positions.
   * Call after adding/removing nodes or once a layout has settled.
   */
  refresh(): void {
    this._recomputeNodeBounds();
  }

  /** Show the minimap overlay. */
  show(): void {
    if (this._container) this._container.style.display = 'block';
  }

  /** Hide the minimap overlay without destroying it. */
  hide(): void {
    if (this._container) this._container.style.display = 'none';
  }

  /**
   * Update options at runtime. Re-applies sizing, position, and the next
   * frame picks up colors/padding changes automatically.
   */
  setOptions(partial: Partial<MiniMapPluginOptions>): void {
    const { key: _k, graphDataId: _g, ...rest } = partial;
    this._options = { ...this._options, ...rest };
    this._applyContainerStyles();
    this._applyAppSize();
  }

  // ── Mount / DOM ───────────────────────────────────────────────────────────

  private _mountContainer(ctx: PluginContext): void {
    const parent = ctx.canvasElement.parentElement;
    if (!parent) throw new Error('[MiniMapPlugin] canvas element has no parent to mount onto.');

    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const div = document.createElement('div');
    div.dataset['minimapPlugin'] = this.id;
    this._container = div;
    this._applyContainerStyles();
    parent.appendChild(div);
  }

  private _applyContainerStyles(): void {
    if (!this._container) return;
    const margin = '10px';
    const pos: Record<MiniMapPosition, string> = {
      'top-left':     `top:${margin}; left:${margin};`,
      'top-right':    `top:${margin}; right:${margin};`,
      'bottom-left':  `bottom:${margin}; left:${margin};`,
      'bottom-right': `bottom:${margin}; right:${margin};`,
    };
    this._container.style.cssText = [
      'position:absolute;',
      pos[this._options.position],
      'border:2px solid #333;',
      'border-radius:4px;',
      'overflow:hidden;',
      'box-shadow:0 2px 8px rgba(0,0,0,0.3);',
      'z-index:1000;',
      'cursor:pointer;',
      'user-select:none;',
    ].join('');
  }

  // ── PixiJS app ────────────────────────────────────────────────────────────

  private async _initApp(): Promise<void> {
    const { width, height, backgroundColor } = this._options;
    const app = new Application();
    await app.init({
      width,
      height,
      backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    const cnv = app.canvas as HTMLCanvasElement;
    cnv.style.width  = `${width}px`;
    cnv.style.height = `${height}px`;
    this._container!.appendChild(cnv);
    this._app = app;
  }

  private _applyAppSize(): void {
    if (!this._app) return;
    const { width, height, backgroundColor } = this._options;
    this._app.renderer.resize(width, height);
    this._app.renderer.background.color = backgroundColor;
    const cnv = this._app.canvas as HTMLCanvasElement;
    cnv.style.width  = `${width}px`;
    cnv.style.height = `${height}px`;
  }

  // ── Interactions ──────────────────────────────────────────────────────────

  private _wireInteractions(): void {
    const stage = this._app!.stage;
    stage.eventMode = 'static';
    stage.hitArea = { contains: () => true };
    stage.on('pointerdown',     this._onPointerDown);
    stage.on('pointermove',     this._onPointerMove);
    stage.on('pointerup',       this._onPointerUp);
    stage.on('pointerupoutside', this._onPointerUp);
  }

  private _onPointerDown = (e: FederatedPointerEvent): void => {
    if (!this._camera || !this._app) return;
    const local = e.getLocalPosition(this._app.stage);
    const world = this._minimapToWorld(local.x, local.y);

    const visible = this._camera.getBounds();
    const cx = visible.x + visible.width  / 2;
    const cy = visible.y + visible.height / 2;

    const inside =
      world.x >= visible.x && world.x <= visible.x + visible.width &&
      world.y >= visible.y && world.y <= visible.y + visible.height;

    this._isDragging = true;
    if (inside) {
      this._dragOffset = { x: world.x - cx, y: world.y - cy };
    } else {
      this._dragOffset = { x: 0, y: 0 };
      this._camera.panTo(world.x, world.y);
    }
  };

  private _onPointerMove = (e: FederatedPointerEvent): void => {
    if (!this._isDragging || !this._camera || !this._app) return;
    const local = e.getLocalPosition(this._app.stage);
    const world = this._minimapToWorld(local.x, local.y);
    this._camera.panTo(world.x - this._dragOffset.x, world.y - this._dragOffset.y);
  };

  private _onPointerUp = (): void => {
    this._isDragging = false;
  };

  // ── Bounds & projection ───────────────────────────────────────────────────

  /**
   * Compute the bbox of all rendered shapes (live position + size), padded.
   * Reads from `getNodeElement(id).getBBox()` so drag-induced movements are
   * reflected even when the GraphDataPlugin store is not synced.
   */
  private _recomputeNodeBounds(): void {
    const graph = this._ctx?.getPlugin<GraphDataPlugin>(this._graphDataId);
    const store = graph?.getNodeStore();
    if (!graph || !store || store.size === 0) {
      this._nodeBounds = { x: -500, y: -500, width: 1000, height: 1000 };
      return;
    }

    let minX =  Infinity, minY =  Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let any = false;
    for (const id of store.keys()) {
      const shape = graph.getNodeElement(id);
      const bb = shape?.getBBox();
      if (!bb) continue;
      any = true;
      if (bb.minX < minX) minX = bb.minX;
      if (bb.minY < minY) minY = bb.minY;
      if (bb.maxX > maxX) maxX = bb.maxX;
      if (bb.maxY > maxY) maxY = bb.maxY;
    }
    if (!any) {
      this._nodeBounds = { x: -500, y: -500, width: 1000, height: 1000 };
      return;
    }
    const pad = this._options.padding;
    this._nodeBounds = {
      x:      minX - pad,
      y:      minY - pad,
      width:  Math.max(1, (maxX - minX) + pad * 2),
      height: Math.max(1, (maxY - minY) + pad * 2),
    };
  }

  /** Union live node bounds with the camera's visible bounds. */
  private _effectiveBounds(): Bounds {
    this._recomputeNodeBounds();
    const visible = this._camera?.getBounds() ?? { x: 0, y: 0, width: 1, height: 1 };
    const a = this._nodeBounds;
    const minX = Math.min(a.x, visible.x);
    const minY = Math.min(a.y, visible.y);
    const maxX = Math.max(a.x + a.width,  visible.x + visible.width);
    const maxY = Math.max(a.y + a.height, visible.y + visible.height);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  /** Recompute scale + offset so `bounds` fits inside the minimap with margin. */
  private _projectBounds(bounds: Bounds): void {
    const { width, height } = this._options;
    const sx = width  / bounds.width;
    const sy = height / bounds.height;
    this._scale = Math.min(sx, sy) * 0.9;
    this._offsetX = (width  - bounds.width  * this._scale) / 2 - bounds.x * this._scale;
    this._offsetY = (height - bounds.height * this._scale) / 2 - bounds.y * this._scale;
  }

  private _worldToMinimap(wx: number, wy: number): { x: number; y: number } {
    return { x: wx * this._scale + this._offsetX, y: wy * this._scale + this._offsetY };
  }

  private _minimapToWorld(mx: number, my: number): { x: number; y: number } {
    return { x: (mx - this._offsetX) / this._scale, y: (my - this._offsetY) / this._scale };
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private _render = (): void => {
    if (!this._worldGfx || !this._viewportGfx || !this._camera) return;

    this._projectBounds(this._effectiveBounds());

    this._renderWorld();
    this._renderViewportIndicator();
  };

  private _renderWorld(): void {
    const graph = this._ctx?.getPlugin<GraphDataPlugin>(this._graphDataId);
    const g = this._worldGfx!;
    g.clear();
    if (!graph) return;

    const nodes = graph.getNodeStore();
    const edges = graph.getEdgeStore();

    // ── Edges first so nodes draw on top ────────────────────────────────────
    for (const edge of edges.values()) {
      const s = graph.getNodeElement(String(edge.source));
      const t = graph.getNodeElement(String(edge.target));
      if (!s || !t) continue;
      const sc = s.getCenter();
      const tc = t.getCenter();
      const p1 = this._worldToMinimap(sc.x, sc.y);
      const p2 = this._worldToMinimap(tc.x, tc.y);

      const conn = graph.getEdgeElement(edge.id);
      const stroke = pickColor(conn?.spec.style?.stroke as unknown, 0x555555);

      g.moveTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y);
      g.stroke({ width: 1, color: stroke });
    }

    // ── Nodes — bbox-shaped rect with live position, size & color ───────────
    for (const id of nodes.keys()) {
      const shape = graph.getNodeElement(id);
      if (!shape) continue;
      const bb = shape.getBBox();
      const tl = this._worldToMinimap(bb.minX, bb.minY);
      const br = this._worldToMinimap(bb.maxX, bb.maxY);
      const w = Math.max(2, br.x - tl.x);
      const h = Math.max(2, br.y - tl.y);

      const fill = pickColor(shape.spec.style?.fill as unknown, 0x4caf50);

      g.rect(tl.x, tl.y, w, h);
      g.fill(fill);
    }
  }

  private _renderViewportIndicator(): void {
    const g = this._viewportGfx!;
    const visible = this._camera!.getBounds();
    const tl = this._worldToMinimap(visible.x, visible.y);
    const br = this._worldToMinimap(visible.x + visible.width, visible.y + visible.height);
    const x = tl.x;
    const y = tl.y;
    const w = br.x - tl.x;
    const h = br.y - tl.y;

    g.clear();
    g.rect(x, y, w, h);
    g.fill({ color: this._options.viewportFill, alpha: this._options.viewportFillAlpha });
    g.rect(x, y, w, h);
    g.stroke({ width: this._options.viewportStrokeWidth, color: this._options.viewportStroke });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Coerce a fill/stroke value (number, `#RGB`, `#RRGGBB`, or anything else) to
 * a numeric color. Falls back to `fallback` for unsupported strings.
 */
function pickColor(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (s.startsWith('#')) {
      const hex = s.slice(1);
      if (hex.length === 3) {
        const r = hex[0]!, g = hex[1]!, b = hex[2]!;
        return parseInt(`${r}${r}${g}${g}${b}${b}`, 16);
      }
      if (hex.length === 6) return parseInt(hex, 16);
    }
  }
  return fallback;
}
