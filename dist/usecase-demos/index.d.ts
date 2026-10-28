import { CanvasConfig } from '@invana/canvas';
import { GraphNode, GraphEdge } from '@invana/graph';

/**
 * Synthetic **LLM agent traces** — small DAGs that approximate the kind
 * of execution graph LangSmith / Langfuse / Helicone draw for a single
 * agent run. Each node is an `llm` call, a `tool` invocation, a
 * `decision` branch, or a terminal `output`. Each edge is a `calls`
 * (control-flow), `returns` (data-flow), or `branch` (decision branch).
 *
 * Three presets are exported so a single story can illustrate the
 * happy path, an error+retry path, and a multi-tool branching path
 * without re-deriving the data per render.
 *
 * Designed for layered DAG layouts (ELK `layered` `DOWN`); the dataset
 * carries no positions.
 */

/**
 * A named preset — a trace graph plus the id/name the story's picker lists it
 * under. Local by design: the exported value carries the shape by inference, so
 * no consumer needs a type import.
 */
interface AgentTracePreset {
    readonly id: string;
    readonly name: string;
    nodes: (GraphNode & {
        type: 'llm' | 'tool' | 'decision' | 'output';
        data: {
            readonly kind: 'llm' | 'tool' | 'decision' | 'output';
            readonly label: string;
            readonly status: 'success' | 'error' | 'pending';
            readonly durationMs: number;
            readonly tokens?: number;
        };
    })[];
    edges: (GraphEdge & {
        data: {
            readonly kind: 'calls' | 'returns' | 'branch';
        };
    })[];
}
/** All three presets, in display order. */
declare const agentTrace: readonly AgentTracePreset[];
/**
 * Recommended look for an **LLM agent trace**.
 *
 * A trace is a run, and a run reads top-to-bottom — so this expects a layered
 * `ElkLayout` mounted under the id `elk` rather than the bundle's force sim. Steps
 * are labelled boxes; colour-by-type separates the step kinds (llm · tool · output
 * · …). Each step's `status` and `durationMs` stay on `data` for a consumer's
 * badge / colour resolver.
 */
declare const settings$a: CanvasConfig;

/**
 * Synthetic **RAG embedding explorer** dataset — ~400 2D points that
 * imitate a UMAP / t-SNE projection of a vector index. Five thematic
 * clusters (auth, billing, search, infra, ML) plus a sprinkling of
 * uniform outliers, generated from a seeded RNG so the visualisation
 * is stable across reloads.
 *
 * Each point carries a `cluster` id, a short `text` snippet that stands
 * in for the chunk content, and a `source` filename. There are no edges
 * — the story renders raw points overlaid by a
 * `DensityContourFillLayer` to bring the cluster topology forward.
 */

declare const CLUSTER_NAMES: readonly ["auth", "billing", "search", "infra", "ml"];
type RagEmbeddingsCluster = (typeof CLUSTER_NAMES)[number];
declare const ragEmbeddings: {
    nodes: (GraphNode<unknown> & {
        data: {
            cluster: RagEmbeddingsCluster;
            text: string;
            source: string;
        };
    })[];
    edges: never[];
};
/**
 * Recommended look for the **RAG embedding** projection.
 *
 * An embedding projection: every chunk's `position` **is** the data, so there is
 * **no layout** (`activeLayout: ''`) and dragging is off — moving a point would be
 * lying about the embedding. Marks are small translucent dots so overlapping
 * regions read as density, which is what a contour overlay then picks up.
 * Colour-by-type separates the semantic clusters.
 */
declare const settings$9: CanvasConfig;

/**
 * Synthetic **microservices topology** dataset — ~20 services across a
 * SaaS stack with call edges carrying RPS and per-edge error rates.
 * Designed for a Datadog / Istio / Linkerd-style service-map demo.
 *
 * The dataset embeds one degraded service (`order-api`), one degraded
 * downstream (`payment-service`), and one downed service
 * (`fraud-detector`) so the story has something to flag visually
 * without the consumer rolling a fake "simulate degradation" loop just
 * to see the styled states.
 */

