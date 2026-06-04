import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { EdgePathType } from '@invana/graph';

import { OptionPicker } from './OptionPicker';
import type { ToolbarIcon, TooltipSide } from './types';
import { useEdgeType } from '../hooks/useEdgeType';

export interface EdgeTypePickerProps {
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /** Trigger label. Default `'Edge'`. */
  label?: string;
  /** Initially-selected path type. Default: the layer's current edge default. */
  initial?: EdgePathType;
  /** Path types to expose, in order. Default: straight / orth / bezier / rounded / smooth. */
  types?: readonly EdgePathType[];
  /** Optional key → human label map. Default: the built-in path-type labels. */
  labels?: Record<string, string>;
  /** Per-option icons (key → icon component), surfaced on the trigger + items. */
  icons?: Record<string, ToolbarIcon>;
  /** Dropdown alignment. */
  align?: 'start' | 'center' | 'end';
  /** Side the trigger tooltip is placed on. */
  tooltipSide?: TooltipSide;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring edge-routing selector: a dropdown that re-routes **every** edge in
 * the layer via {@link useEdgeType} (`GraphLayer.setEdgeDefaults`). Mirrors
 * {@link SelectModePicker} / {@link LayoutPicker} — consume the hook, render an
 * {@link OptionPicker}. Per-option icons are supported via `icons`.
 */
export function EdgeTypePicker({
  layerId,
  label = 'Edge',
  initial,
  types,
  labels,
  icons,
  align,
  tooltipSide,
  canvas,
  className,
}: EdgeTypePickerProps) {
  const { edgeType, edgeTypeOptions, setEdgeType } = useEdgeType(
    {
      ...(layerId ? { layerId } : {}),
      ...(initial ? { initial } : {}),
      ...(types ? { types } : {}),
      ...(labels ? { labels } : {}),
    },
    canvas,
  );
  return (
    <OptionPicker
      label={label}
      value={edgeType}
      options={edgeTypeOptions}
      icons={icons}
      onChange={setEdgeType}
      align={align}
      tooltipSide={tooltipSide}
      className={className}
    />
  );
}
