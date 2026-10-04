import { useEffect, useMemo, useState } from 'react';
import { BlockPanel, type ActionContext, type PanelRendererProps } from '@invana/boards';
import type { ClickInspectBehaviour, ClickSelectBehaviour, GraphEdge, GraphLayer, GraphNode } from '@invana/graph';

import { useBoardCanvas } from '../provider';
import type { CanvasTableColumn, CanvasTablePanelOptions } from '../types';

const DEFAULT_COLUMNS: CanvasTableColumn[] = [
  { key: 'id', label: 'Id', mono: true },
  { key: 'type', label: 'Type' },
  { key: 'degree', label: 'Degree', align: 'right' },
];
const DEFAULT_LIMIT = 25;

/** Data keys tried, in order, for a node's `label` column. */
const LABEL_KEYS = ['label', 'name', 'title'];

type Snapshot = { nodes: GraphNode[]; edges: GraphEdge[] };
type CellValue = string | number | null;

/** One column's value for one node. */
function cellOf(node: GraphNode, key: string, degree: Map<string, number>): CellValue {
  const data = (node.data ?? {}) as Record<string, unknown>;
  if (key === 'id') return node.id;
  if (key === 'type') return node.type;
  if (key === 'degree') return degree.get(node.id) ?? 0;
  if (key === 'label') {
    for (const k of LABEL_KEYS) if (typeof data[k] === 'string') return data[k] as string;
    return node.id;
  }
  if (key.startsWith('data.')) {
    const v = data[key.slice(5)];
    return typeof v === 'number' || typeof v === 'string' ? v : v == null ? null : JSON.stringify(v);
  }
  return null;
}

/**
 * The layer's nodes and edges, re-read off the store's change events — at most
 * once a frame, so a layout or a bulk load does not re-render the table per node.
 */
function useGraphSnapshot(layer: GraphLayer | undefined): Snapshot {
  const [snapshot, setSnapshot] = useState<Snapshot>({ nodes: [], edges: [] });
  const store = layer?.store;
  useEffect(() => {
    if (!store) {
      setSnapshot({ nodes: [], edges: [] });
      return;
    }
    let frame = 0;
    const recompute = (): void => setSnapshot({ nodes: [...store.nodes()], edges: [...store.edges()] });
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };
    recompute();
    const unsubs = [
      store.events.on('node:add', schedule),
      store.events.on('node:remove', schedule),
      store.events.on('node:update', schedule),
      store.events.on('edge:add', schedule),
      store.events.on('edge:remove', schedule),
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [store]);
  return snapshot;
}

/**
 * `kind: "canvas-table"` — a live table of a board canvas's nodes, drawn by the
 * kit's own `table` block so it reads like every other table on the board.
 *
 * Re-reads as the graph changes. Clicking a row selects that node on the canvas
 * (the `click-select` behaviour), points the canvas's inspector at it when the
 * canvas has `inspect: true`, and reports the board action `select` with the
 * node id as `itemId`.
 */
export function CanvasTablePanel({ panel, options, onAction, icons, gap }: PanelRendererProps<CanvasTablePanelOptions>) {
  const canvas = useBoardCanvas(options.canvasId);
  const layer = canvas?.layers.get<GraphLayer>(options.layerId ?? 'graph') ?? undefined;
  const { nodes, edges } = useGraphSnapshot(layer);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const columns = options.columns ?? DEFAULT_COLUMNS;
  const sortBy = options.sortBy ?? 'degree';
  const limit = options.limit ?? DEFAULT_LIMIT;

  const rows = useMemo(() => {
    const degree = new Map<string, number>();
    for (const e of edges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }
    const all = nodes.map((n) => {
      const row: Record<string, CellValue> = { __id: n.id };
      for (const c of columns) row[c.key] = cellOf(n, c.key, degree);
      if (!(sortBy in row)) row[sortBy] = cellOf(n, sortBy, degree);
      return row;
    });
    // Highest first; equal values keep the store's order (Array.sort is stable).
    all.sort((a, b) => {
      const x = a[sortBy];
      const y = b[sortBy];
      if (typeof x === 'number' && typeof y === 'number') return y - x;
      return String(y ?? '').localeCompare(String(x ?? ''));
    });
    return all;
  }, [nodes, edges, columns, sortBy]);

  if (!canvas) {
    return <p className="text-muted-foreground p-3 text-base">Waiting for the canvas…</p>;
  }

  const shown = showAll ? rows : rows.slice(0, limit);
  const tableOptions = {
    columns: columns.map(({ key, label, align, mono }) => ({ key, label, align, mono })),
    rows: shown,
    total: rows.length,
    noun: options.noun ?? 'nodes',
    rowKey: '__id',
    selected,
    ...(columns.some((c) => c.key === sortBy) ? { sort: { key: sortBy, dir: 'desc' as const } } : {}),
  };

  const handleAction = (actionId: string, ctx?: ActionContext): void => {
    if (actionId === 'open') {
      setShowAll(true);
      return;
    }
    if (actionId === 'select' && typeof ctx?.value === 'string') {
      const id = ctx.value;
      setSelected(id);
      canvas.behaviours.get<ClickSelectBehaviour>('click-select')?.select(id, 'shape');
      canvas.behaviours.get<ClickInspectBehaviour>('click-inspect')?.setTarget({ kind: 'node', id });
      onAction('select', { panelId: panel.id, itemId: id });
      return;
    }
    onAction(actionId, ctx);
  };

  return (
    <BlockPanel
      panel={{ ...panel, kind: 'table' }}
      options={tableOptions}
      onAction={handleAction}
      icons={icons}
      gap={gap}
    />
  );
}
