import type { Canvas } from '@invana/canvas';
import { Button } from '@invana/ui';
import { Trash2 } from 'lucide-react';

import { Panel, Tooltipped } from '../components';
import type { PanelPosition, ToolbarIcon, TooltipSide } from '../components';
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
  /** Where the toolbar pins (when not `bare`). Default `'top-right'`. */
  position?: PanelPosition;
  /**
   * Render just the button (no `<Panel>` wrapper) so it can be dropped into
   * external chrome — e.g. a header rail alongside other nav items. Default
   * `false`.
   */
  bare?: boolean;
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
 * then **Load JSON…** to restore a saved document. Pass `bare` to embed the
 * button in your own toolbar chrome instead of the built-in `<Panel>`.
 */
export function ClearCanvasToolbar({
  targetLayerId = 'graph',
  label = 'Clear canvas',
  triggerText,
  triggerIcon: TriggerIcon = Trash2,
  tooltipSide = 'bottom',
  position = 'top-right',
  bare = false,
  canvas,
  className,
}: ClearCanvasToolbarProps) {
  const { clear } = useClearGraph(targetLayerId, canvas);

  const button = (
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

  if (bare) return button;
  return <Panel position={position}>{button}</Panel>;
}
