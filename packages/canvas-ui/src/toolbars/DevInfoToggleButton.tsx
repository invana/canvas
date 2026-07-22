import { Gauge } from 'lucide-react';
import { useContext, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import { CanvasContext, DevInfoLayer, type DevInfoLayerProps } from '@invana/canvas-react';

import { ToolbarItems } from '../components';

export interface DevInfoToggleButtonProps extends Omit<DevInfoLayerProps, 'enabled'> {
  /** Start with the overlay shown. Default `false`. */
  defaultOn?: boolean;
  /**
   * Target a specific engine from outside its provider subtree. Omit inside a
   * `<Canvas>` / `GraphCanvasApp` tree — the button binds to the nearest root.
   */
  canvas?: Canvas | null;
}

/**
 * Turnkey dev-overlay toggle — a **single** self-wiring button that renders both
 * the gauge toggle *and* (while on) the `<DevInfoLayer>` (FPS, pointer coords,
 * zoom). Drop it anywhere under a canvas root (typically a `header.right` slot);
 * there is no separate layer node to place. The overlay is **screen-fixed** and
 * positions itself from `corner` / `margin`, so its React-tree location is
 * irrelevant — it only needs to render under the canvas context. Forward any
 * `<DevInfoLayer>` option (`corner`, `margin`, colours, …).
 *
 * ```tsx
 * header={{ right: () => <DevInfoToggleButton corner="top-left" margin={{ y: 48 }} /> }}
 * ```
 */
export function DevInfoToggleButton({
  defaultOn = false,
  canvas,
  ...layerOptions
}: DevInfoToggleButtonProps) {
  const [on, setOn] = useState(defaultOn);
  // Nullable read (not `useCanvas()`, which throws): the button may mount in a
  // header before the engine is ready. Gate the layer on a resolved canvas.
  const contextCanvas = useContext(CanvasContext);
  const resolved = canvas ?? contextCanvas;
  return (
    <>
      <ToolbarItems
        orientation="horizontal"
        items={[
          {
            type: 'toggle',
            key: 'dev-info',
            icon: Gauge,
            label: 'Dev overlay: off',
            activeLabel: 'Dev overlay: on',
            active: on,
            onToggle: () => setOn((v) => !v),
          },
        ]}
      />
      {on && resolved ? <DevInfoLayer enabled {...layerOptions} /> : null}
    </>
  );
}
