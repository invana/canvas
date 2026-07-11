/**
 * `MiniMapLayer` — bird's-eye overview of a `GraphLayer` with a draggable
 * viewport indicator.
 *
 * Implemented as a `ScreenLayer` rather than a self-hosted pixi `Application`
 * — much cheaper, no extra GPU surface, and pans/zooms/visibility integrate
 * with the main canvas naturally. The minimap occupies a fixed
 * `width × height` rectangle anchored to a corner of the viewport.
 *
 * Cross-layer dependency declared via `graphLayerId` per the canvas
 * architecture rule: no inference of "the only graph layer". You must point
 * the minimap at a specific id.
 *
 * @example
 * ```ts
 * const graph = new GraphLayer({ id: 'graph', options: {} });
 * canvas.layers.add(graph);
 *
 * const minimap = new MiniMapLayer({
 *   id: 'minimap',
 *   options: { graphLayerId: 'graph', position: 'bottom-right' },
 * });
 * canvas.layers.add(minimap);
 * ```
 */

import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import { BackgroundLayer, ScreenLayer, select, type CanvasContext, type ScreenLayerHit } from '@invana/canvas';
import type { LayerOptions, Rect } from '@invana/canvas';

import { GraphLayer } from './GraphLayer';
import type { GraphNode } from '../store/types';

/** Anchor corner inside the canvas viewport. */
export type MiniMapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * A minimap-chrome colour. Pass a single `0xRRGGBB` for a fixed colour, or a
 * `{ light, dark }` pair to swap based on the layer's `mode` — so the minimap
 * can track the canvas theme the same way {@link BackgroundLayer} does.
 */
export type MiniMapColor = number | { light: number; dark: number };

/**
 * Mode selector for light/dark colour resolution. `'auto'` follows the host's
 * `prefers-color-scheme` media query; `'light'` / `'dark'` pin explicitly.
 */
export type MiniMapMode = 'auto' | 'light' | 'dark';

/** The concrete kind currently resolved after `mode` resolution. */
export type MiniMapKind = 'light' | 'dark';

/** Constructor options for `MiniMapLayer`. */
export interface MiniMapLayerOptions {
  /** Required — the `GraphLayer` id this minimap mirrors. */
  graphLayerId: string;

  /** Minimap width in screen pixels. Default `200`. */
  width?: number;
  /** Minimap height in screen pixels. Default `150`. */
  height?: number;
  /**
   * Id of a `BackgroundLayer` to mirror. When set, the minimap paints its
   * background with that layer's *resolved* colour — so the minimap backdrop
   * always matches the real canvas background (including theme flips) without
   * duplicating the colour here. Falls back to {@link backgroundColor} when the
   * id is unset or the layer can't be resolved. Declared explicitly per the
   * canvas cross-layer rule — no inference of "the only background layer".
   */
  backgroundLayerId?: string;
  /**
   * Background fill used when {@link backgroundLayerId} is unset / unresolved. A
   * `0xRRGGBB` or a `{ light, dark }` pair resolved against `mode`. Default
   * `0x1a1a2e`.
   */
  backgroundColor?: MiniMapColor;
  /** Border colour. Same forms as `backgroundColor`. Default `0x444444`. */
  borderColor?: MiniMapColor;
  /** Border stroke width. Default `1`. */
  borderWidth?: number;

  /** Viewport indicator fill. Same forms as `backgroundColor`. Default `0x4a90d9`. */
  viewportFill?: MiniMapColor;
  /** Viewport indicator stroke. Same forms as `backgroundColor`. Default `0x2a70b9`. */
  viewportStroke?: MiniMapColor;
  /** Viewport indicator fill alpha 0–1. Default `0.3`. */
  viewportFillAlpha?: number;
  /** Viewport indicator stroke width. Default `2`. */
  viewportStrokeWidth?: number;

  /** World-space padding around node bounds. Default `20`. */
  padding?: number;
  /** Whether dragging the minimap pans the main camera. Default `true`. */
  enableDrag?: boolean;
  /** Anchor corner. Default `'bottom-right'`. */
  position?: MiniMapPosition;
  /**
   * How `{ light, dark }` colour variants are resolved. `'auto'` (default)
   * follows `prefers-color-scheme`; `'light'` / `'dark'` pin explicitly. Has no
   * effect when every colour is a plain scalar. Flip it (e.g. from a theme
   * toggle via `useTheme`'s `minimapLayerId`) to swap the minimap chrome in
   * lockstep with the canvas {@link BackgroundLayer}.
   */
  mode?: MiniMapMode;
  /**
   * Inset from the chosen corner, in screen pixels. Pass a single number for a
   * symmetric inset, or `{ x, y }` for independent horizontal / vertical insets
   * (e.g. to bottom-align the minimap with a control rail while clearing its
   * width). A missing axis on the object form falls back to `10`. Default `10`.
   */
  margin?: number | { x?: number; y?: number };
}

