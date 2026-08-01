/**
 * Recommended look for the **Cora** citation network.
 *
 * 2,708 papers and 10,556 citations — the largest dataset here, and the settings
 * are shaped almost entirely by that. Papers are 3px dots so the seven subject
 * communities read as regions rather than as individual marks; citations are barely
 * visible on their own and exist to shape the layout. Colour-by-type partitions the
 * subjects for free, since each paper's `type` **is** its subject.
 */

import type { CanvasSettings } from '../../types';

export const settings: CanvasSettings = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3 }, bgStrokeWidth: 0, showLabel: false } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.4, strokeAlpha: 0.12, arrowTargetShape: 'none' } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -60 }, link: { distance: 28 }, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
  },
};
