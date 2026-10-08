import { CanvasConfig } from '@invana/canvas';
import * as _invana_graph from '@invana/graph';
import { GraphNode, GraphEdge, GraphData } from '@invana/graph';

/**
 * Les Misérables character co-occurrence network.
 *
 * Character relationships from Victor Hugo's *Les Misérables* novel —
 * 77 characters, 254 undirected co-occurrence edges weighted by how many
 * scenes they share. Each character belongs to one of 11 "groups" (loosely:
 * the cluster of characters they appear with most). Useful as a small but
 * structurally-rich force-directed layout demo.
 *
 * Source: Donald E. Knuth, *The Stanford GraphBase: A Platform for
 * Combinatorial Computing*, 1993 (`jean.dat`), reshaped here from the D3.js
 * examples' derived JSON.
 *
 * Licence position: Knuth publishes the SGB sources as **public domain**, with
 * a request — not a licence condition — that the canonical files not be altered
 * ("may be freely copied but please do not change it in any way"). That request
 * is about keeping the *SGB distribution* identical worldwide; it doesn't reach
 * a downstream reshaping of the co-occurrence counts, which are facts in any
 * case. Cleared under the dataset licence policy
 * (`docs/casestudies-rfc.md` §3).
 *
 * Export shape is structurally compatible with `GraphData` from
 * `@invana/graph` — pass it straight to `graph.setData()`.
 *
 * @example
 * import { lesMiserables } from '@invana/graph-datasets';
 * graph.setData(lesMiserables);
 */

/** Les Misérables co-occurrence network — pass straight to `graph.setData()`. */
declare const lesMiserables: {
    /** `data.group` is the co-occurrence cluster (0–10) — colour-by-group in stories. */
    nodes: (GraphNode & {
        data: {
            group: number;
        };
    })[];
    /** `data.value` is the number of scenes the two characters share (1–31). */
    edges: (GraphEdge & {
        data: {
            value: number;
        };
    })[];
};
/**
 * Recommended look for the **Les Misérables** co-occurrence network.
 *
 * A dense 77-character social graph: small filled dots, thin translucent links,
 * and a force layout with enough charge to open the hairball. Characters have no
 * `type` (their community is `data.group`), so the colour-by-type behaviour is off
 * — nothing to partition by — and a single node fill reads better than one colour
 * for everything anyway.
 */
declare const settings$a: CanvasConfig;

/**
 * Procedurally-generated tree, for force-layout stress tests and
 * tree-shaped demos.
 *
 * Node `i + 1`'s parent is node `floor(sqrt(i))`, which yields a
 * branchy, square-root-balanced tree in O(n) time with no RNG.
 *
 * @example
 * import { generateRandomTree } from '@invana/graph-datasets';
 * const tree = generateRandomTree(500);
 */

/**
 * Build an `numNodes`-node tree, engine-ready — ids are the node index as a
 * string, so it drops straight into `setData` with no mapping at the call site.
 */
declare const generateRandomTree: (numNodes: number) => GraphData;
/**
 * Recommended look for the **random tree**.
 *
 * A tree reads best when the hierarchy is visible, so this leans on a strong
 * repulsion + short links to spread the branches instead of coiling them. Edges get
 * no arrowheads: the parent→child direction is obvious from the shape.
 */
declare const settings$9: CanvasConfig;

/**
 * Procedurally-generated `n × n` lattice, for force-layout demos.
 *
 * Each node links to its right `(i, j+1)` and down `(i+1, j)` neighbour. Run
 * through a force simulation, the rigid links fight the n-body repulsion and the
 * grid settles into a gently-deformed lattice.
 *
 * Returns `@invana/graph` `GraphNode` / `GraphEdge` directly, so it feeds
 * `GraphLayer.setData` with no mapping:
 *
 * @example
 * import { generateLattice } from '@invana/graph-datasets';
 * graph.setData(generateLattice(20));
 */

