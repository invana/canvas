import { NavHorizontal } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { ClearButton, OptionPicker, Panel } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';

export interface GraphToolbarProps {
  /** Layout switcher. */
  layout: string;
  layoutOptions: Record<string, string>;
  onLayoutChange: (value: string) => void;

  /** Selection-mode switcher (e.g. click / brush / lasso). */
  selectMode: string;
  selectModeOptions: Record<string, string>;
  onSelectModeChange: (value: string) => void;

  /** Clear button — layer to clear. Default `'graph'`. */
  clearLayerId?: string;
  clearIcon?: ToolbarIcon;
  /** Explicit canvas instance; forwarded to the self-wiring {@link ClearButton}. Defaults to context canvas. */
  canvas?: EngineCanvas | null;

  /** Where the toolbar pins within the canvas host. Default `'top-center'`. */
  position?: PanelPosition;
  className?: string;
}

/**
 * Turnkey **horizontal** graph toolbar: a layout picker + selection-mode picker
 * + clear action, grouped in a `@invana/ui` `NavHorizontal`. Engine-agnostic —
 * every action is a callback the consumer wires to the engine. Compose the
 * underlying {@link OptionPicker} / {@link ClearButton} primitives directly for
 * a custom arrangement.
 *
 * Self-positioning: it wraps itself in a {@link Panel}, so it overlays the
 * canvas host directly — render it as a child of `<Canvas>` (no hand-rolled
 * absolute wrapper needed). Positioning is the Panel's job (`position`); there
 * is no internal `align` knob.
 */
export function GraphToolbar({
  layout,
  layoutOptions,
  onLayoutChange,
  selectMode,
  selectModeOptions,
  onSelectModeChange,
  clearLayerId = 'graph',
  clearIcon,
  canvas,
  position = 'top-center',
  className,
}: GraphToolbarProps) {
  return (
    <Panel position={position} orientation="horizontal">
      <NavHorizontal
        className={className}
        center={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <OptionPicker
              label="Layout"
              value={layout}
              options={layoutOptions}
              onChange={onLayoutChange}
            />
            <OptionPicker
              label="Select"
              value={selectMode}
              options={selectModeOptions}
              onChange={onSelectModeChange}
            />
            <ClearButton icon={clearIcon} layerId={clearLayerId} canvas={canvas} />
          </div>
        }
      />
    </Panel>
  );
}
