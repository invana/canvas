/**
 * Recommended look for the **Old Faithful** eruption scatter.
 *
 * Not a network at all — 272 eruptions plotted as a scatter, with `position`
 * already baked into the data and no edges. So there is **no layout** (`activeLayout: ''`);
 * anything that moved the points would destroy the chart. Nodes carry a `cluster`
 * of `short` / `long` on `data`, not as a `type`, so colour-by-type is off.
 */

import type { CanvasSettings } from '../types';

export const settings: CanvasSettings = {
  activeLayout: '',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3 }, bgFill: 0x38bdf8, bgStrokeWidth: 0, showLabel: false } },
    },
  },
  behaviours: { color: { enabled: false }, 'drag-node': { enabled: false } },
};