declare const generateLattice: (n: number) => GraphData;
/**
 * Recommended look for the **lattice** grid.
 *
 * A regular n×n mesh is a stress test, not a picture of anything — so the marks
 * are as small as they can be while staying visible, and the links carry the
 * structure. The force layout's link distance is what sets the cell size; charge
 * stays weak so the mesh relaxes into a grid rather than exploding.
 */
declare const settings$8: CanvasConfig;

/**
 * **Twitter activity — the generator halves.**
 *
 * The dataset used to be one 150-line function that built every node type and
 * every edge type inline. Here it's a **declarative spec per type**: each node
 * type lists its properties, and each property is produced by its own
 * `<name>_func` generator. Adding a field to a node type is one line; changing
 * how a field is drawn never means reading the surrounding loop.
 *
 * Two rules hold the pieces together:
 *
 * 1. **Property generators run in declaration order**, and each one receives the
 *    record built so far (`self`). That's what lets `avatar_func` return
 *    `self.handle`, or `author_func` look up the user `authorId_func` just
 *    picked.
 * 2. **Generators never close over shared mutable state** — everything they need
 *    (the seeded RNG, the id pools filled so far, a node lookup) arrives on the
 *    {@link GeneratorContext}. That's what makes a type's spec readable on its
 *    own, and the whole run reproducible from `seed`.
 *
 * Node types are generated in `NODE_GENERATORS` order, so a type may reference
 * any type declared before it. Edges run last, once every pool is complete.
 */

/** A node's attribute bag. Values stay primitive so the data serialises. */
type NodeProperties = Record<string, string | number | boolean>;
/** A generated node: the engine's record with a guaranteed `data` bag. */
type GeneratedNode = GraphNode & {
    type: string;
    data: NodeProperties;
};
/** Knobs for {@link runGenerators}. Counts are per node type. */
interface TwitterDatasetOptions {
    users?: number;
    tweets?: number;
    comments?: number;
    hashtags?: number;
    retweets?: number;
    /** PRNG seed — same seed → same graph. Default `42`. */
    seed?: number;
}

/**
 * Build the mocked Twitter activity graph (~100 nodes by default) by running the
 * per-type generators in `./generators` — one spec per node type and per edge
 * type, each property produced by its own `*_func`.
 */
declare function generateTwitterActivity(opts?: TwitterDatasetOptions): {
    nodes: GeneratedNode[];
    edges: _invana_graph.GraphEdge[];
};
/** The default instance — 18 users, 34 tweets, 26 comments, 12 hashtags, 10 retweets. */
declare const twitterActivity: {
    nodes: GeneratedNode[];
    edges: _invana_graph.GraphEdge[];
};
/**
 * Recommended look for the **Twitter activity** graph.
 *
 * Five node types (`User` · `Tweet` · `Comment` · `Hashtag` · `Retweet`) and eight
 * edge types, so this is one of the few datasets where colour-by-type earns its
 * keep — it's left **on**, and the palette does the categorising with no per-node
 * wiring. Edges get arrowheads because direction is meaningful here (who posted
 * what, who replied to whom).
 */
declare const settings$7: CanvasConfig;
/**
 * The same graph as {@link settings}, drawn as **composite cards** — a tweet
 * card, a user id-card and a slimmer comment card, with hashtags and retweets
 * left as compact marks.
 *
 * Everything here is still pure JSON: structures are slot skeletons, stylings
 * are theme roles, and each slot binds to a dotted data path. That's the whole
 * template stack, so this doubles as the fixture for the node-template editors.
 *
 * Three things differ from the plain look, and all three follow from card size:
 *
 * 1. **The force layout is opened right up** — a 260×156 card needs an order of
 *    magnitude more room than a 7px dot, so charge, link distance and the
 *    collision radius all grow. Without that the cards stack into a pile.
 * 2. **Colour-by-type is off.** The styling templates own colour now; leaving
 *    the behaviour on would repaint every card body with its type colour.
 * 3. **Edges thin out** — at card scale the links are connective tissue, not the
 *    subject, so they lose their arrowheads' visual weight.
 */
