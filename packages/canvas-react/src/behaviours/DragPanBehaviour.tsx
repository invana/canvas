import { useEffect } from 'react';
import {
  DragPanBehaviour as EngineDragPanBehaviour,
  type DragPanBehaviourOptions,
} from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

export interface DragPanBehaviourProps extends Omit<DragPanBehaviourOptions, 'id'> {
  /** Behaviour id; default `'pan'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `DragPanBehaviour`.
 *
 * Only `id` is reactive (changing it remounts the behaviour). Other options
 * are applied at mount time — change the `key` on the component to recreate
 * with new options.
 */
export function DragPanBehaviour({ id = 'pan', enabled = true, ...rest }: DragPanBehaviourProps) {
  const canvas = useCanvas();

  useEffect(() => {
    const behaviour = new EngineDragPanBehaviour({ id, enabled, ...rest });
    canvas.behaviours.register(behaviour);
    return () => {
      canvas.behaviours.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id]);

  return null;
}
