import type { Ticker } from 'pixi.js';
import type { CanvasPlugin, PluginContext } from '../types.js';
import { ShapePool } from './shape-plugin/ShapePool.js';
import { SceneContainer } from './shape-plugin/SceneContainer.js';
import { CameraTracker } from './shape-plugin/CameraTracker.js';
import { HaloPool } from './shape-plugin/HaloPool.js';
import { AnimationTicker } from './shape-plugin/AnimationTicker.js';
import { LODController } from './shape-plugin/LODController.js';
import { TextureRegistry } from './shape-plugin/TextureRegistry.js';
import type { ShapeSpec, ShapeType } from './shape-plugin/spec/shapes.js';
import type { ShapeAnimations } from './shape-plugin/spec/animations.js';
import type {
  ShapeEventType, ShapeEventPayload, DragPayload, ShapeHandler, DragHandler,
} from './shape-plugin/spec/events.js';
import type { ShapeObject } from './shape-plugin/ShapeObject.js';
import type { LODThresholds } from './shape-plugin/LODController.js';

export type { ShapeSpec, ShapeType };
export type { ShapeAnimations };
export type { ShapeEventType, ShapeEventPayload, DragPayload };

export interface ShapePluginOptions {
  key?: string;
  /** z-index for the shape layer (default: 10) */
  zIndex?: number;
  /** Override LOD zoom thresholds */
  lod?: Partial<LODThresholds>;
  /** HaloPool size — max simultaneous halos (default: 40) */
  haloPoolSize?: number;
  /** Automatically fit the camera to all shapes after setData() (default: false) */
  fitOnRender?: boolean;
  /** Padding in world-space pixels around content when fitting (default: 60) */
  fitPadding?: number;
}

type AnyHandler = ShapeHandler | DragHandler;

export class ShapePlugin implements CanvasPlugin {
  readonly id: string;

  private _zIndex: number;
  private _lodOptions: Partial<LODThresholds>;
  private _haloPoolSize: number;
  private _fitOnRender: boolean;
  private _fitPadding: number;

  private _pool!: ShapePool;
  private _scene!: SceneContainer;
  private _halos!: HaloPool;
  private _ticker!: AnimationTicker;
  private _lod!: LODController;
  private _cameraTracker!: CameraTracker;
  private _ctx!: PluginContext;

  // Event listeners: shapeId|'*' → eventType → Set<handler>
  private _listeners = new Map<string, Map<ShapeEventType, Set<AnyHandler>>>();

  // Drag state
  private _dragState: { id: string; lastX: number; lastY: number } | null = null;

  // ── Static texture registry ───────────────────────────────────────────────
  static registerTexture(key: string, url: string): Promise<void> {
    return TextureRegistry.register(key, url);
  }

  constructor(options: ShapePluginOptions = {}) {
    this.id = options.key ?? 'shapes';
    this._zIndex = options.zIndex ?? 10;
    this._lodOptions = options.lod ?? {};
    this._haloPoolSize = options.haloPoolSize ?? 40;
    this._fitOnRender = options.fitOnRender ?? false;
    this._fitPadding = options.fitPadding ?? 60;
  }

