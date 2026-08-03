/**
 * **Schema table** built-in composite node type (`schemaTableCard` from
 * `@invana/graph`) — the ER entity node: a coloured header (Lucide icon + title)
 * over a **variable-length** field list (type chip + name + data type). The card
 * auto-sizes to the field count, `boundsOf` reports that size so layouts don't
 * overlap, and each row is an addressable sub-part (`hitId`).
 *
 * The card is the shared builder; this story feeds it data and wires the two
 * composite-specific interactions: whole-card hover (canonical `ring` decoration)
 * and per-row hover (`shape:partover` → `schemaTableCard(data, { hoverRow })`).
 * The full interactive editor lives in `canvas-react/usecases/Schema Table`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  TextResolutionLODBehaviour,
  schemaTableCard,
  type GraphEdge,
  type GraphNode,
  type SchemaTableData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/Schema Table' };
export default meta;
type Story = StoryObj;

export const SchemaTable: Story = {
  render: () => createContainer({ id: 'composite-schema-table' }),

  play: async ({ canvasElement }) => {
    // Two schema cards + one edge — enough to show the built-in card node type.
    const nodes: GraphNode[] = [
      { type: 'node',
        id: 'customer',
        position: { x: -220, y: 0 },
        data: {
          label: 'Dim_Customer',
          icon: 'lucide/users',
          header: 0x2563eb,
          fields: [
            { name: 'CustomerId', type: 'integer' },
            { name: 'CustomerName', type: 'string' },
            { name: 'Phone', type: 'string' },
            { name: 'RegisteredAt', type: 'date' },
          ],
        } satisfies SchemaTableData,
      },
      { type: 'node',
        id: 'order',
        position: { x: 220, y: 0 },
        data: {
          label: 'Fact_Order',
          icon: 'lucide/sigma',
          header: 0x7c3aed,
          fields: [
            { name: 'OrderId', type: 'integer' },
            { name: 'CustomerId', type: 'integer' },
            { name: 'Quantity', type: 'integer' },
            { name: 'Profit', type: 'number' },
          ],
        } satisfies SchemaTableData,
      },
    ];
    const edges: GraphEdge[] = [{ type: 'edge', id: 'e', source: 'order', target: 'customer' }];

    // Per-node hovered row, read by the builder to light up a row band.
    const hoverRow = new Map<string, number>();
    const buildTable = (node: GraphNode) => schemaTableCard(node.data as SchemaTableData, { hoverRow: hoverRow.get(node.id) ?? -1 });

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#composite-schema-table')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(
      new GraphLayer({
        id: 'graph',
        options: {
          initData: { nodes, edges },
          node: { style: { shape: buildTable, bgStrokeWidth: 0 } },
          edge: { style: { strokeColor: 0x64748b, strokeWidth: 1.4, strokeDashArray: [5, 4], arrowTargetShape: 'none', shape: { pathType: 'orth' } } },
        },
      }),
    );

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph', enabled: true }));

    await canvas.init({ container, autoResize: true });
    const graph = canvas.layers.get('graph') as GraphLayer;
    canvas.camera.fitContent(graph.getBounds(), 80);

    // Per-row hover via the composite's `hitId` sub-parts.
    const renderer = graph.getRenderer()!;
    const setRow = (id: string, idx: number): void => {
      if ((hoverRow.get(id) ?? -1) === idx) return;
      if (idx < 0) hoverRow.delete(id);
      else hoverRow.set(id, idx);
      graph.redraw();
    };
    const onPartOver = (e: { id: string; partId: string }) => setRow(e.id, Number(e.partId));
    const onPartOut = (e: { id: string }) => setRow(e.id, -1);
    renderer.events.on('shape:partover', onPartOver);
    renderer.events.on('shape:partout', onPartOut);
    onStoryTeardown(() => renderer.events.off('shape:partover', onPartOver));
    onStoryTeardown(() => renderer.events.off('shape:partout', onPartOut));
  },
};
