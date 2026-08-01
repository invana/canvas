/**
 * Recommended look for the **H-1B 2019** state → city → employer hierarchy.
 *
 * Four levels and thousands of leaves, so this expects a hierarchical layout
 * mounted under the id `layout` — radial or pack, where the leaf count is the point.
 * Marks stay tiny and labels off by default; a consumer that wants employer names
 * turns them on for the depth it cares about.
 */

import type { CanvasSettings } from '../types';

export const settings: CanvasSettings = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 2.5 }, bgFill: 0xfbbf24, bgStrokeWidth: 0, showLabel: false } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.6, strokeAlpha: 0.35, arrowTargetShape: 'none' } },
    },
  },
  layouts: { layout: { mode: 'radial', radius: 520 } },
  behaviours: { color: { enabled: false } },
};
