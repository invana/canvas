// Schema derivation — the renderer-free core the schema view shares.
//
// "Schema" here is the *metagraph* of a loaded graph: the distinct node types
// and edge types present in a `GraphLayer`, plus how they connect (which
// node-type an edge-type runs from → to) and the property keys (+ value types)
// each node type carries. It is **derived** from the live store, not stored —
// walk every node, bucket by a type accessor; walk every edge, bucket by its
// type and resolve the endpoint node-types.
//
// `schemaToMetaGraph` compiles the schema into the `GraphData` the `SchemaViewer`
// renders — as **simple** discs or as **composite ER tables** (via `@invana/graph`'s
// `schemaTableCard` builder), with the chosen edge routing baked into each edge.

import type {
  CompositeShapeOption,
  EdgePathType,
  EdgeStyle,
  GraphEdge,
  GraphLayer,
  GraphNode,
  NodeStyle,
} from '@invana/graph';
import { schemaTableCard } from '@invana/graph';

/** One property observed on a node type — a key and its (sampled) value type. */
export interface SchemaProperty {
  /** The `data` key. */
  name: string;
  /** Value-type token — `string` / `number` / `boolean` / `object` / `array` / `null` / `mixed`. */
  type: string;
}

/** A distinct node type (label) and what was observed across its instances. */
export interface SchemaNodeType {
  /** The type name — the value the {@link DeriveSchemaOptions.nodeTypeOf} accessor returned. */
  name: string;
  /** How many nodes of this type are in the store. */
  count: number;
  /** Properties (key + value type) seen across this type's instances, sorted by name. */
  properties: SchemaProperty[];
}

/** One node-type → node-type pairing observed for an edge type. */
export interface SchemaEdgeConnection {
  /** Source node-type name. */
  from: string;
  /** Target node-type name. */
  to: string;
  /** How many edges of the owning type ran between this exact pair. */
  count: number;
}

/** A distinct edge type (predicate / label) and the pairs it connects. */
export interface SchemaEdgeType {
  /** The type name — the value the {@link DeriveSchemaOptions.edgeTypeOf} accessor returned. */
  name: string;
  /** How many edges of this type are in the store. */
  count: number;
  /** The distinct `from → to` node-type pairs this edge type was seen on. */
  connections: SchemaEdgeConnection[];
}

/** The derived schema — the metagraph of a graph layer. */
export interface GraphSchema {
  /** Node types, sorted by descending instance count then name. */
  nodeTypes: SchemaNodeType[];
  /** Edge types, sorted by descending instance count then name. */
  edgeTypes: SchemaEdgeType[];
}

/** Type accessors — override to pick a different "type" field per element. */
export interface DeriveSchemaOptions {
  /**
   * How to read a node's type/label. Default reads `node.type`, then
   * `node.data.type` / `.label` / `.kind` / `.group` / `.category`, then `'node'`.
   * **Memoize** this if you pass it to {@link useDerivedSchema} (identity feeds
   * the effect deps).
   */
  nodeTypeOf?: (node: GraphNode) => string;
  /**
   * How to read an edge's type/label. Default reads `edge.type`, then
   * `edge.data.type` / `.label` / `.kind`, then `'edge'`. **Memoize** if passed
   * to {@link useDerivedSchema}.
   */
  edgeTypeOf?: (edge: GraphEdge) => string;
}

// ─── Shared view enums (kept on the leaf so views + toolbar share them) ──────

/** How each node-type renders in the metagraph. */
export type SchemaNodeMode = 'simple' | 'table';
/** Which layout lays the metagraph out. */
export type SchemaLayoutKind = 'elk' | 'force';
/** Connector routing for the metagraph edges (a subset of {@link EdgePathType}). */
export type SchemaEdgeRouting = Extract<EdgePathType, 'straight' | 'orth' | 'bezier'>;

const EMPTY_SCHEMA: GraphSchema = { nodeTypes: [], edgeTypes: [] };

const asName = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

/** Sampled value-type token for a property value. */
const valueType = (v: unknown): string =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;

