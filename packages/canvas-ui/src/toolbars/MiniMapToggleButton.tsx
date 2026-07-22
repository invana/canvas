import { Map } from 'lucide-react';
import { useContext, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import { CanvasContext, MiniMapLayer, type MiniMapLayerProps } from '@invana/canvas-react';

import { ToolbarItems } from '../components';

export interface MiniMapToggleButtonProps extends MiniMapLayerProps {
  /** Start with the minimap shown. Default `true`. */
  defaultOn?: boolean;
  /**
   * Target a specific engine from outside its provider subtree. Omit inside a
   * `<Canvas>` / `GraphCanvasApp` tree — the button binds to the nearest root.
   */
  canvas?: Canvas | null;
}

/**
 * Turnkey minimap toggle — a **single** self-wiring button that renders both the
 * map toggle *and* (while on) the `<MiniMapLayer>`. Drop it anywhere under a
 * canvas root (typically a `header.right` slot); there is no separate layer node
 * to place. The minimap is **screen-fixed** and positions itself from `position`,
 * so its React-tree location is irrelevant — it only needs to render under the
 * canvas context. Forward any `<MiniMapLayer>` option (`graphLayerId`,
 * `backgroundLayerId`, `position`, …).
 *
 * ```tsx
 * header={{ right: () => <MiniMapToggleButton backgroundLayerId="background" position="bottom-left" /> }}
 * ```
 */
export function MiniMapToggleButton({
  defaultOn = true,
  canvas,
  ...layerOptions
}: MiniMapToggleButtonProps) {
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
            key: 'minimap',
            icon: Map,
            label: 'Minimap: off',
            activeLabel: 'Minimap: on',
            active: on,
            onToggle: () => setOn((v) => !v),
          },
        ]}
      />
      {on && resolved ? <MiniMapLayer {...layerOptions} /> : null}
    </>
  );
}
