import * as graph from '@invana/graph';
import { type ColorByBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ColorByBehaviourProps
  extends Omit<ColorByBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'color-by'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour colours; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ColorByBehaviour` — colours nodes and
 * edges from one addressable field, either as **categories** (a distinct colour
 * per distinct value — the default) or as a **range** (a numeric magnitude
 * mapped onto a colour ramp). Writes node `bgFill` and edge `strokeColor` /
 * `arrowTargetColor`.
 *
 * The field is a root-relative dot path — `nodeValueKey="type"` (default),
 * `nodeValueKey="data.riskScore"`, `nodeValueKey="style.shape.kind"`.
 *
 * **Order matters for precedence:** it writes its colours to the layer template
 * once on enable, so anything that patches the same fields *after* it wins —
 * the `ThemeBehaviour`'s published palette recolours the non-fill fields
 * (label / border / edge stroke) on every theme change, leaving the
 * colour-by `bgFill` to this behaviour. `enabled` is reactive; the mode / keys /
 * palette are init-only — change `id` / `targetLayerId` to recreate.
 *
 * @example
 * ```tsx
 * <ColorByBehaviour nodeValueKey="data.subject" colorEdges={false} />
 * <ColorByBehaviour mode="range" nodeValueKey="data.coverage" nodeDomain={[0, 100]} />
 * ```
 */
export function ColorByBehaviour({
  id = 'color-by',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ColorByBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.ColorByBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