  register(ctx: PluginContext): void {
    this._ctx = ctx;
    const layer = ctx.createLayer({ id: `${this.id}-layer`, zIndex: this._zIndex, label: 'Shapes' });

    this._pool   = new ShapePool();
    this._lod    = new LODController(this._lodOptions);
    this._halos  = new HaloPool(layer, this._haloPoolSize);
    this._scene  = new SceneContainer(layer, this._pool);

    // Sync LOD to the real camera scale at startup so labels are correct
    // before the user has zoomed at all
    this._lod.update(ctx.camera.scale);
    this._scene.onDetailChanged(this._lod.current);

    // Wire LOD changes → redraw all visible shapes
    ctx.events.on('camera:zoom', ({ scale }) => {
      if (this._lod.update(scale)) {
        this._scene.onDetailChanged(this._lod.current);
      }
    });

    // Wire pointer events for hit-testing and shape events
    ctx.events.on('canvas:pointermove', ({ worldX, worldY, originalEvent }) => {
      this._onPointerMove(worldX, worldY, originalEvent as PointerEvent);
    });
    ctx.events.on('canvas:pointerdown', ({ worldX, worldY, originalEvent }) => {
      this._onPointerDown(worldX, worldY, originalEvent as PointerEvent);
    });
    ctx.events.on('canvas:pointerup', ({ worldX, worldY, originalEvent }) => {
      this._onPointerUp(worldX, worldY, originalEvent as PointerEvent);
    });
    ctx.events.on('canvas:clicked', ({ worldX, worldY, originalEvent }) => {
      this._onPointerClick(worldX, worldY, originalEvent as PointerEvent);
    });

    // CameraTracker — initial flush + camera-driven culling
    this._cameraTracker = new CameraTracker(
      ctx.camera,
      ctx.events,
      (bounds) => this._scene.onCameraChanged(bounds),
    );

    // AnimationTicker — hooks into PixiJS app.ticker via the renderer
    // Access ticker through the rendering internals via a documented escape hatch
    const ticker = (ctx as unknown as { _ticker?: Ticker })._ticker;
    if (ticker) {
      this._ticker = new AnimationTicker(ticker, this._scene, this._halos);
    }
  }

  // ── Data API ──────────────────────────────────────────────────────────────

  setData(specs: ShapeSpec[]): void {
    this.clear();
    for (const spec of specs) {
      this._add(spec);
    }
    this._cameraTracker.flush();
    if (this._fitOnRender) this.fit(this._fitPadding);
  }

  add(spec: ShapeSpec): void {
    this._add(spec);
    this._cameraTracker.flush();
  }

  update(id: string, partial: Record<string, unknown>): void {
    const obj = this._pool.get(id);
    if (!obj) return;
    this._pool.updateBBox(obj); // recompute after update
    this._scene.redraw(id);
    obj.update(partial, this._scene.detail);
    this._pool.updateBBox(obj);
  }

  remove(id: string): void {
    this._scene.evict(id);
    this._ticker?.stop(id);
    this._halos.return(id);
    this._pool.get(id)?.destroy();
    this._pool.remove(id);
    this._listeners.delete(id);
  }

  get(id: string): ShapeObject | undefined {
    return this._pool.get(id);
  }

  clear(): void {
    this._scene.clear();
    this._ticker?.stopAll();
    this._halos.returnAll();
    this._pool.clear();
    this._listeners.clear();
  }

  /**
   * Fit the camera to the bounding box of all shapes in the pool.
   * @param padding - Extra world-space padding around the content (default: 60)
   */
  fit(padding = 60): void {
    const boxes = this._pool.allBBoxes();
    if (boxes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of boxes) {
      if (b.minX < minX) minX = b.minX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.maxY > maxY) maxY = b.maxY;
    }

