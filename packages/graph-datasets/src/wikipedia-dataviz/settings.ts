/**
 * Recommended look for the **Wikipedia data-visualisation** link graph.
 *
 * The upstream graph ships its own community layout on `data.x` / `data.y`, so
 * the honest default is **no layout** (`activeLayout: ''`) — a force sim would throw
 * away the clustering the dataset was built to show. Consumers that want to
 * re-solve it point `activeLayout` at their own. Colour-by-type maps the 11 page
 * tags; the 24 finer topic clusters live on `data.cluster` for a custom resolver.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: '',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3 }, bgStrokeWidth: 0, showLabel: false } },
      edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.4, strokeAlpha: 0.2, arrowTargetShape: 'none' } },
    },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
  },
};
