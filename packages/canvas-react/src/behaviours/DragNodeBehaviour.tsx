import { useEffect } from 'react';
import {
  DragNodeBehaviour as EngineDragNodeBehaviour,
  type DragNodeBehaviourOptions,
} from '@invana/graph';

import { useCanvas } from '../CanvasContext';

export interface DragNodeBehaviourProps extends Omit<DragNodeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'drag-node'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose nodes this behaviour drags; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `DragNodeBehaviour`.
 *
 * Options are init-only; change the component's `key` to recreate.
 */
export function DragNodeBehaviour({
  id = 'drag-node',
  layerId = 'graph',
  enabled = true,
  ...rest
}: DragNodeBehaviourProps) {
  const canvas = useCanvas();

  useEffect(() => {
    const behaviour = new EngineDragNodeBehaviour({ id, layerId, enabled, ...rest });
    canvas.behaviours.register(behaviour);
    return () => {
      canvas.behaviours.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, layerId]);

  return null;
}
