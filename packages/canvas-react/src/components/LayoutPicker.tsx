import type { Canvas as EngineCanvas } from '@invana/canvas';

import { OptionPicker } from './OptionPicker';
import type { TooltipSide } from './types';
import { useLayout, type LayoutFactory } from '../hooks/useLayout';

export interface LayoutPickerProps {
  /** Map of layout key → factory producing a fresh layout instance. Memoize it. */
  layouts: Record<string, LayoutFactory>;
  /** Trigger label. Default `'Layout'`. */
  label?: string;
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /** Padding for the post-layout fit. Default `80`. */
  fitPadding?: number;
  /** Initially-selected key. Default: first key. */
  initial?: string;
  /** Optional key → human label map. Default: identity. */
  labels?: Record<string, string>;
  /** Dropdown alignment. */
  align?: 'start' | 'center' | 'end';
  /** Side the trigger tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring layout selector: a dropdown that applies the chosen layout via
 * {@link useLayout}. Layouts come from separate packages, so the consumer
 * supplies the factory map.
 */
export function LayoutPicker({
  layouts,
  label = 'Layout',
  layerId,
  fitPadding,
  initial,
  labels,
  align,
  tooltipSide,
  canvas,
  className,
}: LayoutPickerProps) {
  const { layout, layoutOptions, applyLayout } = useLayout(
    layouts,
    {
      ...(layerId ? { layerId } : {}),
      ...(fitPadding !== undefined ? { fitPadding } : {}),
      ...(initial ? { initial } : {}),
      ...(labels ? { labels } : {}),
    },
    canvas,
  );
  return (
    <OptionPicker
      label={label}
      value={layout}
      options={layoutOptions}
      onChange={applyLayout}
      align={align}
      tooltipSide={tooltipSide}
      className={className}
    />
  );
}