declare const microservices: {
    nodes: (GraphNode<unknown> & {
        data: {
            tier: "gateway" | "api" | "logic" | "data" | "external";
            health: "healthy" | "degraded" | "down";
            rps: number;
        };
    })[];
    edges: (GraphEdge<unknown> & {
        data: {
            rps: number;
            errorRate: number;
        };
    })[];
};
/**
 * Recommended look for the **microservices** topology.
 *
 * A service map, so services are rounded boxes with their name inside rather than
 * dots — an operator reads names, not positions. Colour-by-type separates the tiers
 * (gateway · api · worker · datastore …). Health and RPS live on `data` and drive
 * per-node colour / edge width through a consumer-supplied resolver; these settings
 * deliberately stop at what serialises.
 */
declare const settings$8: CanvasConfig;

/**
 * Synthetic **company knowledge-graph** — entities of five kinds linked
 * by typed relations. Modelled after Palantir / Neo4j Bloom / Diffbot
 * entity-ontology demos so the story has a recognisable picture: five
 * companies, the people who founded / run them, the products they ship,
 * the cities they're based in, and the industries they operate in.
 *
 * The dataset is deliberately under-connected at the periphery so the
 * "double-click to expand" interaction in the story has something
 * meaningful to do — start with the core companies + their CEOs and
 * unfold the products, locations, and industries by clicking.
 */

declare const ontology: {
    nodes: (GraphNode<unknown> & {
        data: {
            kind: "company" | "person" | "product" | "location" | "industry";
            name: string;
        };
    })[];
    edges: (GraphEdge<unknown> & {
        data: {
            kind: "founded" | "ceo_of" | "works_at" | "builds" | "headquartered_in" | "operates_in" | "competes_with";
        };
    })[];
    coreIds: readonly string[];
};
/**
 * Recommended look for the **ontology** knowledge graph.
 *
 * A small, readable knowledge graph — few enough entities that every node can
 * carry its label, which is the point of an ontology view. Colour-by-type separates
 * the entity kinds, and edges keep arrowheads because a triple's direction is its
 * meaning.
 */
declare const settings$7: CanvasConfig;

/**
 * Synthetic **citation graph** — 150 papers across 5 research topics,
 * connected by directed `paper-cites-paper` edges. Designed for a
 * Connected-Papers / Litmaps / Elicit-style overview: density contours
 * per topic bring the cluster topology forward, force layout pulls the
 * dense intra-topic citation neighbourhoods together, and the inter-
 * topic edges form the long bridges between clusters.
 *
 * Generation rules (seeded for snapshot stability):
 *
 *   - 30 papers per topic across 5 topics, years span 2018–2025.
 *   - `citationsCount` drawn from a clipped log-normal so a handful of
 *     hub papers dominate the visualisation.
 *   - Each paper cites 2–4 prior papers, biased 70% intra-topic and
 *     30% inter-topic. Within the bias bucket, targets are weighted
 *     toward older papers with higher citation counts — i.e. crude
 *     preferential attachment.
 */

declare const TOPICS: readonly ["transformers", "diffusion-models", "reinforcement-learning", "graph-neural-networks", "vision-language"];
type CitationsTopic = (typeof TOPICS)[number];
/**
 * The payload each paper node carries. Read through {@link paper} — `data` is
 * the engine's opaque bag, so the shape is asserted at the point of use rather
 * than exported as a dataset type.
 */
interface PaperPayload {
    readonly topic: CitationsTopic;
    readonly title: string;
    readonly year: number;
    readonly citationsCount: number;
}
declare const citations: {
    nodes: (GraphNode<unknown> & {
        data: PaperPayload;
    })[];
    edges: (GraphEdge<unknown> & {
        data: {
            kind: "cites";
        };
    })[];
};
/**
 * Recommended look for the **citations** paper network.
 *
 * Preferential attachment means a handful of hubs and a long tail, so the marks
 * stay uniform and let the layout express the degree distribution. Colour-by-type
 * maps the research topics (each paper's `type` is its topic). Edges point from the
 * citing paper to the older one it cites, so arrowheads stay on.
 */
