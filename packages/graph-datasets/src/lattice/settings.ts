/**
 * Recommended look for the **lattice** grid.
 *
 * A regular n×n mesh is a stress test, not a picture of anything — so the marks
 * are as small as they can be while staying visible, and the links carry the
 * structure. The force layout's link distance is what sets the cell size; charge
 * stays weak so the mesh relaxes into a grid rather than exploding.
 */

import type { CanvasSettings } from '../types';

export const settings: CanvasSettings = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3 }, bgFill: 0x60a5fa, bgStrokeWidth: 0 } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.8, strokeAlpha: 0.6 } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -30 }, link: { distance: 30 }, collide: {}, animate: false },
  },
  behaviours: { color: { enabled: false }, hover: { enabled: true, state: 'highlighted', degree: 1 } },
};
