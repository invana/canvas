/**
 * **Epic Saga** — a fully synthetic, multi-entity property graph of a fictional
 * serialised drama. The package's **large heterogeneous graph**: seven vertex
 * kinds and six relation kinds at ~5k nodes / ~29k edges.
 *
 * Seven vertex kinds — `character`, `house`, `location`, `subLocation`,
 * `season`, `episode`, `scene` — wired by six relation kinds: `member_of`
 * (character → house), `part_of` (episode → season, scene → episode),
 * `located_at` (scene → location / sub-location), `within` (sub-location →
 * location), `appears_in` (character → scene), and a weighted, undirected
 * `co_appears_with` (character ↔ character — the force-directed network,
 * carrying `sharedScenes` + `sharedSeconds` of screen time).
 *
 * ### Generated, not stored
 *
 * There is **no JSON beside this file**. The graph is built at import time by
 * {@link generateEpicSaga} from a fixed seed, so it is byte-stable across
 * reloads while costing a few KB of source instead of ~7 MB of records. Every
 * name, title, timecode and synopsis is invented by the generator from seeded
 * pools — **nothing here derives from any real production**, which is the point:
 * this dataset carries no third-party licence.
 *
 * The `co_appears_with` network is a genuine *projection* — two characters are
 * linked because the generator put them in the same scene, weighted by the
 * combined duration of those scenes — so the force-directed picture reads like a
 * real co-occurrence network rather than decoration.
 *
 * It still ships on its **own subpath entry** (`@invana/graph-datasets/epic-saga`):
 * ~29k edges has no business in the main bundle even when it's cheap to produce.
 *
 * @example
 * import { epicSaga, epicSagaSettings } from '@invana/graph-datasets/epic-saga';
 * <GraphCanvasApp data={epicSaga} config={epicSagaSettings} />
 *
 * @example
 * // Need a bigger graph for a performance story? Generate one.
 * import { generateEpicSaga } from '@invana/graph-datasets/epic-saga';
 * const huge = generateEpicSaga({ scenes: 50_000, characters: 4_000, seed: 7 });
 */

import type { CanvasConfig } from '@invana/canvas';

import { generateEpicSaga } from './generator';

export { generateEpicSaga, type EpicSagaOptions } from './generator';

/**
 * The default saga graph — ~4,959 nodes / ~28,700 edges from seed `1337`.
 *
 * `meta.schema` is *derived* from the generated records (never hand-written), so
 * the vertex/edge kind inventory a layers or schema panel reads can't drift from
 * the data it describes.
 */
export const epicSaga = generateEpicSaga();

/** {@link epicSaga} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = epicSaga;

/**
 * Recommended look for the **Epic Saga** multi-entity graph.
 *
 * Seven entity types across ~5k nodes and ~29k edges. Colour-by-type stays on —
 * it's the only thing that makes a graph this size legible at a glance — but edges
 * drop to a hairline and hover dims everything off the 1-hop neighbourhood, which
 * is how you read an individual character out of the mass.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 3.5 },
          bgStrokeWidth: 0,
          showLabel: false,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.4,
          strokeAlpha: 0.18,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -90 },
      link: {},
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