declare const cardSettings: CanvasConfig;

/**
 * The classic **Flare** software hierarchy — the same dataset used in
 * d3-hierarchy's tidy / radial / treemap examples.
 *
 * Two shapes are exposed:
 *  - `flareHierarchy` — the original nested `{name, value?, children?}` tree.
 *  - `flareAsGraph()` — a flat `{nodes, edges}` projection that drops
 *    straight into `GraphLayer.setData`. Each edge points from parent to
 *    child, so a hierarchy layout (e.g. `D3HierarchyLayout`) can read the
 *    topology directly off `edge.source → edge.target`.
 *
 * @example
 * import { flareAsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(flareAsGraph());
 */

/** Node shape in the original Flare hierarchy. Leaves carry `value`; inner
 *  nodes carry `children`. The root has neither field guaranteed. */
interface FlareNode {
    name: string;
    value?: number;
    children?: FlareNode[];
}
/** The original Flare hierarchy in its nested form. */
declare const flareHierarchy: FlareNode;
/**
 * Flatten {@link flareHierarchy} to a `{nodes, edges}` shape compatible with
 * `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
 * ids so duplicate names across branches stay distinct.
 */
declare function flareAsGraph(): {
    nodes: (GraphNode<unknown> & {
        data: {
            name: string;
            depth: number;
            isLeaf: boolean;
            value?: number;
            group?: string;
        };
    })[];
    edges: GraphEdge<unknown>[];
};
/**
 * Recommended look for the **Flare** package hierarchy.
 *
 * The flattened Flare tree is the canonical d3-hierarchy fixture, so these
 * settings assume a hierarchical layout the consumer mounts under the id `layout`
 * (`D3HierarchyLayout` in `tree` mode is the obvious pick) rather than the bundle's
 * force sim. Leaves and branches are the same mark — depth is carried by position.
 */
declare const settings$6: CanvasConfig;

/**
 * Flare **with synthetic class-imports** — companion to {@link flareAsGraph}
 * for the d3 *Hierarchical Edge Bundling* demo
 * (https://observablehq.com/@d3/hierarchical-edge-bundling/2).
 *
 * The Observable demo ships a flat `flare-imports.json` where every leaf
 * class carries an `imports: string[]` list of other class names it
 * "depends on". We don't bundle that file (no network fetch available at
 * dataset-build time); instead we generate a deterministic synthetic
 * imports graph over the existing nested `flare.json`, biased so that:
 *
 *  - each leaf imports a small handful of other leaves (1–5);
 *  - ~70% of imports stay inside the leaf's depth-1 package
 *    (`flare.analytics`, `flare.vis`, ...); the rest reach across packages.
 *
 * That bias is what *makes* hierarchical edge bundling worth looking at:
 * intra-package edges form dense, tightly-bundled arcs through one parent;
 * inter-package edges sweep across the centre. Visually it reproduces the
 * d3 demo faithfully; only the specific source/target pairs differ.
 *
 * The generator is seeded by the leaf's id, so the same call always
 * produces the same edges — stories stay snapshot-stable across reloads.
 *
 * @example
 * import { flareImportsAsGraph } from '@invana/graph-datasets';
 * const { nodes, treeEdges, importEdges } = flareImportsAsGraph();
 * graph.setData({ nodes, edges: treeEdges });
 * await new D3HierarchyLayout({ mode: 'radial-cluster' }).apply(graph);
 * // ... then swap to importEdges and render with `pathType: 'bundle'`.
 */

/**
 * The payload flare's node records carry (see `../flare/data`). Read through
 * {@link payload} — node `data` is the engine's opaque bag, so the shape is
 * asserted here, at the point of use, rather than exported as a dataset type.
 */
