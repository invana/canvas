import {
  ResponsiveThemeBehaviour as EngineResponsiveThemeBehaviour,
  type ResponsiveThemeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ResponsiveThemeBehaviourProps
  extends Omit<ResponsiveThemeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'responsive-theme'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour themes; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ResponsiveThemeBehaviour`.
 *
 * Keeps the graph's theme-dependent node / edge styling in sync with the host's
 * `prefers-color-scheme` (or a pinned `mode`). `enabled` is reactive; the
 * `node` / `edge` / `mode` options are init-only — change `id` / `layerId` (or
 * the component `key`) to recreate with new variants.
 */
export function ResponsiveThemeBehaviour({
  id = 'responsive-theme',
  layerId = 'graph',
  enabled = true,
  ...rest
}: ResponsiveThemeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineResponsiveThemeBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
