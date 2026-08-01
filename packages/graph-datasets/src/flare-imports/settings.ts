/**
 * Recommended look for the **Flare import network**.
 *
 * Class-to-class imports are a dense directed network, so the edges are hairline
 * and heavily faded — the shape comes from their aggregate, not any single link.
 * Hover lights the 1-hop neighbourhood, which is the only practical way to read an
 * individual class's dependencies at this density.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3.5 }, bgFill: 0xf472b6, bgStrokeWidth: 0 } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.5, strokeAlpha: 0.25, arrowTargetShape: 'none' } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -120 }, link: { distance: 36 }, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: false },
    hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
  },
};