declare const settings$6: CanvasConfig;

/**
 * **Paper citations** — a synthetic machine-learning citation network
 * (2,708 papers across 7 subject areas, 10,556 `CITES` edges).
 *
 * The package's **largest force-layout fixture**: big enough that the subject
 * communities read as regions rather than individual marks, which is what makes
 * it the right dataset for density contours, subject bundling, and
 * colour-by-type at scale.
 *
 * A paper's subject is both its `type` (so colour-by-type partitions the network
 * with no consumer wiring) and its `data.subject`.
 *
 * ### Generated, not stored
 *
 * Built at import time by {@link generatePaperCitations} from a fixed seed —
 * byte-stable across reloads, a few KB of source instead of ~1 MB of records,
 * and carrying no third-party licence. The subject-area names are generic
 * field-of-study terms; every paper id, title and citation is invented.
 *
 * The citation topology is what makes it useful, and it is modelled rather than
 * random — see {@link generatePaperCitations} for the three rules (intra-subject
 * bias, preferential attachment, and citations pointing backwards in time) that
 * give the graph its community structure and its hub papers.
 *
 * @example
 * import { paperCitations, paperCitationsSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={paperCitations} config={paperCitationsSettings} />
 */

/** The seven subject areas a paper can belong to. */
type PaperSubject = 'Neural_Networks' | 'Rule_Learning' | 'Reinforcement_Learning' | 'Probabilistic_Methods' | 'Theory' | 'Genetic_Algorithms' | 'Case_Based';
/** Knobs for {@link generatePaperCitations}. */
interface PaperCitationsOptions {
    /** Papers in the corpus. Default `2708`. */
    papers?: number;
    /** Directed `CITES` edges. Default `10556`. */
    citations?: number;
    /** Fraction of citations that stay inside a subject (0–1). Default `0.81`. */
    intraSubjectRatio?: number;
    /** PRNG seed — same seed → same graph. Default `2708`. */
    seed?: number;
}
/**
 * Generate the citation network.
 *
 * Three rules shape the topology, and between them they're what make the graph
 * look like a citation network rather than a random one:
 *
 * 1. **Citations point backwards in time.** A paper may only cite one published
 *    before it, so the graph is a DAG — which is what stops a force layout from
 *    collapsing it into an undifferentiated ball.
 * 2. **~81 % of citations stay inside a subject.** This is what creates the seven
 *    visible communities; the remaining cross-subject links become the bridges
 *    between them.
 * 3. **Targets are drawn by preferential attachment.** A paper already cited
 *    often is more likely to be cited again, producing the handful of hub papers
 *    every real citation graph has.
 *
 * @param options — counts + seed; see {@link PaperCitationsOptions}.
 *
 * @example
 * const big = generatePaperCitations({ papers: 50_000, seed: 9 });
 */
declare function generatePaperCitations(options?: PaperCitationsOptions): {
    nodes: (GraphNode<unknown> & {
        type: PaperSubject;
        data: {
            subject: PaperSubject;
        };
    })[];
    edges: GraphEdge<unknown>[];
};
/** The default citation network — 2,708 papers / ~10,556 citations from seed `2708`. */
declare const paperCitations: {
    nodes: (GraphNode<unknown> & {
        type: PaperSubject;
        data: {
            subject: PaperSubject;
        };
    })[];
    edges: GraphEdge<unknown>[];
};
/**
 * Recommended look for the **paper citations** network.
 *
 * 2,708 papers and ~10,556 citations — the largest dataset here, and the settings
 * are shaped almost entirely by that. Papers are 3px dots so the seven subject
 * communities read as regions rather than as individual marks; citations are barely
 * visible on their own and exist to shape the layout. Colour-by-type partitions the
 * subjects for free, since each paper's `type` **is** its subject.
 */
declare const settings$5: CanvasConfig;

