/**
 * **Modeller seed** — three placed nodes and one edge, the starting board for a
 * graph *authoring* tool.
 *
 * The point of this dataset is that it is nearly empty. A drawing surface needs
 * enough on screen to prove the tools work (something to drag, something to
 * connect to, an existing edge to erase) and nothing more — the graph the user
 * ends up with is their own. Nodes carry a placement and a one-letter caption;
 * there is no type, so the modeller's inspector is what gives a node meaning.
 *
 * @example
 * import { modellerSeed, modellerSeedSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={modellerSeed} config={modellerSeedSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';

export const modellerSeed = {
  nodes: [
    { id: 'a', position: { x: -120, y: -60 }, style: { labelText: 'A' } },
    { id: 'b', position: { x: 120, y: -60 }, style: { labelText: 'B' } },
    { id: 'c', position: { x: 0, y: 90 }, style: { labelText: 'C' } },
  ],
  edges: [{ id: 'a-b', source: 'a', target: 'b' }],
};

/** {@link modellerSeed} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = modellerSeed;

/**
 * Recommended look for the **modeller seed** board.
 *
 * An authoring surface, not a picture: the three seed nodes sit where they were
 * placed, so there is **no layout** (`activeLayout: ''`) — a solver would fight the
 * user on their first drag. A grid background gives the drawing something to align
 * against, and colour-by-type is off because seed nodes are deliberately untyped
 * until the user classifies them.
 */
export const settings: CanvasConfig = {
  activeLayout: '',
  fitOnLoad: false,
  layers: {
    background: { type: 'pattern', patternType: 'grid' },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 22 },
          bgFill: 0x3b82f6,
          bgStrokeWidth: 2,
          labelColor: 0xf8fafc,
          labelFontSize: 13,
          labelPlacement: 'center',
        },
      },
      edge: { style: { strokeWidth: 2 } },
    },
  },
  behaviours: { color: { enabled: false }, 'drag-node': { enabled: true } },
};
