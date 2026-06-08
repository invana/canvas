/**
 * `GraphCanvas` — the graph-domain entry point. Register layers/behaviours
 * imperatively (their classes live in code, not config); drive their visual
 * options through the serialisable `update()` / `get()` config inherited from
 * `Canvas`. `GraphCanvas` just adds graph-flavoured typed lookups.
 *
 * @example
 * ```ts
 * const gc = new GraphCanvas();
 * await gc.init({ container: el });
 *
 * // register instances imperatively:
 * gc.layers.add(new BackgroundLayer({ id: 'bg' }));
 * gc.layers.add(new GraphLayer({ id: 'graph', options: { node: { style: { bgFill: tint } } } }));
 * gc.behaviours.register(new HoverActivateBehaviour({ id: 'hover', layerId: 'graph', enabled: true }));
 *
 * const graph = gc.layer('graph')!;        // typed as GraphLayer
 * graph.setData({ nodes, edges });
 *
 * // serialisable config — drives a settings UI / save-load:
 * gc.update({ layers: { bg: { patternType: 'grid', color: 0x334155 } } });
 * ```
 */

import { Canvas } from '@invana/canvas';
import type { Behaviour, CanvasConfig, CanvasOptions, Layer, Layout } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

export class GraphCanvas extends Canvas {
  private offActiveLayout: (() => void) | null = null;

  /** Typed layer lookup; defaults to `GraphLayer`. */
  layer<T extends Layer = GraphLayer>(id: string): T | undefined {
    return this.layers.get<T>(id);
  }

  /** Typed behaviour lookup. */
  behaviour<T extends Behaviour = Behaviour>(id: string): T | undefined {
    return this.behaviours.get<T>(id);
  }

  /** Typed layout lookup. */
  layout<T extends Layout = Layout>(id: string): T | undefined {
    return this.layouts.get<T>(id);
  }

  override async init(opts: CanvasOptions): Promise<void> {
    await super.init(opts);
    this.wireActiveLayout();
  }

  override update(patch: CanvasConfig): void {
    super.update(patch);
    if (patch.activeLayout !== undefined) this.wireActiveLayout();
  }

  override destroy(): void {
    this.offActiveLayout?.();
    this.offActiveLayout = null;
    super.destroy();
  }

  /**
   * Auto-run the active layout (`config.activeLayout`) against its target
   * layer, now if it already has data and again whenever the target's topology
   * changes (nodes added / removed). Position-only updates (drags, the sim's
   * own writes) don't re-trigger it, so there's no loop.
   */
  private wireActiveLayout(): void {
    this.offActiveLayout?.();
    this.offActiveLayout = null;

    const activeId = this.get().activeLayout;
    const targetId = activeId ? this.layouts.get(activeId)?.targetLayerId : undefined;
    const layer = targetId ? this.layers.get<GraphLayer>(targetId) : undefined;
    if (!activeId || !layer) return;

    if (layer.store.nodeCount() > 0) void this.runLayout(activeId);
    this.offActiveLayout = layer.events.on('data:changed', (e) => {
      if (e.addedNodes > 0 || e.removedNodes > 0) void this.runLayout(activeId);
    });
  }
}
