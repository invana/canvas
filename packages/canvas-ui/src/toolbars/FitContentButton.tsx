import { Button } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface FitContentButtonProps {
  /** Fired when clicked — wire to `camera.fitContent(...)` (or similar). */
  onFitContent: () => void;
  /** Leading icon (e.g. a maximize / frame glyph). */
  icon: ToolbarIcon;
  /** Tooltip text. Default `'Fit to content'`. */
  title?: string;
  className?: string;
}

/**
 * Icon button that fits the viewport to the graph's content (zoom-to-extent).
 * Engine-agnostic — the action is a callback the consumer wires to the engine
 * (e.g. `canvas.camera.fitContent(layer.getBounds(), padding)`).
 */
export function FitContentButton({
  onFitContent,
  icon: Icon,
  title = 'Fit to content',
  className,
}: FitContentButtonProps) {
  return (
    <Button variant="ghost" size="icon" title={title} onClick={onFitContent} className={className}>
      <Icon size={16} />
    </Button>
  );
}
