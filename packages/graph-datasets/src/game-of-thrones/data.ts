/**
 * **Game of Thrones** — a multi-entity property graph of HBO's *Game of
 * Thrones*, derived from [Jeffrey Lancaster's open GoT
 * data](https://github.com/jeffreylancaster/game-of-thrones) (the source
 * behind the well-known force-directed character viz).
 *
 * Seven vertex kinds — `character`, `house`, `location`, `subLocation`,
 * `season`, `episode`, `scene` — wired by six relation kinds:
 * `member_of` (character → house), `part_of` (episode → season, scene →
 * episode), `located_at` (scene → location / sub-location), `within`
 * (sub-location → location), `appears_in` (character → scene), and a
 * weighted, undirected `co_appears_with` (character ↔ character, the
 * force-directed network — `sharedScenes` + `sharedSeconds` of screen time).
 *
 * `./game-of-thrones.json` is authored **directly** in this package's
 * engine-ready shape — vertices are `{ id, type, data }`, edges are
 * `{ id, type, source, target, data }` — so this module is a thin
 * typed view over it, not a translator. The interfaces below ARE the on-disk
 * contract; the JSON is its serialisation. Regenerate it offline with
 * `node scripts/prepare-got.mjs` (the raw upstream source is never stored).
 *
 * The graph is large (~5 MB), so it ships on its **own subpath entry**
 * (`@invana/graph-datasets/game-of-thrones`) to keep the main bundle lean.
 *
 *
 * @example
 * import { gameOfThrones, gameOfThronesSettings } from '@invana/graph-datasets/game-of-thrones';
 * <GraphCanvasApp data={gameOfThrones} config={gameOfThronesSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

import raw from './game-of-thrones.json';

// The JSON is already valid `GraphData`; the cast only narrows the
// string-literal unions (`label`) that JSON import widens to `string`.
// No per-record reshaping.
export const gameOfThrones = raw as unknown as {
  /** Dataset provenance + the derived schema the LayersViewPanel story reads. */
  readonly meta: {
    readonly name: string;
    readonly description: string;
    readonly source: string;
    readonly sourceRepo: string;
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly schema: {
      readonly nodeTypes: readonly {
        readonly type: string;
        readonly count: number;
        readonly properties: Readonly<Record<string, string>>;
      }[];
      readonly edgeTypes: readonly {
        readonly type: string;
        readonly count: number;
        readonly endpoints: readonly {
          readonly source: string;
          readonly target: string;
        }[];
        readonly properties: Readonly<Record<string, string>>;
      }[];
    };
  };
  /** `data` varies by `type` — every kind carries a `name`, the rest is per-kind. */
  nodes: (GraphNode & {
    type: 'character' | 'house' | 'location' | 'subLocation' | 'season' | 'episode' | 'scene';
    data: { readonly name?: string } & Readonly<Record<string, unknown>>;
  })[];
  edges: (GraphEdge & {
    type: 'member_of' | 'part_of' | 'located_at' | 'within' | 'appears_in' | 'co_appears_with';
    data: { readonly sharedScenes?: number; readonly sharedSeconds?: number };
  })[];
};

/** {@link gameOfThrones} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = gameOfThrones;

/**
 * Recommended look for the **Game of Thrones** multi-entity graph.
 *
 * Six entity types across ~5k nodes and ~29k edges. Colour-by-type stays on —
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
