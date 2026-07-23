// Graph *schema* value types — the metagraph of a graph: the distinct node/edge
// types, how they connect, and each node type's property keys. This is the
// **value** shape; how you obtain it is a separate concern (observe the loaded
// store via `deriveSchema`, or fetch an authoritative schema from a data source —
// Neo4j, GraphQL, an ontology — and set it via `GraphStore.setSchema`).

import type { GraphEdge, GraphNode } from '../store/types';

/** One property observed on a node type — a key and its value type. */
export interface SchemaProperty {
  /** The `data` key. */
  name: string;
  /** Value-type token — `string` / `number` / `boolean` / `object` / `array` / `null` / `mixed`. */
  type: string;
}

/** A distinct node type (label) and what's known about its instances. */
export interface SchemaNodeType {
  /** The type name. */
  name: string;
  /** How many nodes of this type are known (0 for an authoritative type not yet loaded). */
  count: number;
  /** Properties (key + value type), sorted by name. */
  properties: SchemaProperty[];
}

/** One node-type → node-type pairing for an edge type. */
export interface SchemaEdgeConnection {
  /** Source node-type name. */
  from: string;
  /** Target node-type name. */
  to: string;
  /** How many edges of the owning type ran between this exact pair. */
  count: number;
}

/** A distinct edge type (predicate / relationship label) and the pairs it connects. */
export interface SchemaEdgeType {
  /** The type name. */
  name: string;
  /** How many edges of this type are known. */
  count: number;
  /** The distinct `from → to` node-type pairs this edge type connects. */
  connections: SchemaEdgeConnection[];
}

/**
 * The schema of a graph — its metagraph. Either **observed** (derived from loaded
 * data via {@link deriveSchema}) or **authoritative** (declared by a data source
 * and stored on the graph via `GraphStore.setSchema`).
 */
export interface GraphSchema {
  /** Node types, sorted by descending count then name. */
  nodeTypes: SchemaNodeType[];
  /** Edge types, sorted by descending count then name. */
  edgeTypes: SchemaEdgeType[];
}

/** Type accessors — override to pick a different "type" field per element. */
export interface DeriveSchemaOptions {
  /**
   * How to read a node's type/label. Default reads `node.type`, then
   * `node.data.type` / `.label` / `.kind` / `.group` / `.category`, then `'node'`.
   */
  nodeTypeOf?: (node: GraphNode) => string;
  /**
   * How to read an edge's type/label. Default reads `edge.type`, then
   * `edge.data.type` / `.label` / `.kind`, then `'edge'`.
   */
  edgeTypeOf?: (edge: GraphEdge) => string;
}
