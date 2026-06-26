import * as graph from '@invana/graph';
import {
  type ColorByLabelBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ColorByLabelBehaviourProps
  extends Omit<ColorByLabelBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'color-by-label'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour colours; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ColorByLabelBehaviour` — assigns a
 * unique colour per distinct label (default each item's `type`) to node `bgFill`
 * and edge `strokeColor`, so the graph reads as coloured-by-category.
 *
 * **Order matters for precedence:** it writes its colours to the layer template
 * once on enable, so anything that patches the same fields *after* it wins —
 * the `ThemeBehaviour`'s published palette recolours the non-fill fields
 * (label / border / edge stroke) on every theme change, leaving the label
 * colour-by-category `bgFill` to this behaviour. `enabled`
 * is reactive; the palette / accessors are init-only — change `id` / `targetLayerId`
 * to recreate.
 */
export function ColorByLabelBehaviour({
  id = 'color-by-label',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ColorByLabelBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.ColorByLabelBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
