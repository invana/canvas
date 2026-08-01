/**
 * **Cora** citation network — the canonical machine-learning paper dataset
 * (2,708 papers across 7 subject areas, 10,556 `CITES` edges).
 *
 * The raw CSVs live beside this file; `scripts/prepare-cora.mjs` projects them
 * to a compact `cora.json` **already in the engine-ready shape** (and drops the
 * 1,433-dim bag-of-words feature matrix the viewer never needs), so this module
 * is a thin typed view over it — no per-record mapping on import, which at 2,708
 * nodes is worth having.
 *
 * A paper's subject is both its `type` (so colour-by-type partitions the
 * network with no consumer wiring) and its `data.subject`.
 *
 * Re-run the prepare script when the CSVs change:
 *   `node scripts/prepare-cora.mjs`
 *
 * @example
 * import { cora, coraSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={cora} config={coraSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

import raw from './cora.json';

/** The seven subject areas a paper can belong to. */
type CoraSubject =
  | 'Neural_Networks'
  | 'Rule_Learning'
  | 'Reinforcement_Learning'
  | 'Probabilistic_Methods'
  | 'Theory'
  | 'Genetic_Algorithms'
  | 'Case_Based';

// The JSON is already valid `GraphData`; the cast only narrows `type` /
// `data.subject` from the `string` a JSON import widens them to.
export const cora = raw as unknown as {
  /** `type` and `data.subject` are the paper's subject area — the same value. */
  nodes: (GraphNode & { type: CoraSubject; data: { subject: CoraSubject } })[];
  edges: GraphEdge[];
};

/** {@link cora} as the engine-ready value `setData` / `<GraphCanvasApp>` take. */
export const data = cora;

/**
 * Recommended look for the **Cora** citation network.
 *
 * 2,708 papers and 10,556 citations — the largest dataset here, and the settings
 * are shaped almost entirely by that. Papers are 3px dots so the seven subject
 * communities read as regions rather than as individual marks; citations are barely
 * visible on their own and exist to shape the layout. Colour-by-type partitions the
 * subjects for free, since each paper's `type` **is** its subject.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 3 },
          bgStrokeWidth: 0,
          showLabel: false,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.4,
          strokeAlpha: 0.12,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -60 },
      link: { distance: 28 },
      collide: {},
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: {
      enabled: true,
      state: 'highlighted',
      inactiveState: 'dimmed',
      degree: 1,
      direction: 'both',
    },
  },
};
