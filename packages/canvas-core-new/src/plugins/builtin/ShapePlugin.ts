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
import type { ShapeEventType } from './shape-plugin/spec/events.js';
import type { ShapeObject } from './shape-plugin/ShapeObject.js';
import type { LODThresholds } from './shape-plugin/LODController.js';
import {
  ShapeClickEvent,
  ShapeDblClickEvent,
  ShapeContextMenuEvent,
  ShapePointerOverEvent,
  ShapePointerOutEvent,
  ShapePointerMoveEvent,
  ShapePointerDownEvent,
  ShapePointerUpEvent,
  ShapeDragStartEvent,
  ShapeDragMoveEvent,
  ShapeDragEndEvent,
  type ShapeEventFields,
  type ShapeDragEventFields,
} from './shape-plugin/ShapeEvents.js';

export type { ShapeSpec, ShapeType };
export type { ShapeAnimations };

/**
 * Construction options for {@link ShapePlugin}.
 */
export interface ShapePluginOptions {
  /** Plugin instance key — used as the layer id prefix. Defaults to `'shapes'`. */
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

/**
 * `ShapePlugin` — a high-performance canvas plugin for rendering large numbers of interactive,
 * animated shapes.
 *
 * @remarks
 * Unlike {@link DrawingPlugin} (which uses a single shared `PIXI.Graphics`), each shape managed
 * by `ShapePlugin` owns its own `PIXI.Graphics` + `Container` pair ({@link ShapeObject}).
 * This enables five layered performance systems:
 *
 * 1. **Viewport culling** — RBush R-tree spatial index; only shapes inside the viewport AABB
 *    are attached to the PixiJS scene graph.
 * 2. **LOD (Level of Detail)** — at low zoom shapes degrade to 2 px dots; labels only appear
 *    above zoom 1.5.
 * 3. **Animated-only ticker** — only shapes with active animations receive per-frame updates.
 * 4. **Dirty-flag redraws** — `ShapeObject.draw()` is only called when something actually changed.
 * 5. **Halo object pool** — pre-allocated `PIXI.Graphics` instances rented/returned on hover.
 *
 * @example
 * ```ts
 * const shapes = new ShapePlugin({ fitOnRender: true });
 * await canvas.plugins.register(shapes);
 *
 * shapes.setData([
 *   { id: 'n1', type: 'circle', x: 0, y: 0, radius: 30,
 *     fill: { type: 'solid', color: '#3fcbeb' } },
 * ]);
 *
 * canvas.events.on('shape:click', ({ shapeId }) => console.log('clicked', shapeId));
 * ```
 */
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

  // Drag state
  private _dragState: { id: string; lastX: number; lastY: number } | null = null;

  // ── Static texture registry ───────────────────────────────────────────────
  /**
   * Pre-load and register a GPU texture under a key so that shapes can reference
   * it via `fill: { type: 'texture', src: key }` or `fill: { type: 'icon', src: key }`.
   *
   * @remarks
   * Safe to call multiple times with the same key — the asset is only fetched once.
   * Must be called **before** `setData()` for shapes that use the texture.
   *
   * @param key - The lookup key used in `ShapeSpec.fill.src`.
   * @param url - Remote or local asset URL.
   */
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

