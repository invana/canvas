import * as elk from '@invana/graph-layout-elkjs';
import { useEffect } from 'react';
import type { GraphLayer } from '@invana/graph';

import { useCanvas } from '../CanvasContext';

// The layout package's option type isn't re-exported as a value, so we mirror
// its shape via the constructor parameter to stay decoupled.
type ElkLayoutCtorOptions = ConstructorParameters<typeof elk.ElkLayout>[0];

export interface ElkLayoutProps {
  /**
   * Layout id. When set, the layout is **registered by id** on `canvas.layouts`
   * and driven by `config.activeLayout` (config-first): `GraphCanvas` runs it
   * once data is present and re-runs on topology change — no manual `apply`.
   * When omitted, the layout is built and `apply(layer)`-ed on mount.
   */
  id?: string;
  /**
   * Id of the `<GraphLayer>` this layout drives. Default `'graph'`. The wrapper
   * looks the layer up at mount time; if it isn't registered yet, mount the
   * layout *after* the layer in JSX order.
   */
  targetLayerId?: string;
  /**
   * Padding in screen pixels for the auto-fit that runs when the solve
   * completes. `null` disables auto-fit — use that inside `GraphCanvasApp`,
   * whose `config.fitOnLoad` is the single fitter. Default `80`.
   */
  fitPadding?: number | null;
  /**
   * `ElkLayout` constructor options (`algorithm`, `direction`, `nodeSpacing`,
   * …). In the config-first path (`id` set), prefer putting these in
   * `config.layouts[id]` instead — they apply by id via `update()`.
   */
  options?: ElkLayoutCtorOptions;
}

/**
 * Declarative wrapper for `@invana/graph-layout-elkjs` `ElkLayout`.
 *
 * Two modes, matching `<D3ForceLayout>`:
 * - **Config-first (`id` set):** register the layout on `canvas.layouts` by id;
 *   `config.activeLayout` runs it (and re-runs on data/topology change).
 * - **Bare (no `id`):** build + `apply(layer)` on mount.
 *
 * Both wire `end → camera.fitContent(...)` unless `fitPadding` is `null`.
 * Unmount stops the run (config-first also unregisters).
 *
 * All inputs are init-only — remount with a new `key` to re-seed, or patch by
 * id through `canvas.update({ layouts: { [id]: … } })`.
 */
export function ElkLayout({
  id,
  targetLayerId = 'graph',
  fitPadding = 80,
  options,
}: ElkLayoutProps) {
  const canvas = useCanvas();

  useEffect(() => {
    const layer = canvas.layers.get<GraphLayer>(targetLayerId);
    if (!layer) {
      // eslint-disable-next-line no-console
      console.warn(
        `[canvas-react] <ElkLayout> could not find layer "${targetLayerId}". Make sure the corresponding <GraphLayer> is mounted earlier in the JSX tree.`,
      );
      return;
    }

    const layout = new elk.ElkLayout({
      ...(options ?? {}),
      ...(id ? { id, targetLayerId } : {}),
    } as ElkLayoutCtorOptions);

    if (fitPadding != null) {
      layout.events.on('end', ({ reason }) => {
        // `'stopped'` means the run was cancelled — by teardown (the layer may
        // already be gone) or by a superseding `apply()` (whose own
        // `'completed'` will fit).
        if (reason === 'stopped') return;
        // `fitView` is the engine's union-of-world-layer-bounds fitter (the same
        // one the Fit button uses). One frame later: `end` fires as soon as the
        // solve resolves, but positions reach the renderer through the
        // frame-coalesced flush, so fitting synchronously here would frame the
        // *previous* bounds.
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
