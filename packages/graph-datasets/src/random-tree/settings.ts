/**
 * Recommended look for the **random tree**.
 *
 * A tree reads best when the hierarchy is visible, so this leans on a strong
 * repulsion + short links to spread the branches instead of coiling them. Edges get
 * no arrowheads: the parent→child direction is obvious from the shape.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 4 }, bgFill: 0x34d399, bgStrokeWidth: 0 } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.9, strokeAlpha: 0.55, arrowTargetShape: 'none' } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -180 }, link: { distance: 26 }, collide: {}, animate: false },
  },
  behaviours: { color: { enabled: false } },
};
