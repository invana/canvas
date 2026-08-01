/**
 * Recommended look for the **Twitter activity** graph.
 *
 * Five node types (`User` · `Tweet` · `Comment` · `Hashtag` · `Retweet`) and eight
 * edge types, so this is one of the few datasets where colour-by-type earns its
 * keep — it's left **on**, and the palette does the categorising with no per-node
 * wiring. Edges get arrowheads because direction is meaningful here (who posted
 * what, who replied to whom).
 */

import type { CanvasSettings } from '../types';

export const settings: CanvasSettings = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 7 }, bgStrokeWidth: 1.5, labelFontSize: 10 } },
      edge: { style: { strokeWidth: 1, strokeAlpha: 0.6, arrowTargetShape: 'triangle', arrowTargetSize: 6 } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -260 }, link: { distance: 70 }, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
  },
};
