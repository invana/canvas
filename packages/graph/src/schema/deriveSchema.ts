// deriveSchema — the **observed** schema source: aggregate a `GraphStore`'s loaded
// nodes/edges into a {@link GraphSchema} (the metagraph of what's actually
// present). It's one of several sources — an *authoritative* schema (the full DB
// schema behind a Neo4j-connected canvas, say) is set via `GraphStore.setSchema`
// and is typically a superset of this. Consumers resolve authoritative-else-
// observed (see `GraphStore.schema` + `deriveSchema`).

import type { GraphEdge, GraphNode } from '../store/types';
import type { GraphStore } from '../store/GraphStore';
import type {
  DeriveSchemaOptions,
  GraphSchema,
  SchemaEdgeConnection,
  SchemaEdgeType,
  SchemaNodeType,
} from './types';

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
 * Derive the {@link GraphSchema} of a graph by scanning a {@link GraphStore}'s
 * loaded nodes/edges once. Pure and synchronous; returns an empty schema for a
 * missing store. This is the **observed** schema (what's loaded) — for the
 * authoritative one prefer `store.schema` and fall back to this.
 */
export function deriveSchema(
  store: GraphStore | null | undefined,
  { nodeTypeOf = defaultNodeTypeOf, edgeTypeOf = defaultEdgeTypeOf }: DeriveSchemaOptions = {},
): GraphSchema {
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
 * (type names, counts, property counts, connectivity) — handy for keying/memoing
 * off a schema.
 */
export function schemaSignature(schema: GraphSchema): string {
  const nodes = schema.nodeTypes.map((n) => `${n.name}#${n.count}#${n.properties.length}`).join('|');
  const edges = schema.edgeTypes
    .map((e) => `${e.name}#${e.connections.map((c) => `${c.from}>${c.to}`).join(',')}`)
    .join('|');
  return `${nodes}::${edges}`;
}