/**
 * **Computing pioneers** — a hand-authored ten-node graph of four computing
 * figures, the institutions they worked at, and the ideas they created.
 *
 * Deliberately tiny and deliberately *heterogeneous*: three entity kinds whose
 * property bags differ (a `Person` has a role and an avatar id, an
 * `Organization` has a founding note, a `Concept` has only a name), which is
 * exactly what a per-type node-rendering demo needs — one structure per label,
 * each binding different fields. Seven relation kinds keep the edge legend
 * interesting at this size.
 *
 * `avatar` holds an **avatar id** (`'ada'`), not an image URL — the consuming
 * template resolves it to whatever portrait source it has.
 *
 * @example
 * import { computingPioneers, computingPioneersSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={computingPioneers} config={computingPioneersSettings} />
 */

declare const computingPioneers: {
    nodes: ({
        id: string;
        type: string;
        data: {
            name: string;
            role: string;
            avatar: string;
            founded?: undefined;
        };
    } | {
        id: string;
        type: string;
        data: {
            name: string;
            founded: string;
            role?: undefined;
            avatar?: undefined;
        };
    } | {
        id: string;
        type: string;
        data: {
            name: string;
            role?: undefined;
            avatar?: undefined;
            founded?: undefined;
        };
    })[];
    edges: {
        id: string;
        type: string;
        source: string;
        target: string;
    }[];
};
/**
 * Recommended look for the **computing pioneers** graph.
 *
 * Ten nodes, so everything can be labelled and generously spaced. The three types
 * are meant to render as *different node structures* (an id card, an elliptical
 * badge, a plain circle), which is a template registry a consumer supplies —
 * colour-by-type is therefore **off**, since those templates own their own colour
 * and a palette would repaint them.
 *
 * The force numbers are the load-bearing part: cards are wide, so charge, link
 * distance and collision are all scaled up to keep them from overlapping.
 */
declare const settings$4: CanvasConfig;

/**
 * **Invana end-to-end architecture** — the "build systems that learn" reference
 * diagram as a graph: eleven stages (the numbered 1–8 pipeline plus Memory,
 * Audit and Reversibility) framing 34 component boxes, wired by the 33-edge
 * learning loop.
 *
 * This is a **hand-authored diagram**, not a measurement, and three things
 * follow from that:
 *
 *   - **Positions are content.** Every node carries the `x` / `y` it has in the
 *     source diagram (a box's top-left corner; a stage's frame origin). The
 *     arrangement *is* the information — a solver run over this graph produces a
 *     different, and worse, picture. Consumers that want a layout anyway have a
 *     ready-made "authored vs solved" comparison.
 *   - **Containment is a two-level `stageId`,** not a general hierarchy: a `box`
 *     names the `stage` that frames it, and stages never nest.
 *   - **A box's `width` / `height` are content too** — captions are 1–3 lines
 *     (`\n` in `title`) and each box was sized to its text.
 *
 * Colour is deliberately *absent*: stage tints belong to whichever theme renders
 * the diagram, so a consumer keys its own palette off the stage ids.
 *
 * Placement, containment and the caption are hoisted onto the node itself
 * (`position` / `parentId` / `style.labelText`) rather than left in `data`, so
 * the dataset drops straight in — a consumer supplies only the *look*.
 *
 * @example
 * import { invanaArchitecture, invanaArchitectureSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={invanaArchitecture} config={invanaArchitectureSettings} />
 */

declare const invanaArchitecture: {
    nodes: ({
        id: string;
        type: string;
        states: string[];
        position: {
            x: number;
            y: number;
        };
        style: {
            labelText: string;
        };
        parentId?: undefined;
        data?: undefined;
    } | {
        id: string;
        type: string;
        parentId: string;
        position: {
            x: number;
            y: number;
        };
        style: {
            labelText: string;
        };
        data: {
            width: number;
            height: number;
        };
        states?: undefined;
    })[];
    edges: ({
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            dashed: boolean;
            caption?: undefined;
        };
    } | {
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            caption: string;
            dashed: boolean;
        };
    })[];
};
/**
 * Recommended look for the **Invana end-to-end architecture** diagram.
 *
 * The arrangement *is* the diagram — every node ships its authored position — so
 * there is **no layout** (`activeLayout: ''`). Colour-by-type is off for the same
 * reason: the stage tints are the diagram's own palette, carried by the `stage`
 * state overlay a consumer defines (each stage node names it in `states`).
 *
 * Boxes are plain rects sized from `data.width` / `data.height` via a consumer
 * `shape` resolver; what's here is everything about the look that serialises —
 * hairline grey arrows, small centred captions, and the label pill behind a flow
 * annotation.
 */
