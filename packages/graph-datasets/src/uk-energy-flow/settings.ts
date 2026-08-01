/**
 * Recommended look for the **UK energy flow** Sankey.
 *
 * A flow diagram, so it expects a `D3SankeyLayout` mounted under the id `layout`.
 * The ribbons are the data — edge width comes from the layout, and the endpoints
 * attach to node faces (`edge-port`) rather than being trimmed at an outline, which
 * is what keeps a ribbon flush against its bar.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
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
          // `bump-horizontal` is the ribbon curve (there is no `'sankey'`
          // pathType — see `EdgePathType`); `edge-port` anchors are what keep a
          // ribbon flush against its bar's face.
          shape: { pathType: 'bump-horizontal', sourceAnchor: 'edge-port', targetAnchor: 'edge-port' },
        },
      },
    },
  },
  layouts: { layout: { nodeWidth: 14, nodePadding: 12 } },
  behaviours: { color: { enabled: false }, 'drag-node': { enabled: false } },
};
