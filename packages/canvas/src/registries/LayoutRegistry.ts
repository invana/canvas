/**
 * `LayoutRegistry` — stores the Layouts registered on a Canvas, addressed by id.
 *
 * Simpler than `LayerRegistry` / `BehaviourRegistry`: layouts aren't mounted,
 * z-ordered, or wired to input — they're held so `Canvas.update()` can push
 * config to them by id and consumers can fetch + `apply()` them. A graph runs
 * one layout at a time, but several may be registered (e.g. a layout picker).
 */

import type { CanvasEventBus } from '@invana/canvas-store';
import type { Layout } from '../layouts/Layout';

export interface LayoutRegistryOptions {
  bus: CanvasEventBus;
}

export class LayoutRegistry {
  private readonly layouts: Map<string, Layout> = new Map();
  private readonly bus: CanvasEventBus;

  constructor(opts: LayoutRegistryOptions) {
    this.bus = opts.bus;
  }

  get size(): number {
    return this.layouts.size;
  }

  /** Register a layout. Fires `layout:added`. Throws on duplicate id. */
  add(layout: Layout): void {
    if (this.layouts.has(layout.id)) {
      throw new Error(`LayoutRegistry: layout "${layout.id}" already registered`);
    }
    this.layouts.set(layout.id, layout);
    this.bus.emit('scene:layout:add', { id: layout.id });
  }

  /** Remove a layout, stopping it first if it exposes `stop()`. Fires `layout:removed`. */
  remove(id: string): void {
    const layout = this.layouts.get(id);
    if (!layout) return;
    (layout as { stop?: () => void }).stop?.();
    this.layouts.delete(id);
    this.bus.emit('scene:layout:remove', { id });
  }

  get<T extends Layout = Layout>(id: string): T | undefined {
    return this.layouts.get(id) as T | undefined;
  }

  has(id: string): boolean {
    return this.layouts.has(id);
  }

  list(): readonly Layout[] {
    return Array.from(this.layouts.values());
  }

  /** Stop + drop every layout. Called on Canvas destroy. */
  clear(): void {
    for (const layout of this.layouts.values()) (layout as { stop?: () => void }).stop?.();
    this.layouts.clear();
  }
}