declare const settings$3: CanvasConfig;

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

declare const modellerSeed: {
    nodes: {
        id: string;
        type: string;
        position: {
            x: number;
            y: number;
        };
        style: {
            labelText: string;
        };
    }[];
    edges: {
        id: string;
        type: string;
        source: string;
        target: string;
    }[];
};
/**
 * Recommended look for the **modeller seed** board.
 *
 * An authoring surface, not a picture: the three seed nodes sit where they were
 * placed, so there is **no layout** (`activeLayout: ''`) — a solver would fight the
 * user on their first drag. A grid background gives the drawing something to align
 * against, and colour-by-type is off because seed nodes are deliberately untyped
 * until the user classifies them.
 */
declare const settings$2: CanvasConfig;

/**
 * **Retail star schema** — the classic dimensional-modelling shape: one fact
 * table (customer orders) surrounded by three dimensions (customer, date,
 * supplier), each foreign key an edge back to the fact.
 *
 * Unlike most graph datasets the interesting payload is *inside* the node: each
 * table carries an ordered, variable-length `fields` list with a name and a data
 * type per column. That's what makes it the fixture for ER / schema-table node
 * rendering — the card's height falls out of the field count, and the field
 * types drive per-row colour coding. Add a field and the node reshapes itself.
 *
 * `icon` and `headerColor` are authored *presentation hints* rather than
 * measurements — a data model has no intrinsic colour, but every ER tool ships
 * one, and keeping them on the dataset means a consumer gets a recognisable
 * diagram without inventing a palette.
 *
 * @example
 * import { starSchema, starSchemaSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={starSchema} config={starSchemaSettings} />
 */

declare const starSchema: {
    nodes: {
        id: string;
        type: string;
        data: {
            name: string;
            icon: string;
            headerColor: number;
            fields: {
                name: string;
                type: string;
            }[];
        };
    }[];
    edges: {
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            foreignKey: string;
        };
    }[];
};
/**
 * Recommended look for the **retail star schema**.
 *
 * A data model is a layered DAG, so this expects an `ElkLayout` under the id
 * `layout`. The tables themselves are **composite cards** built from each node's
 * `fields` list, which no serialisable setting can express — a consumer supplies
 * the `shape` resolver, and `bgStrokeWidth: 0` here stops the base node border from
 * double-framing whatever card it builds.
 *
 * Foreign-key edges are dashed and arrowless, the ER convention for a reference
 * rather than a flow.
 */
declare const settings$1: CanvasConfig;

/**
 * **Invana Code Knowledge Graph** — a real code-intelligence graph of the
 * [Invana](https://github.com/invana) platform monorepo, produced by the
 * `understand-anything` static analyser. 602 source entities (files,
 * functions, classes, configs, docs) linked by 1,329 typed relations
 * (`imports`, `contains`, `exports`, `calls`, `inherits`, …), partitioned
 * into 8 architectural clusters with a 13-step guided tour.
 *
 * `./knowledge-graph.json` is authored **directly** in the engine-ready shape —
 * vertices are `{ id, type, data }`, edges `{ id, type, source, target, data }`
 * — so this module is a thin typed view over it, not a translator, and a
 * consumer drops it into `setData` with no mapping. The interfaces below ARE
 * the on-disk contract; the JSON is its serialisation.
 *
 * **One property pair is synthetic:** `coverage` / `errors` are stamped on
 * offline by `scripts/add-code-health.mjs` (derived from `complexity` + an id
 * hash) because the analyser emits no health metrics and the badge demos need
 * them. Everything else comes from the analysed repository.
 *
 * @example
 * import { invanaCodeKg, invanaCodeKgSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={invanaCodeKg} config={invanaCodeKgSettings} />
 *
 * // the cluster / tour / project metadata rides alongside:
 * invanaCodeKg.clusters, invanaCodeKg.tour, invanaCodeKg.project
 */

