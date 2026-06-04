import { NavHorizontal, Separator } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, LayoutPicker, SelectModePicker } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';
import type { LayoutFactory } from '../hooks/useLayout';

export interface GraphLayoutToolbarProps {
  /** Map of layout key → factory producing a fresh layout instance. Memoize it. */
  layouts: Record<string, LayoutFactory>;
  /** Map of select-mode key → behaviour id (e.g. `{ click: 'click-select', ... }`). Memoize it. */
  selectModeBehaviourIds: Record<string, string>;
  /** Optional layout key → label map. Default: identity. */
  layoutLabels?: Record<string, string>;
  /** Optional select-mode key → label map. Default: identity. */
  selectModeLabels?: Record<string, string>;
  /** Optional select-mode key → icon map. Shown on the trigger and beside each option. */
  selectModeIcons?: Record<string, ToolbarIcon>;
  /** Initially-selected layout key. */
  initialLayout?: string;
  /** Initially-active select mode key. */
  initialSelectMode?: string;
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /** Where the toolbar pins. Default `'top-center'`. */
  position?: PanelPosition;
  /** Render without the `<Panel>` wrapper (embed in external chrome). Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Graph controls — layout selector + selection-mode selector. Both self-wire
 * ({@link useLayout} / {@link useSelectMode}), but since layouts live in
 * separate packages and mode-switching toggles consumer-registered behaviours,
 * the consumer supplies the layout factory map and the mode→behaviour-id map.
 */
export function GraphLayoutToolbar({
  layouts,
  selectModeBehaviourIds,
  layoutLabels,
  selectModeLabels,
  selectModeIcons,
  initialLayout,
  initialSelectMode,
  layerId,
  position = 'top-center',
  bare = false,
  canvas,
  className,
}: GraphLayoutToolbarProps) {
  const nav = (
    <NavHorizontal
      className={className}
      center={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LayoutPicker
            layouts={layouts}
            labels={layoutLabels}
            initial={initialLayout}
            layerId={layerId}
            canvas={canvas}
          />
          <Separator orientation="vertical" style={{ alignSelf: 'center', height: 24 }} />
          <SelectModePicker
            behaviourIds={selectModeBehaviourIds}
            labels={selectModeLabels}
            icons={selectModeIcons}
            initial={initialSelectMode}
            canvas={canvas}
          />
        </div>
      }
    />
  );

  if (bare) return nav;
  return (
    <Panel position={position} orientation="horizontal">
      {nav}
    </Panel>
  );
}
