import { useEffect } from 'react';
import { D3ForceLayout as EngineD3ForceLayout } from '@invana/graph-layout-d3-force';
import type { GraphLayer as EngineGraphLayer } from '@invana/graph';

import { useCanvas } from '../CanvasContext';

// The layout package's option type isn't re-exported as a value, so we mirror
// its shape via the constructor parameter to stay decoupled.
type D3ForceLayoutCtorOptions = ConstructorParameters<typeof EngineD3ForceLayout>[0];

export interface D3ForceLayoutProps {
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
  /** D3ForceLayout constructor options (`charge`, `link`, `center`, …). */
  options?: D3ForceLayoutCtorOptions;
}

/**
 * Declarative wrapper for `@invana/graph-layout-d3-force` `D3ForceLayout`.
 *
 * Mount: builds a new layout, wires `end → camera.fitContent(...)` (unless
 * `fitPadding` is `null`), then calls `layout.apply(layer)`.
 *
 * Unmount: `layout.stop()`. The simulation cancels and emits its final
 * `end` event with `reason: 'stopped'`.
 *
 * All inputs are init-only — remount with a new `key` to reseed the sim.
 */
export function D3ForceLayout({
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

    const layout = new EngineD3ForceLayout(options);
    if (fitPadding != null) {
      layout.events.on('end', () => {
        canvas.camera.fitContent(layer.getBounds(), fitPadding);
      });
    }
    void layout.apply(layer);

    return () => {
      layout.stop();
    };
    // Re-run when the target layer id changes; option object changes do not
    // re-seed (remount via key for that).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, targetLayerId]);

  return null;
}
