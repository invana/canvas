/**
 * Recommended look for the **Invana code knowledge graph**.
 *
 * 602 code entities across 8 architectural clusters. Colour-by-type partitions
 * by entity kind (`file` · `function` · `class` · `config` · `document`) with no
 * wiring; a consumer that would rather colour by *cluster* supplies its own
 * `bgFill` resolver, since `data.cluster` can't be reached from serialisable
 * settings.
 *
 * Edges are hairline and heavily faded — at 1,329 relations their aggregate is the
 * picture — and hover dims everything off the 1-hop neighbourhood, which is the
 * only practical way to read one file's dependencies out of the mass.
 */

import type { CanvasSettings } from '../../types';

export const settings: CanvasSettings = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 4 }, bgStrokeWidth: 0, showLabel: false } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.5, strokeAlpha: 0.22, arrowTargetShape: 'none' } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -140 }, link: { distance: 44 }, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
    'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
  },
};
