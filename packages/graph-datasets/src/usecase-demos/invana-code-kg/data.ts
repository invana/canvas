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

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

import raw from './knowledge-graph.json';

// The JSON is already valid `GraphData`; the cast only narrows the
// string-literal unions (`type`, `complexity`, `direction`) that JSON import
// widens to `string`. No per-record reshaping.
export const invanaCodeKg = raw as unknown as {
  nodes: (GraphNode & {
    type: 'file' | 'function' | 'class' | 'config' | 'document';
    data: {
      readonly name: string;
      readonly filePath: string;
      readonly summary: string;
      readonly tags: readonly string[];
      readonly complexity: 'simple' | 'moderate' | 'complex';
      readonly lineRange?: readonly [number, number];
      readonly languageNotes?: string;
      readonly cluster: string | null;
      readonly coverage?: number;
      readonly errors?: number;
    };
  })[];
  edges: (GraphEdge & {
    type:
      | 'imports'
      | 'contains'
      | 'exports'
      | 'calls'
      | 'inherits'
      | 'configures'
      | 'depends_on'
      | 'documents'
      | 'related';
    data: { readonly weight: number; readonly direction: 'forward' };
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
 * The graph half of {@link invanaCodeKg} as the engine-ready value `setData` /
 * `<GraphCanvasApp>` take. Same arrays — the clusters / tour / project metadata
 * is simply not part of `GraphData`.
 */
export const data = invanaCodeKg;

/**
 * Recommended look for the **Invana code knowledge graph**.
 *
 * 602 code entities across 8 architectural clusters. Colour-by-type partitions
 * by entity kind (`file` · `function` · `class` · `config` · `document`) with no
 * wiring; a consumer that would rather colour by *cluster* supplies its own
 * `bgFill` resolver, since `data.cluster` can't be reached from serialisable
 * settings.
 *
 * Edges are hairline and heavily faded — at 1,329 relations their aggregate is the
 * picture — and hover dims everything off the 1-hop neighbourhood, which is the
 * only practical way to read one file's dependencies out of the mass.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 4 },
          bgStrokeWidth: 0,
          showLabel: false,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.5,
          strokeAlpha: 0.22,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -140 },
      link: { distance: 44 },
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
    'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
  },
};
