/**
 * The airways global model as `<SchemaBoard>` draws it — shared by the schema
 * board's stories and the GlobalModel demo.
 *
 * | Dataset | Board |
 * |---|---|
 * | a `model` node | a `SCHEMA_FRAME_TYPE` frame, `hue` its slot in model order |
 * | a node type | a `SchemaTypeData` in its model's frame and hue; a property's stitch ids are its `tags` |
 * | `anchored` | the card's `badge` |
 * | an edge's kind, rule and match | the hover card's rows |
 */

import { SCHEMA_FRAME_TYPE } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import { airwaysGlobalModel } from '@invana/graph-datasets/usecase-demos';

interface RawProperty {
  name: string;
  type: string;
  identity?: boolean;
  stitches?: string[];
}
interface RawNode {
  id: string;
  type: string;
  parentId?: string;
  data: Record<string, unknown> & { model?: string; anchored?: boolean; properties?: RawProperty[] };
}
interface RawEdge {
  id: string;
  type: string;
  source: string;
  target: string;
  data: { kind: string; model?: string; description?: string; rule?: string; match?: string; partial?: boolean };
}

const RAW = airwaysGlobalModel as unknown as { nodes: RawNode[]; edges: RawEdge[] };

/** Every model framed, the stitches crossing frames. */
export function airwaysSchema(): GraphData {
  const models = RAW.nodes.filter((n) => n.type === 'model').map((n) => n.id);
  const hue = (model: string) => models.indexOf(model) + 1;
  const nodes = RAW.nodes.map((n) => {
    if (n.type === 'model') return { ...n, type: SCHEMA_FRAME_TYPE, data: { ...n.data, hue: hue(n.id) } };
    const { anchored, properties = [], ...rest } = n.data;
    return {
      ...n,
      data: {
        ...rest,
        frame: n.data.model,
        hue: hue(n.data.model ?? ''),
        ...(anchored ? { badge: 'anchored' } : {}),
        properties: properties.map(({ stitches, ...p }) => ({ ...p, ...(stitches ? { tags: stitches } : {}) })),
      },
    };
  });
  const edges = RAW.edges.map((e) => ({
    ...e,
    data: {
      kind: e.data.kind,
      description: e.data.description,
      rows: [
        { label: 'kind', value: e.data.kind === 'edge' ? `${e.data.model} edge type` : e.data.kind },
        ...(e.data.rule ? [{ label: 'rule', value: e.data.rule, mono: true }] : []),
        ...(e.data.match ? [{ label: 'match', value: e.data.partial ? `${e.data.match}, partial` : e.data.match }] : []),
      ],
    },
  }));
  return { nodes, edges } as unknown as GraphData;
}

/** One model's types and its own edges, with no frame — a schema on its own. */
export function oneSchema(model = 'NewsArticles'): GraphData {
  const all = airwaysSchema();
  const nodes = all.nodes
    .filter((n) => n.parentId === model)
    .map(({ parentId: _p, ...n }) => ({ ...n, data: { ...(n.data as object), frame: undefined } }));
  const ids = new Set(nodes.map((n) => n.id));
  return { nodes, edges: all.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) } as GraphData;
}

/** The frame (model) a node sits in, or `null`. */
export function frameOf(data: GraphData, id: string): string | null {
  return data.nodes.find((n) => n.id === id)?.parentId ?? null;
}
