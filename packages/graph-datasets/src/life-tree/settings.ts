/**
 * Recommended look for the **tree of life** phylogeny.
 *
 * A phylogeny is read radially — every clade fans from a common root — so this
 * expects a hierarchical layout under the id `layout` in `radial-tree` mode. Branch
 * lengths live on `data.length`; the layout, not these settings, decides whether to
 * honour them.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 2 }, bgFill: 0x4ade80, bgStrokeWidth: 0, labelFontSize: 8 } },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.7,
          strokeAlpha: 0.6,
          arrowTargetShape: 'none',
          // Polar path styles need the true centre angle, not a trimmed cut point.
          shape: { pathType: 'bump-radial', sourceAnchor: 'center', targetAnchor: 'center' },
        },
      },
    },
  },
  layouts: { layout: { mode: 'radial-tree', radius: 460 } },
  behaviours: { color: { enabled: false } },
};
