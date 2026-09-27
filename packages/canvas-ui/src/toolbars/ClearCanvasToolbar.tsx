import type { Canvas } from '@invana/canvas';
import { Button } from '@invana/ui';
import { Trash2 } from 'lucide-react';

import { Tooltipped } from '../components';
import type { ToolbarIcon, TooltipSide } from '../components';
import { useClearGraph } from '@invana/canvas-react';

export interface ClearCanvasToolbarProps {
  /** GraphLayer id to clear. Default `'graph'`. */
  targetLayerId?: string;
  /** Tooltip / aria-label. Default `'Clear canvas'`. */
  label?: string;
  /** Optional visible text beside the trigger icon (renders a labelled button). */
  triggerText?: string;
  /** Override the trigger icon (lucide `Trash2` by default). */
  triggerIcon?: ToolbarIcon;
  /** Side the tooltip is placed on. Default `'bottom'`. */
  tooltipSide?: TooltipSide;
  /** Explicit canvas instance; defaults to the `<Canvas>` context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Clear-canvas action — a single toolbar **nav item** that wipes every node and
 * edge from the target `GraphLayer`. A ghost icon button with a tooltip;
 * clicking it calls {@link useClearGraph} (an undoable `history.transaction`
 * when a `<GraphHistoryProvider>` is present, else the layer's fast `clear()`).
 *
 * Self-wiring: pulls the engine from the `<Canvas>` context (or an explicit
 * `canvas` prop). Pairs naturally with `ExportStateToolbar` — clear the scene,
 * then **Load JSON…** to restore a saved document. Drop the button into
 * any toolbar chrome; to float it over the canvas, put it in a `<ControlPanel>`.
 */
export function ClearCanvasToolbar({
  targetLayerId = 'graph',
  label = 'Clear canvas',
  triggerText,
  triggerIcon: TriggerIcon = Trash2,
  tooltipSide = 'bottom',
  canvas,
  className,
}: ClearCanvasToolbarProps) {
  const { clear } = useClearGraph(targetLayerId, canvas);

  return (
    <Tooltipped label={label} side={tooltipSide}>
      <Button
        variant="ghost"
        size={triggerText ? 'sm' : 'icon'}
        aria-label={label}
        onClick={clear}
        className={className}
      >
        <TriggerIcon size={16} />
        {triggerText}
      </Button>
    </Tooltipped>
  );
}