interface FlareNodePayload {
    readonly name: string;
    readonly depth: number;
    readonly isLeaf: boolean;
    readonly group?: string;
}
/** Output of {@link flareImportsAsGraph}. */
interface FlareImportsGraphData {
    nodes: (GraphNode & {
        data: FlareNodePayload;
    })[];
    /** Parent→child edges from the flare hierarchy. Feed these to the layout. */
    treeEdges: GraphEdge[];
    /** Synthetic leaf→leaf import edges. Render these as bundled curves. */
    importEdges: GraphEdge[];
}
/** Options for {@link flareImportsAsGraph}. */
interface FlareImportsOptions {
    /** Minimum import out-degree per leaf. Default `1`. */
    readonly minImportsPerLeaf?: number;
    /** Maximum import out-degree per leaf. Default `5`. */
    readonly maxImportsPerLeaf?: number;
    /**
     * Probability that a generated import targets a leaf in the same depth-1
     * package as its source (vs a leaf in any other package). Default `0.7`
     * — produces a dense-intra-package + sparse-cross-package mix that
     * bundles cleanly through the hierarchy.
     */
    readonly intraGroupBias?: number;
}
/**
 * Build the Flare hierarchy plus a deterministic synthetic imports graph
 * over its leaves. See module doc for the generation policy.
 */
declare function flareImportsAsGraph(opts?: FlareImportsOptions): FlareImportsGraphData;
/**
 * Recommended look for the **Flare import network**.
 *
 * Class-to-class imports are a dense directed network, so the edges are hairline
 * and heavily faded — the shape comes from their aggregate, not any single link.
 * Hover lights the 1-hop neighbourhood, which is the only practical way to read an
 * individual class's dependencies at this density.
 */
declare const settings$5: CanvasConfig;

/**
 * **H-1B 2019** — USCIS H-1B employer petition counts for fiscal year 2019,
 * aggregated into a **State → City → Employer** hierarchy. The same dataset
 * used in the d3 [`pack-rollup`](https://observablehq.com/@d3/pack-rollup/2)
 * example. Source: [USCIS H-1B Data Hub](https://www.uscis.gov/h-1b-data-hub).
 *
 * Aggregation was done offline (see `tools/build-h1b2019.ts` or the
 * data-import note below) so the package ships a single static JSON instead
 * of a 1.8 MB CSV that would need parsing at import time. The leaf `value` is
 * the sum of all four petition outcomes for that employer / city / state:
 *
 *     value = InitialApprovals + InitialDenials
 *           + ContinuingApprovals + ContinuingDenials
 *
 * matching d3.rollup's:
 *
 *     d3.rollup(rows, D => d3.sum(D, d => d.IA + d.ID + d.CA + d.CD),
 *               d => d.State, d => d.City, d => d.Employer)
 *
 * Employers with a zero total are pruned during aggregation — d3.pack treats
 * zero-value leaves as 0-radius circles, so removing them avoids cluttering
 * the layout with invisible nodes.
 *
 * Two shapes are exposed, mirroring the Flare API:
 *  - `h1b2019Hierarchy` — the original nested `{name, value?, children?}` tree.
 *  - `h1b2019AsGraph()` — flat `{nodes, edges}` projection, ready for
 *    `GraphLayer.setData`.
 *
 * @example
 * import { h1b2019AsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(h1b2019AsGraph());
 */

/**
 * Node shape in the rolled-up H-1B hierarchy. Identical structure to
 * {@link FlareNode}: leaves carry `value`, inner nodes (root, states, cities)
 * carry `children`.
 */
interface H1B2019Node {
    name: string;
    value?: number;
    children?: H1B2019Node[];
}
/** The H-1B 2019 hierarchy in its nested form. */
declare const h1b2019Hierarchy: H1B2019Node;
/**
 * Flatten {@link h1b2019Hierarchy} to a `{nodes, edges}` shape compatible with
 * `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
 * ids so duplicate names across branches stay distinct.
 *
 * Returns ~55 states + ~3 000 cities + ~22 000 employer leaves; allocating
 * each call is cheap (one pass over a 1 MB JSON), so consumers can re-call
 * after filtering settings change without caching.
 */
