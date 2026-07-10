/**
 * **Schema / ER table nodes** — the entity node of a data-model diagram, built
 * **entirely in userland** from the generic `composite` shape. There is no
 * `schema` template kind in the engine: a node's `shape` is a *resolver*
 * (`options.node.style.shape = (node) => CompositeShapeOption`), so this story
 * maps each node's data to a composite with a coloured **header** (icon + title)
 * over a **variable-length** list of field rows — a type-chip, the field name,
 * and an optional **PK / FK** badge. The card height is computed from the field
 * count, so a 3-field dimension and a 6-field fact table size themselves.
 *
 * This is the point of the composite primitive: a table node is just parts laid
 * out from data — the type→colour map, PK/FK semantics, and header colours all
 * live *here*, not in the core template compiler.
 *
 * Icons show both routes on the composite `icon` part: the **header** uses a
 * Lucide icon via `svg-url` (iconify) — no helper needed — and the row
 * **type-chips** use plain glyph labels. Edges connect **table-to-table**
 * (dashed orthogonal) on the card silhouette; ELK's `layered` keeps the star
 * schema tidy; drag any table to rearrange.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour, type CompositePart } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  ThemeBehaviour,
  type CompositeShapeOption,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { ElkLayout, type ElkDirection } from '@invana/graph-layout-elkjs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/Graph/Nodes/Schema Table' };
export default meta;
type Story = StoryObj;

export const SchemaTable: Story = {
  render: () => createContainer({ id: 'graph-schema-table' }),

  play: async ({ canvasElement }) => {
    // ── The schema each node carries ─────────────────────────────────────
    interface Field {
      name: string;
      type: string;
      key?: 'PK' | 'FK';
    }
    interface TableData {
      label: string;
      icon: string; // iconify id, e.g. 'lucide/table'
      header: number; // header band colour
      fields: Field[];
    }

    // ── Data — a star schema: three dimensions + one fact table ──────────
    const nodes: GraphNode[] = [
      {
        id: 'dim_customer',
        data: {
          label: 'Dim_Customer',
          icon: 'lucide/users',
          header: 0x2563eb,
          fields: [
            { name: 'CustomerId', type: 'integer', key: 'PK' },
            { name: 'CustomerName', type: 'string' },
            { name: 'Phone', type: 'string' },
            { name: 'RegistrationDate', type: 'date' },
            { name: 'TotalCustomers', type: 'integer' },
            { name: 'NorthAmerica', type: 'boolean' },
          ],
        } satisfies TableData,
      },
      {
        id: 'dim_date',
        data: {
          label: 'Dim_Date',
          icon: 'lucide/calendar',
          header: 0x2563eb,
          fields: [
            { name: 'DateId', type: 'integer', key: 'PK' },
            { name: 'Date', type: 'date' },
            { name: 'Month', type: 'string' },
            { name: 'Year', type: 'integer' },
          ],
        } satisfies TableData,
      },
      {
        id: 'dim_supplier',
        data: {
          label: 'Dim_Supplier',
          icon: 'lucide/truck',
          header: 0x2563eb,
          fields: [
            { name: 'SupplierId', type: 'integer', key: 'PK' },
            { name: 'CompanyName', type: 'string' },
            { name: 'Phone', type: 'string' },
          ],
        } satisfies TableData,
      },
      {
        id: 'fact_order',
        data: {
          label: 'Fact_Customer_Order',
          icon: 'lucide/sigma',
          header: 0x7c3aed,
          fields: [
            { name: 'OrderId', type: 'integer', key: 'PK' },
            { name: 'CustomerId', type: 'integer', key: 'FK' },
            { name: 'DateId', type: 'integer', key: 'FK' },
            { name: 'SupplierId', type: 'integer', key: 'FK' },
            { name: 'Quantity', type: 'integer' },
            { name: 'Profit', type: 'number' },
          ],
        } satisfies TableData,
      },
    ];
    const edges: GraphEdge[] = [
      { id: 'f-customer', source: 'fact_order', target: 'dim_customer' },
      { id: 'f-date', source: 'fact_order', target: 'dim_date' },
      { id: 'f-supplier', source: 'fact_order', target: 'dim_supplier' },
    ];

    // ── The userland resolver: node data → a composite table card ─────────
    // Colour-coded type chip per field type (semantic, like syntax highlight).
    const TYPE_CHIP: Record<string, { char: string; color: number }> = {
      string: { char: 'Abc', color: 0x3b82f6 },
      integer: { char: '123', color: 0x22c55e },
      number: { char: '#', color: 0x22c55e },
      date: { char: '◷', color: 0xf59e0b },
      boolean: { char: '01', color: 0xa855f7 },
    };
    const chipFor = (t: string) => TYPE_CHIP[t.toLowerCase()] ?? { char: '•', color: 0x64748b };

    const WIDTH = 210;
    const PAD = 12;
    const RADIUS = 8;
    const HEADER_H = 38;
    const ROW_H = 26;
    const BODY_BG = 0x0f172a;
    const NAME_COLOR = 0xe2e8f0;

    // Build the composite spec for one table node. Pure data → parts.
    const buildTable = (node: GraphNode): CompositeShapeOption => {
      const d = node.data as TableData;
      const height = HEADER_H + d.fields.length * ROW_H + 6;
      const parts: CompositePart[] = [];

      // Header band — a rect with only its TOP corners rounded (a full rounded
      // rect + a square rect over the bottom `RADIUS` strip).
      parts.push({ part: 'rect', x: 0, y: 0, width: WIDTH, height: HEADER_H, cornerRadius: RADIUS, fill: d.header });
      parts.push({ part: 'rect', x: 0, y: HEADER_H - RADIUS, width: WIDTH, height: RADIUS, fill: d.header });

      // Header icon — a Lucide glyph via the `icon` part's `svg-url` (iconify).
      const iconBox = 20;
      parts.push({
        part: 'icon',
        x: PAD,
        y: (HEADER_H - iconBox) / 2,
        size: iconBox,
        icon: { kind: 'svg-url', url: `https://api.iconify.design/${d.icon}.svg`, color: 0xffffff, strokeWidth: 2 },
      });

      // Header title.
      const titleX = PAD + iconBox + 8;
      parts.push({
        part: 'label',
        x: titleX,
        y: (HEADER_H - 14) / 2,
        text: d.label,
        fontSize: 14,
        fontWeight: 700,
        fill: 0xffffff,
        maxWidth: WIDTH - titleX - PAD,
        maxLines: 1,
        overflow: 'ellipsis',
      });

      // One row per field: type-chip + name + optional PK/FK badge.
      d.fields.forEach((f, i) => {
        const rowY = HEADER_H + i * ROW_H;
        const chipBox = 16;
        const chipY = rowY + (ROW_H - chipBox) / 2;
        const chip = chipFor(f.type);
        parts.push({ part: 'rect', x: PAD, y: chipY, width: chipBox, height: chipBox, cornerRadius: 3, fill: chip.color });
        parts.push({
          part: 'label',
          x: PAD + chipBox / 2,
          y: chipY + (chipBox - 8) / 2,
          text: chip.char,
          anchor: 'center',
          fontSize: 8,
          fontWeight: 700,
          fill: 0xffffff,
        });

        const nameX = PAD + chipBox + 8;
        parts.push({
          part: 'label',
          x: nameX,
          y: rowY + (ROW_H - 13) / 2,
          text: f.name,
          fontSize: 13,
          fill: NAME_COLOR,
          maxWidth: WIDTH - nameX - PAD - (f.key ? 26 : 0),
          maxLines: 1,
          overflow: 'ellipsis',
        });

        if (f.key) {
          parts.push({
            part: 'label',
            x: WIDTH - PAD,
            y: rowY + (ROW_H - 10) / 2,
            text: f.key,
            anchor: 'right',
            fontSize: 10,
            fontWeight: 700,
            fill: f.key === 'FK' ? 0x60a5fa : 0x94a3b8,
          });
        }
      });

      return { kind: 'composite', width: WIDTH, height, cornerRadius: RADIUS, fill: BODY_BG, stroke: { color: 0x334155, width: 1 }, parts };
    };

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-schema-table')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    // The `shape` resolver is non-serialisable wiring → it rides on the layer
    // constructor, not the JSON config. `bgStrokeWidth: 0` stops the base node
    // border from framing the card (the composite carries its own stroke).
    canvas.layers.add(
      new GraphLayer({
        id: 'graph',
        options: {
          initData: { nodes, edges },
          node: { style: { shape: buildTable, bgStrokeWidth: 0 } },
          edge: {
            style: {
              strokeColor: 0x64748b,
              strokeWidth: 1.4,
              strokeDashArray: [5, 4],
              arrowTargetShape: 'none',
              shape: { pathType: 'orth' },
            },
          },
        },
      }),
    );

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));

    const elkLayout = new ElkLayout({ id: 'layout', targetLayerId: 'graph' });
    canvas.layouts.add(elkLayout);

    const canvasOptions = {
      layers: {
        bg: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        theme: {
          enabled: true,
          mode: 'system' as const,
          light: { backgroundColor: '#f1f5f9', color: '#cbd5e1' },
          dark: { backgroundColor: '#0b1220', color: '#334155' },
        },
      },
      layouts: {
        layout: { algorithm: 'layered' as const, direction: 'RIGHT' as ElkDirection, nodeSpacing: 60, layerSpacing: 140, padding: 40 },
      },
      activeLayout: 'layout',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Fit once ELK settles each run.
    const graph = canvas.layers.get('graph') as GraphLayer;
    onStoryTeardown(
      elkLayout.events.on('end', ({ reason }) => {
        if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
      }),
    );

    // ── GUI — the ELK knobs with the largest visual effect ───────────────
    const gui = new GUI({ title: 'Schema Table — layout' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => elkLayout.stop());

    const applyLayout = (): void => canvas.update({ layouts: { layout: canvasOptions.layouts.layout } });
    gui.add(canvasOptions.layouts.layout, 'direction', ['UP', 'DOWN', 'LEFT', 'RIGHT']).onChange(applyLayout);
    gui.add(canvasOptions.layouts.layout, 'nodeSpacing', 20, 160, 5).onChange(applyLayout);
    gui.add(canvasOptions.layouts.layout, 'layerSpacing', 60, 260, 10).onChange(applyLayout);
  },
};
