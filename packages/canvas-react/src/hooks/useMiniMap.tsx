import { type ReactNode, useCallback, useState } from 'react';
import { Map } from 'lucide-react';

import { ToolbarItems } from '../components';
import { MiniMapLayer, type MiniMapLayerProps } from '../layers/MiniMapLayer';

export interface UseMiniMapOptions extends MiniMapLayerProps {
  /** Start with the minimap shown. Default `true`. */
  defaultOn?: boolean;
}

export interface UseMiniMapResult {
  /** Whether the minimap is currently shown. */
  on: boolean;
  /** Flip the minimap on/off. */
  toggle: () => void;
  /** The header toggle button (a map `<ToolbarItems>`) — drop in a toolbar slot. */
  button: ReactNode;
  /** `<MiniMapLayer>` while `on`, else `null` — drop in as a canvas child. */
  layer: ReactNode;
}

/**
 * Turnkey minimap toggle: a header button wired to a `<MiniMapLayer>`, sharing
 * one piece of state. The button and the layer mount in different parts of the
 * tree (a toolbar slot vs. a canvas child), so this hook owns the shared `on`
 * state and hands back both nodes. Forward any `<MiniMapLayer>` prop
 * (`graphLayerId`, `backgroundLayerId`, `position`, …) to wire / place it.
 *
 * ```tsx
 * const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
 * // header.right slot: mini.button   ·   canvas child: mini.layer
 * ```
 */
export function useMiniMap({
  defaultOn = true,
  ...layerProps
}: UseMiniMapOptions = {}): UseMiniMapResult {
  const [on, setOn] = useState(defaultOn);
  const toggle = useCallback(() => setOn((v) => !v), []);
  const button = (
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
          onToggle: toggle,
        },
      ]}
    />
  );
  const layer = on ? <MiniMapLayer {...layerProps} /> : null;
  return { on, toggle, button, layer };
}