    this._ctx.camera.fitTo(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      padding,
    );
  }

  // ── Animation API ─────────────────────────────────────────────────────────

  animate(id: string, animations: ShapeAnimations): void {
    const obj = this._pool.get(id);
    if (!obj || !this._ticker) return;
    this._ticker.start(obj, animations);
  }

  stopAnimation(id: string, layer?: 'border' | 'body'): void {
    this._ticker?.stop(id, layer);
    // If halo was animated, return it
    if (!layer || layer === 'body') this._halos.return(id);
  }

  // ── Event API ─────────────────────────────────────────────────────────────

  on(id: string | '*', event: ShapeEventType, handler: AnyHandler): void {
    if (!this._listeners.has(id)) this._listeners.set(id, new Map());
    const byEvent = this._listeners.get(id)!;
    if (!byEvent.has(event)) byEvent.set(event, new Set());
    byEvent.get(event)!.add(handler);
  }

  off(id: string | '*', event: ShapeEventType, handler: AnyHandler): void {
    this._listeners.get(id)?.get(event)?.delete(handler);
  }

  destroy(): void {
    this._ticker?.destroy();
    this._halos.destroy();
    this._pool.clear();
    this._listeners.clear();
  }

  // ── Private event routing ─────────────────────────────────────────────────

  private _add(spec: ShapeSpec): void {
    this._pool.add(spec);
    // Spec animations declared inline → start immediately
    if (spec.animations) {
      const obj = this._pool.get(spec.id)!;
      this._ticker?.start(obj, spec.animations);
    }
  }

  private _lastHover: string | null = null;

  private _onPointerMove(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    // ── Drag ────────────────────────────────────────────────────────────────
    if (this._dragState) {
      const dx = worldX - this._dragState.lastX;
      const dy = worldY - this._dragState.lastY;
      this._dragState.lastX = worldX;
      this._dragState.lastY = worldY;
      const obj = this._pool.get(this._dragState.id);
      if (obj) this._emit(obj, 'dragmove', { worldX, worldY, originalEvent, dx, dy } as DragPayload);
      return;
    }

    // ── Hover ───────────────────────────────────────────────────────────────
    const hit = this._pool.hitTest(worldX, worldY);

    if (hit?.id !== this._lastHover) {
      if (this._lastHover) {
        const prev = this._pool.get(this._lastHover);
        if (prev) {
          this._emit(prev, 'pointerout', { shape: prev, worldX, worldY, originalEvent });
          if (this._lod.current >= 2) this._halos.return(this._lastHover);
        }
      }
      if (hit) {
        this._emit(hit, 'pointerover', { shape: hit, worldX, worldY, originalEvent });
        if (this._lod.current >= 2 && hit.spec.halo) this._halos.rent(hit);
        if (hit.spec.cursor) this._ctx.canvasElement.style.cursor = hit.spec.cursor;
      } else {
        this._ctx.canvasElement.style.cursor = '';
      }
      this._lastHover = hit?.id ?? null;
    }

    if (hit) this._emit(hit, 'pointermove', { shape: hit, worldX, worldY, originalEvent });
  }

  private _onPointerDown(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    const hit = this._pool.hitTest(worldX, worldY);
    if (!hit) return;
    this._emit(hit, 'pointerdown', { shape: hit, worldX, worldY, originalEvent });
    if (hit.spec.draggable) {
      this._dragState = { id: hit.id, lastX: worldX, lastY: worldY };
      this._emit(hit, 'dragstart', { shape: hit, worldX, worldY, originalEvent, dx: 0, dy: 0 } as DragPayload);
    }
  }

  private _onPointerUp(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    if (this._dragState) {
      const obj = this._pool.get(this._dragState.id);
      if (obj) this._emit(obj, 'dragend', { shape: obj, worldX, worldY, originalEvent, dx: 0, dy: 0 } as DragPayload);
      this._dragState = null;
    }
    const hit = this._pool.hitTest(worldX, worldY);
    if (hit) this._emit(hit, 'pointerup', { shape: hit, worldX, worldY, originalEvent });
  }

  private _onPointerClick(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    const hit = this._pool.hitTest(worldX, worldY);
    if (hit) this._emit(hit, 'click', { shape: hit, worldX, worldY, originalEvent });
  }

  // Call sites omit `type` — we stamp it here so the public payload is always self-describing.
  private _emit(obj: ShapeObject, event: ShapeEventType, payload: Omit<ShapeEventPayload, 'type'> | Omit<DragPayload, 'type'>): void {
    const stamped = Object.assign(payload, { type: event }) as ShapeEventPayload | DragPayload;
    // Shape-specific listeners
    const byShape = this._listeners.get(obj.id);
    if (byShape) {
      byShape.get(event)?.forEach(h => (h as AnyHandler)(stamped as never));
    }
    // Wildcard listeners
    const wildcard = this._listeners.get('*');
    if (wildcard) {
      wildcard.get(event)?.forEach(h => (h as AnyHandler)(stamped as never));
    }
    // Global EventBus — shape:* namespace
    if (this._ctx) {
      const busPayload = { shapeId: obj.id, worldX: stamped.worldX, worldY: stamped.worldY, originalEvent: stamped.originalEvent };
      const dragPayload = stamped as DragPayload;
      const isDrag = event === 'dragstart' || event === 'dragmove' || event === 'dragend';
      this._ctx.events.emit(
        `shape:${event}` as `shape:${ShapeEventType}`,
        isDrag ? { ...busPayload, dx: dragPayload.dx, dy: dragPayload.dy } : busPayload as never,
      );
    }
  }
}