declare function h1b2019AsGraph(): {
    nodes: (GraphNode<unknown> & {
        data: {
            name: string;
            depth: number;
            isLeaf: boolean;
            value?: number;
            group?: string;
        };
    })[];
    edges: GraphEdge<unknown>[];
};
/**
 * Recommended look for the **H-1B 2019** state → city → employer hierarchy.
 *
 * Four levels and thousands of leaves, so this expects a hierarchical layout
 * mounted under the id `layout` — radial or pack, where the leaf count is the point.
 * Marks stay tiny and labels off by default; a consumer that wants employer names
 * turns them on for the depth it cares about.
 */
declare const settings$4: CanvasConfig;

/**
 * **Life tree** — a synthetic phylogeny of 145 species partitioned into the
 * three domains of life (Bacteria, Eukaryota, Archaea): a deep, unbalanced,
 * three-way hierarchy for the radial / cluster / tidy-tree layouts.
 *
 * **Generated, not stored.** Built at import time by
 * {@link generateLifeTreeNewick} from a fixed seed — see that file for why the
 * previous source (Ciccarelli et al. 2006, via d3's Tree of Life) was replaced.
 * The three domain names are universal taxonomic ranks; every genus and species
 * below them is invented.
 *
 * Two shapes are exposed:
 *  - `lifeTreeHierarchy` — the parsed Newick tree as a `{name, length, children?}`
 *    nested object.
 *  - `lifeTreeAsGraph()` — a flat `{nodes, edges}` projection that drops
 *    straight into `GraphLayer.setData`. Each edge points from parent to
 *    child; each node carries its inherited `kingdom` so consumers can colour
 *    sub-trees by domain of life.
 *
 * @example
 * import { lifeTreeAsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(lifeTreeAsGraph());
 */

/** Node shape in the parsed Newick hierarchy. */
interface LifeTreeNode {
    /** Clade or species name. May be empty for anonymous internal nodes. */
    name: string;
    /** Branch length to parent (substitution rate). `undefined` on the root. */
    length?: number;
    /** Child clades. Leaves omit this field. */
    children?: LifeTreeNode[];
}
/** The parsed Tree of Life as a nested hierarchy. Computed once. */
declare const lifeTreeHierarchy: LifeTreeNode;
/**
 * Flatten {@link lifeTreeHierarchy} to a `{nodes, edges}` shape compatible
 * with `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined
 * path ids so anonymous internal clades — and duplicate names across branches
 * — stay distinct. Each node carries its inherited `kingdom`.
 *
 * The Newick source reuses generic clade labels (e.g. `Bacteria_subclade`)
 * across many sibling positions, so a plain slash-path can collide. When that
 * happens, the colliding child gets a numeric suffix (`_2`, `_3`, …) so every
 * emitted id is unique while the readable path is preserved in the common
 * case.
 */
declare function lifeTreeAsGraph(): {
    nodes: (GraphNode<unknown> & {
        data: {
            name: string;
            depth: number;
            isLeaf: boolean;
            length?: number;
            kingdom?: "Bacteria" | "Eukaryota" | "Archaea";
        };
    })[];
    edges: GraphEdge<unknown>[];
};
/**
 * Recommended look for the **tree of life** phylogeny.
 *
 * A phylogeny is read radially — every clade fans from a common root — so this
 * expects a hierarchical layout under the id `layout` in `radial-tree` mode. Branch
 * lengths live on `data.length`; the layout, not these settings, decides whether to
 * honour them.
 */
declare const settings$3: CanvasConfig;

