/**
 * Recommended look for the **modeller seed** board.
 *
 * An authoring surface, not a picture: the three seed nodes sit where they were
 * placed, so there is **no layout** (`activeLayout: ''`) — a solver would fight the
 * user on their first drag. A grid background gives the drawing something to align
 * against, and colour-by-type is off because seed nodes are deliberately untyped
 * until the user classifies them.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: '',
  fitOnLoad: false,
  layers: {
    background: { type: 'pattern', patternType: 'grid' },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 22 },
          bgFill: 0x3b82f6,
          bgStrokeWidth: 2,
          labelColor: 0xf8fafc,
          labelFontSize: 13,
          labelPlacement: 'center',
        },
      },
      edge: { style: { strokeWidth: 2 } },
    },
  },
  behaviours: { color: { enabled: false }, 'drag-node': { enabled: true } },
};
