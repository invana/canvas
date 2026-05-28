import { useEffect } from 'react';
import type { IBehaviour } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

/**
 * Shared registration lifecycle for behaviour wrappers. One place owns the two
 * effects every wrapper needs:
 *
 * 1. **Register / unregister** keyed on `identity` (the behaviour `id`, plus
 *    `layerId` for layer-scoped behaviours). Construction options are read once
 *    via `create()` — change an identity value (or the component `key`) to
 *    recreate with new options.
 * 2. **Reactive `enabled`** — toggles via `canvas.behaviours.setEnabled(id, …)`
 *    whenever the `enabled` prop changes, *without* re-registering. This is
 *    what lets a toolbar flip a behaviour on/off declaratively.
 *
 * `setEnabled` no-ops on an unknown id and on a no-op state change, and effects
 * run top-down, so the register effect has always run before the enable effect.
 *
 * @param create   Factory that constructs the engine behaviour from current props.
 * @param id       Behaviour id (used for unregister + setEnabled).
 * @param enabled  Desired enabled state; reconciled on every change.
 * @param identity Values that force a recreate when changed (e.g. `[id]` or `[id, layerId]`).
 */
export function useBehaviourRegistration(
  create: () => IBehaviour,
  id: string,
  enabled: boolean,
  identity: readonly unknown[],
): void {
  const canvas = useCanvas();

  useEffect(() => {
    const behaviour = create();
    canvas.behaviours.register(behaviour);
    return () => {
      canvas.behaviours.unregister(id);
    };
    // `create` closes over init-only options; recreate only on identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, ...identity]);

  useEffect(() => {
    canvas.behaviours.setEnabled(id, enabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, enabled, ...identity]);
}
