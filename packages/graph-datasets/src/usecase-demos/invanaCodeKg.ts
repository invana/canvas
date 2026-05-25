/**
 * **Invana Code Knowledge Graph** — a real code-intelligence graph of the
 * [Invana](https://github.com/invana) platform monorepo, produced by the
 * `understand-anything` static analyser. 602 source entities (files,
 * functions, classes, configs, docs) linked by 1,329 typed relations
 * (`imports`, `contains`, `exports`, `calls`, `inherits`, …), partitioned
 * into 8 architectural clusters with a 13-step guided tour.
 *
 * `./invana-code-kg/knowledge-graph.json` is authored **directly** in the
 * property-graph shape this package standardises on — vertices are
 * `{ id, label, properties }`, edges are
 * `{ id, label, source, target, properties }` — so this module is a thin
 * typed view over it, not a translator. The interfaces below ARE the
 * on-disk contract; the JSON is its serialisation.
 *
 * `label` / `properties` don't match `@invana/graph`'s `GraphNode`
 * (`type` / `data`) one-to-one, so a consuming story maps
 * `label → type` and `properties → data` at `setData` time.
 *
 * @example
 * import { invanaCodeKg } from '@invana/graph-datasets/usecase-demos';
 * graphLayer.setData({
 *   nodes: invanaCodeKg.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
 *   edges: invanaCodeKg.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label, data: e.properties })),
 * });
 */

import raw from './invana-code-kg/knowledge-graph.json';

/** Vertex label — the source-entity kind. Drives shape + palette downstream. */
export type InvanaCodeNodeLabel = 'file' | 'function' | 'class' | 'config' | 'document';

/** Analyser's coarse complexity bucket for a node. */
export type InvanaCodeComplexity = 'simple' | 'moderate' | 'complex';

/** Edge label — the relation kind. */
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

/** Node property bag — everything that isn't `id` or `label`. */
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
}

/** Edge property bag — relation strength + directionality metadata. */
export interface InvanaCodeEdgeProperties {
  /** Analyser-assigned edge weight in `[0.5, 1]`. */
  readonly weight: number;
  /** Relation directionality. The source graph only emits `'forward'`. */
  readonly direction: 'forward';
}

/** A code entity as a property-graph vertex: `{ id, label, properties }`. */
export interface InvanaCodeNode {
  readonly id: string;
  readonly label: InvanaCodeNodeLabel;
  readonly properties: InvanaCodeNodeProperties;
}

/** A typed relation as a property-graph edge: `{ id, label, source, target, properties }`. */
export interface InvanaCodeEdge {
  readonly id: string;
  readonly label: InvanaCodeEdgeLabel;
  readonly source: string;
  readonly target: string;
  readonly properties: InvanaCodeEdgeProperties;
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
  readonly nodes: readonly InvanaCodeNode[];
  readonly edges: readonly InvanaCodeEdge[];
  readonly clusters: readonly InvanaCodeCluster[];
  readonly tour: readonly InvanaCodeTourStep[];
  readonly project: InvanaCodeProject;
}

// The JSON is already valid `InvanaCodeKgData`; the cast only narrows the
// string-literal unions (`label`, `complexity`, `direction`) that JSON
// import widens to `string`. No per-record reshaping.
export const invanaCodeKg = raw as unknown as InvanaCodeKgData;
