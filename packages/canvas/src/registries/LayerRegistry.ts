/**
 * `LayerRegistry` — stores the Layers added to a Canvas.
 *
 * Architecture: see `architecture-proposal.md` §2.4 (CanvasContext.layers).
 *
 * **Responsibilities**
 *   - Add / remove (with mount / unmount lifecycle).
 *   - Typed `get<T>(id)`.
 *   - `byZOrder()` iteration — used by the Canvas tick.
 *   - Fires `'layer:added'` / `'layer:removed'` on the bus.
 *
 * **Lifecycle wiring**
 *
 * The registry doesn't itself construct the `CanvasContext` — it would be
 * circular (the registry is a field of the context). Instead the Canvas
 * passes a `getContext()` thunk; `add(layer)` resolves it at the moment of
 * mount. This keeps the registry decoupled from the context's full shape.
 */

import type { CanvasContext } from '../context/CanvasContext';
import type { CanvasEventBus } from '../events/CanvasEventBus';
import type { ILayer } from '../layers/Layer';

export interface LayerRegistryOptions {
  /**
   * Resolves the `CanvasContext` at the moment of mount, or `undefined` before
   * the Canvas is initialised. Layers added pre-init are stored and mounted
   * later by `mountAll()`.
   */
  getContext: () => CanvasContext | undefined;
  /** Bus for `layer:added` / `layer:removed` events. */
  bus: CanvasEventBus;
}

export class LayerRegistry {
  private readonly layers: Map<string, ILayer> = new Map();
  private readonly getContext: () => CanvasContext | undefined;
  private readonly bus: CanvasEventBus;

  /** Cached z-sorted view; invalidated on add/remove/setZIndex. */
  private zOrderCache: ILayer[] | null = null;

  constructor(opts: LayerRegistryOptions) {
    this.getContext = opts.getContext;
    this.bus = opts.bus;
  }

  /** Number of registered layers. */
  get size(): number {
    return this.layers.size;
  }

  /**
   * Add a Layer to the canvas. Mounts immediately if the Canvas is initialised;
   * otherwise the layer waits for `mountAll()` (called by `Canvas.init`). Fires
   * `layer:added`. Throws if `id` is already registered.
   */
  add(layer: ILayer): void {
    if (this.layers.has(layer.id)) {
      throw new Error(`LayerRegistry: layer "${layer.id}" already registered`);
    }
    this.layers.set(layer.id, layer);
    this.zOrderCache = null;
    const ctx = this.getContext();
    if (ctx) layer.mount(ctx);
    this.bus.emit('layer:added', { id: layer.id });
  }

  /** Mount every not-yet-mounted layer. Called by `Canvas.init` once the context exists. */
  mountAll(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    for (const layer of this.layers.values()) {
      if (!layer.mounted) layer.mount(ctx);
    }
  }

  /**
   * Remove a Layer. Calls `layer.unmount()` and fires `layer:removed`.
   * No-op if `id` isn't registered.
   */
  remove(id: string): void {
    const layer = this.layers.get(id);
    if (!layer) return;
    this.layers.delete(id);
    this.zOrderCache = null;
    layer.unmount();
    this.bus.emit('layer:removed', { id });
  }

  /** Typed get by id. Returns `undefined` if not found. */
  get<T extends ILayer = ILayer>(id: string): T | undefined {
    return this.layers.get(id) as T | undefined;
  }

  has(id: string): boolean {
    return this.layers.has(id);
  }

  /** Snapshot of all layers in insertion order. */
  list(): readonly ILayer[] {
    return Array.from(this.layers.values());
  }

  /**
   * Iterate layers in z-order (low → high). The Canvas tick walks layers in
   * z-order to flush dirty work; rendering order is then determined by
   * pixi's child order (handled by `SurfaceManager.setWorldLayerZ`).
   *
   * The result is cached and reused until `add` / `remove` / `setZIndex` invalidates.
   */
  byZOrder(): readonly ILayer[] {
    if (this.zOrderCache !== null) return this.zOrderCache;
    const arr = Array.from(this.layers.values());
    arr.sort((a, b) => a.zIndex - b.zIndex);
    this.zOrderCache = arr;
    return arr;
  }

  /**
   * Update a layer's `zIndex` and propagate to surfaces. Invalidates the
   * z-order cache. No-op if the layer isn't registered.
   */
  setZIndex(id: string, zIndex: number): void {
    const layer = this.layers.get(id);
    if (!layer) return;
    layer.zIndex = zIndex;
    this.zOrderCache = null;
    // Surface z-order is handled by the layer's mount path (it knows whether
    // it's a WorldLayer or ScreenLayer). For now we just update the field;
    // visual reordering happens on the next render pass by the layer's hook.
  }

  /**
   * Tear down every registered layer. Called on Canvas destroy.
   * Iteration is over a snapshot so unmount-triggered side effects don't
   * corrupt the loop.
   */
  clear(): void {
    for (const id of [...this.layers.keys()]) this.remove(id);
  }
}
