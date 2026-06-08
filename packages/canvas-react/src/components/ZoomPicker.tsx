import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { ACTIVE_MENU_ITEM_CLASS } from './ControlButton';
import { Tooltipped } from './Tooltipped';
import type { TooltipSide } from './types';
import { useZoom } from '../hooks/useZoom';
import { useFitContent } from '../hooks/useFitContent';

const DEFAULT_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

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

  return (
    <DropdownMenu>
      {/* Tooltip wraps the trigger — see OptionPicker for the asChild nesting. */}
      <Tooltipped label={title} side={tooltipSide}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label={title} className={className}>
            {currentPct}% ▾
          </Button>
        </DropdownMenuTrigger>
      </Tooltipped>
      {/* Force a solid token-driven background: same reasoning as OptionPicker. */}
      <DropdownMenuContent style={{ backgroundColor: 'var(--color-popover)' }}>
        {showFit && (
          <>
            <DropdownMenuItem onSelect={() => fitContent()}>
              {fitLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuRadioGroup
          value={currentPct}
          onValueChange={(v) => setZoom(Number(v) / 100)}
        >
          {presets.map((pct) => (
            <DropdownMenuRadioItem
              key={pct}
              value={String(pct)}
              className={String(pct) === currentPct ? ACTIVE_MENU_ITEM_CLASS : undefined}
            >
              {pct}%
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