/**
 * UK energy-flow dataset — the canonical d3-sankey example fixture.
 *
 * 48 nodes, 68 weighted links representing 2050 UK energy flows from
 * supply (coal reserves, oil reserves, nuclear, renewables, imports) →
 * intermediate carriers (oil, gas, electricity grid, solid / liquid /
 * gaseous fuels) → end use (industry, heating, transport, losses).
 *
 * Source: DECC 2050 Pathways (UK Department of Energy and Climate Change),
 * via Tom Counsell's d3-sankey example used since 2012. Reproduced from
 * `https://bost.ocks.org/mike/sankey/energy.json`, which ships as
 * `test/energy.json` inside [`d3/d3-sankey`](https://github.com/d3/d3-sankey)
 * — a **BSD-3-Clause** repository (an earlier revision of this comment said
 * MIT; d3-sankey is BSD-3-Clause and d3 itself is ISC).
 *
 * Licence position: the payload is **48 node labels and 68 flow quantities** —
 * measurements, which carry no copyright of their own — distributed inside a
 * permissively-licensed repository. Cleared under the dataset licence policy
 * (`docs/casestudies-rfc.md` §3).
 *
 * Two shapes are exposed:
 *  - `ukEnergyFlow` — the original `{nodes:[{name}], links:[{source,target,value}]}`
 *    shape (numeric indices on the links), suitable for direct use with
 *    `d3.sankey()`.
 *  - `ukEnergyFlowAsGraph()` — a `{nodes, edges}` projection ready for
 *    `GraphLayer.setData`. Node ids are the original `name` field; edge
 *    ids are `<source>--<target>` (no duplicates in this dataset).
 *
 * @example
 * import { ukEnergyFlowAsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(ukEnergyFlowAsGraph());
 */

/** Original (numeric-index) node shape. */
interface UkEnergyFlowNode {
    name: string;
}
/** Original (numeric-index) link shape — `source` / `target` are indices
 *  into the `nodes` array. */
interface UkEnergyFlowLink {
    source: number;
    target: number;
    value: number;
}
/** Original `{nodes, links}` shape (matches d3-sankey's expected input). */
interface UkEnergyFlow {
    nodes: UkEnergyFlowNode[];
    links: UkEnergyFlowLink[];
}
/** Original dataset, untouched. Pass straight to `d3.sankey()` if you want
 *  to drive the layout yourself; otherwise use {@link ukEnergyFlowAsGraph}. */
declare const ukEnergyFlow: UkEnergyFlow;
/**
 * Project {@link ukEnergyFlow} to `{nodes, edges}` for `GraphLayer.setData`.
 *
 * The mapping:
 *  - Numeric link endpoints → string ids (the node `name`).
 *  - Each node carries `data.category` for colour grouping.
 *  - Edge ids are `<source>--<target>`; the source dataset has no duplicate
 *    pairs, so no extra disambiguation is needed.
 */
declare function ukEnergyFlowAsGraph(): {
    nodes: (GraphNode<unknown> & {
        data: {
            name: string;
            category: string;
        };
    })[];
    edges: (GraphEdge<unknown> & {
        data: {
            value: number;
        };
    })[];
};
/**
 * Recommended look for the **UK energy flow** Sankey.
 *
 * A flow diagram, so it expects a `D3SankeyLayout` mounted under the id `layout`.
 * The ribbons are the data — edge width comes from the layout, and the endpoints
 * attach to node faces (`edge-port`) rather than being trimmed at an outline, which
 * is what keeps a ribbon flush against its bar.
 */
declare const settings$2: CanvasConfig;

/**
 * Old Faithful geyser eruptions — 272 measurements.
 *
 * Each record pairs an eruption's duration in minutes (`eruptions`, 1.5–5.1)
 * with the time in minutes until the next eruption (`waiting`, 43–96). The
 * dataset is famously bimodal — two distinct (short, short-wait) and
 * (long, long-wait) clusters — which makes it a canonical demo for 2D
 * density estimators. This is the source dataset behind the Observable
 * [`@d3/density-contours`](https://observablehq.com/@d3/density-contours)
 * example.
 *
 * Source: W. Härdle (1991), *Smoothing Techniques with Implementation in S*,
 * New York: Springer; the same 272 observations R bundles as
 * `datasets::faithful`.
 *
 * Licence position: the payload is **272 pairs of numbers** — physical
 * measurements of a geyser, which carry no copyright. (R's `datasets` *package*
 * is GPL-2, but that covers the package, not the observations.) Cleared under
 * the dataset licence policy (`docs/casestudies-rfc.md` §3).
 *
 * The exported `oldFaithful` is a nodes-only `GraphData` ready for
 * `GraphLayer.setData()` — each point becomes a node positioned at
 * `(waiting, eruptions * 20)` so that the two axes have comparable spread in
 * world units (waiting ≈ 53 units of range, scaled eruptions ≈ 72 units).
 * No edges.
 *
 * @example
 * import { oldFaithful } from '@invana/graph-datasets';
 * graph.setData(oldFaithful);
 */