declare const invanaCodeKg: {
    nodes: (GraphNode & {
        type: "file" | "function" | "class" | "config" | "document";
        data: {
            readonly name: string;
            readonly filePath: string;
            readonly summary: string;
            readonly tags: readonly string[];
            readonly complexity: "simple" | "moderate" | "complex";
            readonly lineRange?: readonly [number, number];
            readonly languageNotes?: string;
            readonly cluster: string | null;
            readonly coverage?: number;
            readonly errors?: number;
        };
    })[];
    edges: (GraphEdge & {
        type: "imports" | "contains" | "exports" | "calls" | "inherits" | "configures" | "depends_on" | "documents" | "related";
        data: {
            readonly weight: number;
            readonly direction: "forward";
        };
    })[];
    readonly clusters: readonly {
        readonly id: string;
        readonly name: string;
        readonly description: string;
        readonly nodeIds: readonly string[];
    }[];
    readonly tour: readonly {
        readonly order: number;
        readonly title: string;
        readonly description: string;
        readonly nodeIds: readonly string[];
        readonly languageLesson?: string;
    }[];
    readonly project: {
        readonly name: string;
        readonly languages: readonly string[];
        readonly frameworks: readonly string[];
        readonly description: string;
        readonly analyzedAt?: string;
        readonly gitCommitHash?: string;
    };
};
/**
 * Recommended look for the **Invana code knowledge graph**.
 *
 * 602 code entities across 8 architectural clusters. Colour-by-type partitions
 * by entity kind (`file` · `function` · `class` · `config` · `document`) with no
 * wiring; a consumer that would rather colour by *cluster* points
 * `ColorByBehaviour.nodeValueKey` at `data.cluster` — every field of this
 * dataset is reachable from serialisable settings, including from a node
 * template's `ValueLookup` (`size`, badge fills, card element colours).
 *
 * Edges are hairline and heavily faded — at 1,329 relations their aggregate is the
 * picture — and hover dims everything off the 1-hop neighbourhood, which is the
 * only practical way to read one file's dependencies out of the mass.
 */
declare const settings: CanvasConfig;

/**
 * **Airways global model** — four published domain models (AirRoutes,
 * NewsArticles, Twitter, Deals) and the thirteen stitches declared between
 * them, as Invana's airways demo ships them.
 *
 * It is a graph *of a schema*, not of records: each model is a group node
 * (`type: 'model'`), each node type is a node whose `parentId` is its model,
 * each edge type is an edge inside one model, and each stitch is the only kind
 * of edge that crosses from one model to another — an **anchor** (`SAME_AS`,
 * the same entity keyed differently) or a **relationship** link (its own edge
 * type). `data.kind` says which: `edge` · `anchor` · `relationship`.
 *
 * A node type's `type` is its qualified name (`Twitter.Tweet`), so a config
 * can bind a look per type. `data` carries the label, its description, its
 * ordered `properties` (name, type, identity, the stitches that key on it) and
 * `icon` — an iconify id, an authored presentation hint like `starSchema`'s.
 *
 * The JSON is the source: regenerate it only when the airways demo changes.
 *
 * @example
 * import { airwaysGlobalModel } from '@invana/graph-datasets/usecase-demos';
 */
