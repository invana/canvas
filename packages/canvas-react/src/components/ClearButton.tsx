import { Button } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Tooltipped } from './Tooltipped';
import type { ToolbarIcon, TooltipSide } from './types';
import { useClearGraph } from '../hooks/useClearGraph';
import { useClipboard } from '../hooks/useClipboard';

export interface ClearButtonProps {
  /** Icon component (e.g. an eraser glyph). Consumer-supplied — icon-agnostic. */
  icon: ToolbarIcon;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  /**
   * Layer id to clear. Default `'graph'`. Forwarded to {@link useClearGraph}.
   */
  layerId?: string;
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Visible text shown next to the icon when something is selected. Default `'Selection'`. */
  selectionText?: string;
  /** Tooltip when something is selected. Default `'Clear selection'`. */
  selectionLabel?: string;
  /** Tooltip when nothing is selected. Default `'Clear canvas'`. */
  label?: string;
  /** Side the tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  className?: string;
}

/**
 * Selection-aware erase button that merges "delete selection" and "clear canvas":
 *
 * - **With a selection** → deletes the selected nodes/edges (undoable when a
 *   `<GraphHistoryProvider>` is present) and renders as eraser + a
 *   {@link ClearButtonProps.selectionText} label, so it's obvious only the
 *   selection is erased. Tooltip {@link ClearButtonProps.selectionLabel}.
 * - **With nothing selected** → clears the whole layer and renders icon-only.
 *   Tooltip {@link ClearButtonProps.label}.
 *
 * Self-wiring: reads the selection via {@link useClipboard} (requires a
 * `<GraphClipboardProvider>` + a `ClickSelectBehaviour`) and clears via
 * {@link useClearGraph} — drop inside a `<Canvas>` with no callback wiring.
 */
export function ClearButton({
  icon: Icon,
  canvas,
  layerId = 'graph',
  clickSelectId,
  selectionText = 'Selection',
  selectionLabel = 'Clear selection',
  label = 'Clear canvas',
  tooltipSide,
  className,
}: ClearButtonProps) {
  const { clear } = useClearGraph(layerId, canvas);
  const { remove, hasSelection } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  return (
    <Tooltipped label={hasSelection ? selectionLabel : label} side={tooltipSide}>
      <Button
        variant="ghost"
        size={hasSelection ? 'sm' : 'icon'}
        aria-label={hasSelection ? selectionLabel : label}
        onClick={hasSelection ? remove : () => clear()}
        className={className}
      >
        <Icon size={16} />
        {hasSelection ? selectionText : null}
      </Button>
    </Tooltipped>
  );
}