const DEFAULTS: Required<Omit<MiniMapLayerOptions, 'graphLayerId' | 'backgroundLayerId'>> = {
  width: 200,
  height: 150,
  backgroundColor: 0x1a1a2e,
  borderColor: 0x444444,
  borderWidth: 1,
  viewportFill: 0x4a90d9,
  viewportStroke: 0x2a70b9,
  viewportFillAlpha: 0.3,
  viewportStrokeWidth: 2,
  padding: 20,
  enableDrag: true,
  position: 'bottom-right',
  margin: 10,
  mode: 'auto',
};

/**
 * Resolved option bag: everything defaulted, plus the optional
 * `backgroundLayerId` wiring field (left out of {@link DEFAULTS}, like
 * `graphLayerId`, because it has no sensible default — it's a cross-layer
 * reference or nothing).
 */
type MiniMapOpts = Required<Omit<MiniMapLayerOptions, 'graphLayerId' | 'backgroundLayerId'>> &
  Pick<MiniMapLayerOptions, 'backgroundLayerId'>;

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MiniMapState {
  readonly _placeholder?: never;
}

export class MiniMapLayer extends ScreenLayer<
  MiniMapLayerOptions,
  MiniMapState,
  Record<string, never>,
  never,
  ScreenLayerHit
> {
  private opts: MiniMapOpts;
  private readonly graphLayerId: string;

  private graph: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;

  /** Inner content container (the minimap's drawable area). */
  private inner: Container | null = null;
  private bgGfx: Graphics | null = null;
  private worldGfx: Graphics | null = null;
  private viewportGfx: Graphics | null = null;

  /** Per-frame projection scale + offset (world → minimap-local). */
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  /** Drag state. */
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  /** ResizeObserver disposer. */
  private offResize: (() => void) | null = null;
  private offCameraPan: (() => void) | null = null;
  private offCameraZoom: (() => void) | null = null;

  /** `theme:change` subscriber — repaints the chrome when the theme flips. */
  private offTheme: (() => void) | null = null;

  constructor(opts: LayerOptions<MiniMapLayerOptions>) {
    super({
      ...opts,
      zIndex: opts.zIndex ?? 1000,
      cullable: opts.cullable ?? false,
      hittable: opts.hittable ?? false,
    });
    this.graphLayerId = opts.options.graphLayerId;
    this.opts = { ...DEFAULTS, ...opts.options, graphLayerId: undefined } as MiniMapOpts;
  }

  protected createState(): MiniMapState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    const graph = ctx.layers.get<GraphLayer>(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `MiniMapLayer "${this.id}": graph layer "${this.graphLayerId}" not found. ` +
          `Add the GraphLayer before MiniMapLayer.`,
      );
    }
    this.graph = graph;
    this.ctxRef = ctx;

    // Build the screen-space minimap container.
    this.inner = new Container();
    this.inner.label = `${this.id}-inner`;
    this.bgGfx = new Graphics();
    this.worldGfx = new Graphics();
    this.viewportGfx = new Graphics();
    this.inner.addChild(this.bgGfx);
    this.inner.addChild(this.worldGfx);
    this.inner.addChild(this.viewportGfx);
    this.container.addChild(this.inner);

    if (this.opts.enableDrag) this.wireInteractions();

    this.layoutPosition();
    this.repaint();

    // Follow the active theme: a flip swaps any `{ light, dark }` chrome colour
    // and the mirrored background, so repaint. The `ThemeBehaviour` is the sole
    // `prefers-color-scheme` reader — the minimap just reads `ctx.theme`.
    this.offTheme = ctx.events.on('theme:change', () => this.repaint());

    // Re-paint when graph data, style template, or the camera changes.
    this.offCameraPan = ctx.events.on('input:camera:pan', () => this.repaint());
    this.offCameraZoom = ctx.events.on('input:camera:zoom', () => this.repaint());
    const offDataChanged = graph.events.on('data:changed', () => this.repaint());
    const offStyleChanged = graph.events.on('style:changed', () => this.repaint());
    // Repaint when the mirrored source graph layer's whole-layer visibility is
    // toggled via `Layer.setVisible`, so the minimap blanks / restores with it.
    const offSourceVisibility = ctx.events.on('scene:layer:visibilitychange', ({ id }) => {
      if (id === graph.id) this.repaint();
    });

    // Mirror the referenced background layer's colour: subscribe to that layer's
    // config slice on the reactive store (`store.view.definition.layers[id]`) and
    // repaint when it changes identity (e.g. a theme flip via `canvas.update()`).
    const bgId = this.opts.backgroundLayerId;
    const offOptions = bgId
      ? select(ctx.store.view, (s) => s.definition.layers[bgId]).subscribe(() => this.repaint())
      : () => {};

    if (typeof ResizeObserver !== 'undefined' && ctx.canvasElement) {
      const ro = new ResizeObserver(() => {
        this.layoutPosition();
        this.repaint();
      });
      ro.observe(ctx.canvasElement);
      this.offResize = () => ro.disconnect();
    }

    // Subscription to data:changed returns an unsubscribe function — capture it
    // so we drop it on unmount.
    const prevOffResize = this.offResize;
    this.offResize = () => {
      offDataChanged();
      offStyleChanged();
      offSourceVisibility();
      offOptions();
      prevOffResize?.();
    };
  }

  protected override onUnmount(): void {
    this.offTheme?.();
    this.offTheme = null;
    this.offCameraPan?.();
    this.offCameraZoom?.();
    this.offResize?.();
    this.offCameraPan = null;
    this.offCameraZoom = null;
    this.offResize = null;

    this.inner?.removeFromParent();
    this.inner?.destroy({ children: true });
    this.inner = null;
    this.bgGfx = null;
    this.worldGfx = null;
    this.viewportGfx = null;
    this.graph = null;
    this.ctxRef = null;
  }

  hitTest(): ScreenLayerHit | null {
    return null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Force a re-paint. Cheap — call after mutating colours / sizes externally. */
  refresh(): void {
    this.repaint();
  }

  setOptions(patch: Partial<Omit<MiniMapLayerOptions, 'graphLayerId'>>): void {
    this.opts = { ...this.opts, ...patch };
    this.layoutPosition();
    this.repaint();
  }

  /**
   * Set the colour-resolution mode. `'auto'` follows the active theme on
   * `ctx.theme`; `'light'` / `'dark'` pin explicitly. No-op when unchanged. The
   * minimap chrome flips in lockstep with the canvas {@link BackgroundLayer},
   * which resolves its kind from the same theme signal.
   */
  setMode(mode: MiniMapMode): void {
    if (this.opts.mode === mode) return;
    this.opts = { ...this.opts, mode };
    this.repaint();
  }

  /** Current mode setting. */
  getMode(): MiniMapMode {
    return this.opts.mode;
  }

  /**
   * Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
   * follows the active theme on `ctx.theme` (defaulting to `'light'` before any
   * theme is published).
   */
  getResolvedKind(): MiniMapKind {
    if (this.opts.mode === 'light' || this.opts.mode === 'dark') return this.opts.mode;
    return this.ctxRef?.theme.current()?.kind ?? 'light';
  }

  // ─── Layout ─────────────────────────────────────────────────────────────

  private viewportSize(): { width: number; height: number } {
    const el = this.ctxRef?.canvasElement;
    if (el) return { width: el.clientWidth || 800, height: el.clientHeight || 600 };
    return { width: 800, height: 600 };
  }

  private layoutPosition(): void {
    if (!this.inner) return;
    const { width, height, position, margin } = this.opts;
    const vp = this.viewportSize();
    // Resolve symmetric (number) or per-axis ({ x, y }) insets; missing axis → 10.
    const mx = typeof margin === 'number' ? margin : (margin.x ?? 10);
    const my = typeof margin === 'number' ? margin : (margin.y ?? 10);
    let x = 0;
    let y = 0;
    switch (position) {
      case 'top-left':
        x = mx;
        y = my;
        break;
      case 'top-right':
        x = vp.width - width - mx;
        y = my;
        break;
      case 'bottom-left':
        x = mx;
        y = vp.height - height - my;
        break;
      case 'bottom-right':
        x = vp.width - width - mx;
        y = vp.height - height - my;
        break;
    }
    this.inner.position.set(x, y);
  }

  // ─── Painting ───────────────────────────────────────────────────────────

  private repaint(): void {
    if (!this.inner || !this.graph || !this.ctxRef) return;
    this.projectBounds(this.effectiveBounds());
    this.paintBackground();
    this.paintWorld();
    this.paintViewportIndicator();
  }

  private paintBackground(): void {
    const g = this.bgGfx;
    if (!g) return;
    const { width, height, borderColor, borderWidth } = this.opts;
    g.clear();
    g.rect(0, 0, width, height).fill(this.resolveBackgroundFill());
    if (borderWidth > 0) {
      g.rect(0, 0, width, height).stroke({
        color: this.resolveColor(borderColor),
        width: borderWidth,
      });
    }
  }

  /**
   * The minimap backdrop colour. Mirrors the referenced {@link BackgroundLayer}
   * (`backgroundLayerId`) when one is wired and resolvable, so the minimap
   * tracks the canvas background — including theme flips — with no duplicated
   * colour. Falls back to the `backgroundColor` option otherwise.
   */
  private resolveBackgroundFill(): number | string {
    const id = this.opts.backgroundLayerId;
    if (id) {
      const bg = this.ctxRef?.layers.get<BackgroundLayer>(id);
      if (bg instanceof BackgroundLayer) return bg.getResolvedBackgroundColor();
    }
    return this.resolveColor(this.opts.backgroundColor);
  }

  private paintWorld(): void {
    const g = this.worldGfx;
    const graph = this.graph;
    if (!g || !graph) return;
    g.clear();
    const renderer = graph.getRenderer();

    // Edges first so node markers cover them at intersections. Use the actual
    // routed polyline from the renderer — preserves orthogonal kinks, bezier
    // curves, waypoints, anchor offsets, everything the canvas drew. Falls
    // back to a straight endpoint-to-endpoint line only when the renderer
    // isn't available (pre-mount) or hasn't installed the connector yet.
    for (const edge of graph.store.edges()) {
      // Skip effectively-hidden edges (explicitly hidden or an endpoint hidden)
      // so the minimap mirrors what the canvas actually draws.
      if (!graph.store.isEdgeVisible(edge.id)) continue;
      // Resolve the *effective* style — same merge the renderer sees — so
      // colours, widths and alphas set via the layer template / resolvers /
      // state overlays (not just concrete `edge.style`) are mirrored. Reading
      // `edge.style` raw misses every resolver-driven value.
      const edgeStyle = graph.resolveEdgeStyle(edge);
      const stroke = typeof edgeStyle.strokeColor === 'number' ? edgeStyle.strokeColor : 0x666666;
      // Faithful scaled-down width: the real world-space stroke width times the
      // minimap projection scale, so weight-driven thickness differences carry
      // through. Floored at `MIN_EDGE_WIDTH` so thin edges stay visible at the
      // minimap's heavy downscale instead of vanishing.
      const edgeWidth = Math.max(
        MIN_EDGE_WIDTH,
        (typeof edgeStyle.strokeWidth === 'number' ? edgeStyle.strokeWidth : 1) * this.scale,
      );
      const edgeAlpha = typeof edgeStyle.strokeAlpha === 'number' ? edgeStyle.strokeAlpha : 1;

      const polyline = renderer?.getConnectorPolyline(edge.id);
      if (polyline && polyline.length >= 2) {
        const first = this.worldToMinimap(polyline[0]!.x, polyline[0]!.y);
        g.moveTo(first.x, first.y);
        for (let i = 1; i < polyline.length; i++) {
          const p = this.worldToMinimap(polyline[i]!.x, polyline[i]!.y);
          g.lineTo(p.x, p.y);
        }
        g.stroke({ width: edgeWidth, color: stroke, alpha: edgeAlpha });
        continue;
      }

      const src = graph.store.getNode(edge.source);
      const dst = graph.store.getNode(edge.target);
      if (!src || !dst) continue;
      const sp = src.position ?? { x: 0, y: 0 };
      const tp = dst.position ?? { x: 0, y: 0 };
      const p1 = this.worldToMinimap(sp.x, sp.y);
      const p2 = this.worldToMinimap(tp.x, tp.y);
      g.moveTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y);
      g.stroke({ width: edgeWidth, color: stroke, alpha: edgeAlpha });
    }

    // Nodes — ask the renderer for the world-space AABB of whatever it
    // actually drew (circle, rect, arc, polygon, star, custom kind). The
    // minimap mirrors each shape at its true footprint, drawing a circle for
    // round shapes and a rect otherwise so the bird's-eye view matches the
    // canvas silhouette. Fill colour and shape both read from the *resolved*
    // style (`resolveNodeStyle`) — the same merge the renderer sees — so
    // layer-template / resolver / state-overlay colours (e.g. colour-by-label)
    // are mirrored, not just concrete per-node `style.bgFill`.
    for (const node of graph.store.nodes()) {
      // Skip hidden nodes — culled from the canvas, so culled from the minimap.
      if (node.hidden === true) continue;
      const bounds = renderer?.getShapeWorldBounds(node.id) ?? this.fallbackNodeBounds(node);
      if (!bounds) continue;
      const tl = this.worldToMinimap(bounds.x, bounds.y);
      const br = this.worldToMinimap(bounds.x + bounds.width, bounds.y + bounds.height);
      const w = Math.max(2, br.x - tl.x);
      const h = Math.max(2, br.y - tl.y);

      const nodeStyle = graph.resolveNodeStyle(node);
      const fillColor = typeof nodeStyle.bgFill === 'number' ? nodeStyle.bgFill : 0x4caf50;
      const kind = (nodeStyle.shape as { kind?: string } | undefined)?.kind;

      if (kind === 'circle') {
        g.ellipse(tl.x + w / 2, tl.y + h / 2, w / 2, h / 2).fill(fillColor);
      } else {
        g.rect(tl.x, tl.y, w, h).fill(fillColor);
      }
    }
  }

  /**
   * Pre-mount / pre-install fallback for shape bounds. Used when the renderer
   * hasn't yet built an instance for a node (very brief window — the layer's
   * `data:changed` event repaints the minimap as soon as the renderer catches
   * up).
   *
   * Delegates to {@link GraphLayer.boundsOfNode}, which routes through the
   * shape registry's `static boundsOf` hook — built-in and custom shape
   * kinds flow through the same code path. Falls back to a 32px square
   * AABB centred on the node's stored position when the resolved shape
   * isn't registered or its ctor doesn't expose `boundsOf`.
   */
  private fallbackNodeBounds(node: GraphNode): Rect | null {
    const graph = this.graph;
    if (!graph) return null;
    const pos = node.position ?? { x: 0, y: 0 };
    const local = graph.boundsOfNode(node) ?? FALLBACK_LOCAL_BOUNDS;
    return {
      x: pos.x + local.x,
      y: pos.y + local.y,
      width: local.width,
      height: local.height,
    };
  }

  private paintViewportIndicator(): void {
    const g = this.viewportGfx;
    const ctx = this.ctxRef;
    if (!g || !ctx) return;
    const vis = ctx.camera.getVisibleBounds();
    const tl = this.worldToMinimap(vis.x, vis.y);
    const br = this.worldToMinimap(vis.x + vis.width, vis.y + vis.height);
    const x = tl.x;
    const y = tl.y;
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    g.clear();
    g.rect(x, y, w, h);
    g.fill({ color: this.resolveColor(this.opts.viewportFill), alpha: this.opts.viewportFillAlpha });
    g.rect(x, y, w, h);
    g.stroke({
      color: this.resolveColor(this.opts.viewportStroke),
      width: this.opts.viewportStrokeWidth,
    });
  }

  // ─── Bounds + projection ────────────────────────────────────────────────

  /** Union node bounds with the current camera-visible bounds. */
  private effectiveBounds(): Bounds {
    const node = this.nodeBounds();
    const vis = this.ctxRef?.camera.getVisibleBounds() ?? {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    };
    const minX = Math.min(node.x, vis.x);
    const minY = Math.min(node.y, vis.y);
    const maxX = Math.max(node.x + node.width, vis.x + vis.width);
    const maxY = Math.max(node.y + node.height, vis.y + vis.height);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  /**
   * AABB of all drawn node *footprints* + padding, queried directly from the
   * renderer's per-instance world bounds — so arcs / polygons / stars /
   * custom shapes contribute their true extent, not a hardcoded size-derived
   * estimate. Pre-mount nodes fall through to a position+default-size box.
   * Returns a 1000×1000 placeholder when the layer has no nodes yet.
   */
  private nodeBounds(): Bounds {
    const graph = this.graph;
    if (!graph || graph.store.nodeCount() === 0) {
      return { x: -500, y: -500, width: 1000, height: 1000 };
    }
    const renderer = graph.getRenderer();
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    let any = false;
    for (const node of graph.store.nodes()) {
      if (node.hidden === true) continue;
      const b = renderer?.getShapeWorldBounds(node.id) ?? this.fallbackNodeBounds(node);
      if (!b) continue;
      any = true;
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }
    if (!any) return { x: -500, y: -500, width: 1000, height: 1000 };
    const pad = this.opts.padding;
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(1, maxX - minX + pad * 2),
      height: Math.max(1, maxY - minY + pad * 2),
    };
  }

  private projectBounds(b: Bounds): void {
    const { width, height } = this.opts;
    const sx = width / b.width;
    const sy = height / b.height;
    this.scale = Math.min(sx, sy) * 0.9;
    this.offsetX = (width - b.width * this.scale) / 2 - b.x * this.scale;
    this.offsetY = (height - b.height * this.scale) / 2 - b.y * this.scale;
  }

  // ─── Theme colour resolution ────────────────────────────────────────────

  /** Resolve a scalar or `{ light, dark }` colour against the current mode. */
  private resolveColor(c: MiniMapColor): number {
    if (typeof c === 'number') return c;
    return this.getResolvedKind() === 'dark' ? c.dark : c.light;
  }

  private worldToMinimap(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY,
    };
  }

  private minimapToWorld(mx: number, my: number): { x: number; y: number } {
    return {
      x: (mx - this.offsetX) / this.scale,
      y: (my - this.offsetY) / this.scale,
    };
  }

  // ─── Interactions ───────────────────────────────────────────────────────

  private wireInteractions(): void {
    const inner = this.inner;
    if (!inner) return;
    inner.eventMode = 'static';
    inner.hitArea = {
      contains: (x, y) => x >= 0 && x <= this.opts.width && y >= 0 && y <= this.opts.height,
    };
    inner.cursor = 'pointer';
    inner.on('pointerdown', this.onMiniPointerDown);
    inner.on('pointermove', this.onMiniPointerMove);
    inner.on('pointerup', this.onMiniPointerUp);
    inner.on('pointerupoutside', this.onMiniPointerUp);
  }

  private onMiniPointerDown = (e: FederatedPointerEvent): void => {
    const ctx = this.ctxRef;
    if (!ctx || !this.inner) return;
    const local = e.getLocalPosition(this.inner);
    const world = this.minimapToWorld(local.x, local.y);
    const vis = ctx.camera.getVisibleBounds();
    const cx = vis.x + vis.width / 2;
    const cy = vis.y + vis.height / 2;
    const inside =
      world.x >= vis.x &&
      world.x <= vis.x + vis.width &&
      world.y >= vis.y &&
      world.y <= vis.y + vis.height;

    this.isDragging = true;
    if (inside) {
      this.dragOffsetX = world.x - cx;
      this.dragOffsetY = world.y - cy;
    } else {
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
      this.panMainCameraTo(world.x, world.y);
    }
  };

  private onMiniPointerMove = (e: FederatedPointerEvent): void => {
    if (!this.isDragging || !this.ctxRef || !this.inner) return;
    const local = e.getLocalPosition(this.inner);
    const world = this.minimapToWorld(local.x, local.y);
    this.panMainCameraTo(world.x - this.dragOffsetX, world.y - this.dragOffsetY);
  };

  private onMiniPointerUp = (): void => {
    this.isDragging = false;
  };

  /** Position the main camera so the world point `(wx, wy)` lands at screen centre. */
  private panMainCameraTo(wx: number, wy: number): void {
    const cam = this.ctxRef?.camera;
    if (!cam) return;
    const s = cam.scale;
    const tx = cam.screenWidth / 2 - wx * s;
    const ty = cam.screenHeight / 2 - wy * s;
    cam.setPosition(tx, ty);
  }
}

/**
 * Default local AABB used when the resolved shape isn't registered or its
 * ctor doesn't expose `static boundsOf`. Centred on the origin so the
 * minimap places it symmetrically around the node's stored position.
 */
const FALLBACK_LOCAL_BOUNDS: Rect = { x: -16, y: -16, width: 32, height: 32 };

/**
 * Lower bound (in minimap-local pixels) for a mirrored edge stroke. The minimap
 * downscales the whole graph into a small box, so an edge's faithfully-scaled
 * width (`strokeWidth × scale`) often lands well below a pixel — this floor
 * keeps every edge visible while still letting heavier edges render thicker.
 */
const MIN_EDGE_WIDTH = 0.4;
