/**
 * Recommended look for the **citations** paper network.
 *
 * Preferential attachment means a handful of hubs and a long tail, so the marks
 * stay uniform and let the layout express the degree distribution. Colour-by-type
 * maps the research topics (each paper's `type` is its topic). Edges point from the
 * citing paper to the older one it cites, so arrowheads stay on.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 5 }, bgStrokeWidth: 0, showLabel: false } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.6, strokeAlpha: 0.3, arrowTargetShape: 'triangle', arrowTargetSize: 5 } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -160 }, link: { distance: 50 }, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
  },
};
