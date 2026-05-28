import { NavHorizontal } from '@invana/ui';

import { Panel } from '../layout/Panel';
import type { PanelPosition } from '../layout/types';
import { ClearButton } from './ClearButton';
import { OptionPicker } from './OptionPicker';
import type { ToolbarIcon } from './types';

export interface GraphToolbarProps {
  /** Layout switcher. */
  layout: string;
  layoutOptions: Record<string, string>;
  onLayoutChange: (value: string) => void;

  /** Selection-mode switcher (e.g. click / brush / lasso). */
  selectMode: string;
  selectModeOptions: Record<string, string>;
  onSelectModeChange: (value: string) => void;

  /** Clear-canvas action. */
  onClear: () => void;
  clearIcon?: ToolbarIcon;

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
  onClear,
  clearIcon,
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
            <ClearButton onClear={onClear} icon={clearIcon} />
          </div>
        }
      />
    </Panel>
  );
}
