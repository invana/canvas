import type { Canvas as EngineCanvas } from '@invana/canvas';

import { OptionPicker } from './OptionPicker';
import type { ToolbarIcon, TooltipSide } from './types';
import { useSelectMode } from '../hooks/useSelectMode';

export interface SelectModePickerProps {
  /** Map of mode key → behaviour id (e.g. `{ click: 'click-select', ... }`). Memoize it. */
  behaviourIds: Record<string, string>;
  /** Trigger label. Default `'Select'`. */
  label?: string;
  /** Initially-active mode key. Default: first key. */
  initial?: string;
  /** Optional key → human label map. Default: identity. */
  labels?: Record<string, string>;
  /** Optional mode key → icon map. Shown on the trigger and beside each option. */
  icons?: Record<string, ToolbarIcon>;
  /** Dropdown alignment. */
  align?: 'start' | 'center' | 'end';
  /** Side the trigger tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring selection-mode selector: a dropdown that enables exactly one of
 * the mapped behaviours via {@link useSelectMode}. The consumer must have
 * registered those behaviours.
 */
export function SelectModePicker({
  behaviourIds,
  label = 'Select',
  initial,
  labels,
  icons,
  align,
  tooltipSide,
  canvas,
  className,
}: SelectModePickerProps) {
  const { mode, modeOptions, setMode } = useSelectMode(
    behaviourIds,
    { ...(initial ? { initial } : {}), ...(labels ? { labels } : {}) },
    canvas,
  );
  return (
    <OptionPicker
      label={label}
      value={mode}
      options={modeOptions}
      icons={icons}
      onChange={setMode}
      align={align}
      tooltipSide={tooltipSide}
      className={className}
    />
  );
}
