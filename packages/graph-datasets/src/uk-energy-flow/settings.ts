/**
 * Recommended look for the **UK energy flow** Sankey.
 *
 * A flow diagram, so it expects a `D3SankeyLayout` mounted under the id `layout`.
 * The ribbons are the data — edge width comes from the layout, and the endpoints
 * attach to node faces (`edge-port`) rather than being trimmed at an outline, which
 * is what keeps a ribbon flush against its bar.
 */

import type { CanvasSettings } from '../types';

export const settings: CanvasSettings = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'rect', width: 14, height: 40 },
          bgFill: 0x64748b,
          bgStrokeWidth: 0,
          labelFontSize: 10,
          labelPlacement: 'right',
        },
      },
      edge: {
        style: {
          strokeAlpha: 0.4,
          arrowTargetShape: 'none',
          shape: { pathType: 'sankey', sourceAnchor: 'edge-port', targetAnchor: 'edge-port' },
        },
      },
    },
  },
  layouts: { layout: { nodeWidth: 14, nodePadding: 12 } },
  behaviours: { color: { enabled: false }, 'drag-node': { enabled: false } },
};