  /**
   * Called by {@link PluginSystem} when the plugin is registered on a canvas.
   * Wires all sub-systems: pool, scene, LOD, halo pool, camera tracker, and animation ticker.
   *
   * @param ctx - The plugin context provided by the canvas.
   */
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
    ctx.events.on('canvas:pointermove', (e) => {
      this._onPointerMove(e.worldX, e.worldY, e.nativeEvent);
    });
    ctx.events.on('canvas:pointerdown', (e) => {
      this._onPointerDown(e.worldX, e.worldY, e.nativeEvent);
    });
    ctx.events.on('canvas:pointerup', (e) => {
      this._onPointerUp(e.worldX, e.worldY, e.nativeEvent);
    });
    ctx.events.on('canvas:clicked', (e) => {
      this._onPointerClick(e.worldX, e.worldY, e.nativeEvent);
    });
    ctx.events.on('canvas:dblclicked', (e) => {
      this._onPointerDblClick(e.worldX, e.worldY, e.nativeEvent);
    });
    ctx.events.on('canvas:contextmenu', (e) => {
      this._onPointerContextMenu(e.worldX, e.worldY, e.nativeEvent);
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

  /**
   * Replace all current shapes with `specs`.
   *
   * @remarks
   * Clears existing shapes, adds each spec, optionally fits the camera, then
   * flushes the camera tracker to resolve initial visibility.
   *
   * @param specs - Array of shape specifications to render.
   */
  setData(specs: ShapeSpec[]): void {
    this.clear();
    for (const spec of specs) {
      this._add(spec);
    }
    if (this._fitOnRender) this.fit(this._fitPadding);
    // flush AFTER fit so the cull uses the final camera position, not the default
    this._cameraTracker.flush();
  }

  /**
   * Add a single shape to the scene.
   *
   * @param spec - The shape specification to add.
   */
  add(spec: ShapeSpec): void {
    this._add(spec);
    this._cameraTracker.flush();
  }

  /**
   * Partially update a shape’s spec by id.
   *
   * @remarks
   * Merges `partial` into the existing spec, recomputes the spatial bbox,
   * and triggers a redraw if the shape is currently visible.
   *
   * @param id - Id of the shape to update.
   * @param partial - Key–value pairs to merge into the shape’s spec.
   */
  update(id: string, partial: Record<string, unknown>): void {
    const obj = this._pool.get(id);
    if (!obj) return;
    this._pool.updateBBox(obj); // recompute after update
    this._scene.redraw(id);
    obj.update(partial, this._scene.detail);
    this._pool.updateBBox(obj);
  }

  /**
   * Remove a shape from the scene and free its resources.
   *
   * @param id - Id of the shape to remove.
   */
  remove(id: string): void {
    this._scene.evict(id);
    this._ticker?.stop(id);
    this._halos.return(id);
    this._pool.get(id)?.destroy();
    this._pool.remove(id);
  }

  /**
   * Retrieve the internal {@link ShapeObject} for a shape by id.
   *
   * @param id - Shape id.
   * @returns The `ShapeObject`, or `undefined` if not found.
   */
  get(id: string): ShapeObject | undefined {
    return this._pool.get(id);
  }

  /**
   * Remove all shapes, stop all animations, and release all halo objects.
   */
  clear(): void {
    this._scene.clear();
    this._ticker?.stopAll();
    this._halos.returnAll();
    this._pool.clear();
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

  /**
   * Start one or more animations on a shape.
   *
   * @remarks
   * Each key in `animations` is an animation type name; its value is the
   * options for that type. Multiple animations can run simultaneously on the
   * same shape — calling `animate` again with the same type hot-swaps the
   * options without stopping other running animations.
   *
   * @param id         - Id of the shape to animate.
   * @param animations - Map of type → options (e.g. `{ breathe: { amplitude: 0.12 } }`).
   */
  animate(id: string, animations: ShapeAnimations): void {
    const obj = this._pool.get(id);
    if (!obj || !this._ticker) return;
    this._ticker.start(obj, animations);
  }

  /**
   * Stop an active animation on a shape.
   *
   * @param id        - Id of the shape.
   * @param animType  - Animation type to stop (e.g. `'breathe'`, `'marchingAnts'`).
   *                    Omit to stop all animations on the shape.
   */
  stopAnimation(id: string, animType?: string): void {
    this._ticker?.stop(id, animType);
    // Return pulse halo if pulse was stopped (or all animations cleared)
    if (!animType || animType === 'pulse') this._halos.return(id);
  }

  /**
   * Destroy the plugin. Stops the animation ticker, returns all halos,
   * and clears the shape pool.
   * Called automatically by {@link PluginSystem.unregister}.
   */
  destroy(): void {
    this._ticker?.destroy();
    this._halos.destroy();
    this._pool.clear();
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
      if (obj) this._emitBus(obj, 'dragmove', worldX, worldY, originalEvent, dx, dy);
      return;
    }

    // ── Hover ───────────────────────────────────────────────────────────────
    const hit = this._pool.hitTest(worldX, worldY);

    if (hit?.id !== this._lastHover) {
      if (this._lastHover) {
        const prev = this._pool.get(this._lastHover);
        if (prev) {
          this._emitBus(prev, 'pointerout', worldX, worldY, originalEvent);
          if (this._lod.current >= 2) this._halos.return(this._lastHover);
        }
      }
      if (hit) {
        this._emitBus(hit, 'pointerover', worldX, worldY, originalEvent);
        if (this._lod.current >= 2 && hit.spec.halo) this._halos.rent(hit);
        if (hit.spec.cursor) this._ctx.canvasElement.style.cursor = hit.spec.cursor;
      } else {
        this._ctx.canvasElement.style.cursor = '';
      }
      this._lastHover = hit?.id ?? null;
    }

    if (hit) this._emitBus(hit, 'pointermove', worldX, worldY, originalEvent);
  }

  private _onPointerDown(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    const hit = this._pool.hitTest(worldX, worldY);
    if (!hit) return;
    this._emitBus(hit, 'pointerdown', worldX, worldY, originalEvent);
    if (hit.spec.draggable) {
      this._dragState = { id: hit.id, lastX: worldX, lastY: worldY };
      this._emitBus(hit, 'dragstart', worldX, worldY, originalEvent, 0, 0);
    }
  }

  private _onPointerUp(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    if (this._dragState) {
      const obj = this._pool.get(this._dragState.id);
      if (obj) this._emitBus(obj, 'dragend', worldX, worldY, originalEvent, 0, 0);
      this._dragState = null;
    }
    const hit = this._pool.hitTest(worldX, worldY);
    if (hit) this._emitBus(hit, 'pointerup', worldX, worldY, originalEvent);
  }

  private _onPointerClick(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    const hit = this._pool.hitTest(worldX, worldY);
    if (hit) this._emitBus(hit, 'click', worldX, worldY, originalEvent);
  }

  private _onPointerDblClick(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    const hit = this._pool.hitTest(worldX, worldY);
    if (hit) this._emitBus(hit, 'dblclick', worldX, worldY, originalEvent);
  }

  private _onPointerContextMenu(worldX: number, worldY: number, originalEvent: PointerEvent): void {
    const hit = this._pool.hitTest(worldX, worldY);
    if (hit) this._emitBus(hit, 'contextmenu', worldX, worldY, originalEvent);
  }

  // Emit a shape interaction onto the global EventBus (shape:* namespace).
  // All consumers listen via canvas.events.on('shape:click', ...) etc.
  private _emitBus(
    obj: ShapeObject,
    event: ShapeEventType,
    worldX: number,
    worldY: number,
    nativeEvent: PointerEvent,
    dx?: number,
    dy?: number,
  ): void {
    const base: ShapeEventFields = { shapeId: obj.id, worldX, worldY, nativeEvent };
    const drag: ShapeDragEventFields = { ...base, dx: dx ?? 0, dy: dy ?? 0 };
    switch (event) {
      case 'click':       return this._ctx.events.emit('shape:click',       new ShapeClickEvent(base));
      case 'dblclick':    return this._ctx.events.emit('shape:dblclick',    new ShapeDblClickEvent(base));
      case 'contextmenu': return this._ctx.events.emit('shape:contextmenu', new ShapeContextMenuEvent(base));
      case 'pointerover': return this._ctx.events.emit('shape:pointerover', new ShapePointerOverEvent(base));
      case 'pointerout':  return this._ctx.events.emit('shape:pointerout',  new ShapePointerOutEvent(base));
      case 'pointermove': return this._ctx.events.emit('shape:pointermove', new ShapePointerMoveEvent(base));
      case 'pointerdown': return this._ctx.events.emit('shape:pointerdown', new ShapePointerDownEvent(base));
      case 'pointerup':   return this._ctx.events.emit('shape:pointerup',   new ShapePointerUpEvent(base));
      case 'dragstart':   return this._ctx.events.emit('shape:dragstart',   new ShapeDragStartEvent(drag));
      case 'dragmove':    return this._ctx.events.emit('shape:dragmove',    new ShapeDragMoveEvent(drag));
      case 'dragend':     return this._ctx.events.emit('shape:dragend',     new ShapeDragEndEvent(drag));
    }
  }
}
