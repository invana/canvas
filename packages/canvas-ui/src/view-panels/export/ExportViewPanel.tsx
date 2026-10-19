// ExportViewPanel — what leaves the board: an **Image** of it, or its **Data**.
//
// Image is the `ExportImagePanel` form over `useCanvasImageExport` — in view or
// the whole board, PNG or SVG, the background, the scale. Data is the drawn
// graph as one JSON file, `{ "nodes": [...], "edges": [...] }`, of the whole
// board or of the selected nodes and the edges between them: each node its `id`, `type`, `data` and `position`,
// each edge its `id`, `source`, `target`, `type` and `data` — what the elements
// are, not how they are drawn.
//
// Bare content, like every `view-panels/` surface — the board's rail opens it in
// a `FloatingPanel` (`BoardPanels`).

import { useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { GraphEdge, GraphLayer, GraphNode } from '@invana/graph';
import { useCanvasImageExport, useSelection } from '@invana/canvas-react';
import { Button, PropertyList, PropertyRow, SegmentedControl, cn } from '@invana/ui';
import { Download, ImageDown } from 'lucide-react';

import { ExportImagePanel, type ExportImagePanelValue } from '../../components';

export interface ExportViewPanelProps {
  /** The live canvas. */
  canvas: Canvas;
  /** GraphLayer the data comes from. Default `'graph'`. */
  layerId?: string;
  /** `ClickSelectBehaviour` the selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Image file name, without the extension. Default `board`. */
  filename?: string;
  /** Data file name. Default `exported-data.json`. */
  dataFilename?: string;
  /** The tab it opens on. Default `image`. */
  defaultKind?: 'image' | 'data';
  className?: string;
}

/** One exported node — what it is, not how it is drawn. */
export interface ExportedNode {
  id: string;
  type: string;
  data?: unknown;
  position?: { x: number; y: number };
}

/** One exported edge. */
export interface ExportedEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: unknown;
}

/** The data file: `{ nodes, edges }`. */
export interface ExportedData {
  nodes: ExportedNode[];
  edges: ExportedEdge[];
}

const IMAGE_DEFAULT: ExportImagePanelValue = { format: 'png', area: 'content', background: 'canvas', scale: 2, aspectRatio: 0 };
const AREAS = [
  { value: 'viewport' as const, label: 'In view' },
  { value: 'content' as const, label: 'Whole board' },
];
const FORMATS = [
  { value: 'png' as const, label: 'PNG' },
  { value: 'svg' as const, label: 'SVG' },
];

/**
 * The drawn graph as {@link ExportedData} — every visible node and edge, or only
 * the nodes in `nodeIds` and the edges between them.
 */
export function exportGraphData(layer: GraphLayer, nodeIds?: readonly string[]): ExportedData {
  const nodeSet = nodeIds ? new Set(nodeIds) : null;
  const nodes: ExportedNode[] = [];
  for (const n of layer.store.nodes() as Iterable<GraphNode>) {
    if (n.hidden || (nodeSet && !nodeSet.has(n.id))) continue;
    nodes.push({ id: n.id, type: n.type, ...(n.data !== undefined ? { data: n.data } : {}), ...(n.position ? { position: n.position } : {}) });
  }
  const kept = new Set(nodes.map((n) => n.id));
  const edges: ExportedEdge[] = [];
  for (const e of layer.store.edges() as Iterable<GraphEdge>) {
    if (e.hidden || !kept.has(e.source) || !kept.has(e.target)) continue;
    edges.push({ id: e.id, source: e.source, target: e.target, type: e.type ?? '', ...(e.data !== undefined ? { data: e.data } : {}) });
  }
  return { nodes, edges };
}

/** Save `data` as a JSON file. */
function saveJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** The board's Export: Image or Data, one save button each. */
export function ExportViewPanel({
  canvas,
  layerId = 'graph',
  clickSelectId = 'click-select',
  filename = 'board',
  dataFilename = 'exported-data.json',
  defaultKind = 'image',
  className,
}: ExportViewPanelProps) {
  const [kind, setKind] = useState<'image' | 'data'>(defaultKind);
  const [image, setImage] = useState<ExportImagePanelValue>(IMAGE_DEFAULT);
  const [scope, setScope] = useState<'board' | 'selection'>('board');
  const { download } = useCanvasImageExport(canvas);
  const selection = useSelection({ clickSelectId }, canvas);
  const layer = canvas.layers.get<GraphLayer>(layerId);

  const hasSelection = selection.selectedNodeIds.length > 0;
  const picked = scope === 'selection' && hasSelection ? 'selection' : 'board';
  const data = layer
    ? exportGraphData(layer, picked === 'selection' ? selection.selectedNodeIds : undefined)
    : { nodes: [], edges: [] };

  return (
    <div className={cn('flex flex-col gap-3 p-2', className)}>
      <SegmentedControl
        size="sm"
        aria-label="What to export"
        value={kind}
        onValueChange={(v) => setKind(v as 'image' | 'data')}
        options={[
          { value: 'image', label: 'Image' },
          { value: 'data', label: 'Data' },
        ]}
      />
      {kind === 'image' ? (
        <ExportImagePanel
          title={null}
          value={image}
          onChange={(patch) => setImage((v) => ({ ...v, ...patch }))}
          onSave={() =>
            void download({
              format: image.format,
              area: image.area,
              background: image.background,
              scale: image.scale,
              filename: `${filename}-${image.area === 'viewport' ? 'view' : 'board'}`,
            })
          }
          areas={AREAS}
          formats={FORMATS}
          saveIcon={ImageDown}
          saveLabel="Export image"
        />
      ) : (
        <>
          <SegmentedControl
            size="sm"
            aria-label="Which elements"
            value={picked}
            onValueChange={(v) => setScope(v as 'board' | 'selection')}
            options={[
              { value: 'board', label: 'Whole board' },
              { value: 'selection', label: 'Selection', disabled: !hasSelection },
            ]}
          />
          <PropertyList>
            <PropertyRow label="Nodes">{data.nodes.length.toLocaleString()}</PropertyRow>
            <PropertyRow label="Edges">{data.edges.length.toLocaleString()}</PropertyRow>
            <PropertyRow label="File">{dataFilename}</PropertyRow>
          </PropertyList>
          <Button size="sm" onClick={() => saveJson(data, dataFilename)} disabled={data.nodes.length === 0}>
            <Download /> Export data
          </Button>
        </>
      )}
    </div>
  );
}