declare const oldFaithful: {
    nodes: GraphNode<unknown>[];
    edges: never[];
};
/**
 * Recommended look for the **Old Faithful** eruption scatter.
 *
 * Not a network at all — 272 eruptions plotted as a scatter, with `position`
 * already baked into the data and no edges. So there is **no layout** (`activeLayout: ''`);
 * anything that moved the points would destroy the chart. Nodes carry a `cluster`
 * of `short` / `long` on `data`, not as a `type`, so colour-by-type is off.
 */
declare const settings$1: CanvasConfig;

/**
 * `air-routes` — world airports + land outline geo data.
 *
 * Companion dataset for the maplibre stories. Mirrors the data referenced
 * by Observable's
 * [`@d3/world-airports`](https://observablehq.com/@d3/world-airports) —
 * `airports.csv` (Natural Earth airports point set) and a 1:50m
 * land-only TopoJSON for the basemap stroke.
 *
 * See `air-routes/README.md` for sources, licensing, and the exact files
 * the JSON in this folder was derived from.
 *
 * @example
 * ```ts
 * import { airports, landTopology } from '@invana/graph-datasets';
 *
 * for (const a of airports) {
 *   const { x, y } = mapLayer.project([a.lng, a.lat]);
 *   // ...
 * }
 * ```
 */

/** A single airport point. */
interface Airport {
    /** Airport name from the source CSV (e.g. `"London Heathrow Airport"`). */
    name: string;
    /** Longitude in degrees, WGS-84. */
    lng: number;
    /** Latitude in degrees, WGS-84. */
    lat: number;
}
/**
 * Loose TopoJSON shape — the world-50m land outline used by the d3
 * notebook. Typed structurally (no `topojson-specification` dep) since
 * consumers either pass this straight to `topojson-client.feature(...)`
 * or pluck `.objects.land` directly.
 */
interface LandTopology {
    type: 'Topology';
    bbox?: [number, number, number, number];
    transform?: {
        scale: [number, number];
        translate: [number, number];
    };
    arcs: number[][][];
    objects: {
        land: {
            type: 'MultiPolygon' | 'GeometryCollection';
            arcs?: unknown;
            geometries?: unknown[];
        };
    };
}
/**
 * All `2980` airport points from `airports.csv`. Order matches the source
 * CSV; ids are not assigned here because the source has no stable id
 * column — story code typically synthesizes ids from the array index
 * (`'ap-' + i`).
 */
declare const airports: Airport[];
/**
 * 1:50m world land outline as TopoJSON. Pair with `topojson-client.feature`
 * to materialize the GeoJSON `MultiPolygon`, then sample with `d3-geo`'s
 * `geoPath` over a custom canvas projection.
 */
declare const landTopology: LandTopology;
/**
 * Recommended look for the **air routes** airport set.
 *
 * Airports are geography, not topology: every node's real position comes from
 * projecting `data.lng` / `data.lat` through whichever map the consumer mounts, so
 * there is **no layout** (`activeLayout: ''`) and dragging is off — a moved airport
 * is a wrong airport. Marks are small and uniform because 2,980 of them overlap
 * heavily at world zoom.
 */
declare const settings: CanvasConfig;

