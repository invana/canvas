import * as graph from '@invana/graph';
import { type ThemeBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ThemeBehaviourProps extends Omit<ThemeBehaviourOptions, 'id'> {
  /** Behaviour id; default `'theme'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ThemeBehaviour` — the single
 * publisher of the canvas theme. It resolves the active named palette + mode
 * and broadcasts it on the engine theme signal; `BackgroundLayer`,
 * `MiniMapLayer` and `GraphLayer` recolour themselves from it.
 *
 * `enabled` is reactive. Most settings (`mode` / `active` / `accent`) are driven
 * live via `canvas.update({ behaviours: { theme: … } })` (the behaviour's own
 * `setOptions`), so they don't need to be wrapper props — change `id` only to
 * recreate the behaviour.
 */
export function ThemeBehaviour({ id = 'theme', enabled = true, ...rest }: ThemeBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.ThemeBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id],
  );
  return null;
}
