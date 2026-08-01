/**
 * Recommended look for the **Les Misérables** co-occurrence network.
 *
 * A dense 77-character social graph: small filled dots, thin translucent links,
 * and a force layout with enough charge to open the hairball. Characters have no
 * `type` (their community is `data.group`), so the colour-by-type behaviour is off
 * — nothing to partition by — and a single node fill reads better than one colour
 * for everything anyway.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 5 },
          bgFill: 0x60a5fa,
          bgStrokeWidth: 0,
          labelFontSize: 9,
          labelPlacement: 'bottom',
          labelOffsetY: 3,
        },
      },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.6, strokeAlpha: 0.45 } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -220 }, link: { distance: 40 }, collide: {}, animate: false },
  },
  behaviours: { color: { enabled: false } },
};
