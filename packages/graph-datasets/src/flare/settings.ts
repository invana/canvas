/**
 * Recommended look for the **Flare** package hierarchy.
 *
 * The flattened Flare tree is the canonical d3-hierarchy fixture, so these
 * settings assume a hierarchical layout the consumer mounts under the id `layout`
 * (`D3HierarchyLayout` in `tree` mode is the obvious pick) rather than the bundle's
 * force sim. Leaves and branches are the same mark — depth is carried by position.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3.5 }, bgFill: 0x818cf8, bgStrokeWidth: 0, labelFontSize: 9 } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.8, strokeAlpha: 0.5, arrowTargetShape: 'none' } },
    },
  },
  layouts: { layout: { mode: 'tree', nodeSize: [12, 160] } },
  behaviours: { color: { enabled: false } },
};
