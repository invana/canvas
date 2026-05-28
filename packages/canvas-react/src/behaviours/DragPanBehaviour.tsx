import {
  DragPanBehaviour as EngineDragPanBehaviour,
  type DragPanBehaviourOptions,
} from '@invana/canvas';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface DragPanBehaviourProps extends Omit<DragPanBehaviourOptions, 'id'> {
  /** Behaviour id; default `'pan'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `DragPanBehaviour`.
 *
 * `enabled` is reactive (toggles in place). Other options are init-only —
 * change `id` or the component `key` to recreate with new options.
 */
export function DragPanBehaviour({ id = 'pan', enabled = true, ...rest }: DragPanBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineDragPanBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id],
  );
  return null;
}
