import * as _invana_graph from '@invana/graph';
import { GraphNode, GraphEdge } from '@invana/graph';
import { CanvasConfig } from '@invana/canvas';

/**
 * **Epic Saga — the generator.**
 *
 * Builds a **fictional** serialised-drama property graph: seasons hold episodes,
 * episodes hold scenes, scenes happen at locations and feature characters, and
 * characters belong to houses and co-appear with one another. Every name, title
 * and timecode is invented by this file from seeded pools — nothing is derived
 * from, or copied out of, any real production.
 *
 * ### Why a generator and not a JSON
 *
 * This dataset exists to be the package's **large, heterogeneous, multi-type
 * property graph** — seven vertex kinds and six edge kinds at ~5k nodes / ~29k
 * edges, which is the shape a layers/schema panel or a colour-by-type demo needs
 * and no other dataset here provides. That shape is entirely reproducible
 * synthetically, so shipping ~7 MB of real third-party records to obtain it was
 * both a licensing liability and a bundle-size one. Three things fall out:
 *
 * 1. **Zero licence surface** — the values are ours.
 * 2. **~7 MB → a few KB** of source.
 * 3. **It scales.** Want 50k scenes for a large-graph performance story? Pass a
 *    bigger `scenes`. A fixed JSON is stuck at whatever was recorded.
 *
 * ### Determinism
 *
 * Same `seed` → byte-identical graph, so snapshots stay stable across reloads.
 * The PRNG is mulberry32, the same one `twitter/generators.ts` uses.
 */

/** Knobs for {@link generateEpicSaga}. Defaults reproduce the ~5k / ~29k graph. */
interface EpicSagaOptions {
    /** Seasons in the run. Default `8`. */
    seasons?: number;
    /** Episodes across all seasons. Default `73`. */
    episodes?: number;
    /** Scenes across all episodes — the bulk of the graph. Default `4165`. */
    scenes?: number;
    /** Speaking characters. Default `577`. */
    characters?: number;
    /** Noble houses characters can belong to. Default `14`. */
    houses?: number;
    /** Top-level locations. Default `26`. */
    locations?: number;
    /** Sub-locations nested inside locations. Default `96`. */
    subLocations?: number;
    /** PRNG seed — same seed → same graph. Default `1337`. */
    seed?: number;
}
/** The seven vertex kinds this generator emits. */
type SagaNodeType = 'character' | 'house' | 'location' | 'subLocation' | 'season' | 'episode' | 'scene';
/** The six relation kinds this generator emits. */
type SagaEdgeType = 'member_of' | 'part_of' | 'located_at' | 'within' | 'appears_in' | 'co_appears_with';
/** A generated vertex — `data` varies by `type`, but every kind carries a `name`. */
type SagaNode = GraphNode & {
    type: SagaNodeType;
    data: {
        name?: string;
    } & Record<string, unknown>;
};
/** A generated edge — only `co_appears_with` carries a payload. */
type SagaEdge = GraphEdge & {
    type: SagaEdgeType;
    data: {
        sharedScenes?: number;
        sharedSeconds?: number;
    };
};
/**
 * Generate the full saga graph.
 *
 * Built in dependency order — houses and places first, then the calendar
 * (season → episode → scene), then the cast, then the appearance edges, and
 * finally the co-appearance projection derived from who shared a scene.
 *
 * @param options — counts + seed; see {@link EpicSagaOptions}.
 * @returns `{ meta, nodes, edges }` in the engine-ready shape `setData` takes.
 *
 * @example
 * const saga = generateEpicSaga({ scenes: 50_000, seed: 7 });
 */
declare function generateEpicSaga(options?: EpicSagaOptions): {
    meta: {
        name: string;
        description: string;
        source: string;
        sourceRepo: string;
        nodeCount: number;
        edgeCount: number;
        schema: {
            nodeTypes: {
                type: string;
                count: number;
                properties: Record<string, string>;
            }[];
            edgeTypes: {
                type: string;
                count: number;
                endpoints: {
                    source: string;
                    target: string;
                }[];
                properties: Record<string, string>;
            }[];
        };
    };
    nodes: SagaNode[];
    edges: SagaEdge[];
};

/**
 * The default saga graph — ~4,959 nodes / ~28,700 edges from seed `1337`.
 *
 * `meta.schema` is *derived* from the generated records (never hand-written), so
 * the vertex/edge kind inventory a layers or schema panel reads can't drift from
 * the data it describes.
 */
declare const epicSaga: {
    meta: {
        name: string;
        description: string;
        source: string;
        sourceRepo: string;
        nodeCount: number;
        edgeCount: number;
        schema: {
            nodeTypes: {
                type: string;
                count: number;
                properties: Record<string, string>;
            }[];
            edgeTypes: {
                type: string;
                count: number;
                endpoints: {
                    source: string;
                    target: string;
                }[];
                properties: Record<string, string>;
            }[];
        };
    };
    nodes: (_invana_graph.GraphNode<unknown> & {
        type: "character" | "house" | "location" | "subLocation" | "season" | "episode" | "scene";
        data: {
            name?: string;
        } & Record<string, unknown>;
    })[];
    edges: (_invana_graph.GraphEdge<unknown> & {
        type: "member_of" | "part_of" | "located_at" | "within" | "appears_in" | "co_appears_with";
        data: {
            sharedScenes?: number;
            sharedSeconds?: number;
        };
    })[];
};
/** {@link epicSaga} as the engine-ready value `<GraphCanvasApp data>` takes. */
declare const data: {
    meta: {
        name: string;
        description: string;
        source: string;
        sourceRepo: string;
        nodeCount: number;
        edgeCount: number;
        schema: {
            nodeTypes: {
                type: string;
                count: number;
                properties: Record<string, string>;
            }[];
            edgeTypes: {
                type: string;
                count: number;
                endpoints: {
                    source: string;
                    target: string;
                }[];
                properties: Record<string, string>;
            }[];
        };
    };
    nodes: (_invana_graph.GraphNode<unknown> & {
        type: "character" | "house" | "location" | "subLocation" | "season" | "episode" | "scene";
        data: {
            name?: string;
        } & Record<string, unknown>;
    })[];
    edges: (_invana_graph.GraphEdge<unknown> & {
        type: "member_of" | "part_of" | "located_at" | "within" | "appears_in" | "co_appears_with";
        data: {
            sharedScenes?: number;
            sharedSeconds?: number;
        };
    })[];
};
/**
 * Recommended look for the **Epic Saga** multi-entity graph.
 *
 * Seven entity types across ~5k nodes and ~29k edges. Colour-by-type stays on —
 * it's the only thing that makes a graph this size legible at a glance — but edges
 * drop to a hairline and hover dims everything off the 1-hop neighbourhood, which
 * is how you read an individual character out of the mass.
 */
declare const settings: CanvasConfig;

export { type EpicSagaOptions, data, epicSaga, settings as epicSagaSettings, generateEpicSaga };
