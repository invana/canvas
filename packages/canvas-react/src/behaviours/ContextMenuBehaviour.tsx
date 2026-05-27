import { useEffect } from 'react';
import {
  ContextMenuBehaviour as EngineContextMenuBehaviour,
  type ContextMenuBehaviourOptions,
} from '@invana/graph';

import { useCanvas } from '../CanvasContext';

export interface ContextMenuBehaviourProps
  extends Omit<ContextMenuBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'context-menu'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose nodes/edges this behaviour watches; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ContextMenuBehaviour`.
 *
 * Headless — pass `onContextMenu` to receive node/edge/canvas right-click
 * events and render your own menu. Options are init-only; change the
 * component's `key` to recreate.
 */
export function ContextMenuBehaviour({
  id = 'context-menu',
  layerId = 'graph',
  enabled = true,
  ...rest
}: ContextMenuBehaviourProps) {
  const canvas = useCanvas();

  useEffect(() => {
    const behaviour = new EngineContextMenuBehaviour({ id, layerId, enabled, ...rest });
    canvas.behaviours.register(behaviour);
    return () => {
      canvas.behaviours.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, layerId]);

  return null;
}
