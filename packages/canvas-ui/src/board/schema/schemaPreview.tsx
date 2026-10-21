/**
 * The schema board's hover cards: a type's description and one row per
 * property; an edge's type, its title and its description. A frame has none —
 * its types are on screen inside it.
 */

import type { GraphEdge, GraphNode, SchemaTypeData } from '@invana/graph';
import { EdgePreviewCard, NodePreviewCard } from '../../view-panels/preview-cards';
import type { PreviewCardRow } from '../../view-panels/preview-cards';

/** A schema edge's `data`, as {@link renderSchemaEdge} reads it. */
export interface SchemaEdgeData {
  /** The card's title. Default `source → target`. */
  title?: string;
  description?: string;
  /** Extra rows under the title. */
  rows?: PreviewCardRow[];
}

const isSchemaType = (d: unknown): d is SchemaTypeData =>
  !!d && typeof d === 'object' && Array.isArray((d as SchemaTypeData).properties);

/** A type's hover card — `null` for a node that is not a schema type. */
export function renderSchemaNode(node: GraphNode) {
  const d = node.data as unknown;
  if (!isSchemaType(d)) return null;
  // The card keys its rows by label, so the label is the unique name.
  const rows: PreviewCardRow[] = d.properties.map((p) => ({
    label: p.name,
    value: [p.type, p.identity ? 'key' : '', ...(p.tags ?? [])].filter(Boolean).join(' · '),
    mono: true,
  }));
  return (
    <NodePreviewCard
      title={d.label}
      subtitle={d.description || undefined}
      tags={d.frame ? [d.frame] : undefined}
      rows={rows}
    />
  );
}

/** An edge's hover card — its type, title, description and any rows it carries. */
export function renderSchemaEdge(edge: GraphEdge) {
  const d = (edge.data ?? {}) as SchemaEdgeData;
  return (
    <EdgePreviewCard
      badge={edge.type}
      title={d.title ?? `${edge.source} → ${edge.target}`}
      subtitle={d.description || undefined}
      rows={d.rows ?? []}
    />
  );
}
