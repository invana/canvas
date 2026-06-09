import { useEffect } from 'react';
import {
  HoverActivateBehaviour as EngineHoverActivateBehaviour,
  type HoverActivateBehaviourOptions,
} from '@invana/graph';

import { useCanvas } from '../CanvasContext';
import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface HoverActivateBehaviourProps
  extends Omit<HoverActivateBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'hover'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `HoverActivateBehaviour`.
 *
 * `enabled` **and** `degree` are reactive; all other options are init-only —
 * change `id` / `targetLayerId` (or the component `key`) to apply them. `degree` is
 * special-cased so a toolbar can flip neighbour-highlighting on/off live (e.g. a
 * "magnet" toggle: `degree={1}` lights up 1st-degree neighbours, `degree={0}`
 * lights up only the hovered element) without remounting the behaviour.
 */
export function HoverActivateBehaviour({
  id = 'hover',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: HoverActivateBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineHoverActivateBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );

  // `degree` is reactive — push live changes through the engine's `setOptions`
  // instead of forcing a remount. Runs after the register effect (effects fire
  // top-down), so the behaviour always exists by the time we look it up.
  const canvas = useCanvas();
  const { degree } = rest;
  useEffect(() => {
    if (degree === undefined) return;
    canvas.behaviours.get<EngineHoverActivateBehaviour>(id)?.setOptions({ degree });
  }, [canvas, id, degree]);

  return null;
}