declare const airwaysGlobalModel: {
    nodes: ({
        id: string;
        type: string;
        data: {
            name: string;
            packageId: string;
            version: string;
            description: string;
            label?: undefined;
            model?: undefined;
            icon?: undefined;
            identity?: undefined;
            propertyCount?: undefined;
            stitchCount?: undefined;
            properties?: undefined;
            anchored?: undefined;
        };
        parentId?: undefined;
    } | {
        id: string;
        type: string;
        parentId: string;
        data: {
            label: string;
            model: string;
            description: string;
            icon: string;
            identity: string;
            propertyCount: number;
            stitchCount: number;
            properties: ({
                name: string;
                type: string;
                description: string;
                identity?: undefined;
                stitches?: undefined;
            } | {
                name: string;
                type: string;
                description: string;
                identity: boolean;
                stitches: string[];
            })[];
            anchored: boolean;
            name?: undefined;
            packageId?: undefined;
            version?: undefined;
        };
    } | {
        id: string;
        type: string;
        parentId: string;
        data: {
            label: string;
            model: string;
            description: string;
            icon: string;
            propertyCount: number;
            stitchCount: number;
            properties: {
                name: string;
                type: string;
                description: string;
            }[];
            name?: undefined;
            packageId?: undefined;
            version?: undefined;
            identity?: undefined;
            anchored?: undefined;
        };
    } | {
        id: string;
        type: string;
        parentId: string;
        data: {
            label: string;
            model: string;
            description: string;
            icon: string;
            identity: string;
            propertyCount: number;
            stitchCount: number;
            properties: ({
                name: string;
                type: string;
                description: string;
                identity: boolean;
                stitches: string[];
            } | {
                name: string;
                type: string;
                description: string;
                identity?: undefined;
                stitches?: undefined;
            } | {
                name: string;
                type: string;
                description: string;
                stitches: string[];
                identity?: undefined;
            })[];
            name?: undefined;
            packageId?: undefined;
            version?: undefined;
            anchored?: undefined;
        };
    } | {
        id: string;
        type: string;
        parentId: string;
        data: {
            label: string;
            model: string;
            description: string;
            icon: string;
            identity: string;
            propertyCount: number;
            stitchCount: number;
            properties: ({
                name: string;
                type: string;
                description: string;
                identity: boolean;
                stitches?: undefined;
            } | {
                name: string;
                type: string;
                description: string;
                stitches: string[];
                identity?: undefined;
            } | {
                name: string;
                type: string;
                description: string;
                identity?: undefined;
                stitches?: undefined;
            })[];
            name?: undefined;
            packageId?: undefined;
            version?: undefined;
            anchored?: undefined;
        };
    })[];
    edges: ({
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            kind: string;
            model: string;
            description: string;
            multiplicity: string;
            stitch?: undefined;
            rule?: undefined;
            match?: undefined;
            partial?: undefined;
            endpoints?: undefined;
        };
    } | {
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            kind: string;
            stitch: string;
            rule: string;
            match: string;
            description: string;
            model?: undefined;
            multiplicity?: undefined;
            partial?: undefined;
            endpoints?: undefined;
        };
    } | {
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            kind: string;
            stitch: string;
            rule: string;
            match: string;
            partial: boolean;
            description: string;
            model?: undefined;
            multiplicity?: undefined;
            endpoints?: undefined;
        };
    } | {
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            kind: string;
            stitch: string;
            rule: string;
            description: string;
            model?: undefined;
            multiplicity?: undefined;
            match?: undefined;
            partial?: undefined;
            endpoints?: undefined;
        };
    } | {
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            kind: string;
            stitch: string;
            rule: string;
            model?: undefined;
            description?: undefined;
            multiplicity?: undefined;
            match?: undefined;
            partial?: undefined;
            endpoints?: undefined;
        };
    } | {
        id: string;
        type: string;
        source: string;
        target: string;
        data: {
            kind: string;
            stitch: string;
            rule: string;
            endpoints: string;
            description: string;
            model?: undefined;
            multiplicity?: undefined;
            match?: undefined;
            partial?: undefined;
        };
    })[];
};

export { type PaperCitationsOptions, agentTrace, settings$a as agentTraceSettings, airwaysGlobalModel, citations, settings$6 as citationsSettings, computingPioneers, settings$4 as computingPioneersSettings, generatePaperCitations, invanaArchitecture, settings$3 as invanaArchitectureSettings, invanaCodeKg, settings as invanaCodeKgSettings, microservices, settings$8 as microservicesSettings, modellerSeed, settings$2 as modellerSeedSettings, ontology, settings$7 as ontologySettings, paperCitations, settings$5 as paperCitationsSettings, ragEmbeddings, settings$9 as ragEmbeddingsSettings, starSchema, settings$1 as starSchemaSettings };
