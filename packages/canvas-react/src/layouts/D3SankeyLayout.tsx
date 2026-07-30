import * as d3Sankey from '@invana/graph-layout-d3-sankey';
import { useEffect } from 'react';
import type { GraphLayer } from '@invana/graph';

import { useCanvas } from '../CanvasContext';

// The layout package's option type isn't re-exported as a value, so we mirror
// its shape via the constructor parameter to stay decoupled.
type D3SankeyLayoutCtorOptions = ConstructorParameters<typeof d3Sankey.D3SankeyLayout>[0];

export interface D3SankeyLayoutProps {
  /**
   * Layout id. When set, the layout is **registered by id** on `canvas.layouts`
   * and driven by `config.activeLayout` (config-first). When omitted, the
   * layout is built and `apply(layer)`-ed on mount.
   */
  id?: string;
  /**
   * Id of the `<GraphLayer>` this layout drives. Default `'graph'`. The wrapper
   * looks the layer up at mount time; if it isn't registered yet, mount the
   * layout *after* the layer in JSX order.
   */
  targetLayerId?: string;
  /**
   * Padding in screen pixels for the auto-fit that runs when the layout
   * completes. `null` disables auto-fit — use that inside `GraphCanvasApp`,
   * whose `config.fitOnLoad` is the single fitter. Default `80`.
   */
  fitPadding?: number | null;
  /**
   * `D3SankeyLayout` constructor options (`width`, `height`, `nodeWidth`,
   * `nodePadding`, `align`, …). In the config-first path (`id` set), prefer
   * putting these in `config.layouts[id]` — they apply by id via `update()`.
   */
  options?: D3SankeyLayoutCtorOptions;
}

/**
 * Declarative wrapper for `@invana/graph-layout-d3-sankey` `D3SankeyLayout`.
 *
 * The sankey layout writes node positions **and** per-edge ribbon hints, so it
 * pairs with an edge style that reads them. Two modes, matching
 * `<D3ForceLayout>`: config-first (`id` set → registered, run by
 * `config.activeLayout`) or bare (`apply(layer)` on mount). Both wire
 * `end → camera.fitContent(...)` unless `fitPadding` is `null`.
 *
 * All inputs are init-only — remount with a new `key`, or patch by id through
 * `canvas.update({ layouts: { [id]: … } })`.
 */
export function D3SankeyLayout({
  id,
  targetLayerId = 'graph',
  fitPadding = 80,
  options,
}: D3SankeyLayoutProps) {
  const canvas = useCanvas();

  useEffect(() => {
    const layer = canvas.layers.get<GraphLayer>(targetLayerId);
    if (!layer) {
      // eslint-disable-next-line no-console
      console.warn(
        `[canvas-react] <D3SankeyLayout> could not find layer "${targetLayerId}". Make sure the corresponding <GraphLayer> is mounted earlier in the JSX tree.`,
      );
      return;
    }

    const layout = new d3Sankey.D3SankeyLayout({
      ...(options ?? {}),
      ...(id ? { id, targetLayerId } : {}),
    } as D3SankeyLayoutCtorOptions);

    if (fitPadding != null) {
      layout.events.on('end', ({ reason }) => {
        // A `'stopped'` end is a cancelled run (teardown, or a superseding
        // `apply()` that will fit on its own `'completed'`).
        if (reason === 'stopped') return;
        // `fitView` is the engine's union-of-world-layer-bounds fitter, one
        // frame later so the layout's positions have flushed to the renderer
        // (the flush is frame-coalesced — fitting synchronously frames the
        // pre-layout bounds).
        requestAnimationFrame(() => canvas.fitView(fitPadding));
      });
    }

    if (id) {
      canvas.layouts.add(layout);
      return () => {
        canvas.layouts.remove(id);
      };
    }

    void layout.apply(layer);
    return () => {
      layout.stop();
    };
    // Identity props only; option changes need a remount (or a config patch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, targetLayerId]);

  return null;
}
