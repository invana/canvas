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
import { ScreenLayer, type CanvasContext, type ScreenLayerHit } from '@invana/canvas';
import type { LayerOptions } from '@invana/canvas';

import { GraphLayer } from './GraphLayer';
import type { NodeRenderHints, EdgeRenderHints } from './types';

/** Anchor corner inside the canvas viewport. */
export type MiniMapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Constructor options for `MiniMapLayer`. */
export interface MiniMapLayerOptions {
  /** Required — the `GraphLayer` id this minimap mirrors. */
  graphLayerId: string;

  /** Minimap width in screen pixels. Default `200`. */
  width?: number;
  /** Minimap height in screen pixels. Default `150`. */
  height?: number;
  /** Background fill `0xRRGGBB`. Default `0x1a1a2e`. */
  backgroundColor?: number;
  /** Border colour `0xRRGGBB`. Default `0x444444`. */
  borderColor?: number;
  /** Border stroke width. Default `1`. */
  borderWidth?: number;

  /** Viewport indicator fill. Default `0x4a90d9`. */
  viewportFill?: number;
  /** Viewport indicator stroke. Default `0x2a70b9`. */
  viewportStroke?: number;
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
  /** Distance from the chosen corner, in screen pixels. Default `10`. */
  margin?: number;
}

const DEFAULTS: Required<Omit<MiniMapLayerOptions, 'graphLayerId'>> = {
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
};

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
  private opts: Required<Omit<MiniMapLayerOptions, 'graphLayerId'>>;
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

  constructor(opts: LayerOptions<MiniMapLayerOptions>) {
    super({
      ...opts,
      zIndex: opts.zIndex ?? 1000,
      cullable: opts.cullable ?? false,
      hittable: opts.hittable ?? false,
    });
    this.graphLayerId = opts.options.graphLayerId;
    this.opts = { ...DEFAULTS, ...opts.options, graphLayerId: undefined } as typeof DEFAULTS;
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

    // Re-paint when graph data changes or the camera moves.
    this.offCameraPan = ctx.events.on('camera:pan', () => this.repaint());
    this.offCameraZoom = ctx.events.on('camera:zoom', () => this.repaint());
    const offDataChanged = graph.events.on('data:changed', () => this.repaint());

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
      prevOffResize?.();
    };
  }

  protected override onUnmount(): void {
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
    let x = 0;
    let y = 0;
    switch (position) {
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'top-right':
        x = vp.width - width - margin;
        y = margin;
        break;
      case 'bottom-left':
        x = margin;
        y = vp.height - height - margin;
        break;
      case 'bottom-right':
        x = vp.width - width - margin;
        y = vp.height - height - margin;
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
    const { width, height, backgroundColor, borderColor, borderWidth } = this.opts;
    g.clear();
    g.rect(0, 0, width, height).fill(backgroundColor);
    if (borderWidth > 0) {
      g.rect(0, 0, width, height).stroke({ color: borderColor, width: borderWidth });
    }
  }

  private paintWorld(): void {
    const g = this.worldGfx;
    const graph = this.graph;
    if (!g || !graph) return;
    g.clear();

    // Edges first so node markers cover them at intersections.
    for (const edge of graph.store.edges()) {
      const src = graph.store.getNode(edge.source);
      const dst = graph.store.getNode(edge.target);
      if (!src || !dst) continue;
      const sp = src.position ?? { x: 0, y: 0 };
      const tp = dst.position ?? { x: 0, y: 0 };
      const p1 = this.worldToMinimap(sp.x, sp.y);
      const p2 = this.worldToMinimap(tp.x, tp.y);
      const data = (edge.data as EdgeRenderHints | undefined) ?? {};
      const stroke = typeof data.stroke === 'number' ? data.stroke : 0x666666;
      g.moveTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y);
      g.stroke({ width: 1, color: stroke });
    }

    // Nodes — match the shape kind actually drawn on the canvas (circle vs
    // rect), scaled into minimap space. Falls back to the layer's
    // `nodeDefaults` for any hint the node omits.
    const defaults = graph.getNodeDefaults();
    for (const node of graph.store.nodes()) {
      const pos = node.position ?? { x: 0, y: 0 };
      const p = this.worldToMinimap(pos.x, pos.y);
      const data = (node.data as NodeRenderHints | undefined) ?? {};
      const fill = typeof data.fill === 'number' ? data.fill : defaults.fill;
      const fillColor = typeof fill === 'number' ? fill : 0x4caf50;
      const shape = data.shape ?? defaults.shape;
      const sizeWorld = data.size ?? defaults.size;

      if (shape === 'rect') {
        const heightWorld = data.height ?? sizeWorld;
        const w = Math.max(2, sizeWorld * this.scale);
        const h = Math.max(2, heightWorld * this.scale);
        g.rect(p.x - w / 2, p.y - h / 2, w, h).fill(fillColor);
      } else {
        // 'circle' — half-size is the radius.
        const r = Math.max(1, (sizeWorld / 2) * this.scale);
        g.circle(p.x, p.y, r).fill(fillColor);
      }
    }
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
    g.fill({ color: this.opts.viewportFill, alpha: this.opts.viewportFillAlpha });
    g.rect(x, y, w, h);
    g.stroke({ color: this.opts.viewportStroke, width: this.opts.viewportStrokeWidth });
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
   * AABB of all drawn node *footprints* (position ± half-size) + padding —
   * not just centers, so nodes at the cluster edge aren't clipped or
   * compressed against the minimap border. Falls back to a 1000×1000 box.
   */
  private nodeBounds(): Bounds {
    const graph = this.graph;
    if (!graph || graph.store.nodeCount() === 0) {
      return { x: -500, y: -500, width: 1000, height: 1000 };
    }
    const defaults = graph.getNodeDefaults();
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    let any = false;
    for (const node of graph.store.nodes()) {
      const pos = node.position ?? { x: 0, y: 0 };
      const data = (node.data as NodeRenderHints | undefined) ?? {};
      const shape = data.shape ?? defaults.shape;
      const sizeWorld = data.size ?? defaults.size;
      const halfW = sizeWorld / 2;
      const halfH = shape === 'rect' ? (data.height ?? sizeWorld) / 2 : sizeWorld / 2;
      any = true;
      if (pos.x - halfW < minX) minX = pos.x - halfW;
      if (pos.y - halfH < minY) minY = pos.y - halfH;
      if (pos.x + halfW > maxX) maxX = pos.x + halfW;
      if (pos.y + halfH > maxY) maxY = pos.y + halfH;
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
