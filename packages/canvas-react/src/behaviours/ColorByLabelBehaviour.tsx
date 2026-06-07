import {
  ColorByLabelBehaviour as EngineColorByLabelBehaviour,
  type ColorByLabelBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ColorByLabelBehaviourProps
  extends Omit<ColorByLabelBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'color-by-label'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour colours; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ColorByLabelBehaviour` — assigns a
 * unique colour per distinct label (default each item's `type`) to node `bgFill`
 * and edge `strokeColor`, so the graph reads as coloured-by-category.
 *
 * **Order matters for precedence:** it writes its colours to the layer template
 * once on enable, so any behaviour rendered *after* it that patches the same
 * fields overrides it — place `<ResponsiveThemeBehaviour>` after this one to let
 * theme styling win (per its own docs). `enabled` is reactive; the palette /
 * accessors are init-only — change `id` / `layerId` to recreate.
 */
export function ColorByLabelBehaviour({
  id = 'color-by-label',
  layerId = 'graph',
  enabled = true,
  ...rest
}: ColorByLabelBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineColorByLabelBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
