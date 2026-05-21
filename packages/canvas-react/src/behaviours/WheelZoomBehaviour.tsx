import { useEffect } from 'react';
import {
  WheelZoomBehaviour as EngineWheelZoomBehaviour,
  type WheelZoomBehaviourOptions,
} from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

export interface WheelZoomBehaviourProps extends Omit<WheelZoomBehaviourOptions, 'id'> {
  /** Behaviour id; default `'zoom'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `WheelZoomBehaviour`.
 *
 * Options are init-only; change the component's `key` to recreate.
 */
export function WheelZoomBehaviour({ id = 'zoom', enabled = true, ...rest }: WheelZoomBehaviourProps) {
  const canvas = useCanvas();

  useEffect(() => {
    const behaviour = new EngineWheelZoomBehaviour({ id, enabled, ...rest });
    canvas.behaviours.register(behaviour);
    return () => {
      canvas.behaviours.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id]);

  return null;
}
