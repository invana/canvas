import { RichSelect, type RichSelectOption } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { ACTIVE_MENU_ITEM_CLASS } from './ControlButton';
import type { TooltipSide } from './types';
import { useZoom } from '../hooks/useZoom';
import { useFitContent } from '../hooks/useFitContent';

const DEFAULT_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

/**
 * Sentinel option value for the fit-to-content action. Never matches a zoom
 * percentage, so the fit row is never highlighted as the active preset.
 */
const FIT_VALUE = '__fit__';

export interface ZoomPickerProps {
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  /**
   * Layer id used for the fit-to-content action. Default `'graph'`.
   */
  layerId?: string;
  /**
   * Preset zoom percentages shown in the dropdown. Default
   * `[25, 50, 75, 100, 125, 150, 200, 300, 400]`.
   */
  presets?: number[];
  /**
   * Show the "Fit / Reset View" action at the top of the dropdown.
   * Default `true`.
   */
  showFit?: boolean;
  /** Label for the fit action. Default `'Fit / Reset View'`. */
  fitLabel?: string;
  /** Trigger tooltip content + accessible label. Default `'Zoom level'`. */
  title?: string;
  /** Side the trigger tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  className?: string;
}

/**
 * A zoom-level picker: a trigger button showing the current zoom percentage
 * that opens a dropdown with preset zoom levels and an optional fit-to-content
 * action. Self-wiring via {@link useZoom} and {@link useFitContent} — drop
 * inside a `<Canvas>` and it works without any callback wiring.
 *
 * The active preset is highlighted automatically based on the live zoom state.
 *
 * Built on the design-kit `RichSelect`, which owns the outline trigger, chevron,
 * tooltip, and solid popover surface. The fit action rides as the first option
 * (a {@link FIT_VALUE} sentinel) and is dispatched in `onChange`; the trigger
 * always shows the live percentage via `renderValue` even when the current zoom
 * isn't one of the presets.
 *
 * @example
 * // In any toolbar — vertical or horizontal:
 * <ZoomPicker layerId="graph" />
 *
 * @example
 * // Custom presets, no fit action:
 * <ZoomPicker presets={[50, 100, 200]} showFit={false} />
 */
export function ZoomPicker({
  canvas,
  layerId = 'graph',
  presets = DEFAULT_PRESETS,
  showFit = true,
  fitLabel = 'Fit / Reset View',
  title = 'Zoom level',
  tooltipSide,
  className,
}: ZoomPickerProps) {
  const { zoom, setZoom } = useZoom(canvas);
  const { fitContent } = useFitContent(layerId, canvas);
  const currentPct = String(Math.round(zoom * 100));

  const options: RichSelectOption[] = [
    ...(showFit ? [{ value: FIT_VALUE, label: fitLabel }] : []),
    ...presets.map((pct) => ({ value: String(pct), label: `${pct}%` })),
  ];

  return (
    <RichSelect
      options={options}
      value={currentPct}
      onChange={(v) => {
        const next = v as string;
        if (next === FIT_VALUE) fitContent();
        else setZoom(Number(next) / 100);
      }}
      tooltip={title}
      tooltipSide={tooltipSide}
      triggerClassName={className}
      renderValue={() => <span>{currentPct}%</span>}
      renderOption={(option, { selected }) => (
        <span className={selected ? ACTIVE_MENU_ITEM_CLASS : undefined}>
          {option.label}
        </span>
      )}
    />
  );
}
