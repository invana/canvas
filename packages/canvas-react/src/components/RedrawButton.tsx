import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { ControlButton } from './ControlButton';
import { useHistory } from '../hooks/useHistory';

export interface RedrawButtonProps {
  icon: ToolbarIcon;
  /** Tooltip / accessible label. Default `'Redraw'`. */
  title?: string;
  /** Layer to redraw. Default `'graph'`. */
  layerId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring redraw button — forces a full re-render of the target layer. A
 * pure render pass (not undoable); works without a history provider.
 */
export function RedrawButton({
  icon,
  title = 'Redraw',
  layerId = 'graph',
  canvas,
  className,
}: RedrawButtonProps) {
  const { redraw } = useHistory({ layerId }, canvas);
  return <ControlButton icon={icon} title={title} onClick={redraw} className={className} />;
}
