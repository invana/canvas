import { useEffect } from 'react';
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
  /**
   * Notified with the active mode key — on the initial enabled mode and on every
   * switch. Lets sibling chrome (e.g. a footer `GraphHintBar`) mirror the mode.
   * Memoize it (`useCallback`) to avoid re-firing on every render.
   */
  onModeChange?: (mode: string) => void;
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
  onModeChange,
  canvas,
  className,
}: SelectModePickerProps) {
  const { mode, modeOptions, setMode } = useSelectMode(
    behaviourIds,
    { ...(initial ? { initial } : {}), ...(labels ? { labels } : {}) },
    canvas,
  );

  // Surface the active mode upward — fires for the initial enabled mode and on
  // every switch (covers both via the `mode` dependency).
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

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
