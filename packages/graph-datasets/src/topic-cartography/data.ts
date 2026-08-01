/**
 * **Topic Cartography** — a fully synthetic cartography of ~2,000 knowledge-base
 * topic pages connected by the hyperlinks between them.
 *
 * A **single-mode network**: every vertex is a page, discriminated by its tag
 * (`Tool`, `Person`, `Field`, `Chart type`, `Concept`, `Method`, `Company`,
 * `Organization`, `Technology`, `List`, `unknown`), and every edge is one
 * directed `links_to` hyperlink. Each page carries its **precomputed position**
 * (`data.x` / `data.y` — the "cartography"), a PageRank-like importance `score`,
 * and its **community cluster** (denormalised `clusterLabel` alongside the raw
 * key).
 *
 * The 24 topic clusters (colour + label) and the 11 tag names ride on `meta` as
 * `meta.clusters` / `meta.tags` registries — they describe the whole graph, not
 * any single vertex, so they don't belong in a node's property bag.
 *
 * ### Generated, not stored
 *
 * There is **no JSON beside this file**. The graph is built at import time by
 * {@link generateTopicCartography} from a fixed seed — byte-stable across
 * reloads, a few KB of source instead of ~1.6 MB of records, and carrying no
 * third-party licence because every page name and cluster label is invented.
 *
 * Page URLs point at `atlas.invalid`, a domain RFC 2606 reserves and which can
 * never resolve, so a reader who follows one learns immediately that it is
 * fictional.
 *
 * It still ships on its **own subpath entry**
 * (`@invana/graph-datasets/topic-cartography`) to keep the main bundle lean.
 *
 * @example
 * import { topicCartography, topicCartographySettings } from '@invana/graph-datasets/topic-cartography';
 * <GraphCanvasApp data={topicCartography} config={topicCartographySettings} />
 */

import type { CanvasConfig } from '@invana/canvas';

import { generateTopicCartography } from './generator';

export { generateTopicCartography, type TopicCartographyOptions } from './generator';

/** The default cartography — ~2,083 pages / ~5,409 links from seed `20`. */
export const topicCartography = generateTopicCartography();

/** {@link topicCartography} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = topicCartography;

/**
 * Recommended look for the **Topic Cartography** link graph.
 *
 * The graph ships its own community layout on `data.x` / `data.y`, so the honest
 * default is **no layout** (`activeLayout: ''`) — a force sim would throw away the
 * clustering the dataset exists to show. Consumers that want to re-solve it point
 * `activeLayout` at their own. Colour-by-type maps the 11 page tags; the 24 finer
 * topic clusters live on `data.cluster` for a custom resolver.
 */
export const settings: CanvasConfig = {
  activeLayout: '',
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
          strokeAlpha: 0.2,
          arrowTargetShape: 'none',
        },
      },
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
