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
 * once on enable, so anything that patches the same fields *after* it wins —
 * apply theme colours later (a `canvas.update(patch)` from `useSystemTheme` /
 * the theme toggle) to let theme styling override the label colours. `enabled`
 * is reactive; the palette / accessors are init-only — change `id` / `layerId`
 * to recreate.
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
