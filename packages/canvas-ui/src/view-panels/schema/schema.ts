// Schema **rendering** helpers — compile a `GraphSchema` into the metagraph
// `GraphData` the `SchemaViewPanel` draws (simple discs or composite ER tables, with
// the chosen edge routing baked in). The schema **value** + its derivation live in
// `@invana/graph` (`deriveSchema`, `GraphSchema`, …); this file is view-only.

import type {
  CompositeShapeOption,
  EdgePathType,
  EdgeStyle,
  GraphEdge,
  GraphNode,
  GraphSchema,
  NodeStyle,
  SchemaNodeType,
} from '@invana/graph';
import { schemaTableCard } from '@invana/graph';

// Re-export the domain schema surface so canvas-ui consumers can import it here.
export type {
  GraphSchema,
  SchemaNodeType,
  SchemaEdgeType,
  SchemaEdgeConnection,
  SchemaProperty,
  DeriveSchemaOptions,
} from '@invana/graph';
export { deriveSchema, schemaSignature, defaultNodeTypeOf, defaultEdgeTypeOf } from '@invana/graph';

// ─── View enums ──────────────────────────────────────────────────────────────

/** How each node-type renders in the metagraph. */
export type SchemaNodeMode = 'simple' | 'table';
/** Connector routing for the metagraph edges (a subset of {@link EdgePathType}). */
export type SchemaEdgeRouting = Extract<EdgePathType, 'straight' | 'orth' | 'bezier'>;

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
 * Compile a {@link GraphSchema} into the `GraphData` the `SchemaViewPanel`'s canvas
 * renders: one node per node-type (a simple disc or a composite ER table, per
 * `nodeMode`) and one edge per connection pair (routed per `edgeRouting`, labelled
 * by edge type). Connections whose endpoints aren't present as node-types are
 * dropped. Node positions are seeded on a ring so a force layout never starts
 * fully coincident (a deterministic layout overwrites them).
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
      // A connection whose endpoints are the *same* node-type (e.g. company
      // `competes_with` company) is a self-loop — a straight/curved path with
      // identical endpoints degenerates to a point behind the node, so route it
      // as a visible loop instead of using the chosen edge routing.
      const pathType: EdgePathType = c.from === c.to ? 'loop-curve' : edgeRouting;
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
          shape: { pathType },
        } satisfies EdgeStyle,
      });
    }
  }
  return { nodes, edges };
}