/** Default node-type accessor — see {@link DeriveSchemaOptions.nodeTypeOf}. */
export function defaultNodeTypeOf(node: GraphNode): string {
  const d = node.data;
  return (
    asName(node.type) ??
    (isRecord(d)
      ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) ?? asName(d.group) ?? asName(d.category)
      : undefined) ??
    'node'
  );
}

/** Default edge-type accessor — see {@link DeriveSchemaOptions.edgeTypeOf}. */
export function defaultEdgeTypeOf(edge: GraphEdge): string {
  const d = edge.data;
  return (
    asName(edge.type) ?? (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) : undefined) ?? 'edge'
  );
}

/**
 * Derive the {@link GraphSchema} of a graph layer by scanning its store once.
 * Pure and synchronous; returns an empty schema for a missing layer/store. For a
 * reactive value that recomputes as data loads, use {@link useDerivedSchema}.
 */
export function deriveSchema(
  layer: GraphLayer | null | undefined,
  { nodeTypeOf = defaultNodeTypeOf, edgeTypeOf = defaultEdgeTypeOf }: DeriveSchemaOptions = {},
): GraphSchema {
  const store = layer?.store;
  if (!store) return EMPTY_SCHEMA;

  // Pass 1 — bucket nodes by type, remembering each node's type (so edges can
  // resolve endpoints) and each type's property keys → observed value types.
  const typeOfNode = new Map<string, string>();
  const nodeAgg = new Map<string, { count: number; props: Map<string, Set<string>> }>();
  for (const node of store.nodes()) {
    const t = nodeTypeOf(node);
    typeOfNode.set(node.id, t);
    let agg = nodeAgg.get(t);
    if (!agg) {
      agg = { count: 0, props: new Map<string, Set<string>>() };
      nodeAgg.set(t, agg);
    }
    agg.count += 1;
    if (isRecord(node.data)) {
      for (const [k, v] of Object.entries(node.data)) {
        let types = agg.props.get(k);
        if (!types) {
          types = new Set<string>();
          agg.props.set(k, types);
        }
        types.add(valueType(v));
      }
    }
  }

  // Pass 2 — bucket edges by type, accumulating the from → to node-type pairs.
  const edgeAgg = new Map<string, { count: number; conns: Map<string, SchemaEdgeConnection> }>();
  for (const edge of store.edges()) {
    const t = edgeTypeOf(edge);
    const from = typeOfNode.get(edge.source) ?? 'node';
    const to = typeOfNode.get(edge.target) ?? 'node';
    let agg = edgeAgg.get(t);
    if (!agg) {
      agg = { count: 0, conns: new Map<string, SchemaEdgeConnection>() };
      edgeAgg.set(t, agg);
    }
    agg.count += 1;
    const key = `${from} ${to}`;
    const conn = agg.conns.get(key);
    if (conn) conn.count += 1;
    else agg.conns.set(key, { from, to, count: 1 });
  }

  const byCountThenName = (a: { count: number; name: string }, b: { count: number; name: string }): number =>
    b.count - a.count || a.name.localeCompare(b.name);

  const nodeTypes: SchemaNodeType[] = [...nodeAgg.entries()]
    .map(([name, a]) => ({
      name,
      count: a.count,
      properties: [...a.props.entries()]
        .map(([k, types]) => ({ name: k, type: types.size === 1 ? [...types][0]! : 'mixed' }))
        .sort((p, q) => p.name.localeCompare(q.name)),
    }))
    .sort(byCountThenName);
  const edgeTypes: SchemaEdgeType[] = [...edgeAgg.entries()]
    .map(([name, a]) => ({
      name,
      count: a.count,
      connections: [...a.conns.values()].sort((p, q) => q.count - p.count),
    }))
    .sort(byCountThenName);

  return { nodeTypes, edgeTypes };
}

/**
 * A compact string that changes only when the schema's **structure** changes
 * (type names, counts, property counts, connectivity). Used to key the
 * `SchemaViewer`'s layout so it re-solves on a structural change but not on
 * every store tick.
 */
