import { useEffect } from 'react';
import { D3ForceLayout as EngineD3ForceLayout } from '@invana/graph-layout-d3-force';
import type { GraphLayer as EngineGraphLayer } from '@invana/graph';

import { useCanvas } from '../CanvasContext';

// The layout package's option type isn't re-exported as a value, so we mirror
// its shape via the constructor parameter to stay decoupled.
type D3ForceLayoutCtorOptions = ConstructorParameters<typeof EngineD3ForceLayout>[0];

export interface D3ForceLayoutProps {
  /**
   * Layout id. When set, the layout is **registered by id** on
   * `canvas.layouts` and driven by `config.activeLayout` (config-first):
   * `GraphCanvas` runs it once data is present and re-runs on topology change —
   * no manual `apply`, no `key`-remount on data switches. When omitted, the
   * legacy behaviour applies (build + `apply(layer)` on mount).
   */
  id?: string;
  /**
   * Id of the `<GraphLayer>` this layout drives. Default `'graph'`. The
   * wrapper looks the layer up at mount time; if it isn't registered yet,
   * mount the layout *after* the layer in JSX order.
   */
  targetLayerId?: string;
  /**
   * Padding in screen pixels for the auto-fit that runs when the simulation
   * settles. `null` disables auto-fit. Default `80`.
   */
  fitPadding?: number | null;
  /**
   * D3ForceLayout constructor options (`charge`, `link`, `center`, …). In the
   * config-first path (`id` set), prefer putting these in
   * `config.layouts[id]` instead — they apply by id via `update()`.
   */
  options?: D3ForceLayoutCtorOptions;
}

/**
 * Declarative wrapper for `@invana/graph-layout-d3-force` `D3ForceLayout`.
 *
 * Two modes:
 * - **Config-first (`id` set):** register the layout on `canvas.layouts` by id;
 *   `config.activeLayout` runs it (and re-runs on data/topology change). Wires
 *   `end → camera.fitContent(...)` unless `fitPadding` is `null`.
 * - **Legacy (no `id`):** build + `apply(layer)` on mount, same `end`-fit.
 *
 * Unmount: `layout.stop()` (config-first also unregisters). The simulation
 * cancels and emits its final `end` event with `reason: 'stopped'`.
 *
 * All inputs are init-only — remount with a new `key` to reseed the sim.
 */
export function D3ForceLayout({
  id,
  targetLayerId = 'graph',
  fitPadding = 80,
  options,
}: D3ForceLayoutProps) {
  const canvas = useCanvas();

  useEffect(() => {
    const layer = canvas.layers.get<EngineGraphLayer>(targetLayerId);
    if (!layer) {
      // eslint-disable-next-line no-console
      console.warn(
        `[canvas-react] <D3ForceLayout> could not find layer "${targetLayerId}". Make sure the corresponding <GraphLayer> is mounted earlier in the JSX tree.`,
      );
      return;
    }

    const layout = new EngineD3ForceLayout({
      ...(options ?? {}),
      ...(id ? { id, targetLayerId } : {}),
    } as D3ForceLayoutCtorOptions);
    if (fitPadding != null) {
      layout.events.on('end', () => {
        canvas.camera.fitContent(layer.getBounds(), fitPadding);
      });
    }

    if (id) {
      // Config-first: register by id; `config.activeLayout` (applied by
      // <Canvas> after children mount) runs it and re-runs on topology change.
      canvas.layouts.add(layout);
      return () => {
        canvas.layouts.remove(id);
      };
    }

    // Legacy: apply on mount.
    void layout.apply(layer);
    return () => {
      layout.stop();
    };
    // Re-run when the id / target layer id changes; option object changes do
    // not re-seed (remount via key for that).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, targetLayerId]);

  return null;
}
