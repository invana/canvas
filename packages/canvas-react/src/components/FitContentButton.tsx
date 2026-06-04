import { Button } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Tooltipped } from './Tooltipped';
import type { ToolbarIcon, TooltipSide } from './types';
import { useFitContent } from '../hooks/useFitContent';

export interface FitContentButtonProps {
  /** Leading icon (e.g. a maximize / frame glyph). */
  icon: ToolbarIcon;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  /**
   * Layer id to fit to. Default `'graph'`. Forwarded to {@link useFitContent}.
   */
  layerId?: string;
  /** Tooltip text + accessible label. Default `'Fit to content'`. */
  title?: string;
  /** Side the tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  className?: string;
}

/**
 * Icon button that fits the viewport to the graph's content (zoom-to-extent).
 * Self-wiring: hooks into the canvas via {@link useFitContent} — drop inside a
 * `<Canvas>` and it works without any callback wiring. Pass `onFitContent` to
 * override the default hook-driven action.
 */
export function FitContentButton({
  icon: Icon,
  canvas,
  layerId = 'graph',
  title = 'Fit to content',
  tooltipSide,
  className,
}: FitContentButtonProps) {
  const { fitContent } = useFitContent(layerId, canvas);
  return (
    <Tooltipped label={title} side={tooltipSide}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={title}
        onClick={() => fitContent()}
        className={className}
      >
        <Icon size={16} />
      </Button>
    </Tooltipped>
  );
}
