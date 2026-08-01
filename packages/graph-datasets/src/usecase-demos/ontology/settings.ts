/**
 * Recommended look for the **ontology** knowledge graph.
 *
 * A small, readable knowledge graph — few enough entities that every node can
 * carry its label, which is the point of an ontology view. Colour-by-type separates
 * the entity kinds, and edges keep arrowheads because a triple's direction is its
 * meaning.
 */

import type { CanvasSettings } from '../../types';

export const settings: CanvasSettings = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 10 },
          bgStrokeWidth: 1.5,
          labelFontSize: 11,
          labelPlacement: 'bottom',
          labelOffsetY: 4,
        },
      },
      edge: { style: { strokeWidth: 1.2, strokeAlpha: 0.7, arrowTargetShape: 'triangle', arrowTargetSize: 7 } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -420 }, link: { distance: 110 }, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
    'click-select': { enabled: true, multiple: true },
  },
};
