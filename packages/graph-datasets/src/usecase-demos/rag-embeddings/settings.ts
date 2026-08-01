/**
 * Recommended look for the **RAG embedding** projection.
 *
 * An embedding projection: every chunk's `position` **is** the data, so there is
 * **no layout** (`activeLayout: ''`) and dragging is off — moving a point would be
 * lying about the embedding. Marks are small translucent dots so overlapping
 * regions read as density, which is what a contour overlay then picks up.
 * Colour-by-type separates the semantic clusters.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: '',
  fitOnLoad: true,
  layers: {
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 3.5 }, bgStrokeWidth: 0, bgAlpha: 0.85, showLabel: false } },
    },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    'drag-node': { enabled: false },
    hover: { enabled: true, state: 'highlighted', degree: 0 },
  },
};