export function schemaSignature(schema: GraphSchema): string {
  const nodes = schema.nodeTypes.map((n) => `${n.name}#${n.count}#${n.properties.length}`).join('|');
  const edges = schema.edgeTypes
    .map((e) => `${e.name}#${e.connections.map((c) => `${c.from}>${c.to}`).join(',')}`)
    .join('|');
  return `${nodes}::${edges}`;
}

/** A small, stable palette for tinting node-type discs / table headers (0xRRGGBB). */
const TYPE_PALETTE = [
  0x3b82f6, 0xef4444, 0xf59e0b, 0x10b981, 0x8b5cf6, 0x06b6d4, 0xec4899, 0xeab308, 0x14b8a6, 0xa3e635,
] as const;

/** Deterministic colour for a type name — same name → same colour across renders. */
export function typeColor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TYPE_PALETTE[h % TYPE_PALETTE.length]!;
}

/** Prefix for the metagraph node id minted from a node-type name. */
export const SCHEMA_NODE_ID_PREFIX = 'type:';

/** The `GraphData` shape (structural — avoids a value import for the type). */
export interface SchemaMetaGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Options for {@link schemaToMetaGraph}. */
export interface SchemaMetaGraphOptions {
  /** Render each node-type as a simple disc or a composite ER table. Default `'simple'`. */
  nodeMode?: SchemaNodeMode;
  /** Connector routing for the edges. Default `'straight'`. */
  edgeRouting?: SchemaEdgeRouting;
}

/** Simple-mode node style — a tinted disc with a `name (count)` label below. */
function simpleNodeStyle(t: SchemaNodeType): NodeStyle {
  return {
    shape: { kind: 'circle', radius: 16 },
    bgFill: typeColor(t.name),
    bgStrokeWidth: 1.5,
    labelText: `${t.name} (${t.count})`,
    labelPlacement: 'bottom',
    labelOffsetY: 6,
    labelFontSize: 12,
  };
}

/** Table-mode node style — a composite ER card (header + one row per property). */
function tableNodeStyle(t: SchemaNodeType): NodeStyle {
  const shape: CompositeShapeOption = schemaTableCard({
    label: `${t.name} · ${t.count}`,
    header: typeColor(t.name),
    fields: t.properties.map((p) => ({ name: p.name, type: p.type })),
  });
  return { shape };
}

/**
 * Compile a {@link GraphSchema} into the `GraphData` the `SchemaViewer`'s nested
 * canvas renders: one node per node-type (a simple disc or a composite ER table,
 * per `nodeMode`) and one edge per connection pair (routed per `edgeRouting`,
 * labelled by edge type). Connections whose endpoints aren't present as
 * node-types are dropped. Node positions are seeded on a ring so a force layout
 * never starts fully coincident (a deterministic layout overwrites them).
 */
export function schemaToMetaGraph(
  schema: GraphSchema,
  { nodeMode = 'simple', edgeRouting = 'straight' }: SchemaMetaGraphOptions = {},
): SchemaMetaGraph {
  const n = schema.nodeTypes.length;
  const radius = Math.max(180, n * 45);
  const nodes: GraphNode[] = schema.nodeTypes.map((t, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, n);
    return {
      id: `${SCHEMA_NODE_ID_PREFIX}${t.name}`,
      type: t.name,
      data: t,
      position: { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) },
      style: nodeMode === 'table' ? tableNodeStyle(t) : simpleNodeStyle(t),
    };
  });

  const present = new Set(nodes.map((node) => node.id));
  const edges: GraphEdge[] = [];
  let i = 0;
  for (const et of schema.edgeTypes) {
    for (const c of et.connections) {
      const source = `${SCHEMA_NODE_ID_PREFIX}${c.from}`;
      const target = `${SCHEMA_NODE_ID_PREFIX}${c.to}`;
      if (!present.has(source) || !present.has(target)) continue;
      edges.push({
        id: `edge:${et.name}:${i++}`,
        source,
        target,
        type: et.name,
        data: { edgeType: et.name, connection: c },
        style: {
          labelText: et.name,
          strokeWidth: 1.5,
          labelFontSize: 10,
          shape: { pathType: edgeRouting },
        } satisfies EdgeStyle,
      });
    }
  }
  return { nodes, edges };
}
