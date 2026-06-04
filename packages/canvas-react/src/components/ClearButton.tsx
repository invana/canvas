import { Button } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { useClearGraph } from '../hooks/useClearGraph';

export interface ClearButtonProps {
  /** Optional leading icon (e.g. a trash glyph). */
  icon?: ToolbarIcon;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  /**
   * Layer id to clear. Default `'graph'`. Forwarded to {@link useClearGraph}.
   */
  layerId?: string;
  /** Button text. Default `'Clear'`. */
  label?: string;
  className?: string;
}

/**
 * Labelled action button that clears all nodes and edges from the target layer.
 * Self-wiring: hooks into the canvas via {@link useClearGraph} — drop inside a
 * `<Canvas>` and it works without any callback wiring.
 */
export function ClearButton({
  icon: Icon,
  canvas,
  layerId = 'graph',
  label = 'Clear',
  className,
}: ClearButtonProps) {
  const { clear } = useClearGraph(layerId, canvas);
  return (
    <Button variant="outline" size="sm" onClick={() => clear()} className={className}>
      {Icon ? <Icon size={16} /> : null}
      {label}
    </Button>
  );
}
