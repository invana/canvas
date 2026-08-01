/**
 * Recommended look for the **Game of Thrones** multi-entity graph.
 *
 * Six entity types across ~5k nodes and ~29k edges. Colour-by-type stays on —
 * it's the only thing that makes a graph this size legible at a glance — but edges
 * drop to a hairline and hover dims everything off the 1-hop neighbourhood, which
 * is how you read an individual character out of the mass.
 */

import type { CanvasSettings } from '../types';

export const settings: CanvasSettings = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3.5 }, bgStrokeWidth: 0, showLabel: false } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.4, strokeAlpha: 0.18, arrowTargetShape: 'none' } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -90 }, link: {}, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
  },
};
