import * as _invana_graph from '@invana/graph';
import { GraphNode, GraphEdge } from '@invana/graph';
import { CanvasConfig } from '@invana/canvas';

/**
 * **Topic Cartography — the generator.**
 *
 * Builds a **fictional** knowledge-base link graph: ~2,000 topic pages of eleven
 * kinds, wired by directed `links_to` hyperlinks, each page carrying a
 * precomputed 2D position, a community cluster, and a PageRank-like importance
 * score. Every page name and cluster label is invented by this file — nothing is
 * scraped from, or derived from, any real encyclopedia.
 *
 * ### Why a generator and not a JSON
 *
 * This dataset exists to be the package's **cartography** fixture: a graph whose
 * *positions are the data*, so `activeLayout: ''` is the honest default and the
 * story is about reading a pre-laid-out map rather than solving one. That is a
 * property of the layout, not of any particular encyclopedia's contents — so it
 * reproduces synthetically at no licence cost and a fraction of the bytes
 * (~1.6 MB of JSON → a few KB of source).
 *
 * ### How the map gets its shape
 *
 * A real ForceAtlas2 run on a clustered link graph produces petals: dense blobs
 * around each community, arranged on a rough disc, with sparse long edges
 * between them. Rather than run a layout, the generator **places** that outcome
 * directly — cluster centroids on a golden-angle spiral, members scattered
 * around their centroid with a Gaussian falloff, and links drawn ~85 %
 * intra-cluster. The result is visually indistinguishable from a solved
 * cartography and is deterministic.
 *
 * Same `seed` → byte-identical graph. The PRNG is mulberry32, the same one
 * `twitter/generators.ts` uses.
 */

/** Knobs for {@link generateTopicCartography}. Defaults reproduce the ~2k / ~5.4k graph. */
interface TopicCartographyOptions {
    /** Pages in the corpus. Default `2083`. */
    pages?: number;
    /** Directed `links_to` hyperlinks. Default `5409`. */
    links?: number;
    /** Community clusters the map is organised into. Default `24`. */
    clusters?: number;
    /** Fraction of links that stay inside a cluster (0–1). Default `0.85`. */
    intraClusterRatio?: number;
    /** PRNG seed — same seed → same graph. Default `20`. */
    seed?: number;
}
/** A generated page vertex — positions and score are content, not decoration. */
type PageNode = GraphNode & {
    data: {
        name: string;
        url: string;
        cluster: string;
        clusterLabel: string | null;
        x: number;
        y: number;
        score: number;
    };
};
/**
 * Generate the full cartography graph.
 *
 * @param options — counts + seed; see {@link TopicCartographyOptions}.
 * @returns `{ meta, nodes, edges }` in the engine-ready shape `setData` takes.
 *
 * @example
 * const map = generateTopicCartography({ pages: 20_000, seed: 3 });
 */
declare function generateTopicCartography(options?: TopicCartographyOptions): {
    meta: {
        name: string;
        description: string;
        source: string;
        sourceRepo: string;
        nodeCount: number;
        edgeCount: number;
        clusters: {
            key: string;
            color: string;
            label: string;
        }[];
        tags: {
            key: string;
            label: string;
        }[];
    };
    nodes: PageNode[];
    edges: GraphEdge<unknown>[];
};

/** The default cartography — ~2,083 pages / ~5,409 links from seed `20`. */
declare const topicCartography: {
    meta: {
        name: string;
        description: string;
        source: string;
        sourceRepo: string;
        nodeCount: number;
        edgeCount: number;
        clusters: {
            key: string;
            color: string;
            label: string;
        }[];
        tags: {
            key: string;
            label: string;
        }[];
    };
    nodes: (_invana_graph.GraphNode<unknown> & {
        data: {
            name: string;
            url: string;
            cluster: string;
            clusterLabel: string | null;
            x: number;
            y: number;
            score: number;
        };
    })[];
    edges: _invana_graph.GraphEdge<unknown>[];
};
/** {@link topicCartography} as the engine-ready value `<GraphCanvasApp data>` takes. */
declare const data: {
    meta: {
        name: string;
        description: string;
        source: string;
        sourceRepo: string;
        nodeCount: number;
        edgeCount: number;
        clusters: {
            key: string;
            color: string;
            label: string;
        }[];
        tags: {
            key: string;
            label: string;
        }[];
    };
    nodes: (_invana_graph.GraphNode<unknown> & {
        data: {
            name: string;
            url: string;
            cluster: string;
            clusterLabel: string | null;
            x: number;
            y: number;
            score: number;
        };
    })[];
    edges: _invana_graph.GraphEdge<unknown>[];
};
/**
 * Recommended look for the **Topic Cartography** link graph.
 *
 * The graph ships its own community layout on `data.x` / `data.y`, so the honest
 * default is **no layout** (`activeLayout: ''`) — a force sim would throw away the
 * clustering the dataset exists to show. Consumers that want to re-solve it point
 * `activeLayout` at their own. Colour-by-type maps the 11 page tags; the 24 finer
 * topic clusters live on `data.cluster` for a custom resolver.
 */
declare const settings: CanvasConfig;

export { type TopicCartographyOptions, data, generateTopicCartography, topicCartography, settings as topicCartographySettings };
