/**
 * Recommended look for the **air routes** airport set.
 *
 * Airports are geography, not topology: every node's real position comes from
 * projecting `data.lng` / `data.lat` through whichever map the consumer mounts, so
 * there is **no layout** (`activeLayout: ''`) and dragging is off — a moved airport
 * is a wrong airport. Marks are small and uniform because 2,980 of them overlap
 * heavily at world zoom.
 */

import type { CanvasSettings } from '../types';

export const settings: CanvasSettings = {
  activeLayout: '',
  fitOnLoad: false,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 2.5 },
          bgFill: 0xf97316,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 0.5,
          showLabel: false,
        },
      },
    },
  },
  behaviours: { color: { enabled: false }, 'drag-node': { enabled: false } },
};
