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

import type { GraphData } from '@invana/graph';

import raw from './knowledge-graph.json';

/** Node type — the source-entity kind. Drives shape + palette downstream. */
export type InvanaCodeNodeLabel = 'file' | 'function' | 'class' | 'config' | 'document';

/** Analyser's coarse complexity bucket for a node. */
export type InvanaCodeComplexity = 'simple' | 'moderate' | 'complex';

/** Edge type — the relation kind. */
export type InvanaCodeEdgeLabel =
  | 'imports'
  | 'contains'
  | 'exports'
  | 'calls'
  | 'inherits'
  | 'configures'
  | 'depends_on'
  | 'documents'
  | 'related';

/** Node payload — everything that isn't `id` or `type`. */
export interface InvanaCodeNodeProperties {
  /** Short display name (`main.tsx`, `ErrorPage`, …). `id` stays the stable path-qualified key. */
  readonly name: string;
  /** Repo-relative source path the entity lives in. */
  readonly filePath: string;
  /** One-line natural-language description from the analyser. */
  readonly summary: string;
  /** Free-form classification tags (`entry-point`, `react`, `error-handling`, …). */
  readonly tags: readonly string[];
  /** Analyser complexity bucket. */
  readonly complexity: InvanaCodeComplexity;
  /** `[startLine, endLine]` for function/class nodes; absent for whole-file nodes. */
  readonly lineRange?: readonly [number, number];
  /** Language-specific caveat the analyser flagged, when present. */
  readonly languageNotes?: string;
  /** Owning cluster id (from {@link InvanaCodeCluster}), or `null` when ungrouped. */
  readonly cluster: string | null;
  /**
   * Test-coverage percentage (0–100).
   *
   * **Synthetic.** The analyser emits no coverage, so this is derived offline by
   * `scripts/add-code-health.mjs` from {@link InvanaCodeNodeProperties.complexity}
   * plus a hash of the node id — deterministic, but *not* measured. Present only
   * on `file` / `function` / `class` nodes; a `config` or `document` has none.
   */
  readonly coverage?: number;
  /**
   * Count of open errors attributed to the entity.
   *
   * **Synthetic**, from the same generator as {@link InvanaCodeNodeProperties.coverage}
   * and correlated with it (thin coverage attracts errors), so the pair reads as
   * a health signal rather than two unrelated numbers. Same node-label caveat.
   */
  readonly errors?: number;
}

/** Edge payload — relation strength + directionality metadata. */
export interface InvanaCodeEdgeProperties {
  /** Analyser-assigned edge weight in `[0.5, 1]`. */
  readonly weight: number;
  /** Relation directionality. The source graph only emits `'forward'`. */
  readonly direction: 'forward';
}

/** A code entity: `{ id, type, data }`. */
export interface InvanaCodeNode {
  readonly id: string;
  readonly type: InvanaCodeNodeLabel;
  readonly data: InvanaCodeNodeProperties;
}

/** A typed relation: `{ id, type, source, target, data }`. */
export interface InvanaCodeEdge {
  readonly id: string;
  readonly type: InvanaCodeEdgeLabel;
  readonly source: string;
  readonly target: string;
  readonly data: InvanaCodeEdgeProperties;
}

/** An architectural cluster — a named group of node ids. */
export interface InvanaCodeCluster {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly nodeIds: readonly string[];
}

/** A guided-tour step spotlighting a set of nodes with a teaching note. */
export interface InvanaCodeTourStep {
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly nodeIds: readonly string[];
  readonly languageLesson?: string;
}

/** Project-level provenance for the analysed repository. */
export interface InvanaCodeProject {
  readonly name: string;
  readonly languages: readonly string[];
  readonly frameworks: readonly string[];
  readonly description: string;
  readonly analyzedAt?: string;
  readonly gitCommitHash?: string;
}

/** The full dataset: graph + cluster metadata + tour + provenance. */
export interface InvanaCodeKgData {
  nodes: InvanaCodeNode[];
  edges: InvanaCodeEdge[];
  readonly clusters: readonly InvanaCodeCluster[];
  readonly tour: readonly InvanaCodeTourStep[];
  readonly project: InvanaCodeProject;
}

// The JSON is already valid `InvanaCodeKgData`; the cast only narrows the
// string-literal unions (`type`, `complexity`, `direction`) that JSON import
// widens to `string`. No per-record reshaping.
export const invanaCodeKg = raw as unknown as InvanaCodeKgData;

/**
 * The graph half of {@link invanaCodeKg} as the engine-ready value `setData` /
 * `<GraphCanvasApp>` take. Same arrays — the clusters / tour / project metadata
 * is simply not part of `GraphData`.
 */
export const data: GraphData = invanaCodeKg as unknown as GraphData;
