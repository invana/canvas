/**
 * **Wikipedia Data-Visualization Cartography** — a cartography of ~2,000
 * Wikipedia pages around data visualization, connected by the hyperlinks
 * between them. This is the flagship [sigma.js](https://www.sigmajs.org) demo
 * graph ([`packages/demo`](https://github.com/jacomyal/sigma.js/tree/main/packages/demo)),
 * re-authored here in this package's engine-ready shape.
 *
 * A **single-mode network**: every vertex is a Wikipedia page, discriminated by
 * its {@link WdvNodeLabel} `tag` (`Tool`, `Person`, `Field`, `Chart type`,
 * `Concept`, `Method`, `Company`, `Organization`, `Technology`, `List`,
 * `unknown`), and every edge is one directed `links_to` hyperlink. Each page
 * carries its precomputed **ForceAtlas2 position** (`x` / `y` — the "cartography"),
 * a PageRank-like importance `score`, and its **community-detected topic
 * `cluster`** (denormalised `clusterLabel` alongside the raw key).
 *
 * The 24 topic clusters (colour + label) and the 11 tag icon-asset names ride on
 * {@link WdvMeta} as {@link WdvMeta.clusters} / {@link WdvMeta.tags} registries —
 * they describe the whole graph, not any single vertex, so they don't belong in a
 * node's property bag.
 *
 * `./wikipedia-dataviz.json` is authored **directly** in this contract — vertices
 * are `{ id, type, data }`, edges are `{ id, type, source, target,
 * data }` — so this module is a thin typed view over it, not a translator.
 * The interfaces below ARE the on-disk contract; the JSON is its serialisation.
 * Regenerate it offline with `node scripts/prepare-wikipedia-dataviz.mjs` (the raw
 * upstream `dataset.json` is never stored).
 *
 * The graph is large (~1.1 MB), so it ships on its **own subpath entry**
 * (`@invana/graph-datasets/wikipedia-dataviz`) to keep the main bundle lean.
 *
 *
 * @example
 * import { wikipediaDataViz, wikipediaDataVizSettings } from '@invana/graph-datasets/wikipedia-dataviz';
 * <GraphCanvasApp data={wikipediaDataViz} config={wikipediaDataVizSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

import raw from './wikipedia-dataviz.json';

// The JSON is already valid `GraphData`; the cast only narrows the
// string-literal unions (`label`) that JSON import widens to `string`.
// No per-record reshaping.
export const wikipediaDataViz = raw as unknown as {
  readonly meta: {
    readonly name: string;
    readonly description: string;
    readonly source: string;
    readonly sourceRepo: string;
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly clusters: readonly {
      readonly key: string;
      readonly color: string;
      readonly label: string;
    }[];
    readonly tags: readonly { readonly key: string; readonly label: string }[];
  };
  /** Positions are the data — `data.x` / `data.y` come from the source layout. */
  nodes: (GraphNode & {
    data: {
      readonly name: string;
      readonly url: string;
      readonly cluster: string;
      readonly clusterLabel: string | null;
      readonly x: number;
      readonly y: number;
      readonly score: number;
    };
  })[];
  edges: GraphEdge[];
};

/** {@link wikipediaDataViz} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = wikipediaDataViz;

/**
 * Recommended look for the **Wikipedia data-visualisation** link graph.
 *
 * The upstream graph ships its own community layout on `data.x` / `data.y`, so
 * the honest default is **no layout** (`activeLayout: ''`) — a force sim would throw
 * away the clustering the dataset was built to show. Consumers that want to
 * re-solve it point `activeLayout` at their own. Colour-by-type maps the 11 page
 * tags; the 24 finer topic clusters live on `data.cluster` for a custom resolver.
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
