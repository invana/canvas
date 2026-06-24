import { type ReactNode, useCallback, useState } from 'react';
import { Gauge } from 'lucide-react';

import { ToolbarItems } from '../components';
import { DevInfoLayer, type DevInfoLayerProps } from '../layers/DevInfoLayer';

export interface UseDevToolOptions extends Omit<DevInfoLayerProps, 'enabled'> {
  /** Start with the overlay shown. Default `false`. */
  defaultOn?: boolean;
}

export interface UseDevToolResult {
  /** Whether the overlay is currently shown. */
  on: boolean;
  /** Flip the overlay on/off. */
  toggle: () => void;
  /** The header toggle button (a gauge `<ToolbarItems>`) — drop in a toolbar slot. */
  button: ReactNode;
  /** `<DevInfoLayer>` while `on`, else `null` — drop in as a canvas child. */
  layer: ReactNode;
}

/**
 * Turnkey dev-overlay toggle: a header button wired to a `<DevInfoLayer>`,
 * sharing one piece of state. The button and the layer mount in different parts
 * of the tree (a toolbar slot vs. a canvas child), so this hook owns the shared
 * `on` state and hands back both nodes. Forward any `<DevInfoLayer>` prop
 * (`corner`, `margin`, colours, …) to place / style the overlay.
 *
 * ```tsx
 * const dev = useDevTool({ corner: 'top-left', margin: { y: 48 } });
 * // header.right slot: dev.button   ·   canvas child: dev.layer
 * ```
 */
export function useDevTool({
  defaultOn = false,
  ...layerProps
}: UseDevToolOptions = {}): UseDevToolResult {
  const [on, setOn] = useState(defaultOn);
  const toggle = useCallback(() => setOn((v) => !v), []);
  const button = (
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
          onToggle: toggle,
        },
      ]}
    />
  );
  const layer = on ? <DevInfoLayer enabled {...layerProps} /> : null;
  return { on, toggle, button, layer };
}
