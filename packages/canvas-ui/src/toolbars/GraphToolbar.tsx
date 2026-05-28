import { NavHorizontal } from '@invana/ui';

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

  className?: string;
}

/**
 * Turnkey **horizontal** graph toolbar: a layout picker + selection-mode picker
 * + clear action, laid out in a `@invana/ui` `NavHorizontal`. Engine-agnostic —
 * every action is a callback the consumer wires to the engine. Compose the
 * underlying {@link OptionPicker} / {@link ClearButton} primitives directly for
 * a custom arrangement.
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
  className,
}: GraphToolbarProps) {
  return (
    <NavHorizontal
      className={className}
      left={
        <OptionPicker
          label="Layout"
          value={layout}
          options={layoutOptions}
          onChange={onLayoutChange}
        />
      }
      center={
        <OptionPicker
          label="Select"
          value={selectMode}
          options={selectModeOptions}
          onChange={onSelectModeChange}
        />
      }
      right={<ClearButton onClear={onClear} icon={clearIcon} />}
    />
  );
}
