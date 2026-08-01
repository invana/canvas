/**
 * Recommended look for the **microservices** topology.
 *
 * A service map, so services are rounded boxes with their name inside rather than
 * dots — an operator reads names, not positions. Colour-by-type separates the tiers
 * (gateway · api · worker · datastore …). Health and RPS live on `data` and drive
 * per-node colour / edge width through a consumer-supplied resolver; these settings
 * deliberately stop at what serialises.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'rect', width: 132, height: 34, cornerRadius: 6 },
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1.5,
          labelColor: 0xffffff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'center',
        },
      },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.2, strokeAlpha: 0.7, arrowTargetShape: 'triangle', arrowTargetSize: 7 } },
    },
  },
  layouts: {
    'graph-force': { charge: { strength: -900 }, link: { distance: 160 }, collide: {}, animate: false },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
    'click-select': { enabled: true, multiple: true },
  },
};