/**
 * **Canvas dataflow** — the engine's own type / instance graph, as a graph.
 *
 * Every node is a real symbol in this monorepo, and every edge is a real
 * relationship traced from the source (file references are in `data.file`). It
 * answers one question: **what happens to a node between `<GraphCanvasApp data>`
 * and a pixel?**
 *
 * The short version, and the spine of the graph:
 *
 * ```
 *   GraphData ──setData──▶ GraphStore ──▶ GraphNode  (the stored record)
 *                                            │
 *                          resolveNodeStyle  │  merges NodeOption + node.style + states
 *                                            ▼
 *                                        NodeStyle  (flat, concrete)
 *                                            │
 *                              GraphLayer.nodeSpec  ◀── the one translation point
 *                                            ▼
 *                                     BaseShapeSpec  (canvas vocabulary)
 *                                            │
 *                     PrimitivesRenderer.addShape    kind → registered class
 *                                            ▼
 *                                       CircleShape  (an IShape instance)
 * ```
 *
 * ### Three things the picture makes obvious
 *
 * 1. **`@invana/canvas` has no record type.** There is no `Shape` data object
 *    paralleling `GraphNode` — a shape exists only as a *spec you hand in* and an
 *    *instance the renderer holds*. All persistence is graph-side.
 * 2. **`GraphStore` plugs into the kernel, it doesn't compete with it.** It
 *    `implements DataSource` — a three-method interface — and `GraphLayer`
 *    registers it under the layer id. The kernel never learns what a graph is.
 * 3. **Edges compile into four sub-choices where nodes make one.** A node picks a
 *    single geometry (`shape.kind`); an edge composes anchor + router + pathStyle
 *    + marker. That's why `NodeShapeOptions` is a discriminated union and
 *    `EdgeShapeOptions` is a flat interface.
 *
 * `type` is the **layer of the stack** a symbol belongs to, so colour-by-type
 * reads as a vertical section through the engine. `data.package` is the owning
 * package, for colouring by ownership instead.
 *
 * @example
 * import { canvasDataflow, canvasDataflowSettings } from '@invana/graph-datasets';
 * <GraphCanvasApp data={canvasDataflow} config={canvasDataflowSettings} />
 */

/** What kind of TypeScript construct the symbol is — distinct from its stack layer. */
type SymbolKind = 'class' | 'interface' | 'type' | 'function' | 'component' | 'const' | 'package';
/** Payload every node carries. `purpose` is the one-line "why does this exist". */
interface DataflowPayload {
    name: string;
    package: string;
    symbol: SymbolKind;
    purpose: string;
    file?: string;
}
/**
 * The engine's type / instance dataflow — **data only**.
 *
 * No `settings`, deliberately, and no card templates: this dataset describes
 * *what the symbols are*, not how to draw them. A consumer supplies the look —
 * see `usecases/by-casestudies/code-explainability`, which owns the card
 * structures, stylings and layout config for it.
 *
 * (This is the one dataset in the package without a `settings` half. Every other
 * one ships a recommended look because the look is inseparable from the data —
 * a Sankey needs a Sankey layout. Here the graph is just a DAG of symbols, and
 * the interesting looks are the consumer's business.)
 */
declare const canvasDataflow: {
    nodes: (GraphNode & {
        data: DataflowPayload;
    })[];
    edges: (GraphEdge & {
        data: {
            note: string;
        };
    })[];
};

export { airports, settings as airportsSettings, canvasDataflow, flareAsGraph, flareHierarchy, flareImportsAsGraph, settings$5 as flareImportsSettings, settings$6 as flareSettings, generateLattice, generateRandomTree, generateTwitterActivity, h1b2019AsGraph, h1b2019Hierarchy, settings$4 as h1b2019Settings, landTopology, settings$8 as latticeSettings, lesMiserables, settings$a as lesMiserablesSettings, lifeTreeAsGraph, lifeTreeHierarchy, settings$3 as lifeTreeSettings, oldFaithful, settings$1 as oldFaithfulSettings, settings$9 as randomTreeSettings, twitterActivity, cardSettings as twitterActivityCardSettings, settings$7 as twitterActivitySettings, ukEnergyFlow, ukEnergyFlowAsGraph, settings$2 as ukEnergyFlowSettings };
